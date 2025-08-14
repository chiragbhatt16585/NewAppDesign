import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
} from 'react-native';
import PushNotificationService from '../services/pushNotificationService';

const PushNotificationTest: React.FC = () => {
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [isSubscribed, setIsSubscribed] = useState(false);

  const testLocalNotification = () => {
    const pushService = PushNotificationService.getInstance();
    
    // Test local notification
    if (Platform.OS === 'android') {
      pushService['configurePushNotifications']();
    }
    
    Alert.alert(
      'Test Notification',
      'Local notification test completed. Check console for logs.',
      [{ text: 'OK' }]
    );
  };

  const testStyledNotification = () => {
    const pushService = PushNotificationService.getInstance();
    
    // Create a notification like the ones in your screenshot
    pushService.createStyledNotification({
      title: 'Action Required: Report your investment gain',
      message: "It's time to start filing so that you get time to report all your investment data accurately.",
      sender: 'Neha From ClearTax',
      timestamp: '4m ago',
      badge: 2,
      data: {
        type: 'investment_reminder',
        priority: 'high'
      }
    });
  };

  const testSpacecomNotification = () => {
    const pushService = PushNotificationService.getInstance();
    
    // Create a Spacecom notification like in your screenshot
    pushService.createStyledNotification({
      title: 'Spacecom Development Team',
      message: 'Try this vpn ip: 103.196.77.89',
      sender: 'Nirmal Patel 🇮🇳',
      timestamp: '5m ago',
      badge: 2,
      data: {
        type: 'team_message',
        vpn_ip: '103.196.77.89'
      }
    });
  };

  const getFCMToken = async () => {
    try {
      const pushService = PushNotificationService.getInstance();
      const token = await pushService.getFCMToken();
      setFcmToken(token);
      Alert.alert('FCM Token', `Token: ${token?.substring(0, 50)}...`);
    } catch (error) {
      Alert.alert('Error', 'Failed to get FCM token');
    }
  };

  const subscribeToTopic = async () => {
    try {
      const pushService = PushNotificationService.getInstance();
      await pushService.subscribeToTopic('test-topic');
      setIsSubscribed(true);
      Alert.alert('Success', 'Subscribed to test-topic');
    } catch (error) {
      Alert.alert('Error', 'Failed to subscribe to topic');
    }
  };

  const unsubscribeFromTopic = async () => {
    try {
      const pushService = PushNotificationService.getInstance();
      await pushService.unsubscribeFromTopic('test-topic');
      setIsSubscribed(false);
      Alert.alert('Success', 'Unsubscribed from test-topic');
    } catch (error) {
      Alert.alert('Error', 'Failed to unsubscribe from topic');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🔔 Push Notification Test</Text>
      
      <TouchableOpacity style={styles.button} onPress={testLocalNotification}>
        <Text style={styles.buttonText}>Test Local Notification</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={[styles.button, { backgroundColor: '#4CAF50' }]} onPress={testStyledNotification}>
        <Text style={styles.buttonText}>Test ClearTax Style Notification</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={[styles.button, { backgroundColor: '#2196F3' }]} onPress={testSpacecomNotification}>
        <Text style={styles.buttonText}>Test Spacecom Style Notification</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.button} onPress={getFCMToken}>
        <Text style={styles.buttonText}>Get FCM Token</Text>
      </TouchableOpacity>
      
      {fcmToken && (
        <View style={styles.tokenContainer}>
          <Text style={styles.tokenLabel}>FCM Token:</Text>
          <Text style={styles.tokenText} numberOfLines={2}>
            {fcmToken.substring(0, 50)}...
          </Text>
        </View>
      )}
      
      <TouchableOpacity 
        style={[styles.button, styles.buttonDisabled]} 
        onPress={subscribeToTopic}
        disabled={true}
      >
        <Text style={styles.buttonText}>Subscribe to Test Topic (Not Available)</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.button, styles.buttonDisabled]} 
        onPress={unsubscribeFromTopic}
        disabled={true}
      >
        <Text style={styles.buttonText}>Unsubscribe from Test Topic (Not Available)</Text>
      </TouchableOpacity>
      
      <Text style={styles.info}>
        Check console logs for detailed information about push notifications.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  tokenContainer: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  tokenLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 5,
  },
  tokenText: {
    fontSize: 12,
    color: '#333',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  info: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 20,
  },
});

export default PushNotificationTest;
