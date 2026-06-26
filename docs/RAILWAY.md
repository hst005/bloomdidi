# Railway deployment (BloomDidi monorepo)

Each service uses the **repo root** as root directory and its own **Dockerfile**.

## Services checklist

| Service | Dockerfile | Status check |
|---------|------------|--------------|
| `@bloomdidi/api` | `apps/api/Dockerfile` | `GET /api/auth/ok` → 200 |
| `@bloomdidi/customer-web` | `apps/customer-web/Dockerfile` | Home page loads |
| `@bloomdidi/vendor-dashboard` | `apps/vendor-dashboard/Dockerfile` | Login page loads |
| `@bloomdidi/admin-dashboard` | `apps/admin-dashboard/Dockerfile` | Login page loads |

---

## Admin dashboard — 404 or 502 fix

**404 “The train has not arrived”** = service/domain not linked yet.  
**502 “Application failed to respond”** = container crashed or wrong builder/port.

### Railway settings (admin service)

| Setting | Value |
|---------|-------|
| **Root directory** | `/` (repo root — **not** `apps/admin-dashboard`) |
| **Builder** | Dockerfile |
| **Dockerfile path** | `apps/admin-dashboard/Dockerfile` |
| **Custom build command** | *(empty)* |
| **Custom start command** | *(empty)* |
| **Config file** *(optional)* | `apps/admin-dashboard/railway.toml` |

### Variables (admin only needs this)

```env
API_UPSTREAM=https://bloomdidiapi-production.up.railway.app
```

**Do NOT add** `POSTGRES_*` or `REDIS_PORT` on frontends — Railway suggests those from `docker-compose.yml` for **local dev only**. They belong on the Postgres/Redis/API services, not admin/customer/vendor.

### Networking

1. Open **Settings → Networking**
2. Generate domain if missing
3. Port = **8080** (or whatever Railway shows in **Variables → PORT**)

### Redeploy

After changing settings: **Deployments → Redeploy**.  
In **Deploy logs** you should see Docker build steps (`nginx:1.27-alpine`, `npm run build -w @bloomdidi/admin-dashboard`).  
If you see Nixpacks/Railpack instead, the Dockerfile path is wrong.

---

## @bloomdidi/api

| Setting | Value |
|---------|-------|
| Root directory | `/` |
| Dockerfile path | `apps/api/Dockerfile` |
| Custom build / start | *(empty)* |
| Public port | Match Railway **PORT** (usually **8080**) |

Required variables: see `docs/BETTER_AUTH.md` and `apps/api/.env.example`.

Connect Railway Postgres → set `DATABASE_URL` on the **API** service (not frontends).

Optional seed (API shell): `npx prisma db seed` — demo shops also auto-create on first request.

---

## Frontends (customer, vendor, admin)

| Setting | Value |
|---------|-------|
| Root directory | `/` |
| Dockerfile path | `apps/<app>/Dockerfile` |
| Custom build / start | *(empty)* |

Runtime variable:

```env
API_UPSTREAM=https://bloomdidiapi-production.up.railway.app
```

Frontends proxy `/api/*` to the API via nginx (same-origin, no CORS).

---

## Demo logins

| Portal | Credentials |
|--------|-------------|
| Customer | `+919123456789` / OTP `123456` |
| Vendor | `+919876543210` / OTP `123456` |
| Admin | `admin@bloomdidi.com` / `Admin@123456` |

Admin login requires API DB with admin user — run `npx prisma db seed` on API if login fails.

---

## Deploy order

1. Postgres + Redis (or Railway plugins) → API with `DATABASE_URL`, `REDIS_URL`
2. Deploy **api** → `/api/auth/ok` returns 200
3. Deploy customer, vendor, admin with `API_UPSTREAM`
4. Set API `CORS_ORIGINS` to frontend URLs *(optional — `*.up.railway.app` auto-allowed)*
