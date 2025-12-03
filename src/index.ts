#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ToolSchema,
  RootsListChangedNotificationSchema,
  type Root,
} from '@modelcontextprotocol/sdk/types.js';
import fs from 'fs/promises';
import path from 'path';
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { normalizePath, expandHome } from './path-utils.js';
import { getValidRootDirectories } from './roots-utils.js';
import { validatePath, setAllowedDirectories, extractPdfText } from './lib.js';

// Command line argument parsing
const args = process.argv.slice(2);
if (args.length === 0) {
  console.error('Usage: mcp-pdf-server [allowed-directory] [additional-directories...]');
  console.error('Note: Allowed directories can be provided via:');
  console.error('  1. Command-line arguments (shown above)');
  console.error('  2. MCP roots protocol (if client supports it)');
  console.error(
    'At least one directory must be provided by EITHER method for the server to operate.'
  );
}

// Store allowed directories in normalized and resolved form
let allowedDirectories = await Promise.all(
  args.map(async (dir) => {
    const expanded = expandHome(dir);
    const absolute = path.resolve(expanded);
    try {
      // Security: Resolve symlinks in allowed directories during startup
      // This ensures we know the real paths and can validate against them later
      const resolved = await fs.realpath(absolute);
      return normalizePath(resolved);
    } catch (error) {
      // If we can't resolve (doesn't exist), use the normalized absolute path
      // This allows configuring allowed dirs that will be created later
      return normalizePath(absolute);
    }
  })
);

// Validate that all directories exist and are accessible
await Promise.all(
  allowedDirectories.map(async (dir) => {
    try {
      const stats = await fs.stat(dir);
      if (!stats.isDirectory()) {
        console.error(`Error: ${dir} is not a directory`);
        process.exit(1);
      }
    } catch (error) {
      console.error(`Error accessing directory ${dir}:`, error);
      process.exit(1);
    }
  })
);

// Initialize the global allowedDirectories in lib.ts
setAllowedDirectories(allowedDirectories);

// Schema definitions
const ExtractPdfTextArgsSchema = z.object({
  path: z.string().describe('Path to PDF file within allowed directories'),
  max_chars: z.number().optional().describe('Maximum characters to return (default: unlimited)'),
});

const ListAllowedDirectoriesArgsSchema = z.object({});

// Read package.json
const packageJson = JSON.parse(
  await fs.readFile(path.join(import.meta.dirname, '../package.json'), 'utf-8')
);

// Server setup
const server = new Server(
  {
    name: packageJson.name,
    version: packageJson.version,
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Tool handlers
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'extract_pdf_text',
        description:
          'Extract text content from PDF files with optional character limiting. ' +
          'This tool reads PDF files and extracts their text content. Supports ' +
          'limiting the output size via max_chars parameter to prevent context overflow. ' +
          "Only works with PDF files containing embedded text - scanned PDFs without OCR won't work. " +
          'Only works within allowed directories.',
        inputSchema: zodToJsonSchema(ExtractPdfTextArgsSchema as any),
      },
      {
        name: 'list_allowed_directories',
        description:
          'Returns the list of directories that this server is allowed to access. ' +
          'Subdirectories within these allowed directories are also accessible. ' +
          'Use this to understand which directories and their nested paths are available ' +
          'before trying to access PDF files.',
        inputSchema: zodToJsonSchema(ListAllowedDirectoriesArgsSchema as any),
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    const { name, arguments: args } = request.params;

    switch (name) {
      case 'extract_pdf_text': {
        const parsed = ExtractPdfTextArgsSchema.safeParse(args);
        if (!parsed.success) {
          throw new Error(`Invalid arguments for extract_pdf_text: ${parsed.error}`);
        }

        const validPath = await validatePath(parsed.data.path);

        // Check if file is a PDF
        if (!validPath.toLowerCase().endsWith('.pdf')) {
          throw new Error('File must have .pdf extension');
        }

        const text = await extractPdfText(validPath, parsed.data.max_chars);
        return {
          content: [{ type: 'text', text }],
        };
      }

      case 'list_allowed_directories': {
        return {
          content: [
            {
              type: 'text',
              text:
                allowedDirectories.length > 0
                  ? allowedDirectories.join('\n')
                  : 'No allowed directories configured',
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      content: [{ type: 'text', text: `Error: ${errorMessage}` }],
      isError: true,
    };
  }
});

// Roots protocol handlers
server.setNotificationHandler(RootsListChangedNotificationSchema, async (_notification) => {
  try {
    const response = await server.listRoots();
    if (response && 'roots' in response) {
      await updateAllowedDirectoriesFromRoots(response.roots);
    }
  } catch (error) {
    console.error(
      'Failed to request roots from client:',
      error instanceof Error ? error.message : String(error)
    );
  }
});

// Updates allowed directories based on MCP client roots
async function updateAllowedDirectoriesFromRoots(requestedRoots: Root[]) {
  const validatedRootDirs = await getValidRootDirectories(requestedRoots);
  if (validatedRootDirs.length > 0) {
    allowedDirectories = [...validatedRootDirs];
    setAllowedDirectories(allowedDirectories); // Update the global state in lib.ts
    console.error(
      `Updated allowed directories from MCP roots: ${validatedRootDirs.length} valid directories`
    );
  } else {
    console.error('No valid root directories provided by client');
  }
}

// Handles post-initialization setup, specifically checking for and fetching MCP roots.
server.oninitialized = async () => {
  const clientCapabilities = server.getClientCapabilities();

  if (clientCapabilities?.roots) {
    try {
      const response = await server.listRoots();
      if (response && 'roots' in response) {
        await updateAllowedDirectoriesFromRoots(response.roots);
      } else {
        console.error('Client returned no roots set, keeping current settings');
      }
    } catch (error) {
      console.error(
        'Failed to request initial roots from client:',
        error instanceof Error ? error.message : String(error)
      );
    }
  } else {
    if (allowedDirectories.length > 0) {
      console.error(
        'Client does not support MCP Roots, using allowed directories set from server args:',
        allowedDirectories
      );
    } else {
      throw new Error(
        `Server cannot operate: No allowed directories available. Server was started without command-line directories and client either does not support MCP roots protocol or provided empty roots. Please either: 1) Start server with directory arguments, or 2) Use a client that supports MCP roots protocol and provides valid root directories.`
      );
    }
  }
};

// Start server
async function runServer() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('MCP PDF Server running on stdio');
  if (allowedDirectories.length === 0) {
    console.error(
      'Started without allowed directories - waiting for client to provide roots via MCP protocol'
    );
  }
}

runServer().catch((error) => {
  console.error('Fatal error running server:', error);
  process.exit(1);
});
