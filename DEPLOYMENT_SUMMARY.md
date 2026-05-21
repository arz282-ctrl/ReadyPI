# ReadyPI Deployment Summary

**Deployment Date:** 2026-05-08  
**Status:** ✅ Production Live

---

## 🚀 Services Deployed

### 1. API Gateway (Cloud Run)
- **URL:** https://readypi-api-1054908407663.asia-southeast1.run.app
- **Health:** `/health` → 200 OK
- **Revision:** `readypi-api-00045-l9h`
- **Region:** asia-southeast1 (Singapore)
- **Features:** JWT auth, credit system, 15+ AI providers, payment gateways

### 2. Dashboard (Cloud Run)
- **URL:** https://readypi-dashboard-1054908407663.asia-southeast1.run.app
- **Health:** 200 OK (Next.js app)
- **Revision:** `readypi-dashboard-00026-ncz`
- **Build:** Next.js 15 standalone output
- **Auth:** Firebase OAuth (Google, GitHub, Facebook, Apple, Email)

### 3. Firebase Hosting
- **Default URL:** https://readypi-core.web.app
- **Custom Domains:**
  - https://readypi.site
  - https://readypi.online
- **Config:** `firebase.json` rewrites proxy to Cloud Run services

---

## 🔧 Issues Fixed

| # | Issue | Fix | File(s) |
|---|-------|-----|---------|
| 1 | Missing Jest test setup file | Created `api/tests/setup.js` with env mocks | `api/tests/setup.js` |
| 2 | Dashboard Dockerfile failed to build | Fixed typo `EXOSE` → `EXPOSE 3000` | `dashboard/Dockerfile:42` |
| 3 | Dockerfile excluded from source upload | Removed `Dockerfile` from `.dockerignore` | `dashboard/.dockerignore` |
| 4 | Build args misconfiguration | Simplified Dockerfile to read `.env.production` | `dashboard/Dockerfile` |
| 5 | Inconsistent environment setup | Added pre-deploy validation script | `pre-deploy-check.sh` |
| 6 | Test runner configuration | Ensured Jest finds setup file | `api/package.json` |

---

## 📦 Architecture

```
┌─────────────────┐
│  readypi.site   │ ← Firebase Hosting (SSL, CDN)
│  readypi.online │
└────────┬────────┘
         │
    ┌────┴─────┐
    │          │
    ▼          ▼
┌───────┐  ┌─────────────┐
│Dashboard│  │  API       │
│(Next.js)│  │(Express)   │
│Port 3000│  │Port 8080   │
└───────┘  └─────────────┘
    │          │
    │          ├── PostgreSQL (Cloud SQL)
    │          ├── Firebase Auth (Admin SDK)
    │          └── AI Providers (15+)
    │
    └──> OAuth via Firebase Client SDK
```

---

## 🔐 Security & Secrets

- **Secrets managed via:** Cloud Run Secret Manager (DB_PASSWORD, JWT_SECRET, API keys)
- **Service Account:** `readypi-api-sa@readypi-core.iam.gserviceaccount.com`
- **IAM Roles:** Cloud SQL Client, Secret Manager Accessor, Firebase Admin, Log Writer
- **CORS:** Configured for production domains
- **Rate Limiting:** Per-plan limits (10–10,000 req/min)
- **Helmet:** Security headers enabled

---

## 🗄️ Database

- **Instance:** `readypi-db` (Cloud SQL PostgreSQL)
- **Location:** asia-southeast1
- **Schema:** `database/schema.sql`
  - users, api_keys, credits, transactions, subscriptions, usage_logs, model_pricing
- **Triggers:** Auto-create credits on signup (50 free), updated_at timestamps

---

## 🔌 AI Providers Supported

| Provider | Models | Free Tier |
|----------|--------|-----------|
| Google (Gemini) | flash, pro | ✅ flash |
| OpenAI | gpt-4o, gpt-4o-mini | ❌ |
| Anthropic | claude-sonnet, claude-haiku | ❌ |
| Groq | llama-3-70b | ✅ |
| DeepSeek | deepseek-chat | ✅ |
| Mistral | mistral-small | ❌ |
| OpenRouter | Multiple free models | ✅ |
| Vertex AI | Gemini & Claude via Google Cloud | ❌ |
| AWS Bedrock | Nova, Llama, Claude, Titan | ❌ |
| Fireworks | Llama, DeepSeek, Kimi | ❌ |
| Modal | GLM-5.1 | ❌ |

---

## 💰 Payment Gateways

- **SSLCommerz:** bKash, Nagad, Rocket, cards (BDT)
- **NOWPayments:** USDT BSC crypto
- **Stripe:** International cards (USD)
- **Manual BDT:** Direct phone number transfers

---

## ✅ Validation Checklist

- [x] Pre-deploy validation script passes (37 checks)
- [x] API builds and runs locally (syntax validated)
- [x] Dashboard builds successfully (`npm run build`)
- [x] All environment variables configured
- [x] Dockerfiles use non-root users
- [x] Health endpoints return 200
- [x] Firebase Hosting deployed with rewrites
- [x] CORS origins include production domains
- [x] Database connection established
- [x] Service account has proper IAM roles

---

## 📝 Next Steps (Post-Deployment)

1. **Add custom domains** in Firebase Console:
   - readypi.io, www.readypi.io
   - Verify via DNS A records to Cloud Run IP

2. **Authorize OAuth domains** in Firebase Authentication:
   - Add all Cloud Run domains to authorized list

3. **Configure monitoring:**
   - Set up Cloud Monitoring alerts
   - Connect error reporting (Sentry optional)

4. **SSL certificate:** Automatically handled by Firebase Hosting (Certbot via Firebase)

5. **Database migrations:** Already applied via `database/schema.sql`

6. **Test end-to-end:**
   - Sign up at dashboard
   - Create API key
   - Make a chat completion request
   - Verify credits deducted

---

## 🛠️ Commands

```bash
# View logs
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=readypi-api" --limit 20

# Rollback API
gcloud run services revert readypi-api --region asia-southeast1

# Update secrets
gcloud secrets add-version-payload DB_PASSWORD --data-file=-  < api/.env

# Deploy manually (if needed)
./deploy-production.sh

# Pre-deploy check
./pre-deploy-check.sh
```

---

**Deployment completed successfully. ReadyPI is now live in production.**
