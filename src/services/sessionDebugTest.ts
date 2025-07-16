import sessionManager from './sessionManager';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const debugSessionStatus = async () => {
  // console.log('=== DEBUGGING SESSION STATUS ===');
  
  try {
    // Check AsyncStorage directly
    const savedSession = await AsyncStorage.getItem('user_session');
    // console.log('Raw session from AsyncStorage:', savedSession);
    
    if (savedSession) {
      const parsedSession = JSON.parse(savedSession);
      // console.log('Parsed session:', parsedSession);
      // console.log('Session has token:', !!parsedSession.token);
      // console.log('Session has username:', !!parsedSession.username);
      // console.log('Session isLoggedIn:', parsedSession.isLoggedIn);
    }
    
    // Check session manager methods
    const isLoggedIn = await sessionManager.isLoggedIn();
    // console.log('isLoggedIn():', isLoggedIn);
    
    const currentSession = await sessionManager.getCurrentSession();
    // console.log('getCurrentSession():', currentSession);
    
    const token = await sessionManager.getToken();
    // console.log('getToken():', token ? 'Token exists' : 'No token');
    
    const username = await sessionManager.getUsername();
    // console.log('getUsername():', username);
    
    // Check session validation
    const sessionCheck = await sessionManager.checkSessionBeforeApiCall();
    // console.log('checkSessionBeforeApiCall():', sessionCheck);
    
    // console.log('=== SESSION DEBUG COMPLETE ===');
    
    return {
      savedSession,
      isLoggedIn,
      currentSession,
      token: !!token,
      username,
      sessionCheck
    };
  } catch (error) {
    console.error('Session debug failed:', error);
    throw error;
  }
}; 