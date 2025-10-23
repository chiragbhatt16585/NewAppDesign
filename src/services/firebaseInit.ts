import firebase from '@react-native-firebase/app';
import messaging from '@react-native-firebase/messaging';
import { Platform } from 'react-native';

/**
 * Initialize Firebase app
 * This ensures Firebase is properly initialized before use
 */
export function initializeFirebase() {
  try {
    console.log('🔥 Initializing Firebase...');
    
    // Check if Firebase is already initialized
    const apps = firebase.apps;
    console.log('🔥 Existing Firebase apps:', apps.length);
    
    if (apps.length === 0) {
      console.log('🔥 No Firebase apps found, Firebase should auto-initialize with config files');
      
      // Try to get the default app
      try {
        const app = firebase.app();
        console.log('✅ Firebase app initialized successfully');
        console.log('📱 App name:', app.name);
        console.log('📱 Project ID:', app.options.projectId);
        return true;
      } catch (error) {
        console.error('❌ Firebase app initialization failed:', error);
        return false;
      }
    } else {
      console.log('✅ Firebase already initialized');
      const app = firebase.app();
      console.log('📱 App name:', app.name);
      console.log('📱 Project ID:', app.options.projectId);
      return true;
    }
  } catch (error) {
    console.error('❌ Firebase initialization error:', error);
    return false;
  }
}

/**
 * Check Firebase configuration
 */
export function checkFirebaseConfig() {
  try {
    console.log('🔥 === FIREBASE CONFIG CHECK ===');
    
    const app = firebase.app();
    const options = app.options;
    
    console.log('📱 Project ID:', options.projectId);
    console.log('📱 App ID:', options.appId);
    console.log('📱 API Key:', options.apiKey ? `${options.apiKey.substring(0, 10)}...` : 'none');
    console.log('📱 Storage Bucket:', options.storageBucket);
    console.log('📱 Messaging Sender ID:', options.messagingSenderId);
    
    // Check if required fields are present
    const requiredFields = ['projectId', 'appId', 'apiKey'];
    const missingFields = requiredFields.filter(field => !options[field]);
    
    if (missingFields.length > 0) {
      console.log('❌ Missing required Firebase fields:', missingFields);
      return false;
    }
    
    console.log('✅ Firebase configuration looks good');
    return true;
    
  } catch (error) {
    console.error('❌ Firebase config check failed:', error);
    return false;
  }
}

/**
 * Test Firebase Messaging
 */
export async function testFirebaseMessaging() {
  try {
    console.log('🔥 === FIREBASE MESSAGING TEST ===');
    
    // Check if messaging is available
    if (!messaging) {
      console.log('❌ Firebase Messaging not available');
      return false;
    }
    
    console.log('✅ Firebase Messaging available');
    
    // Test permission request
    try {
      const authStatus = await messaging().requestPermission();
      console.log('🔐 Permission status:', authStatus);
      
      if (authStatus === messaging.AuthorizationStatus.DENIED) {
        console.log('❌ Notifications denied by user');
        return false;
      }
      
      console.log('✅ Notification permission granted');
    } catch (permissionError) {
      console.log('❌ Permission error:', permissionError);
      return false;
    }
    
    // Test FCM token generation
    try {
      const token = await messaging().getToken();
      console.log('🎫 FCM Token:', token ? `${token.substring(0, 20)}...` : 'null');
      
      if (token) {
        console.log('✅ FCM token generated successfully');
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
    console.error('❌ Firebase Messaging test failed:', error);
    return false;
  }
}

/**
 * Comprehensive Firebase initialization and test
 */
export async function initializeAndTestFirebase() {
  console.log('🔥 === COMPREHENSIVE FIREBASE INITIALIZATION ===');
  
  const results = {
    firebaseInit: false,
    configCheck: false,
    messagingTest: false,
    overall: false
  };
  
  try {
    // Step 1: Initialize Firebase
    results.firebaseInit = initializeFirebase();
    
    if (!results.firebaseInit) {
      console.log('❌ Firebase initialization failed, stopping tests');
      return results;
    }
    
    // Step 2: Check configuration
    results.configCheck = checkFirebaseConfig();
    
    if (!results.configCheck) {
      console.log('❌ Firebase configuration check failed');
      return results;
    }
    
    // Step 3: Test messaging
    results.messagingTest = await testFirebaseMessaging();
    
    // Overall result
    results.overall = results.firebaseInit && results.configCheck && results.messagingTest;
    
    console.log('📊 Firebase Test Results:', results);
    
    if (results.overall) {
      console.log('✅ All Firebase tests passed!');
    } else {
      console.log('❌ Some Firebase tests failed');
    }
    
    return results;
    
  } catch (error) {
    console.error('❌ Comprehensive Firebase test failed:', error);
    return results;
  }
}
