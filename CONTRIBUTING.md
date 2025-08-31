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
- **Type Checking**: `npm run type-check`

### Testing
- **Run tests**: `npm test`
- **Watch mode**: `npm run test:watch`
- **Coverage**: `npm run test:coverage`

## Release Process

### Semantic Versioning
This project follows [Semantic Versioning](https://semver.org/). Use the following scripts for releases:

- **Patch release** (bug fixes): `npm run release:patch`
- **Minor release** (new features): `npm run release:minor`  
- **Major release** (breaking changes): `npm run release:major`

These scripts will:
1. Run tests to ensure quality
2. Bump the version in `package.json`
3. Create a git commit and tag
4. Push to GitHub (triggering CI/CD)

### Manual Release Steps
If you prefer manual control:

1. **Update version**: `npm version [patch|minor|major]`
2. **Push changes**: `git push && git push --tags`

The GitHub Actions workflow will automatically:
- Run CI tests
- Create a GitHub release
- Publish to npm
- Build and publish Docker images

## Code Style

- Follow the existing TypeScript patterns
- Use meaningful variable and function names
- Add JSDoc comments for public APIs
- Keep functions small and focused
- Write tests for new functionality

## Pull Request Process

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes and write tests
4. Run the full test suite: `npm test`
5. Run linting and formatting: `npm run lint && npm run format`
6. Commit your changes: `git commit -m 'Add amazing feature'`
7. Push to your fork: `git push origin feature/amazing-feature`
8. Open a Pull Request

## Docker Development

### Building the Docker Image
```bash
docker build -t mcp-pdf-server .
```

### Running with Docker
```bash
docker run -it --rm mcp-pdf-server
```

## Issues and Support

- Report bugs via [GitHub Issues](https://github.com/johan-gorter/mcp-pdf-server/issues)
- For questions, use [GitHub Discussions](https://github.com/johan-gorter/mcp-pdf-server/discussions)

## License

By contributing, you agree that your contributions will be licensed under the MIT License.