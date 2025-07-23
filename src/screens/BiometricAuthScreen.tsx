import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Dimensions,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useTheme } from '../utils/ThemeContext';
import { getThemeColors } from '../utils/themeStyles';
import biometricAuthService from '../services/biometricAuth';
import { pinStorage } from '../services/pinStorage';
import { useTranslation } from 'react-i18next';

const { width, height } = Dimensions.get('window');

const BiometricAuthScreen = ({ navigation, onAuthSuccess, onLoginRedirect }: any) => {
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);
  const { t } = useTranslation();
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [biometricType, setBiometricType] = useState<string>('none');
  const [showPinOption, setShowPinOption] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);

  useEffect(() => {
    initializeBiometricAuth();
  }, []);

  const initializeBiometricAuth = async () => {
    try {
      setIsAuthenticating(true);
      
      console.log('=== BIOMETRIC AUTH INITIALIZATION ===');
      
      // Check if biometric is available
      const isAvailable = await biometricAuthService.isBiometricAvailable();
      const type = await biometricAuthService.getBiometricType();
      const isEnabled = await biometricAuthService.isAuthEnabled();
      const pin = await pinStorage.getPin();
      
      console.log('Biometric available:', isAvailable);
      console.log('Biometric type:', type);
      console.log('Biometric enabled:', isEnabled);
      console.log('PIN available:', !!pin);
      
      setBiometricType(type);
      
      if (isAvailable && isEnabled) {
        console.log('✅ Biometric available and enabled, attempting authentication');
        console.log('🔄 This should trigger Face ID/Touch ID prompt...');
        // Try biometric authentication
        await attemptBiometricAuth();
      } else if (pin) {
        console.log('✅ No biometric but PIN available, showing PIN option');
        // No biometric but PIN is available
        setShowPinOption(true);
      } else {
        console.log('❌ No biometric and no PIN, redirecting to login');
        // No biometric and no PIN, redirect to login
        if (onAuthSuccess) {
          onAuthSuccess();
        } else if (navigation) {
          navigation.replace('Login');
        }
      }
    } catch (error) {
      console.error('Biometric initialization failed:', error);
      // Check if PIN is available as fallback
      try {
        const pin = await pinStorage.getPin();
        if (pin) {
          setShowPinOption(true);
        } else {
          // No PIN either, redirect to login
          if (onAuthSuccess) {
            onAuthSuccess();
          } else if (navigation) {
            navigation.replace('Login');
          }
        }
      } catch (pinError) {
        console.error('PIN check failed:', pinError);
        // Redirect to login as last resort
        if (onAuthSuccess) {
          onAuthSuccess();
        } else if (navigation) {
          navigation.replace('Login');
        }
      }
    } finally {
      setIsAuthenticating(false);
    }
  };

  const attemptBiometricAuth = async () => {
    try {
      setIsAuthenticating(true);
      
      console.log('=== ATTEMPTING BIOMETRIC AUTH ===');
      
      const success = await biometricAuthService.authenticate();
      
      console.log('Biometric authentication result:', success);
      
      if (success) {
        console.log('✅ Biometric authentication successful');
        handleAuthSuccess();
      } else {
        console.log('❌ Biometric authentication failed');
        setShowPinOption(true);
      }
    } catch (error) {
      console.error('Biometric authentication error:', error);
      setShowPinOption(true);
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handlePinAuth = async () => {
    try {
      const pin = await pinStorage.getPin();
      if (!pin) {
        Alert.alert(
          'No PIN Set',
          'Please set up a PIN first by logging in normally.',
          [
            {
              text: 'OK',
              onPress: () => {
                // Navigate to login
                if (onAuthSuccess) {
                  onAuthSuccess();
                } else if (navigation) {
                  navigation.replace('Login');
                }
              }
            }
          ]
        );
        return;
      }

      // Show PIN input modal
      setShowPinModal(true);
      setPinInput('');
      setPinError(false);
    } catch (error) {
      console.error('PIN authentication error:', error);
      Alert.alert('Error', 'Failed to access PIN. Please try again.');
    }
  };

  const handlePinSubmit = async () => {
    try {
      setIsAuthenticating(true);
      
      const pin = await pinStorage.getPin();
      if (pinInput === pin) {
        console.log('✅ PIN authentication successful');
        setShowPinModal(false);
        setPinInput('');
        setPinError(false);
        handleAuthSuccess();
      } else {
        console.log('❌ PIN authentication failed');
        setPinError(true);
        setPinInput('');
      }
    } catch (error) {
      console.error('PIN verification error:', error);
      setPinError(true);
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handlePinCancel = () => {
    setShowPinModal(false);
    setPinInput('');
    setPinError(false);
  };

  const handleAuthSuccess = () => {
    if (onAuthSuccess) {
      onAuthSuccess();
    } else if (navigation) {
      navigation.navigate('Home');
    }
  };

  const getBiometricIcon = () => {
    switch (biometricType) {
      case 'FaceID':
        return '👁️';
      case 'TouchID':
        return '👆';
      default:
        return '🔢'; // PIN icon for devices without biometric
    }
  };

  const getBiometricText = () => {
    switch (biometricType) {
      case 'FaceID':
        return 'Face ID';
      case 'TouchID':
        return 'Touch ID';
      default:
        return 'PIN';
    }
  };

  if (isAuthenticating) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text }]}>
            Authenticating...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Text style={styles.biometricIcon}>{getBiometricIcon()}</Text>
        </View>
        
        <Text style={[styles.title, { color: colors.text }]}>
          Welcome Back
        </Text>
        
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {biometricType === 'none' ? 
            'Enter your PIN to access your account' : 
            `Use ${getBiometricText()} to quickly access your account`
          }
        </Text>

        {!showPinOption ? (
          <TouchableOpacity
            style={[styles.authButton, { backgroundColor: colors.primary }]}
            onPress={biometricType === 'none' ? handlePinAuth : attemptBiometricAuth}
            activeOpacity={0.8}
          >
            <Text style={[styles.authButtonText, { color: '#ffffff' }]}>
              {biometricType === 'none' ? 'Enter PIN' : `Use ${getBiometricText()}`}
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.authOptions}>
            {biometricType !== 'none' && (
              <TouchableOpacity
                style={[styles.authButton, { backgroundColor: colors.primary }]}
                onPress={attemptBiometricAuth}
                activeOpacity={0.8}
              >
                <Text style={[styles.authButtonText, { color: '#ffffff' }]}>
                  Try {getBiometricText()} Again
                </Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity
              style={[styles.authButton, { 
                backgroundColor: biometricType === 'none' ? colors.primary : colors.accent, 
                marginTop: biometricType !== 'none' ? 12 : 0 
              }]}
              onPress={handlePinAuth}
              activeOpacity={0.8}
            >
              <Text style={[styles.authButtonText, { color: '#ffffff' }]}>
                {biometricType === 'none' ? 'Enter PIN' : 'Use PIN Instead'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity
          style={styles.skipButton}
          onPress={() => {
            // Navigate to login screen properly
            if (onLoginRedirect) {
              onLoginRedirect();
            } else if (navigation) {
              navigation.replace('Login');
            } else {
              // Fallback if no navigation prop
              console.log('No navigation available, calling onAuthSuccess as fallback');
              if (onAuthSuccess) {
                onAuthSuccess();
              }
            }
          }}
        >
          <Text style={[styles.skipButtonText, { color: colors.textSecondary }]}>
            Login with Username & Password
          </Text>
        </TouchableOpacity>

        {/* Debug button for testing */}
        {/* <TouchableOpacity
          style={[styles.debugButton, { marginTop: 20 }]}
          onPress={attemptBiometricAuth}
        >
          <Text style={[styles.debugButtonText, { color: colors.textSecondary }]}>
            🔧 Debug: Force Biometric
          </Text>
        </TouchableOpacity> */}

        {/* Test app resume simulation */}
        <TouchableOpacity
          style={[styles.debugButton, { marginTop: 10 }]}
          onPress={() => {
            // Simulate app going to background and coming back
            console.log('Simulating app resume...');
            setTimeout(() => {
              attemptBiometricAuth();
            }, 1000);
          }}
        >
          <Text style={[styles.debugButtonText, { color: colors.textSecondary }]}>
            🔄 Debug: Simulate App Resume
          </Text>
        </TouchableOpacity>

        {/* Reset auth state for testing */}
        <TouchableOpacity
          style={[styles.debugButton, { marginTop: 10 }]}
          onPress={() => {
            console.log('Resetting auth state for testing...');
            // This will allow biometric to trigger again
            handleAuthSuccess();
          }}
        >
          <Text style={[styles.debugButtonText, { color: colors.textSecondary }]}>
            🔄 Debug: Reset Auth State
          </Text>
        </TouchableOpacity>
      </View>

      {/* PIN Input Modal */}
      <Modal
        visible={showPinModal}
        transparent={true}
        animationType="fade"
        onRequestClose={handlePinCancel}
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalContainer}
          >
            <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Enter PIN
              </Text>
              
              <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
                Please enter your PIN to continue
              </Text>

              <TextInput
                style={[
                  styles.pinInput,
                  { 
                    backgroundColor: colors.surface,
                    color: colors.text,
                    borderColor: pinError ? '#ff4444' : colors.border
                  }
                ]}
                value={pinInput}
                onChangeText={(text) => {
                  setPinInput(text);
                  setPinError(false);
                }}
                placeholder="Enter PIN"
                placeholderTextColor={colors.textSecondary}
                secureTextEntry={true}
                keyboardType="numeric"
                maxLength={6}
                autoFocus={true}
                onSubmitEditing={handlePinSubmit}
              />

              {pinError && (
                <Text style={styles.errorText}>
                  Incorrect PIN. Please try again.
                </Text>
              )}

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={handlePinCancel}
                >
                  <Text style={[styles.modalButtonText, { color: colors.textSecondary }]}>
                    Cancel
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.modalButton,
                    styles.submitButton,
                    { backgroundColor: colors.primary },
                    isAuthenticating && styles.disabledButton
                  ]}
                  onPress={handlePinSubmit}
                  disabled={isAuthenticating}
                >
                  {isAuthenticating ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <Text style={[styles.modalButtonText, { color: '#ffffff' }]}>
                      Continue
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
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
    width: width * 0.8,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 32,
  },
  biometricIcon: {
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
  authButton: {
    width: '100%',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  authButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  authOptions: {
    width: '100%',
  },
  skipButton: {
    marginTop: 24,
    paddingVertical: 12,
  },
  skipButtonText: {
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  loadingContainer: {
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  debugButton: {
    paddingVertical: 8,
  },
  debugButtonText: {
    fontSize: 12,
    textDecorationLine: 'underline',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: width * 0.85,
    padding: 24,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
  },
  pinInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  errorText: {
    color: '#ff4444',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: 'transparent',
  },
  submitButton: {
    // backgroundColor will be set dynamically
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.6,
  },
});

export default BiometricAuthScreen; 