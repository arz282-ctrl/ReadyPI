#!/usr/bin/env bash
# =============================================================================
# ReadyPI — GCP Secret Manager Setup Script
# =============================================================================
# Run this ONCE before deploying to Cloud Run.
# It creates all required secrets in GCP Secret Manager and then
# prints the --set-secrets flag you paste into your Cloud Run deploy command.
#
# Usage:
#   chmod +x setup-secrets.sh
#   ./setup-secrets.sh
#
# Prerequisites:
#   gcloud auth login
#   gcloud config set project readypi-core
# =============================================================================

set -euo pipefail

PROJECT_ID="${GCLOUD_PROJECT:-readypi-core}"
REGION="${GCLOUD_REGION:-asia-southeast1}"

echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║        ReadyPI — GCP Secret Manager Setup               ║"
echo "║        Project: ${PROJECT_ID}                           ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

# ── Helper ────────────────────────────────────────────────────────────────────
create_or_update_secret() {
  local name="$1"
  local value="$2"

  if gcloud secrets describe "$name" --project="$PROJECT_ID" &>/dev/null; then
    echo "  ↻  Updating secret: $name"
    echo -n "$value" | gcloud secrets versions add "$name" \
      --data-file=- \
      --project="$PROJECT_ID" \
      --quiet
  else
    echo "  +  Creating secret: $name"
    echo -n "$value" | gcloud secrets create "$name" \
      --data-file=- \
      --replication-policy="automatic" \
      --project="$PROJECT_ID" \
      --quiet
  fi
}

# ── Load values from api/.env ─────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$SCRIPT_DIR/api/.env"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "ERROR: api/.env not found at $ENV_FILE"
  exit 1
fi

