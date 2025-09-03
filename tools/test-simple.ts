#!/usr/bin/env tsx

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testSingleCommand() {
  console.log('🧪 Testing single PDF extraction command...');

  const serverPath = path.join(__dirname, '..', 'dist', 'index.js');
  const toolsDir = path.join(__dirname);

  const serverProcess = spawn('node', [serverPath, toolsDir], {
    stdio: ['pipe', 'pipe', 'pipe'],
  });

  let output = '';
  let errorOutput = '';

  serverProcess.stdout?.on('data', (data) => {
    output += data.toString();
    console.log('📤 Server stdout:', data.toString());
  });

  serverProcess.stderr?.on('data', (data) => {
    errorOutput += data.toString();
    console.log('📋 Server stderr:', data.toString());

    // When server is ready, send a simple request
    if (data.toString().includes('MCP PDF Server running on stdio')) {
      console.log('✅ Server ready, sending test request...');

      const testMessage =
        JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'tools/call',
          params: {
            name: 'extract_pdf_text',
            arguments: {
              path: 'examples/lorem-ipsum.pdf',
            },
          },
        }) + '\n';

      console.log('📝 Sending:', testMessage.trim());
      serverProcess.stdin?.write(testMessage);

      // Give it time to respond then kill
      setTimeout(() => {
        console.log('⏰ Timeout reached, killing server...');
        serverProcess.kill();
      }, 3000);
    }
  });

  serverProcess.on('exit', (code) => {
    console.log(`🔚 Server exited with code: ${code}`);
    console.log('📤 Final stdout output:');
    console.log(output);
    console.log('📋 Final stderr output:');
    console.log(errorOutput);
  });
}

testSingleCommand();
