# 🔔 Push Notifications Setup Guide

This guide explains how to set up and use push notifications in your ISP App using Firebase Cloud Messaging (FCM).

## 📋 Prerequisites

- Firebase project with Cloud Messaging enabled
- `google-services.json` file for Android
- `GoogleService-Info.plist` file for iOS
- React Native project with the required dependencies

## 🚀 Installation

### 1. Install Required Packages

```bash
npm install @react-native-firebase/app @react-native-firebase/messaging react-native-push-notification @react-native-community/push-notification-ios
```

### 2. Android Configuration

#### Update `android/build.gradle`
```gradle
buildscript {
    dependencies {
        classpath("com.google.gms:google-services:4.4.0")
    }
}
```

#### Update `android/app/build.gradle`
```gradle
apply plugin: "com.google.gms.google-services"

dependencies {
    implementation platform('com.google.firebase:firebase-bom:32.7.0')
    implementation 'com.google.firebase:firebase-messaging'
}
```

#### Place `google-services.json`
- Copy your `google-services.json` file to `android/app/`
- Replace the template values with your actual Firebase configuration

#### Update `AndroidManifest.xml`
```xml
<!-- Add permissions -->
<uses-permission android:name="android.permission.WAKE_LOCK" />
<uses-permission android:name="android.permission.VIBRATE" />
<uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />
<uses-permission android:name="com.google.android.c2dm.permission.RECEIVE" />

<!-- Add services inside application tag -->
<service
  android:name="io.invertase.firebase.messaging.ReactNativeFirebaseMessagingService"
  android:exported="false">
  <intent-filter>
    <action android:name="com.google.firebase.MESSAGING_EVENT" />
  </intent-filter>
</service>

<receiver
  android:name="io.invertase.firebase.messaging.ReactNativeFirebaseMessagingReceiver"
  android:exported="true">
  <intent-filter>
    <action android:name="android.intent.action.BOOT_COMPLETED" />
    <action android:name="android.intent.action.MY_PACKAGE_REPLACED" />
  </intent-filter>
</receiver>
```

### 3. iOS Configuration

#### Update `ios/Podfile`
```ruby
use_modular_headers!

target 'ISPApp' do
  # Firebase pods
  pod 'Firebase/Core'
  pod 'Firebase/Messaging'
end
```

#### Place `GoogleService-Info.plist`
- Copy your `GoogleService-Info.plist` file to `ios/`
- Replace the template values with your actual Firebase configuration

#### Install Pods
```bash
cd ios && pod install
```

## 🔧 Usage

### 1. Initialize Push Notifications

The push notification service is automatically initialized in your `App.tsx`:

```typescript
import PushNotificationService from './src/services/pushNotificationService';

// In your app initialization
const pushService = PushNotificationService.getInstance();
await pushService.requestUserPermission();
const fcmToken = await pushService.getFcmToken();
```

### 2. Request Permissions

```typescript
const pushService = PushNotificationService.getInstance();
const hasPermission = await pushService.requestUserPermission();
```

### 3. Get FCM Token

```typescript
const fcmToken = await pushService.getFCMToken();
if (fcmToken) {
  // Send this token to your backend
  await pushService.sendTokenToBackend(fcmToken, userId);
}
```

### 4. Subscribe to Topics

```typescript
// Subscribe to a specific topic
await pushService.subscribeToTopic('news');

// Unsubscribe from a topic
await pushService.unsubscribeFromTopic('news');
```

### 5. Handle Notifications

The service automatically handles:
- Foreground messages (shows local notification)
- Background messages
- App launch from notification
- Notification taps

## 🧪 Testing

### Test Component

Use the included `PushNotificationTest` component to test functionality:

```typescript
import PushNotificationTest from './src/components/PushNotificationTest';

// Add to your screen
<PushNotificationTest />
```

### Test Features
- ✅ Test local notifications
- ✅ Get FCM token
- ✅ Subscribe/unsubscribe to topics
- ✅ Verify console logs

## 📱 Firebase Console Setup

### 1. Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select existing
3. Enable Cloud Messaging

### 2. Add Android App
1. Click "Add app" → Android
2. Enter package name: `com.dnainfotel.ispapp`
3. Download `google-services.json`
4. Place in `android/app/`

### 3. Add iOS App
1. Click "Add app" → iOS
2. Enter bundle ID: `com.dnainfotel.ISPApp`
3. Download `GoogleService-Info.plist`
4. Place in `ios/`

### 4. Send Test Message
1. Go to Cloud Messaging
2. Click "Send your first message"
3. Enter notification title and body
4. Select your app
5. Send test message

## 🔒 Security Considerations

### 1. API Key Protection
- Never commit real Firebase config files to version control
- Use environment variables for sensitive data
- Consider using Firebase App Check

### 2. Token Management
- Store FCM tokens securely
- Implement token refresh logic
- Validate tokens on your backend

### 3. Topic Subscriptions
- Limit topic subscriptions to authorized users
- Implement proper access control
- Monitor subscription patterns

## 🐛 Troubleshooting

### Common Issues

#### Android
- **Build errors**: Ensure `google-services.json` is in correct location
- **Permission denied**: Check manifest permissions
- **Service not found**: Verify service declarations in manifest

#### iOS
- **Pod install fails**: Use `use_modular_headers!` in Podfile
- **Build errors**: Clean build folder and reinstall pods
- **Permissions**: Ensure notification permissions are requested

#### General
- **Token not received**: Check Firebase console configuration
- **Notifications not showing**: Verify notification channel setup (Android)
- **Background messages**: Check app state handling

### Debug Steps
1. Check console logs for error messages
2. Verify Firebase configuration files
3. Test with Firebase console test messages
4. Check device notification settings
5. Verify app permissions

## 📚 Additional Resources

- [Firebase Cloud Messaging Documentation](https://firebase.google.com/docs/cloud-messaging)
- [React Native Firebase Documentation](https://rnfirebase.io/messaging/usage)
- [React Native Push Notification](https://github.com/zo0r/react-native-push-notification)

## 🎯 Next Steps

1. Replace template Firebase config files with real ones
2. Test push notifications on both platforms
3. Implement backend integration for sending notifications
4. Add notification handling for specific app actions
5. Implement notification preferences and settings

---

**Note**: This implementation follows React Native best practices and provides a solid foundation for push notifications. Customize the notification handling logic according to your app's specific requirements.
