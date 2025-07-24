import { credentialStorage } from './credentialStorage';
import { apiService } from './api';
import sessionManager from './sessionManager';

export const testTokenRegeneration = async () => {
  try {
    console.log('=== TESTING TOKEN REGENERATION ===');
    
    // Check if credentials are stored
    const credentials = await credentialStorage.getCredentials();
    console.log('Stored credentials:', {
      hasUsername: !!credentials?.username,
      hasPassword: !!credentials?.password,
      username: credentials?.username ? credentials.username.substring(0, 3) + '***' : null,
      passwordLength: credentials?.password?.length || 0
    });
    
    // Check current session
    const session = await sessionManager.getCurrentSession();
    console.log('Current session:', {
      hasSession: !!session,
      username: session?.username,
      isLoggedIn: session?.isLoggedIn,
      hasToken: !!session?.token
    });
    
    // Test token regeneration
    if (session && credentials) {
      console.log('Testing token regeneration...');
      const newToken = await apiService.regenerateToken();
      console.log('Token regeneration result:', !!newToken);
      
      if (newToken) {
        console.log('✅ Token regeneration successful!');
        await sessionManager.updateToken(newToken);
        console.log('✅ Session updated with new token');
      } else {
        console.log('❌ Token regeneration failed');
      }
    } else {
      console.log('❌ Cannot test - missing session or credentials');
    }
    
    console.log('=== TOKEN REGENERATION TEST COMPLETE ===');
  } catch (error) {
    console.error('Token regeneration test error:', error);
  }
}; 