# Simple single-stage Dockerfile that works by copying pre-built assets
# For development, run: npm run build && docker build -t mcp-pdf-server .

FROM node:24-alpine

WORKDIR /app

# Copy pre-built application and all dependencies
COPY dist ./dist
COPY node_modules ./node_modules
COPY package*.json ./

# Set the entrypoint
ENTRYPOINT ["node", "dist/index.js"]