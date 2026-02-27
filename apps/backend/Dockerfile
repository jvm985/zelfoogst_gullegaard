# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy ALL workspace files for correct installation
COPY package.json package-lock.json ./
COPY apps/backend/package.json ./apps/backend/
COPY apps/backend/prisma ./apps/backend/prisma

# Install all dependencies (hoisting will happen here)
RUN npm install

# Copy backend source
COPY apps/backend ./apps/backend

# Generate Prisma Client and build
WORKDIR /app/apps/backend
RUN npx prisma generate
RUN npx tsc

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy root package.json and all node_modules (including .prisma client)
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/backend/package.json ./apps/backend/package.json
COPY --from=builder /app/apps/backend/dist ./dist
COPY --from=builder /app/apps/backend/prisma ./prisma

EXPOSE 3001

CMD ["node", "dist/index.js"]
