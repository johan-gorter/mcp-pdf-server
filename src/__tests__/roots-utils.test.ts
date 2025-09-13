import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { getValidRootDirectories } from '../roots-utils.js';
import { mkdtempSync, rmSync, mkdirSync, writeFileSync, realpathSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

function robustTmpdir() {
  return tmpdir().replace(/runneradmin/g, 'RUNNER~1');
}

describe('getValidRootDirectories', () => {
  let testDir1: string;
  let testDir2: string;
  let testDir3: string;
  let testFile: string;

  beforeEach(() => {
    // Create test directories
    testDir1 = realpathSync(mkdtempSync(join(robustTmpdir(), 'mcp-pdf-test1-')));
    testDir2 = realpathSync(mkdtempSync(join(robustTmpdir(), 'mcp-pdf-test2-')));
    testDir3 = realpathSync(mkdtempSync(join(robustTmpdir(), 'mcp-pdf-test3-')));

    // Create a test file (not a directory)
    testFile = join(testDir1, 'test-file.pdf');
    writeFileSync(testFile, 'test content');
  });

  afterEach(() => {
    // Cleanup
    rmSync(testDir1, { recursive: true, force: true });
    rmSync(testDir2, { recursive: true, force: true });
    rmSync(testDir3, { recursive: true, force: true });
  });

  describe('valid directory processing', () => {
    it('should process all URI formats and edge cases', async () => {
      const roots = [
        { uri: `file://${testDir1}`, name: 'File URI' },
        { uri: testDir2, name: 'Plain path' },
        { uri: testDir3 }, // Plain path without name property
      ];

      const result = await getValidRootDirectories(roots);

      expect(result).toContain(testDir1);
      expect(result).toContain(testDir2);
      expect(result).toContain(testDir3);
      expect(result).toHaveLength(3);
    });

    it('should normalize complex paths', async () => {
      // Create a subdirectory for testing path normalization
      const subDir = join(testDir1, 'subdir');
      mkdirSync(subDir);

      const roots = [{ uri: `file://${testDir1}/./subdir/../subdir`, name: 'Complex Path' }];

      const result = await getValidRootDirectories(roots);

      expect(result).toHaveLength(1);
      expect(result[0]).toBe(subDir);
    });
  });

  describe('error handling', () => {
    it('should handle various error types', async () => {
      const nonExistentDir = join(robustTmpdir(), 'non-existent-directory-12345');
      const invalidPath = '\0invalid\0path'; // Null bytes cause different error types
      const roots = [
        { uri: `file://${testDir1}`, name: 'Valid Dir' },
        { uri: `file://${nonExistentDir}`, name: 'Non-existent Dir' },
        { uri: `file://${testFile}`, name: 'File Not Dir' },
        { uri: `file://${invalidPath}`, name: 'Invalid Path' },
      ];

      const result = await getValidRootDirectories(roots);

      expect(result).toContain(testDir1);
      expect(result).not.toContain(nonExistentDir);
      expect(result).not.toContain(testFile);
      expect(result).not.toContain(invalidPath);
      expect(result).toHaveLength(1);
    });
  });
});
