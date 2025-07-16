import {getClientConfig} from '../config/client-config';

export const testClientConfiguration = async () => {
  console.log('=== TESTING CLIENT CONFIGURATION ===');
  
  try {
    // Get current client configuration
    const clientConfig = getClientConfig();
    
    console.log('✅ Client Configuration:', {
      clientId: clientConfig.clientId,
      clientName: clientConfig.clientName,
      apiBaseURL: clientConfig.api.baseURL,
      appName: clientConfig.branding.appName
    });
    
    // Test realm determination
    const realm = clientConfig.clientId;
    console.log('✅ Determined Realm:', realm);
    
    return {
      success: true,
      clientConfig,
      realm,
      message: 'Client configuration working correctly'
    };
  } catch (error: any) {
    console.error('❌ Client configuration test failed:', error);
    return {
      success: false,
      error: error.message || 'Client configuration test failed'
    };
  }
}; 