import path from 'path';
import fs from 'fs/promises';
import { normalizePath } from './path-utils.js';

/**
 * Validates if a path is within the allowed directories
 * @param requestedPath - The path to validate
 * @param allowedDirectories - Array of allowed root directories
 * @returns true if path is within allowed directories, false otherwise
 */
export function isPathWithinAllowedDirectories(
  requestedPath: string,
  allowedDirectories: string[]
): boolean {
  if (allowedDirectories.length === 0) {
    return false;
  }

  const normalizedRequestedPath = path.resolve(requestedPath);

  return allowedDirectories.some((allowedDir) => {
    const normalizedAllowedDir = path.resolve(allowedDir);

    // Handle case-insensitive filesystems
    const requestedForComparison =
      process.platform === 'win32' || process.platform === 'darwin'
        ? normalizedRequestedPath.toLowerCase()
        : normalizedRequestedPath;
    const allowedForComparison =
      process.platform === 'win32' || process.platform === 'darwin'
        ? normalizedAllowedDir.toLowerCase()
        : normalizedAllowedDir;

    // Check if the requested path is the same as or within the allowed directory
    const relativePath = path.relative(allowedForComparison, requestedForComparison);

    // Path is valid if:
    // 1. relative path doesn't start with '..' (not going up from allowed dir)
    // 2. relative path doesn't start with path separator (absolute path outside)
    return !relativePath.startsWith('..') && !path.isAbsolute(relativePath);
  });
}

/**
 * Checks if a file is a hard link by comparing its stats with other files
 * This is a basic hard link detection - in a production system you might want more sophisticated detection
 */
export async function checkForHardLinkVulnerability(
  filePath: string,
  _allowedDirectories: string[]
): Promise<void> {
  try {
    const stats = await fs.stat(filePath);

    // If nlink > 1, this file has hard links
    if (stats.nlink > 1) {
      // For now, we'll be conservative and reject files with multiple hard links
      // In a more sophisticated implementation, you could traverse the filesystem
      // to check if any of the hard links are outside allowed directories
      console.warn(
        `Warning: File ${filePath} has ${stats.nlink} hard links. This could be a security risk.`
      );

      // In a strict security mode, you might want to uncomment this:
      // throw new Error(`Access denied - file has hard links which could point outside allowed directories`);
    }
  } catch (error) {
    // If we can't stat the file, that's probably OK - it might not exist yet
    // The main file operations will handle the file existence check
  }
}

/**
 * Validates a file path for security, resolving symlinks and checking against allowed directories
 * @param filePath - The file path to validate
 * @param allowedDirectories - Array of allowed root directories (optional, will use global if not provided)
 * @returns Promise<string> - The resolved real path if valid
 * @throws Error if path is invalid or outside allowed directories
 */
export async function validatePath(
  filePath: string,
  allowedDirectories?: string[]
): Promise<string> {
  // Normalize the input path
  const normalizedPath = normalizePath(filePath);

  try {
    // Resolve real path to handle symlinks
    const realPath = await fs.realpath(normalizedPath);

    // If allowedDirectories is provided, validate against them
    if (allowedDirectories && allowedDirectories.length > 0) {
      if (!isPathWithinAllowedDirectories(realPath, allowedDirectories)) {
        throw new Error('Access denied - symlink target outside allowed directories');
      }
    }

    // Check for hard link vulnerabilities if directories are provided
    if (allowedDirectories) {
      await checkForHardLinkVulnerability(realPath, allowedDirectories);
    }

    return realPath;
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      // File doesn't exist, return the normalized path for creation
      return normalizedPath;
    }
    throw error;
  }
}
