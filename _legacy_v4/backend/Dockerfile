# --- Build stage ---
FROM node:22-bullseye-slim AS build
WORKDIR /app/backend

# deps (с devDeps за tsc)
COPY backend/package*.json ./
RUN npm ci --no-audit --fund=false

# source
COPY backend/ ./

# компилация + зависимост към Arduino (нужно от твоята система)
WORKDIR /app
COPY Arduino /app/Arduino
RUN test -f /app/Arduino/generator-config.json

# build
WORKDIR /app/backend
RUN npm run build

# --- Runtime stage ---
FROM node:22-bullseye-slim
ENV NODE_ENV=production

# 1) Копирай конфигурациите на мястото, от което dist ги очаква
WORKDIR /app
COPY config ./config

# 2) Backend runtime
WORKDIR /app/backend
COPY --from=build /app/backend/dist ./dist
COPY --from=build /app/backend/package*.json ./
RUN npm ci --omit=dev --no-audit --fund=false

# 3) Arduino (ако не го монтираме с volume)
WORKDIR /app
COPY Arduino /app/Arduino
WORKDIR /app/backend

EXPOSE 5000
CMD ["node", "dist/app.js"]

