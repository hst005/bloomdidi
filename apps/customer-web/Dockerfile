# BloomDidi customer web (static Vite build)
FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json .npmrc ./
COPY packages/shared ./packages/shared
COPY packages/design ./packages/design
COPY apps/customer-web ./apps/customer-web

RUN npm ci --workspace=@bloomdidi/customer-web --include-workspace-root
RUN npm run build -w @bloomdidi/shared

ARG VITE_API_URL
ARG VITE_API_ORIGIN
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_API_ORIGIN=$VITE_API_ORIGIN

RUN npm run build -w @bloomdidi/customer-web

FROM node:20-alpine
WORKDIR /app
RUN npm install -g serve@14
COPY --from=builder /app/apps/customer-web/dist ./dist
EXPOSE 8080
CMD ["sh", "-c", "serve dist -s -p ${PORT:-8080}"]
