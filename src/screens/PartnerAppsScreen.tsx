import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
  ActivityIndicator,
  Image,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useTheme} from '../utils/ThemeContext';
import {getThemeColors} from '../utils/themeStyles';
import CommonHeader from '../components/CommonHeader';
import {useTranslation} from 'react-i18next';
import useMenuSettings from '../hooks/useMenuSettings';

interface PartnerApp {
  id: string;
  name: string;
  description: string;
  icon: string;
  logoUrl?: string;
  color: string;
  androidUrl: string;
  iosUrl?: string;
  category: 'ott' | 'entertainment' | 'news' | 'gaming';
  rating: number;
  downloads: string;
  size: string;
}

const PartnerAppsScreen = ({navigation}: any) => {
  const {isDark} = useTheme();
  const colors = getThemeColors(isDark);
  const {t} = useTranslation();
  const { menu, loading: menuLoading } = useMenuSettings();
  
  const [isLoading, setIsLoading] = useState(false);
  const [apps, setApps] = useState<PartnerApp[]>([]);

  useEffect(() => {
    fetchPartnerApps();
  }, [menuLoading, menu]);

  const fetchPartnerApps = async () => {
    try {
      setIsLoading(true);

      if (Array.isArray(menu)) {
        //console.log('[PartnerApps] Menu loaded, entries:', menu.length);
        const partnerEntry = menu.find((m: any) => (
          String(m?.menu_label).trim().toLowerCase() === 'partner apps'
        )) || menu.find((m: any) => (
          String(m?.menu_label).trim().toLowerCase() === 'partnerapps'
        )) || menu.find((m: any) => {
          try {
            const jsonVal = m?.display_option_json;
            const parsed = typeof jsonVal === 'string' ? JSON.parse(jsonVal) : (jsonVal || {});
            return Array.isArray(parsed?.partner_apps);
          } catch { return false; }
        });

        if (partnerEntry) {
          ///console.log('[PartnerApps] Found Partner Apps menu entry:', {
          //  menu_label: partnerEntry?.menu_label,
          //  status: partnerEntry?.status,
          //  display_option_json_preview: typeof partnerEntry?.display_option_json === 'string'
          //    ? String(partnerEntry.display_option_json).slice(0, 160) + '...'
          //    : partnerEntry?.display_option_json,
          //});
          const jsonVal = partnerEntry.display_option_json;
          try {
            let parsed: any = {};
            if (typeof jsonVal === 'string') {
              const trimmed = jsonVal.trim();
              if (trimmed && (trimmed.startsWith('{') || trimmed.startsWith('['))) {
                parsed = JSON.parse(trimmed);
              } else {
                //console.warn('[PartnerApps] display_option_json is empty or not JSON string');
                parsed = {};
              }
            } else if (jsonVal && typeof jsonVal === 'object') {
              parsed = jsonVal;
            } else {
              parsed = {};
            }
            //console.log('[PartnerApps] Parsed display_option_json:', parsed);
            const list = Array.isArray(parsed?.partner_apps) ? parsed.partner_apps : [];
            const mapped: PartnerApp[] = list.map((p: any, idx: number) => ({
              id: String(idx + 1),
              name: p?.name || 'App',
              description: p?.description || '',
              icon: '📱',
              logoUrl: p?.logo_url || p?.logoUrl,
              color: '#808080',
              androidUrl: p?.android_url || p?.androidUrl || '',
              iosUrl: p?.ios_url || p?.iosUrl || '',
              category: 'ott',
              rating: 0,
              downloads: '',
              size: '',
            }));
            setApps(mapped);
            //console.log('[PartnerApps] Apps mapped, count:', mapped.length);
            setIsLoading(false);
            return;
          } catch (e) {
            //console.warn('[PartnerApps] Failed to parse display_option_json:', e);
          }
        }
      }

      // Fallback: no menu data found
      setApps([]);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to fetch partner apps');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadApp = async (app: PartnerApp, platform: 'android' | 'ios') => {
    const url = platform === 'android' ? app.androidUrl : app.iosUrl;
    
    if (!url) {
      Alert.alert('Not Available', `${app.name} is not available on ${platform === 'android' ? 'Android' : 'iOS'}`);
      return;
    }

    try {
      await Linking.openURL(url);
    } catch (error) {
      Alert.alert('Error', 'Could not open download link');
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'ott':
        return '#FF6B6B';
      case 'entertainment':
        return '#4ECDC4';
      case 'news':
        return '#96CEB4';
      case 'gaming':
        return '#FFEAA7';
      default:
        return colors.primary;
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, {backgroundColor: colors.background}]}> 
        <CommonHeader navigation={navigation} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, {color: colors.text}]}>Loading partner apps...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, {backgroundColor: colors.background}]}> 
      <CommonHeader navigation={navigation} />
      
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Header Section */}
          <View style={[styles.headerCard, {backgroundColor: colors.card}]}> 
            <View style={styles.headerContent}>
              <Text style={[styles.headerTitle, {color: colors.text}]}>Partner Apps</Text>
              <Text style={[styles.headerSubtitle, {color: colors.textSecondary}]}> 
                Download apps from our trusted partners
              </Text>
            </View>
            <View style={[styles.headerIcon, {backgroundColor: colors.primaryLight}]}> 
              <Text style={styles.iconText}>📱</Text>
            </View>
          </View>

          {/* Apps Section */}
          <View style={styles.appsSection}>
            <Text style={[styles.sectionTitle, {color: colors.text}]}>Available Apps</Text>
            <Text style={[styles.sectionSubtitle, {color: colors.textSecondary}]}> 
              Tap to download from your preferred platform
            </Text>
          </View>

          {/* Apps List */}
          {apps.length === 0 && (
            <View style={[styles.appCard, {backgroundColor: colors.card}]}> 
              <Text style={[styles.appDescription, {color: colors.textSecondary}]}>No partner apps available.</Text>
            </View>
          )}
          {apps.map((app) => (
            <View key={app.id} style={[styles.appCard, {backgroundColor: colors.card}]}> 
              <View style={styles.appHeader}>
                {app.logoUrl ? (
                  <View style={[styles.appIcon, {backgroundColor: '#1a1a1a'}]}> 
                    <Image 
                      source={{uri: app.logoUrl}} 
                      style={styles.appLogo}
                      resizeMode="contain"
                      onError={() => {
                        //console.log('Logo failed to load for:', app.name);
                      }}
                    />
                  </View>
                ) : (
                  <View style={[styles.appIcon, {backgroundColor: app.color + '20'}]}> 
                    <Text style={styles.iconText}>{app.icon}</Text>
                  </View>
                )}
                <View style={styles.appInfo}>
                  <Text style={[styles.appName, {color: colors.text}]}>{app.name}</Text>
                  <Text style={[styles.appDescription, {color: colors.textSecondary}]}> 
                    {app.description}
                  </Text>
                </View>
              </View>

              <View style={styles.downloadSection}>
                <Text style={[styles.downloadTitle, {color: colors.textSecondary}]}>Download:</Text>
                <View style={styles.downloadButtons}>
                  <TouchableOpacity
                    style={[styles.downloadButton, {backgroundColor: colors.surface, borderColor: colors.border}]}
                    onPress={() => handleDownloadApp(app, 'android')}
                  >
                    <View style={styles.buttonContent}>
                      <Text style={styles.platformIcon}>📱</Text>
                      <Text style={[styles.downloadButtonText, {color: colors.text}]}>Android</Text>
                    </View>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.downloadButton, {backgroundColor: colors.surface, borderColor: colors.border}]}
                    onPress={() => handleDownloadApp(app, 'ios')}
                  >
                    <View style={styles.buttonContent}>
                      <Text style={styles.platformIcon}>📱</Text>
                      <Text style={[styles.downloadButtonText, {color: colors.text}]}>iOS</Text>
                    </View>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}

          {/* Info Section */}
          <View style={[styles.infoCard, {backgroundColor: colors.card}]}> 
            <Text style={[styles.infoTitle, {color: colors.text}]}>About Partner Apps</Text>
            <Text style={[styles.infoText, {color: colors.textSecondary}]}> 
              These apps are carefully selected by our team to provide you with the best entertainment, news, and utility experiences. All apps are verified and safe to download.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  headerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
  },
  headerIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconText: {
    fontSize: 24,
  },
  appLogo: {
    width: 40,
    height: 40,
  },
  appsSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
  },
  appCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  appHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  appIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  appInfo: {
    flex: 1,
  },
  appName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  appDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  appMeta: {
    flexDirection: 'row',
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  downloadSection: {
    gap: 8,
  },
  downloadTitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  downloadButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  downloadButton: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderWidth: 1,
  },
  downloadButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  platformIcon: {
    fontSize: 16,
  },
  infoCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
  },
});

export default PartnerAppsScreen; 