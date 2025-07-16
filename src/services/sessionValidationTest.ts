import sessionManager from './sessionManager';

export const testSessionValidation = async () => {
  console.log('=== TESTING SESSION VALIDATION ===');
  
  try {
    // Test 1: Check session before API call
    console.log('Test 1: Checking session before API call...');
    const sessionCheck = await sessionManager.checkSessionBeforeApiCall();
    console.log('Session check result:', sessionCheck);
    
    // Test 2: Get inactivity info
    console.log('Test 2: Getting inactivity info...');
    const inactivityInfo = await sessionManager.getInactivityInfo();
    console.log('Inactivity info:', inactivityInfo);
    
    // Test 3: Get session expiry info
    console.log('Test 3: Getting session expiry info...');
    const sessionInfo = await sessionManager.getSessionExpiryInfo();
    console.log('Session expiry info:', sessionInfo);
    
    // Test 4: Get days since last activity
    console.log('Test 4: Getting days since last activity...');
    const daysSinceActivity = await sessionManager.getDaysSinceLastActivity();
    console.log('Days since last activity:', daysSinceActivity);
    
    console.log('=== SESSION VALIDATION TEST COMPLETE ===');
    
    return {
      sessionCheck,
      inactivityInfo,
      sessionInfo,
      daysSinceActivity
    };
  } catch (error) {
    console.error('Session validation test failed:', error);
    throw error;
  }
}; 