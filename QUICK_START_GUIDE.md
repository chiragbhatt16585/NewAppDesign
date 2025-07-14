# Quick Start Guide - ISP App

## 🚀 How to Run the App

### **1. Switch Between Clients**

```bash
# Switch to Microscan
node scripts/run-app.js switch microscan

# Switch to DNA Infotel  
node scripts/run-app.js switch dna-infotel
```

### **2. Run on Android**

```bash
# Build and install on Android
npx react-native run-android

# Or just install if already built
cd android && ./gradlew installDebug
```

### **3. Run on iOS**

```bash
# Build and run on iOS Simulator
npx react-native run-ios
```

### **4. Start Metro Bundler (if needed)**

```bash
# Start the development server
npx react-native start
```

## 🔧 Troubleshooting

### **Storage Issues on Android Emulator**
If you get `INSTALL_FAILED_INSUFFICIENT_STORAGE`:

```bash
# Clear app data
adb shell pm clear com.microscan.app
adb shell pm clear com.h8.dnasubscriber

# Then try installing again
cd android && ./gradlew installDebug
```

### **Wrong Logo/Assets**
If you see the wrong client's logo:

1. Switch to the correct client: `node scripts/run-app.js switch <client>`
2. Clean and rebuild: `cd android && ./gradlew clean && ./gradlew installDebug`

## 📱 Current Configuration

- **Package Name**: `com.microscan.app` (Microscan) or `com.h8.dnasubscriber` (DNA Infotel)
- **App Name**: "Microscan" or "DNA Infotel"
- **API Base URL**: Configured per client in `src/config/client-config.ts`

## 🎯 What I Fixed

1. **Fixed Debug Keystore**: Changed from microscan keystore to `debug.keystore` for debug builds
2. **Fixed Asset Copying**: Updated script to properly copy client-specific assets
3. **Fixed Storage Issues**: Cleared app data to resolve installation problems

Your app should now show the correct Microscan logo and branding! 🎉 