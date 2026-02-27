#!/bin/bash

# Fix missing provisioning profile error
# This script cleans Xcode's provisioning profile cache and references

echo "=== Fixing Provisioning Profile Error ==="

# 1. Clean Xcode's provisioning profile cache
echo "1. Cleaning Xcode provisioning profile cache..."
rm -rf ~/Library/Developer/Xcode/UserData/Provisioning\ Profiles/*
echo "   ✅ Cleaned provisioning profile cache"

# 2. Clean derived data
echo "2. Cleaning derived data..."
rm -rf ~/Library/Developer/Xcode/DerivedData/*
echo "   ✅ Cleaned derived data"

# 3. Clean module cache
echo "3. Cleaning module cache..."
rm -rf ~/Library/Developer/Xcode/DerivedData/ModuleCache.noindex 2>/dev/null || true
echo "   ✅ Cleaned module cache"

echo ""
echo "=== Fix Complete ==="
echo ""
echo "Next steps:"
echo "1. Open Xcode"
echo "2. Go to Xcode > Settings > Accounts"
echo "3. Select your Apple ID"
echo "4. Click 'Download Manual Profiles' (if available)"
echo "5. Go to your target's 'Signing & Capabilities' tab"
echo "6. Ensure 'Automatically manage signing' is checked"
echo "7. Select your Team"
echo "8. Xcode will automatically download/create the correct provisioning profile"
echo ""
echo "Then try archiving again."




