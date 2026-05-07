#!/usr/bin/env bash
# =============================================================================
# ReadyPI Production Deploy — FIXED Version
# Fixes: Firebase config, Cloud SQL auth, env var injection
# =============================================================================
set -euo pipefail

# ─── Configuration ───────────────────────────────────────────────────────────
readonly PROJECT_ID="readypi-core"
readonly REGION="asia-southeast1"
readonly API_SERVICE="readypi-api"
readonly DASH_SERVICE="readypi-dashboard"
readonly CLOUD_SQL_INSTANCE="readypi-core:asia-southeast1:readypi-db"

# Dashboard Firebase Config (NEXT_PUBLIC_ = baked at build time)
readonly FB_API_KEY="AIzaSyC0cNSpGIf9T3y70DZvhlzY_a8FZHUlpv0"
readonly FB_AUTH_DOMAIN="readypi-core.firebaseapp.com"
readonly FB_PROJECT_ID="readypi-core"
readonly FB_STORAGE_BUCKET="readypi-core.firebasestorage.app"
readonly FB_SENDER_ID="1054908407663"
readonly FB_APP_ID="1:1054908407663:web:de8d6275fb121d9e30529a"
readonly FB_MEASUREMENT_ID="G-YLZMBEQRFW"

# API URL that the dashboard calls
readonly API_URL="https://readypi-api-jhuoxne7ta-as.a.run.app"
readonly API_SA="readypi-api-sa@readypi-core.iam.gserviceaccount.com"

# CORS — all domains the API must accept
readonly API_CORS="http://localhost:3001,http://localhost:3000,https://readypi-dashboard-jhuoxne7ta-as.a.run.app,https://readypi-dashboard-1054908407663.asia-southeast1.run.app,https://readypi-core.web.app,https://readypi-core.firebaseapp.com,https://readypi.site,https://www.readypi.site,https://readypi.online,https://www.readypi.online"

# ─── Colors ──────────────────────────────────────────────────────────────────
C_RESET='\033[0m'; C_INFO='\033[1;34m'; C_OK='\033[1;32m'
C_WARN='\033[1;33m'; C_ERR='\033[1;31m'

log()  { echo -e "${C_INFO}[INFO]${C_RESET} $1"; }
ok()   { echo -e "${C_OK}[OK]${C_RESET} $1"; }
warn() { echo -e "${C_WARN}[WARN]${C_RESET} $1"; }
err()  { echo -e "${C_ERR}[ERROR]${C_RESET} $1"; }

# ─── Step 0: Prerequisites ──────────────────────────────────────────────────
prereqs() {
  log "Checking gcloud + firebase CLI..."
  command -v gcloud >/dev/null 2>&1 || { err "gcloud CLI not found"; exit 1; }
  command -v firebase >/dev/null 2>&1 || { err "firebase CLI not found"; exit 1; }

  # Ensure correct project
  gcloud config set project "$PROJECT_ID" --quiet
  ok "Project set to $PROJECT_ID"
}

# ─── Step 1: Fix Cloud SQL IAM ──────────────────────────────────────────────
fix_iam() {
  log "Fixing Cloud SQL IAM permissions for $API_SA..."

  # Grant Cloud SQL Client role
  log "Granting roles/cloudsql.client..."
  gcloud projects add-iam-policy-binding "$PROJECT_ID" \
    --member="serviceAccount:$API_SA" \
    --role="roles/cloudsql.client" \
    --quiet

  # Also grant Cloud SQL Instance User (for IAM auth if needed)
  log "Granting roles/cloudsql.instanceUser..."
  gcloud projects add-iam-policy-binding "$PROJECT_ID" \
    --member="serviceAccount:$API_SA" \
    --role="roles/cloudsql.instanceUser" \
    --quiet

  ok "Cloud SQL IAM permissions granted to $API_SA"
}

