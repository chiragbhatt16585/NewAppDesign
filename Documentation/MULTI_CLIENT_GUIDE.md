# Multi-Client ISP App Guide

## Overview

This guide explains how to manage multiple clients (Microscan, DNA Infotel, etc.) in a single React Native project without duplicating code or manually editing files.

## 🎯 Benefits

- **Single Codebase**: One React Native project for all clients
- **Dynamic Configuration**: Client-specific settings loaded at runtime
- **Easy Maintenance**: Update once, applies to all clients
- **Automated Builds**: Build APKs for all clients with one command
- **No Manual File Editing**: Everything is automated

## 📁 Project Structure

```
ISPApp/
├── src/
│   ├── config/
│   │   ├── client-config.ts          # Centralized client configuration
│   │   └── client-strings.json       # Client-specific strings
│   ├── services/
│   │   └── api.ts                    # Dynamic API service
│   └── ...
├── config/
│   ├── microscan/                    # Microscan-specific files
│   │   ├── app.json
│   │   ├── api.ts
│   │   ├── assets/
│   │   ├── app-icons/
│   │   └── ...
│   └── dna-infotel/                  # DNA Infotel-specific files
│       ├── app.json
│       ├── api.ts
│       ├── assets/
│       ├── app-icons/
│       └── ...
├── scripts/
│   └── build-client-enhanced.js      # Enhanced build script
└── ...
```

## 🚀 Quick Start

### 1. Switch to a Client
```bash
# Switch to Microscan
node scripts/build-client-enhanced.js switch microscan

# Switch to DNA Infotel
node scripts/build-client-enhanced.js switch dna-infotel
```

### 2. Build APK for Specific Client
```bash
# Build Microscan APK
node scripts/build-client-enhanced.js build microscan

# Build DNA Infotel APK
node scripts/build-client-enhanced.js build dna-infotel
```

### 3. Build APKs for All Clients
```bash
# Build all APKs at once
node scripts/build-client-enhanced.js build-all
```

## 🔧 How It Works

### 1. Dynamic API Configuration

The API service automatically detects the current client and uses the appropriate configuration:

```typescript
// src/services/api.ts
import {getClientConfig} from '../config/client-config';

class ApiService {
  constructor() {
    this.config = getClientConfig(); // Gets current client config
  }

  async authUser(username: string, token: string) {
    const clientConfig = this.getClientConfig();
    return this.request('/auth/user', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-Client-ID': clientConfig.clientId, // Client-specific header
      },
      body: JSON.stringify({
        username,
        client: clientConfig.clientId,
      }),
    });
  }
}
```

### 2. Centralized Client Configuration

All client-specific settings are in one place:

```typescript
// src/config/client-config.ts
const clientConfigs = {
  microscan: {
    clientId: 'microscan',
    clientName: 'Microscan',
    api: {
      baseURL: 'https://api.microscan.com/v1',
      timeout: 30000,
    },
    branding: {
      logo: 'microscan_logo.png',
      primaryColor: '#2196F3',
      appName: 'Microscan App',
    },
    // ... more config
  },
  'dna-infotel': {
    clientId: 'dna-infotel',
    clientName: 'DNA Infotel',
    api: {
      baseURL: 'https://crm.dnainfotel.com/l2s/api',
      timeout: 30000,
    },
    branding: {
      logo: 'dna_logo.png',
      primaryColor: '#4CAF50',
      appName: 'DNA Infotel App',
    },
    // ... more config
  },
};
```

### 3. Automated Build Process

The enhanced build script:
1. Copies client-specific files (icons, strings, configs)
2. Updates Android build.gradle with correct package names
3. Updates iOS AppDelegate with correct module names
4. Builds APK using Gradle flavors
5. Copies APK to project root with client name

## 📋 Adding a New Client

### 1. Create Client Configuration

Add to `src/config/client-config.ts`:

