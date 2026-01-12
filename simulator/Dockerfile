FROM node:20-alpine

WORKDIR /app

# Copy shared
COPY shared ./shared
COPY backend/config ./backend/config

# Copy simulator files
COPY simulator/package.json ./simulator/
COPY simulator/tsconfig.json ./simulator/

WORKDIR /app/simulator
RUN npm install

COPY simulator/src ./src
COPY simulator/public ./public
COPY simulator/scenarios ./scenarios
COPY simulator/data ./data

# Build
RUN npm run build

# Simulator usually runs a script. Let's assume npm start runs it.
CMD ["npm", "start"]
