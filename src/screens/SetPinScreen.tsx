import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { pinStorage } from '../services/pinStorage';
import { useTheme } from '../utils/ThemeContext';
import { getThemeColors } from '../utils/themeStyles';
import { useTranslation } from 'react-i18next';
import CommonHeader from '../components/CommonHeader';

export default function SetPinScreen({ navigation }: any) {
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState('');
  const [isChangingPin, setIsChangingPin] = useState(false);
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);
  const { t } = useTranslation();

  // Check if PIN already exists
  useEffect(() => {
    const checkExistingPin = async () => {
      const existingPin = await pinStorage.getPin();
      setIsChangingPin(!!existingPin);
    };
    checkExistingPin();
  }, []);

  const handleSetPin = async () => {
    setError('');
    if (pin.length < 4) {
      setError(t('security.pinMinLength'));
      return;
    }
    if (pin !== confirmPin) {
      setError(t('security.pinMismatch'));
      return;
    }
    await pinStorage.savePin(pin);
    Alert.alert(
      isChangingPin ? t('security.pinChangedSuccess') : t('security.pinSetSuccess'),
      isChangingPin ? t('security.pinChangedMessage') : t('security.pinSetMessage'),
      [
        {
          text: 'OK',
          onPress: () => {
            // If changing PIN, go back to SecuritySettingsScreen
            // If first time setup, go to Home screen
            if (isChangingPin) {
              navigation.navigate('SecuritySettingsScreen');
            } else {
              navigation.replace('Home');
            }
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <CommonHeader navigation={navigation} />

      {/* Page Heading */}
      <View style={styles.headingContainer}>
        <Text style={[styles.pageHeading, { color: colors.text }]}>
          {isChangingPin ? t('security.changePin') : t('security.setPin')}
        </Text>
        <Text style={[styles.pageSubheading, { color: colors.textSecondary }]}>
          {isChangingPin ? t('security.pinChangeSubtitle') : t('security.pinSetupSubtitle')}
        </Text>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.card}>
          <TextInput
            value={pin}
            onChangeText={setPin}
            placeholder="Enter PIN"
            keyboardType="number-pad"
            secureTextEntry
            maxLength={6}
            style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
            placeholderTextColor={colors.textSecondary}
          />
          <TextInput
            value={confirmPin}
            onChangeText={setConfirmPin}
            placeholder="Confirm PIN"
            keyboardType="number-pad"
            secureTextEntry
            maxLength={6}
            style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
            placeholderTextColor={colors.textSecondary}
          />
          {error ? <Text style={[styles.error, { color: colors.error }]}>{error}</Text> : null}
          <TouchableOpacity style={[styles.button, { backgroundColor: colors.primary, shadowColor: colors.primary }]} onPress={handleSetPin}>
            <Text style={styles.buttonText}>
              {isChangingPin ? t('security.changePin') : t('security.setPin')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headingContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  pageHeading: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  pageSubheading: {
    fontSize: 16,
    lineHeight: 22,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 20,
  },
  card: {
    width: '100%',
    maxWidth: 350,
    borderRadius: 18,
    padding: 28,
    backgroundColor: '#fff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
    alignItems: 'center',
    alignSelf: 'center',
  },
  input: {
    width: '100%',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 14 : 10,
    fontSize: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e1e4e8',
    color: '#222',
  },
  button: {
    width: '100%',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 10,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  error: {
    color: 'red',
    fontSize: 14,
    marginBottom: 8,
    marginTop: -4,
    alignSelf: 'flex-start',
  },
}); 