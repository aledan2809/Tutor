#!/bin/bash
# Deploy Tutor to VPS2 (72.62.155.74)
# Usage: ssh root@72.62.155.74 'bash -s' < scripts/deploy-vps2.sh
# Or:    scp scripts/deploy-vps2.sh root@72.62.155.74:/tmp/ && ssh root@72.62.155.74 'bash /tmp/deploy-vps2.sh'

set -euo pipefail

APP_DIR="/var/www/tutor"
PM2_NAME="tutor"
ROLLBACK_COMMIT=""

echo "=== Tutor Deployment to VPS2 ==="
echo "Date: $(date)"
echo ""

# Save current commit for rollback
cd "$APP_DIR"
ROLLBACK_COMMIT=$(git rev-parse HEAD)
echo "[1/7] Current commit (rollback point): $ROLLBACK_COMMIT"

# Pull latest changes
echo "[2/7] Pulling latest changes..."
git pull origin master

echo "[3/7] Installing dependencies..."
npm install --production

echo "[4/7] Generating Prisma client..."
npx prisma generate

echo "[5/7] Running database migrations..."
npx prisma migrate deploy 2>/dev/null || echo "  (no pending migrations or migrations not applicable)"

echo "[6/7] Building application..."
npm run build

echo "[7/7] Restarting PM2 process..."
pm2 restart "$PM2_NAME"

echo ""
echo "=== Deployment Complete ==="
echo "New commit: $(git rev-parse HEAD)"
echo ""

# Verify PM2 status
echo "PM2 Status:"
pm2 list | grep "$PM2_NAME"
echo ""

# Wait for app to start
sleep 3

# Health check
echo "Health check:"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3013/api/health 2>/dev/null || echo "failed")
if [ "$HTTP_CODE" = "200" ]; then
  echo "  ✓ API responding (HTTP $HTTP_CODE)"
else
  echo "  ✗ API not responding (HTTP $HTTP_CODE)"
  echo ""
  echo "Recent logs:"
  pm2 logs "$PM2_NAME" --lines 20 --nostream
  echo ""
  echo "To rollback:"
  echo "  cd $APP_DIR && git reset --hard $ROLLBACK_COMMIT && npm install && npx prisma generate && npm run build && pm2 restart $PM2_NAME"
  exit 1
fi

echo ""
echo "To rollback if needed:"
echo "  cd $APP_DIR && git reset --hard $ROLLBACK_COMMIT && npm install && npx prisma generate && npm run build && pm2 restart $PM2_NAME"
