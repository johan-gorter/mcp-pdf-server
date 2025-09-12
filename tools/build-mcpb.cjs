#!/usr/bin/env node

/**
 * Build MCPB (MCP Bundle) file for the MCP PDF Server
 * This script creates a .mcpb bundle (zip file) containing the server and manifest
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

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

    // Copy manifest.json
    fs.copyFileSync(path.join(projectRoot, 'manifest.json'), path.join(tempDir, 'manifest.json'));

    // Copy dist directory (compiled TypeScript)
    fs.cpSync(distDir, path.join(tempDir, 'dist'), { recursive: true });

    // Copy package.json (for dependencies info)
    fs.copyFileSync(path.join(projectRoot, 'package.json'), path.join(tempDir, 'package.json'));

    // Copy LICENSE and README
    fs.copyFileSync(path.join(projectRoot, 'LICENSE'), path.join(tempDir, 'LICENSE'));

    fs.copyFileSync(path.join(projectRoot, 'README.md'), path.join(tempDir, 'README.md'));

    // Copy only production node_modules (runtime dependencies)
    console.log('Installing production dependencies...');
    const packageJson = JSON.parse(fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf8'));

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

    // Create the zip file
    console.log('Creating MCPB bundle...');
    const bundleName = `${packageJson.name.replace('@', '').replace('/', '-')}-${packageJson.version}.mcpb`;
    const bundlePath = path.join(projectRoot, bundleName);

    // Remove existing bundle if it exists
    if (fs.existsSync(bundlePath)) {
      fs.unlinkSync(bundlePath);
    }

    // Create zip file using Node.js archiver
    console.log('Creating zip archive...');
    let archiver;
    try {
      archiver = require('archiver');
    } catch (error) {
      console.error('Error: archiver module not found. Please ensure it is installed.');
      console.error('Run: npm install or ensure archiver is in devDependencies');
      throw error;
    }
    const output = fs.createWriteStream(bundlePath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    await new Promise((resolve, reject) => {
      output.on('close', () => {
        console.log(`MCPB bundle created: ${bundleName} (${archive.pointer()} bytes)`);
        resolve();
      });

      archive.on('error', (err) => {
        reject(err);
      });

      archive.pipe(output);
      archive.directory(tempDir, false);
      archive.finalize();
    });

    if (fs.existsSync(bundlePath)) {
      const stats = fs.statSync(bundlePath);
      console.log(
        `✅ MCPB bundle created: ${bundleName} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`
      );
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
