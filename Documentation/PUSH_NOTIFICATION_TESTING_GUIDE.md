# 🔔 Push Notification Testing Guide

## **Quick Start Testing**

### **Method 1: From HomeScreen (Easiest)**
1. **Open the app** and tap the profile button (top right)
2. **Tap "Test Notifications"** → Opens the full test screen
3. **Or tap individual test buttons** in the profile menu

### **Method 2: Using Test Screen**
1. **Navigate to NotificationTest screen** (via profile menu)
2. **Run different test suites**:
   - Unit Tests (automated)
   - Manual Tests (interactive)
   - Individual Tests (specific functions)

## **🧪 Testing Methods**

### **1. Local Notifications (Immediate)**
```typescript
// Test local notification display
showLocalNotification('Test Title', 'Test Message');
```
- **What it tests**: Basic notification display
- **Expected result**: Notification appears immediately
- **Platform**: Works on both iOS and Android

### **2. Permission Testing**
```typescript
// Test permission request
const result = await requestNotificationPermissions();
```
- **What it tests**: User permission handling
- **Expected result**: Shows permission dialog, returns true/false
- **Platform**: iOS shows dialog, Android 13+ shows dialog

### **3. Push Notification Initialization**
```typescript
// Test full initialization
await initializePushNotifications('test-realm');
```
- **What it tests**: FCM token generation, device registration
- **Expected result**: Token generated, device registered with backend
- **Platform**: Full functionality on real devices

### **4. Token Registration**
```typescript
// Test token registration with backend
const success = await registerPendingPushToken('test-realm');
```
- **What it tests**: Backend API integration
- **Expected result**: Token sent to your backend API
- **Platform**: Requires backend API to be running

## **📱 Platform-Specific Testing**

### **iOS Testing**

**Simulator:**
- ✅ Local notifications work
- ✅ Permission requests work
- ❌ FCM tokens not available (APNs limitation)
- ❌ Real push notifications won't work

**Real Device:**
- ✅ Full functionality
- ✅ FCM token generation
- ✅ Real push notifications
- ✅ Token refresh handling

**Test Commands:**
```bash
# iOS Simulator
npx react-native run-ios

# iOS Real Device
npx react-native run-ios --device "Your Device Name"
```

### **Android Testing**

**Emulator:**
- ✅ Local notifications work
- ✅ FCM tokens available
- ✅ Permission handling
- ✅ Notification channels

**Real Device:**
- ✅ Full functionality
- ✅ MAC address handling
- ✅ Real push notifications

**Test Commands:**
```bash
# Android Emulator
npx react-native run-android

# Android Real Device
npx react-native run-android --deviceId "your-device-id"
```

## **🔧 Backend Integration Testing**

### **API Endpoint Testing**
Your backend needs to handle the `addDeviceDetails` API call:

```typescript
// This is what gets sent to your backend
await apiService.addDeviceDetails(
  fcmToken,           // Firebase token
  macAddress,         // Device MAC (Android only)
  deviceName,         // Device name
  deviceInfo,         // Device details object
  realm              // Client realm
);
```

### **Test Your Backend**
1. **Check API endpoint** is working
2. **Verify device registration** in your database
3. **Test push notification sending** from your backend
4. **Check token storage** and management

## **🐛 Debugging Common Issues**

### **1. No FCM Token**
**Symptoms**: Token is null or empty
**Solutions**:
- Check Firebase configuration files
- Verify `google-services.json` (Android) and `GoogleService-Info.plist` (iOS)
- Ensure device is registered with APNs (iOS)
- Test on real device, not simulator

### **2. Permission Denied**
**Symptoms**: Permission request returns false
**Solutions**:
- Check device notification settings
- Test permission request flow
- Verify Android 13+ permission handling
- Check if user manually disabled notifications

### **3. API Registration Fails**
**Symptoms**: Backend registration fails
**Solutions**:
- Check backend API endpoint
- Verify authentication
- Check network connectivity
- Verify API request format

### **4. Notifications Not Received**
**Symptoms**: Backend sends but app doesn't receive
**Solutions**:
- Verify token registration
- Check notification channels (Android)
- Test with Firebase Console
- Check app state (foreground/background)

## **📊 Test Scenarios**

### **Basic Functionality**
1. **Permission Request** → Should show dialog
2. **Local Notification** → Should appear immediately
3. **Initialization** → Should generate FCM token
4. **Device Registration** → Should call backend API

### **Advanced Scenarios**
1. **Token Refresh** → Should handle token updates
2. **App State Changes** → Should work in background
3. **Network Issues** → Should handle failures gracefully
4. **Multiple Devices** → Should register each device separately

### **Error Handling**
1. **No Network** → Should retry when connected
2. **API Errors** → Should handle gracefully
3. **Invalid Tokens** → Should regenerate
4. **Permission Denied** → Should not crash

## **🚀 Production Testing**

### **Before Deploying**
1. **Test on Real Devices** (iOS and Android)
2. **Verify Backend Integration** (API endpoints working)
3. **Test Permission Flows** (first-time users)
4. **Check Firebase Configuration** (proper setup)

### **Post-Deployment**
1. **Monitor Token Registration** (backend logs)
2. **Test Push Notifications** (send from backend)
3. **Check Error Rates** (failed registrations)
4. **Verify User Experience** (permission flows)

## **🔍 Debug Information**

### **Console Logs to Watch For**
- `[Push]` - General push notification logs
- `[FCM]` - Firebase Cloud Messaging logs
- `[Test]` - Test execution logs

### **Debug Functions Available**
- `debugVersionCheck()` - Version comparison debugging
- `getNotificationDebugInfo()` - Device and token info
- `runNotificationTests()` - Automated test suite

## **📝 Test Checklist**

- [ ] Local notifications work
- [ ] Permission requests work
- [ ] FCM token generation works
- [ ] Device registration with backend works
- [ ] Token refresh handling works
- [ ] Error scenarios handled gracefully
- [ ] Works on both iOS and Android
- [ ] Works on real devices (not just simulators)
- [ ] Backend API integration complete
- [ ] Push notifications received from backend

## **🎯 Quick Test Commands**

```bash
# Run automated tests
node scripts/test-notifications.js

# Run Jest unit tests
npm test -- src/services/__tests__/notificationService.test.ts

# Check TypeScript
npx tsc --noEmit

# Run linting
npx eslint src/services/notificationService.ts
```

**Start with the easiest tests first, then move to more complex scenarios!**
