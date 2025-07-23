import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useTheme } from '../utils/ThemeContext';
import { getThemeColors } from '../utils/themeStyles';
import biometricAuthService from '../services/biometricAuth';
import { pinStorage } from '../services/pinStorage';
import { useTranslation } from 'react-i18next';

const { width } = Dimensions.get('window');

const AuthSetupScreen = ({ navigation }: any) => {
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [biometricType, setBiometricType] = useState<string>('none');
  const [biometricAvailable, setBiometricAvailable] = useState(false);

  useEffect(() => {
    checkBiometricAvailability();
  }, []);

  const checkBiometricAvailability = async () => {
    try {
      const isAvailable = await biometricAuthService.isBiometricAvailable();
      const type = await biometricAuthService.getBiometricType();
      
      setBiometricAvailable(isAvailable);
      setBiometricType(type);
      
      console.log('Biometric availability check:', { isAvailable, type });
    } catch (error) {
      console.error('Error checking biometric availability:', error);
      setBiometricAvailable(false);
    }
  };

  const handleSetupBiometric = async () => {
    try {
      setIsLoading(true);
      
      const success = await biometricAuthService.setupBiometricAuth();
      
      if (success) {
        Alert.alert(
          'Biometric Setup Complete',
          'You can now use Face ID/Touch ID for quick access to your account.',
          [
            {
              text: 'Continue',
              onPress: () => navigation.navigate('Home')
            }
          ]
        );
      } else {
        // Check if biometric is not available
        const isAvailable = await biometricAuthService.isBiometricAvailable();
        if (!isAvailable) {
          Alert.alert(
            'Biometric Not Available',
            'Biometric authentication is not available on this device. Please set up a PIN instead.',
            [
              {
                text: 'Set Up PIN',
                onPress: () => handleSetupPin()
              },
              {
                text: 'Skip',
                style: 'cancel',
                onPress: () => navigation.navigate('Home')
              }
            ]
          );
        } else {
          Alert.alert(
            'Setup Cancelled',
            'Biometric setup was not completed. You can set it up later in settings.',
            [
              {
                text: 'Continue',
                onPress: () => navigation.navigate('Home')
              }
            ]
          );
        }
      }
    } catch (error) {
      console.error('Biometric setup error:', error);
      Alert.alert(
        'Setup Error',
        'There was an error setting up biometric authentication.',
        [
          {
            text: 'Continue',
            onPress: () => navigation.navigate('Home')
          }
        ]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetupPin = () => {
    navigation.replace('SetPinScreen');
  };

  const handleSkip = () => {
    Alert.alert(
      'Skip Setup',
      'You can set up PIN or biometric authentication later in the app settings.',
      [
        {
          text: 'Continue',
          onPress: () => navigation.navigate('Home')
        }
      ]
    );
  };

  const getBiometricIcon = () => {
    switch (biometricType) {
      case 'FaceID':
        return '👁️';
      case 'TouchID':
        return '👆';
      default:
        return '🔐';
    }
  };

  const getBiometricText = () => {
    switch (biometricType) {
      case 'FaceID':
        return 'Face ID';
      case 'TouchID':
        return 'Touch ID';
      default:
        return 'Biometric';
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text }]}>
            Setting up authentication...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Text style={styles.setupIcon}>🔒</Text>
        </View>
        
        <Text style={[styles.title, { color: colors.text }]}>
          Secure Your Account
        </Text>
        
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Choose how you'd like to quickly access your account
        </Text>

        <View style={styles.optionsContainer}>
          {biometricAvailable && (
            <TouchableOpacity
              style={[styles.optionButton, { backgroundColor: colors.primary }]}
              onPress={handleSetupBiometric}
              activeOpacity={0.8}
            >
              <Text style={styles.optionIcon}>{getBiometricIcon()}</Text>
              <Text style={[styles.optionTitle, { color: '#ffffff' }]}>
                Set up {getBiometricText()}
              </Text>
              <Text style={[styles.optionSubtitle, { color: '#ffffff' }]}>
                Use {getBiometricText()} for quick access
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.optionButton, { 
              backgroundColor: biometricAvailable ? colors.accent : colors.primary,
              marginTop: biometricAvailable ? 16 : 0
            }]}
            onPress={handleSetupPin}
            activeOpacity={0.8}
          >
            <Text style={styles.optionIcon}>🔢</Text>
            <Text style={[styles.optionTitle, { color: '#ffffff' }]}>
              Set up PIN
            </Text>
            <Text style={[styles.optionSubtitle, { color: '#ffffff' }]}>
              Use a 4-digit PIN for quick access
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.skipButton}
          onPress={handleSkip}
        >
          <Text style={[styles.skipButtonText, { color: colors.textSecondary }]}>
            Skip for now
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    width: width * 0.85,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 32,
  },
  setupIcon: {
    fontSize: 80,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 24,
  },
  optionsContainer: {
    width: '100%',
  },
  optionButton: {
    width: '100%',
    paddingVertical: 20,
    paddingHorizontal: 24,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  optionIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  optionSubtitle: {
    fontSize: 14,
    opacity: 0.9,
  },
  skipButton: {
    marginTop: 32,
    paddingVertical: 12,
  },
  skipButtonText: {
    fontSize: 16,
    textDecorationLine: 'underline',
  },
  loadingContainer: {
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
});

export default AuthSetupScreen; 