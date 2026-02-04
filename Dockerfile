# Build stage
FROM node:20-slim AS builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy workspace files
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build the app
RUN pnpm run build

# Production stage
# Playwright official image includes all browser dependencies
FROM mcr.microsoft.com/playwright:v1.50.0-jammy

WORKDIR /app

# Install FFmpeg
RUN apt-get update && apt-get install -y ffmpeg && rm -rf /var/lib/apt/lists/*

# Copy built application
COPY --from=builder /app/build ./build
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=builder /app/pnpm-workspace.yaml ./pnpm-workspace.yaml

# Install only production dependencies
RUN npm install -g pnpm && pnpm install --prod --frozen-lockfile

# Environment variables
ENV NODE_ENV=production
ENV PORT=3000
# Use 0.0.0.0 to allow access from outside the container
ENV HOST=0.0.0.0

# Expose port
EXPOSE 3000

# Start the Node.js server
CMD ["node", "build/index.js"]
