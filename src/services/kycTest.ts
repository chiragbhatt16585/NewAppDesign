import {apiService} from './api';
import sessionManager from './sessionManager';

export const testKYCFunctionality = async () => {
  console.log('=== TESTING KYC FUNCTIONALITY ===');
  
  try {
    // Get current session
    const session = await sessionManager.getCurrentSession();
    if (!session) {
      console.log('❌ No active session found');
      return { success: false, error: 'No active session' };
    }

    const { username } = session;
    console.log('✅ Username found:', username);

    // Get current client configuration
    const {getClientConfig} = require('../config/client-config');
    const clientConfig = getClientConfig();
    const realm = clientConfig.clientId;
    console.log('✅ Realm:', realm);

    // Test KYC API call
    console.log('🔄 Calling viewUserKyc API...');
    const kycData = await apiService.viewUserKyc(username, realm);
    
    if (kycData) {
      console.log('✅ KYC data received successfully');
      console.log('📊 KYC Data Structure:', Object.keys(kycData));
      console.log('📄 Sample KYC Data:', JSON.stringify(kycData, null, 2).substring(0, 500) + '...');
      
      return {
        success: true,
        data: kycData,
        message: 'KYC functionality working correctly'
      };
    } else {
      console.log('❌ No KYC data received');
      return {
        success: false,
        error: 'No KYC data received from API'
      };
    }
  } catch (error: any) {
    console.error('❌ KYC test failed:', error);
    return {
      success: false,
      error: error.message || 'KYC test failed'
    };
  }
}; 