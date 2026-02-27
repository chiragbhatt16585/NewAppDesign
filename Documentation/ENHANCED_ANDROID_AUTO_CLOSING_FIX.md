# Enhanced Android App Auto-Closing Fix

## Problem Analysis
The error `Connection closed to device='sdk_gphone64_arm64 - 15 - API 35' for app='com.h8.dnasubscriber' with code='1006'` indicates that Android is still aggressively killing the app despite previous fixes.

## Root Causes
1. **Android 15 (API 35) Aggressive Memory Management**: Newer Android versions are more aggressive about killing background apps
2. **Emulator Environment**: Android emulators often have stricter memory limits
3. **Missing Foreground Service**: No persistent service to keep the app alive
4. **Insufficient Keep-Alive Mechanisms**: Previous solutions weren't aggressive enough

## Enhanced Solutions Implemented

### 1. **Android Manifest Enhancements**
**File:** `android/app/src/main/AndroidManifest.xml`

#### Added Permissions:
```xml
<!-- Additional permissions to prevent app killing -->
<uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE_DATA_SYNC" />
<uses-permission android:name="android.permission.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS" />
<uses-permission android:name="android.permission.SYSTEM_ALERT_WINDOW" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
<uses-permission android:name="android.permission.ACCESS_WIFI_STATE" />
```

#### Application Optimizations:
```xml
<application
  android:hardwareAccelerated="true"
  android:largeHeap="true"
  android:requestLegacyExternalStorage="true"
  android:extractNativeLibs="false"
  android:usesCleartextTraffic="true">
```

#### Foreground Service:
```xml
<service
  android:name="com.h8.dnasubscriber.KeepAliveService"
  android:enabled="true"
  android:exported="false"
  android:foregroundServiceType="dataSync" />
```

### 2. **KeepAliveService (Java)**
**File:** `android/app/src/main/java/com/h8/dnasubscriber/KeepAliveService.java`

- **Foreground Service**: Runs as a persistent foreground service with notification
- **START_STICKY**: Automatically restarts if killed by system
- **Task Removal Handling**: Restarts service when app task is removed
- **Low Priority Notification**: Minimal notification to avoid user annoyance

### 3. **KeepAliveModule (React Native Bridge)**
**File:** `android/app/src/main/java/com/h8/dnasubscriber/KeepAliveModule.java`

- **Native Bridge**: Allows React Native to control the service
- **Service Control**: Start/stop service from JavaScript
- **Error Handling**: Proper error handling and logging

### 4. **Enhanced AppLifecycleManager**
**File:** `src/services/appLifecycleManager.ts`

#### Improvements:
- **More Frequent Heartbeat**: Reduced from 30s to 15s intervals
- **Background Tasks**: Additional background task runner
- **Service Integration**: Attempts to start foreground service
- **Better Cleanup**: Proper cleanup of all intervals

#### Key Features:
```typescript
private readonly BACKGROUND_THRESHOLD = 2 * 60 * 1000; // 2 minutes (reduced)
private readonly KEEP_ALIVE_INTERVAL = 15 * 1000; // 15 seconds (more frequent)
private readonly BACKGROUND_TASK_INTERVAL = 30 * 1000; // 30 seconds
```

### 5. **Package Registration**
**File:** `android/app/src/main/java/com/h8/dnasubscriber/MainApplication.kt`

- **Package Registration**: Added KeepAlivePackage to React Native packages
- **Module Availability**: Makes KeepAliveModule available to JavaScript

## Testing Instructions

### 1. **Build and Test**
```bash
# Clean and rebuild
cd android
./gradlew clean
cd ..
npx react-native run-android
```

### 2. **Test Scenarios**
1. **Background Survival**: Put app in background for 10+ minutes
2. **Task Switching**: Switch between multiple apps
3. **Memory Pressure**: Open memory-intensive apps
4. **Emulator Restart**: Restart emulator and check app state

### 3. **Monitor Logs**
```bash
# Watch logs for keep-alive messages
npx react-native log-android | grep -E "(KeepAlive|Lifecycle|heartbeat)"
```

### 4. **Check Service Status**
- Look for "ISP App Running" notification
- Check if service restarts automatically
- Monitor memory usage in Android Studio

## Expected Results

### ✅ **Immediate Improvements**
- App stays alive longer in background
- Foreground service prevents system killing
- Automatic service restart if killed
- More frequent keep-alive operations

### ✅ **Long-term Benefits**
- Better user experience
- Reduced app crashes
- Improved session persistence
- Enhanced background functionality

## Troubleshooting

### **If App Still Closes:**

1. **Check Battery Optimization**
   ```bash
   # Guide user to disable battery optimization
   Settings > Apps > ISP App > Battery > Battery Optimization > Don't optimize
   ```

2. **Check Background App Refresh**
   ```bash
   # Ensure background app refresh is enabled
   Settings > Apps > ISP App > Background App Refresh > Enable
   ```

3. **Check Memory Usage**
   ```bash
   # Monitor memory usage
   adb shell dumpsys meminfo com.h8.dnasubscriber
   ```

4. **Check Service Status**
   ```bash
   # Check if service is running
   adb shell dumpsys activity services | grep KeepAlive
   ```

### **Common Issues:**

1. **Service Not Starting**: Check MainApplication.kt registration
2. **Permission Denied**: Verify AndroidManifest.xml permissions
3. **Module Not Found**: Check KeepAlivePackage registration
4. **Memory Leaks**: Monitor memory usage patterns

## Additional Recommendations

### 1. **User Education**
- Add in-app instructions about Android settings
- Guide users to disable battery optimization
- Explain background behavior

### 2. **Monitoring**
- Implement crash reporting
- Monitor service uptime
- Track background survival rates

### 3. **Future Enhancements**
- Implement adaptive intervals based on device capabilities
- Add user-configurable keep-alive settings
- Implement smart background sync

## Files Modified

1. `android/app/src/main/AndroidManifest.xml` - Permissions and service
2. `android/app/src/main/java/com/h8/dnasubscriber/KeepAliveService.java` - Foreground service
3. `android/app/src/main/java/com/h8/dnasubscriber/KeepAliveModule.java` - React Native bridge
4. `android/app/src/main/java/com/h8/dnasubscriber/KeepAlivePackage.java` - Package registration
5. `android/app/src/main/java/com/h8/dnasubscriber/MainApplication.kt` - Package registration
6. `src/services/appLifecycleManager.ts` - Enhanced lifecycle management

This comprehensive solution should significantly improve app survival rates on Android devices, especially newer versions with aggressive memory management.

