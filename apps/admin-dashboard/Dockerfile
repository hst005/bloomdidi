# BloomDidi admin dashboard (static Vite build)
FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json .npmrc ./
COPY packages/design ./packages/design
COPY apps/admin-dashboard ./apps/admin-dashboard

RUN npm ci --workspace=@bloomdidi/admin-dashboard --include-workspace-root

ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build -w @bloomdidi/admin-dashboard

FROM node:20-alpine
WORKDIR /app
RUN npm install -g serve@14
COPY --from=builder /app/apps/admin-dashboard/dist ./dist
EXPOSE 8080
CMD ["sh", "-c", "serve dist -s -p ${PORT:-8080}"]
