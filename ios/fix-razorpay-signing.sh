#!/bin/bash

# Fix for Razorpay framework code signing error (errSecInternalComponent)
# This script fixes common code signing issues with Razorpay frameworks

echo "=== Fixing Razorpay Framework Code Signing ==="

# 1. Clean build folders
echo "1. Cleaning build artifacts..."
rm -rf ~/Library/Developer/Xcode/DerivedData/*
rm -rf ios/build
rm -rf ios/Pods/build

# 2. Clean Pods and reinstall
echo "2. Cleaning and reinstalling Pods..."
cd ios
pod deintegrate
pod cache clean --all
pod install

# 3. Fix keychain access (if needed)
echo "3. Checking keychain access..."
security unlock-keychain ~/Library/Keychains/login.keychain-db 2>/dev/null || true

# 4. Remove any existing code signatures from Razorpay frameworks
echo "4. Removing existing code signatures from Razorpay frameworks..."
find Pods/razorpay-core-pod -name "*.framework" -type d -exec rm -rf {}/_CodeSignature 2>/dev/null \; || true
find Pods/razorpay-pod -name "*.framework" -type d -exec rm -rf {}/_CodeSignature 2>/dev/null \; || true

echo ""
echo "=== Fix Complete ==="
echo ""
echo "Next steps:"
echo "1. Open Xcode"
echo "2. Open ISPApp.xcworkspace (NOT .xcodeproj)"
echo "3. Clean Build Folder (Product > Clean Build Folder or Cmd+Shift+K)"
echo "4. Select 'Any iOS Device' as target"
echo "5. Try archiving again (Product > Archive)"
echo ""
echo "If the issue persists:"
echo "- Check your code signing certificate in Xcode (Target > Signing & Capabilities)"
echo "- Make sure 'Automatically manage signing' is enabled"
echo "- Verify your Apple Developer account has valid certificates"






