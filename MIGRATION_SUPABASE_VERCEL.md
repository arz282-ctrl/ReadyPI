# ReadyPi Migration: Google Cloud → Supabase + Vercel

**Goal:** kill the Cloud SQL + Cloud Run bill. DB/auth → Supabase, dashboard → Vercel, API → Railway/Render.

---

## Phase 1 — Database → Supabase  (~15 min)

1. Sign up at [supabase.com](https://supabase.com) → **New project**
   - Name: `readypi` · Region: **Singapore (ap-southeast-1)** (same as current) · Set a strong DB password
2. In the Supabase dashboard → **SQL Editor** → run these two files in order:
   - `database/supabase-migration.sql`  (all 8 tables, triggers, views, RLS lockdown)
   - `database/supabase-seed-pricing.sql`  (model pricing seed data)
3. Get the connection string: **Project Settings → Database → Connection string → URI**
   - Use the **Transaction pooler** (port `6543`) string for the API — it handles many short connections better
   - Looks like: `postgresql://postgres.xxxx:[PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres`
4. Update `.env` in the project root AND on your API host:
   ```
   DATABASE_URL=postgresql://postgres.xxxx:[PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
   ```
   No code changes needed — `api/utils/db.js` already supports `DATABASE_URL` with SSL.

### Migrating existing production data (users, credits, keys)
If you have real users in Cloud SQL, dump & restore before switching:
```bash
# Dump from Cloud SQL (needs gcloud auth + Cloud SQL proxy or public IP)
pg_dump "$OLD_DATABASE_URL" --data-only \
  -t users -t api_keys -t credits -t transactions \
  -t subscriptions -t usage_logs -t referrals > readypi-data.sql

# Restore into Supabase (session pooler port 5432 for pg_dump/restore)
psql "$SUPABASE_DATABASE_URL" < readypi-data.sql
```
Note: don't dump `model_pricing` — the seed file already loads it fresh.

---

## Phase 2 — Dashboard → Vercel  (~20 min)

1. Push the repo to GitHub (if not already up to date)
2. [vercel.com](https://vercel.com) → **Add New Project** → import the repo
   - **Root Directory:** `dashboard`
   - Framework auto-detected: Next.js
3. Add environment variables (copy from `dashboard/.env.production`):
   - All `NEXT_PUBLIC_FIREBASE_*` vars (keep Firebase Auth for now — swap to Supabase Auth later)
   - `NEXT_PUBLIC_API_URL` → your new API URL (Phase 3)
4. Deploy. Then **Settings → Domains** → add `readypi.site` / `readypi.online`

---

## Phase 3 — Express API → Railway (or Render)  (~20 min)

Vercel serverless doesn't suit this API (streaming AI responses, payment webhooks,
long requests). Railway runs the existing `api/Dockerfile` unchanged.

1. [railway.app](https://railway.app) → **New Project → Deploy from GitHub repo**
   - Root directory: `api` (it has its own Dockerfile)
2. Environment variables — copy everything from `.env`, but change:
   - `DATABASE_URL` → the Supabase pooler string
   - `PORT` → Railway injects this automatically; the code reads `process.env.PORT` ✓
3. Add `FIREBASE_SERVICE_ACCOUNT` (the JSON) — currently only set in Cloud Run secrets
4. Note the public URL (e.g. `readypi-api.up.railway.app`), set it as
   `NEXT_PUBLIC_API_URL` in Vercel, and update payment gateway callback URLs
   (SSLCommerz / Stripe webhook endpoints) to point at it.

---

## Phase 4 — Auth: Firebase → Supabase Auth  (later, optional)

Biggest code change; do it after everything else is stable:
- Dashboard: replace `firebase` SDK in `lib/auth-context` + login/signup pages with `@supabase/supabase-js`
- API: replace `firebase-admin` token verification (`routes/firebase-exchange.js`) with Supabase JWT verification
- Users table already stores `oauth_provider`/`oauth_uid` — map Supabase user IDs into `oauth_uid`

Until then Firebase Auth keeps working fine alongside Supabase DB (it's free tier anyway).

---

## Phase 5 — Decommission Google Cloud

Only after readypi.site works end-to-end on the new stack (signup → API key → chat request → credits deducted):
```bash
gcloud run services delete readypi-api --region asia-southeast1
gcloud run services delete readypi-dashboard --region asia-southeast1
gcloud sql instances delete readypi-db        # ⚠️ take a final backup first
```
Keep the Firebase project (Auth + Hosting DNS) until Phase 4 is done.

---

## Cost before vs after

| | Before (GCP) | After |
|---|---|---|
| DB | Cloud SQL ~$10–50/mo | Supabase free (500MB) |
| Dashboard | Cloud Run ~$5–15/mo | Vercel hobby free |
| API | Cloud Run ~$5–15/mo | Railway ~$5/mo |
| **Total** | **~$20–80/mo** | **~$0–5/mo** |
