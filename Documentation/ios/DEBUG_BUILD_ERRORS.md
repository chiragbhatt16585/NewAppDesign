# Debugging "Command PhaseScriptExecution failed" Error

## Quick Fix

Run this script first:
```bash
cd ios
./fix-build-script-error.sh
```

## Identify Which Script Failed

The error message is generic. To find which script failed:

1. **In Xcode, open the build log:**
   - Go to `View > Navigators > Show Report Navigator` (or press `Cmd+9`)
   - Click on the failed build
   - Expand the error section
   - Look for the script name in the error message

2. **Common failing scripts and fixes:**

### 1. "Bundle React Native code and images"
**Error:** Usually related to Node.js not found

**Fix:**
```bash
cd ios
# Ensure .xcode.env exists
echo 'export NODE_BINARY=$(command -v node)' > .xcode.env
echo 'export NODE_BINARY=$(command -v node)' > .xcode.env.local

# Verify Node.js
which node
node --version
```

### 2. "[CP-User] [RNFB] Core Configuration"
**Error:** Firebase configuration script failing

**Fix:**
- Check if `firebase.json` exists in project root
- Validate JSON syntax: `python3 -m json.tool firebase.json`
- Ensure Python3 is installed: `python3 --version`
- Ensure Ruby is installed: `ruby --version`

### 3. "[CP] Embed Pods Frameworks"
**Error:** CocoaPods framework embedding failing

**Fix:**
```bash
cd ios
pod deintegrate
pod install
```

### 4. "[CP] Check Pods Manifest.lock"
**Error:** Podfile.lock out of sync

**Fix:**
```bash
cd ios
pod install
```

### 5. "Copy Razorpay dSYMs"
**Error:** Razorpay dSYM script failing

**Fix:**
```bash
cd ios
chmod +x scripts/copy-razorpay-dsyms.sh
# The script should handle missing files gracefully now
```

## General Troubleshooting Steps

1. **Clean everything:**
   ```bash
   cd ios
   rm -rf ~/Library/Developer/Xcode/DerivedData/*
   rm -rf build
   pod deintegrate
   pod install
   ```

2. **Check script permissions:**
   ```bash
   cd ios
   chmod +x scripts/*.sh
   ```

3. **Verify environment:**
   ```bash
   # Check Node.js
   which node
   node --version
   
   # Check Python3
   which python3
   python3 --version
   
   # Check Ruby
   which ruby
   ruby --version
   ```

4. **In Xcode:**
   - Clean Build Folder: `Product > Clean Build Folder` (Cmd+Shift+K)
   - Close and reopen Xcode
   - Open `ISPApp.xcworkspace` (NOT `.xcodeproj`)

## Enable Verbose Logging

To see more details about script failures:

1. In Xcode, go to your target's **Build Phases**
2. Find the failing script phase
3. Expand it and check **"Show environment variables in build log"**
4. Rebuild and check the detailed output

## Common Issues

### Node.js Path Issues
If Node.js is installed via nvm, update `.xcode.env.local`:
```bash
echo '. "$(brew --prefix nvm)/nvm.sh" --no-use' > ios/.xcode.env.local
echo 'export NODE_BINARY=$(command -v node)' >> ios/.xcode.env.local
```

### Python3 Missing
Install Python3:
```bash
brew install python3
```

### Ruby Missing
macOS usually has Ruby, but if missing:
```bash
brew install ruby
```

### Script Execution Permissions
```bash
cd ios
find scripts -name "*.sh" -exec chmod +x {} \;
```

