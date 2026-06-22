# Better Auth in BloomDidi

BloomDidi uses [Better Auth](https://www.better-auth.com) for customer phone OTP login, with legacy JWT kept for vendor/admin during migration.

## Endpoints

| Path | Purpose |
|------|---------|
| `POST /api/auth/phone-number/send-otp` | Send OTP (Better Auth) |
| `POST /api/auth/phone-number/verify` | Verify OTP + create session |
| `GET /api/auth/get-session` | Current session |
| `POST /api/auth/sign-out` | Logout |

Legacy routes (still active for vendor/admin):

| Path | Purpose |
|------|---------|
| `POST /api/v1/auth/otp/send` | Legacy OTP |
| `POST /api/v1/auth/otp/verify` | Legacy JWT tokens |
| `POST /api/v1/auth/admin/login` | Admin email/password |

## Environment

Add to `apps/api/.env`:

```env
BETTER_AUTH_SECRET=<32+ char secret — openssl rand -base64 32>
BETTER_AUTH_URL=http://localhost:3000
BETTER_AUTH_API_KEY=<from Better Auth Infrastructure dashboard>
```

## Better Auth Infrastructure dashboard

1. Install is already done: `@better-auth/infra` with the `dash()` plugin in `apps/api/src/lib/better-auth.ts`
2. Add your API key to `apps/api/.env`:
   ```env
   BETTER_AUTH_API_KEY=ba_...
   ```
3. Restart the API: `npm run dev:api`
4. In the [Better Auth dashboard](https://www.better-auth.com/dashboard), choose **Connect existing project** and enter:

| Field | Value |
|-------|-------|
| Base URL | `http://localhost:3000` (or your deployed API URL) |
| Base path | `/api/auth` |

For local dev, the dashboard may need a public URL — run `ngrok http 3000` and use the ngrok URL as Base URL instead.

The `dash()` plugin enables analytics, user management, and audit logging in the dashboard. It only loads when `BETTER_AUTH_API_KEY` is set.

Customer web (`apps/customer-web/.env` optional):

```env
VITE_API_ORIGIN=http://localhost:3000
```

## Database migration

```bash
npm run prisma:migrate -w apps/api
```

Adds `sessions`, `accounts`, `verifications` tables and Better Auth fields on `users`.

## How it works

- **Customer app** — `authClient` from `better-auth/react` with phone + bearer plugins; token stored as `bloomdidi_token`
- **API guard** — `HybridAuthGuard` accepts legacy JWT **or** Better Auth bearer session
- **Vendor/admin** — unchanged legacy OTP/JWT until migrated

## Dev OTP

With `MSG91_AUTH_KEY` unset, OTP is logged to the API console. Demo customer: `+919123456789` / `123456`.
