# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy the entire project
COPY . .

# Install all dependencies (from root)
RUN npm install

# Generate Prisma Client
WORKDIR /app/apps/backend
RUN npx prisma generate --schema=prisma/schema.prisma

# Build the application
RUN npx tsc

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy the entire build context
COPY --from=builder /app /app

EXPOSE 3000

# Start the app from the backend directory
WORKDIR /app/apps/backend
CMD ["node", "dist/index.js"]
