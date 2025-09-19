# Security Model

**DISCLAIMER:** This file has been written using Claude AI. I personally have not verified these claims.

This document outlines the security measures implemented in the MCP PDF Server to protect against various attack vectors.

## Security Features

### Path Validation and Access Control

The server implements a strict security model for file access:

- **Allowed Directories**: Only files within explicitly allowed directories can be accessed
- **Path Normalization**: All paths are normalized and resolved to prevent bypass attempts
- **Symlink Resolution**: Symbolic links are followed and their targets are validated
- **Parent Directory Validation**: When files don't exist, parent directories are validated

### Protection Against Common Attacks

#### 1. Path Traversal Attacks

- **Description**: Attempts to access files outside allowed directories using `../` sequences
- **Protection**: Path normalization and relative path validation prevent directory traversal
- **Examples Blocked**: `../../../etc/passwd`, `allowed/../forbidden/file.pdf`

#### 2. Symlink Attacks

- **Description**: Creating symbolic links that point to files outside allowed directories
- **Protection**: All symlinks are resolved using `fs.realpath()` and targets are validated
- **Examples Blocked**: Symlinks pointing from allowed directories to `/etc/passwd`

#### 3. TOCTOU (Time-of-Check-Time-of-Use) Attacks

- **Description**: Race conditions between path validation and file access
- **Protection**: Path re-validation occurs immediately before file operations
- **Implementation**: `extractPdfText()` re-validates paths before reading files

#### 4. Case Sensitivity Bypasses

- **Description**: Using different case variations to bypass path validation on case-insensitive filesystems
- **Protection**: Case-insensitive comparison on Windows and macOS platforms
- **Examples Blocked**: `/ALLOWED/file.pdf` when allowed directory is `/allowed/`

#### 5. Hard Link Attacks

- **Description**: Hard links that reference files outside allowed directories
- **Protection**: Detection of files with multiple hard links (nlink > 1)
- **Implementation**: Warnings logged for potential hard link vulnerabilities

#### 6. Encoding and Edge Cases

- **Description**: Various encoding tricks and edge cases to bypass validation
- **Protection**: Robust handling of null bytes, very long paths, and encoded characters

## Security Testing

The server includes comprehensive security tests covering:

- Path traversal attempts (obvious and encoded)
- Symlink attacks (direct and through parent directories)
- TOCTOU race condition simulation
- Hard link detection
- Edge cases (null bytes, long paths, case sensitivity)

Run security tests with:

```bash
npm test -- --testPathPattern=security.test.ts
```

## Security Considerations

### Known Limitations

1. **Hard Link Detection**: Current implementation only detects files with multiple hard links but doesn't traverse the filesystem to verify all link locations
2. **Performance**: Multiple validation steps may impact performance for legitimate file access
3. **Platform Differences**: Some protections are platform-specific (case sensitivity)

### Best Practices

1. **Minimal Allowed Directories**: Only specify directories that truly need to be accessible
2. **Regular Updates**: Keep dependencies updated to patch any underlying security issues
3. **Monitoring**: Monitor logs for hard link warnings and suspicious access patterns
4. **Principle of Least Privilege**: Run the server with minimal necessary permissions

## Reporting Security Issues

If you discover a security vulnerability, please report it privately to the maintainers rather than creating a public issue.

## Security Audit Trail

- **2025-01**: Initial security audit and vulnerability fixes
  - TOCTOU protection implemented
  - Case sensitivity handling added
  - Hard link detection added
  - Comprehensive security test suite created
