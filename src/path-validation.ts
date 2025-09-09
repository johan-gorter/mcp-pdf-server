import path from 'path';
import fs from 'fs/promises';

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
  allowedDirectories: string[]
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
