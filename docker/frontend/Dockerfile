# Build stage
FROM node:20-alpine AS build
WORKDIR /app
# Copy package files from frontend directory (build context is project root)
COPY frontend/package*.json ./
RUN npm ci
# Copy frontend source code
COPY frontend/ .
# Vite environment variables must be set at build time
# Default to /api for ALB routing (can be overridden with --build-arg)
# For local dev, use: docker build --build-arg VITE_API_BASE=http://localhost:8080
ARG VITE_API_BASE=/api
ENV VITE_API_BASE=$VITE_API_BASE
# Verify environment variable is set correctly
RUN echo "Building with VITE_API_BASE=$VITE_API_BASE"
# Build without cache to ensure fresh build
RUN npm run build

# Serve stage
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
RUN echo 'server { listen 3000; root /usr/share/nginx/html; index index.html; location / { try_files $uri $uri/ /index.html; } }' > /etc/nginx/conf.d/default.conf
EXPOSE 3000
CMD ["nginx", "-g", "daemon off;"]

