import path from "path";
import os from "os";

/**
 * Converts WSL paths to Windows format if needed, leaves other paths unchanged
 */
export function convertToWindowsPath(inputPath: string): string {
  // Check for WSL paths like /mnt/c/path or Unix-style Windows paths like /c/path
  if (process.platform === 'win32') {
    // WSL format: /mnt/c/path -> C:\path
    if (inputPath.startsWith('/mnt/') && inputPath.length > 5) {
      const driveLetter = inputPath.charAt(5);
      const restOfPath = inputPath.substring(6);
      if (driveLetter.match(/[a-zA-Z]/)) {
        return `${driveLetter.toUpperCase()}:${restOfPath.replace(/\//g, '\\')}`;
      }
    }
    
    // Unix-style Windows paths: /c/path -> C:\path
    if (inputPath.match(/^\/[a-zA-Z]\//) && inputPath.length > 3) {
      const driveLetter = inputPath.charAt(1);
      const restOfPath = inputPath.substring(2);
      return `${driveLetter.toUpperCase()}:${restOfPath.replace(/\//g, '\\')}`;
    }
    
    // Ensure backslashes for Windows paths
    if (inputPath.match(/^[a-zA-Z]:\//)) {
      return inputPath.replace(/\//g, '\\');
    }
  }
  
  return inputPath;
}

/**
 * Normalizes path separators and resolves relative components
 */
export function normalizePath(inputPath: string): string {
  // First convert WSL paths if on Windows
  const convertedPath = convertToWindowsPath(inputPath);
  
  // Normalize path separators and resolve .. and . components
  return path.normalize(convertedPath);
}

/**
 * Expands ~ to home directory
 */
export function expandHome(inputPath: string): string {
  if (inputPath.startsWith('~')) {
    return inputPath.replace('~', os.homedir());
  }
  return inputPath;
}