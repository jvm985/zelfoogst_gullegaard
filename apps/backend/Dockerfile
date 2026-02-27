# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root workspace and backend files
COPY package.json package-lock.json ./
COPY apps/backend/package.json ./apps/backend/
COPY apps/backend/tsconfig.json ./apps/backend/
COPY apps/backend/prisma ./apps/backend/prisma

# Install ALL dependencies (including root and workspace)
RUN npm install

# Copy source
COPY apps/backend ./apps/backend

# Generate Prisma Client and build
WORKDIR /app/apps/backend
RUN npx prisma generate
RUN npx tsc

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy all node_modules and built code
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/backend/package.json ./apps/backend/
COPY --from=builder /app/apps/backend/dist ./dist
COPY --from=builder /app/apps/backend/prisma ./apps/backend/prisma

EXPOSE 3001

CMD ["node", "dist/index.js"]
