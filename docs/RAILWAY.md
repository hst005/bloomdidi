# Railway deployment (BloomDidi monorepo)

Each service uses the **repo root** as root directory and its own **Dockerfile**.

## Services checklist

| Service | Dockerfile | Public URL (example) |
|---------|------------|------------------------|
| `@bloomdidi/api` | `apps/api/Dockerfile` | `https://bloomdidiapi-production.up.railway.app` |
| `@bloomdidi/customer-web` | `apps/customer-web/Dockerfile` | `https://bloomdidicustomer-web-production.up.railway.app` |
| `@bloomdidi/vendor-dashboard` | `apps/vendor-dashboard/Dockerfile` | `https://bloomdidivendor-dashboard-production.up.railway.app` |
| `@bloomdidi/admin-dashboard` | `apps/admin-dashboard/Dockerfile` | **Create this service** — 404 means it is not deployed yet |

## @bloomdidi/api

| Setting | Value |
|---------|-------|
| Root directory | `/` |
| Dockerfile path | `apps/api/Dockerfile` |
| Custom build command | *(empty)* |
| Custom start command | *(empty)* |
| Public port | Match Railway **Variables → PORT** (usually **8080**) |

Required variables: see `docs/BETTER_AUTH.md` and `apps/api/.env.example`.

**CORS:** The API auto-allows any `*.up.railway.app` origin. You can still set explicit URLs:

```env
CORS_ORIGINS=https://bloomdidicustomer-web-production.up.railway.app,https://bloomdidivendor-dashboard-production.up.railway.app,https://bloomdidiadmin-dashboard-production.up.railway.app
```

After first deploy, seed the database (Railway → API service → Shell):

```bash
npx prisma db seed
```

## Frontends (customer, vendor, admin)

| Setting | Value |
|---------|-------|
| Root directory | `/` |
| Dockerfile path | `apps/<app>/Dockerfile` |
| Custom build / start | *(empty)* |
| Public port | Match Railway **PORT** (usually **8080**) |

**Runtime variable** (Settings → Variables — no rebuild needed when API URL changes):

```env
API_UPSTREAM=https://bloomdidiapi-production.up.railway.app
```

Frontends proxy `/api/*` to the API via nginx, so the browser calls same-origin `/api/v1/...` — no CORS issues.

`VITE_API_URL` / `VITE_API_ORIGIN` at build time are **optional** (local dev still uses Vite proxy on port 5173–5175).

## Deploy admin dashboard (if you see Railway 404)

1. Railway project → **New service** → **GitHub repo** → same `bloomdidi` repo  
2. Settings → **Dockerfile path**: `apps/admin-dashboard/Dockerfile`  
3. Variables → `API_UPSTREAM=https://bloomdidiapi-production.up.railway.app`  
4. Networking → generate domain on port **8080**  
5. Redeploy  

## Verify

1. API: `GET /api/auth/ok` → 200  
2. Customer: home page loads florists (or empty list after seed — not “Load failed”)  
3. Vendor: OTP login works (`+919876543210` / `123456` in dev seed)  
4. Admin: login page loads (`admin@bloomdidi.com` / `Admin@123456`)  

## Order

1. Deploy **api** → confirm `/api/auth/ok`  
2. Deploy customer + vendor (+ admin if missing)  
3. Set `API_UPSTREAM` on each frontend  
4. Seed production DB if feed is empty  
