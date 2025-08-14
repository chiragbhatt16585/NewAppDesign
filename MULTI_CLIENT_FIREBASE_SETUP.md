# 🔥 Multi-Client Firebase Setup Guide

This guide explains how to set up Firebase Cloud Messaging for multiple clients in your ISP App.

## 📁 File Structure

```
ISPApp/
├── config/
│   ├── dna-infotel/
│   │   ├── google-services.json      ← DNA Infotel Android config
│   │   └── GoogleService-Info.plist  ← DNA Infotel iOS config
│   ├── microscan/
│   │   ├── google-services.json      ← Microscan Android config
│   │   └── GoogleService-Info.plist  ← Microscan iOS config
│   └── one-sevenstar/
│       ├── google-services.json      ← One Sevenstar Android config
│       └── GoogleService-Info.plist  ← One Sevenstar iOS config
├── android/
│   └── app/
│       └── google-services.json      ← Will be copied from client config
└── ios/
    └── GoogleService-Info.plist      ← Will be copied from client config
```

## 🚀 Setup Process

### 1. Firebase Console Setup

#### Option A: Single Project, Multiple Apps (Recommended)
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create one project (e.g., "ISP-Multi-Client")
3. Add multiple apps for each client:
   - **DNA Infotel**: `com.h8.dnasubscriber` (Android) + `com.h8.ISPApp` (iOS)
   - **Microscan**: `com.microscan.app` (Android) + `com.microscan.ISPApp` (iOS)
   - **One Sevenstar**: `com.h8.dnasubscriber` (Android) + `com.h8.ISPApp` (iOS)

#### Option B: Multiple Projects
1. Create separate Firebase projects for each client
2. Each project has one Android app and one iOS app

### 2. Download Configuration Files

For each client, download the Firebase config files:

#### DNA Infotel
- **Android**: Download `google-services.json` → Place in `config/dna-infotel/`
- **iOS**: Download `GoogleService-Info.plist` → Place in `config/dna-infotel/`

#### Microscan
- **Android**: Download `google-services.json` → Place in `config/microscan/`
- **iOS**: Download `GoogleService-Info.plist` → Place in `config/microscan/`

#### One Sevenstar
- **Android**: Download `google-services.json` → Place in `config/one-sevenstar/`
- **iOS**: Download `GoogleService-Info.plist` → Place in `config/one-sevenstar/`

### 3. Package Names & Bundle IDs

| Client | Android Package | iOS Bundle ID |
|--------|----------------|---------------|
| DNA Infotel | `com.h8.dnasubscriber` | `com.h8.ISPApp` |
| Microscan | `com.microscan.app` | `com.microscan.ISPApp` |
| One Sevenstar | `com.h8.dnasubscriber` | `com.h8.ISPApp` |

## 🔧 Build Process

### 1. Build for Specific Client

```bash
# Build for DNA Infotel
npm run build:dna-infotel

# Build for Microscan
npm run build:microscan

# Build for One Sevenstar
npm run build:one-sevenstar
```

### 2. What Happens During Build

The build script automatically:
1. ✅ Copies client-specific Firebase config files
2. ✅ Updates package names and bundle IDs
3. ✅ Copies app icons and branding
4. ✅ Updates app names and strings
5. ✅ Copies keystore files

### 3. Firebase Config Copying

```javascript
// From build-client.js
if (fs.existsSync(`${sourcePath}/google-services.json`)) {
  fs.copyFileSync(`${sourcePath}/google-services.json`, './android/app/google-services.json');
  console.log(`✅ Copied Firebase Android config for ${clientName}`);
}

if (fs.existsSync(`${sourcePath}/GoogleService-Info.plist`)) {
  fs.copyFileSync(`${sourcePath}/GoogleService-Info.plist`, './ios/GoogleService-Info.plist');
  console.log(`✅ Copied Firebase iOS config for ${clientName}`);
}
```

## 📱 Testing Each Client

### 1. Build and Test

```bash
# Test DNA Infotel
npm run build:dna-infotel
npx react-native run-android
# or
npx react-native run-ios

# Test Microscan
npm run build:microscan
npx react-native run-android
# or
npx react-native run-ios

# Test One Sevenstar
npm run build:one-sevenstar
npx react-native run-android
# or
npx react-native run-ios
```

### 2. Verify Firebase Integration

1. **Check Console Logs**: Look for Firebase initialization messages
2. **Test Push Notifications**: Use the test component
3. **Verify FCM Token**: Each client should get a unique token
4. **Test from Firebase Console**: Send test messages to each client

## 🔒 Security Best Practices

### 1. Configuration Files
- ✅ Store real config files in `config/[client-name]/`
- ❌ Never commit real config files to version control
- ✅ Add `config/*/google-services.json` and `config/*/GoogleService-Info.plist` to `.gitignore`

### 2. Package Names
- ✅ Use unique package names for each client
- ✅ Ensure Firebase console apps match your package names
- ✅ Verify bundle IDs match iOS app configuration

### 3. API Keys
- ✅ Each client gets unique Firebase API keys
- ✅ Monitor API usage in Firebase console
- ✅ Implement proper access control

## 🐛 Troubleshooting

### Common Issues

#### Build Errors
```bash
# Clean and rebuild
cd android && ./gradlew clean && cd ..
cd ios && pod install && cd ..
npm run build:[client-name]
```

#### Firebase Not Working
1. ✅ Verify config files are copied correctly
2. ✅ Check package names match Firebase console
3. ✅ Ensure Firebase project has Cloud Messaging enabled
4. ✅ Verify API keys are correct

#### Multiple Client Conflicts
1. ✅ Each client should have unique Firebase apps
2. ✅ Package names must be different
3. ✅ Bundle IDs must be different
4. ✅ Clean build between client switches

### Debug Steps

1. **Check File Locations**:
   ```bash
   ls -la config/dna-infotel/
   ls -la config/microscan/
   ls -la config/one-sevenstar/
   ```

2. **Verify Build Output**:
   ```bash
   npm run build:dna-infotel
   # Look for "✅ Copied Firebase Android config for dna-infotel"
   # Look for "✅ Copied Firebase iOS config for dna-infotel"
   ```

3. **Check Console Logs**:
   - Look for Firebase initialization messages
   - Check for FCM token generation
   - Verify no duplicate package errors

## 📋 Checklist

### Before Building Each Client
- [ ] Firebase project created with Cloud Messaging enabled
- [ ] Android app added with correct package name
- [ ] iOS app added with correct bundle ID
- [ ] `google-services.json` downloaded and placed in `config/[client]/`
- [ ] `GoogleService-Info.plist` downloaded and placed in `config/[client]/`
- [ ] Package names match between Firebase and your app
- [ ] Bundle IDs match between Firebase and your app

### After Building Each Client
- [ ] App builds successfully
- [ ] Firebase initializes without errors
- [ ] FCM token is generated
- [ ] Push notifications work
- [ ] Test messages received from Firebase console

## 🎯 Next Steps

1. **Set up Firebase projects** for each client
2. **Download configuration files** and place in correct directories
3. **Test builds** for each client
4. **Verify push notifications** work for each client
5. **Implement backend integration** for sending notifications
6. **Add client-specific notification handling**

---

**Note**: This multi-client setup ensures each client has their own Firebase configuration while maintaining a single codebase. The build process automatically handles the configuration switching.
