# MCP PDF Server Development Instructions

**ALWAYS follow these instructions first and fallback to search or bash commands only when you encounter unexpected information that does not match the info here.**

MCP PDF Server is a TypeScript Node.js application that implements the Model Context Protocol (MCP) for PDF text extraction. It runs as a stdio-based server that communicates with MCP clients like Claude Desktop to provide PDF text extraction capabilities.

## Quick Setup and Build

Always start with these exact commands in order:

```bash
# Install dependencies - takes ~16 seconds
npm install

# Build TypeScript to JavaScript - takes ~2 seconds, NEVER CANCEL
npm run build

# Run tests - takes ~5-8 seconds, NEVER CANCEL
npm test
```

## Running the Server

```bash
# Run server with allowed directory (required)
node dist/index.js /path/to/allowed/directory

# Example with temporary directory
mkdir -p /tmp/pdfs
node dist/index.js /tmp/pdfs

# Development mode (builds and runs)
npm run dev

# Production mode
npm run start /path/to/allowed/directory
```

**IMPORTANT**: The server requires at least one allowed directory argument or it will not start. The server communicates via stdio (stdin/stdout) using the MCP protocol.

## Development Commands

### Build and Type Checking

```bash
# Build - takes ~2 seconds, NEVER CANCEL
npm run build

# Build in watch mode (for development)
npm run watch

# Type check without building - takes ~3 seconds
npm run type-check

# Clean build artifacts
npm run clean
```

### Testing

```bash
# Run all tests - takes ~5-8 seconds, NEVER CANCEL, set timeout to 30+ seconds
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage - takes ~8 seconds, NEVER CANCEL, set timeout to 30+ seconds
npm run test:coverage
```

### Code Quality

```bash
# Lint code - takes ~2 seconds
npm run lint

# Fix linting issues automatically
npm run lint:fix

# Format code with Prettier - takes ~1 second
npm run format

# Check formatting - takes ~1 second
npm run format:check
```

**ALWAYS run these before committing or the CI will fail:**

```bash
npm run lint && npm run format && npm run type-check
```

## Validation Scenarios

### Complete End-to-End Validation

After making any changes, ALWAYS run this complete validation:

```bash
# 1. Install and build
npm install
npm run build

# 2. Run all tests and quality checks
npm test
npm run test:coverage
npm run lint
npm run format:check
npm run type-check

# 3. Test server functionality
mkdir -p /tmp/test_pdfs
timeout 5s node dist/index.js /tmp/test_pdfs
# Should output: "Warning: Indexing all PDF objects" and "MCP PDF Server running on stdio"

# 4. Clean up test files
rm -rf /tmp/test_pdfs
```

### Manual Functional Testing

The server provides two MCP tools:

1. `extract_pdf_text` - Extracts text from PDF files
2. `list_allowed_directories` - Lists accessible directories

**Note**: Direct functional testing requires an MCP client. The server uses stdio protocol and cannot be tested with simple HTTP requests.

## Project Structure

Key directories and files:

```
├── src/
│   ├── index.ts           # Main server entry point and MCP setup
│   ├── lib.ts             # Core PDF extraction and validation logic
│   ├── path-utils.ts      # Path normalization utilities
│   ├── path-validation.ts # Security path validation
│   ├── roots-utils.ts     # MCP roots protocol handling
│   └── __tests__/         # Jest test files
├── dist/                  # Compiled JavaScript (generated)
├── .github/workflows/     # CI/CD pipelines
├── package.json           # Dependencies and scripts
├── tsconfig.json          # TypeScript configuration
├── jest.config.cjs        # Jest test configuration
├── .eslintrc.cjs          # ESLint configuration
└── Dockerfile             # Container build configuration
```

## Common Issues and Workarounds

### Docker Build Issues

**Problem**: Docker build may fail in some environments due to npm issues

**Workaround**: Docker functionality is implemented but may not work in all CI environments. Focus on Node.js development workflow.

### Empty Allowed Directories

**Problem**: Server exits with error about no allowed directories

**Solution**: Always provide at least one directory argument:

```bash
node dist/index.js /some/allowed/directory
```

## CI/CD Pipeline

The project uses GitHub Actions with these workflows:

- **ci.yml**: Tests on Node.js 18.x, 22.x on Ubuntu. Runs lint, format, type-check, build, and tests
- **release.yml**: Automated releases on version tags, publishes to npm and Docker
- **security.yml**: Weekly security audits

**Build Times in CI**:

- Install: ~30 seconds
- Build: ~5 seconds
- Tests: ~15 seconds
- Total CI time: ~2-3 minutes per job

## Dependencies

### Runtime Dependencies

- `@modelcontextprotocol/sdk`: MCP protocol implementation
- `pdf-parse`: PDF text extraction
- `zod`: Schema validation
- `zod-to-json-schema`: Schema conversion

### Development Dependencies

- `typescript`: TypeScript compiler
- `jest`: Testing framework
- `eslint`: Code linting
- `prettier`: Code formatting

## Security Model

The server implements strict path validation:

- Only files within allowed directories can be accessed
- Symlink attacks are prevented by resolving real paths
- Directory traversal attacks are blocked
- All paths are normalized and validated before access

## Release Process

```bash
# Automated releases (recommended)
npm run release:patch    # Bug fixes (0.1.0 -> 0.1.1)
npm run release:minor    # New features (0.1.0 -> 0.2.0)
npm run release:major    # Breaking changes (0.1.0 -> 1.0.0)
```

These scripts run tests, bump version, create git tags, and trigger automated CI/CD.
