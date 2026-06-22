# ADR 003: Atomic Inventory with Row-Level Locking

## Status

Accepted

## Context

Florists may have only a handful of a given bouquet in stock. Two customers ordering the last item simultaneously must not both succeed. Food delivery apps face similar race conditions but flowers have lower stock counts, making overselling more likely and more damaging (occasion-critical orders).

## Decision

Decrement inventory **atomically inside the order placement transaction** using PostgreSQL row-level locks:

```sql
SELECT stock_qty FROM products WHERE id = $1 FOR UPDATE;
-- verify stock_qty >= requested qty
UPDATE products SET stock_qty = stock_qty - $qty WHERE id = $1;
```

Implementation in `InventoryService.decrementStock()` called from `OrderService.placeOrder()` within a Prisma interactive transaction.

**Redis stock counters** may be added in Phase 2 as a fast-read cache with periodic reconciliation to Postgres. Phase 1 uses Postgres-only for correctness simplicity.

## Consequences

**Positive:**

- No overselling under concurrent load within a single DB
- Simple mental model, no cache invalidation bugs in MVP

**Negative:**

- Row locks under high contention on popular SKUs may increase latency
- Redis cache layer needed at scale for read-heavy catalog browsing

## Rejection criteria

If p99 order placement latency exceeds 500ms due to lock contention, introduce Redis atomic counters with async reconciliation.
