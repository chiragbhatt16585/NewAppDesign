import { Platform, PermissionsAndroid } from 'react-native'
import PushNotification from 'react-native-push-notification'
import PushNotificationIOS from '@react-native-community/push-notification-ios'
import DeviceInfo from 'react-native-device-info'
import { apiService } from './api'
import messaging from '@react-native-firebase/messaging'

let isInitialized = false
let lastRegisteredToken: string | null = null
let pendingToken: string | null = null

export async function initializePushNotifications(realm?: string): Promise<void> {
  if (isInitialized) return
  isInitialized = true
  // eslint-disable-next-line no-console
  console.log('[Push] initializePushNotifications start', { realm })
  try { /* require('react-native').Alert.alert('PushDebug', `Init start realm: ${realm || 'default'}`) */ } catch {}
  try {
    if (Platform.OS === 'ios') {
      const isEmu = await DeviceInfo.isEmulator()
      if (isEmu) {
        // eslint-disable-next-line no-console
        console.warn('[Push] iOS Simulator detected: APNs tokens are not available')
        try { /* require('react-native').Alert.alert('PushDebug', 'iOS Simulator: APNs token not available') */ } catch {}
      }
      // Ensure device is registered with APNs so FCM can provide a token
      try {
        await messaging().registerDeviceForRemoteMessages()
      } catch {}
    }
  } catch {}
  const hasPerm = await requestNotificationPermissions()
  // eslint-disable-next-line no-console
  console.log('[Push] notification permission result', { granted: hasPerm })
  try { /* require('react-native').Alert.alert('PushDebug', `Permission: ${hasPerm}`) */ } catch {}

  // Firebase Messaging: request permission (iOS), get FCM token, and register
  try {
    const authStatus = await messaging().requestPermission()
    // eslint-disable-next-line no-console
    console.log('[Push][FCM] permission status', authStatus)
    const fcmToken = await messaging().getToken()
    // eslint-disable-next-line no-console
    console.log('[Push][FCM] getToken', fcmToken ? fcmToken.substring(0, 12) + '...' : 'none')
    try { /* require('react-native').Alert.alert('PushDebug', `FCM token: ${fcmToken ? fcmToken.substring(0,10)+'...' : 'none'}`) */ } catch {}
    if (fcmToken) {
      pendingToken = fcmToken
      const device_info = {
        deviceId: DeviceInfo.getDeviceId(),
        brand: DeviceInfo.getBrand(),
        model: DeviceInfo.getModel(),
        systemName: DeviceInfo.getSystemName(),
        systemVersion: DeviceInfo.getSystemVersion(),
        appVersion: DeviceInfo.getVersion(),
        buildNumber: DeviceInfo.getBuildNumber(),
        uniqueId: DeviceInfo.getUniqueId(),
      }
      const hostname = await DeviceInfo.getDeviceName()
      let mac = ''
      // iOS does not expose MAC addresses; keep blank and rely on uniqueId/deviceId
      if (Platform.OS === 'android') {
        try { mac = await (DeviceInfo as any).getMacAddress?.() } catch {}
      }
      // eslint-disable-next-line no-console
      console.log('[Push][FCM] registering device', { hostname, macPreview: mac ? mac : 'blank', realm })
      await apiService.addDeviceDetails(fcmToken, mac || '', hostname || 'unknown-device', device_info, realm || 'default')
      pendingToken = null
      // eslint-disable-next-line no-console
      console.log('[Push][FCM] device registration success')
    }

    // Listen for token refresh
    messaging().onTokenRefresh(async (newToken) => {
      try {
        // eslint-disable-next-line no-console
        console.log('[Push][FCM] onTokenRefresh', newToken ? newToken.substring(0, 12) + '...' : 'none')
        pendingToken = newToken
        const device_info = {
          deviceId: DeviceInfo.getDeviceId(),
          brand: DeviceInfo.getBrand(),
          model: DeviceInfo.getModel(),
          systemName: DeviceInfo.getSystemName(),
          systemVersion: DeviceInfo.getSystemVersion(),
          appVersion: DeviceInfo.getVersion(),
          buildNumber: DeviceInfo.getBuildNumber(),
          uniqueId: DeviceInfo.getUniqueId(),
        }
        const hostname = await DeviceInfo.getDeviceName()
        let mac = ''
        if (Platform.OS === 'android') {
          try { mac = await (DeviceInfo as any).getMacAddress?.() } catch {}
        }
        await apiService.addDeviceDetails(newToken, mac || '', hostname || 'unknown-device', device_info, realm || 'default')
        pendingToken = null
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn('[Push][FCM] token refresh registration failed', e)
      }
    })
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('[Push][FCM] initialization failed', e)
  }

  // Android: ensure a default channel exists
  if (Platform.OS === 'android') {
    // eslint-disable-next-line no-console
    console.log('[Push] Creating Android notification channel')
    try { /* require('react-native').Alert.alert('PushDebug', 'Creating Android channel') */ } catch {}
    PushNotification.createChannel(
      {
        channelId: 'default-channel',
        channelName: 'Default Notifications',
        channelDescription: 'General notifications',
        importance: 4,
        vibrate: true,
      },
      () => {}
    )
  }

  PushNotification.configure({
    // Called when Token is generated (iOS and Android)
    onRegister: async function ({ token }: { token: string }) {
      // eslint-disable-next-line no-console
      console.log('[Push] onRegister token received')
      try { /* require('react-native').Alert.alert('PushDebug', 'onRegister received token') */ } catch {}
      try {
        if (!token || token === lastRegisteredToken) return
        lastRegisteredToken = token
        pendingToken = token

        const device_info = {
          deviceId: DeviceInfo.getDeviceId(),
          brand: DeviceInfo.getBrand(),
          model: DeviceInfo.getModel(),
          systemName: DeviceInfo.getSystemName(),
          systemVersion: DeviceInfo.getSystemVersion(),
          appVersion: DeviceInfo.getVersion(),
          buildNumber: DeviceInfo.getBuildNumber(),
          uniqueId: DeviceInfo.getUniqueId(),
        }
        const hostname = await DeviceInfo.getDeviceName()
        let mac = ''
        if (Platform.OS === 'android') {
          try { mac = await (DeviceInfo as any).getMacAddress?.() } catch {}
        }

        // mac address is not generally available; send empty string
        try {
          // eslint-disable-next-line no-console
          console.log('[Push] Registering device with backend', {
            tokenPreview: token?.slice(0, 10) + '...',
            hostname,
            realm,
          })
          await apiService.addDeviceDetails(token, mac || '', hostname || 'unknown-device', device_info, realm || 'default')
          // eslint-disable-next-line no-console
          console.log('[Push] Device registration success')
          try { /* require('react-native').Alert.alert('PushDebug', 'Device registration success') */ } catch {}
          pendingToken = null
        } catch (e: any) {
          // Likely not logged in yet; keep token pending and retry after login
          pendingToken = token
          // eslint-disable-next-line no-console
          console.warn('[Push] Device registration deferred (likely not logged in)', e?.message || e)
          try { /* require('react-native').Alert.alert('PushDebug', `Registration deferred: ${e?.message || e}`) */ } catch {}
          throw e
        }
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn('Failed to register push token with backend', e)
        try { /* require('react-native').Alert.alert('PushDebug', `Register error: ${e}`) */ } catch {}
      }
    },

    // Called on receipt of a notification
    onNotification: function (notification: any) {
      // For iOS, you must call completion to let the OS know you have finished
      if (Platform.OS === 'ios') {
        notification.finish(PushNotificationIOS.FetchResult.NoData)
      }
    },

    // (optional) Called when Action is pressed (Android)
    onAction: function () {},

    // (optional) Called when registration has an error
    onRegistrationError: function (err: any) {
      // eslint-disable-next-line no-console
      console.error(err.message, err)
    },

    // iOS permission will be requested manually via requestNotificationPermissions
    requestPermissions: false,
    popInitialNotification: true,
  })
  // eslint-disable-next-line no-console
  console.log('[Push] PushNotification.configure completed')
  try { /* require('react-native').Alert.alert('PushDebug', 'Configure completed') */ } catch {}
}

