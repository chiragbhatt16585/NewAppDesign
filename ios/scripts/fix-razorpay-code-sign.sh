#!/bin/bash

# Fix Razorpay framework code signing during archive
# This script prevents Xcode from trying to re-sign already-signed frameworks

set -e

echo "=== Fixing Razorpay Code Signing ==="

# Only run during archive
if [ "${ACTION}" != "install" ] && [ "${ACTION}" != "archive" ]; then
    exit 0
fi

# Path to Razorpay frameworks
RAZORPAY_CORE_FRAMEWORK="${BUILT_PRODUCTS_DIR}/${FRAMEWORKS_FOLDER_PATH}/RazorpayCore.framework"
RAZORPAY_FRAMEWORK="${BUILT_PRODUCTS_DIR}/${FRAMEWORKS_FOLDER_PATH}/Razorpay.framework"

# Remove code signature if framework exists and is causing issues
if [ -d "${RAZORPAY_CORE_FRAMEWORK}" ]; then
    echo "Checking RazorpayCore.framework..."
    # Remove existing signature to allow Xcode to re-sign properly
    if [ -d "${RAZORPAY_CORE_FRAMEWORK}/_CodeSignature" ]; then
        echo "Removing existing code signature from RazorpayCore.framework..."
        rm -rf "${RAZORPAY_CORE_FRAMEWORK}/_CodeSignature"
    fi
fi

if [ -d "${RAZORPAY_FRAMEWORK}" ]; then
    echo "Checking Razorpay.framework..."
    if [ -d "${RAZORPAY_FRAMEWORK}/_CodeSignature" ]; then
        echo "Removing existing code signature from Razorpay.framework..."
        rm -rf "${RAZORPAY_FRAMEWORK}/_CodeSignature"
    fi
fi

echo "Razorpay code signing fix completed"






