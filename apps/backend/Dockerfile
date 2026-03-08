# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy the entire project to ensure monorepo structure is preserved
COPY . .

# Install all dependencies
RUN npm install

# Generate Prisma Client
WORKDIR /app/apps/backend
RUN npx prisma generate --schema=prisma/schema.prisma

# Build the application
RUN npx tsc

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy the entire app directory from builder to production stage
# to ensure all hoisted dependencies and workspace symlinks are preserved
COPY --from=builder /app /app

EXPOSE 3001

# Start the app from the backend directory
WORKDIR /app/apps/backend
CMD ["node", "dist/index.js"]
