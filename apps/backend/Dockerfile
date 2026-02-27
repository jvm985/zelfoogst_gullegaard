# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root workspace files
COPY package.json package-lock.json ./
COPY apps/backend/package.json ./apps/backend/
COPY apps/backend/tsconfig.json ./apps/backend/

# Install dependencies
RUN npm install

# Copy source
COPY apps/backend ./apps/backend

# Build backend
WORKDIR /app/apps/backend
RUN npx prisma generate
RUN npx tsc

# Production stage
FROM node:20-alpine

WORKDIR /app

# In a monorepo, most dependencies are in the root node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/backend/package.json ./apps/backend/
COPY --from=builder /app/apps/backend/dist ./dist

# Copy prisma folder for migrations
COPY --from=builder /app/apps/backend/prisma ./apps/backend/prisma

EXPOSE 3001

CMD ["node", "dist/index.js"]
