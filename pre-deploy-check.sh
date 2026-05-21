#!/usr/bin/env bash
# ReadyPI Pre-Deployment Validation

PASSED=0; FAILED=0; WARNINGS=0
pass() { echo -e "\033[1;32m✓\033[0m $1"; PASSED=$((PASSED+1)); }
fail() { echo -e "\033[1;31m✗\033[0m $1"; FAILED=$((FAILED+1)); }
warn() { echo -e "\033[1;33m⚠\033[0m $1"; WARNINGS=$((WARNINGS+1)); }

echo "ReadyPI Pre-Deploy Validation"
echo "=============================="
echo ""

echo "--- Files ---"
[ -f api/server.js ] && pass "server.js" || fail "server.js missing"
[ -f api/package.json ] && pass "api/package.json" || fail "api package.json"
[ -f dashboard/package.json ] && pass "dashboard/package.json" || fail "dash pkg.json"
[ -f dashboard/next.config.mjs ] && pass "next.config.mjs" || fail "next.config"
[ -f firebase.json ] && pass "firebase.json" || fail "firebase.json"
[ -f cloudbuild.yaml ] && pass "cloudbuild.yaml" || fail "cloudbuild"
[ -x deploy-production.sh ] && pass "deploy script executable" || fail "deploy script not exec"
[ -f api/Dockerfile ] && pass "API Dockerfile" || fail "API Dockerfile"
[ -f dashboard/Dockerfile ] && pass "Dashboard Dockerfile" || fail "Dash Dockerfile"
[ -f deployment/ecosystem.config.js ] && pass "ecosystem.config.js" || fail "ecosystem"
[ -f deployment/nginx.conf ] && pass "nginx.conf" || fail "nginx"
[ -f api/tests/setup.js ] && pass "test setup.js" || fail "test setup"
echo ""

echo "--- Env ---"
[ -f api/.env ] && pass "api/.env exists" || fail "api/.env missing"
[ -f dashboard/.env.local ] && pass "dashboard/.env.local" || fail "dash .env.local"
grep -q '^JWT_SECRET=' api/.env && pass "JWT_SECRET" || fail "JWT_SECRET"
grep -q '^DB_PASSWORD=' api/.env && pass "DB_PASSWORD" || fail "DB_PASSWORD"
grep -q '^GOOGLE_API_KEY=' api/.env && pass "GOOGLE_API_KEY" || fail "GOOGLE_API_KEY"
grep -q '^OPENAI_API_KEY=' api/.env && pass "OPENAI_API_KEY" || fail "OPENAI_API_KEY"
grep -q '^FIREBASE_PROJECT_ID=' api/.env && pass "FIREBASE_PROJECT_ID" || fail "FIREBASE_PROJECT_ID"
grep -q '^\.env' .gitignore && pass ".gitignore protects env" || fail ".gitignore"
echo ""

echo "--- Dependencies ---"
[ -d api/node_modules ] && pass "api node_modules" || warn "api deps missing"
[ -d dashboard/node_modules ] && pass "dash node_modules" || warn "dash deps missing"
grep -q '"express"' api/package.json && pass "express dep" || fail "express"
grep -q '"bcrypt"' api/package.json && pass "bcrypt dep" || fail "bcrypt"
grep -q '"pg"' api/package.json && pass "pg dep" || fail "pg"
grep -q '"firebase-admin"' api/package.json && pass "firebase-admin" || fail "firebase-admin"
grep -q '"next"' dashboard/package.json && pass "next dep" || fail "next"
grep -q '"firebase"' dashboard/package.json && pass "firebase dep" || fail "firebase"
echo ""

echo "--- Schema ---"
[ -f database/schema.sql ] && pass "schema.sql" || fail "schema.sql"
grep -q 'CREATE TABLE users' database/schema.sql && pass "users table" || fail "users"
grep -q 'CREATE TABLE api_keys' database/schema.sql && pass "api_keys table" || fail "api_keys"
grep -q 'CREATE TABLE credits' database/schema.sql && pass "credits" || fail "credits"
grep -q 'CREATE TABLE model_pricing' database/schema.sql && pass "model_pricing" || fail "pricing"
echo ""

echo "--- Docker ---"
grep -q 'HEALTHCHECK' api/Dockerfile && pass "API HEALTHCHECK" || fail "HEALTHCHECK"
grep -q 'EXPOSE 8080' api/Dockerfile && pass "API port 8080" || fail "port"
grep -q 'standalone' dashboard/Dockerfile && pass "dash standalone" || fail "standalone"
grep -q 'USER nextjs' dashboard/Dockerfile && pass "dash non-root" || fail "non-root"
echo ""

echo "Summary: Passed=$PASSED Warnings=$WARNINGS Failed=$FAILED"
echo ""
if [ $FAILED -eq 0 ]; then
  echo "READY FOR DEPLOYMENT"
  echo "Run: ./deploy-production.sh"
  exit 0
else
  echo "FIX ERRORS BEFORE DEPLOYMENT"
  exit 1
fi
