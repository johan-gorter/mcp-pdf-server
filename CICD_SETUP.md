# GitHub CI/CD Setup Summary

This document outlines the complete GitHub Actions CI/CD setup that has been added to the MCP PDF Server project.

## Overview

The project now includes a comprehensive GitHub Actions setup that follows industry best practices and patterns used by the [@modelcontextprotocol/servers](https://github.com/modelcontextprotocol/servers) repository.

## Files Added

### GitHub Actions Workflows

1. **`.github/workflows/ci.yml`** - Continuous Integration
   - Runs on push/PR to main/develop branches
   - Tests on Node.js 18.x, 20.x, 22.x
   - Tests on Ubuntu, Windows, macOS
   - Includes linting, formatting, type checking, and testing
   - Uploads test coverage to Codecov

2. **`.github/workflows/release.yml`** - Automated Releases
   - Triggers on version tags (e.g., `v1.2.3`)
   - Validates package version matches tag
   - Creates GitHub releases with changelog
   - Publishes to npm with provenance
   - Builds and publishes Docker images to GHCR

3. **`.github/workflows/security.yml`** - Security Auditing
   - Runs security audits on push/PR
   - Weekly scheduled security checks
   - Generates vulnerability reports
   - Checks for outdated dependencies

### GitHub Configuration

4. **`.github/dependabot.yml`** - Dependency Management
   - Weekly updates for npm packages
   - Weekly updates for GitHub Actions
   - Weekly updates for Docker base images
   - Auto-assigns pull requests to maintainer

5. **`.github/ISSUE_TEMPLATE/bug_report.md`** - Bug Report Template
   - Structured bug reporting format
   - Environment information collection
   - Reproduction steps template

6. **`.github/ISSUE_TEMPLATE/feature_request.md`** - Feature Request Template
   - Structured feature request format
   - Solution and alternatives sections

7. **`.github/pull_request_template.md`** - Pull Request Template
   - Checklist for code quality
   - Change type classification
   - Testing requirements

### Project Configuration

8. **`Dockerfile`** - Container Build Configuration
   - Multi-stage build for optimization
   - Security best practices (non-root user)
   - Alpine Linux base for minimal size
   - Production-ready configuration

9. **`.dockerignore`** - Docker Build Optimization
   - Excludes unnecessary files from Docker context
   - Reduces build time and image size

10. **`CHANGELOG.md`** - Release Documentation
    - Follows Keep a Changelog format
    - Semantic versioning compliance
    - Template for future releases

11. **`CONTRIBUTING.md`** - Contributor Guidelines
    - Development setup instructions
    - Code quality standards
    - Release process documentation
    - Docker development guide

### Package.json Enhancements

12. **Version Management Scripts**
    - `npm run version:patch` - Patch releases (bug fixes)
    - `npm run version:minor` - Minor releases (new features)
    - `npm run version:major` - Major releases (breaking changes)
    - `npm run release:patch/minor/major` - Test + version + push

## Workflow Details

### Continuous Integration (CI)

**Triggers:**
- Push to main or develop branches
- Pull requests to main or develop branches

**Jobs:**
- **Test Matrix**: Tests across Node.js versions (18, 20, 22) and OS (Ubuntu, Windows, macOS)
- **Build Validation**: Ensures package builds correctly and can be installed
- **Code Quality**: Linting, formatting, and type checking
- **Test Coverage**: Uploads coverage reports to Codecov

### Release Automation

**Triggers:**
- Git tags matching `v*` pattern (e.g., `v1.2.3`)

**Process:**
1. Validates that package.json version matches the git tag
2. Runs full test suite
3. Extracts changelog section for the version
4. Creates GitHub release with changelog
5. Publishes package to npm with provenance
6. Builds multi-architecture Docker images (amd64, arm64)
7. Publishes Docker images to GitHub Container Registry

### Security Monitoring

**Triggers:**
- Push/PR to main or develop branches
- Weekly schedule (Mondays at 8:00 AM UTC)

**Features:**
- npm audit for vulnerability detection
- Dependency freshness checks
- Audit report generation and archival

## Required Secrets

To fully enable the CI/CD pipeline, the following GitHub secrets need to be configured:

1. **`NPM_TOKEN`** - npm authentication token for publishing packages
   - Create at: https://www.npmjs.com/settings/tokens
   - Needs "Publish" permission
   - Add to: Repository Settings > Secrets > Actions

2. **`GITHUB_TOKEN`** - Automatically provided by GitHub Actions
   - Used for creating releases and publishing Docker images
   - No configuration needed

## Release Process

### Automated Release (Recommended)

```bash
# For bug fixes (0.1.0 -> 0.1.1)
npm run release:patch

# For new features (0.1.0 -> 0.2.0)
npm run release:minor

# For breaking changes (0.1.0 -> 1.0.0)
npm run release:major
```

These commands will:
1. Run tests to ensure quality
2. Bump the version in package.json
3. Create a git commit and tag
4. Push to GitHub, triggering the release workflow

### Manual Release

```bash
# Update version manually
npm version patch|minor|major

# Push changes and tags
git push && git push --tags
```

## Docker Usage

### Using Pre-built Images

```bash
# Pull latest image
docker pull ghcr.io/johan-gorter/mcp-pdf-server:latest

# Run container
docker run -i --rm \
  --mount type=bind,src=/path/to/pdfs,dst=/pdfs \
  ghcr.io/johan-gorter/mcp-pdf-server:latest /pdfs
```

### Building Locally

```bash
# Build image
docker build -t mcp-pdf-server .

# Run locally built image
docker run -i --rm \
  --mount type=bind,src=/path/to/pdfs,dst=/pdfs \
  mcp-pdf-server /pdfs
```

## Badge Configuration

The README now includes status badges:
- CI build status
- Release workflow status
- npm package version
- Docker image tags

## Dependency Management

Dependabot is configured to:
- Check for dependency updates weekly
- Create pull requests for outdated packages
- Update GitHub Actions to latest versions
- Update Docker base images for security

## Best Practices Implemented

1. **Multi-platform Testing**: Ensures compatibility across different environments
2. **Semantic Versioning**: Automated version management with semantic meaning
3. **Security First**: Regular security audits and dependency updates
4. **Docker Multi-arch**: ARM64 and AMD64 support for broad deployment compatibility
5. **Provenance**: npm publishing with provenance for supply chain security
6. **Code Quality**: Automated linting, formatting, and type checking
7. **Documentation**: Comprehensive templates and guidelines for contributors

## Monitoring and Maintenance

- **CI/CD Status**: Monitor workflow status in GitHub Actions tab
- **Dependencies**: Dependabot will create PRs for updates
- **Security**: Weekly security audits with detailed reports
- **Releases**: Automated releases ensure consistency and reduce human error

## Next Steps

1. **Configure npm token**: Add NPM_TOKEN secret to enable package publishing
2. **Test release**: Create a test tag to verify the release workflow
3. **Monitor security**: Review weekly security audit reports
4. **Dependency updates**: Merge dependabot PRs regularly

This setup provides a robust, automated CI/CD pipeline that follows industry best practices and ensures high code quality, security, and reliable releases.