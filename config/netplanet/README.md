# Net Planet Client Configuration

This directory contains all client-specific configuration files for the Net Planet ISP app.

## Directory Structure

```
config/netplanet/
├── app.json                    # Expo/React Native app configuration
├── strings.json                # Client-specific UI strings
├── android-build.gradle        # Android build configuration template
├── keystore-config.gradle      # Android keystore configuration
├── android-strings.xml         # Android app name strings
├── ios-Info.plist             # iOS app configuration
├── logo-config.json           # Logo dimensions configuration
├── app-icons/                 # App icons directory
│   ├── android/               # Android icons (mipmap folders)
│   └── ios/                   # iOS icons (Images.xcassets)
└── assets/                    # Client-specific assets (logos, images)
```

## Required Files to Add

### 1. App Icons
Place the following icon files in the appropriate directories:

**Android Icons** (`app-icons/android/`):
- `mipmap-mdpi/ic_launcher.png` (48x48)
- `mipmap-hdpi/ic_launcher.png` (72x72)
- `mipmap-xhdpi/ic_launcher.png` (96x96)
- `mipmap-xxhdpi/ic_launcher.png` (144x144)
- `mipmap-xxxhdpi/ic_launcher.png` (192x192)
- `mipmap-anydpi-v26/ic_launcher.xml` (adaptive icon)
- `mipmap-anydpi-v26/ic_launcher_round.xml` (round adaptive icon)

**iOS Icons** (`app-icons/ios/`):
- `AppIcon.appiconset/` directory with all required sizes
- `icon.png` (1024x1024)
- `splash.png` (splash screen image)
- `adaptive-icon.png` (Android adaptive icon foreground)

### 2. Keystore File
- Place `Log2spaceNetPlanetAppKey.jks` keystore file in this directory
- Update `keystore-config.gradle` with correct passwords if different from defaults

### 3. Assets
- Place `isp_logo.png` in `assets/` directory
- Add any other client-specific images/logos

## Configuration Details

- **Package Name**: `com.spacecom.log2space.netplanet`
- **App Name**: Net Planet
- **Base URL**: `https://netplanet.l2s.biz/l2s/api`
- **Contact**: 9404824139
- **Email**: netplanetservices@gmail.com

## Build Commands

```bash
# Prepare configuration
npm run prepare:netplanet

# Build for Android
npm run android:netplanet

# Build for iOS
npm run ios:netplanet
```

## Notes

- All configuration files are templates and will be copied to the main app directory during build
- The keystore file must be provided separately for release builds
- Logo dimensions can be adjusted in `logo-config.json`

