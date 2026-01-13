# Use Node.js 20 Alpine for a lightweight image
FROM node:20-alpine

# Create app directory
WORKDIR /app

# Copy shared dependencies first (better caching)
# Note: The context must be the project root
COPY shared ./shared

# Copy backend specific files
COPY backend/package.json ./backend/
COPY backend/tsconfig.json ./backend/

# Install dependencies
WORKDIR /app/backend
RUN npm install

# Copy source code and firmware
COPY backend/config ./config
COPY backend/src ./src
COPY firmware /app/firmware

# Build the application
RUN npm run build

# Expose the API port
EXPOSE 3000

# Start command
CMD ["npm", "run", "start:docker"]
