# BloomDidi — Architecture

> A two-sided marketplace for local florists (Zomato/Swiggy-style), optimized for scheduled delivery, perishable inventory, and customizable bouquets.

## Problem & solution

**Problem:** Local flower buying lacks discovery, real-time stock, price comparison, and reliable scheduled same-day delivery. Florists are offline-first with no digital storefront.

**Solution:** BloomDidi aggregates local florists into one platform. Customers browse nearby shops, see live inventory, customize bouquets, schedule delivery for occasions, and track orders. Vendors get a digital storefront, order dashboard, inventory control, and optional delivery fleet access.

## Key differentiators vs food delivery

| Constraint | Architectural impact |
|------------|---------------------|
| Scheduled delivery is primary | `SchedulingService`, `scheduled_for` on orders, vendor handoff at lead time |
| Perishable, low stock | Atomic stock decrement (Postgres row locks + Redis cache) |
| Customizable products | `customizations` + line-item config arrays |
| Gift recipient ≠ buyer | Separate delivery address, card message, surprise timing |

## System context

```
                         ┌─────────────────────────────┐
                         │      CLIENT LAYER            │
                         │  Customer App  Vendor App    │
                         │  Delivery App  Admin Panel   │
                         └──────────────┬──────────────┘
                                        │ HTTPS / WSS
                         ┌──────────────▼──────────────┐
                         │      API GATEWAY             │
                         │  (auth, rate-limit, routing) │
                         └──────────────┬──────────────┘
                                        │
        ┌──────────────┬───────────────┼───────────────┬──────────────┐
        ▼              ▼               ▼               ▼              ▼
   ┌─────────┐   ┌──────────┐    ┌──────────┐   ┌──────────┐   ┌──────────┐
   │  Auth   │   │ Catalog/ │    │  Order   │   │ Delivery/│   │ Payment  │
   │ Service │   │ Inventory│    │ Service  │   │ Tracking │   │ Service  │
   └────┬────┘   └────┬─────┘    └────┬─────┘   └────┬─────┘   └────┬─────┘
        │             │               │              │              │
   ┌────▼─────────────▼───────────────▼──────────────▼──────────────▼────┐
   │   PostgreSQL │ Redis │ Elasticsearch │ S3/Blob │ Kafka/Queue        │
   └─────────────────────────────────────────────────────────────────────┘
                                        │
                         ┌──────────────▼──────────────┐
                         │   3rd-PARTY / INFRA          │
                         │  Maps  Payments  SMS  Push   │
                         └─────────────────────────────┘
```

**Phase 1 implementation:** Modular monolith (`apps/api`) with clear module boundaries. Microservice extraction deferred until load demands it.

## Client surfaces

| Surface | Platform | Core job |
|---------|----------|----------|
| Customer app | Mobile + responsive web | Discover → customize → order → track |
| Vendor dashboard | Tablet/web (+ mobile alerts) | Receive → accept → prep → handoff |
| Delivery partner | Mobile (Phase 2) | Pickup → navigate → deliver |
| Admin panel | Web (Phase 2+) | Onboarding, KYC, disputes, analytics |

## Backend modules (Phase 1 monolith)

| Module | Responsibility |
|--------|----------------|
| `auth` | OTP phone login, JWT access + refresh, RBAC (customer/vendor/rider/admin) |
| `users` | Profile management |
| `shops` | Florist storefronts, geo location, delivery radius, open hours |
| `catalog` | Products, customizations, categories |
| `inventory` | Real-time stock, atomic decrement on order |
| `orders` | State machine, cart validation, line items |
| `scheduling` | Future-dated orders, vendor lead-time handoff |
| `payments` | Razorpay order creation, webhook handling, vendor payout stubs |
| `notifications` | Push/SMS/email stubs (FCM + MSG91 in production) |
| `health` | Liveness/readiness probes |

## Order state machine

```
PLACED → ACCEPTED → PREPARING → READY → PICKED_UP → OUT_FOR_DELIVERY → DELIVERED
   │         │                                                      │
   └─────────┴── SCHEDULED (future-dated, activated at lead time)  │
             └── CANCELLED / REFUNDED                               │
```

Valid transitions are enforced in `OrderService`. Each transition emits an internal event for notifications.

## Critical flow: order placement with atomic stock

```
Customer taps "Order"
  → Validate cart + delivery address
  → PaymentService creates Razorpay order
  → On payment success:
      BEGIN TXN
        → SELECT ... FOR UPDATE on product rows
        → Verify stock ≥ qty
        → Decrement stock atomically
        → Create order (status = PLACED or SCHEDULED)
      COMMIT
  → Emit order.placed event
  → Push notification to vendor
  → If scheduled: SchedulingService queues vendor alert at lead time
```

## Data model (core entities)

See `apps/api/prisma/schema.prisma` for the canonical schema. Summary:

- `users` — phone OTP auth, role
- `shops` — geo location (PostGIS), rating, delivery radius
- `products` — base price, stock_qty, availability
- `customizations` — add-ons with price deltas
- `orders` — status, scheduled_for, totals
- `order_items` — qty, customization snapshot JSON
- `addresses` — delivery locations (recipient may differ from buyer)
- `payments` — Razorpay refs, payout status
- `deliveries` — rider assignment (Phase 2)
- `reviews` — post-delivery ratings

## Tech stack

| Layer | Choice | Notes |
|-------|--------|-------|
| Customer/Vendor web | React + Vite + Tailwind | Fast iteration, shared component patterns |
| Mobile (Phase 2) | React Native | One codebase for iOS/Android |
| Backend | NestJS + Prisma | Structured modules, type-safe ORM |
| API style | REST (+ WebSocket in Phase 2) | Live tracking |
| Primary DB | PostgreSQL + PostGIS | Relational + geo queries |
| Cache | Redis | Sessions, stock counters, pub/sub |
| Search | PostGIS + SQL (Phase 1) | Elasticsearch in Phase 2 |
| Payments | Razorpay | UPI, cards, COD, vendor payouts |
| Hosting | Docker → Railway/AWS | Start simple, scale later |

## UI / UX motion principles

Flowers are visual and emotional — the customer app uses intentional motion:

- **Shared-element transitions** — bouquet card hero expands into product page
- **3D card flip** — price / "add card" on back of card
- **Parallax shop headers** — layered depth on scroll
- **Cart fly-to animation** — item arcs toward cart icon
- **Reduced motion** — `prefers-reduced-motion` disables heavy animations

Vendor dashboard stays calm and functional — speed over flair.

## Phased roadmap

### Phase 1 (this repo) — MVP production-ready

- Customer discovery + ordering + scheduling
- Vendor order dashboard + inventory CRUD
- Manual delivery (call local rider)
- Razorpay integration (stub + webhook structure)
- Modular monolith, Docker Compose

### Phase 2

- Live GPS tracking + delivery partner app
- Occasion reminders (SMS/push)
- Reviews & ratings
- Bouquet builder with customization UI

### Phase 3

- 3D bouquet preview (Three.js / R3F)
- Subscriptions ("flowers every Friday")
- Corporate/event orders, multi-city
- ML occasion recommendations

## ADRs

Architecture decisions are documented in [docs/adr/](./docs/adr/):

- [001-modular-monolith-phase1](./docs/adr/001-modular-monolith-phase1.md)
- [002-postgresql-postgis](./docs/adr/002-postgresql-postgis.md)
- [003-atomic-inventory](./docs/adr/003-atomic-inventory.md)
- [004-otp-jwt-auth](./docs/adr/004-otp-jwt-auth.md)
- [005-scheduled-delivery-first](./docs/adr/005-scheduled-delivery-first.md)
