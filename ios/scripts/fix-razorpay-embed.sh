#!/bin/bash

# Fix Razorpay framework code signing during embed phase
# This script modifies the CocoaPods embed frameworks script to handle Razorpay

set +e  # Don't fail if something doesn't exist

EMBED_SCRIPT="${PODS_ROOT}/Target Support Files/Pods-Spacecom End User App/Pods-Spacecom End User App-frameworks.sh"

if [ ! -f "$EMBED_SCRIPT" ]; then
    echo "Embed script not found, skipping Razorpay fix"
    exit 0
fi

# Check if we've already patched this script
if grep -q "RAZORPAY_FIX_APPLIED" "$EMBED_SCRIPT"; then
    echo "Razorpay fix already applied to embed script"
    exit 0
fi

echo "Patching CocoaPods embed frameworks script to fix Razorpay signing..."

# Create a backup
cp "$EMBED_SCRIPT" "${EMBED_SCRIPT}.backup"

# Add our fix before the code signing section
cat >> "$EMBED_SCRIPT" << 'RAZORPAY_PATCH'

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

RAZORPAY_PATCH

echo "Razorpay fix applied to embed script"

