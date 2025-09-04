import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import fs from 'fs/promises';
import path from 'path';
import { setAllowedDirectories, validatePath, extractPdfText } from '../lib.js';

// Mock fs module
jest.mock('fs/promises');
const mockFs = fs as jest.Mocked<typeof fs>;

// Mock unpdf
jest.mock('unpdf', () => {
  return {
    extractText: jest.fn().mockImplementation(() =>
      Promise.resolve({
        text: 'Sample PDF text content for testing',
      })
    ),
  };
});

describe('Lib Functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Set up allowed directories for tests
    const allowedDirs =
      process.platform === 'win32' ? ['C:\\Users\\test', 'C:\\temp'] : ['/home/user', '/tmp'];
    setAllowedDirectories(allowedDirs);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    // Clear allowed directories after tests
    setAllowedDirectories([]);
  });

  describe('validatePath', () => {
    beforeEach(() => {
      mockFs.realpath.mockImplementation(async (path: any) => path.toString());
    });

    it('validates allowed paths', async () => {
      const testPath =
        process.platform === 'win32' ? 'C:\\Users\\test\\file.pdf' : '/home/user/file.pdf';
      const result = await validatePath(testPath);
      expect(result).toBe(testPath);
    });

    it('rejects disallowed paths', async () => {
      const testPath =
        process.platform === 'win32' ? 'C:\\Windows\\System32\\file.pdf' : '/etc/passwd.pdf';
      await expect(validatePath(testPath)).rejects.toThrow(
        'Access denied - path outside allowed directories'
      );
    });

    it('handles non-existent files by checking parent directory', async () => {
      const newFilePath =
        process.platform === 'win32' ? 'C:\\Users\\test\\newfile.pdf' : '/home/user/newfile.pdf';
      const parentPath = process.platform === 'win32' ? 'C:\\Users\\test' : '/home/user';

      // Create an error with the ENOENT code that the implementation checks for
      const enoentError = new Error('ENOENT') as NodeJS.ErrnoException;
      enoentError.code = 'ENOENT';

      mockFs.realpath.mockRejectedValueOnce(enoentError).mockResolvedValueOnce(parentPath);

      const result = await validatePath(newFilePath);
      expect(result).toBe(path.resolve(newFilePath));
    });
  });

  describe('extractPdfText', () => {
    beforeEach(() => {
      mockFs.readFile.mockResolvedValue(Buffer.from('mock pdf content'));
    });

    it('extracts text from PDF file', async () => {
      const result = await extractPdfText('/test/file.pdf');
      expect(result).toBe('Sample PDF text content for testing');
      expect(mockFs.readFile).toHaveBeenCalledWith('/test/file.pdf');
    });

    it('limits text to maxChars when specified', async () => {
      const result = await extractPdfText('/test/file.pdf', 10);
      expect(result).toBe('Sample PDF... [truncated]');
    });

    it('returns full text when maxChars is not specified', async () => {
      const result = await extractPdfText('/test/file.pdf');
      expect(result).toBe('Sample PDF text content for testing');
    });

    it('handles PDF parsing errors', async () => {
      const { extractText } = await import('unpdf');
      (extractText as jest.MockedFunction<typeof extractText>).mockRejectedValueOnce(
        new Error('Invalid PDF')
      );

      await expect(extractPdfText('/test/invalid.pdf')).rejects.toThrow(
        'Failed to extract text from PDF: Invalid PDF'
      );
    });
  });
});
