# BloomDidi — Product Design Reference

> Swiggy/Zomato-style hyperlocal florist marketplace. Three portals, one API, one Postgres database.

See also: [API_REFERENCE.md](./API_REFERENCE.md) | [ARCHITECTURE.md](../ARCHITECTURE.md)

## Core mechanic: double-radius discovery

A florist appears in the customer feed only when **both** are true:

1. `distance(user, vendor) ≤ admin.global_discovery_radius_km` (platform ceiling)
2. `distance(user, vendor) ≤ vendor.service_radius_km` (vendor willingness to deliver)

Implemented in `GeoService` via PostGIS `ST_DWithin` (with Haversine fallback).

**API:** `GET /api/v1/florists?lat=&lng=&sort=&q=&maxPrice=`

## Locked-in decisions

| Decision | Why |
|----------|-----|
| Single-vendor cart | One florist fulfils and delivers; clean payouts |
| `price_at_order` snapshot (`order_items.unit_price`) | Price edits don't rewrite history |
| Webhook-as-source-of-truth for Razorpay | Client success calls can be spoofed |
| Commission stored in settings (default 0%) | Admin can enable later without code changes |

## Three portals

| Portal | Port | Users |
|--------|------|-------|
| Customer | 5173 | Browse, order, track |
| Vendor | 5174 | Orders, catalogue, payouts |
| Admin | 5175 | Radius, commission, vendor approval |

## Order lifecycle

```
ACCEPTED → PREPARING → READY → OUT_FOR_DELIVERY → DELIVERED
     └── REJECTED/CANCELLED → REFUND
```

Vendor status buttons drive customer tracking. Reject at accept → auto-refund (Phase 2 Razorpay).

## Build phases

1. ✅ Auth, vendor onboarding, product CRUD, admin approval
2. ✅ Location + radius discovery + florist feed
3. 🔄 Cart, checkout, Razorpay (COD stub live)
4. 🔄 Order lifecycle + notifications
5. ⏳ Payouts + commission settlement
6. ⏳ Reviews, search, delivery partner

## Demo accounts

| Role | Login | Credentials |
|------|-------|-------------|
| Customer | Phone OTP | +919123456789 / 123456 |
| Lily & Co Florals | Phone OTP | +919876543210 / 123456 |
| Petal Hub | Phone OTP | +919876543211 / 123456 |
| Admin | Email + password | admin@bloomdidi.com / Admin@123456 |

## PostGIS (optional, recommended)

```bash
brew install postgis
psql bloomdidi -c "CREATE EXTENSION IF NOT EXISTS postgis;"
```

Without PostGIS, discovery uses Haversine with the same double-radius logic.
