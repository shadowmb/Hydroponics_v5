# --- Build image ---
FROM node:18-bullseye-slim AS build
WORKDIR /app/frontend

# 1) deps
COPY frontend/package*.json ./
RUN npm ci --no-audit --fund=false

# 2) source
COPY frontend ./

# 3) сложи външните конфигурации над фронтенда
WORKDIR /app
COPY config ./config
COPY Arduino /app/Arduino
RUN test -f /app/Arduino/generator-config.json

# 4) build SPA
WORKDIR /app/frontend
RUN npx quasar build --debug

# --- Runtime image ---
FROM node:18-bullseye-slim
WORKDIR /app/frontend
RUN npm i -g serve@14 --no-audit --fund=false

# само статиките от build етапа
COPY --from=build /app/frontend/dist ./dist

EXPOSE 3000
CMD ["serve", "-s", "dist/spa", "-l", "3000"]