```typescript
const clientConfigs = {
  // ... existing clients
  'new-client': {
    clientId: 'new-client',
    clientName: 'New Client',
    api: {
      baseURL: 'https://api.newclient.com/v1',
      timeout: 30000,
    },
    branding: {
      logo: 'new_client_logo.png',
      primaryColor: '#FF5722',
      appName: 'New Client App',
    },
    features: {
      biometricAuth: true,
      pushNotifications: true,
      fileUpload: true,
      multiLanguage: true,
    },
  },
};
```

### 2. Create Client Directory

```
config/new-client/
├── app.json
├── api.ts
├── assets/
├── app-icons/
│   ├── android/
│   └── ios/
├── android-strings.xml
├── ios-Info.plist
├── strings.json
├── keystore-config.gradle
├── logo-config.json
└── NewClientAppKey.jks
```

### 3. Add to Build Script

Add to `scripts/build-client-enhanced.js`:

```javascript
const CLIENTS = {
  // ... existing clients
  'new-client': {
    name: 'New Client',
    packageName: 'com.newclient.app',
    namespace: 'com.newclient.app',
    versionCode: 1,
    versionName: '1.0.0',
    keystore: 'NewClientAppKey.jks',
    configDir: 'config/new-client',
  },
};
```

## 🔄 Workflow

### Daily Development
1. **Switch to client**: `node scripts/build-client-enhanced.js switch microscan`
2. **Develop features**: All changes apply to current client
3. **Test**: Run on device/emulator
4. **Build**: `node scripts/build-client-enhanced.js build microscan`

### Adding Features
1. **Update common code**: Changes apply to all clients
2. **Update client config**: If needed for specific client
3. **Test all clients**: `node scripts/build-client-enhanced.js build-all`

### API Changes
1. **Update `src/services/api.ts`**: Changes apply to all clients
2. **Update client configs**: If different APIs per client
3. **Test**: Build and test all clients

## 🎨 Customization

### Client-Specific Features

```typescript
// In your components
import {getClientConfig} from '../config/client-config';

const MyComponent = () => {
  const clientConfig = getClientConfig();
  
  return (
    <View style={{backgroundColor: clientConfig.branding.primaryColor}}>
      <Text>{clientConfig.branding.appName}</Text>
      {clientConfig.features.biometricAuth && <BiometricButton />}
    </View>
  );
};
```

### Client-Specific Strings

```typescript
// src/config/client-strings.json
{
  "microscan": {
    "welcome": "Welcome to Microscan",
    "support": "Contact Microscan Support"
  },
  "dna-infotel": {
    "welcome": "Welcome to DNA Infotel",
    "support": "Contact DNA Infotel Support"
  }
}
```

## 🚨 Troubleshooting

### Build Errors
1. **Clean builds**: `cd android && ./gradlew clean`
2. **Check client config**: Ensure all required files exist
3. **Verify keystore**: Check keystore file exists and is valid

### Runtime Errors
1. **Check client detection**: Verify `getClientConfig()` returns correct config
2. **Check API endpoints**: Ensure API URLs are correct for each client
3. **Check assets**: Verify client-specific assets are copied correctly

### Common Issues
- **Wrong package name**: Check `build.gradle` after switching clients
- **Missing assets**: Ensure all client assets are in correct directories
- **API errors**: Verify API configuration for each client

## 📱 Testing

### Test All Clients
```bash
# Build all APKs
node scripts/build-client-enhanced.js build-all

# Install and test each APK
adb install microscan-app.apk
adb install dna-infotel-app.apk
```

### Verify Client-Specific Features
- Check app icons and branding
- Verify API endpoints work correctly
- Test client-specific features
- Confirm strings are client-specific

## 🔄 Migration from Old System

If you're migrating from the old system:

1. **Backup current configs**: Copy existing client configs
2. **Update build script**: Use new enhanced build script
3. **Test thoroughly**: Build and test all clients
4. **Update CI/CD**: Update build pipelines to use new script

## 📞 Support

For issues or questions:
1. Check this guide first
2. Review the build script logs
3. Verify client configurations
4. Test with a simple client first

---

**Happy Multi-Client Development! 🎉** 