# ─── Step 2: Deploy API ─────────────────────────────────────────────────────
deploy_api() {
  log "═══ Deploying API to Cloud Run ═══"
  cd api || { err "api/ directory not found"; exit 1; }

  # Read ALL values from local .env (since .dockerignore excludes .env files)
  log "Extracting env vars from api/.env..."

  read_env() { grep "^$1=" .env 2>/dev/null | head -1 | cut -d'=' -f2- || echo ""; }

  local DB_PASSWORD JWT_SECRET
  DB_PASSWORD=$(read_env DB_PASSWORD)
  JWT_SECRET=$(read_env JWT_SECRET)

  # AI Provider Keys
  local GOOGLE_KEY OPENAI_KEY ANTHROPIC_KEY DEEPSEEK_KEY
  local OPENROUTER_KEY FIREWORKS_KEY MODAL_KEY MISTRAL_KEY
  GOOGLE_KEY=$(read_env GOOGLE_API_KEY)
  OPENAI_KEY=$(read_env OPENAI_API_KEY)
  ANTHROPIC_KEY=$(read_env ANTHROPIC_API_KEY)
  DEEPSEEK_KEY=$(read_env DEEPSEEK_API_KEY)
  OPENROUTER_KEY=$(read_env OPENROUTER_API_KEY)
  FIREWORKS_KEY=$(read_env FIREWORKS_API_KEY)
  MODAL_KEY=$(read_env MODAL_API_KEY)
  MISTRAL_KEY=$(read_env MISTRAL_API_KEY)

  # Payment Keys
  local STRIPE_SECRET STRIPE_WEBHOOK NOWPAY_KEY NOWPAY_IPN
  STRIPE_SECRET=$(read_env STRIPE_SECRET_KEY)
  STRIPE_WEBHOOK=$(read_env STRIPE_WEBHOOK_SECRET)
  NOWPAY_KEY=$(read_env NOWPAYMENTS_API_KEY)
  NOWPAY_IPN=$(read_env NOWPAYMENTS_IPN_SECRET)

  # AWS
  local AWS_KEY AWS_SECRET AWS_REGION_VAL
  AWS_KEY=$(read_env AWS_ACCESS_KEY_ID)
  AWS_SECRET=$(read_env AWS_SECRET_ACCESS_KEY)
  AWS_REGION_VAL=$(read_env AWS_REGION)

  if [[ -z "$DB_PASSWORD" || -z "$JWT_SECRET" ]]; then
    err "CRITICAL: DB_PASSWORD or JWT_SECRET not found in api/.env"
    exit 1
  fi

  log "Building and deploying API container..."

  # CRITICAL: Pass ALL env vars via --set-env-vars since .dockerignore excludes .env
  # Use Cloud SQL Unix socket (NOT public IP) for secure Cloud Run connections
  # Delimiter: || (since CORS values contain commas)
  gcloud run deploy "$API_SERVICE" \
    --project "$PROJECT_ID" \
    --region "$REGION" \
    --source . \
    --platform managed \
    --allow-unauthenticated \
    --service-account "$API_SA" \
    --add-cloudsql-instances "$CLOUD_SQL_INSTANCE" \
    --set-env-vars "^||^NODE_ENV=production||CLOUD_SQL_CONNECTION_NAME=${CLOUD_SQL_INSTANCE}||DB_NAME=readypi||DB_USER=postgres||DB_PASSWORD=${DB_PASSWORD}||DB_SSL=false||JWT_SECRET=${JWT_SECRET}||FIREBASE_PROJECT_ID=${FB_PROJECT_ID}||CORS_ORIGIN=${API_CORS}||API_KEY_SALT_ROUNDS=12||LOG_LEVEL=info||GOOGLE_API_KEY=${GOOGLE_KEY}||OPENAI_API_KEY=${OPENAI_KEY}||ANTHROPIC_API_KEY=${ANTHROPIC_KEY}||DEEPSEEK_API_KEY=${DEEPSEEK_KEY}||OPENROUTER_API_KEY=${OPENROUTER_KEY}||FIREWORKS_API_KEY=${FIREWORKS_KEY}||MODAL_API_KEY=${MODAL_KEY}||MISTRAL_API_KEY=${MISTRAL_KEY}||STRIPE_SECRET_KEY=${STRIPE_SECRET}||STRIPE_WEBHOOK_SECRET=${STRIPE_WEBHOOK}||NOWPAYMENTS_API_KEY=${NOWPAY_KEY}||NOWPAYMENTS_IPN_SECRET=${NOWPAY_IPN}||NOWPAYMENTS_IS_SANDBOX=false||BKASH_NUMBER=01710515419||BKASH_NUMBER_2=01930195711||NAGAD_NUMBER=01710515419||ROCKET_NUMBER=01710515419||UPAY_NUMBER=01930195711||ADMIN_EMAIL=rarewarestudio@gmail.com||AWS_ACCESS_KEY_ID=${AWS_KEY}||AWS_SECRET_ACCESS_KEY=${AWS_SECRET}||AWS_REGION=${AWS_REGION_VAL}" \
    --port 8080 \
    --memory 512Mi \
    --min-instances 0 \
    --max-instances 3 \
    --timeout 60 \
    --quiet

  ok "API deployed successfully!"
  cd ..
}

