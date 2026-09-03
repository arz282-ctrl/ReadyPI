# ReadyPI India AI Market: Supabase & Vercel Deployment Guide 🚀

**Target Architecture:**
- **Database & Auth:** Supabase (PostgreSQL with Transaction Pooler & RLS)
- **Frontend Dashboard & Web API Gateway:** Vercel (Next.js 15 + Serverless Express Engine)
- **Marketplace Focus:** India AI Ecosystem (Sarvam AI, Krutrim, Sutra, Gemini 2.5, GPT-4o, Claude 3.5)
- **Payments:** UPI (PhonePe, Google Pay, Paytm, BHIM), Razorpay, NetBanking, Cards, Crypto (USDT)
- **Currency:** Indian Rupee (INR / ₹)

---

## 1. Supabase Database Setup (~10 minutes)

1. Sign up / Log in to [Supabase Console](https://supabase.com).
2. Click **New Project**:
   - **Project Name:** `readypi-india`
   - **Database Region:** **Mumbai, India (ap-south-1)**
   - Set a strong Database Password.
3. In the Supabase Dashboard:
   - Go to **SQL Editor** -> **New Query**.
   - Copy the contents of `database/supabase-migration.sql` and click **Run**.
   - Create a second query, copy the contents of `database/supabase-seed-pricing.sql`, and click **Run**.
4. Retrieve Connection String:
   - Go to **Project Settings** -> **Database** -> **Connection string** -> **URI**.
   - Select **Transaction pooler (Port 6543)**.
   - Example URI format:
     ```env
     DATABASE_URL=postgresql://postgres.xxx:[YOUR-PASSWORD]@aws-0-ap-south-1.pooler.supabase.com:6543/postgres
     ```

---

## 2. Environment Variables Configuration

Set these environment variables in Vercel or your `.env` file:

```env
# Database & Supabase
DATABASE_URL="postgresql://postgres.xxx:[YOUR-PASSWORD]@aws-0-ap-south-1.pooler.supabase.com:6543/postgres"
NEXT_PUBLIC_SUPABASE_URL="https://xxx.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6..."

# API & Application Config
NEXT_PUBLIC_API_URL="https://readypi.vercel.app/api"
API_BASE_URL="https://readypi.vercel.app/api"
DASHBOARD_URL="https://readypi.vercel.app"

# Payment Gateways (India)
RAZORPAY_KEY_ID="rzp_live_xxx"
RAZORPAY_KEY_SECRET="xxx"
NEXT_PUBLIC_RAZORPAY_KEY_ID="rzp_live_xxx"

# Indian & Global AI Provider Keys
SARVAM_API_KEY="xxx"
KRUTRIM_API_KEY="xxx"
TWOAI_API_KEY="xxx"
GOOGLE_API_KEY="xxx"
OPENAI_API_KEY="xxx"
ANTHROPIC_API_KEY="xxx"
DEEPSEEK_API_KEY="xxx"
OPENROUTER_API_KEY="xxx"
GROQ_API_KEY="xxx"
```

---

## 3. Vercel Deployment (~5 minutes)

### Option A: Direct Deployment via Vercel CLI
```bash
# Install Vercel CLI if not present
npm i -g vercel

# Deploy to Vercel
vercel --prod
```

### Option B: Vercel Dashboard (GitHub Integration)
1. Push your changes to GitHub repository.
2. Go to [vercel.com/new](https://vercel.com/new) and import the repository.
3. Environment Variables:
   - Add all environment variables listed in Section 2 above.
4. Click **Deploy**.

---

## 4. Verification Checklist

- [x] Database migration applied on Supabase (Tables: `users`, `api_keys`, `credits`, `transactions`, `subscriptions`, `usage_logs`, `model_pricing`).
- [x] Indian AI model prices seeded in `model_pricing` (Sarvam AI, Krutrim, Sutra, Gemini, GPT-4o).
- [x] Currency set to **INR (₹)** with UPI & Razorpay support.
- [x] Dashboard builds cleanly with `npm run build`.
- [x] Vercel `vercel.json` routing configured for API and Next.js frontend.
