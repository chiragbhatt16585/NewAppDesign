import { getApp } from '@react-native-firebase/app';
import { getMessaging, getToken, onMessage, onNotificationOpenedApp, getInitialNotification, requestPermission } from '@react-native-firebase/messaging';
import PushNotification from 'react-native-push-notification';
import { Platform } from 'react-native';

// Check if Firebase is available
if (!getApp) {
  console.error('Firebase app module is not available');
}

class PushNotificationService {
  private static instance: PushNotificationService;

  private constructor() {
    this.configurePushNotifications();
  }

  public static getInstance(): PushNotificationService {
    if (!PushNotificationService.instance) {
      PushNotificationService.instance = new PushNotificationService();
    }
    return PushNotificationService.instance;
  }

  private configurePushNotifications() {
    // Configure push notifications
    PushNotification.configure({
      onRegister: function (token) {
        console.log('TOKEN:', token);
      },
      onNotification: function (notification) {
        console.log('NOTIFICATION:', notification);
      },
      permissions: {
        alert: true,
        badge: true,
        sound: true,
      },
      popInitialNotification: true,
      requestPermissions: Platform.OS === 'ios',
    });

    // Create notification channel for Android
    if (Platform.OS === 'android') {
      PushNotification.createChannel(
        {
          channelId: 'default',
          channelName: 'ISP App Notifications',
          channelDescription: 'High priority notifications with rich styling',
          soundName: 'default',
          importance: 4,
          vibrate: true,
          vibration: 300,
          lightColor: '#007AFF',
          lockscreenVisibility: 1,
          bypassDnd: false,
        },
        (created) => console.log(`Channel created: ${created}`)
      );
    }
  }

  async requestUserPermission(): Promise<boolean> {
    try {
      const authStatus = await requestPermission();
      const enabled =
        authStatus === 1 || // AUTHORIZED
        authStatus === 2;   // PROVISIONAL

      if (enabled) {
        console.log('Authorization status:', authStatus);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Permission request failed:', error);
      return false;
    }
  }

  async getFCMToken(): Promise<string | null> {
    try {
      console.log('getFCMToken called, Firebase available:', !!getApp);
      
      if (!getApp) {
        console.error('Firebase is not available');
        return null;
      }
      
      const app = getApp();
      const messagingInstance = getMessaging(app);
      console.log('Messaging instance created:', !!messagingInstance);
      
      const token = await getToken(messagingInstance);
      console.log('FCM Token:', token);
      return token;
    } catch (error) {
      console.error('Failed to get FCM token:', error);
      return null;
    }
  }

  async onMessageReceived() {
    try {
      const app = getApp();
      const messagingInstance = getMessaging(app);
      
      return onMessage(messagingInstance, async (remoteMessage) => {
        console.log('Message received in foreground:', remoteMessage);
        
        // Show local notification when app is in foreground
        PushNotification.localNotification({
          channelId: 'default',
          title: remoteMessage.notification?.title || 'New Message',
          message: remoteMessage.notification?.body || 'You have a new message',
          playSound: true,
          soundName: 'default',
          importance: 'high',
          priority: 'high',
          // Enhanced notification styling
          largeIcon: remoteMessage.notification?.android?.imageUrl || 'ic_launcher',
          smallIcon: 'ic_notification',
          color: '#007AFF',
          vibrate: true,
          vibration: 300,
          tag: remoteMessage.messageId || 'default',
          group: 'ISPApp',
          // iOS specific
          userInfo: remoteMessage.data || {},
        });
      });
    } catch (error) {
      console.error('Error setting up onMessage listener:', error);
    }
  }

  async onNotificationOpenedApp() {
    try {
      const app = getApp();
      const messagingInstance = getMessaging(app);
      
      return onNotificationOpenedApp(messagingInstance, (remoteMessage) => {
        console.log('Notification opened app:', remoteMessage);
        // Handle navigation or other actions when notification is tapped
      });
    } catch (error) {
      console.error('Error setting up onNotificationOpenedApp listener:', error);
    }
  }

  async getInitialNotification() {
    try {
      const app = getApp();
      const messagingInstance = getMessaging(app);
      
      const remoteMessage = await getInitialNotification(messagingInstance);
      if (remoteMessage) {
        console.log('Initial notification:', remoteMessage);
        // Handle initial notification
      }
    } catch (error) {
      console.error('Failed to get initial notification:', error);
    }
  }

  async subscribeToTopic(topic: string): Promise<void> {
    try {
      const app = getApp();
      const messagingInstance = getMessaging(app);
      
      // Note: Topic subscription is not available in the new modular API
      // You'll need to implement this through your backend or use the old API temporarily
      console.log(`Topic subscription not available in new API for: ${topic}`);
    } catch (error) {
      console.error(`Failed to subscribe to topic ${topic}:`, error);
    }
  }

  async unsubscribeFromTopic(topic: string): Promise<void> {
    try {
      const app = getApp();
      const messagingInstance = getMessaging(app);
      
      // Note: Topic unsubscription is not available in the new modular API
      // You'll need to implement this through your backend or use the old API temporarily
      console.log(`Topic unsubscription not available in new API for: ${topic}`);
    } catch (error) {
      console.error(`Failed to unsubscribe from topic ${topic}:`, error);
    }
  }

  // Method to create a styled notification like the ones in your screenshot
  async createStyledNotification(notificationData: {
    title: string;
    message: string;
    sender?: string;
    appIcon?: string;
    timestamp?: string;
    badge?: number;
    data?: any;
  }): Promise<void> {
    try {
      const {
        title,
        message,
        sender,
        appIcon = 'ic_launcher',
        timestamp,
        badge = 1,
        data = {}
      } = notificationData;

      // Create notification with enhanced styling
      PushNotification.localNotification({
        channelId: 'default',
        title: title,
        message: message,
        playSound: true,
        soundName: 'default',
        importance: 'high',
        priority: 'high',
        
        // Enhanced styling
        largeIcon: appIcon,
        smallIcon: 'ic_notification',
        color: '#007AFF',
        vibrate: true,
        vibration: 300,
        tag: `notification_${Date.now()}`,
        group: 'ISPApp',
        
        // Badge count
        number: badge,
        
        // Additional data
        userInfo: {
          ...data,
          sender,
          timestamp,
          appIcon
        },
        
        // Android specific
        channelId: 'default',
        
        // iOS specific
        userInfo: {
          ...data,
          sender,
          timestamp,
          appIcon
        },
      });
      
      console.log('Styled notification created:', title);
    } catch (error) {
      console.error('Failed to create styled notification:', error);
    }
  }

  // Method to send token to your backend
  async sendTokenToBackend(token: string, userId?: string): Promise<void> {
    try {
      // Replace with your actual API endpoint
      const response = await fetch('YOUR_API_ENDPOINT/fcm-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fcmToken: token,
          userId: userId,
          platform: Platform.OS,
        }),
      });

      if (response.ok) {
        console.log('FCM token sent to backend successfully');
      } else {
        console.error('Failed to send FCM token to backend');
      }
    } catch (error) {
      console.error('Error sending FCM token to backend:', error);
    }
  }
}

export default PushNotificationService;
