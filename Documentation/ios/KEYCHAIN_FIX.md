# Fix Keychain Access for Code Signing

## Quick Fix

Run this script:
```bash
cd ios
./fix-keychain-access.sh
```

## Manual Fix Steps

### Option 1: Allow Access When Prompted (Easiest)

1. When the keychain prompt appears during archive:
   - **Click "Always Allow"** (not just "Allow")
   - Enter your Mac password
   - This will remember the permission for future builds

### Option 2: Set Keychain Access via Keychain Access App

1. Open **Keychain Access** app (Applications > Utilities)
2. Select **"login"** keychain (left sidebar)
3. Search for: `Apple Development: Nirmal Patel (Spacecom Software LLP)`
4. **Double-click** the certificate
5. Go to **"Access Control"** tab
6. Select **"Allow all applications to access this item"**
7. Click **"Save Changes"**
8. Enter your password when prompted

### Option 3: Command Line Fix

Run this command in Terminal:
```bash
security set-key-partition-list -S apple-tool:,apple:,codesign: -s -k "" ~/Library/Keychains/login.keychain-db
```

### Option 4: Unlock Keychain Before Building

Before archiving, unlock your keychain:
```bash
security unlock-keychain ~/Library/Keychains/login.keychain-db
```

Then immediately try archiving in Xcode.

## Why This Happens

macOS requires explicit permission for applications (like Xcode's codesign tool) to access certificates in your keychain. This is a security feature.

## Prevention

After fixing, the permission should be remembered. If it keeps asking:
- Make sure you clicked "Always Allow" (not just "Allow")
- Check that the certificate is in the "login" keychain (not "System")
- Verify your Apple Developer account is properly configured in Xcode






