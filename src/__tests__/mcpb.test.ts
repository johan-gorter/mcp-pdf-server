import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

describe('MCPB Bundle', () => {
  const projectRoot = path.join(__dirname, '../..');
  const manifestPath = path.join(projectRoot, 'manifest.json');

  test('manifest.json exists and is valid JSON', () => {
    expect(fs.existsSync(manifestPath)).toBe(true);

    const manifestContent = fs.readFileSync(manifestPath, 'utf8');
    const manifest = JSON.parse(manifestContent);

    // Validate required fields
    expect(manifest.manifest_version).toBe('0.1');
    expect(manifest.name).toBe('mcp-pdf-server');
    expect(manifest.version).toBe('0.1.0');
    expect(manifest.description).toBeTruthy();
    expect(manifest.author).toBeTruthy();
    expect(manifest.author.name).toBeTruthy();
    expect(manifest.server).toBeTruthy();
    expect(manifest.server.type).toBe('node');
    expect(manifest.server.entry_point).toBe('dist/index.js');
  });

  test('manifest tools match server capabilities', () => {
    const manifestContent = fs.readFileSync(manifestPath, 'utf8');
    const manifest = JSON.parse(manifestContent);

    const expectedTools = ['extract_pdf_text', 'list_allowed_directories'];
    const manifestTools = manifest.tools.map((tool: any) => tool.name);

    expect(manifestTools).toEqual(expect.arrayContaining(expectedTools));
  });

  test('can build MCPB bundle', () => {
    // This test ensures the build process works
    const buildScript = path.join(projectRoot, 'tools', 'build-mcpb.cjs');
    expect(fs.existsSync(buildScript)).toBe(true);

    // Ensure dist directory exists
    const distPath = path.join(projectRoot, 'dist');
    if (!fs.existsSync(distPath)) {
      execSync('npm run build', { cwd: projectRoot });
    }

    // Run MCPB build and check output
    execSync('npm run build:mcpb', { cwd: projectRoot, stdio: 'pipe' });

    // Check that MCPB file was created
    const expectedBundleName = 'johangorter-mcp-pdf-server-0.1.0.mcpb';
    const bundlePath = path.join(projectRoot, expectedBundleName);
    expect(fs.existsSync(bundlePath)).toBe(true);

    // Verify bundle has reasonable size (should be a few MB)
    const stats = fs.statSync(bundlePath);
    expect(stats.size).toBeGreaterThan(1024 * 1024); // > 1MB
    expect(stats.size).toBeLessThan(50 * 1024 * 1024); // < 50MB
  }, 30000); // Increase timeout for build operations
});
