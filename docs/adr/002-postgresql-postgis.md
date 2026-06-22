# ADR 002: PostgreSQL with PostGIS

## Status

Accepted

## Context

BloomDidi requires relational data (orders, payments, users) and geo queries ("florists within 5 km"). Options considered:

1. PostgreSQL + PostGIS extension
2. PostgreSQL + Elasticsearch for geo/search
3. MongoDB with geospatial indexes

## Decision

Use **PostgreSQL 16 with PostGIS** as the primary database for Phase 1.

- Shop locations stored as `geometry(Point, 4326)` or lat/lng decimals with PostGIS `ST_DWithin` queries
- Prisma for schema migrations and type-safe queries
- Elasticsearch deferred to Phase 2 for full-text discovery and advanced filters

## Consequences

**Positive:**

- Single source of truth for transactional and geo data
- ACID guarantees for order + inventory operations
- Mature ecosystem, easy Docker setup via `postgis/postgis` image

**Negative:**

- Complex full-text search and faceted filters less ergonomic than Elasticsearch
- PostGIS queries require raw SQL or Prisma `$queryRaw` for optimal geo performance
