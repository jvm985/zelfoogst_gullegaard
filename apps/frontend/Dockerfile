# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy workspace and lock files
COPY package.json package-lock.json ./
COPY apps/frontend/package.json ./apps/frontend/
COPY apps/frontend/tsconfig.json ./apps/frontend/
COPY apps/frontend/tsconfig.app.json ./apps/frontend/
COPY apps/frontend/tsconfig.node.json ./apps/frontend/
COPY apps/frontend/vite.config.ts ./apps/frontend/
COPY apps/frontend/postcss.config.js ./apps/frontend/
COPY apps/frontend/tailwind.config.js ./apps/frontend/

# Install dependencies
RUN npm install

# Copy source
COPY apps/frontend ./apps/frontend

# Build frontend
WORKDIR /app/apps/frontend
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy build files from builder stage
COPY --from=builder /app/apps/frontend/dist /usr/share/nginx/html

# Optional: Add nginx config if needed for SPA routing
RUN echo 'server { 
    listen 80; 
    location / { 
        root /usr/share/nginx/html; 
        index index.html index.htm; 
        try_files $uri $uri/ /index.html; 
    } 
    location /api { 
        proxy_pass http://backend:3001; 
    } 
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
