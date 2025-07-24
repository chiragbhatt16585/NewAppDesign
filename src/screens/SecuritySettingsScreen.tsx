import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { pinStorage } from '../services/pinStorage';
import { BiometricAuthService } from '../services/biometricAuth';
import { useTheme } from '../utils/ThemeContext';
import { getThemeColors } from '../utils/themeStyles';
import CommonHeader from '../components/CommonHeader';
import { useTranslation } from 'react-i18next';

export default function SecuritySettingsScreen({ navigation }: any) {
  const [pinStatus, setPinStatus] = useState<string>('Not Set');
  const [biometricStatus, setBiometricStatus] = useState<string>('Not Available');
  const [biometricType, setBiometricType] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);
  const biometricAuthService = BiometricAuthService.getInstance();
  const { t } = useTranslation();

  useEffect(() => {
    loadSecurityStatus();
  }, []);

  const loadSecurityStatus = async () => {
    try {
      setIsLoading(true);
      
      // Check PIN status
      const pin = await pinStorage.getPin();
      setPinStatus(pin ? t('security.status.set') : t('security.status.notSet'));

      // Check biometric status
      const isBiometricAvailable = await biometricAuthService.isBiometricAvailable();
      if (isBiometricAvailable) {
        const isEnabled = await biometricAuthService.isAuthEnabled();
        const type = await biometricAuthService.getBiometricType();
        setBiometricType(type);
        setBiometricStatus(isEnabled ? t('security.status.enabled') : t('security.status.available'));
      } else {
        setBiometricStatus(t('security.status.notAvailable'));
      }
    } catch (error) {
      console.error('Error loading security status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePinSettings = async () => {
    try {
      const pin = await pinStorage.getPin();
      
      let message = '';
      let options: any[] = [];

      if (pin) {
        message = t('security.pinCurrentlySetup');
        options = [
          {
            text: t('security.changePin'),
            onPress: () => navigation.navigate('SetPinScreen')
          },
          {
            text: t('security.removePin'),
            style: 'destructive' as const,
            onPress: async () => {
              Alert.alert(
                t('security.removePin'),
                t('security.pinRemoveConfirm'),
                [
                  {
                    text: t('common.cancel'),
                    style: 'cancel'
                  },
                  {
                    text: t('security.removePin'),
                    style: 'destructive',
                    onPress: async () => {
                      await pinStorage.clearPin();
                      Alert.alert(t('common.success'), t('security.pinRemovedSuccess'));
                      loadSecurityStatus(); // Refresh status
                    }
                  }
                ]
              );
            }
          },
          {
            text: t('common.cancel'),
            style: 'cancel' as const
          }
        ];
      } else {
        message = t('security.noPinSetup');
        options = [
          {
            text: t('security.setPin'),
            onPress: () => navigation.navigate('SetPinScreen')
          },
          {
            text: t('common.cancel'),
            style: 'cancel' as const
          }
        ];
      }

      Alert.alert(t('security.pinSettings'), message, options);
    } catch (error) {
      console.error('Error handling PIN settings:', error);
      Alert.alert('Error', 'Failed to access PIN settings.');
    }
  };

  const handleBiometricSettings = async () => {
    try {
      const isBiometricAvailable = await biometricAuthService.isBiometricAvailable();
      const isBiometricEnabled = await biometricAuthService.isAuthEnabled();
      const type = await biometricAuthService.getBiometricType();

      let message = '';
      let options: any[] = [];

      if (isBiometricAvailable) {
        if (isBiometricEnabled) {
          message = t('security.biometricCurrentlyEnabled');
          options = [
            {
              text: t('security.disableBiometric'),
              style: 'destructive' as const,
              onPress: async () => {
                await biometricAuthService.disableAuth();
                Alert.alert(t('common.success'), t('security.biometricDisabledSuccess'));
                loadSecurityStatus(); // Refresh status
              }
            },
            {
              text: t('security.testBiometric'),
              onPress: async () => {
                const success = await biometricAuthService.authenticate();
                Alert.alert(
                  success ? t('common.success') : t('common.error'),
                  success ? t('security.biometricTestSuccess') : t('security.biometricTestFailed')
                );
              }
            },
            {
              text: t('common.cancel'),
              style: 'cancel' as const
            }
          ];
        } else {
          message = t('security.biometricAvailableNotEnabled');
          options = [
            {
              text: t('security.setupBiometric'),
              onPress: async () => {
                const success = await biometricAuthService.setupBiometricAuth();
                if (success) {
                  Alert.alert(t('common.success'), t('security.biometricSetupSuccess'));
                  loadSecurityStatus(); // Refresh status
                } else {
                  const isAvailable = await biometricAuthService.isBiometricAvailable();
                  if (!isAvailable) {
                    Alert.alert(t('security.biometricNotAvailable'), t('security.biometricNotAvailable'));
                  } else {
                    Alert.alert(t('security.biometricSetupCancelled'), t('security.biometricSetupCancelled'));
                  }
                }
              }
            },
            {
              text: t('common.cancel'),
              style: 'cancel' as const
            }
          ];
        }
      } else {
        message = t('security.biometricNotAvailable');
        options = [
          {
            text: t('common.ok'),
            style: 'cancel' as const
          }
        ];
      }

      Alert.alert(t('security.biometricSettings'), message, options);
    } catch (error) {
      console.error('Error handling biometric settings:', error);
      Alert.alert('Error', 'Failed to access biometric settings.');
    }
  };

  const getStatusColor = (status: string) => {
    if (status === t('security.status.set') || status === t('security.status.enabled')) {
      return '#4CAF50'; // Green
    } else if (status === t('security.status.available')) {
      return '#FF9800'; // Orange
    } else if (status === t('security.status.notSet') || status === t('security.status.notAvailable')) {
      return '#F44336'; // Red
    }
    return colors.textSecondary;
  };

  const getStatusIcon = (status: string) => {
    if (status === t('security.status.set') || status === t('security.status.enabled')) {
      return '✅';
    } else if (status === t('security.status.available')) {
      return '⚠️';
    } else if (status === t('security.status.notSet') || status === t('security.status.notAvailable')) {
      return '❌';
    }
    return '❓';
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <CommonHeader navigation={navigation} />
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: colors.text }]}>{t('common.loading')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <CommonHeader navigation={navigation} />

      {/* Page Heading */}
      <View style={styles.headingContainer}>
        <Text style={[styles.pageHeading, { color: colors.text }]}>{t('security.title')}</Text>
        <Text style={[styles.pageSubheading, { color: colors.textSecondary }]}>
          {t('security.subtitle')}
        </Text>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {t('security.authenticationMethods')}
          </Text>

          {/* PIN Settings */}
          <TouchableOpacity
            style={[styles.optionCard, { backgroundColor: colors.card, shadowColor: colors.shadow }]}
            onPress={handlePinSettings}
            activeOpacity={0.8}
          >
            <View style={styles.optionHeader}>
              <View style={[styles.optionIcon, { backgroundColor: colors.primaryLight }]}>
                <Text style={styles.iconText}>🔢</Text>
              </View>
              <View style={styles.optionContent}>
                <Text style={[styles.optionTitle, { color: colors.text }]}>{t('security.pinAuthentication')}</Text>
                <Text style={[styles.optionSubtitle, { color: colors.textSecondary }]}>
                  {t('security.pinSubtitle')}
                </Text>
              </View>
              <View style={styles.statusContainer}>
                <Text style={styles.statusIcon}>{getStatusIcon(pinStatus)}</Text>
                <Text style={[styles.statusText, { color: getStatusColor(pinStatus) }]}>
                  {pinStatus}
                </Text>
              </View>
            </View>
          </TouchableOpacity>

          {/* Biometric Settings */}
          <TouchableOpacity
            style={[styles.optionCard, { backgroundColor: colors.card, shadowColor: colors.shadow }]}
            onPress={handleBiometricSettings}
            activeOpacity={0.8}
          >
            <View style={styles.optionHeader}>
              <View style={[styles.optionIcon, { backgroundColor: colors.primaryLight }]}>
                <Text style={styles.iconText}>🔐</Text>
              </View>
              <View style={styles.optionContent}>
                <Text style={[styles.optionTitle, { color: colors.text }]}>
                  {biometricType || t('security.biometricAuthentication')}
                </Text>
                <Text style={[styles.optionSubtitle, { color: colors.textSecondary }]}>
                  {t('security.biometricSubtitle')}
                </Text>
              </View>
              <View style={styles.statusContainer}>
                <Text style={styles.statusIcon}>{getStatusIcon(biometricStatus)}</Text>
                <Text style={[styles.statusText, { color: getStatusColor(biometricStatus) }]}>
                  {biometricStatus}
                </Text>
              </View>
            </View>
          </TouchableOpacity>

          {/* Security Info */}
          <View style={[styles.infoCard, { backgroundColor: colors.card, shadowColor: colors.shadow }]}>
            <Text style={[styles.infoTitle, { color: colors.text }]}>🔒 {t('security.securityInfo')}</Text>
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
              {t('security.securityInfoText')}
            </Text>
          </View>
        </ScrollView>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 16,
    marginBottom: 24,
    lineHeight: 22,
  },
  optionCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  optionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  iconText: {
    fontSize: 24,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  optionSubtitle: {
    fontSize: 14,
    lineHeight: 18,
  },
  statusContainer: {
    alignItems: 'center',
  },
  statusIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  infoCard: {
    borderRadius: 16,
    padding: 20,
    marginTop: 8,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
  },
}); 