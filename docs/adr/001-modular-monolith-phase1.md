# ADR 001: Modular Monolith for Phase 1

## Status

Accepted

## Context

BloomDidi has many bounded contexts (auth, catalog, orders, payments, scheduling, delivery, notifications). A full microservices deployment adds operational overhead (service discovery, distributed tracing, inter-service auth) before product-market fit is validated.

## Decision

Implement Phase 1 as a **modular monolith** in NestJS (`apps/api`) with strict module boundaries:

- Each domain is a NestJS module with its own controller, service, and DTOs
- Modules communicate via injected services or an in-process event emitter — not HTTP between modules
- Database is shared (single PostgreSQL instance) with Prisma as ORM
- Module boundaries mirror future microservice cut lines

## Consequences

**Positive:**

- Single deploy artifact, simpler local dev and CI
- ACID transactions across order + inventory + payment in one DB connection
- Faster iteration for MVP

**Negative:**

- Must enforce module boundaries via code review (no "reach into" other modules' internals)
- Scaling requires vertical scaling first; extract hot paths (e.g. notifications) when metrics demand it

## Extraction triggers

Split a module into a separate service when:

- Independent scaling need (e.g. notification fan-out)
- Different deployment cadence or team ownership
- Resource isolation requirement (CPU-heavy search indexing)
