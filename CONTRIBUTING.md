# Contributing to MCP PDF Server

Thank you for your interest in contributing to the MCP PDF Server project!

## Development Setup

1. **Clone the repository**

   ```bash
   git clone https://github.com/johan-gorter/mcp-pdf-server.git
   cd mcp-pdf-server
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Build the project**

   ```bash
   npm run build
   ```

4. **Run tests**
   ```bash
   npm test
   ```

## Development Workflow

### Running in Development Mode

```bash
npm run dev
```

### Watch Mode for Development

```bash
npm run watch
```

### Code Quality

- **Linting**: `npm run lint` or `npm run lint:fix`
- **Formatting**: `npm run format` or `npm run format:check`

### Testing

- **Run tests**: `npm test`
- **Watch mode**: `npm run test:watch`
- **Coverage**: `npm run test:coverage`

### Building the Project

The GitHub Actions workflow will automatically:

- Run CI tests
- On version changes:
  - Create a GitHub release
  - Build and publish Docker images

## Issues and Support

- Report bugs via [GitHub Issues](https://github.com/johan-gorter/mcp-pdf-server/issues)
- For questions, use [GitHub Discussions](https://github.com/johan-gorter/mcp-pdf-server/discussions)

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
