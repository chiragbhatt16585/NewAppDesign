import React, { useMemo, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Linking,
  RefreshControl,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useTheme} from '../utils/ThemeContext';
import {getThemeColors} from '../utils/themeStyles';
import CommonHeader from '../components/CommonHeader';
import {useTranslation} from 'react-i18next';
import {useAuth} from '../utils/AuthContext';
import Feather from 'react-native-vector-icons/Feather';
import {getClientConfig} from '../config/client-config';
import useMenuSettings from '../hooks/useMenuSettings';
import menuService from '../services/menuService';
import { useAuthData } from '../utils/AuthDataContext';

const MoreOptionsScreen = ({navigation}: any) => {
  const {isDark, themeMode, setThemeMode} = useTheme();
  const colors = getThemeColors(isDark);
  const {t} = useTranslation();
  const {logout} = useAuth();
  const { menu, loading: menuLoading, error: menuError, refresh } = useMenuSettings();
  const [refreshing, setRefreshing] = useState(false);
  const { authData } = useAuthData();
  
  // Check if current client is microscan
  const clientConfig = getClientConfig();
  const isMicroscan = clientConfig.clientId === 'microscan';

  // Check if AppSideNavigationMenu contains "First Payment"
  const shouldHideRenewAndUpgrade = useMemo(() => {
    if (!authData?.AppSideNavigationMenu || !Array.isArray(authData.AppSideNavigationMenu)) {
      return false;
    }
    return authData.AppSideNavigationMenu.includes('First Payment');
  }, [authData?.AppSideNavigationMenu]);

  // Removed auto-refresh on focus to avoid unnecessary calls; rely on pull-to-refresh

  const onRefresh = React.useCallback(async () => {
    try {
      setRefreshing(true);
      await menuService.refresh();
      await refresh();
    } finally {
      setRefreshing(false);
    }
  }, [refresh]);

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
              // Reset navigation stack to prevent back navigation
              navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }],
              });
            } catch (error) {
              console.error('Logout error:', error);
              // Even if logout fails, reset navigation stack
              navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }],
              });
            }
          },
        },
      ],
    );
  };



  type DynItem = { id: string; title: string; subtitle: string; icon: string; iconType?: 'feather'; onPress: () => void; isLogout?: boolean };
  const dynamicMenuItems: DynItem[] = useMemo(() => {
    const desiredOrder = [
      'Renew Plan',
      'Upgrade Plan',
      'Ledger',
      'Usage Details',
      'Sessions',
      'KYC',
      'Refer Friend',
      'Update SSID',
      'Speed Test',
      'Partner Apps',
      'Settings',
    ].filter(label => {
      // Hide "Renew Plan" and "Upgrade Plan" if "First Payment" is in AppSideNavigationMenu
      if (shouldHideRenewAndUpgrade && (label === 'Renew Plan' || label === 'Upgrade Plan')) {
        return false;
      }
      return true;
    });

    const iconMap: Record<string, { icon: string; iconType?: 'feather' }> = {
      'Renew Plan': { icon: '🔄' },
      'Upgrade Plan': { icon: '⬆️' },
      'Ledger': { icon: '📊' },
      'Usage Details': { icon: '📈' },
      'Sessions': { icon: 'clock', iconType: 'feather' },
      'KYC': { icon: '🆔' },
      'Refer Friend': { icon: '👥' },
      'Update SSID': { icon: 'wifi', iconType: 'feather' },
      'Speed Test': { icon: '⚡' },
      'Partner Apps': { icon: '📱' },
      'Settings': { icon: '⚙️' },
    };

    const routeMap: Record<string, () => void> = {
      'Renew Plan': handleRenewPlan,
      'Upgrade Plan': handleUpgradePlan,
      'Ledger': handleLedger,
      'Usage Details': handleUsageDetails,
      'Sessions': handleSessions,
      'KYC': handleKYC,
      'Refer Friend': handleReferFriend,
      'Update SSID': handleUpdateSSID,
      'Speed Test': handleSpeedTest,
      'Partner Apps': handlePartnerApps,
      'Settings': handleSettings,
    };

    const subtitleMap: Record<string, string> = {
      'Renew Plan': 'Extend your plan',
      'Upgrade Plan': 'Change your plan',
      'Ledger': 'Transaction history',
      'Usage Details': 'Detailed statistics',
      'Sessions': 'Session history',
      'KYC': 'Identity verification',
      'Refer Friend': 'Earn rewards',
      'Update SSID': 'Configure WiFi settings',
      'Speed Test': 'Test your internet speed',
      'Partner Apps': 'Download Partner Apps',
      'Settings': 'Language, Theme & Security',
    };

    const items = Array.isArray(menu)
      ? menu.filter((m: any) => String(m?.status).toLowerCase() === 'active')
      : [];

    const byLabel = new Map<string, any>();
    items.forEach((m: any) => { if (m?.menu_label) byLabel.set(m.menu_label, m); });

    const built: DynItem[] = desiredOrder
      .filter(label => byLabel.has(label))
      .map(label => ({
        id: label.toLowerCase().replace(/\s+/g, '-'),
        title: label,
        subtitle: subtitleMap[label] || '',
        icon: iconMap[label]?.icon || '•',
        iconType: iconMap[label]?.iconType,
        onPress: routeMap[label],
      }));

    // Append Logout at the end
    built.push({
      id: 'logout',
      title: t('common.logout'),
      subtitle: 'Sign out of your account',
      icon: '⏏️',
      onPress: handleLogout,
      isLogout: true,
    });

    return built;
  }, [menu, t, shouldHideRenewAndUpgrade]);

  return (
    <SafeAreaView style={[styles.container, {backgroundColor: colors.background}]}>
      <CommonHeader
        navigation={navigation}
        //title={t('more.title')}
      />

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 90 }}
        refreshControl={(
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        )}
      >
        <View style={styles.content}>
          {(() => {
            const nonLogoutItems = dynamicMenuItems.filter(item => !item.isLogout);
            const rows: any[] = [];
            for (let i = 0; i < nonLogoutItems.length; i += 2) {
              rows.push(nonLogoutItems.slice(i, i + 2));
            }
            return (
              <>
                {rows.map((row: DynItem[], rowIndex: number) => (
                  <View key={`row-${rowIndex}`} style={styles.gridRow}>
                    {row.map((item: DynItem) => (
                      <TouchableOpacity
                        key={item.id}
                        style={[
                          styles.gridMenuItem, 
                          {backgroundColor: colors.card, shadowColor: colors.shadow}
                        ]}
                        onPress={item.onPress}>
                        <View style={[
                          styles.gridMenuIcon, 
                          {backgroundColor: colors.primaryLight}
                        ]}>
                          {item.iconType === 'feather' ? (
                            <Feather 
                              name={item.icon} 
                              size={18} 
                              color={colors.primary} 
                            />
                          ) : (
                            <Text style={styles.gridIconText}>{item.icon}</Text>
                          )}
                        </View>
                        <Text style={[styles.gridMenuTitle, {color: colors.text}]} numberOfLines={1}>
                          {item.title}
                        </Text>
                      </TouchableOpacity>
                    ))}
                    {row.length === 1 && <View style={styles.gridPlaceholder} />}
                  </View>
                ))}
              </>
            );
          })()}
        </View>
      </ScrollView>
      {/* Bottom Logout Footer */}
      {(() => {
        const logoutItem = dynamicMenuItems.find(item => item.isLogout);
        if (!logoutItem) return null;
        return (
          <View style={[styles.bottomFooter, {backgroundColor: 'transparent'}]}> 
            <TouchableOpacity
              style={[
                styles.logoutButton,
                {
                  backgroundColor: colors.card,
                  shadowColor: colors.shadow,
                  borderColor: colors.primary || '#0E5EF7',
                }
              ]}
              onPress={logoutItem.onPress}
              activeOpacity={0.85}
            >
              <View style={[
                styles.logoutIcon,
                {backgroundColor: colors.primaryLight || '#E5F1FF'}
              ]}> 
                <Text style={styles.gridIconText}>{logoutItem.icon}</Text>
              </View>
              <Text style={[styles.logoutTitle, {color: colors.text}]}> {logoutItem.title}</Text>
            </TouchableOpacity>
          </View>
        );
      })()}
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
    height: 60,
    alignItems: 'center',
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
  // Grid layout styles for Microscan
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  gridMenuItem: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 10,
    height: 60,
    marginHorizontal: 6,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  gridMenuIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  gridIconText: {
    fontSize: 18,
  },
  gridMenuTitle: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
    lineHeight: 16,
    textAlign: 'left',
  },
  gridPlaceholder: {
    width: '48%',
    marginHorizontal: 6,
    height: 60,
  },
  logoutFullWidth: {
    width: '100%',
    marginHorizontal: 0,
  },
  bottomFooter: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  logoutButton: {
    height: 60,
    width: '100%',
    borderRadius: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    borderWidth: 1,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  logoutIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default MoreOptionsScreen; 