# Notification Service Testing Guide

This guide provides comprehensive testing strategies for the notification service in the ISP App.

## 📁 Test Files Created

1. **`src/services/notificationTest.ts`** - Manual testing utilities and test suite
2. **`src/services/__tests__/notificationService.test.ts`** - Jest unit tests
3. **`src/screens/NotificationTestScreen.tsx`** - UI for manual testing
4. **`scripts/test-notifications.js`** - Command-line test runner

## 🧪 Testing Approaches

### 1. Unit Tests (Jest)

Run automated unit tests with mocked dependencies:

```bash
# Run all notification tests
npm test -- src/services/__tests__/notificationService.test.ts

# Run with coverage
npm test -- src/services/__tests__/notificationService.test.ts --coverage

# Run specific test
npm test -- src/services/__tests__/notificationService.test.ts --testNamePattern="Permission Request"
```

**What's Tested:**
- Permission requests (iOS/Android)
- Local notifications
- Push notification initialization
- Token registration
- Device registration
- Error handling
- Platform-specific behavior
- Token refresh handling

### 2. Manual Testing (Real Device)

Add the test screen to your navigation and test on real devices:

```typescript
// In your navigation stack
import NotificationTestScreen from '../screens/NotificationTestScreen';

// Add route
<Stack.Screen name="NotificationTest" component={NotificationTestScreen} />
```

**Manual Test Features:**
- Interactive permission testing
- Real notification display
- Device registration verification
- Debug information display
- Step-by-step testing process

### 3. Command Line Testing

Use the test runner script:

```bash
# Run all tests
node scripts/test-notifications.js

# Run only unit tests
node scripts/test-notifications.js --unit-only

# Run only linting
node scripts/test-notifications.js --lint-only

# Run only type checking
node scripts/test-notifications.js --type-only

# Show help
node scripts/test-notifications.js --help
```

## 🔧 Test Scenarios

### Basic Functionality Tests

1. **Permission Request**
   ```typescript
   const result = await requestNotificationPermissions();
   // Should return true/false based on user choice
   ```

2. **Local Notification**
   ```typescript
   showLocalNotification('Test', 'This is a test');
   // Should display notification immediately
   ```

3. **Initialization**
   ```typescript
   await initializePushNotifications('test-realm');
   // Should initialize without errors
   ```

### Advanced Tests

1. **Token Registration**
   ```typescript
   const success = await registerPendingPushToken('test-realm');
   // Should register with backend API
   ```

2. **Device Registration**
   ```typescript
   const success = await registerDeviceManually('test-realm');
   // Should register device details
   ```

3. **Error Handling**
   ```typescript
   // Test with invalid realm, network errors, etc.
   ```

## 📱 Platform-Specific Testing

### iOS Testing

**Simulator:**
- APNs tokens not available
- Permission requests work
- Local notifications work

**Real Device:**
- Full FCM token generation
- Real push notifications
- Token refresh handling

**Test Commands:**
```bash
# iOS Simulator
npx react-native run-ios

# iOS Real Device
npx react-native run-ios --device "Your Device Name"
```

### Android Testing

**Emulator:**
- FCM tokens available
- Permission handling
- Notification channels

**Real Device:**
- Full functionality
- MAC address handling
- Real push notifications

**Test Commands:**
```bash
# Android Emulator
npx react-native run-android

# Android Real Device
npx react-native run-android --deviceId "your-device-id"
```

## 🐛 Debugging

### Console Logs

Look for these log prefixes:
- `[Push]` - General push notification logs
- `[FCM]` - Firebase Cloud Messaging logs
- `[Test]` - Test execution logs

### Debug Information

Use the debug info function:
```typescript
import { getNotificationDebugInfo } from '../services/notificationTest';
await getNotificationDebugInfo();
```

**Shows:**
- Device information
- FCM token status
- Permission status
- Platform details
- App version info

### Common Issues

1. **No FCM Token**
   - Check Firebase configuration
   - Verify google-services.json/GoogleService-Info.plist
   - Ensure device is registered with APNs (iOS)

2. **Permission Denied**
   - Check device settings
   - Test permission request flow
   - Verify Android 13+ permission handling

3. **API Registration Fails**
   - Check backend API endpoint
   - Verify authentication
   - Check network connectivity

4. **Notifications Not Received**
   - Verify token registration
   - Check notification channels (Android)
   - Test with Firebase Console

## 🔍 Integration Testing

### Backend Integration

Test the complete flow:
1. App requests permissions
2. FCM token generated
3. Token sent to backend API
4. Backend stores device info
5. Push notifications sent from backend
6. App receives and displays notifications

### API Testing

Test the `addDeviceDetails` API call:
```typescript
const deviceInfo = {
  deviceId: 'test-id',
  brand: 'Test Brand',
  model: 'Test Model',
  // ... other device info
};

await apiService.addDeviceDetails(
  'fcm-token',
  'mac-address',
  'device-name',
  deviceInfo,
  'realm'
);
```

## 📊 Test Coverage

The test suite covers:

- ✅ Permission handling (iOS/Android)
- ✅ Local notifications
- ✅ Push notification initialization
- ✅ FCM token management
- ✅ Device registration
- ✅ Token refresh handling
- ✅ Error scenarios
- ✅ Platform-specific behavior
- ✅ API integration
- ✅ Mock and real device testing

## 🚀 Production Readiness

Before deploying:

1. **Run Full Test Suite**
   ```bash
   node scripts/test-notifications.js
   ```

2. **Test on Real Devices**
   - iOS device with notifications enabled
   - Android device with different API levels
   - Test permission flows

3. **Verify Backend Integration**
   - API endpoints working
   - Device registration successful
   - Push notifications delivered

4. **Check Firebase Configuration**
   - Proper project setup
   - Correct bundle IDs
   - Valid certificates

## 📝 Test Results

The test suite provides:
- Detailed console output
- Pass/fail status for each test
- Coverage reports
- Debug information
- Manual testing UI
- Command-line interface

Use these tools to ensure your notification service works reliably across all platforms and scenarios.
