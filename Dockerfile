# $oink ↔ $midoink Bridge Server
FROM node:20-alpine AS builder

WORKDIR /app

# Install all dependencies (including dev for TypeScript)
COPY package*.json ./
RUN npm ci

# Copy source code
COPY tsconfig.json ./
COPY src ./src

# Build TypeScript
RUN npm run build

# Production image
FROM node:20-alpine

LABEL maintainer="oink-bridge"
LABEL description="Cross-chain bridge: Cardano ↔ Midnight (1:1 peg)"

WORKDIR /app

# Install production dependencies only
COPY package*.json ./
RUN npm ci --omit=dev

# Copy built files from builder
COPY --from=builder /app/dist ./dist

# Expose bridge port
EXPOSE 3008

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3008/health || exit 1

# Run bridge server
CMD ["node", "dist/bridge/server.js"]

