# ISP Connect App

A modern React Native app for ISP customers to manage their internet services, with support for multiple clients (Microscan, DNA Infotel, etc.).

## 🚀 Quick Start

### Build for Different Clients

```bash
# Build for Microscan (Current)
npm run build:microscan

# Build for DNA Infotel
npm run build:dna-infotel

# Run on Android
npm run dev:microscan    # or npm run dev:dna-infotel

# Run on iOS
npm run ios:microscan    # or npm run ios:dna-infotel
```

### What Gets Changed Per Client

| Client | Bundle ID | App Name | API URL | Company |
|--------|-----------|----------|---------|---------|
| **Microscan** | `in.spacecom.log2space.client.microscan` | "Microscan ISP App" | `https://mydesk.microscan.co.in` | "Microscan Internet Private Limited" |
| **DNA Infotel** | `com.h8.dnasubscriber` | "DNA Infotel App" | `https://crm.dnainfotel.com` | "DNA Infotel Private Limited" |

## 📚 **Documentation**

- **📖 [README.md](README.md)** - Complete setup and configuration guide
- **⚡ [QUICK_START.md](QUICK_START.md)** - Quick reference for commands
- **🍎 [IOS_DEVELOPMENT_NOTES.md](IOS_DEVELOPMENT_NOTES.md)** - iOS development guide
- **🔧 [API_INTEGRATION.md](API_INTEGRATION.md)** - API integration details

## Features

- **Multi-Client Support**: Easy switching between different ISP clients
- **Login Screen**: Username/Password and OTP login with client-specific branding
- **Home Screen**: Account details, quick actions, and bill management
- **Ledger Screen**: Complete transaction history with PDF download functionality
- **More Options Screen**: Extended menu with additional features
- **Modern UI**: Clean, responsive design with beautiful animations
- **Cross-platform**: Works on both Android and iOS
- **PDF Download**: Download invoices, receipts, and proforma invoices
- **Real API Integration**: Connected to backend services for live data

## 📁 Project Structure

```
ISPApp/
├── config/                    # Client configurations
│   ├── microscan/            # Microscan client config
│   │   ├── app.json          # App metadata
│   │   ├── api.ts            # API endpoints
│   │   ├── strings.json      # Text strings
│   │   ├── keystore-config.gradle  # Keystore configuration
│   │   ├── Log2SpaceEndUserMicroscan.jks  # Keystore file
│   │   └── assets/           # Logos and icons
│   └── dna-infotel/          # DNA Infotel client config
│       ├── app.json
│       ├── api.ts
│       ├── strings.json
│       ├── keystore-config.gradle  # Keystore configuration
│       ├── Log2spaceDNAInfotelAppKey.jks  # Keystore file
│       └── assets/
├── src/                      # Main app source code
│   ├── screens/              # App screens
│   ├── components/           # Reusable components
│   ├── services/             # API and utility services
│   └── utils/                # Context and utilities
└── scripts/
    └── build-client.js       # Build automation script
```

## 🔧 Adding a New Client

### Step 1: Create Client Directory
```bash
mkdir -p config/newclient
mkdir -p config/newclient/assets
```

### Step 2: Copy Template Files
```bash
cp config/microscan/* config/newclient/
```

### Step 3: Update Configuration Files

**app.json** - Update bundle ID and app name:
```json
{
  "name": "New Client ISP",
  "displayName": "New Client ISP",
  "expo": {
    "name": "New Client ISP",
    "slug": "newclient-isp-app"
  }
}
```

**api.ts** - Update API endpoints:
```typescript
export const API_CONFIG = {
  BASE_URL: 'https://api.newclient.com',
  ENDPOINTS: {
    CHECK_AUTH_TYPE: '/auth/check-type',
    LOGIN: '/auth/login',
    // ... other endpoints
  }
};
```

**strings.json** - Update company details:
```json
{
  "companyName": "New Client Internet",
  "appName": "New Client ISP",
  "welcomeMessage": "Welcome to New Client ISP"
}
```

### Step 4: Add Keystore Files

**Add your keystore file:**
```bash
# Copy your keystore file to the client config directory
cp your-keystore.jks config/newclient/
```

**Update keystore-config.gradle:**
```gradle
// New Client Keystore Configuration
signingConfigs {
    debug {
        storeFile file('debug.keystore')
        storePassword 'android'
        keyAlias 'androiddebugkey'
        keyPassword 'android'
    }
    release {
        storeFile file('your-keystore.jks')  // Your keystore file name
        storePassword 'your_store_password'   // Your store password
        keyAlias 'your_key_alias'            // Your key alias
        keyPassword 'your_key_password'       // Your key password
    }
}
```

### Step 5: Add Build Script
Add to `package.json`:
```json
{
  "scripts": {
    "build:newclient": "node scripts/build-client.js newclient",
    "dev:newclient": "npm run build:newclient && npx react-native run-android"
  }
}
```

### Step 6: Add Client Logo
- Place logo in `config/newclient/assets/`
- Update `config/newclient/logo-config.json` with dimensions

## 🔐 Keystore Management

### Current Keystore Files

