# iOS Development Notes - Multi-Client Setup

## 🍎 **Running iOS App from Xcode**

### **Step 1: Build for Specific Client First**

Before opening Xcode, you need to build for the client you want to run:

```bash
# For Microscan
npm run build:microscan

# For DNA Infotel  
npm run build:dna-infotel
```

### **Step 2: Open Xcode Project**

```bash
# Navigate to iOS folder
cd ios

# Open the Xcode workspace
open ISPApp.xcworkspace
```

**⚠️ Important:** Use `.xcworkspace` NOT `.xcodeproj` because we have CocoaPods dependencies.

### **Step 3: Configure Xcode Settings**

In Xcode, you'll see the project is already configured for the client you built:

1. **Bundle Identifier** - Should match your client:
   - Microscan: `com.microscan.app`
   - DNA Infotel: `com.h8.dnasubscriber`

2. **Display Name** - Should show your client name:
   - Microscan: "Microscan ISP App"
   - DNA Infotel: "DNA Infotel App"

3. **App Icon** - Should show your client's icon

### **Step 4: Select Target Device**

1. **Simulator**: Choose iOS Simulator (iPhone 15, etc.)
2. **Real Device**: Connect your iPhone and select it

### **Step 5: Build and Run**

1. **Select Scheme**: Make sure "ISPApp" is selected
2. **Click Play Button** (▶️) or press `Cmd + R`
3. **Wait for build** - First build takes longer

## 🚨 **Common iOS Errors & Fixes**

### **"ISPApp has not registered" Error**

This error occurs when the iOS AppDelegate is looking for the wrong module name.

**Quick Fix:**
```bash
# Fix iOS module registration
npm run fix-ios

# Then rebuild for your client
npm run build:dna-infotel
```

**Manual Fix:**
1. Open `ios/ISPApp/AppDelegate.swift`
2. Find this line: `withModuleName: "ISPApp"`
3. Change it to match your client's app name:
   - For Microscan: `withModuleName: "Microscan ISP App"`
   - For DNA Infotel: `withModuleName: "DNAInfotelApp"`

### **"No such module" errors:**
```bash
cd ios
pod install
cd ..
```

### **"Bundle identifier already exists":**
- Delete app from simulator/device
- Clean build folder in Xcode

### **"Code signing issues":**
- Make sure you have valid Apple Developer account
- Check signing settings in Xcode project settings

### **"App icon not showing":**
```bash
# Clear derived data and rebuild
rm -rf ~/Library/Developer/Xcode/DerivedData
npm run build:dna-infotel
```

### **"Build failed with exit code 1":**
```bash
# Clean everything
cd ios
rm -rf build/
rm -rf Pods/
pod install
cd ..
npm run build:dna-infotel
```

### **"Metro bundler not starting":**
```bash
# Start Metro in separate terminal
npx react-native start

# Then run in Xcode
```

## 🔧 **Troubleshooting iOS Issues**

### **If Build Fails:**

```bash
# Clean and rebuild
cd ios
rm -rf build/
pod install
cd ..

# Rebuild for client
npm run build:dna-infotel
```

### **If Pods are Outdated:**

```bash
cd ios
pod deintegrate
pod install
cd ..
```

### **If Bundle ID Conflicts:**

1. **Delete app from simulator/device**
2. **Clean build folder** in Xcode: `Product → Clean Build Folder`
3. **Rebuild for client**: `npm run build:dna-infotel`

### **If App Icon Not Updating:**

```bash
# Clear derived data
rm -rf ~/Library/Developer/Xcode/DerivedData

# Rebuild for client
npm run build:dna-infotel
```

## 📱 **Switching Between Clients**

To switch to a different client:

```bash
# Stop current build
# In Xcode: Product → Stop (or Cmd + .)

# Build for different client
npm run build:microscan  # or npm run build:dna-infotel

# Fix iOS issues
npm run fix-ios

# Clean Xcode build
# In Xcode: Product → Clean Build Folder

# Run again
# In Xcode: Product → Run (or Cmd + R)
```

## 🎯 **Quick Commands**

```bash
# Build and open Xcode for Microscan
npm run build:microscan && npm run fix-ios && cd ios && open ISPApp.xcworkspace

# Build and open Xcode for DNA Infotel  
npm run build:dna-infotel && npm run fix-ios && cd ios && open ISPApp.xcworkspace
```

## ✅ **What Gets Updated Per Client**

When you run `npm run build:dna-infotel`, these iOS files get updated:

- **Bundle ID**: `com.h8.dnasubscriber`
- **App Name**: "DNA Infotel App"
- **App Icon**: DNA Infotel branded icons
- **Info.plist**: Client-specific settings
- **Assets**: Client logos and images
- **AppDelegate.swift**: Module name registration

## 📋 **iOS Development Checklist**

- [ ] **Build for correct client**: `npm run build:dna-infotel`
- [ ] **Fix iOS issues**: `npm run fix-ios`
- [ ] **Open workspace**: `open ios/ISPApp.xcworkspace`
- [ ] **Select simulator/device**
- [ ] **Clean build folder** if switching clients
- [ ] **Run app**: `Cmd + R`

## 🔄 **Workflow for Different Clients**

### **For Microscan Development:**
```bash
npm run build:microscan
npm run fix-ios
cd ios && open ISPApp.xcworkspace
# In Xcode: Cmd + R
```

### **For DNA Infotel Development:**
```bash
npm run build:dna-infotel
npm run fix-ios
cd ios && open ISPApp.xcworkspace
# In Xcode: Cmd + R
```

### **For New Client Development:**
```bash
# Create new client first
npm run create-client

# Then build and run
npm run build:newclient
npm run fix-ios
cd ios && open ISPApp.xcworkspace
# In Xcode: Cmd + R
```

## 🛠️ **Xcode Shortcuts**

- **Build**: `Cmd + B`
- **Run**: `Cmd + R`
- **Stop**: `Cmd + .`
- **Clean Build Folder**: `Shift + Cmd + K`
- **Show Navigator**: `Cmd + 1`
- **Show Inspector**: `Cmd + Option + 4`

## 📱 **Device Testing**

### **For Simulator:**
- Choose any iOS Simulator
- No code signing required
- Faster development

### **For Real Device:**
- Connect iPhone via USB
- Trust developer certificate on device
- May need Apple Developer account for some features

## 🔍 **Debugging Tips**

### **Console Logs:**
- View in Xcode console
- Use `console.log()` in React Native code
- Check Metro bundler output

### **Network Issues:**
- Check if Metro bundler is running
- Verify API endpoints in client config
- Check network permissions in Info.plist

### **Performance Issues:**
- Enable "Debug → Slow Animations" in simulator
- Use Xcode Instruments for profiling
- Check memory usage in Debug Navigator

## 📝 **Notes**

- **Always build for client before opening Xcode**
- **Use .xcworkspace, not .xcodeproj**
- **Run fix-ios after building for new client**
- **Clean build folder when switching clients**
- **Keep Metro bundler running for live reload**
- **Check bundle ID matches client configuration**

## 🎯 **Quick Reference**

| Client | Build Command | Bundle ID | App Name |
|--------|---------------|-----------|----------|
| **Microscan** | `npm run build:microscan` | `com.microscan.app` | "Microscan ISP App" |
| **DNA Infotel** | `npm run build:dna-infotel` | `com.h8.dnasubscriber` | "DNA Infotel App" |

This setup ensures that when you open Xcode, you're working with the correct client configuration, app name, bundle ID, and branding! 🎉 