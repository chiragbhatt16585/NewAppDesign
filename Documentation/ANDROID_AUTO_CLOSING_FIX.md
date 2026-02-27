# Android App Auto-Closing Fix

## Problem
The Android app automatically closes after some time of inactivity, which is caused by Android's aggressive memory management and lack of proper background handling.

## Root Causes Identified

### 1. **Android System Memory Management**
- Android kills apps in background to free up RAM
- `launchMode="singleTask"` was causing memory management issues
- No explicit background service configuration

### 2. **Multiple App State Listeners**
- Multiple `AppState.addEventListener` calls without proper cleanup
- AutoDataReloader, App.tsx, and useAutoDataReload all listening to app state changes
- Potential memory leaks from unremoved listeners

### 3. **Resource-Intensive Services**
- SessionMonitor running every 30 minutes with `setInterval`
- AutoDataReloader maintaining background state tracking
- Multiple singleton services persisting in memory

## Solutions Implemented

### 1. **Android Manifest Optimizations**
```xml
<!-- Changed launch mode from singleTask to singleTop -->
android:launchMode="singleTop"

<!-- Added memory optimization flags -->
android:hardwareAccelerated="true"
android:largeHeap="true"
android:excludeFromRecents="false"
android:taskAffinity=""
android:clearTaskOnLaunch="false"
```

### 2. **App Lifecycle Manager**
Created `src/services/appLifecycleManager.ts` with:
- Centralized app state management
- Background/foreground detection
- Keep-alive mechanism for Android
- Memory optimization on background
- Proper cleanup on app destroy

### 3. **Session Monitor Optimization**
- Reduced check interval from 30 minutes to 60 minutes
- Added monitoring state tracking
- Improved cleanup and resource management

### 4. **App.tsx Improvements**
- Integrated AppLifecycleManager
- Added proper cleanup in useEffect
- Reduced memory footprint

## Additional Recommendations

### 1. **User Settings**
Add option for users to:
- Disable background monitoring
- Choose notification frequency
- Set app priority in Android settings

### 2. **Battery Optimization**
- Request user to disable battery optimization for the app
- Add instructions in app settings

### 3. **Memory Monitoring**
- Implement memory usage tracking
- Alert users when memory usage is high
- Automatically clean up resources when needed

## Testing Instructions

### 1. **Test Background Behavior**
1. Open the app
2. Put it in background for 10+ minutes
3. Check if app stays alive
4. Return to app and verify it's still responsive

### 2. **Test Memory Usage**
1. Use Android Studio Profiler
2. Monitor memory usage over time
3. Check for memory leaks
4. Verify cleanup is working

### 3. **Test Different Scenarios**
1. App in background for 1 hour
2. App in background for 4+ hours
3. Multiple app switches
4. Device restart and app launch

## Expected Results

After implementing these fixes:
- App should stay alive longer in background
- Reduced memory usage
- Better user experience
- Proper cleanup preventing memory leaks
- More stable app performance

## Monitoring

Monitor these metrics:
- App background survival rate
- Memory usage patterns
- User complaints about app closing
- Battery usage impact
- Performance metrics

## Future Improvements

1. **Background Sync Service**
   - Implement proper Android background service
   - Sync data when app is in background
   - Handle push notifications properly

2. **Smart Resource Management**
   - Dynamic resource allocation based on device capabilities
   - Adaptive monitoring intervals
   - Intelligent cleanup strategies

3. **User Education**
   - Add in-app tips about Android settings
   - Guide users to optimize app performance
   - Explain background behavior
