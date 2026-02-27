#!/bin/bash

# Apply Razorpay code signing fix directly to the embed frameworks script

set -e

echo "=== Applying Razorpay Code Signing Fix ==="

EMBED_SCRIPT="Pods/Target Support Files/Pods-Spacecom End User App/Pods-Spacecom End User App-frameworks.sh"

if [ ! -f "$EMBED_SCRIPT" ]; then
    echo "❌ Embed script not found. Run 'pod install' first."
    exit 1
fi

# Check if already fixed
if grep -q "RAZORPAY_FIX_APPLIED" "$EMBED_SCRIPT"; then
    echo "✅ Razorpay fix already applied"
    exit 0
fi

echo "Applying fix to embed frameworks script..."

# Create backup
cp "$EMBED_SCRIPT" "${EMBED_SCRIPT}.backup"

# Add the fix before code signing
cat >> "$EMBED_SCRIPT" << 'RAZORPAY_FIX'

# RAZORPAY_FIX_APPLIED - Remove code signatures from Razorpay frameworks before signing
if [ -d "${BUILT_PRODUCTS_DIR}/${FRAMEWORKS_FOLDER_PATH}/Razorpay.framework" ]; then
  if [ -d "${BUILT_PRODUCTS_DIR}/${FRAMEWORKS_FOLDER_PATH}/Razorpay.framework/_CodeSignature" ]; then
    echo "Removing existing code signature from Razorpay.framework"
    rm -rf "${BUILT_PRODUCTS_DIR}/${FRAMEWORKS_FOLDER_PATH}/Razorpay.framework/_CodeSignature"
  fi
fi
if [ -d "${BUILT_PRODUCTS_DIR}/${FRAMEWORKS_FOLDER_PATH}/RazorpayCore.framework" ]; then
  if [ -d "${BUILT_PRODUCTS_DIR}/${FRAMEWORKS_FOLDER_PATH}/RazorpayCore.framework/_CodeSignature" ]; then
    echo "Removing existing code signature from RazorpayCore.framework"
    rm -rf "${BUILT_PRODUCTS_DIR}/${FRAMEWORKS_FOLDER_PATH}/RazorpayCore.framework/_CodeSignature"
  fi
fi
if [ -d "${BUILT_PRODUCTS_DIR}/${FRAMEWORKS_FOLDER_PATH}/RazorpayStandard.framework" ]; then
  if [ -d "${BUILT_PRODUCTS_DIR}/${FRAMEWORKS_FOLDER_PATH}/RazorpayStandard.framework/_CodeSignature" ]; then
    echo "Removing existing code signature from RazorpayStandard.framework"
    rm -rf "${BUILT_PRODUCTS_DIR}/${FRAMEWORKS_FOLDER_PATH}/RazorpayStandard.framework/_CodeSignature"
  fi
fi

RAZORPAY_FIX

echo "✅ Razorpay fix applied successfully!"
echo ""
echo "Next steps:"
echo "1. Clean Build Folder in Xcode (Cmd+Shift+K)"
echo "2. Try archiving again"

