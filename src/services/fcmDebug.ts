import { Platform } from 'react-native';
import DeviceInfo from 'react-native-device-info';
import messaging from '@react-native-firebase/messaging';

/**
 * Debug function to troubleshoot FCM token issues on iOS
 */
export async function debugFCMTokenIssues() {
  console.log('🔍 === FCM TOKEN DEBUG ===');
  
  try {
    // Basic device info
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
    
    // Check if messaging is available
    console.log('🔥 Firebase Messaging Available:', !!messaging);
    
    if (!messaging) {
      console.log('❌ Firebase Messaging not available');
      return;
    }
    
    // Check permission status
    try {
      const authStatus = await messaging().requestPermission();
      console.log('🔐 Permission Status:', authStatus);
    } catch (permissionError) {
      console.log('❌ Permission Error:', permissionError);
    }
    
    // Try to get FCM token
    try {
      const token = await messaging().getToken();
      console.log('🎫 FCM Token:', token ? `${token.substring(0, 20)}...` : 'null');
      
      if (!token) {
        console.log('❌ No FCM token received');
        
        // iOS-specific troubleshooting
        if (Platform.OS === 'ios') {
          console.log('🍎 iOS-specific troubleshooting:');
          
          // Check if device is registered for remote messages
          try {
            console.log('📱 Registering device for remote messages...');
            await messaging().registerDeviceForRemoteMessages();
            console.log('✅ Device registered for remote messages');
            
            // Wait and try again
            console.log('⏳ Waiting 2 seconds...');
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            const tokenAfterRegister = await messaging().getToken();
            console.log('🎫 FCM Token after register:', tokenAfterRegister ? `${tokenAfterRegister.substring(0, 20)}...` : 'still null');
            
          } catch (registerError) {
            console.log('❌ Failed to register device:', registerError);
          }
        }
      } else {
        console.log('✅ FCM token successfully obtained');
      }
      
    } catch (tokenError) {
      console.log('❌ Token Error:', tokenError);
    }
    
    // Check if running on simulator
    if (await DeviceInfo.isEmulator()) {
      console.log('⚠️ Running on simulator - FCM tokens may not be available');
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
  
  console.log('🔍 === END FCM TOKEN DEBUG ===');
}

/**
 * Force FCM token generation (iOS-specific)
 */
export async function forceFCMTokenGeneration(): Promise<string | null> {
  console.log('🔄 Forcing FCM token generation...');
  
  try {
    if (Platform.OS !== 'ios') {
      console.log('⚠️ Not iOS, using standard method');
      return await messaging().getToken();
    }
    
    // iOS-specific steps
    console.log('🍎 iOS: Starting forced token generation...');
    
    // Step 1: Request permission
    console.log('🔐 Step 1: Requesting permission...');
    const authStatus = await messaging().requestPermission();
    console.log('🔐 Permission result:', authStatus);
    
    // Step 2: Register device for remote messages
    console.log('📱 Step 2: Registering device for remote messages...');
    await messaging().registerDeviceForRemoteMessages();
    console.log('✅ Device registered');
    
    // Step 3: Wait for token generation
    console.log('⏳ Step 3: Waiting for token generation...');
    await new Promise(resolve => setTimeout(resolve, 3000)); // 3 second wait
    
    // Step 4: Try to get token
    console.log('🎫 Step 4: Getting FCM token...');
    const token = await messaging().getToken();
    
    if (token) {
      console.log('✅ FCM token generated successfully:', token.substring(0, 20) + '...');
      return token;
    } else {
      console.log('❌ Still no FCM token after forced generation');
      return null;
    }
    
  } catch (error) {
    console.error('❌ Forced token generation failed:', error);
    return null;
  }
}
