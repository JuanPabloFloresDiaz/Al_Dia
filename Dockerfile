# ---------------------------------------------------------------------------
# Al Día: imagen del sitio. Tiene dos "targets":
#   produccion  -> sitio ya compilado servido por nginx (el que se publica).
#   desarrollo  -> servidor de Vite con recarga automática (para programar).
# ---------------------------------------------------------------------------

# Paso común: instala las dependencias una sola vez (se reutiliza la caché de Docker).
FROM node:24-alpine AS dependencias
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# Target "desarrollo": el código se monta desde tu carpeta (ver docker-compose.yml).
FROM dependencias AS desarrollo
ENV NODE_ENV=development
EXPOSE 5173
CMD ["npm", "run", "dev"]

# Compila el sitio a archivos estáticos dentro de /app/dist.
FROM dependencias AS construccion
COPY . .
RUN npm run build

# Target "produccion": solo nginx con los archivos compilados (imagen pequeña).
FROM nginx:1.27-alpine AS produccion
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=construccion /app/dist /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s --retries=3 CMD wget -qO /dev/null http://127.0.0.1/ || exit 1
