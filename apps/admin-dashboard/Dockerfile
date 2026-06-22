# BloomDidi admin dashboard (static Vite build)
FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json* ./
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
EXPOSE 3000
CMD ["sh", "-c", "serve dist -s -l ${PORT:-3000}"]
