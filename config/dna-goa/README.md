# DNA Goa Client Configuration

This folder contains all the configuration files for the DNA Goa client app.

## Configuration Files Created

- `app.json` - Expo/React Native app configuration
- `api.ts` - API service configuration with base URL: crm.dnagoa.com
- `strings.json` - App strings and labels
- `android-build.gradle` - Android build configuration (package: com.dnagoa)
- `android-strings.xml` - Android string resources
- `ios-Info.plist` - iOS app configuration (bundle: com.dnagoa)
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
- Recommended name: `dna_logo.png` (as configured in client-config.ts)

### 3. Android Keystore
- Create and place your release keystore file: `Log2spaceDNAGoaAppKey.jks`
- Update keystore password in `keystore-config.gradle` if different from default

## Client Details Configured

- **Client ID**: dna-goa
- **Client Name**: DNA Goa
- **Package Name**: com.dnagoa
- **Base URL**: crm.dnagoa.com
- **Email**: sales@dnagoa.com
- **Contact**: 0832-6747575

## Office Addresses

1. **Head Office - Panjim**
   - 106, 1st Floor, Gera's Imperium, Patto, Patto Center. Panaji, GOA-403001

2. **Branch Office - Ponda**
   - DNA-GOA, Omkar Building, Opp. Sapana Park, Bethora Road, Ponda, GOA-403401

3. **Branch Office - Colva**
   - 72/2B, Near Colva Police Station, Opp. Amul Icecream Parlour, Colva, Salcete, GOA-403708

## Next Steps

1. Add your logo and app icons to the respective directories
2. Create the Android keystore file for release builds
3. Update the main client configuration if needed
4. Test the app with the new client configuration

