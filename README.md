# BloomDidi

A Zomato/Swiggy-style marketplace for local florists — discover nearby shops, customize bouquets, schedule delivery, and track orders end to end.

## Monorepo structure

```
bloomdidi/
├── apps/
│   ├── api/                 # NestJS modular monolith (Phase 1)
│   ├── customer-web/        # Customer discovery & ordering (React + Vite)
│   └── vendor-dashboard/    # Vendor order queue & inventory (React + Vite)
├── packages/
│   └── shared/              # Shared types, validation, constants
├── docs/adr/                # Architecture Decision Records
├── ARCHITECTURE.md
└── docker-compose.yml       # PostgreSQL (PostGIS) + Redis
```

## Prerequisites

- Node.js 20+
- Docker & Docker Compose

## Quick start

### Option A — No Docker (Homebrew PostgreSQL on Mac)

If you already have Postgres via Homebrew (most Mac dev setups):

```bash
cd ~/Library/Mobile\ Documents/com~apple~CloudDocs/Cursor/bloomdidi
npm run setup:local
```

Then start the apps (3 separate terminals):

```bash
npm run dev:api        # http://localhost:3000
npm run dev:customer   # http://localhost:5173
npm run dev:vendor     # http://localhost:5174
```

Don't have Postgres yet?

```bash
brew install postgresql@16
brew services start postgresql@16
npm run setup:local
```

### Option B — With Docker

```bash
cd ~/Library/Mobile\ Documents/com~apple~CloudDocs/Cursor/bloomdidi
npm run docker:up      # requires Docker Desktop
npm install
npm run build -w @bloomdidi/shared
cp apps/api/.env.example apps/api/.env
npm run db:migrate
npm run db:seed
```

## Demo accounts

Run `npm run db:seed` to reset demo data. Dev OTP for all phone logins: **123456**

| Role | Login | Credentials |
|------|-------|-------------|
| **Customer** | Phone OTP | `+919123456789` |
| **Lily & Co Florals** | Phone OTP | `+919876543210` |
| **Petal Hub** | Phone OTP | `+919876543211` |
| **Admin** | Email + password | `admin@bloomdidi.com` / `Admin@123456` |

Admin portal: `npm run dev:admin` → http://localhost:5175 — change password after login under **Change password**.

Each florist has 6 menu items with add-ons. Vendor dashboard login shows quick-select buttons for both florist accounts.

## Phase 1 scope

| Surface | Features |
|---------|----------|
| **Customer web** | Geo discovery, shop pages, cart, checkout, scheduling, order history |
| **Vendor dashboard** | Live order queue, accept/prepare/ready flow, inventory CRUD |
| **API** | OTP auth, catalog, atomic inventory, order state machine, Razorpay stubs, scheduling |
| **Infra** | PostgreSQL + PostGIS, Redis, Docker Compose |

## Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md) — system design overview
- [docs/adr/](./docs/adr/) — architecture decision records

## Production checklist

- [ ] Set strong `JWT_SECRET`, `JWT_REFRESH_SECRET` in API env
- [ ] Configure Razorpay live keys (`RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`)
- [ ] Wire MSG91/Twilio for OTP SMS
- [ ] Configure FCM for push notifications
- [ ] Deploy API behind HTTPS with rate limiting
- [ ] Run `npm run build` and serve static frontends via CDN/nginx
