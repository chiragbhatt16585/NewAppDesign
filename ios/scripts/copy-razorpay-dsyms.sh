#!/bin/bash

# Script to copy Razorpay dSYMs to archive
# This ensures Razorpay dSYMs are included in the archive for crash symbolication

# Don't use set -e here, we want to continue even if some files are missing
set +e

echo "Copying Razorpay dSYMs to archive..."

# Only run during archive builds
if [ "${ACTION}" != "install" ] && [ "${ACTION}" != "archive" ]; then
    echo "Skipping dSYM copy (not an archive/install build)"
    exit 0
fi

# Get the archive dSYM folder path
if [ -n "${DWARF_DSYM_FOLDER_PATH}" ] && [ -n "${DWARF_DSYM_FILE_NAME}" ]; then
    DSYM_FOLDER="${DWARF_DSYM_FOLDER_PATH}/${DWARF_DSYM_FILE_NAME}/Contents/Resources/DWARF"
    
    # Check if dSYM folder exists
    if [ ! -d "${DSYM_FOLDER}" ]; then
        echo "Warning: dSYM folder not found at ${DSYM_FOLDER}, skipping Razorpay dSYM copy"
        exit 0
    fi
    
    # Copy Razorpay dSYMs
    RAZORPAY_DSYM_SOURCE="${PODS_ROOT}/razorpay-core-pod/Pod/core/Razorpay.xcframework/ios-arm64/dSYMs/Razorpay.framework.dSYM"
    if [ -d "${RAZORPAY_DSYM_SOURCE}" ]; then
        echo "Copying Razorpay.framework.dSYM..."
        cp -R "${RAZORPAY_DSYM_SOURCE}" "${DSYM_FOLDER}/" || echo "Warning: Failed to copy Razorpay dSYM"
    fi
    
    # Copy RazorpayCore dSYMs
    RAZORPAY_CORE_DSYM_SOURCE="${PODS_ROOT}/razorpay-core-pod/Pod/core/RazorpayCore.xcframework/ios-arm64/dSYMs/RazorpayCore.framework.dSYM"
    if [ -d "${RAZORPAY_CORE_DSYM_SOURCE}" ]; then
        echo "Copying RazorpayCore.framework.dSYM..."
        cp -R "${RAZORPAY_CORE_DSYM_SOURCE}" "${DSYM_FOLDER}/" || echo "Warning: Failed to copy RazorpayCore dSYM"
    fi
    
    # Copy RazorpayStandard dSYMs
    RAZORPAY_STANDARD_DSYM_SOURCE="${PODS_ROOT}/razorpay-pod/Pod/RazorpayStandard.xcframework/ios-arm64/dSYMs/RazorpayStandard.framework.dSYM"
    if [ -d "${RAZORPAY_STANDARD_DSYM_SOURCE}" ]; then
        echo "Copying RazorpayStandard.framework.dSYM..."
        cp -R "${RAZORPAY_STANDARD_DSYM_SOURCE}" "${DSYM_FOLDER}/" || echo "Warning: Failed to copy RazorpayStandard dSYM"
    fi
    
    echo "Razorpay dSYMs copy completed"
else
    echo "Warning: dSYM paths not set, skipping Razorpay dSYM copy"
fi

