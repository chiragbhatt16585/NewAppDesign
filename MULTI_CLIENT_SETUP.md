# Multi-Client Setup Guide

This guide explains how to build different client versions of your React Native app without manual file copying or cleaning.

## 🎯 Overview

Your app now supports three clients:
- **Microscan** (`com.microscan.app`)
- **DNA Infotel** (`com.h8.dnasubscriber`) 
- **One Sevenstar** (`com.spacecom.log2space.onesevenstar`)

Each client has its own:
- Bundle ID/Application ID
- App icons and branding
- Signing configuration
- Version numbers

## 📱 Android Setup (Complete)

### Build Commands

```bash
# DNA Infotel
cd android && ./gradlew assembleDnainfotelDebug
./gradlew assembleDnainfotelRelease

# Microscan  
./gradlew assembleMicroscanDebug
./gradlew assembleMicroscanRelease

# One Sevenstar
./gradlew assembleOnesevenstarDebug
./gradlew assembleOnesevenstarRelease
```

### Resource Structure

```
android/app/src/
├── microscan/res/          # Microscan icons & strings
├── dnainfotel/res/         # DNA Infotel icons & strings  
└── onesevenstar/res/       # One Sevenstar icons & strings
```

### Customization

- **Icons**: Replace files in `mipmap-*` folders for each client
- **Strings**: Edit `values/strings.xml` in each flavor folder
- **Signing**: Keystore files are configured per flavor in `build.gradle`

## 🚀 Play Store Release Builds

### Prerequisites

1. **Keystore files** are already configured for each client:
   - Microscan: `Log2SpaceEndUserMicroscan.jks`
   - DNA Infotel: `Log2spaceDNAInfotelAppKey.jks`
   - One Sevenstar: `OneSevenStar.jks`

2. **Signing passwords** are set to `log2space` for all clients

### Build Commands for Play Store

#### Option 1: Android App Bundle (AAB) - Recommended
```bash
# DNA Infotel
cd android && ./gradlew bundleDnainfotelRelease

# Microscan
./gradlew bundleMicroscanRelease

# One Sevenstar
./gradlew bundleOnesevenstarRelease
```

#### Option 2: APK Files
```bash
# DNA Infotel
cd android && ./gradlew assembleDnainfotelRelease

# Microscan
./gradlew assembleMicroscanRelease

# One Sevenstar
./gradlew assembleOnesevenstarRelease
```

### Output Locations

**AAB files** (recommended for Play Store):
```
android/app/build/outputs/bundle/dnainfotelRelease/app-dnainfotel-release.aab
android/app/build/outputs/bundle/microscanRelease/app-microscan-release.aab
android/app/build/outputs/bundle/onesevenstarRelease/app-onesevenstar-release.aab
```

**APK files**:
```
android/app/build/outputs/apk/dnainfotel/release/app-dnainfotel-release.apk
android/app/build/outputs/apk/microscan/release/app-microscan-release.apk
android/app/build/outputs/apk/onesevenstar/release/app-onesevenstar-release.apk
```

### Step-by-Step Play Store Upload Process

#### 1. Build Release Bundle
```bash
cd android
./gradlew bundleDnainfotelRelease  # or your target client
```

#### 2. Locate the AAB File
```bash
ls -la app/build/outputs/bundle/dnainfotelRelease/
# Look for: app-dnainfotel-release.aab
```