# ─── Step 3: Deploy Dashboard ───────────────────────────────────────────────
deploy_dashboard() {
  log "═══ Deploying Dashboard to Cloud Run ═══"
  cd dashboard || { err "dashboard/ directory not found"; exit 1; }

  # Generate .env.production for Next.js build-time variable injection
  log "Writing .env.production (NEXT_PUBLIC_ vars baked at build)..."
  cat > .env.production <<EOF
NEXT_PUBLIC_API_URL=${API_URL}
NEXT_PUBLIC_FIREBASE_API_KEY=${FB_API_KEY}
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=${FB_AUTH_DOMAIN}
NEXT_PUBLIC_FIREBASE_PROJECT_ID=${FB_PROJECT_ID}
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=${FB_STORAGE_BUCKET}
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=${FB_SENDER_ID}
NEXT_PUBLIC_FIREBASE_APP_ID=${FB_APP_ID}
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=${FB_MEASUREMENT_ID}
EOF

  # CRITICAL FIX: Ensure .dockerignore does NOT exclude .env.production
  # The current .dockerignore has ".env" which ONLY matches ".env" exactly
  # But does NOT have ".env.production" so it should be fine.
  # However, double-check by temporarily removing any broad .env* patterns
  if grep -q '\.env\.\*' .dockerignore 2>/dev/null; then
    warn "Found broad .env.* pattern in .dockerignore — removing it"
    sed -i.bak '/\.env\.\*/d' .dockerignore
  fi

  log "Building and deploying Dashboard container..."
  gcloud run deploy "$DASH_SERVICE" \
    --project "$PROJECT_ID" \
    --region "$REGION" \
    --source . \
    --platform managed \
    --allow-unauthenticated \
    --set-env-vars "NODE_ENV=production,HOSTNAME=0.0.0.0" \
    --port 3000 \
    --memory 512Mi \
    --min-instances 0 \
    --max-instances 3 \
    --timeout 60 \
    --quiet

  # Clean up
  rm -f .env.production .dockerignore.bak
  ok "Dashboard deployed successfully!"
  cd ..
}

# ─── Step 4: Deploy Firebase Hosting ─────────────────────────────────────────
deploy_hosting() {
  log "═══ Deploying Firebase Hosting (domain proxy) ═══"
  firebase deploy --only hosting --project "$PROJECT_ID"
  ok "Firebase Hosting deployed — readypi.site + readypi.online should now proxy to Cloud Run"
}

# ─── Summary ─────────────────────────────────────────────────────────────────
summary() {
  echo ""
  echo -e "${C_OK}═══════════════════════════════════════════════════════════════${C_RESET}"
  echo -e "${C_OK}  ✅ DEPLOYMENT COMPLETE — ALL FIXES APPLIED${C_RESET}"
  echo -e "${C_OK}═══════════════════════════════════════════════════════════════${C_RESET}"
  echo ""
  echo "  Services:"
  echo "    API:       $API_URL"
  echo "    Dashboard: https://readypi-dashboard-jhuoxne7ta-as.a.run.app"
  echo ""
  echo "  Custom Domains (via Firebase Hosting):"
  echo "    https://readypi.site"
  echo "    https://readypi.online"
  echo ""
  echo -e "${C_WARN}  ⚠ Verify these domains are in Firebase Auth → Authorized Domains:${C_RESET}"
  echo "    https://console.firebase.google.com/project/$PROJECT_ID/authentication/settings"
  echo ""
  echo "    • readypi-dashboard-jhuoxne7ta-as.a.run.app"
  echo "    • readypi.site / www.readypi.site"
  echo "    • readypi.online / www.readypi.online"
  echo "    • $PROJECT_ID.web.app / $PROJECT_ID.firebaseapp.com"
  echo ""
}

# ─── Main ────────────────────────────────────────────────────────────────────
main() {
  echo ""
  echo -e "${C_INFO}═══════════════════════════════════════════════════════════════${C_RESET}"
  echo -e "${C_INFO}  ReadyPI Production Deploy — FIXED (v3.0)${C_RESET}"
  echo -e "${C_INFO}═══════════════════════════════════════════════════════════════${C_RESET}"
  echo ""

  prereqs
  fix_iam
  deploy_api
  deploy_dashboard
  deploy_hosting
  summary
}

main "$@"
