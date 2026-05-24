# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy the entire project
COPY . .

# Install dependencies (from root)
RUN npm install

# Build frontend
WORKDIR /app/apps/frontend
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy build files from builder stage
COPY --from=builder /app/apps/frontend/dist /usr/share/nginx/html

# SPA configuration for Nginx
# Docker's embedded DNS resolver (127.0.0.11) lets nginx re-resolve `backend`
# at runtime, so recreating the backend container (new IP) doesn't require
# a frontend restart.
RUN echo 'server { \
    listen 80; \
    resolver 127.0.0.11 valid=10s ipv6=off; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html index.htm; \
        try_files $uri $uri/ /index.html; \
    } \
    location /api { \
        set $upstream_backend backend:3000; \
        proxy_pass http://$upstream_backend; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
