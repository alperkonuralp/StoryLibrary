# Backend Dockerfile for ARM64 (Raspberry Pi) - using Alpine 3.17 for OpenSSL 1.1 compatibility
FROM node:18-alpine3.17

# Set working directory
WORKDIR /app

# Install dependencies for native modules and OpenSSL 1.1 for Prisma
RUN apk add --no-cache python3 make g++ openssl-dev openssl libc6-compat

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies for build)
RUN npm ci

# Copy source code
COPY . .

# Set Prisma binary target and generate Prisma client
ENV PRISMA_CLI_BINARY_TARGETS=linux-musl-openssl-3.0.x
RUN rm -rf node_modules/.prisma node_modules/@prisma/client/index.d.ts || true
RUN PRISMA_CLI_BINARY_TARGETS=linux-musl-openssl-3.0.x npx prisma generate --schema=prisma/schema.prisma

# Build TypeScript
RUN npm run build

# Skip pruning to keep all dependencies for now
# RUN npm prune --production

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3001/api/health || exit 1

# Start the application
CMD ["npm", "start"]