export async function requestNotificationPermissions(): Promise<boolean> {
  try {
    if (Platform.OS === 'ios') {
      const auth = await PushNotificationIOS.requestPermissions({ alert: true, badge: true, sound: true })
      return !!(auth.alert || auth.badge || auth.sound)
    }

    // Android 13+ requires runtime permission
    if (Platform.OS === 'android' && Platform.Version >= 33) {
      const res = await PermissionsAndroid.request('android.permission.POST_NOTIFICATIONS')
      return res === PermissionsAndroid.RESULTS.GRANTED
    }
    return true
  } catch {
    return false
  }
}

export function showLocalNotification(title: string, message: string): void {
  PushNotification.localNotification({
    channelId: 'default-channel',
    title,
    message,
    playSound: true,
    soundName: 'default',
    importance: 4,
    vibrate: true,
  })
}

export async function registerPendingPushToken(realm?: string): Promise<boolean> {
  if (!pendingToken) {
    // Try multiple methods to get FCM token
    console.log('[Push] No pending token, trying to get FCM token directly...');
    
    // Method 1: Try to get token directly
    try {
      const directToken = await messaging().getToken();
      if (directToken) {
        console.log('[Push] Got FCM token directly, registering...');
        pendingToken = directToken; // Set it as pending for registration
      } else {
        console.log('[Push] No FCM token available from direct call');
      }
    } catch (error) {
      console.warn('[Push] Failed to get FCM token directly:', error);
    }
    
    // Method 2: If still no token, try iOS-specific methods
    if (!pendingToken && Platform.OS === 'ios') {
      try {
        console.log('[Push] iOS: Requesting permission first...');
        const authStatus = await messaging().requestPermission();
        console.log('[Push] iOS permission status:', authStatus);
        
        // Try to get token again after permission
        const tokenAfterPermission = await messaging().getToken();
        if (tokenAfterPermission) {
          console.log('[Push] Got FCM token after permission');
          pendingToken = tokenAfterPermission;
        }
      } catch (permissionError) {
        console.warn('[Push] Failed to request permission:', permissionError);
      }
    }
    
    // Method 3: If still no token, try to register device for remote messages (iOS)
    if (!pendingToken && Platform.OS === 'ios') {
      try {
        console.log('[Push] iOS: Registering device for remote messages...');
        await messaging().registerDeviceForRemoteMessages();
        
        // Wait a bit and try again
        await new Promise(resolve => setTimeout(resolve, 1000));
        const tokenAfterRegister = await messaging().getToken();
        if (tokenAfterRegister) {
          console.log('[Push] Got FCM token after device registration');
          pendingToken = tokenAfterRegister;
        }
      } catch (registerError) {
        console.warn('[Push] Failed to register device for remote messages:', registerError);
      }
    }
    
    if (!pendingToken) {
      console.log('[Push] No FCM token available after all attempts');
      return true; // No token to register, but not an error
    }
  }
  
  try {
    const device_info = {
      deviceId: DeviceInfo.getDeviceId(),
      brand: DeviceInfo.getBrand(),
      model: DeviceInfo.getModel(),
      systemName: DeviceInfo.getSystemName(),
      systemVersion: DeviceInfo.getSystemVersion(),
      appVersion: DeviceInfo.getVersion(),
      buildNumber: DeviceInfo.getBuildNumber(),
      uniqueId: DeviceInfo.getUniqueId(),
    }
    const hostname = await DeviceInfo.getDeviceName()
    // eslint-disable-next-line no-console
    console.log('[Push] Retrying pending device registration', {
      tokenPreview: pendingToken?.slice(0, 10) + '...',
      hostname,
      realm,
    })
    await apiService.addDeviceDetails(pendingToken, '', hostname || 'unknown-device', device_info, realm || 'default')
    // eslint-disable-next-line no-console
    console.log('[Push] Pending device registration success')
    pendingToken = null
    return true
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('Retry register push token failed', e)
    return false
  }
}


