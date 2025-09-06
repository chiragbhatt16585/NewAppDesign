import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../utils/ThemeContext';
import { getThemeColors } from '../utils/themeStyles';
import CommonHeader from '../components/CommonHeader';
import { useTranslation } from 'react-i18next';
import biometricAuthService from '../services/biometricAuth';
import { pinStorage } from '../services/pinStorage';
import DeviceInfo from 'react-native-device-info';
import versionCheckService from '../services/versionCheck';

const SettingsScreen = ({ navigation }: any) => {
  const { isDark, themeMode, setThemeMode } = useTheme();
  const colors = getThemeColors(isDark);
  const { t, i18n } = useTranslation();
  const [pinStatus, setPinStatus] = useState<string>('Not Set');
  const [biometricStatus, setBiometricStatus] = useState<string>('Not Available');
  const [biometricType, setBiometricType] = useState<string>('');
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [appVersion, setAppVersion] = useState<string>('1.0.0');
  const [isChecking, setIsChecking] = useState<boolean>(false);

  useEffect(() => {
    loadSecurityStatus();
    loadAppVersion();
  }, []);

  const loadSecurityStatus = async () => {
    try {
      // Check PIN status
      const pin = await pinStorage.getPin();
      setPinStatus(pin ? 'Set' : 'Not Set');

      // Check biometric status
      const isBiometricAvailable = await biometricAuthService.isBiometricAvailable();
      if (isBiometricAvailable) {
        const isEnabled = await biometricAuthService.isAuthEnabled();
        const type = await biometricAuthService.getBiometricType();
        setBiometricType(type);
        setBiometricStatus(isEnabled ? 'Enabled' : 'Available');
      } else {
        setBiometricStatus('Not Available');
      }
    } catch (error) {
      console.error('Error loading security status:', error);
    }
  };

  const loadAppVersion = async () => {
    try {
      const version = await DeviceInfo.getVersion();
      setAppVersion(version);
    } catch (error) {
      console.error('Error loading app version:', error);
    }
  };

  const handleLanguageChange = () => {
    setShowLanguageModal(true);
  };

  const handleLanguageSelect = (languageCode: string, languageName: string, flag: string) => {
    i18n.changeLanguage(languageCode);
    setShowLanguageModal(false);
    Alert.alert(t('settings.languageChanged'), `${t('settings.switchedTo')} ${languageName} ${flag}`);
  };

  const handleThemeSettings = () => {
    Alert.alert(
      t('settings.themeSettings'),
      t('settings.themeSettingsSubtitle'),
      [
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
        {
          text: t('settings.lightTheme'),
          onPress: () => setThemeMode('light'),
        },
        {
          text: t('settings.darkTheme'),
          onPress: () => setThemeMode('dark'),
        },
        {
          text: t('settings.systemTheme'),
          onPress: () => setThemeMode('system'),
        },
      ],
    );
  };

  const handleSecuritySettings = () => {
    navigation.navigate('SecuritySettingsScreen');
  };

  const handleCheckForUpdates = async () => {
    try {
      setIsChecking(true);
      const versionInfo = await versionCheckService.checkForUpdates();
      
      if (versionInfo && versionInfo.needsUpdate) {
        // Show update dialog using Alert
        Alert.alert(
          'Update Required',
          `A new version (${versionInfo.latestVersion}) is available. Please update to continue using the app.`,
          [
            {
              text: 'Update Now',
              onPress: () => versionCheckService.openStore(versionInfo.updateUrl),
            },
          ],
          { cancelable: false }
        );
      } else {
        Alert.alert('No Updates', 'You are using the latest version of the app.');
      }
    } catch (error) {
      console.error('Error checking for updates:', error);
      Alert.alert('Error', 'Failed to check for updates. Please try again.');
    } finally {
      setIsChecking(false);
    }
  };

  const getThemeDisplayText = () => {
    switch (themeMode) {
      case 'light':
        return t('settings.lightTheme');
      case 'dark':
        return t('settings.darkTheme');
      case 'system':
        return t('settings.systemTheme');
      default:
        return t('settings.systemTheme');
    }
  };

  const getLanguageDisplayText = () => {
    const currentLanguage = i18n.language;
    switch (currentLanguage) {
      case 'en':
        return 'English 🇺🇸';
      case 'hi':
        return 'हिंदी 🇮🇳';
      case 'gu':
        return 'ગુજરાતી 🇮🇳';
      case 'mr':
        return 'मराठी 🇮🇳';
      default:
        return 'English 🇺🇸';
    }
  };

  const getStatusColor = (status: string) => {
    if (status === 'Set' || status === 'Enabled') return '#4CAF50';
    if (status === 'Available') return '#FF9800';
    return '#F44336';
  };

  const getStatusIcon = (status: string) => {
    if (status === 'Set' || status === 'Enabled') return '✓';
    if (status === 'Available') return '!';
    return '✗';
  };

  const settingsSections = [
    {
      title: t('settings.appearance'),
      items: [
        {
          id: 'language',
          title: t('settings.language'),
          subtitle: getLanguageDisplayText(),
          icon: '🌐',
          onPress: handleLanguageChange,
        },
        {
          id: 'theme',
          title: t('settings.theme'),
          subtitle: getThemeDisplayText(),
          icon: isDark ? '🌙' : '☀️',
          onPress: handleThemeSettings,
        },
      ],
    },
    {
      title: t('settings.security'),
      items: [
        {
          id: 'security',
          title: t('settings.securitySettings'),
          subtitle: t('settings.securitySettingsSubtitle'),
          icon: '🔒',
          onPress: handleSecuritySettings,
        },
      ],
    },
    {
      title: t('settings.support'),
      items: [
        {
          id: 'faq',
          title: t('settings.faq'),
          subtitle: t('settings.faqSubtitle'),
          icon: '❓',
          onPress: () => navigation.navigate('FAQScreen'),
        },
        {
          id: 'terms',
          title: t('settings.terms'),
          subtitle: t('settings.termsSubtitle'),
          icon: '📋',
          onPress: () => navigation.navigate('TermsScreen'),
        },
        {
          id: 'about',
          title: t('settings.about'),
          subtitle: t('settings.aboutSubtitle'),
          icon: '🏢',
          onPress: () => navigation.navigate('AboutScreen'),
        },
        {
          id: 'version',
          title: t('settings.version'),
          subtitle: appVersion,
          icon: '📱',
          onPress: () => {}, // No action needed for version
        },
        {
          id: 'checkUpdates',
          title: t('settings.checkUpdates'),
          subtitle: isChecking ? t('settings.checkingUpdates') : t('settings.checkUpdatesSubtitle'),
          icon: '🔄',
          onPress: handleCheckForUpdates,
        },
      ],
    },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <CommonHeader navigation={navigation}  />

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {settingsSections.map((section, sectionIndex) => (
            <View key={sectionIndex} style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                {section.title}
              </Text>
              
              {section.items.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.menuItem,
                    { backgroundColor: colors.card, shadowColor: colors.shadow }
                  ]}
                  onPress={item.onPress}>
                  <View style={[
                    styles.menuIcon,
                    { backgroundColor: colors.primaryLight }
                  ]}>
                    <Text style={styles.iconText}>{item.icon}</Text>
                  </View>
                  
                  <View style={styles.menuContent}>
                    <Text style={[styles.menuTitle, { color: colors.text }]}>
                      {item.title}
                    </Text>
                    <Text style={[styles.menuSubtitle, { color: colors.textSecondary }]}>
                      {item.subtitle}
                    </Text>
                  </View>
                  
                  <Text style={[styles.arrowText, { color: colors.textSecondary }]}>›</Text>
                </TouchableOpacity>
              ))}
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Modern Language Selection Modal */}
      <Modal
        visible={showLanguageModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLanguageModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {t('settings.selectLanguage')}
              </Text>
              <TouchableOpacity
                onPress={() => setShowLanguageModal(false)}
                style={styles.closeButton}
              >
                <Text style={[styles.closeButtonText, { color: colors.textSecondary }]}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
              {t('settings.selectLanguageSubtitle')}
            </Text>

            <View style={styles.languageList}>
              {[
                { code: 'en', name: 'English', flag: '🇺🇸', nativeName: 'English' },
                { code: 'hi', name: 'Hindi', flag: '🇮🇳', nativeName: 'हिंदी' },
                { code: 'gu', name: 'Gujarati', flag: '🇮🇳', nativeName: 'ગુજરાતી' },
                { code: 'mr', name: 'Marathi', flag: '🇮🇳', nativeName: 'मराठी' },
              ].map((language) => (
                <TouchableOpacity
                  key={language.code}
                  style={[
                    styles.languageItem,
                    { 
                      backgroundColor: i18n.language === language.code ? colors.primary : colors.surface,
                      borderColor: colors.border
                    }
                  ]}
                  onPress={() => handleLanguageSelect(language.code, language.name, language.flag)}
                >
                  <View style={styles.languageInfo}>
                    <Text style={styles.languageFlag}>{language.flag}</Text>
                    <View style={styles.languageText}>
                      <Text style={[
                        styles.languageName,
                        { color: i18n.language === language.code ? '#ffffff' : colors.text }
                      ]}>
                        {language.nativeName}
                      </Text>
                      <Text style={[
                        styles.languageNameEn,
                        { color: i18n.language === language.code ? '#ffffff' : colors.textSecondary }
                      ]}>
                        {language.name}
                      </Text>
                    </View>
                  </View>
                  {i18n.language === language.code && (
                    <Text style={styles.selectedIcon}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  menuIcon: {
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
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  menuSubtitle: {
    fontSize: 14,
  },
  arrowText: {
    fontSize: 18,
  },
  statusContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusIcon: {
    fontSize: 16,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: Dimensions.get('window').width * 0.85,
    maxWidth: 400,
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalSubtitle: {
    fontSize: 14,
    marginBottom: 24,
  },
  languageList: {
    gap: 12,
  },
  languageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  languageInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  languageFlag: {
    fontSize: 24,
    marginRight: 16,
  },
  languageText: {
    flex: 1,
  },
  languageName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  languageNameEn: {
    fontSize: 14,
  },
  selectedIcon: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
});

export default SettingsScreen; 