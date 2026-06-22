# BloomDidi API Reference

Base path: `/api/v1` · Auth: `Authorization: Bearer <jwt>`

## Implemented ✅

### Auth
| Method | Path | Access | Notes |
|--------|------|--------|-------|
| POST | `/auth/otp/send` | public | Rate-limited |
| POST | `/auth/otp/verify` | public | Returns JWT + role |
| POST | `/auth/refresh` | any | |
| POST | `/auth/logout` | any | |

### Customer — discovery
| Method | Path | Access | Notes |
|--------|------|--------|-------|
| GET | `/florists` | public | **PostGIS double-radius query** — `lat`, `lng`, `sort`, `q`, `maxPrice` |
| GET | `/shops/discover` | public | Legacy alias (Haversine) |
| GET | `/shops/:id` | public | Florist profile |
| GET | `/catalog/shops/:shopId/products` | public | Catalogue |

### Customer — orders
| Method | Path | Access | Notes |
|--------|------|--------|-------|
| POST | `/orders` | customer | Single-vendor, COD stub |
| GET | `/orders/mine` | customer | |
| GET | `/orders/:id` | customer/vendor | |
| GET | `/users/me/addresses` | customer | |

### Vendor
| Method | Path | Access | Notes |
|--------|------|--------|-------|
| GET | `/shops/vendor/mine` | vendor | |
| GET | `/orders/shop/:shopId` | vendor | Live queue |
| PATCH | `/orders/:id/status` | vendor | Lifecycle transitions |
| GET | `/catalog/shops/:shopId/products/manage` | vendor | Incl. unavailable |
| PATCH | `/catalog/products/:id` | vendor | Stock, price, availability |

### Admin
| Method | Path | Access | Notes |
|--------|------|--------|-------|
| GET | `/admin/dashboard` | admin | KPIs |
| GET | `/admin/settings` | admin | Radius, commission, fees |
| PATCH | `/admin/settings` | admin | **Discovery radius slider** |
| GET | `/admin/vendors` | admin | Filter by status |
| POST | `/admin/vendors/:id/approve` | admin | |
| POST | `/admin/vendors/:id/suspend` | admin | |
| POST | `/admin/vendors/:id/reactivate` | admin | |

### Webhooks
| Method | Path | Notes |
|--------|------|-------|
| POST | `/payments/webhooks/razorpay` | Stub — verify signature in prod |

---

## Planned (from product spec) ⏳

### Customer
- `GET/POST/PATCH/DELETE /addresses`
- Server-side `GET/POST/PATCH/DELETE /cart/*`
- `POST /payments/create-order`, `POST /payments/verify`
- `GET /orders/:id/track`, `POST /orders/:id/review`

### Vendor (granular routes)
- `POST /vendor/orders/:id/accept|reject|preparing|ready|...`
- `GET /vendor/earnings`, `GET /vendor/payouts`
- `PATCH /vendor/store/radius`, `PATCH /vendor/store/status`

### Admin
- `GET /admin/orders`, disputes, reports, payout settlement

---

## Response envelope (target)

```json
{ "data": {}, "error": null, "meta": { "page": 1, "total": 42 } }
```

Currently most endpoints return raw objects — envelope to be added in Phase 2.
