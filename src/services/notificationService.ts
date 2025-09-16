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
  if (!pendingToken) return true
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
    const tokenToSend = pendingToken // do not fallback to manual-debug-token on real devices
    // eslint-disable-next-line no-console
    console.log('[Push] Manual device registration attempt', {
      tokenPreview: tokenToSend?.slice(0, 10) + '...',
      hostname,
      realm,
    })
    try { /* require('react-native').Alert.alert('PushDebug', `Manual register with token: ${tokenToSend ? tokenToSend.substring(0,10)+'...' : 'none'}`) */ } catch {}
    if (!tokenToSend) throw new Error('No FCM token available yet')
    await apiService.addDeviceDetails(tokenToSend, '', hostname || 'unknown-device', device_info, realm || 'default')
    // eslint-disable-next-line no-console
    console.log('[Push] Manual device registration success')
    try { /* require('react-native').Alert.alert('PushDebug', 'Manual device registration success') */ } catch {}
    return true
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('[Push] Manual device registration failed', e)
    try { /* require('react-native').Alert.alert('PushDebug', `Manual registration failed: ${e}`) */ } catch {}
    return false
  }
}


