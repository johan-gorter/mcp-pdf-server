import fs from 'fs/promises';
import path from 'path';
import { normalizePath, expandHome } from './path-utils.js';
import { isPathWithinAllowedDirectories } from './path-validation.js';

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
  const absolute = path.isAbsolute(expandedPath)
    ? path.resolve(expandedPath)
    : path.resolve(process.cwd(), expandedPath);

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
        return normalizedRequested;
      } catch (parentError: unknown) {
        if (parentError instanceof Error && 'code' in parentError && parentError.code === 'ENOENT') {
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
    // Lazy load pdf-parse to avoid running its debug code on module load
    const PDFParse = (await import('pdf-parse')).default;
    
    const pdfBuffer = await fs.readFile(filePath);
    const data = await PDFParse(pdfBuffer);

    let text = data.text;

    if (maxChars && maxChars > 0 && text.length > maxChars) {
      text = text.substring(0, maxChars) + '... [truncated]';
    }

    return text;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to extract text from PDF: ${error.message}`);
    }
    throw new Error('Failed to extract text from PDF: Unknown error');
  }
}
