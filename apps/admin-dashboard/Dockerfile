# BloomDidi admin dashboard (static Vite build + nginx API proxy)
FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json .npmrc ./
COPY packages/design ./packages/design
COPY apps/admin-dashboard ./apps/admin-dashboard

RUN npm ci --workspace=@bloomdidi/admin-dashboard --include-workspace-root
RUN npm run build -w @bloomdidi/admin-dashboard

FROM nginx:1.27-alpine
RUN apk add --no-cache gettext
COPY docker/frontend/nginx.conf.template /etc/nginx/templates/default.conf.template
COPY docker/frontend/docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh
COPY --from=builder /app/apps/admin-dashboard/dist /usr/share/nginx/html
EXPOSE 8080
CMD ["/docker-entrypoint.sh"]
