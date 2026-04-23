# API Key Rotation Log

## 2026-04-23 — Block A: Supabase key rotation (Session 3)

### Context
Legacy Supabase API keys in `eyJ...` JWT format were replaced with the new
`sb_publishable_*` / `sb_secret_*` format introduced by Supabase in 2025.

### Actions taken

| Action | Result |
|--------|--------|
| Audited all active API keys via Management API (`GET /v1/projects/{ref}/api-keys`) | 4 keys listed: 2 legacy JWT + 2 new-format (`dev_2` set) |
| Disabled legacy JWT authentication system in Supabase dashboard | ✅ Done manually (Management API does not support DELETE on non-UUID key IDs) |
| Revoked legacy `anon` and `service_role` JWT keys | ✅ Done via Supabase dashboard |
| New `anon` key (`sb_publishable_*`) smoke-tested against `auth/v1/health` | ✅ HTTP 200 |
| Updated `.env.local` with new keys (`dev_2` set) | ✅ Done |
| Added `?pgbouncer=true&connection_limit=1` to `DATABASE_URL` | ✅ Done (required for Supabase pooler on port 6543) |

### Keys in use (reference by format — actual values in `.env.local`)

| Key | Format | Env var |
|-----|--------|---------|
| Anon key | `sb_publishable_*` | `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| Service role key | `sb_secret_*` | `SUPABASE_SERVICE_ROLE_KEY` |

### Next rotation
Rotate before first production deployment. Add rotation reminder to `SECURITY.md`.
