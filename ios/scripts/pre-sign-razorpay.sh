#!/bin/bash

# Pre-sign script for Razorpay frameworks
# This removes existing code signatures so Xcode can properly re-sign them

set +e  # Don't fail if frameworks don't exist

echo "=== Pre-signing Razorpay Frameworks ==="

# Paths to Razorpay frameworks in the build products
RAZORPAY_FRAMEWORK="${BUILT_PRODUCTS_DIR}/${FRAMEWORKS_FOLDER_PATH}/Razorpay.framework"
RAZORPAY_CORE_FRAMEWORK="${BUILT_PRODUCTS_DIR}/${FRAMEWORKS_FOLDER_PATH}/RazorpayCore.framework"
RAZORPAY_STANDARD_FRAMEWORK="${BUILT_PRODUCTS_DIR}/${FRAMEWORKS_FOLDER_PATH}/RazorpayStandard.framework"

# Function to remove code signature
remove_signature() {
    local framework_path="$1"
    if [ -d "$framework_path" ]; then
        echo "Removing code signature from $(basename "$framework_path")..."
        # Remove _CodeSignature directory
        if [ -d "${framework_path}/_CodeSignature" ]; then
            rm -rf "${framework_path}/_CodeSignature"
            echo "  ✅ Removed _CodeSignature"
        fi
        # Remove embedded provisioning profile if exists
        if [ -f "${framework_path}/embedded.mobileprovision" ]; then
            rm -f "${framework_path}/embedded.mobileprovision"
            echo "  ✅ Removed embedded.mobileprovision"
        fi
    fi
}

# Remove signatures from all Razorpay frameworks
remove_signature "$RAZORPAY_FRAMEWORK"
remove_signature "$RAZORPAY_CORE_FRAMEWORK"
remove_signature "$RAZORPAY_STANDARD_FRAMEWORK"

echo "=== Pre-signing Complete ==="

