# BloomDidi API
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json .npmrc ./
COPY packages/shared ./packages/shared
COPY apps/api ./apps/api
RUN npm ci --workspace=@bloomdidi/api --include-workspace-root
RUN npm run build -w @bloomdidi/shared
RUN npm run prisma:generate -w @bloomdidi/api
RUN npm run build -w @bloomdidi/api

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json .npmrc ./
COPY packages/shared/package.json packages/shared/
COPY --from=builder /app/packages/shared/dist packages/shared/dist
COPY apps/api/package.json apps/api/
COPY --from=builder /app/apps/api/dist apps/api/dist
COPY --from=builder /app/apps/api/prisma apps/api/prisma
# Fresh prod install so workspace-scoped deps (e.g. @thallesp/nestjs-better-auth) land correctly
RUN npm ci --workspace=@bloomdidi/api --include-workspace-root --omit=dev
WORKDIR /app/apps/api
EXPOSE 3000
CMD ["sh", "-c", "npx prisma@6.19.3 migrate deploy && node dist/main.js"]
