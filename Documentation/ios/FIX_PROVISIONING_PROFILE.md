# Fix Missing Provisioning Profile Error

## The Error

```
error: Build input file cannot be found: '/Users/.../Provisioning Profiles/a54b2e58-c789-43ce-9873-013684dd804c.mobileprovision'
```

## Quick Fix

Run this script:
```bash
cd ios
./fix-provisioning-profile.sh
```

## Manual Fix Steps

### Step 1: Clean Xcode's Provisioning Profile Cache

```bash
rm -rf ~/Library/Developer/Xcode/UserData/Provisioning\ Profiles/*
rm -rf ~/Library/Developer/Xcode/DerivedData/*
```

### Step 2: Refresh Provisioning Profiles in Xcode

1. **Open Xcode**
2. **Go to:** Xcode > Settings (or Preferences) > Accounts
3. **Select your Apple ID** (the one with your developer account)
4. **Click "Download Manual Profiles"** (if the button is available)
5. **Or click the refresh button** (circular arrow) to sync profiles

### Step 3: Configure Automatic Signing

1. **In Xcode**, open `ISPApp.xcworkspace`
2. **Select your target:** "Spacecom End User App"
3. **Go to "Signing & Capabilities" tab**
4. **Ensure:**
   - ✅ **"Automatically manage signing"** is checked
   - **Team** is selected: "Spacecom Software LLP (NADT67WN3N)"
   - Xcode will automatically create/download the correct provisioning profile

### Step 4: Clean and Rebuild

1. **Clean Build Folder:** Product > Clean Build Folder (Cmd+Shift+K)
2. **Try archiving again:** Product > Archive

## Why This Happens

- The provisioning profile was deleted or expired
- Xcode's cache has a reference to an old profile that no longer exists
- The profile was moved or the UUID changed
- Automatic signing wasn't properly configured

## Prevention

With **automatic signing** enabled, Xcode will:
- Automatically create provisioning profiles when needed
- Download and update profiles automatically
- Handle profile expiration and renewal
- Match profiles to your bundle identifier and certificates

## If Automatic Signing Doesn't Work

If you need to use manual signing:

1. **Uncheck** "Automatically manage signing"
2. **Manually select** a provisioning profile from the dropdown
3. Make sure the profile:
   - Matches your bundle identifier: `com.log2space.client.enduser`
   - Is valid and not expired
   - Matches your signing certificate

## Verify Profile

To check if your provisioning profile exists:
```bash
ls -la ~/Library/MobileDevice/Provisioning\ Profiles/
```

Or in Xcode: Window > Devices and Simulators > Right-click your device > Show Provisioning Profiles




