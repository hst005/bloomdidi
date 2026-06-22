# ADR 005: Scheduled Delivery as First-Class

## Status

Accepted

## Context

Unlike food delivery where immediacy is default, flower orders are often placed days ahead for anniversaries, funerals, and Valentine's Day. The order model must treat `scheduled_for` as a primary field, not an optional add-on.

## Decision

1. Every order has optional `scheduled_for` timestamp (UTC). Null = deliver ASAP (same-day window).
2. Orders with future `scheduled_for` start in `SCHEDULED` status instead of immediately alerting vendor for prep.
3. `SchedulingService` runs a cron/interval job that:
   - Finds orders where `scheduled_for - lead_time <= now()` and status = `SCHEDULED`
   - Transitions to `PLACED` and notifies vendor
4. Default vendor lead time: 2 hours before scheduled delivery (configurable per shop in Phase 2).
5. Checkout UI defaults to date/time picker, with "Deliver today" as a quick option.

## Consequences

**Positive:**

- Matches real florist business patterns
- Reduces vendor noise for far-future orders
- Enables occasion reminder marketing (Phase 2)

**Negative:**

- Requires background job infrastructure (NestJS `@nestjs/schedule` in Phase 1)
- Cancellation/refund policies for scheduled orders need clear product rules

## Data model

```prisma
model Order {
  scheduledFor DateTime? @map("scheduled_for")
  status       OrderStatus // includes SCHEDULED
}
```
