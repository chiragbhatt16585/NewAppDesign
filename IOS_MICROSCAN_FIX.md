# iOS Microscan App Fix

## Issues Fixed

### 1. ✅ AppDelegate Module Name
**Problem:** AppDelegate.swift had `withModuleName: "DNAInfotelApp"` hardcoded, causing "DNAInfotelApp has been registered" error.

**Fix:** Updated `scripts/build-client-enhanced.js` to properly update the `withModuleName` parameter based on the client's app.json name.

**Status:** ✅ Fixed - AppDelegate.swift now shows `withModuleName: "MicroscanApp"`

### 2. ✅ iOS Icons
**Problem:** When running microscan app, Goa's icons were showing instead of microscan icons.

**Fix:** The build script now properly copies iOS icons from `config/microscan/app-icons/ios/` to `ios/ISPApp/Images.xcassets/AppIcon.appiconset/`.

**Status:** ✅ Fixed - Icons have been copied

## Next Steps for iOS

### 1. Clean Xcode Build
If you still see Goa's icons, you need to clean the Xcode build:

```bash
# In Xcode:
1. Product > Clean Build Folder (Shift + Cmd + K)
2. Close Xcode
3. Delete DerivedData:
   rm -rf ~/Library/Developer/Xcode/DerivedData/*
4. Reopen Xcode
```

### 2. Verify Bundle Identifier
Make sure the bundle identifier in Xcode matches:
- **Microscan:** `com.microscan.app` (from build-config.json)
- **Note:** app.json shows `com.spacecom.log2space.microscan` but build-config.json uses `com.microscan.app`

**To fix bundle identifier mismatch:**
1. Open `ios/ISPApp.xcworkspace` in Xcode
2. Select the project in the navigator
3. Select the "ISPApp" target
4. Go to "Signing & Capabilities" tab
5. Update Bundle Identifier to: `com.microscan.app`

### 3. Refresh Asset Catalog
If icons still don't update:
1. In Xcode, open `Images.xcassets`
2. Select `AppIcon`
3. Right-click and select "Show in Finder"
4. Verify the icon files are from microscan (not dna-goa)
5. If wrong icons, run: `npm run build:microscan` again

### 4. Run the App
```bash
# Make sure you've switched to microscan
npm run build:microscan

# Then in Xcode:
1. Select the correct scheme (ISPApp)
2. Select your device/simulator
3. Click Run (Cmd + R)
```

## Verification Checklist

- [x] AppDelegate.swift has `withModuleName: "MicroscanApp"`
- [x] Info.plist shows `CFBundleDisplayName: "Microscan"`
- [x] Icons copied to `ios/ISPApp/Images.xcassets/AppIcon.appiconset/`
- [ ] Bundle identifier in Xcode matches `com.microscan.app`
- [ ] Xcode build folder cleaned
- [ ] App runs without "DNAInfotelApp has been registered" error
- [ ] Correct microscan icons display

## Troubleshooting

### Still seeing "DNAInfotelApp has been registered"?
1. Make sure you ran: `npm run build:microscan`
2. Check AppDelegate.swift line 27 should be: `withModuleName: "MicroscanApp"`
3. Clean build folder in Xcode
4. Restart Metro bundler: `npm start -- --reset-cache`

### Still seeing Goa's icons?
1. Clean Xcode build folder (Shift + Cmd + K)
2. Delete DerivedData: `rm -rf ~/Library/Developer/Xcode/DerivedData/*`
3. Verify icons in `ios/ISPApp/Images.xcassets/AppIcon.appiconset/` are microscan icons
4. In Xcode, select AppIcon asset and verify images are correct
5. Rebuild the app

### App won't open?
1. Check bundle identifier matches in Xcode
2. Make sure code signing is configured
3. Check device/simulator logs for errors
4. Try deleting the app from device/simulator and reinstalling

