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

const MoreOptionsScreen = ({navigation}: any) => {
  const {isDark, themeMode, setThemeMode} = useTheme();
  const colors = getThemeColors(isDark);
  const {t} = useTranslation();
  const {logout} = useAuth();
  const { menu, loading: menuLoading, error: menuError, refresh } = useMenuSettings();
  const [refreshing, setRefreshing] = useState(false);
  
  // Check if current client is microscan
  const clientConfig = getClientConfig();
  const isMicroscan = clientConfig.clientId === 'microscan';

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
    ];

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
  }, [menu, t]);

  return (
    <SafeAreaView style={[styles.container, {backgroundColor: colors.background}]}>
      <CommonHeader
        navigation={navigation}
        //title={t('more.title')}
      />

      <ScrollView 
        showsVerticalScrollIndicator={false}
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
          {isMicroscan ? (
            // 2-column grid layout for Microscan
            <>
              {(() => {
                const regularItems = dynamicMenuItems.filter(item => !item.isLogout);
                const logoutItem = dynamicMenuItems.find(item => item.isLogout);
                const rows = [];
                
                // Group items into pairs
                for (let i = 0; i < regularItems.length; i += 2) {
                  rows.push(regularItems.slice(i, i + 2));
                }
                
                return (
                  <>
                    {rows.map((row, rowIndex) => (
                      <View key={`row-${rowIndex}`} style={styles.gridRow}>
                        {row.map((item) => (
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
                        {/* Add empty space if row has only one item */}
                        {row.length === 1 && <View style={styles.gridPlaceholder} />}
                      </View>
                    ))}
                    {/* Logout button - full width */}
                    {logoutItem && (
                      <TouchableOpacity
                        style={[
                          styles.menuItem, 
                          {backgroundColor: colors.card, shadowColor: colors.shadow},
                          styles.logoutMenuItem
                        ]}
                        onPress={logoutItem.onPress}>
                        <View style={[
                          styles.menuIcon, 
                          {backgroundColor: colors.accentLight}
                        ]}>
                          <Text style={styles.iconText}>{logoutItem.icon}</Text>
                        </View>
                        <View style={styles.menuContent}>
                          <Text style={[
                            styles.menuTitle, 
                            {color: colors.accent}
                          ]}>{logoutItem.title}</Text>
                          <Text style={[styles.menuSubtitle, {color: colors.textSecondary}]}>{logoutItem.subtitle}</Text>
                        </View>
                        <Text style={[styles.arrowText, {color: colors.textSecondary}]}>›</Text>
                      </TouchableOpacity>
                    )}
                  </>
                );
              })()}
            </>
          ) : (
            // Single column layout for other clients
            <>
              {dynamicMenuItems.map((item) => (
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
            </>
          )}
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
  // Grid layout styles for Microscan
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  gridMenuItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 12,
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
  },
  gridPlaceholder: {
    flex: 1,
    marginHorizontal: 6,
  },
});

export default MoreOptionsScreen; 