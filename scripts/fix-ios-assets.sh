#!/bin/bash

echo "🔧 Fixing iOS Assets for Linkway"
echo "=================================="
echo ""

# 1. Clear Metro bundler cache
echo "1️⃣  Clearing Metro bundler cache..."
rm -rf ${TMPDIR%/}/metro-* 2>/dev/null || true
rm -rf /tmp/metro-* 2>/dev/null || true
rm -rf $HOME/.metro 2>/dev/null || true
echo "✅ Metro cache cleared"
echo ""

# 2. Clear React Native cache
echo "2️⃣  Clearing React Native cache..."
rm -rf node_modules/.cache 2>/dev/null || true
echo "✅ React Native cache cleared"
echo ""

# 3. Sync assets
echo "3️⃣  Syncing Linkway assets..."
node scripts/sync-linkway-assets.js
echo ""

# 4. Clean iOS build
echo "4️⃣  Cleaning iOS build..."
cd ios
rm -rf build
rm -rf Pods
rm -rf Podfile.lock
pod cache clean --all 2>/dev/null || true
pod install
cd ..
echo "✅ iOS build cleaned"
echo ""

echo "✅ All done! Now run:"
echo "   yarn start --reset-cache"
echo "   (In another terminal) yarn ios"