#### 3. Upload to Play Console
1. Go to [Google Play Console](https://play.google.com/console)
2. Select your app
3. Go to "Production" → "Create new release"
4. Upload the `.aab` file
5. Add release notes
6. Review and roll out

### Version Management

Each client has its own version in `build.gradle`:

| Client | Version Code | Version Name |
|--------|--------------|--------------|
| Microscan | 33 | 33.0.0 |
| DNA Infotel | 291 | 291.0.0 |
| One Sevenstar | 4 | 4.0.0 |

**To update versions:**
1. Edit `android/app/build.gradle`
2. Update `versionCode` and `versionName` for the specific flavor
3. Rebuild the release bundle

### Troubleshooting Release Builds

#### Signing Issues
```bash
# Verify keystore files exist
ls -la android/app/*.jks

# Check signing configuration
./gradlew signingReport
```

#### Build Errors
```bash
# Clean and rebuild
./gradlew clean
./gradlew bundleDnainfotelRelease
```

#### APK Size Optimization
```bash
# Analyze APK size
./gradlew assembleDnainfotelRelease
# Check: android/app/build/outputs/apk/dnainfotel/release/
```

### Play Store Best Practices

1. **Always use AAB format** (smaller file size, better optimization)
2. **Test on multiple devices** before release
3. **Increment version codes** for each release
4. **Use descriptive release notes**
5. **Test internal testing** before production

## 🍎 iOS Setup

### Quick Setup

Run the setup script:
```bash
./scripts/create-ios-targets.sh
```

### Manual Setup

1. **Open Xcode**: `open ios/ISPApp.xcworkspace`

2. **Create targets** for each client:
   - File > New > Target > App
   - Configure bundle IDs and display names

3. **Configure each target**:
   - Set Display Name and Bundle Identifier
   - Configure app icons from asset catalogs
   - Set up code signing

4. **Create schemes** for each target

### Build Commands (after setup)

```bash
# DNA Infotel
xcodebuild -workspace ios/ISPApp.xcworkspace -scheme DNAInfotelApp -configuration Debug -destination "platform=iOS Simulator,name=iPhone 15"

# Microscan
xcodebuild -workspace ios/ISPApp.xcworkspace -scheme MicroscanApp -configuration Debug -destination "platform=iOS Simulator,name=iPhone 15"

# One Sevenstar  
xcodebuild -workspace ios/ISPApp.xcworkspace -scheme OneSevenstarApp -configuration Debug -destination "platform=iOS Simulator,name=iPhone 15"
```

## 🚀 Benefits

### ✅ No More Manual Work
- No file copying between clients
- No cleaning required
- No manual configuration changes

### ✅ Robust & Scalable
- Industry-standard approach
- Easy to add new clients
- Proper separation of concerns

### ✅ Developer Friendly
- Single command builds
- Clear client separation
- Easy debugging per client

## 🔧 Troubleshooting

### Android Issues

**Build fails with package not found:**
- Make sure you're using the correct flavor command
- Clean build: `cd android && ./gradlew clean`

**Icons not showing:**
- Check that icons are in the correct flavor folder
- Verify `mipmap-*` folder structure

**Release build signing errors:**
- Verify keystore files exist in `android/app/`
- Check signing passwords in `build.gradle`
- Run `./gradlew signingReport` to debug

### iOS Issues

**Scheme not found:**
- Make sure you created schemes for each target
- Check scheme names match the build commands

**Code signing errors:**
- Verify development team is set for each target
- Check bundle identifiers are unique

## 📋 Client Configurations

| Client | Android ID | iOS Bundle ID | Version |
|--------|------------|---------------|---------|
| Microscan | `com.microscan.app` | `com.microscan.app` | 33.0.0 |
| DNA Infotel | `com.h8.dnasubscriber` | `com.h8.dnasubscriber` | 291.0.0 |
| One Sevenstar | `com.spacecom.log2space.onesevenstar` | `com.spacecom.log2space.onesevenstar` | 4.0.0 |

## 🎯 Quick Reference

### Android Builds
```bash
# Debug builds
./gradlew assembleDnainfotelDebug
./gradlew assembleMicroscanDebug  
./gradlew assembleOnesevenstarDebug

# Release builds (APK)
./gradlew assembleDnainfotelRelease
./gradlew assembleMicroscanRelease
./gradlew assembleOnesevenstarRelease

# Play Store builds (AAB)
./gradlew bundleDnainfotelRelease
./gradlew bundleMicroscanRelease
./gradlew bundleOnesevenstarRelease
```

### iOS Builds (after setup)
```bash
# Debug builds
xcodebuild -workspace ios/ISPApp.xcworkspace -scheme DNAInfotelApp -configuration Debug
xcodebuild -workspace ios/ISPApp.xcworkspace -scheme MicroscanApp -configuration Debug
xcodebuild -workspace ios/ISPApp.xcworkspace -scheme OneSevenstarApp -configuration Debug
```

## 🆕 Adding New Clients

### Android
1. Add new flavor in `android/app/build.gradle`
2. Create resource folder: `android/app/src/[clientname]/res/`
3. Add icons and strings to the new folder
4. Add keystore file and signing config

### iOS  
1. Create new target in Xcode
2. Configure bundle ID and display name
3. Set up app icons and code signing
4. Create scheme for the new target

---

**🎉 You now have a robust, scalable multi-client setup that eliminates manual work!** 