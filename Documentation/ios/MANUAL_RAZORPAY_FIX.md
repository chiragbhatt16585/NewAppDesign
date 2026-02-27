# Manual Fix for Razorpay Code Signing Error

## Quick Fix (Do This Now)

Since the automatic fix may not have applied, here's the manual fix:

### Step 1: Run the fix script manually
```bash
cd ios
./scripts/fix-razorpay-embed.sh
```

### Step 2: Add Build Phase Script in Xcode (RECOMMENDED)

This is the most reliable fix:

1. **Open Xcode** → Open `ISPApp.xcworkspace`

2. **Select Target:**
   - Click "Spacecom End User App" in left sidebar
   - Go to **"Build Phases"** tab

3. **Add New Script Phase:**
   - Click **"+"** button at top
   - Select **"New Run Script Phase"**

4. **Configure:**
   - **Name:** "Fix Razorpay Code Signing"
   - **Drag it** to be **BEFORE** "[CP] Embed Pods Frameworks"
   - **Script:**
     ```bash
     set +e
     echo "Removing Razorpay framework code signatures..."
     
     if [ -d "${BUILT_PRODUCTS_DIR}/${FRAMEWORKS_FOLDER_PATH}/Razorpay.framework/_CodeSignature" ]; then
       rm -rf "${BUILT_PRODUCTS_DIR}/${FRAMEWORKS_FOLDER_PATH}/Razorpay.framework/_CodeSignature"
       echo "Removed Razorpay.framework signature"
     fi
     
     if [ -d "${BUILT_PRODUCTS_DIR}/${FRAMEWORKS_FOLDER_PATH}/RazorpayCore.framework/_CodeSignature" ]; then
       rm -rf "${BUILT_PRODUCTS_DIR}/${FRAMEWORKS_FOLDER_PATH}/RazorpayCore.framework/_CodeSignature"
       echo "Removed RazorpayCore.framework signature"
     fi
     
     if [ -d "${BUILT_PRODUCTS_DIR}/${FRAMEWORKS_FOLDER_PATH}/RazorpayStandard.framework/_CodeSignature" ]; then
       rm -rf "${BUILT_PRODUCTS_DIR}/${FRAMEWORKS_FOLDER_PATH}/RazorpayStandard.framework/_CodeSignature"
       echo "Removed RazorpayStandard.framework signature"
     fi
     ```
   - **Uncheck:** "For install builds only"
   - **Check:** "Show environment variables in build log" (optional)

5. **Save and Archive**

### Step 3: Clean and Archive
```bash
# Clean derived data
rm -rf ~/Library/Developer/Xcode/DerivedData/*

# In Xcode:
# Product > Clean Build Folder (Cmd+Shift+K)
# Product > Archive
```

## Why This Works

The script removes existing code signatures from Razorpay frameworks **before** Xcode tries to sign them during the embed phase. This allows Xcode to properly re-sign them with your development certificate.

## Alternative: Disable Code Signing for Frameworks

If the above doesn't work, you can try disabling code signing for embedded frameworks (not recommended but works):

1. In Xcode Build Settings
2. Search for "Code Signing"
3. Find "Code Signing Identity" for Release
4. Set to "Don't Code Sign"

But this may cause App Store submission issues, so use the build phase script method first.

