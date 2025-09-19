#!/usr/bin/env node

/**
 * Build MCPB (MCP Bundle) file for the MCP PDF Server
 * This script creates a .mcpb bundle (zip file) containing the server and manifest
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create temporary directory for bundle preparation
const tempDir = path.join(__dirname, '..', 'temp-mcpb-build');
const distDir = path.join(__dirname, '..', 'dist');
const projectRoot = path.join(__dirname, '..');

async function buildMcpb() {
  console.log('Building MCPB bundle...');

  // Ensure dist directory exists (build should have been run)
  if (!fs.existsSync(distDir)) {
    console.error('Error: dist directory not found. Please run "npm run build" first.');
    process.exit(1);
  }

  // Clean and create temp directory
  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
  fs.mkdirSync(tempDir, { recursive: true });

  try {
    // Copy required files to temp directory
    console.log('Copying files...');

    // Read package.json to get version
    const packageJson = JSON.parse(fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf8'));

    // Read and update manifest.json with version from package.json
    const manifestPath = path.join(projectRoot, 'manifest.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    manifest.version = packageJson.version;

    // Copy updated manifest.json
    fs.writeFileSync(path.join(tempDir, 'manifest.json'), JSON.stringify(manifest, null, 2));

    // Copy dist directory (compiled TypeScript)
    fs.cpSync(distDir, path.join(tempDir, 'dist'), { recursive: true });

    // Copy package.json (for dependencies info)
    fs.copyFileSync(path.join(projectRoot, 'package.json'), path.join(tempDir, 'package.json'));

    // Copy LICENSE and README
    fs.copyFileSync(path.join(projectRoot, 'LICENSE'), path.join(tempDir, 'LICENSE'));

    fs.copyFileSync(path.join(projectRoot, 'README.md'), path.join(tempDir, 'README.md'));

    // Copy only production node_modules (runtime dependencies)
    console.log('Installing production dependencies...');
    // Create a minimal package.json with only runtime dependencies
    const bundlePackageJson = {
      name: packageJson.name,
      version: packageJson.version,
      dependencies: packageJson.dependencies,
      type: packageJson.type,
      main: packageJson.main,
      bin: packageJson.bin,
      engines: packageJson.engines,
    };

    fs.writeFileSync(
      path.join(tempDir, 'package.json'),
      JSON.stringify(bundlePackageJson, null, 2)
    );

    // Install only production dependencies in temp directory
    console.log('Installing production dependencies in bundle...');
    execSync('npm install --production --no-package-lock', {
      cwd: tempDir,
      stdio: 'inherit',
    });

    // Create the MCPB bundle using the official mcpb pack command
    console.log('Creating MCPB bundle with mcpb pack...');
    const bundleName = `${packageJson.name.replace('@', '').replace('/', '-')}-${packageJson.version}.mcpb`;
    const bundlePath = path.join(projectRoot, bundleName);

    // Remove existing bundle if it exists
    if (fs.existsSync(bundlePath)) {
      fs.unlinkSync(bundlePath);
    }

    // Find mcpb executable - cross-platform compatible
    const mcpbBin = path.join(
      projectRoot,
      'node_modules',
      '.bin',
      process.platform === 'win32' ? 'mcpb.cmd' : 'mcpb'
    );

    // Verify mcpb is available
    if (!fs.existsSync(mcpbBin)) {
      throw new Error('mcpb command not found. Please ensure @anthropic-ai/mcpb is installed.');
    }

    // Run mcpb pack command
    console.log(`Running: mcpb pack "${tempDir}" "${bundlePath}"`);
    const packCommand = `"${mcpbBin}" pack "${tempDir}" "${bundlePath}"`;
    console.log(`Running: ${packCommand}`);

    execSync(packCommand, {
      cwd: projectRoot,
      stdio: 'inherit',
    });

    // Verify bundle was created and show stats
    if (fs.existsSync(bundlePath)) {
      const stats = fs.statSync(bundlePath);
      console.log(
        `✅ MCPB bundle created: ${bundleName} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`
      );
    } else {
      throw new Error('MCPB bundle was not created successfully');
    }
  } catch (error) {
    console.error('Error building MCPB bundle:', error.message);
    process.exit(1);
  } finally {
    // Clean up temp directory
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  }
}

// Run the build
buildMcpb().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
