#!/bin/bash
# Firebase Hosting Setup for ReadyPI Domains
# Usage: ./setup-hosting.sh

set -e

echo "========================================"
echo "ReadyPI Firebase Hosting Setup"
echo "========================================"

DOMAINS=("readypi.site" "readypi.online")

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI not found. Installing..."
    npm install -g firebase-tools
fi

# Login to Firebase if needed
echo "🔐 Ensuring Firebase login..."
firebase login --no-localhost

# Set the project
echo "📋 Setting project to readypi-core..."
firebase use readypi-core

echo ""
echo "========================================"
echo "Step 1: Add Authorized Domains"
echo "========================================"
echo "Add these domains to Firebase Console → Authentication → Settings → Authorized domains:"
for domain in "${DOMAINS[@]}"; do
    echo "  - https://$domain"
done

echo ""
echo "========================================"
echo "Step 2: Configure Namecheap DNS"
echo "========================================"
echo "For each domain, in Namecheap → Domain List → Manage → Advanced DNS:"
echo ""
echo "Option A: CNAME (recommended for subdomains)"
echo "  Type: CNAME Record"
echo "  Host: www"
echo "  Value: readypi-core.web.app"
echo "  TTL: Automatic"
echo ""
echo "Option B: A Records (for root domain)"
echo "  Type: A Record"
echo "  Host: @"
echo "  Value: 199.36.152.1"
echo "  TTL: Automatic"
echo "  Additional A Records:"
echo "    199.36.152.2"
echo "    199.36.152.3"
echo "    199.36.152.4"
echo ""
echo "  Also add:"
echo "  Type: TXT Record"
echo "  Host: @"
echo "  Value: google-site-verification=YOUR_VERIFICATION_CODE"
echo ""
echo "========================================"
echo "Step 3: Deploy Firebase Hosting"
echo "========================================"
echo "After DNS propagates (can take 24-48 hours), run:"
echo "  firebase deploy --only hosting"
echo ""
echo "To add domains to Firebase:"
echo "  firebase hosting:domain:readypi.site"
echo "  firebase hosting:domain:readypi.online"
echo "  OR"
echo "  firebase open hosting"
echo ""
echo "========================================"
echo "Step 4: Verify Deployment"
echo "========================================"
echo "Visit: https://readypi.site"
echo "Visit: https://readypi.online"
echo ""
echo "Check Firebase Console: https://console.firebase.google.com/project/readypi-core/hosting"