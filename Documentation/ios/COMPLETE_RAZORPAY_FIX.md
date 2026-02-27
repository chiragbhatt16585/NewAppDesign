# Complete Fix for Razorpay Code Signing Error

## The Error
```
errSecInternalComponent
Command PhaseScriptExecution failed with a nonzero exit code
```

## Solution Applied

I've updated the Podfile to automatically patch the CocoaPods embed frameworks script. This will run every time you do `pod install`.

## Steps to Fix

### 1. Run pod install
```bash
cd ios
pod install
```

This will automatically apply the Razorpay signing fix to the embed frameworks script.

### 2. Clean and Archive
```bash
# Clean derived data
rm -rf ~/Library/Developer/Xcode/DerivedData/*

# In Xcode:
# 1. Product > Clean Build Folder (Cmd+Shift+K)
# 2. Product > Archive
```

## What the Fix Does

The fix modifies the CocoaPods embed frameworks script to:
1. Remove existing code signatures from Razorpay frameworks BEFORE Xcode tries to sign them
2. This allows Xcode to properly re-sign them with your development certificate

## If It Still Fails

### Option 1: Manual Script Run
```bash
cd ios
./scripts/fix-razorpay-embed.sh
pod install
```

### Option 2: Add Build Phase Script in Xcode

1. Open Xcode → `ISPApp.xcworkspace`
2. Select target "Spacecom End User App"
3. Go to "Build Phases" tab
4. Click "+" → "New Run Script Phase"
5. Name it: "Fix Razorpay Signing"
6. Drag it BEFORE "[CP] Embed Pods Frameworks"
7. Add script:
   ```bash
   set +e
   if [ -d "${BUILT_PRODUCTS_DIR}/${FRAMEWORKS_FOLDER_PATH}/Razorpay.framework/_CodeSignature" ]; then
     rm -rf "${BUILT_PRODUCTS_DIR}/${FRAMEWORKS_FOLDER_PATH}/Razorpay.framework/_CodeSignature"
   fi
   if [ -d "${BUILT_PRODUCTS_DIR}/${FRAMEWORKS_FOLDER_PATH}/RazorpayCore.framework/_CodeSignature" ]; then
     rm -rf "${BUILT_PRODUCTS_DIR}/${FRAMEWORKS_FOLDER_PATH}/RazorpayCore.framework/_CodeSignature"
   fi
   ```
8. Uncheck "For install builds only"

### Option 3: Keychain Fix
```bash
# Unlock keychain
security unlock-keychain ~/Library/Keychains/login.keychain-db

# Grant codesign access
security set-key-partition-list -S apple-tool:,apple:,codesign: -s -k "" ~/Library/Keychains/login.keychain-db
```

## Verification

After running `pod install`, check that the fix was applied:
```bash
grep -q "RAZORPAY_FIX_APPLIED" ios/Pods/Target\ Support\ Files/Pods-Spacecom\ End\ User\ App/Pods-Spacecom\ End\ User\ App-frameworks.sh && echo "Fix applied!" || echo "Fix not applied"
```

