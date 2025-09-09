import fs from 'fs/promises';
import path from 'path';
import { normalizePath, expandHome } from './path-utils.js';
import {
  isPathWithinAllowedDirectories,
  checkForHardLinkVulnerability,
} from './path-validation.js';

// Global allowed directories - set by the main module
let allowedDirectories: string[] = [];

// Function to set allowed directories from the main module
export function setAllowedDirectories(directories: string[]): void {
  allowedDirectories = [...directories];
}

// Function to get current allowed directories
export function getAllowedDirectories(): string[] {
  return [...allowedDirectories];
}

// Security & Validation Functions
export async function validatePath(requestedPath: string): Promise<string> {
  const expandedPath = expandHome(requestedPath);

  let absolute: string;
  if (path.isAbsolute(expandedPath)) {
    absolute = path.resolve(expandedPath);
  } else {
    // For relative paths, try to resolve them within each allowed directory
    // This allows relative paths like "examples/file.pdf" to work within allowed dirs
    let resolvedPath: string | null = null;

    for (const allowedDir of allowedDirectories) {
      const candidatePath = path.resolve(allowedDir, expandedPath);
      const normalizedCandidate = normalizePath(candidatePath);

      // Check if this candidate path is within the allowed directory
      if (isPathWithinAllowedDirectories(normalizedCandidate, [allowedDir])) {
        resolvedPath = candidatePath;
        break;
      }
    }

    if (!resolvedPath) {
      throw new Error(
        `Access denied - relative path "${requestedPath}" could not be resolved within any allowed directory: ${allowedDirectories.join(', ')}`
      );
    }

    absolute = resolvedPath;
  }

  const normalizedRequested = normalizePath(absolute);

  // Security: Check if path is within allowed directories before any file operations
  const isAllowed = isPathWithinAllowedDirectories(normalizedRequested, allowedDirectories);
  if (!isAllowed) {
    throw new Error(
      `Access denied - path outside allowed directories: ${absolute} not in ${allowedDirectories.join(', ')}`
    );
  }

  // Security: Handle symlinks by checking their real path to prevent symlink attacks
  // This prevents attackers from creating symlinks that point outside allowed directories
  try {
    const realPath = await fs.realpath(absolute);
    const normalizedReal = normalizePath(realPath);
    if (!isPathWithinAllowedDirectories(normalizedReal, allowedDirectories)) {
      throw new Error(`Access denied - symlink target outside allowed directories: ${realPath}`);
    }

    // Security: Check for hard link vulnerabilities
    await checkForHardLinkVulnerability(normalizedReal, allowedDirectories);

    return normalizedReal;
  } catch (error: unknown) {
    // If realpath fails with ENOENT, the file doesn't exist yet
    // Check if the parent directory is valid and return the normalized path
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      const parentDir = path.dirname(absolute);
      try {
        const realParentPath = await fs.realpath(parentDir);
        const normalizedParent = normalizePath(realParentPath);
        if (!isPathWithinAllowedDirectories(normalizedParent, allowedDirectories)) {
          throw new Error(
            `Access denied - parent directory outside allowed directories: ${realParentPath}`
          );
        }

        // Security: Check parent directory for hard link vulnerabilities too
        await checkForHardLinkVulnerability(normalizedParent, allowedDirectories);

        return normalizedRequested;
      } catch (parentError: unknown) {
        if (
          parentError instanceof Error &&
          'code' in parentError &&
          parentError.code === 'ENOENT'
        ) {
          throw new Error('Parent directory does not exist');
        }
        throw parentError;
      }
    }
    throw error;
  }
}

// PDF Text Extraction Function
export async function extractPdfText(filePath: string, maxChars?: number): Promise<string> {
  try {
    // Security: Re-validate the path before file access to prevent TOCTOU attacks
    // This ensures the file path is still valid even if it changed since initial validation
    const revalidatedPath = await validatePath(filePath);

    const { extractText } = await import('unpdf');

    const pdfBuffer = await fs.readFile(revalidatedPath);
    // Convert Buffer to Uint8Array as required by unpdf
    const uint8Array = new Uint8Array(pdfBuffer);
    const { text } = await extractText(uint8Array);

    // unpdf returns an array of strings (one per page), so join them
    let extractedText = Array.isArray(text) ? text.join('\n\n') : text;

    if (maxChars && maxChars > 0 && extractedText.length > maxChars) {
      extractedText = extractedText.substring(0, maxChars) + '... [truncated]';
    }

    return extractedText;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to extract text from PDF: ${error.message}`);
    }
    throw new Error('Failed to extract text from PDF: Unknown error');
  }
}
