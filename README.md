# PDF MCP Server

Node.js server implementing Model Context Protocol (MCP) for PDF text extraction operations. Built for Claude Desktop integration with secure directory access controls.

Based on the patterns from [@modelcontextprotocol/server-filesystem](https://github.com/modelcontextprotocol/servers/tree/main/src/filesystem).

## Features

- **Single Tool**: `extract_pdf_text` - Extract plain text from PDF files
- **Directory Access**: Same security model as filesystem MCP server
- **Text Limiting**: `max_chars` parameter to control output size and token usage
- **Secure**: Path validation and sandboxed directory access
- **Fast**: Lightweight Node.js implementation using pdf-parse

## Installation

### Claude Desktop (Recommended)

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "pdf-reader": {
      "command": "npx",
      "args": [
        "-y", 
        "@johangorter/mcp-pdf-server",
        "/Users/username/Desktop",
        "/Users/username/Downloads"
      ]
    }
  }
}
```

### Desktop Extension (.dxt)

For more information about Desktop Extensions, see the [official DXT documentation](https://www.anthropic.com/engineering/desktop-extensions).

1. Download the `.dxt` file
2. Navigate to Settings > Extensions in Claude Desktop
3. Click "Install Extension" and select the `.dxt` file

## Usage

The server provides one tool:

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

## Design Decisions

### Why Node.js?
- **Ecosystem Alignment**: Reuses patterns from official filesystem MCP server
- **Claude Desktop Integration**: Built-in Node.js support, no external dependencies
- **Fast Deployment**: NPX distribution, no Python environment setup
- **Code Reuse**: 80% shared logic with filesystem server for directory validation

### Why Single Tool?
- **Focused Scope**: PDF text extraction covers 80% of use cases
- **Token Efficiency**: max_chars prevents context overflow
- **Simplicity**: Easier to maintain and debug
- **Extensible**: Foundation for future PDF features

### Security Model
- **Directory Sandboxing**: Inherits filesystem server's access controls
- **Path Validation**: Prevents directory traversal attacks  
- **File Type Filtering**: Only processes .pdf files
- **Error Handling**: Standard MCP error codes for consistency

### Technical Stack
- **PDF Processing**: `pdf-parse` - reliable, fast, minimal dependencies
- **MCP SDK**: `@modelcontextprotocol/sdk` ^1.17.0
- **TypeScript**: Type safety and IDE support
- **Stdio Transport**: Local execution, secure communication

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

```bash
# Install dependencies
npm install

# Build
npm run build

# Test locally
node dist/index.js /path/to/test/directory

# Package as Desktop Extension
npm run package:dxt
```

## Limitations

- **Text Only**: No image, table, or metadata extraction
- **No OCR**: Scanned PDFs without embedded text won't work
- **Memory**: Large PDFs (>100MB) may cause memory issues
- **No Concurrent Processing**: Processes one PDF at a time

## Future Extensions

Potential expansions while maintaining simplicity:
- `extract_pdf_metadata` - Document properties
- `extract_pdf_pages` - Specific page ranges
- OCR support for scanned documents
- Table extraction for structured data

## License

MIT License - Same as official MCP servers

## Contributing

Follow the patterns established by [@modelcontextprotocol/servers](https://github.com/modelcontextprotocol/servers) for consistency with the MCP ecosystem.