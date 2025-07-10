import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  Dimensions,
} from 'react-native';
import { useTheme } from '../utils/ThemeContext';
import { getThemeColors } from '../utils/themeStyles';

const { width } = Dimensions.get('window');

interface PinInputProps {
  visible: boolean;
  onSuccess: (pin: string) => void;
  onCancel: () => void;
  title?: string;
  isSetup?: boolean;
  confirmPin?: string;
}

const PinInput: React.FC<PinInputProps> = ({
  visible,
  onSuccess,
  onCancel,
  title = 'Enter PIN',
  isSetup = false,
  confirmPin = '',
}) => {
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);
  
  const [pin, setPin] = useState('');
  const [confirmPinValue, setConfirmPinValue] = useState('');
  const [isConfirming, setIsConfirming] = useState(false);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (visible) {
      setPin('');
      setConfirmPinValue('');
      setIsConfirming(false);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [visible]);

  const handlePinChange = (text: string) => {
    const numericText = text.replace(/[^0-9]/g, '');
    if (numericText.length <= 6) {
      if (isSetup && !isConfirming) {
        setPin(numericText);
        if (numericText.length === 6) {
          setIsConfirming(true);
          setConfirmPinValue('');
        }
      } else if (isSetup && isConfirming) {
        setConfirmPinValue(numericText);
        if (numericText.length === 6) {
          if (numericText === pin) {
            onSuccess(pin);
          } else {
            Alert.alert('PIN Mismatch', 'PINs do not match. Please try again.');
            setPin('');
            setConfirmPinValue('');
            setIsConfirming(false);
          }
        }
      } else {
        setPin(numericText);
        if (numericText.length === 6) {
          if (confirmPin && numericText === confirmPin) {
            onSuccess(numericText);
          } else if (!confirmPin) {
            onSuccess(numericText);
          } else {
            Alert.alert('Incorrect PIN', 'Please try again.');
            setPin('');
          }
        }
      }
    }
  };

  const handleKeyPress = (key: string) => {
    const currentPin = isConfirming ? confirmPinValue : pin;
    if (key === 'delete') {
      if (isConfirming) {
        setConfirmPinValue(confirmPinValue.slice(0, -1));
      } else {
        setPin(pin.slice(0, -1));
      }
    } else if (key === 'cancel') {
      onCancel();
    } else {
      const newPin = currentPin + key;
      if (newPin.length <= 6) {
        if (isConfirming) {
          setConfirmPinValue(newPin);
          if (newPin.length === 6) {
            if (newPin === pin) {
              onSuccess(pin);
            } else {
              Alert.alert('PIN Mismatch', 'PINs do not match. Please try again.');
              setPin('');
              setConfirmPinValue('');
              setIsConfirming(false);
            }
          }
        } else {
          setPin(newPin);
          if (newPin.length === 6 && isSetup) {
            setIsConfirming(true);
            setConfirmPinValue('');
          } else if (newPin.length === 6 && !isSetup) {
            if (confirmPin && newPin === confirmPin) {
              onSuccess(newPin);
            } else if (!confirmPin) {
              onSuccess(newPin);
            } else {
              Alert.alert('Incorrect PIN', 'Please try again.');
              setPin('');
            }
          }
        }
      }
    }
  };

  const renderPinDots = () => {
    const currentPin = isConfirming ? confirmPinValue : pin;
    const maxLength = 6;
    
    return (
      <View style={styles.pinDotsContainer}>
        {Array.from({ length: maxLength }).map((_, index) => (
          <View
            key={index}
            style={[
              styles.pinDot,
              {
                backgroundColor: index < currentPin.length ? colors.primary : colors.border,
                borderColor: colors.border,
              },
            ]}
          />
        ))}
      </View>
    );
  };

  const renderKeypad = () => {
    const keys = [
      ['1', '2', '3'],
      ['4', '5', '6'],
      ['7', '8', '9'],
      ['cancel', '0', 'delete'],
    ];

    return (
      <View style={styles.keypadContainer}>
        {keys.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.keypadRow}>
            {row.map((key) => (
              <TouchableOpacity
                key={key}
                style={[
                  styles.keypadButton,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                  key === 'delete' && styles.deleteButton,
                  key === 'cancel' && styles.cancelButton,
                ]}
                onPress={() => handleKeyPress(key)}>
                <Text
                  style={[
                    styles.keypadButtonText,
                    { color: colors.text },
                    key === 'delete' && styles.deleteButtonText,
                    key === 'cancel' && styles.cancelButtonText,
                  ]}>
                  {key === 'delete' ? '⌫' : key === 'cancel' ? '✕' : key}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </View>
    );
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}>
      <View style={[styles.container, { backgroundColor: 'rgba(0, 0, 0, 0.5)' }]}>
        <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
          <Text style={[styles.title, { color: colors.text }]}>
            {isSetup && !isConfirming ? 'Set PIN' : isSetup && isConfirming ? 'Confirm PIN' : title}
          </Text>
          
          {renderPinDots()}
          
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {isSetup && !isConfirming
              ? 'Enter a 6-digit PIN'
              : isSetup && isConfirming
              ? 'Confirm your PIN'
              : 'Enter your PIN'}
          </Text>

          {renderKeypad()}

          <TouchableOpacity
            style={[styles.cancelButton, { borderColor: colors.primary }]}
            onPress={onCancel}>
            <Text style={[styles.cancelButtonText, { color: colors.primary }]}>
              Cancel
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: width * 0.9,
    maxWidth: 400,
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 30,
    textAlign: 'center',
  },
  pinDotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
    gap: 15,
  },
  pinDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
  },
  keypadContainer: {
    width: '100%',
    marginBottom: 20,
  },
  keypadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  keypadButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  keypadButtonText: {
    fontSize: 24,
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: '#ff6b6b',
  },
  deleteButtonText: {
    color: '#ffffff',
  },
  cancelButton: {
    backgroundColor: '#6c757d',
  },
  cancelButtonText: {
    color: '#ffffff',
  },
});

export default PinInput; 