| Client | Keystore File | Store Password | Key Alias | Key Password |
|--------|---------------|----------------|-----------|--------------|
| **Microscan** | `Log2SpaceEndUserMicroscan.jks` | `log2space` | `log2space` | `log2space` |
| **DNA Infotel** | `Log2spaceDNAInfotelAppKey.jks` | `dnasubscriber` | `dnasubscriber` | `dnasubscriber` |

### Adding Keystore for New Client

1. **Place keystore file** in `config/newclient/your-keystore.jks`
2. **Update keystore-config.gradle** with your credentials:
   ```gradle
   release {
       storeFile file('your-keystore.jks')
       storePassword 'your_store_password'
       keyAlias 'your_key_alias'
       keyPassword 'your_key_password'
   }
   ```

### Security Notes
- ✅ Keystore files are copied to `android/app/` during build
- ✅ Each client has separate keystore configuration
- ✅ Passwords are stored in keystore-config.gradle files
- ⚠️ Keep keystore files secure and backed up
- ⚠️ Update passwords in keystore-config.gradle when needed

## 🎨 Logo Management

### In-App Logos
- **Location**: `src/assets/` (copied from client config)
- **Usage**: Login screen, headers, etc.
- **Format**: PNG with transparent background

### App Icons
- **Android**: `android/app/src/main/res/mipmap-*/`
- **iOS**: `ios/ISPApp/Images.xcassets/AppIcon.appiconset/`

### Required Icon Sizes
- **Android**: 48x48, 72x72, 96x96, 144x144, 192x192 px
- **iOS**: 20x20, 29x29, 40x40, 60x60, 76x76, 83.5x83.5 px

## 🚨 Common Issues & Fixes

### Logo Not Updating
```bash
# Clear cache and rebuild
npx react-native start --reset-cache
adb shell am force-stop com.h8.dnasubscriber
npm run build:dna-infotel
```

### Package Name Errors
```bash
# Clean Android build
cd android && ./gradlew clean && cd ..
npm run build:dna-infotel
```

### App Name Not Changing
```bash
# Uninstall and reinstall
adb uninstall com.h8.dnasubscriber
npm run build:dna-infotel
```

### Keystore Errors
```bash
# Clean Android build
cd android && ./gradlew clean && cd ..

# Check keystore file exists
ls android/app/*.jks

# Rebuild with keystore
npm run build:dna-infotel
```

### iOS Module Registration Error
```bash
# Fix iOS module registration
npm run fix-ios

# Then rebuild for your client
npm run build:dna-infotel
```

## 📱 Screenshots

### Login Screen
- Beautiful gradient background
- Client-specific logo in header
- Tabbed interface for login methods
- Modern form design with validation
- Glass-morphism effect on form container

### Home Screen
- Client logo in header with user information
- Account details with plan information
- Quick action buttons (Renew, Pay Bill, Support)
- Bill information with payment options
- Usage statistics with progress bar

### Ledger Screen
- **Transaction History**: View all invoices, receipts, and proforma invoices
- **PDF Download**: Download any document with one tap
- **Pull-to-Refresh**: Refresh data by pulling down
- **Account Summary**: Bottom section with balance details
- **Dynamic Tabs**: Shows only available data types

## 🔧 Setup Instructions

### Prerequisites
- Node.js (v16 or higher)
- React Native CLI
- Android Studio (for Android development)
- Xcode (for iOS development, macOS only)

### Installation

1. **Clone and navigate to the project:**
   ```bash
   cd ISPApp
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **For iOS (macOS only):**
   ```bash
   cd ios && pod install && cd ..
   ```

### Running the App

#### Build and Run for Specific Client
```bash
# Microscan
npm run dev:microscan

# DNA Infotel
npm run dev:dna-infotel

# Custom client
npm run dev:newclient
```

## 📋 Client Configuration Checklist

When adding a new client, ensure you've updated:

- [ ] Bundle ID in `android-build.gradle`
- [ ] App name in `android-strings.xml` and `ios-Info.plist`
- [ ] API endpoints in `api.ts`
- [ ] Company name in `strings.json`
- [ ] Logo dimensions in `logo-config.json`
- [ ] Logo files in `assets/{client}/`
- [ ] App icons in `assets/{client}/app-icons/`
- [ ] **Keystore file** in `config/{client}/`
- [ ] **Keystore configuration** in `keystore-config.gradle`
- [ ] Build script entry in `build-client.js`
- [ ] Package.json scripts

## 🎯 Benefits of Multi-Client Setup

- ✅ **Same codebase** for all clients
- ✅ **Different bundle IDs** (separate apps)
- ✅ **Different API endpoints** (client-specific backends)
- ✅ **Different branding** (logos, company names)
- ✅ **Different keystores** (separate app signing)
- ✅ **Easy to add new clients** (5 minutes setup)
- ✅ **No code duplication** (maintain once, use everywhere)

## Technologies Used

- React Native 0.80.1
- React Navigation 6
- React Native Safe Area Context
- React Native Gesture Handler
- React Native Reanimated
- React Native Linear Gradient
- React Native Fetch Blob
- TypeScript
- React Native Vector Icons
- React i18next

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.