# Source the .env file safely (skip comments and blank lines)
while IFS='=' read -r key value; do
  [[ "$key" =~ ^#.*$ || -z "$key" ]] && continue
  # Strip inline comments and surrounding quotes
  value="${value%%#*}"
  value="${value%\"}"
  value="${value#\"}"
  value="${value%\'}"
  value="${value#\'}"
  value="$(echo "$value" | xargs)"
  export "$key=$value" 2>/dev/null || true
done < "$ENV_FILE"

echo "Loaded env from: $ENV_FILE"
echo ""

# ── Create Secrets ────────────────────────────────────────────────────────────
echo "── Database ──────────────────────────────────────────────────"
create_or_update_secret "DB_PASSWORD"    "${DB_PASSWORD}"
create_or_update_secret "DATABASE_URL"   "${DATABASE_URL}"

echo ""
echo "── Authentication ────────────────────────────────────────────"
create_or_update_secret "JWT_SECRET"     "${JWT_SECRET}"

echo ""
echo "── AI Provider Keys ──────────────────────────────────────────"
create_or_update_secret "OPENAI_API_KEY"     "${OPENAI_API_KEY}"
create_or_update_secret "ANTHROPIC_API_KEY"  "${ANTHROPIC_API_KEY}"
create_or_update_secret "GOOGLE_API_KEY"     "${GOOGLE_API_KEY}"
create_or_update_secret "DEEPSEEK_API_KEY"   "${DEEPSEEK_API_KEY}"
create_or_update_secret "OPENROUTER_API_KEY" "${OPENROUTER_API_KEY}"
create_or_update_secret "FIREWORKS_API_KEY"  "${FIREWORKS_API_KEY}"
create_or_update_secret "MODAL_API_KEY"      "${MODAL_API_KEY}"

echo ""
echo "── Payment Gateways ──────────────────────────────────────────"
create_or_update_secret "STRIPE_SECRET_KEY"      "${STRIPE_SECRET_KEY}"
create_or_update_secret "STRIPE_WEBHOOK_SECRET"  "${STRIPE_WEBHOOK_SECRET}"
create_or_update_secret "SSLCOMMERZ_STORE_ID"    "${SSLCOMMERZ_STORE_ID}"
create_or_update_secret "SSLCOMMERZ_STORE_PASSWORD" "${SSLCOMMERZ_STORE_PASSWORD}"
create_or_update_secret "NOWPAYMENTS_API_KEY"    "${NOWPAYMENTS_API_KEY}"
create_or_update_secret "NOWPAYMENTS_IPN_SECRET" "${NOWPAYMENTS_IPN_SECRET}"

echo ""
echo "── BDT Payment Numbers ───────────────────────────────────────"
[[ -n "${BKASH_NUMBER:-}"   ]] && create_or_update_secret "BKASH_NUMBER"   "${BKASH_NUMBER}"
[[ -n "${BKASH_NUMBER_2:-}" ]] && create_or_update_secret "BKASH_NUMBER_2" "${BKASH_NUMBER_2}"
[[ -n "${NAGAD_NUMBER:-}"   ]] && create_or_update_secret "NAGAD_NUMBER"   "${NAGAD_NUMBER}"
[[ -n "${ROCKET_NUMBER:-}"  ]] && create_or_update_secret "ROCKET_NUMBER"  "${ROCKET_NUMBER}"
[[ -n "${UPAY_NUMBER:-}"    ]] && create_or_update_secret "UPAY_NUMBER"    "${UPAY_NUMBER}"
create_or_update_secret "ADMIN_EMAIL" "${ADMIN_EMAIL:-admin@readypi.io}"

echo ""
echo "── Grant Cloud Run SA access to secrets ──────────────────────"
SA_EMAIL="$(gcloud iam service-accounts list \
  --project="$PROJECT_ID" \
  --filter="displayName:Compute Engine default service account" \
  --format="value(email)" 2>/dev/null || echo "")"

if [[ -n "$SA_EMAIL" ]]; then
  echo "  Service Account: $SA_EMAIL"
  gcloud projects add-iam-policy-binding "$PROJECT_ID" \
    --member="serviceAccount:$SA_EMAIL" \
    --role="roles/secretmanager.secretAccessor" \
    --quiet
  echo "  ✓ IAM binding set"
else
  echo "  ⚠  Could not auto-detect service account."
  echo "     Run manually:"
  echo "     gcloud projects add-iam-policy-binding $PROJECT_ID \\"
  echo "       --member='serviceAccount:<SA_EMAIL>' \\"
  echo "       --role='roles/secretmanager.secretAccessor'"
fi


# -- Print Cloud Run --set-secrets flag
echo ""
echo "All secrets created. Use this for --set-secrets:"
echo ""
echo "DATABASE_URL=DATABASE_URL:latest,DB_PASSWORD=DB_PASSWORD:latest,JWT_SECRET=JWT_SECRET:latest,OPENAI_API_KEY=OPENAI_API_KEY:latest,ANTHROPIC_API_KEY=ANTHROPIC_API_KEY:latest,GOOGLE_API_KEY=GOOGLE_API_KEY:latest,DEEPSEEK_API_KEY=DEEPSEEK_API_KEY:latest,OPENROUTER_API_KEY=OPENROUTER_API_KEY:latest,FIREWORKS_API_KEY=FIREWORKS_API_KEY:latest,MODAL_API_KEY=MODAL_API_KEY:latest,STRIPE_SECRET_KEY=STRIPE_SECRET_KEY:latest,STRIPE_WEBHOOK_SECRET=STRIPE_WEBHOOK_SECRET:latest,SSLCOMMERZ_STORE_ID=SSLCOMMERZ_STORE_ID:latest,SSLCOMMERZ_STORE_PASSWORD=SSLCOMMERZ_STORE_PASSWORD:latest,NOWPAYMENTS_API_KEY=NOWPAYMENTS_API_KEY:latest,NOWPAYMENTS_IPN_SECRET=NOWPAYMENTS_IPN_SECRET:latest,BKASH_NUMBER=BKASH_NUMBER:latest,NAGAD_NUMBER=NAGAD_NUMBER:latest,ROCKET_NUMBER=ROCKET_NUMBER:latest,ADMIN_EMAIL=ADMIN_EMAIL:latest"
echo ""
echo "Done. Secrets are live in GCP Secret Manager."
