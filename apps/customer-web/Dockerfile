# BloomDidi customer web (static Vite build + nginx API proxy)
FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json .npmrc ./
COPY packages/shared ./packages/shared
COPY packages/design ./packages/design
COPY apps/customer-web ./apps/customer-web

RUN npm ci --workspace=@bloomdidi/customer-web --include-workspace-root
RUN npm run build -w @bloomdidi/shared
RUN npm run build -w @bloomdidi/customer-web

FROM nginx:1.27-alpine
RUN apk add --no-cache gettext
COPY docker/frontend/nginx.conf.template /etc/nginx/templates/default.conf.template
COPY docker/frontend/docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh
COPY --from=builder /app/apps/customer-web/dist /usr/share/nginx/html
EXPOSE 8080
CMD ["/docker-entrypoint.sh"]
