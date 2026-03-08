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
RUN echo 'server { \
    listen 80; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html index.htm; \
        try_files $uri $uri/ /index.html; \
    } \
    location /api { \
        proxy_pass http://backend:3000; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
