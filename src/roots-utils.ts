import fs from 'fs/promises';
import path from 'path';
import type { Root } from '@modelcontextprotocol/sdk/types.js';
import { normalizePath, expandHome } from './path-utils.js';

/**
 * Validates and normalizes root directory URIs to absolute paths.
 * Filters out invalid paths and ensures all returned paths are accessible directories.
 *
 * @param requestedRoots - Array of root specifications with URI and optional name
 * @returns Promise resolving to array of validated directory paths
 */
export async function getValidRootDirectories(requestedRoots: readonly Root[]): Promise<string[]> {
  const validDirectories: string[] = [];

  for (const root of requestedRoots) {
    try {
      // Extract path from URI - handle both file:// URIs and plain paths
      let rootPath = root.uri;
      if (rootPath.startsWith('file://')) {
        rootPath = rootPath.substring(7); // Remove 'file://' prefix
        // Handle Windows drive letters in file URLs (file:///C:/path)
        if (
          process.platform === 'win32' &&
          rootPath.startsWith('/') &&
          rootPath.charAt(2) === ':'
        ) {
          rootPath = rootPath.substring(1); // Remove leading slash for Windows paths
        }
      }

      // Expand home directory and normalize path
      const expandedPath = expandHome(rootPath);
      const absolutePath = path.isAbsolute(expandedPath)
        ? expandedPath
        : path.resolve(process.cwd(), expandedPath);

      // Resolve symlinks and normalize
      const resolvedPath = await fs.realpath(absolutePath);
      const normalizedPath = normalizePath(resolvedPath);

      // Verify it's actually a directory
      const stats = await fs.stat(normalizedPath);
      if (stats.isDirectory()) {
        // Avoid duplicates
        if (!validDirectories.includes(normalizedPath)) {
          validDirectories.push(normalizedPath);
        }
      }
    } catch (error) {
      // Skip invalid roots - they might be files, non-existent paths, or permission issues
      // We log this for debugging but don't throw to allow partial success
      console.error(
        `Skipping invalid root ${root.uri}:`,
        error instanceof Error ? error.message : String(error)
      );
    }
  }

  return validDirectories;
}
