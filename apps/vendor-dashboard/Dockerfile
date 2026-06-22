# BloomDidi vendor dashboard (static Vite build)
FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json .npmrc ./
COPY packages/shared ./packages/shared
COPY packages/design ./packages/design
COPY apps/vendor-dashboard ./apps/vendor-dashboard

RUN npm ci --workspace=@bloomdidi/vendor-dashboard --include-workspace-root
RUN npm run build -w @bloomdidi/shared

ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build -w @bloomdidi/vendor-dashboard

FROM node:20-alpine
WORKDIR /app
RUN npm install -g serve@14
COPY --from=builder /app/apps/vendor-dashboard/dist ./dist
EXPOSE 8080
CMD ["sh", "-c", "serve dist -s -p ${PORT:-8080}"]
