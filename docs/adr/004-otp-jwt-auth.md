# ADR 004: OTP Phone Login with JWT

## Status

Accepted

## Context

Indian marketplace apps standardize on phone OTP login (no password friction). BloomDidi serves customers, vendors, riders, and admins — all identifiable by phone with role-based access.

## Decision

- **Login flow:** `POST /auth/otp/send` → SMS OTP → `POST /auth/otp/verify` → issue JWT pair
- **Access token:** Short-lived (15 min), carries `sub`, `role`, `phone`
- **Refresh token:** Long-lived (7 days), stored hashed in DB, rotatable
- **Dev mode:** Fixed OTP `123456` when `NODE_ENV=development` and no SMS provider configured
- **Production:** MSG91 or Twilio via `SmsProvider` interface

RBAC enforced via NestJS `@Roles()` guard on route handlers.

## Consequences

**Positive:**

- Familiar UX for Indian users
- Stateless API scaling with JWT (refresh token in DB for revocation)

**Negative:**

- SMS delivery cost and reliability dependency
- Phone number as sole identifier — account recovery tied to SIM

## Security notes

- Rate-limit OTP send (5/hour per phone)
- Hash refresh tokens at rest
- Never log OTP values in production
