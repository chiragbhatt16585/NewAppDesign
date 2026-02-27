# Fix Code Signing Conflict Error

## The Error

```
Spacecom End User App has conflicting provisioning settings.
Spacecom End User App is automatically signed for development, but a conflicting code signing identity Apple Distribution has been manually specified.
```

## What I Fixed

I removed the hardcoded `CODE_SIGN_IDENTITY = "Apple Distribution"` from both Debug and Release configurations. This allows Xcode's automatic signing to work properly.

## Next Steps

### Option 1: Use Automatic Signing (Recommended)

1. **Open Xcode** → Open `ISPApp.xcworkspace`

2. **Select your target:**
   - Click "Spacecom End User App" in left sidebar
   - Go to **"Signing & Capabilities"** tab

3. **Ensure automatic signing is enabled:**
   - ✅ Check **"Automatically manage signing"**
   - Select your **Team**: "Spacecom Software LLP (NADT67WN3N)"
   - Xcode will automatically select the correct provisioning profile

4. **For Archive/Release builds:**
   - Xcode will automatically use "Apple Distribution" when archiving
   - For development builds, it will use "Apple Development"

5. **Clean and Archive:**
   - Product > Clean Build Folder (Cmd+Shift+K)
   - Product > Archive

### Option 2: Manual Signing (If Needed)

If you need manual signing:

1. In **Signing & Capabilities** tab
2. **Uncheck** "Automatically manage signing"
3. Manually select:
   - **Signing Certificate**: "Apple Development" (for dev) or "Apple Distribution" (for release)
   - **Provisioning Profile**: Select the appropriate profile

## Why This Happened

The project had hardcoded `CODE_SIGN_IDENTITY = "Apple Distribution"` in the build settings, which conflicts with automatic signing. Automatic signing needs to choose the certificate based on the build type:
- **Development builds** → "Apple Development"
- **Archive/Release builds** → "Apple Distribution"

By removing the hardcoded value, Xcode can now automatically select the correct certificate.

## Verification

After fixing, you should see:
- ✅ No code signing errors in Xcode
- ✅ Automatic signing working correctly
- ✅ Archive builds using "Apple Distribution"
- ✅ Development builds using "Apple Development"

