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

# Environment variables for build time (Static Envs)
ARG PUBLIC_BASE_URL
ARG PRIVATE_DATABASE_URL
ARG PRIVATE_BETTER_AUTH_SECRET
ARG PRIVATE_GOOGLE_CLIENT_ID
ARG PRIVATE_GOOGLE_CLIENT_SECRET
ARG OPENROUTER_API_KEY
ARG OPENAI_API_KEY
ARG PRIVATE_S3_BUCKET
ARG PRIVATE_S3_REGION
ARG PRIVATE_S3_ENDPOINT
ARG PRIVATE_S3_ACCESS_KEY_ID
ARG PRIVATE_S3_SECRET_ACCESS_KEY
ARG PRIVATE_S3_PUBLIC_URL

# Mapping ARGs to ENVs so SvelteKit can see them during build
ENV PUBLIC_BASE_URL=$PUBLIC_BASE_URL
ENV PRIVATE_DATABASE_URL=$PRIVATE_DATABASE_URL
ENV PRIVATE_BETTER_AUTH_SECRET=$PRIVATE_BETTER_AUTH_SECRET
ENV PRIVATE_GOOGLE_CLIENT_ID=$PRIVATE_GOOGLE_CLIENT_ID
ENV PRIVATE_GOOGLE_CLIENT_SECRET=$PRIVATE_GOOGLE_CLIENT_SECRET
ENV OPENROUTER_API_KEY=$OPENROUTER_API_KEY
ENV OPENAI_API_KEY=$OPENAI_API_KEY
ENV PRIVATE_S3_BUCKET=$PRIVATE_S3_BUCKET
ENV PRIVATE_S3_REGION=$PRIVATE_S3_REGION
ENV PRIVATE_S3_ENDPOINT=$PRIVATE_S3_ENDPOINT
ENV PRIVATE_S3_ACCESS_KEY_ID=$PRIVATE_S3_ACCESS_KEY_ID
ENV PRIVATE_S3_SECRET_ACCESS_KEY=$PRIVATE_S3_SECRET_ACCESS_KEY
ENV PRIVATE_S3_PUBLIC_URL=$PRIVATE_S3_PUBLIC_URL

# Build the app
RUN pnpm exec svelte-kit sync && NODE_OPTIONS="--max-old-space-size=4096" pnpm run build

# Production stage
# Playwright official image includes all browser dependencies
FROM mcr.microsoft.com/playwright:v1.58.0-jammy

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
