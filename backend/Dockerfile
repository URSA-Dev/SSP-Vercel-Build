# Stage 1: Install dependencies and build
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

COPY . .

# Prune dev dependencies for production image
RUN npm prune --production

# Stage 2: Production runtime
FROM node:20-alpine AS runtime

WORKDIR /app

# Copy production node_modules and application code from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/src ./src
COPY --from=builder /app/knexfile.js ./knexfile.js

# Use built-in non-root node user
RUN chown -R node:node /app
USER node

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:3001/api/v1/health || exit 1

CMD ["node", "src/server.js"]
