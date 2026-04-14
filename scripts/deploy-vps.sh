#!/bin/bash
# Deploy script for 852 VPS
# Run this on the VPS to ensure latest code is deployed

set -e

echo "=== 852 VPS Deploy Script ==="
echo "Date: $(date)"
echo ""

cd /opt/852 || { echo "ERROR: /opt/852 not found"; exit 1; }

echo "1. Fetching latest code from origin/main..."
git fetch origin main
git reset --hard origin/main
echo "   ✓ Code updated"

echo ""
echo "2. Installing dependencies..."
npm install
echo "   ✓ Dependencies installed"

echo ""
echo "3. Building application..."
npm run build 2>&1 | tail -20
echo "   ✓ Build completed"

echo ""
echo "4. Restarting Docker container..."
docker compose restart app
echo "   ✓ Container restarted"

echo ""
echo "5. Waiting for container to be ready..."
sleep 10

echo ""
echo "6. Testing health endpoint..."
curl -s http://127.0.0.1:3001/health 2>/dev/null || echo "Health check failed"

echo ""
echo "7. Testing master report endpoint..."
curl -s http://127.0.0.1:3001/api/ai-reports/master 2>&1 | head -50

echo ""
echo "8. Checking recent logs..."
docker logs 852-app --tail 20 2>&1 | grep -E "(852-master|Query|error)" | tail -5

echo ""
echo "=== Deploy completed at $(date) ==="
