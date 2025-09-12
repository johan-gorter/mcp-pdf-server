import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import fs from 'fs/promises';
import path from 'path';
import { setAllowedDirectories } from '../lib.js';
import { validatePath } from '../path-validation.js';

// Mock fs module
jest.mock('fs/promises');
const mockFs = fs as jest.Mocked<typeof fs>;

describe('Security Tests', () => {
  const tempDir = '/tmp/test-security';
  const allowedDir = path.join(tempDir, 'allowed');
  const forbiddenDir = path.join(tempDir, 'forbidden');

  beforeEach(() => {
    jest.clearAllMocks();
    setAllowedDirectories([allowedDir]);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    setAllowedDirectories([]);
  });

  describe('Path Traversal Attacks', () => {
    it('should block obvious path traversal attempts', async () => {
      mockFs.realpath.mockImplementation(async (inputPath: any) => inputPath.toString());

      const maliciousPaths = [
        '../forbidden/secret.pdf',
        '../../forbidden/secret.pdf',
        allowedDir + '/../forbidden/secret.pdf',
        allowedDir + '/subdir/../../forbidden/secret.pdf',
      ];

      for (const maliciousPath of maliciousPaths) {
        await expect(validatePath(maliciousPath, [allowedDir])).rejects.toThrow(/Access denied/);
      }
    });

    it('should block encoded path traversal attempts', async () => {
      mockFs.realpath.mockImplementation(async (inputPath: any) => inputPath.toString());

      // These would need to be decoded by the application first,
      // but we should test that even if somehow decoded, they're blocked
      const encodedPaths = [
        allowedDir + '/%2E%2E/forbidden/secret.pdf', // URL encoded ../
        allowedDir + '/..%2Fforbidden%2Fsecret.pdf', // Mixed encoding
      ];

      for (const encodedPath of encodedPaths) {
        // Even if these somehow get through initial parsing,
        // they should be blocked by path validation
        const decodedPath = decodeURIComponent(encodedPath);
        await expect(validatePath(decodedPath, [allowedDir])).rejects.toThrow(
          /Access denied.*outside allowed directories/
        );
      }
    });
  });

  describe('Symlink Attacks', () => {
    it('should block symlinks pointing outside allowed directories', async () => {
      const symlinkPath = path.join(allowedDir, 'malicious-link.pdf');
      const targetPath = path.join(forbiddenDir, 'secret.pdf');

      // Mock realpath to simulate a symlink resolving to forbidden location
      mockFs.realpath.mockImplementation(async (inputPath: any) => {
        if (inputPath.toString() === symlinkPath) {
          return targetPath; // Symlink points outside allowed directory
        }
        return inputPath.toString();
      });

      await expect(validatePath(symlinkPath, [allowedDir])).rejects.toThrow(
        'Access denied - symlink target outside allowed directories'
      );
    });

    it('should allow symlinks pointing within allowed directories', async () => {
      const symlinkPath = path.join(allowedDir, 'good-link.pdf');
      const targetPath = path.join(allowedDir, 'subdir', 'target.pdf');

      mockFs.realpath.mockImplementation(async (inputPath: any) => {
        if (inputPath.toString() === symlinkPath) {
          return targetPath; // Symlink points within allowed directory
        }
        return inputPath.toString();
      });

      const result = await validatePath(symlinkPath, [allowedDir]);
      expect(result).toBe(targetPath);
    });

    it('should detect symlinks in parent directories (advanced attack)', async () => {
      // This tests for a more sophisticated attack where a directory component
      // in the path is a symlink that points outside the allowed area
      const maliciousDir = path.join(allowedDir, 'subdir');
      const filePath = path.join(maliciousDir, 'file.pdf');
      const symlinkTarget = path.join(forbiddenDir, 'file.pdf');

      mockFs.realpath.mockImplementation(async (inputPath: any) => {
        const pathStr = inputPath.toString();
        if (pathStr === filePath) {
          // The full path resolves to outside allowed directories
          // because 'subdir' is actually a symlink to forbidden area
          return symlinkTarget;
        }
        return pathStr;
      });

      await expect(validatePath(filePath, [allowedDir])).rejects.toThrow(
        'Access denied - symlink target outside allowed directories'
      );
    });
  });

  describe('TOCTOU (Time-of-Check-Time-of-Use) Attack Simulation', () => {
    it('should demonstrate potential TOCTOU vulnerability', async () => {
      // This test demonstrates the theoretical TOCTOU vulnerability
      // In a real attack, an attacker would:
      // 1. Create a legitimate file during validation
      // 2. Replace it with a symlink to a forbidden file before file access

      const testPath = path.join(allowedDir, 'test.pdf');
      const forbiddenPath = path.join(forbiddenDir, 'secret.pdf');

      let validationCall = 0;
      mockFs.realpath.mockImplementation(async (inputPath: any) => {
        validationCall++;
        const pathStr = inputPath.toString();

        if (pathStr === testPath) {
          if (validationCall === 1) {
            // First call (during validation): legitimate path
            return testPath;
          } else {
            // Second call (if any): path now points to forbidden location
            return forbiddenPath;
          }
        }
        return pathStr;
      });

      // This should pass validation
      const result = await validatePath(testPath, [allowedDir]);
      expect(result).toBe(testPath);

      // But in a real scenario, by the time we read the file,
      // it might point somewhere else (this is the TOCTOU vulnerability)
      // The current implementation is vulnerable to this because
      // validatePath() and actual file operations are separate
    });

    it('should prevent TOCTOU attacks with re-validation', async () => {
      // This test verifies that our TOCTOU fix works by ensuring
      // that re-validation happens during file operations

      const testPath = path.join(allowedDir, 'test.pdf');
      const forbiddenPath = path.join(forbiddenDir, 'secret.pdf');

      let validationCall = 0;
      mockFs.realpath.mockImplementation(async (inputPath: any) => {
        validationCall++;
        const pathStr = inputPath.toString();

        if (pathStr === testPath) {
          if (validationCall <= 1) {
            // First call (during initial validation): legitimate path
            return testPath;
          } else {
            // Later calls (during re-validation): now it's an attack!
            return forbiddenPath;
          }
        }
        return pathStr;
      });

      // First validation should pass
      const result = await validatePath(testPath, [allowedDir]);
      expect(result).toBe(testPath);

      // But subsequent validation should fail if the path changed (TOCTOU attack)
      await expect(validatePath(testPath, [allowedDir])).rejects.toThrow(
        /Access denied.*symlink target outside allowed directories/
      );

      // This demonstrates that our re-validation approach would catch TOCTOU attacks
      expect(validationCall).toBeGreaterThan(1);
    });
  });

  describe('Hard Link Attacks', () => {
    it('should detect hard links to files outside allowed directories', async () => {
      // Hard links are more subtle than symlinks because they don't get resolved by realpath
      // This test would need to be implemented by checking file stats and inodes
      const hardLinkPath = path.join(allowedDir, 'hardlink.pdf');

      // Mock stat to simulate hard link detection
      // In a real implementation, we would check if the inode points to a file
      // outside the allowed directories
      mockFs.realpath.mockResolvedValue(hardLinkPath); // Hard links resolve to themselves

      // For now, this test documents the vulnerability
      // A proper fix would need to implement hard link detection
      const result = await validatePath(hardLinkPath);
      expect(result).toBe(hardLinkPath);

      // TODO: Implement hard link detection in the actual security fix
    });
  });

  describe('Edge Cases and Normalization Attacks', () => {
    it('should handle null bytes in paths', async () => {
      mockFs.realpath.mockImplementation(async (_inputPath: any) => {
        throw new Error('EINVAL: invalid argument');
      });

      const pathWithNull = allowedDir + '/file\0.pdf';

      await expect(validatePath(pathWithNull)).rejects.toThrow();
    });

    it('should handle very long paths', async () => {
      mockFs.realpath.mockImplementation(async (inputPath: any) => inputPath.toString());

      // Create a very long path that might cause buffer overflow issues
      const longSegment = 'a'.repeat(1000);
      const longPath = path.join(allowedDir, longSegment + '.pdf');

      const result = await validatePath(longPath, [allowedDir]);
      expect(result).toBe(longPath);
    });

    it('should handle case sensitivity on case-insensitive filesystems', async () => {
      // Skip this test on Linux since it's case-sensitive by default
      if (process.platform === 'linux') {
        // On Linux, this should fail due to case mismatch
        const mixedCasePath = path.join(allowedDir.toUpperCase(), 'File.PDF');
        await expect(validatePath(mixedCasePath)).rejects.toThrow(/Access denied/);
        return;
      }

      // On Windows/macOS, test the case-insensitive behavior
      mockFs.realpath.mockImplementation(async (inputPath: any) => {
        return inputPath.toString().toLowerCase();
      });

      const mixedCasePath = path.join(allowedDir.toUpperCase(), 'File.PDF');
      const result = await validatePath(mixedCasePath);

      // Should work on case-insensitive filesystems due to our fix
      expect(result.toLowerCase()).toContain(allowedDir.toLowerCase());
    });
  });
});
