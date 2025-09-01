# MCP PDF Server

Always reference these instructions first and fallback to search or bash commands only when you encounter unexpected information that does not match the info here.

## Working Effectively

Bootstrap, build, and test the repository:
- `npm install` -- installs all dependencies. Takes ~5 seconds. NEVER CANCEL.
- `npm run build` -- TypeScript compilation. Takes ~2 seconds. NEVER CANCEL.
- **CRITICAL WORKAROUND**: Copy test PDF file: `mkdir -p test/data && cp node_modules/pdf-parse/test/data/05-versions-space.pdf test/data/` -- Required due to pdf-parse dependency bug. Always run this before testing functionality.
- `npm test` -- runs Jest test suite. Takes ~4 seconds. NEVER CANCEL. NOTE: 4 tests fail on Linux (Windows path conversion tests) - this is expected.
- **COMPREHENSIVE VALIDATION**: Run `./validate-dev-environment.sh` to validate the complete development setup end-to-end.

Run the MCP server:
- **ALWAYS** run the bootstrapping steps first (build + PDF workaround).
- `npm run dev` -- builds and starts server with `/tmp` as default directory.
- `node dist/index.js [directory]` -- runs server with specific allowed directory.
- Example: `node dist/index.js /path/to/pdfs` -- allows PDF operations in specified directory.
- Server communicates via JSON-RPC over stdin/stdout (MCP protocol).

## Validation

Always manually validate any new code changes:
- **ALWAYS** run through at least one complete functional test scenario after making changes.
- Use validation script: The server starts correctly when you see "MCP PDF Server running on stdio".
- Test MCP protocol by sending: `{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0.0"}}}`
- Always run `npm run format` and `npm run lint:fix` before you are done or the CI (.github/workflows/ci.yml) will fail.
- **TIMING**: Tests take 4 seconds, build takes 2 seconds, lint takes 1 second, format check takes 1 second.

## Common Tasks

### Build and Development Commands
```bash
# Clean build artifacts
npm run clean

# Build TypeScript to JavaScript  
npm run build  # ~2 seconds

# Build in watch mode (rebuilds on file changes)
npm run watch

# Start the server with default directory
npm run dev

# Start the compiled server
npm start

# Type check without emitting files
npm run type-check
```

### Testing Commands
```bash
# Run all tests (4 Windows-specific tests fail on Linux - expected)
npm test  # ~4 seconds

# Run tests in watch mode during development  
npm run test:watch

# Generate test coverage report
npm run test:coverage  # ~8 seconds
```

### Code Quality Commands
```bash
# Lint the code (reports 3 known issues - acceptable)
npm run lint  # ~1 second

# Fix linting issues automatically
npm run lint:fix

# Format code with Prettier
npm run format

# Check code formatting  
npm run format:check  # ~1 second
```

### Docker Commands (CURRENTLY NOT FUNCTIONAL)
```bash
# Build Docker image (NOTE: Currently fails due to npm issue in Alpine)
docker build -t mcp-pdf-server .
# ERROR: npm fails with "Exit handler never called!" after ~70 seconds

# Use local development instead of Docker for now
```

### Release Commands
```bash
# For bug fixes (0.1.0 -> 0.1.1)
npm run release:patch

# For new features (0.1.0 -> 0.2.0)  
npm run release:minor

# For breaking changes (0.1.0 -> 1.0.0)
npm run release:major
```

## Known Issues and Workarounds

### pdf-parse Dependency Issue
- **Problem**: pdf-parse tries to read `./test/data/05-versions-space.pdf` on import
- **Workaround**: Always run `mkdir -p test/data && cp node_modules/pdf-parse/test/data/05-versions-space.pdf test/data/` after npm install
- **Detection**: Error "ENOENT: no such file or directory, open './test/data/05-versions-space.pdf'"

### Windows-Specific Tests  
- **Problem**: 4 path conversion tests fail on Linux (test platform-specific behavior)
- **Expected**: Tests in `src/__tests__/path-utils.test.ts` that check Windows path conversion
- **Solution**: These failures are expected on non-Windows platforms

### TypeScript Version Warning
- **Problem**: ESLint warns about TypeScript 5.9.2 vs supported 5.4.0
- **Impact**: Linting works but shows warnings
- **Solution**: Acceptable for development; CI handles this correctly

### Linting Issues
- **Problem**: 3 linting errors in test files (unused variables, require statements)
- **Impact**: `npm run lint` exits with code 1 but these are acceptable
- **Solution**: Focus on new code; these existing issues are known

### Docker Issues
- **Problem**: npm fails during Docker build with "Exit handler never called!" error
- **Impact**: Docker builds currently fail after ~70 seconds
- **Status**: Known npm issue in Alpine Linux environment 
- **Workaround**: Use local development; Docker builds are not functional

## Repository Structure

Key directories and files:
```
src/
├── index.ts              # Main MCP server entry point
├── lib.ts                # Core PDF processing functions  
├── path-utils.ts         # Path conversion utilities (Windows/Unix)
├── path-validation.ts    # Security path validation
├── roots-utils.ts        # MCP roots protocol handling
└── __tests__/            # Jest test files
    ├── lib.test.ts
    ├── path-utils.test.ts  
    └── roots-utils.test.ts

.github/workflows/        # CI/CD workflows
├── ci.yml               # Tests on Node 18/20/22, Ubuntu/Windows/macOS
├── release.yml          # Automated releases on version tags
└── security.yml         # Security audits

dist/                    # Build output (TypeScript compiled to JS)
test/data/              # Required workaround directory for pdf-parse
package.json            # Dependencies and scripts
tsconfig.json          # TypeScript configuration  
jest.config.cjs        # Jest test configuration
```

## Application Architecture

This is a **Model Context Protocol (MCP) server** that provides PDF text extraction capabilities:

- **Protocol**: JSON-RPC over stdin/stdout
- **Purpose**: Extracts text from PDF files for AI assistants like Claude Desktop
- **Security**: Only operates on explicitly allowed directories  
- **Configuration**: Directories can be provided via command line or MCP roots protocol

### Core Tools Provided
- `extract_pdf_text` - Extract text content from PDF files
- Path validation and security controls
- Cross-platform path handling (Windows/Unix/WSL)

### Usage with Claude Desktop
Add to Claude Desktop configuration:
```json
{
  "mcpServers": {
    "pdf-server": {
      "command": "node",
      "args": ["/path/to/mcp-pdf-server/dist/index.js", "/path/to/pdf/directory"],
      "env": {}
    }
  }
}
```

## CI/CD Pipeline

- **Triggers**: Push/PR to main/develop branches
- **Tests**: Multi-platform (Ubuntu/Windows/macOS) with Node.js 18/20/22
- **Quality**: Linting, formatting, type checking, test coverage  
- **Release**: Automated on version tags (publishes to npm, Docker images)
- **Security**: Weekly dependency audits

Expected CI behavior:
- Some path-utils tests fail on Linux (expected)
- Linting reports 3 known issues (acceptable)
- Format checking finds issues (run `npm run format` to fix)