import credentialStorage from './credentialStorage';

// Test the credential storage functionality
export const testCredentialStorage = async () => {
  console.log('=== Testing Credential Storage ===');
  
  try {
    // Test 1: Save credentials
    console.log('Test 1: Saving credentials...');
    const saveResult = await credentialStorage.saveCredentials('testuser', 'testpass123');
    console.log('Save result:', saveResult);
    
    // Test 2: Get credentials
    console.log('Test 2: Getting credentials...');
    const credentials = await credentialStorage.getCredentials();
    console.log('Retrieved credentials:', credentials ? 'Found' : 'Not found');
    
    if (credentials) {
      console.log('Username:', credentials.username);
      console.log('Password length:', credentials.password.length);
    }
    
    // Test 3: Regenerate token (this will fail since it's a test, but should not crash)
    console.log('Test 3: Testing token regeneration...');
    const tokenResult = await credentialStorage.regenerateToken();
    console.log('Token regeneration result:', tokenResult ? 'Success' : 'Failed (expected for test)');
    
    // Test 4: Delete credentials
    console.log('Test 4: Deleting credentials...');
    const deleteResult = await credentialStorage.deleteCredentials();
    console.log('Delete result:', deleteResult);
    
    // Test 5: Verify deletion
    console.log('Test 5: Verifying deletion...');
    const credentialsAfterDelete = await credentialStorage.getCredentials();
    console.log('Credentials after delete:', credentialsAfterDelete ? 'Still exists' : 'Successfully deleted');
    
    console.log('=== Credential Storage Test Complete ===');
    return true;
  } catch (error) {
    console.error('Credential storage test failed:', error);
    return false;
  }
};

export default testCredentialStorage; 