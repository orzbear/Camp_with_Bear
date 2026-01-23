FROM node:20-alpine
WORKDIR /app
# Copy package files from api directory (build context is project root)
COPY api/package*.json ./
RUN npm ci
# Copy api source code
COPY api/ .
RUN npm run build
EXPOSE 8080
ENV PORT=8080
CMD ["node", "dist/index.js"]

