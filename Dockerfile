# Simple single-stage Dockerfile that works by copying pre-built assets
# For development, run: npm run build && docker build -t mcp-pdf-server .

FROM node:18-alpine

WORKDIR /app

# Copy pre-built application and all dependencies
COPY dist ./dist
COPY node_modules ./node_modules
COPY package*.json ./

# Create the workaround directory structure for pdf-parse library
RUN mkdir -p test/data && echo "dummy" > test/data/05-versions-space.pdf

# Set the entrypoint
ENTRYPOINT ["node", "dist/index.js"]