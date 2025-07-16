import sessionManager from './sessionManager';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const testSessionPersistence = async () => {
  // console.log('=== TESTING SESSION PERSISTENCE ===');
  
  try {
    // Test 1: Check if session exists
    const isLoggedIn = await sessionManager.isLoggedIn();
    // console.log('1. Is logged in:', isLoggedIn);
    
    // Test 2: Get current session
    const session = await sessionManager.getCurrentSession();
    // console.log('2. Current session:', session ? 'Exists' : 'None');
    
    if (session) {
      // console.log('   - Username:', session.username);
      // console.log('   - Has token:', !!session.token);
      // console.log('   - Is logged in:', session.isLoggedIn);
    }
    
    // Test 3: Get token
    const token = await sessionManager.getToken();
    // console.log('3. Token:', token ? 'Exists' : 'Missing');
    
    // Test 4: Get username
    const username = await sessionManager.getUsername();
    // console.log('4. Username:', username);
    
    // Test 5: Check session validation
    const sessionCheck = await sessionManager.checkSessionBeforeApiCall();
    // console.log('5. Session validation:', sessionCheck);
    
    // Test 6: Check AsyncStorage directly
    const rawSession = await AsyncStorage.getItem('user_session');
    // console.log('6. Raw session in AsyncStorage:', rawSession ? 'Exists' : 'None');
    
    if (rawSession) {
      const parsed = JSON.parse(rawSession);
      // console.log('   - Parsed session:', {
      //   username: parsed.username,
      //   hasToken: !!parsed.token,
      //   isLoggedIn: parsed.isLoggedIn
      // });
    }
    
    // console.log('=== SESSION PERSISTENCE TEST COMPLETE ===');
    
    return {
      isLoggedIn,
      hasSession: !!session,
      hasToken: !!token,
      username,
      sessionCheck,
      hasRawSession: !!rawSession
    };
  } catch (error) {
    console.error('Session persistence test failed:', error);
    throw error;
  }
}; 