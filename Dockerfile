# Stage 1: Build
FROM node:24-alpine AS builder

# Install pnpm
RUN npm install -g pnpm

WORKDIR /app

# Copy package.json and pnpm-lock.yaml
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy the rest of the source code
COPY . .

# Build the project (frontend and backend)
RUN pnpm build

# Stage 2: Production
FROM node:24-alpine AS runner

# Install pnpm for production dependencies
RUN npm install -g pnpm

WORKDIR /app

# Set environment to production
ENV NODE_ENV=production

# Copy built files from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/pnpm-lock.yaml ./pnpm-lock.yaml

# Install only production dependencies
# Note: Since esbuild uses --packages=external, we need production node_modules
RUN pnpm install --prod --frozen-lockfile

# Expose the application port (default for Redroom is usually 3000 or what's in env)
EXPOSE 5000

# Start the application
CMD ["pnpm", "start"]
