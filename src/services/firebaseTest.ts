import { Platform } from 'react-native';
import DeviceInfo from 'react-native-device-info';
import messaging from '@react-native-firebase/messaging';
import firebase from '@react-native-firebase/app';
import { initializeFirebase, checkFirebaseConfig } from './firebaseInit';

/**
 * Test Firebase configuration and FCM availability
 */
export async function testFirebaseConfiguration() {
  console.log('🔥 === FIREBASE CONFIGURATION TEST ===');
  
  try {
    // Test 1: Initialize Firebase first
    console.log('📱 Test 1: Firebase App Initialization');
    const firebaseInitialized = initializeFirebase();
    if (!firebaseInitialized) {
      console.log('❌ Firebase initialization failed');
      return false;
    }
    
    const app = firebase.app();
    console.log('✅ Firebase app initialized:', !!app);
    console.log('📱 App name:', app.name);
    console.log('📱 App options:', app.options);
    
    // Test 2: Check if messaging is available
    console.log('📱 Test 2: Firebase Messaging Availability');
    console.log('✅ Messaging available:', !!messaging);
    
    if (!messaging) {
      console.log('❌ Firebase Messaging not available');
      return false;
    }
    
    // Test 3: Check device info
    console.log('📱 Test 3: Device Information');
    const deviceInfo = {
      platform: Platform.OS,
      version: Platform.Version,
      isEmulator: await DeviceInfo.isEmulator(),
      deviceId: DeviceInfo.getDeviceId(),
      brand: DeviceInfo.getBrand(),
      model: DeviceInfo.getModel(),
      systemName: DeviceInfo.getSystemName(),
      systemVersion: DeviceInfo.getSystemVersion(),
    };
    console.log('📱 Device Info:', deviceInfo);
    
    // Test 4: Check if running on simulator
    if (await DeviceInfo.isEmulator()) {
      console.log('⚠️ WARNING: Running on simulator - FCM tokens may not be available');
      console.log('💡 Solution: Test on a real device');
      return false;
    }
    
    // Test 5: Check permission status
    console.log('📱 Test 4: Permission Status');
    try {
      const authStatus = await messaging().requestPermission();
      console.log('🔐 Permission status:', authStatus);
      
      if (authStatus === messaging.AuthorizationStatus.DENIED) {
        console.log('❌ Notifications denied by user');
        return false;
      }
      
      if (authStatus === messaging.AuthorizationStatus.NOT_DETERMINED) {
        console.log('⚠️ Permission not determined');
        return false;
      }
      
      console.log('✅ Permission granted');
    } catch (permissionError) {
      console.log('❌ Permission error:', permissionError);
      return false;
    }
    
    // Test 6: Try to get FCM token
    console.log('📱 Test 5: FCM Token Generation');
    try {
      const token = await messaging().getToken();
      console.log('🎫 FCM Token:', token ? `${token.substring(0, 20)}...` : 'null');
      
      if (token) {
        console.log('✅ FCM token successfully generated');
        return true;
      } else {
        console.log('❌ No FCM token generated');
        return false;
      }
    } catch (tokenError) {
      console.log('❌ FCM token error:', tokenError);
      return false;
    }
    
  } catch (error) {
    console.error('❌ Firebase test failed:', error);
    return false;
  }
}

/**
 * Check Firebase project configuration
 */
export function checkFirebaseProjectConfig() {
  console.log('🔥 === FIREBASE PROJECT CONFIG CHECK ===');
  
  try {
    // Initialize Firebase first
    const firebaseInitialized = initializeFirebase();
    if (!firebaseInitialized) {
      console.log('❌ Firebase not initialized');
      return false;
    }
    
    // Use the centralized config check
    return checkFirebaseConfig();
    
  } catch (error) {
    console.error('❌ Firebase config check failed:', error);
    return false;
  }
}

/**
 * Comprehensive Firebase and FCM test
 */
export async function runComprehensiveFirebaseTest() {
  console.log('🧪 === COMPREHENSIVE FIREBASE TEST ===');
  
  const results = {
    firebaseInit: false,
    firebaseConfig: false,
    messagingAvailable: false,
    deviceInfo: false,
    permission: false,
    fcmToken: false,
    overall: false
  };
  
  try {
    // Test Firebase initialization
    results.firebaseInit = initializeFirebase();
    
    if (!results.firebaseInit) {
      console.log('❌ Firebase initialization failed, stopping tests');
      return results;
    }
    
    // Test Firebase configuration
    results.firebaseConfig = checkFirebaseProjectConfig();
    
    // Test messaging availability
    results.messagingAvailable = !!messaging;
    
    // Test device info
    results.deviceInfo = !(await DeviceInfo.isEmulator());
    
    // Test permission
    if (messaging) {
      try {
        const authStatus = await messaging().requestPermission();
        results.permission = authStatus !== messaging.AuthorizationStatus.DENIED;
      } catch (error) {
        results.permission = false;
      }
    }
    
    // Test FCM token
    if (messaging && results.permission) {
      try {
        const token = await messaging().getToken();
        results.fcmToken = !!token;
      } catch (error) {
        results.fcmToken = false;
      }
    }
    
    // Overall result
    results.overall = results.firebaseInit && results.firebaseConfig && results.messagingAvailable && 
                     results.deviceInfo && results.permission && results.fcmToken;
    
    console.log('📊 Test Results:', results);
    
    if (!results.overall) {
      console.log('❌ Firebase/FCM setup issues detected:');
      if (!results.firebaseInit) console.log('  - Firebase initialization failed');
      if (!results.firebaseConfig) console.log('  - Firebase configuration incomplete');
      if (!results.messagingAvailable) console.log('  - Firebase Messaging not available');
      if (!results.deviceInfo) console.log('  - Running on simulator (use real device)');
      if (!results.permission) console.log('  - Notification permission denied');
      if (!results.fcmToken) console.log('  - FCM token generation failed');
    } else {
      console.log('✅ All Firebase/FCM tests passed!');
    }
    
    return results;
    
  } catch (error) {
    console.error('❌ Comprehensive test failed:', error);
    return results;
  }
}
