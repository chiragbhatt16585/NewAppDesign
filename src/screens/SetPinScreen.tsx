import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet, Platform } from 'react-native';
import { pinStorage } from '../services/pinStorage';
import { useTheme } from '../utils/ThemeContext';
import { getThemeColors } from '../utils/themeStyles';

export default function SetPinScreen({ navigation }: any) {
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState('');
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);

  const handleSetPin = async () => {
    setError('');
    if (pin.length < 4) {
      setError('PIN must be at least 4 digits');
      return;
    }
    if (pin !== confirmPin) {
      setError('PINs do not match');
      return;
    }
    await pinStorage.savePin(pin);
    Alert.alert('PIN set successfully!');
    navigation.replace('Home');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}> 
      <View style={styles.card}>
        <Text style={[styles.title, { color: colors.primary }]}>Set Your PIN</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>For quick and secure access</Text>
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
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <TouchableOpacity style={[styles.button, { backgroundColor: colors.primary, shadowColor: colors.primary }]} onPress={handleSetPin}>
          <Text style={styles.buttonText}>Set PIN</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
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
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    marginBottom: 18,
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