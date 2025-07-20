import sessionManager from './sessionManager';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const debugSessionStatus = async () => {
  console.log('=== DEBUGGING SESSION STATUS ===');
  
  try {
    // Check AsyncStorage directly
    const savedSession = await AsyncStorage.getItem('user_session');
    console.log('Raw session from AsyncStorage:', savedSession);
    
    if (savedSession) {
      const parsedSession = JSON.parse(savedSession);
      console.log('Parsed session:', parsedSession);
      console.log('Session has token:', !!parsedSession.token);
      console.log('Session has username:', !!parsedSession.username);
      console.log('Session isLoggedIn:', parsedSession.isLoggedIn);
    }
    
    // Check session manager methods
    const isLoggedIn = await sessionManager.isLoggedIn();
    console.log('isLoggedIn():', isLoggedIn);
    
    const currentSession = await sessionManager.getCurrentSession();
    console.log('getCurrentSession():', currentSession);
    
    const token = await sessionManager.getToken();
    console.log('getToken():', token ? 'Token exists' : 'No token');
    
    const username = await sessionManager.getUsername();
    console.log('getUsername():', username);
    
    // Check session validation
    const sessionCheck = await sessionManager.checkSessionBeforeApiCall();
    console.log('checkSessionBeforeApiCall():', sessionCheck);
    
    // Check stored credentials
    const storedUsername = await AsyncStorage.getItem('stored_username');
    const storedPassword = await AsyncStorage.getItem('stored_password');
    console.log('Stored username:', storedUsername);
    console.log('Stored password exists:', !!storedPassword);
    
    // Check current client
    const currentClient = await AsyncStorage.getItem('current_client');
    const currentApiUrl = await AsyncStorage.getItem('current_api_url');
    console.log('Current client:', currentClient);
    console.log('Current API URL:', currentApiUrl);
    
    console.log('=== SESSION DEBUG COMPLETE ===');
    
    return {
      savedSession,
      isLoggedIn,
      currentSession,
      token: !!token,
      username,
      sessionCheck,
      storedUsername,
      storedPassword: !!storedPassword,
      currentClient,
      currentApiUrl
    };
  } catch (error: any) {
    console.error('Session debug failed:', error);
    throw error;
  }
};

// New comprehensive session test and fix function
export const testAndFixSession = async () => {
  console.log('=== TESTING AND FIXING SESSION ===');
  
  try {
    // First, diagnose the session
    const diagnosis = await sessionManager.diagnoseAndFixSession();
    console.log('Session diagnosis:', diagnosis);
    
    if (diagnosis.needsReset) {
      console.log('Session needs reset. Issues found:', diagnosis.issues);
      
      // Reset the session
      await sessionManager.resetSession();
      console.log('Session reset completed');
      
      return {
        action: 'reset',
        issues: diagnosis.issues,
        message: 'Session has been reset. Please login again.'
      };
    } else {
      console.log('Session appears to be valid');
      
      // Test the session by trying to get user data
      const session = await sessionManager.getCurrentSession();
      if (session) {
        return {
          action: 'valid',
          session: {
            username: session.username,
            hasToken: !!session.token,
            isLoggedIn: session.isLoggedIn
          },
          message: 'Session is valid and ready to use.'
        };
      } else {
        return {
          action: 'invalid',
          message: 'Session appears invalid despite diagnosis.'
        };
      }
    }
  } catch (error: any) {
    console.error('Session test and fix failed:', error);
    return {
      action: 'error',
      error: error.message,
      message: 'Error occurred while testing session.'
    };
  }
};

// Quick session reset function
export const quickSessionReset = async () => {
  console.log('=== QUICK SESSION RESET ===');
  
  try {
    await sessionManager.resetSession();
    console.log('Quick session reset completed');
    
    return {
      success: true,
      message: 'Session reset successfully. Please login again.'
    };
  } catch (error: any) {
    console.error('Quick session reset failed:', error);
    return {
      success: false,
      error: error.message,
      message: 'Failed to reset session.'
    };
  }
}; 