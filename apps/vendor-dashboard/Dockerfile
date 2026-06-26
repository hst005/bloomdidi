# BloomDidi vendor dashboard (static Vite build + nginx API proxy)
FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json .npmrc ./
COPY packages/shared ./packages/shared
COPY packages/design ./packages/design
COPY apps/vendor-dashboard ./apps/vendor-dashboard

RUN npm ci --workspace=@bloomdidi/vendor-dashboard --include-workspace-root
RUN npm run build -w @bloomdidi/shared
RUN npm run build -w @bloomdidi/vendor-dashboard

FROM nginx:1.27-alpine
RUN apk add --no-cache gettext
COPY docker/frontend/nginx.conf.template /etc/nginx/templates/default.conf.template
COPY docker/frontend/docker-entrypoint.sh /usr/local/bin/bloomdidi-entrypoint.sh
RUN chmod +x /usr/local/bin/bloomdidi-entrypoint.sh
COPY --from=builder /app/apps/vendor-dashboard/dist /usr/share/nginx/html
EXPOSE 8080
CMD ["/usr/local/bin/bloomdidi-entrypoint.sh"]
