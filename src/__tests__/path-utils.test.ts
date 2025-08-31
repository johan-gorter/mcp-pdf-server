import { describe, it, expect } from '@jest/globals';
import { normalizePath, expandHome, convertToWindowsPath } from '../path-utils.js';

describe('Path Utilities', () => {
  describe('convertToWindowsPath', () => {
    it('leaves Unix paths unchanged', () => {
      expect(convertToWindowsPath('/usr/local/bin'))
        .toBe('/usr/local/bin');
      expect(convertToWindowsPath('/home/user/some path'))
        .toBe('/home/user/some path');
    });

    it('converts WSL paths to Windows format', () => {
      expect(convertToWindowsPath('/mnt/c/documents/file.pdf'))
        .toBe('C:\\documents\\file.pdf');
    });

    it('converts Unix-style Windows paths to Windows format', () => {
      expect(convertToWindowsPath('/c/documents/file.pdf'))
        .toBe('C:\\documents\\file.pdf');
    });

    it('leaves Windows paths unchanged but ensures backslashes', () => {
      expect(convertToWindowsPath('C:/documents/file.pdf'))
        .toBe('C:\\documents\\file.pdf');
    });
  });

  describe('normalizePath', () => {
    it('normalizes relative path components', () => {
      const input = '/home/user/../documents/./file.pdf';
      const result = normalizePath(input);
      // On Windows, forward slashes get converted to backslashes
      const expected = process.platform === 'win32' 
        ? '\\home\\documents\\file.pdf' 
        : '/home/documents/file.pdf';
      expect(result).toBe(expected);
    });

    it('handles Windows-style paths', () => {
      const input = 'C:\\documents\\..\\file.pdf';
      const result = normalizePath(input);
      expect(result).toBe('C:\\file.pdf');
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