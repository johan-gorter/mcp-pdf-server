FROM node:22-slim

WORKDIR /app

# Copy everything including built dist and node_modules
COPY dist ./dist
COPY node_modules ./node_modules
COPY package*.json ./

# Create the workaround directory structure for pdf-parse library
RUN mkdir -p test/data && echo "dummy" > test/data/05-versions-space.pdf

# Create non-root user for security
RUN groupadd -g 1001 nodejs && \
    useradd -u 1001 -g nodejs mcp

# Change to non-root user  
USER mcp

# Set the entrypoint
ENTRYPOINT ["node", "dist/index.js"]