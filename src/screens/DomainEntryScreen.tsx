import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../utils/ThemeContext';
import { getThemeColors } from '../utils/themeStyles';
import { setCustomApi } from '../config/customApiStorage';
import LogoImage from '../components/LogoImage';
import Feather from 'react-native-vector-icons/Feather';

function normalizeDomain(input: string): string {
  let d = input.trim();
  if (d.toLowerCase().startsWith('https://')) d = d.slice(8).trim();
  if (d.toLowerCase().startsWith('http://')) d = d.slice(7).trim();
  const slash = d.indexOf('/');
  if (slash >= 0) d = d.slice(0, slash);
  return d.trim();
}

const DomainEntryScreen = ({ navigation }: any) => {
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);
  const [protocol, setProtocol] = useState<'https://' | 'http://'>('https://');
  const [domain, setDomain] = useState('');
  const [error, setError] = useState('');

  const handleContinue = () => {
    const d = normalizeDomain(domain);
    if (!d) {
      setError('Please enter a domain name');
      return;
    }
    setError('');
    setCustomApi(protocol, d);
    navigation.replace('Login');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
      >
        <View style={styles.content}>
          <View style={styles.logoSection}>
            <LogoImage type="login" />
          </View>
          <Text style={[styles.title, { color: colors.text }]}>Server setup</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Enter your API server domain. This will be used to connect to your ISP backend.
          </Text>

          <Text style={[styles.label, { color: colors.text }]}>Protocol</Text>
          <View style={styles.protocolRow}>
            <TouchableOpacity
              style={[
                styles.protocolButton,
                { borderColor: colors.border, backgroundColor: protocol === 'https://' ? colors.primary : colors.surface },
              ]}
              onPress={() => setProtocol('https://')}
              activeOpacity={0.7}
            >
              <Feather name="lock" size={20} color={protocol === 'https://' ? '#fff' : colors.primary} />
              <Text style={[styles.protocolText, { color: protocol === 'https://' ? '#fff' : colors.text }]}>
                Secure (HTTPS)
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.protocolButton,
                { borderColor: colors.border, backgroundColor: protocol === 'http://' ? colors.primary : colors.surface },
              ]}
              onPress={() => setProtocol('http://')}
              activeOpacity={0.7}
            >
              <Feather name="unlock" size={20} color={protocol === 'http://' ? '#fff' : colors.textSecondary} />
              <Text style={[styles.protocolText, { color: protocol === 'http://' ? '#fff' : colors.text }]}>
                Insecure (HTTP)
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.label, { color: colors.text }]}>Domain name</Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.surface,
                borderColor: error ? '#c62828' : colors.border,
                color: colors.text,
              },
            ]}
            placeholder="spacecom.l2s.biz"
            placeholderTextColor={colors.textSecondary}
            value={domain}
            onChangeText={(t) => { setDomain(t); setError(''); }}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            returnKeyType="done"
            onSubmitEditing={handleContinue}
          />
          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TouchableOpacity
            style={[styles.continueButton, { backgroundColor: colors.primary }]}
            onPress={handleContinue}
            activeOpacity={0.8}
          >
            <Text style={styles.continueButtonText}>Continue</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 28,
    lineHeight: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  protocolRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  protocolButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  protocolText: {
    fontSize: 14,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    marginBottom: 8,
  },
  errorText: {
    color: '#c62828',
    fontSize: 13,
    marginBottom: 12,
  },
  continueButton: {
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 16,
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default DomainEntryScreen;
