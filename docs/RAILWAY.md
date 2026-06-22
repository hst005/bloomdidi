# Railway deployment (BloomDidi monorepo)

Each service uses the **repo root** as root directory and its own **Dockerfile**.

## @bloomdidi/api

| Setting | Value |
|---------|-------|
| Root directory | `/` |
| Dockerfile path | `apps/api/Dockerfile` |
| Custom build command | *(empty)* |
| Custom start command | *(empty)* |
| Public port | Match Railway **Variables → PORT** (do not hardcode; remove manual `PORT=3000` if set) |

Required variables: see `docs/BETTER_AUTH.md` and `apps/api/.env.example`.

## @bloomdidi/customer-web

| Setting | Value |
|---------|-------|
| Root directory | `/` |
| Dockerfile path | `apps/customer-web/Dockerfile` |
| Custom build / start | *(empty)* |

Build-time variables (Settings → Variables, or Docker build args):

```env
VITE_API_ORIGIN=https://bloomdidiapi-production.up.railway.app
VITE_API_URL=https://bloomdidiapi-production.up.railway.app/api/v1
```

Public port: match Railway `PORT` (often `3000` after deploy — check Deploy logs for `serve` listening port).

## @bloomdidi/vendor-dashboard

| Setting | Value |
|---------|-------|
| Dockerfile path | `apps/vendor-dashboard/Dockerfile` |

```env
VITE_API_URL=https://bloomdidiapi-production.up.railway.app/api/v1
```

## @bloomdidi/admin-dashboard

| Setting | Value |
|---------|-------|
| Dockerfile path | `apps/admin-dashboard/Dockerfile` |

```env
VITE_API_URL=https://bloomdidiapi-production.up.railway.app/api/v1
```

## Why frontends failed before

Railway ran `npm run build --workspace=@bloomdidi/customer-web` only. That skips `@bloomdidi/shared`, so TypeScript cannot resolve `@bloomdidi/shared`. The Dockerfiles build shared first, then the app.

## Order

1. Deploy **api** → confirm `/api/auth/ok` returns 200  
2. Set `VITE_*` on frontends with the API URL  
3. Deploy customer, vendor, admin  
4. Update API `CORS_ORIGINS` with frontend Railway URLs  
5. Connect Better Auth dashboard  
