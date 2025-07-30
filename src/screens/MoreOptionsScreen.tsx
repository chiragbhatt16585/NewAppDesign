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
import Feather from 'react-native-vector-icons/Feather';
import {getClientConfig} from '../config/client-config';

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
    navigation.navigate('UpgradePlan');
  };

  const handleUsageDetails = () => {
    navigation.navigate('UsageDetails');
  };

  const handleRenewPlan = () => {
    navigation.navigate('RenewPlan');
  };

  const handleSpeedTest = () => {
    navigation.navigate('WebView', {
      url: 'https://www.speedtest.net',
      title: 'Speed Test'
    });
  };

  const handleReferFriend = () => {
    navigation.navigate('ReferFriend');
  };

  const handleSettings = () => {
    navigation.navigate('Settings');
  };

  const handleAIDemo = () => {
    navigation.navigate('AIDemo');
  };

  const handleUpdateSSID = () => {
    navigation.navigate('UpdateSSID');
  };

  const handleOffers = () => {
    navigation.navigate('Offers');
  };

  const handlePartnerApps = () => {
    navigation.navigate('PartnerApps');
  };

  const handleReviewRatings = async () => {
    try {
      const clientConfig = getClientConfig();
      const reviewUrl = clientConfig.reviewUrl;
      
      if (reviewUrl) {
        const supported = await Linking.canOpenURL(reviewUrl);
        if (supported) {
          await Linking.openURL(reviewUrl);
        } else {
          Alert.alert('Error', 'Unable to open review page');
        }
      } else {
        Alert.alert('Error', 'Review URL not configured for this client');
      }
    } catch (error) {
      console.error('Error opening review page:', error);
      Alert.alert('Error', 'Failed to open review page');
    }
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
      icon: 'clock',
      iconType: 'feather',
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
      id: 'update-ssid',
      title: 'Update SSID',
      subtitle: 'Configure WiFi settings',
      icon: 'wifi',
      iconType: 'feather',
      onPress: handleUpdateSSID,
    },
    {
      id: 'speedtest',
      title: t('more.speedTest'),
      subtitle: 'Test your internet speed',
      icon: '⚡',
      onPress: handleSpeedTest,
    },
    {
      id: 'partner-apps',
      title: 'Partner Apps',
      subtitle: 'Download Partner Apps',
      icon: '📱',
      onPress: handlePartnerApps,
    },
    {
      id: 'review-ratings',
      title: 'Review & Ratings',
      subtitle: 'Rate us on Google Play',
      icon: 'star',
      iconType: 'feather',
      onPress: handleReviewRatings,
    },
    {
      id: 'settings',
      title: 'Settings',
      subtitle: 'Language, Theme & Security',
      icon: '⚙️',
      onPress: handleSettings,
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
                {item.iconType === 'feather' ? (
                  <Feather 
                    name={item.icon} 
                    size={24} 
                    color={item.isLogout ? colors.accent : colors.primary} 
                  />
                ) : (
                  <Text style={styles.iconText}>{item.icon}</Text>
                )}
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