# Gateway FTTH Client Configuration

This folder contains all the configuration files for the Gateway FTTH client app.

## Configuration Files Created

- `app.json` - Expo/React Native app configuration
- `api.ts` - API service configuration with base URL: gatewayftth.l2s.biz
- `strings.json` - App strings and labels
- `android-build.gradle` - Android build configuration (package: com.spacecom.log2space.gatewayftth)
- `android-strings.xml` - Android string resources
- `ios-Info.plist` - iOS app configuration (bundle: com.spacecom.log2space.gatewayftth)
- `keystore-config.gradle` - Android keystore configuration
- `logo-config.json` - Logo display configuration

## What You Need to Add

### 1. App Icons
Place your app icons in the following directories:
- `app-icons/android/` - All Android icon sizes (mipmap folders)
- `app-icons/ios/AppIcon.appiconset/` - iOS app icons
- `app-icons/icon.png` - Main app icon
- `app-icons/splash.png` - Splash screen image
- `app-icons/adaptive-icon.png` - Android adaptive icon
- `app-icons/favicon.png` - Web favicon

### 2. Logo Assets
- Place your logo file in `assets/` directory
- Recommended name: `isp_logo.png` (as configured in client-config.ts)

### 3. Android Keystore
- Create and place your release keystore file: `Log2spaceDNAGoaAppKey.jks`
- Update keystore password in `keystore-config.gradle` if different from default

## Client Details Configured

- **Client ID**: gatewayftth
- **Client Name**: Gateway FTTH Pvt Ltd.
- **Package Name**: com.spacecom.log2space.gatewayftth
- **Base URL**: gatewayftth.l2s.biz
- **Email**: info@gatewayftth.com
- **Contact**: 9152184184 / 9320184184

## Office Addresses

1. **Head Office**
   - Office No 5, 1st Floor, Telecom House. Kamla Raman Nagar. Baiganwadi Govandi. Mumbai-400043.

## Next Steps

1. Add your logo and app icons to the respective directories
2. Create the Android keystore file for release builds
3. Update the main client configuration if needed
4. Test the app with the new client configuration

