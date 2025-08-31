import path from "path";

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

  return allowedDirectories.some(allowedDir => {
    const normalizedAllowedDir = path.resolve(allowedDir);
    
    // Check if the requested path is the same as or within the allowed directory
    const relativePath = path.relative(normalizedAllowedDir, normalizedRequestedPath);
    
    // Path is valid if:
    // 1. relative path doesn't start with '..' (not going up from allowed dir)
    // 2. relative path doesn't start with path separator (absolute path outside)
    return !relativePath.startsWith('..') && !path.isAbsolute(relativePath);
  });
}