FROM node:20-alpine
WORKDIR /app
COPY api/package*.json ./
RUN npm ci
COPY api/ .
RUN npm run build
EXPOSE 8080
ENV PORT=8080
CMD ["node", "dist/index.js"]

