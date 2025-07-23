import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Linking,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useTheme} from '../utils/ThemeContext';
import {getThemeColors} from '../utils/themeStyles';
import CommonHeader from '../components/CommonHeader';
import {useTranslation} from 'react-i18next';
import {useAuth} from '../utils/AuthContext';

const MoreOptionsScreen = ({navigation}: any) => {
  const {isDark, themeMode, setThemeMode} = useTheme();
  const colors = getThemeColors(isDark);
  const {t} = useTranslation();
  const {logout} = useAuth();

  const handleLedger = () => {
    navigation.navigate('Ledger');
  };

  const handleSessions = () => {
    navigation.navigate('Sessions');
  };

  const handleKYC = () => {
    navigation.navigate('KYC');
  };

  const handleUpgradePlan = () => {
    Alert.alert('Upgrade Plan', 'Opening plan upgrade options...');
  };

  const handleUsageDetails = () => {
    navigation.navigate('UsageDetails');
  };

  const handleRenewPlan = () => {
    Alert.alert('Renew Plan', 'Opening plan renewal options...');
  };

  const handleSpeedTest = () => {
    navigation.navigate('WebView', {
      url: 'https://www.speedtest.net',
      title: 'Speed Test'
    });
  };

  const handleReferFriend = () => {
    Alert.alert('Refer Friend', 'Opening referral program...');
  };

  const handleThemeSettings = () => {
    Alert.alert(
      'Theme Settings',
      'Choose your preferred theme',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Light',
          onPress: () => setThemeMode('light'),
        },
        {
          text: 'Dark',
          onPress: () => setThemeMode('dark'),
        },
        {
          text: 'System',
          onPress: () => setThemeMode('system'),
        },
      ],
    );
  };

  const handleLogout = async () => {
    Alert.alert(
      t('common.logout'),
      t('alerts.logoutConfirm'),
      [
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
        {
          text: t('common.logout'),
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
              navigation.navigate('Login');
            } catch (error) {
              console.error('Logout error:', error);
              // Even if logout fails, navigate to login
              navigation.navigate('Login');
            }
          },
        },
      ],
    );
  };

  const getThemeDisplayText = () => {
    switch (themeMode) {
      case 'light':
        return t('more.lightTheme');
      case 'dark':
        return t('more.darkTheme');
      case 'system':
        return t('more.systemTheme');
      default:
        return t('more.systemTheme');
    }
  };

  const menuItems = [
    
    
    {
      id: 'renew',
      title: t('home.renewPlan'),
      subtitle: 'Extend your plan',
      icon: '🔄',
      onPress: handleRenewPlan,
    },
    {
      id: 'upgrade',
      title: t('more.upgradePlan'),
      subtitle: 'Change your plan',
      icon: '⬆️',
      onPress: handleUpgradePlan,
    },
    
    {
      id: 'ledger',
      title: t('navigation.ledger'),
      subtitle: 'Transaction history',
      icon: '📊',
      onPress: handleLedger,
    },
    {
      id: 'usage',
      title: t('more.usageDetails'),
      subtitle: 'Detailed statistics',
      icon: '📈',
      onPress: handleUsageDetails,
    },
    {
      id: 'sessions',
      title: t('navigation.sessions'),
      subtitle: 'Session history',
      icon: '📱',
      onPress: handleSessions,
    },
    {
      id: 'kyc',
      title: t('more.kyc'),
      subtitle: 'Identity verification',
      icon: '🆔',
      onPress: handleKYC,
    },
    
    {
      id: 'refer',
      title: t('more.referFriend'),
      subtitle: 'Earn rewards',
      icon: '👥',
      onPress: handleReferFriend,
    },
    {
      id: 'speedtest',
      title: t('more.speedTest'),
      subtitle: 'Test your internet speed',
      icon: '⚡',
      onPress: handleSpeedTest,
    },
    {
      id: 'language',
      title: t('more.language'),
      subtitle: 'Change app language',
      icon: '🌐',
      onPress: () => navigation.navigate('Language'),
    },
    {
      id: 'theme',
      title: t('more.theme'),
      subtitle: getThemeDisplayText(),
      icon: isDark ? '🌙' : '☀️',
      onPress: handleThemeSettings,
    },
    {
      id: 'logout',
      title: t('common.logout'),
      subtitle: 'Sign out of your account',
      icon: '⏏️',
      onPress: handleLogout,
      isLogout: true,
    },
  ];

  return (
    <SafeAreaView style={[styles.container, {backgroundColor: colors.background}]}>
      <CommonHeader
        navigation={navigation}
        //title={t('more.title')}
      />

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.menuItem, 
                {backgroundColor: colors.card, shadowColor: colors.shadow},
                item.isLogout && styles.logoutMenuItem
              ]}
              onPress={item.onPress}>
              <View style={[
                styles.menuIcon, 
                {backgroundColor: item.isLogout ? colors.accentLight : colors.primaryLight}
              ]}>
                <Text style={styles.iconText}>{item.icon}</Text>
              </View>
              <View style={styles.menuContent}>
                <Text style={[
                  styles.menuTitle, 
                  {color: item.isLogout ? colors.accent : colors.text}
                ]}>{item.title}</Text>
                <Text style={[styles.menuSubtitle, {color: colors.textSecondary}]}>{item.subtitle}</Text>
              </View>
              <Text style={[styles.arrowText, {color: colors.textSecondary}]}>›</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
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
  logoutMenuItem: {
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 20,
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
});

export default MoreOptionsScreen; 