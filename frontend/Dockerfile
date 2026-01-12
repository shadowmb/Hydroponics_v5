# Build Stage
FROM node:20-alpine as build

WORKDIR /app

# Set API URL for the build process (Vite replaces this at build time)
ENV VITE_API_URL=/api

# Copy shared dependencies
COPY shared ./shared

# Copy frontend definitions
COPY frontend/package.json ./frontend/
COPY frontend/tsconfig.json ./frontend/
COPY frontend/tsconfig.app.json ./frontend/
COPY frontend/tsconfig.node.json ./frontend/
COPY frontend/index.html ./frontend/
COPY frontend/vite.config.ts ./frontend/
COPY frontend/postcss.config.js ./frontend/
COPY frontend/tailwind.config.js ./frontend/
# If constants.ts exists, copy it. If not, this might fail unless we use glob or copy folder later.
# Safest is to just copy src later.

# Install dependencies
WORKDIR /app/frontend
RUN npm install

# Copy source code and public assets
COPY frontend/src ./src
COPY frontend/public ./public

# Build for production
RUN npm run build

# Production Stage
FROM nginx:alpine

# Remove default nginx static assets
RUN rm -rf /usr/share/nginx/html/*

# Copy built assets from the build stage
COPY --from=build /app/frontend/dist /usr/share/nginx/html

# Copy custom nginx config
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
