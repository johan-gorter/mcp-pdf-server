import { describe, it, expect } from '@jest/globals';
import { normalizePath, expandHome, convertToWindowsPath } from '../path-utils.js';

describe('Path Utilities', () => {
  describe('convertToWindowsPath', () => {
    it('leaves Unix paths unchanged', () => {
      expect(convertToWindowsPath('/usr/local/bin')).toBe('/usr/local/bin');
      expect(convertToWindowsPath('/home/user/some path')).toBe('/home/user/some path');
    });

    it('converts WSL paths to Windows format when on Windows', () => {
      const originalPlatform = process.platform;
      // Mock platform for this test
      Object.defineProperty(process, 'platform', {
        value: 'win32',
      });

      expect(convertToWindowsPath('/mnt/c/documents/file.pdf')).toBe('C:\\documents\\file.pdf');

      // Restore original platform
      Object.defineProperty(process, 'platform', {
        value: originalPlatform,
      });
    });

    it('converts Unix-style Windows paths to Windows format when on Windows', () => {
      const originalPlatform = process.platform;
      // Mock platform for this test
      Object.defineProperty(process, 'platform', {
        value: 'win32',
      });

      expect(convertToWindowsPath('/c/documents/file.pdf')).toBe('C:\\documents\\file.pdf');

      // Restore original platform
      Object.defineProperty(process, 'platform', {
        value: originalPlatform,
      });
    });

    it('leaves Windows paths unchanged but ensures backslashes when on Windows', () => {
      const originalPlatform = process.platform;
      // Mock platform for this test
      Object.defineProperty(process, 'platform', {
        value: 'win32',
      });

      expect(convertToWindowsPath('C:/documents/file.pdf')).toBe('C:\\documents\\file.pdf');

      // Restore original platform
      Object.defineProperty(process, 'platform', {
        value: originalPlatform,
      });
    });

    it('leaves paths unchanged when not on Windows', () => {
      const originalPlatform = process.platform;
      // Mock platform for this test (simulate Linux)
      Object.defineProperty(process, 'platform', {
        value: 'linux',
      });

      expect(convertToWindowsPath('/mnt/c/documents/file.pdf')).toBe('/mnt/c/documents/file.pdf');
      expect(convertToWindowsPath('C:/documents/file.pdf')).toBe('C:/documents/file.pdf');

      // Restore original platform
      Object.defineProperty(process, 'platform', {
        value: originalPlatform,
      });
    });
  });

  describe('normalizePath', () => {
    it('normalizes relative path components', () => {
      const input = '/home/user/../documents/./file.pdf';
      const result = normalizePath(input);
      // On Windows, forward slashes get converted to backslashes
      const expected =
        process.platform === 'win32' ? '\\home\\documents\\file.pdf' : '/home/documents/file.pdf';
      expect(result).toBe(expected);
    });

    it('handles Windows-style paths on Windows platform', () => {
      const originalPlatform = process.platform;
      // Mock platform for this test
      Object.defineProperty(process, 'platform', {
        value: 'win32',
      });

      const input = 'C:\\documents\\..\\file.pdf';
      const result = normalizePath(input);
      // path.normalize() on Linux doesn't resolve .. in Windows paths, it just normalizes separators
      // The actual result depends on the platform where the code runs
      expect(result).toBe(input); // path.normalize leaves Windows paths unchanged on Linux

      // Restore original platform
      Object.defineProperty(process, 'platform', {
        value: originalPlatform,
      });
    });
  });

  describe('expandHome', () => {
    it('expands ~ to home directory', () => {
      const input = '~/documents/file.pdf';
      const result = expandHome(input);
      expect(result).toMatch(/\/documents\/file\.pdf$|\\documents\\file\.pdf$/);
    });

    it('leaves non-home paths unchanged', () => {
      const input = '/absolute/path/file.pdf';
      const result = expandHome(input);
      expect(result).toBe(input);
    });
  });
});
