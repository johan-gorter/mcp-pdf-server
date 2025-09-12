# Platform-Specific Security Considerations

This document outlines important security considerations when using the MCP PDF Server on different operating systems.

## Overview

The MCP PDF Server implements security measures to prevent unauthorized file access through path validation, symlink detection, and directory traversal protection. However, the effectiveness of these measures varies between operating systems due to platform-specific filesystem behaviors.

## Windows Platform Considerations

### ⚠️ Known Security Limitations

**Current Status**: Windows users should exercise extra caution due to platform-specific security test failures.

#### Symlink Vulnerabilities

- **Issue**: Symlink attack prevention may not work correctly on Windows
- **Risk**: Malicious symlinks could potentially access files outside allowed directories
- **Impact**: HIGH - Could lead to unauthorized file access

#### Path Traversal Concerns

- **Issue**: Path normalization behaves differently on Windows vs Linux
- **Risk**: `..` components in paths may not be properly resolved
- **Impact**: MEDIUM - Could allow directory traversal attacks

### Windows Security Recommendations

1. **Restrict Allowed Directories**
   - Use the most restrictive directory permissions possible
   - Avoid allowing access to system directories or user profile folders
   - Example: `node dist/index.js C:\safe\pdf\directory`

2. **Validate PDF Sources**
   - Only process PDFs from trusted sources
   - Avoid processing PDFs with suspicious filenames or paths
   - Be cautious with PDFs containing non-ASCII characters in names

3. **Network Isolation**
   - Run the server in an isolated environment when possible
   - Use Windows Sandbox or containers for additional isolation
   - Limit network access for the server process

4. **Monitoring**
   - Enable file access auditing on critical directories
   - Monitor for unexpected file access patterns
   - Log all PDF processing activities

## Linux Platform Considerations

### ✅ Security Status: Good

Linux users benefit from robust security protections that have been thoroughly tested.

#### Verified Protections

- **Symlink Attack Prevention**: Properly blocks malicious symlinks
- **Path Traversal Protection**: Correctly handles `..` components
- **Directory Validation**: Enforces allowed directory restrictions

### Linux Security Recommendations

1. **Standard Practices**
   - Use dedicated user account with minimal privileges
   - Set appropriate file system permissions
   - Example: `node dist/index.js /opt/safe/pdfs`

2. **SELinux/AppArmor**
   - Consider using SELinux or AppArmor policies for additional confinement
   - Create custom profiles to restrict file system access

3. **Container Deployment**
   - Use Docker or Podman for process isolation
   - Mount only necessary directories as volumes
   - Run containers with non-root user

## Cross-Platform Best Practices

### 1. Input Validation

```bash
# Good: Specific, restricted directory
node dist/index.js /opt/pdfs/incoming

# Avoid: Broad access to user directories
node dist/index.js /home/user
```

### 2. Error Handling

- Monitor server logs for security-related errors
- Implement proper error boundaries in client applications
- Don't expose detailed error messages to end users

### 3. Regular Updates

- Keep the MCP PDF Server updated to latest version
- Monitor security advisories and apply patches promptly
- Update Node.js and dependencies regularly

### 4. Testing

- Test your specific deployment environment
- Verify that security controls work as expected
- Create test cases for your specific use patterns

## Development Considerations

### For Developers Using This Server

1. **Client-Side Validation**
   - Don't rely solely on server-side path validation
   - Implement additional checks in your MCP client
   - Sanitize file paths before sending to server

2. **Error Handling**
   - Implement proper error handling for denied access
   - Provide meaningful feedback to users about path restrictions
   - Log security events appropriately

3. **Testing**
   - Test your integration on your target deployment platform
   - Include security test cases in your test suite
   - Verify symlink and path traversal protections

## Reporting Security Issues

If you discover security vulnerabilities:

1. **Do NOT** create public GitHub issues for security problems
2. **Do** email security issues to the maintainer privately
3. **Include** detailed reproduction steps and impact assessment
4. **Allow** reasonable time for fixes before public disclosure

## Roadmap

### Planned Improvements

1. **Windows Security Fixes** (High Priority)
   - Fix symlink validation on Windows
   - Improve path normalization handling
   - Add Windows-specific security tests

2. **Enhanced Monitoring** (Medium Priority)
   - Add security event logging
   - Implement configurable security policies
   - Add metrics for security events

3. **Hardening Options** (Low Priority)
   - Optional strict mode for maximum security
   - Configurable security policy enforcement
   - Integration with system security frameworks

## Version History

- **v0.1.0**: Initial release with basic security measures
  - Linux: Full security protections functional
  - Windows: Security limitations identified, use with caution

---

**Last Updated**: September 12, 2025  
**Next Review**: When Windows security fixes are implemented
