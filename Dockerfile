FROM node:22.12-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN --mount=type=cache,target=/root/.npm npm ci

# Copy source code
COPY . .

# Build the project
RUN npm run build

# Production stage
FROM node:22-alpine AS release

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
ENV NODE_ENV=production
RUN --mount=type=cache,target=/root/.npm npm ci --omit=dev

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S mcp -u 1001

# Change to non-root user
USER mcp

# Expose port (if needed for debugging/health checks)
EXPOSE 3000

# Set the entrypoint
ENTRYPOINT ["node", "dist/index.js"]