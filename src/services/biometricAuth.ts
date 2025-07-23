import ReactNativeBiometrics, { BiometryTypes } from 'react-native-biometrics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, Alert } from 'react-native';

const rnBiometrics = new ReactNativeBiometrics();

export interface BiometricAuthConfig {
  isEnabled: boolean;
  type: 'biometric' | 'pin' | 'pattern' | 'none';
  pin?: string;
  pattern?: string;
}

export class BiometricAuthService {
  private static instance: BiometricAuthService;
  private config: BiometricAuthConfig = {
    isEnabled: false,
    type: 'none'
  };

  private constructor() {}

  static getInstance(): BiometricAuthService {
    if (!BiometricAuthService.instance) {
      BiometricAuthService.instance = new BiometricAuthService();
    }
    return BiometricAuthService.instance;
  }

  async initialize(): Promise<void> {
    try {
      const savedConfig = await AsyncStorage.getItem('biometricAuthConfig');
      if (savedConfig) {
        this.config = JSON.parse(savedConfig);
      }
    } catch (error) {
      console.error('Failed to initialize biometric auth:', error);
    }
  }

  async isBiometricAvailable(): Promise<boolean> {
    try {
      const { available, biometryType } = await rnBiometrics.isSensorAvailable();
      return available;
    } catch (error) {
      console.error('Biometric availability check failed:', error);
      return false;
    }
  }

  async getBiometricType(): Promise<string> {
    try {
      const { biometryType } = await rnBiometrics.isSensorAvailable();
      return biometryType || 'none';
    } catch (error) {
      console.error('Failed to get biometric type:', error);
      return 'none';
    }
  }

  async setupBiometricAuth(): Promise<boolean> {
    try {
      const { available, biometryType } = await rnBiometrics.isSensorAvailable();
      
      if (!available) {
        console.log('Biometric not available on this device');
        return false;
      }

      const { success } = await rnBiometrics.simplePrompt({
        promptMessage: 'Confirm biometric setup',
        cancelButtonText: 'Cancel'
      });

      if (success) {
        this.config.isEnabled = true;
        this.config.type = 'biometric';
        await this.saveConfig();
        return true;
      }

      return false;
    } catch (error) {
      console.error('Biometric setup failed:', error);
      return false;
    }
  }

  async enableBiometricAuth(): Promise<boolean> {
    try {
      const { available, biometryType } = await rnBiometrics.isSensorAvailable();
      
      if (!available) {
        console.log('Biometric not available on this device');
        return false;
      }

      // Enable biometric auth without requiring user confirmation
      this.config.isEnabled = true;
      this.config.type = 'biometric';
      await this.saveConfig();
      console.log('Biometric auth enabled successfully');
      return true;
    } catch (error) {
      console.error('Failed to enable biometric auth:', error);
      return false;
    }
  }

  async setupPinAuth(pin: string): Promise<boolean> {
    try {
      if (pin.length < 4) {
        Alert.alert('Invalid PIN', 'PIN must be at least 4 digits.');
        return false;
      }

      this.config.isEnabled = true;
      this.config.type = 'pin';
      this.config.pin = pin;
      await this.saveConfig();
      return true;
    } catch (error) {
      console.error('PIN setup failed:', error);
      return false;
    }
  }

  async setupPatternAuth(pattern: string): Promise<boolean> {
    try {
      if (pattern.length < 4) {
        Alert.alert('Invalid Pattern', 'Pattern must have at least 4 points.');
        return false;
      }

      this.config.isEnabled = true;
      this.config.type = 'pattern';
      this.config.pattern = pattern;
      await this.saveConfig();
      return true;
    } catch (error) {
      console.error('Pattern setup failed:', error);
      return false;
    }
  }

  async authenticate(): Promise<boolean> {
    try {
      if (!this.config.isEnabled) {
        return true; // No authentication required
      }

      switch (this.config.type) {
        case 'biometric':
          return await this.authenticateBiometric();
        case 'pin':
          return await this.authenticatePin();
        case 'pattern':
          return await this.authenticatePattern();
        default:
          return true;
      }
    } catch (error) {
      console.error('Authentication failed:', error);
      return false;
    }
  }

  private async authenticateBiometric(): Promise<boolean> {
    try {
      const { success } = await rnBiometrics.simplePrompt({
        promptMessage: 'Authenticate to continue',
        cancelButtonText: 'Cancel'
      });
      return success;
    } catch (error) {
      console.error('Biometric authentication failed:', error);
      return false;
    }
  }

  private async authenticatePin(): Promise<boolean> {
    // This would need to be implemented with a custom PIN input UI
    // For now, we'll return true and handle PIN input in the UI
    return new Promise((resolve) => {
      Alert.alert(
        'PIN Authentication',
        'Please enter your PIN',
        [
          {
            text: 'Cancel',
            onPress: () => resolve(false),
            style: 'cancel'
          },
          {
            text: 'OK',
            onPress: () => resolve(true)
          }
        ]
      );
    });
  }

  private async authenticatePattern(): Promise<boolean> {
    // This would need to be implemented with a custom pattern input UI
    // For now, we'll return true and handle pattern input in the UI
    return new Promise((resolve) => {
      Alert.alert(
        'Pattern Authentication',
        'Please draw your pattern',
        [
          {
            text: 'Cancel',
            onPress: () => resolve(false),
            style: 'cancel'
          },
          {
            text: 'OK',
            onPress: () => resolve(true)
          }
        ]
      );
    });
  }

  async disableAuth(): Promise<void> {
    this.config.isEnabled = false;
    this.config.type = 'none';
    this.config.pin = undefined;
    this.config.pattern = undefined;
    await this.saveConfig();
  }

  async getConfig(): Promise<BiometricAuthConfig> {
    return this.config;
  }

  private async saveConfig(): Promise<void> {
    try {
      await AsyncStorage.setItem('biometricAuthConfig', JSON.stringify(this.config));
    } catch (error) {
      console.error('Failed to save biometric config:', error);
    }
  }

  async isAuthEnabled(): Promise<boolean> {
    return this.config.isEnabled;
  }

  async getAuthType(): Promise<string> {
    return this.config.type;
  }
}

export default BiometricAuthService.getInstance(); 