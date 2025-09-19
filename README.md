# PDF MCP Server

[![CI](https://github.com/johan-gorter/mcp-pdf-server/actions/workflows/ci.yml/badge.svg)](https://github.com/johan-gorter/mcp-pdf-server/actions/workflows/ci.yml)
[![Release](https://github.com/johan-gorter/mcp-pdf-server/actions/workflows/release.yml/badge.svg)](https://github.com/johan-gorter/mcp-pdf-server/actions/workflows/release.yml)
[![npm version](https://badge.fury.io/js/@johangorter%2Fmcp-pdf-server.svg)](https://badge.fury.io/js/@johangorter%2Fmcp-pdf-server)
[![Docker Image](https://ghcr-badge.egpl.dev/johan-gorter/mcp-pdf-server/latest_tag?trim=major&label=docker)](https://github.com/johan-gorter/mcp-pdf-server/pkgs/container/mcp-pdf-server)

Node.js server implementing Model Context Protocol (MCP) for PDF text extraction operations. Built for Claude Desktop integration with secure directory access controls.

Based on the patterns from [@modelcontextprotocol/server-filesystem](https://github.com/modelcontextprotocol/servers/tree/main/src/filesystem).

## Features

- **Single Tool**: `extract_pdf_text` - Extract plain text from PDF files
- **Directory Access**: Same security model as filesystem MCP server
- **Text Limiting**: `max_chars` parameter to control output size and token usage
- **Secure**: Path validation and sandboxed directory access
- **Fast**: Lightweight Node.js implementation using unpdf

## Installation

### General MCP Clients

Add the following to your mcp server configuration file:

```json
{
  "mcpServers": {
    "pdf-reader": {
      "command": "npx",
      "args": ["-y", "@johangorter/mcp-pdf-server", "/Users/username/Desktop"]
    }
  }
}
```

### Desktop Extension (.mcpb) for Claude Desktop

For more information about Desktop Extensions, see the [official MCPB documentation](https://www.anthropic.com/engineering/desktop-extensions).

1. Download the `.mcpb` file from the [Releases](https://github.com/johan-gorter/mcp-pdf-server/releases) page.
2. Navigate to Settings > Extensions in Claude Desktop
3. Click "Install Extension" and select the `.mcpb` file

## Usage

The server provides one main tool:

### `extract_pdf_text`

Extract text content from PDF files with optional character limiting.

**Parameters:**

- `path` (string, required): Path to PDF file within allowed directories
- `max_chars` (number, optional): Maximum characters to return (default: unlimited)

**Example:**

```typescript
// Claude will call this tool when you ask:
// "Extract the first 1000 characters from report.pdf"
{
  "tool": "extract_pdf_text",
  "arguments": {
    "path": "reports/quarterly-report.pdf",
    "max_chars": 1000
  }
}
```

## Configuration

### Directory Access

Specify allowed directories as command-line arguments:

```bash
npx @johangorter/mcp-pdf-server /path/to/documents /path/to/pdfs
```

### Roots Protocol Support

The server supports dynamic directory updates via MCP Roots protocol, enabling runtime directory changes without restart.

## Error Handling

Standard MCP error codes:

- `-32602`: Invalid params (file not found, invalid path)
- `-32603`: Internal error (PDF parsing failed, file corrupted)

## Dependencies

```json
{
  "@modelcontextprotocol/sdk": "^1.17.0",
  "pdf-parse": "^1.1.1",
  "zod-to-json-schema": "^3.23.5"
}
```

## Development

### Prerequisites

- Node.js 22+
- TypeScript

### Setup

```bash
# Clone the repository
git clone https://github.com/johan-gorter/mcp-pdf-server.git
cd mcp-pdf-server

# Install dependencies
npm install

# Build the project
npm run build
```

### Continuous Integration

This project uses GitHub Actions for automated testing and deployment:

- **CI Pipeline**: Runs on every push and pull request
  - Tests on Ubuntu and Windows
  - Runs linting, formatting checks, and tests
- **Release Pipeline**: Triggers on package.json version changes
  - Creates GitHub releases with MCPB bundle
  - Builds and publishes Docker images

### Development Scripts

```bash
# Build TypeScript to JavaScript
npm run build

# Build in watch mode (rebuilds on file changes)
npm run watch

# Run the server locally for development
npm run dev

# Start the compiled server
npm run start

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Lint the code
npm run lint

# Fix linting issues
npm run lint:fix

# Format code with Prettier
npm run format

# Check code formatting
npm run format:check

# Clean build artifacts
npm run clean
```

### Testing

The project uses Jest for testing with TypeScript support:

```bash
# Run all tests
npm test

# Run tests in watch mode during development
npm run test:watch

# Generate test coverage report
npm run test:coverage
```

Test files are located in `src/__tests__/` and follow the pattern `*.test.ts`.

### MCPB Bundle Creation

This project supports creating MCPB (MCP Bundle) files for easy distribution and installation:

```bash
# Build the MCPB bundle
npm run build:mcpb
```

The MCPB bundle includes:

- Compiled TypeScript server (`dist/`)
- Runtime dependencies (`node_modules/`)
- Bundle manifest (`manifest.json`)
- Documentation and license files

MCPB bundles can be installed in Claude Desktop and other MCP-compatible clients with a single click.

### Docker Development

Build and run with Docker:

```bash
# Build Docker image
docker build -t mcp-pdf-server .

# Run with Docker
docker run -i --rm \
  --mount type=bind,src=/path/to/pdfs,dst=/pdfs \
  mcp-pdf-server /pdfs
```

Or use the pre-built Docker image:

```bash
# Pull from GitHub Container Registry
docker pull ghcr.io/johan-gorter/mcp-pdf-server:latest

# Run the container
docker run -i --rm \
  --mount type=bind,src=/path/to/pdfs,dst=/pdfs \
  ghcr.io/johan-gorter/mcp-pdf-server:latest /pdfs
```

### Code Quality

The project enforces code quality through:

- **TypeScript**: Strong typing and compile-time error checking
- **ESLint**: Code linting with TypeScript-specific rules
- **Prettier**: Consistent code formatting
- **Jest**: Comprehensive unit testing

### Project Structure

```
mcp-pdf-server/
├── src/
│   ├── __tests__/          # Test files
│   │   ├── lib.test.ts
│   │   ├── path-utils.test.ts
│   │   └── roots-utils.test.ts
│   ├── index.ts            # Main server entry point
│   ├── lib.ts              # Core functionality
│   ├── path-utils.ts       # Path handling utilities
│   ├── path-validation.ts  # Security validation
│   └── roots-utils.ts      # MCP roots support
├── dist/                   # Compiled JavaScript (generated)
├── coverage/               # Test coverage reports (generated)
├── package.json            # Dependencies and scripts
├── tsconfig.json          # TypeScript configuration
├── jest.config.cjs        # Jest testing configuration
├── .eslintrc.cjs          # ESLint configuration
├── .prettierrc            # Prettier configuration
├── Dockerfile             # Docker build configuration
└── README.md
```

## Limitations

- **Text Only**: No image, table, or metadata extraction
- **No OCR**: Scanned PDFs without embedded text won't work
- **Memory**: Large PDFs (>100MB) may cause memory issues
- **No Concurrent Processing**: Processes one PDF at a time

## License

MIT License
