import sessionManager from './sessionManager';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const testSessionPersistence = async () => {
  // console.log('=== TESTING SESSION PERSISTENCE ===');
  
  try {
    // Test 1: Check if session exists
    const isLoggedIn = await sessionManager.isLoggedIn();
    // console.log('Test 1 - Is logged in:', isLoggedIn);
    
    // Test 2: Get current session
    const session = await sessionManager.getCurrentSession();
    // console.log('Test 2 - Current session:', session ? {
    //   username: session.username,
    //   isLoggedIn: session.isLoggedIn,
    //   hasToken: !!session.token
    // } : 'No session');
    
    // Test 3: Check AsyncStorage directly
    const savedSession = await AsyncStorage.getItem('user_session');
    // console.log('Test 3 - Saved session in AsyncStorage:', savedSession ? 'Exists' : 'Not found');
    
    if (savedSession) {
      const parsedSession = JSON.parse(savedSession);
      // console.log('Test 3 - Parsed session:', {
      //   username: parsedSession.username,
      //   isLoggedIn: parsedSession.isLoggedIn,
      //   hasToken: !!parsedSession.token
      // });
    }
    
    // Test 4: Check stored credentials
    const storedUsername = await AsyncStorage.getItem('stored_username');
    const storedPassword = await AsyncStorage.getItem('stored_password');
    // console.log('Test 4 - Stored credentials:', {
    //   username: storedUsername ? 'Exists' : 'Not found',
    //   password: storedPassword ? 'Exists' : 'Not found'
    // });
    
    // console.log('=== SESSION PERSISTENCE TEST COMPLETE ===');
    
  } catch (error) {
    console.error('Error testing session persistence:', error);
  }
}; 