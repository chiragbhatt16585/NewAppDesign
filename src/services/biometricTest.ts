import ReactNativeBiometrics from 'react-native-biometrics';
import { Platform } from 'react-native';

const rnBiometrics = new ReactNativeBiometrics();

export const testBiometricAvailability = async () => {
  console.log('=== BIOMETRIC AVAILABILITY TEST ===');
  console.log('Platform:', Platform.OS);
  console.log('Platform Version:', Platform.Version);
  
  try {
    // Test 1: Check if sensor is available
    console.log('Test 1: Checking sensor availability...');
    const { available, biometryType } = await rnBiometrics.isSensorAvailable();
    console.log('Sensor available:', available);
    console.log('Biometry type:', biometryType);
    
    // Test 2: Check if keys exist
    console.log('Test 2: Checking if keys exist...');
    const { keysExist } = await rnBiometrics.biometricKeysExist();
    console.log('Keys exist:', keysExist);
    
    // Test 3: Create keys
    console.log('Test 3: Creating keys...');
    const { publicKey } = await rnBiometrics.createKeys();
    console.log('Public key created:', !!publicKey);
    
    // Test 4: Test simple prompt
    console.log('Test 4: Testing simple prompt...');
    const { success, error } = await rnBiometrics.simplePrompt({
      promptMessage: 'Test biometric authentication',
      cancelButtonText: 'Cancel'
    });
    console.log('Simple prompt success:', success);
    console.log('Simple prompt error:', error);
    
    return {
      available,
      biometryType,
      keysExist,
      publicKey: !!publicKey,
      simplePromptSuccess: success
    };
    
  } catch (error: any) {
    console.error('Biometric test failed:', error);
    return {
      available: false,
      biometryType: 'none',
      keysExist: false,
      publicKey: false,
      simplePromptSuccess: false,
      error: error?.message || 'Unknown error'
    };
  }
};

export default testBiometricAvailability; 