// Debug/manual trigger: call backend registration even if onRegister hasn't provided a token yet
export async function registerDeviceManually(realm?: string): Promise<boolean> {
  try {
    const device_info = {
      deviceId: DeviceInfo.getDeviceId(),
      brand: DeviceInfo.getBrand(),
      model: DeviceInfo.getModel(),
      systemName: DeviceInfo.getSystemName(),
      systemVersion: DeviceInfo.getSystemVersion(),
      appVersion: DeviceInfo.getVersion(),
      buildNumber: DeviceInfo.getBuildNumber(),
      uniqueId: DeviceInfo.getUniqueId(),
    }
    const hostname = await DeviceInfo.getDeviceName()
    
    console.log('[Push] === AGGRESSIVE FCM TOKEN GENERATION ===');
    
    // Try multiple methods to get FCM token
    let tokenToSend = pendingToken;
    
    if (!tokenToSend) {
      console.log('[Push] No pending token, trying aggressive FCM token generation...');
      
      // Method 1: Try to get token directly
      try {
        console.log('[Push] Method 1: Direct token request...');
        tokenToSend = await messaging().getToken();
        console.log('[Push] Method 1 result:', tokenToSend ? `${tokenToSend.substring(0, 10)}...` : 'null');
      } catch (tokenError) {
        console.warn('[Push] Method 1 failed:', tokenError);
      }
      
      // Method 2: Force permission request (iOS)
      if (!tokenToSend && Platform.OS === 'ios') {
        try {
          console.log('[Push] Method 2: Force permission request...');
          const authStatus = await messaging().requestPermission({
            alert: true,
            badge: true,
            sound: true,
            announcement: false,
            carPlay: false,
            criticalAlert: false,
            provisional: false,
          });
          console.log('[Push] Method 2 permission result:', authStatus);
          
          // Wait and try again
          await new Promise(resolve => setTimeout(resolve, 2000));
          tokenToSend = await messaging().getToken();
          console.log('[Push] Method 2 token result:', tokenToSend ? `${tokenToSend.substring(0, 10)}...` : 'null');
        } catch (permissionError) {
          console.warn('[Push] Method 2 failed:', permissionError);
        }
      }
      
      // Method 3: Register device for remote messages (iOS)
      if (!tokenToSend && Platform.OS === 'ios') {
        try {
          console.log('[Push] Method 3: Register device for remote messages...');
          await messaging().registerDeviceForRemoteMessages();
          console.log('[Push] Method 3: Device registered successfully');
          
          // Wait longer and try again
          await new Promise(resolve => setTimeout(resolve, 3000));
          tokenToSend = await messaging().getToken();
          console.log('[Push] Method 3 token result:', tokenToSend ? `${tokenToSend.substring(0, 10)}...` : 'null');
        } catch (registerError) {
          console.warn('[Push] Method 3 failed:', registerError);
        }
      }
      
      // Method 4: Try with different Firebase messaging instance
      if (!tokenToSend) {
        try {
          console.log('[Push] Method 4: Try alternative messaging approach...');
          // Force refresh the token
          await messaging().deleteToken();
          await new Promise(resolve => setTimeout(resolve, 1000));
          tokenToSend = await messaging().getToken();
          console.log('[Push] Method 4 token result:', tokenToSend ? `${tokenToSend.substring(0, 10)}...` : 'null');
        } catch (refreshError) {
          console.warn('[Push] Method 4 failed:', refreshError);
        }
      }
      
      // Method 5: Last resort - try to initialize Firebase again
      if (!tokenToSend) {
        try {
          console.log('[Push] Method 5: Last resort - reinitialize...');
          // Re-request permission and wait longer
          await messaging().requestPermission();
          await messaging().registerDeviceForRemoteMessages();
          await new Promise(resolve => setTimeout(resolve, 5000)); // 5 second wait
          tokenToSend = await messaging().getToken();
          console.log('[Push] Method 5 token result:', tokenToSend ? `${tokenToSend.substring(0, 10)}...` : 'null');
        } catch (lastResortError) {
          console.warn('[Push] Method 5 failed:', lastResortError);
        }
      }
    }
    
    // Debug information
    console.log('[Push] === FINAL TOKEN STATUS ===');
    console.log('[Push] Token available:', !!tokenToSend);
    console.log('[Push] Token preview:', tokenToSend ? `${tokenToSend.substring(0, 20)}...` : 'none');
    console.log('[Push] Platform:', Platform.OS);
    console.log('[Push] Is emulator:', await DeviceInfo.isEmulator());
    
    // eslint-disable-next-line no-console
    console.log('[Push] Manual device registration attempt', {
      tokenPreview: tokenToSend?.slice(0, 10) + '...',
      hostname,
      realm,
      hasPendingToken: !!pendingToken,
      hasDirectToken: !!tokenToSend,
      platform: Platform.OS,
    })
    
    if (!tokenToSend) {
      console.warn('[Push] ❌ NO FCM TOKEN AVAILABLE AFTER ALL ATTEMPTS');
      
      // Check if running on simulator
      const isEmulator = await DeviceInfo.isEmulator();
      console.log('[Push] Device Info:', {
        platform: Platform.OS,
        isEmulator: isEmulator,
        deviceId: DeviceInfo.getDeviceId(),
        brand: DeviceInfo.getBrand(),
        model: DeviceInfo.getModel(),
      });
      
      if (isEmulator) {
        console.log('[Push] 🚨 RUNNING ON SIMULATOR - FCM tokens are not available on simulators');
        console.log('[Push] 💡 Solution: Test on a real iOS device to get FCM tokens');
      } else {
        console.log('[Push] This might be due to:');
        console.log('[Push] 1. Firebase not properly configured');
        console.log('[Push] 2. APNs certificate issues');
        console.log('[Push] 3. Network connectivity issues');
        console.log('[Push] 4. User denied notification permissions');
        console.log('[Push] 5. iOS version compatibility issues');
      }
      
      // WORKAROUND: Register device without FCM token for now
      console.log('[Push] 🔧 WORKAROUND: Registering device without FCM token...');
      const fallbackToken = `no-fcm-token-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      console.log('[Push] Using fallback token:', fallbackToken);
      console.log('[Push] ⚠️ Note: This device will not receive push notifications until FCM token is obtained');
      
      try {
        await apiService.addDeviceDetails(fallbackToken, '', hostname || 'unknown-device', device_info, realm || 'default');
        console.log('[Push] ✅ Device registered with fallback token');
        console.log('[Push] 📝 To get real FCM token:');
        console.log('[Push]    1. Test on real iOS device (not simulator)');
        console.log('[Push]    2. Ensure notification permissions are granted');
        console.log('[Push]    3. Check Firebase APNs certificate configuration');
        return true;
      } catch (fallbackError) {
        console.warn('[Push] ❌ Fallback registration also failed:', fallbackError);
        return false;
      }
    }
    
    console.log('[Push] ✅ FCM TOKEN OBTAINED, PROCEEDING WITH REGISTRATION');
    await apiService.addDeviceDetails(tokenToSend, '', hostname || 'unknown-device', device_info, realm || 'default')
    // eslint-disable-next-line no-console
    console.log('[Push] ✅ Manual device registration SUCCESS')
    return true
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('[Push] ❌ Manual device registration FAILED', e)
    return false
  }
}

/**
 * Update device registration with real FCM token when available
 * This can be called when FCM token becomes available later
 */
export async function updateDeviceWithRealFCMToken(realm?: string): Promise<boolean> {
  try {
    console.log('[Push] === UPDATING DEVICE WITH REAL FCM TOKEN ===');
    
    // Try to get FCM token
    let fcmToken: string | null = null;
    
    try {
      fcmToken = await messaging().getToken();
      console.log('[Push] FCM token obtained:', fcmToken ? `${fcmToken.substring(0, 20)}...` : 'null');
    } catch (tokenError) {
      console.warn('[Push] Failed to get FCM token:', tokenError);
      return false;
    }
    
    if (!fcmToken) {
      console.log('[Push] No FCM token available for update');
      return false;
    }
    
    // Check if token is a fallback token
    if (fcmToken.startsWith('no-fcm-token-')) {
      console.log('[Push] Current token is still fallback token, no update needed');
      return false;
    }
    
    // Update device registration with real FCM token
    const device_info = {
      deviceId: DeviceInfo.getDeviceId(),
      brand: DeviceInfo.getBrand(),
      model: DeviceInfo.getModel(),
      systemName: DeviceInfo.getSystemName(),
      systemVersion: DeviceInfo.getSystemVersion(),
      appVersion: DeviceInfo.getVersion(),
      buildNumber: DeviceInfo.getBuildNumber(),
      uniqueId: DeviceInfo.getUniqueId(),
    }
    const hostname = await DeviceInfo.getDeviceName()
    
    console.log('[Push] Updating device registration with real FCM token...');
    await apiService.addDeviceDetails(fcmToken, '', hostname || 'unknown-device', device_info, realm || 'default');
    console.log('[Push] ✅ Device updated with real FCM token');
    
    return true;
  } catch (error) {
    console.warn('[Push] Failed to update device with real FCM token:', error);
    return false;
  }
}


