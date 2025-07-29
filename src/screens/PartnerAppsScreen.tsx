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
  
  const [isLoading, setIsLoading] = useState(false);
  const [apps, setApps] = useState<PartnerApp[]>([]);

  useEffect(() => {
    fetchPartnerApps();
  }, []);

  const fetchPartnerApps = async () => {
    setIsLoading(true);
    try {
      // Mock data - replace with real API call later
      const mockApps: PartnerApp[] = [
        {
          id: '1',
          name: 'OTTplay',
          description: 'Smart recommendation engine that handpicks movies and shows from 100,000+ titles across multiple OTT platforms. Find what to watch, where to watch, and when to watch.',
          icon: '📺',
          logoUrl: 'https://images.ottplay.com/static/newImages/OTTplayWhiteLogo.svg',
          color: '#808080',
          androidUrl: 'https://play.google.com/store/apps/details?id=com.ht.ottplay&hl=en_IN',
          iosUrl: 'https://apps.apple.com/app/ottplay/id123456789',
          category: 'ott',
          rating: 3.7,
          downloads: '50L+',
          size: '45 MB',
        },
        {
          id: '2',
          name: 'PlayBox TV',
          description: 'Premium entertainment platform with exclusive movies, web series, and original content. High-quality streaming experience with live TV channels.',
          icon: '📺',
          logoUrl: 'https://www.playboxtv.in/images/playbox-logo.png',
          color: '#4ECDC4',
          androidUrl: 'https://play.google.com/store/apps/details?id=playboxtv.mobile.app.in&hl=en_IN',
          iosUrl: 'https://apps.apple.com/in/app/playboxtv/id1622405621',
          category: 'entertainment',
          rating: 4.3,
          downloads: '5M+',
          size: '38 MB',
        },
        {
          id: '3',
          name: 'YuppTV',
          description: 'Live TV streaming with 500+ channels including TV9 Telugu, Republic Bharat, NDTV 24x7, and regional content. Watch news, sports, and entertainment live.',
          icon: '📡',
          logoUrl: 'https://www.yupptv.com/fast-tv',
          color: '#45B7D1',
          androidUrl: 'https://play.google.com/store/apps/details?id=com.yupptv',
          iosUrl: 'https://apps.apple.com/app/yupptv/id456789123',
          category: 'ott',
          rating: 4.2,
          downloads: '8M+',
          size: '52 MB',
        },
        // {
        //   id: '4',
        //   name: 'NewsHub',
        //   description: 'Stay updated with latest news from around the world. Personalized news feed with breaking news alerts.',
        //   icon: '📰',
        //   color: '#96CEB4',
        //   androidUrl: 'https://play.google.com/store/apps/details?id=com.newshub',
        //   iosUrl: 'https://apps.apple.com/app/newshub/id789123456',
        //   category: 'news',
        //   rating: 4.1,
        //   downloads: '3M+',
        //   size: '28 MB',
        // },
        // {
        //   id: '5',
        //   name: 'GameZone',
        //   description: 'Collection of casual and arcade games. Play fun games and compete with friends.',
        //   icon: '🎮',
        //   color: '#FFEAA7',
        //   androidUrl: 'https://play.google.com/store/apps/details?id=com.gamezone',
        //   iosUrl: 'https://apps.apple.com/app/gamezone/id321654987',
        //   category: 'gaming',
        //   rating: 4.4,
        //   downloads: '15M+',
        //   size: '65 MB',
        // },
        // {
        //   id: '6',
        //   name: 'MusicFlow',
        //   description: 'Stream millions of songs, create playlists, and discover new music. High-quality audio streaming experience.',
        //   icon: '🎵',
        //   color: '#DDA0DD',
        //   androidUrl: 'https://play.google.com/store/apps/details?id=com.musicflow',
        //   iosUrl: 'https://apps.apple.com/app/musicflow/id654321987',
        //   category: 'entertainment',
        //   rating: 4.6,
        //   downloads: '20M+',
        //   size: '42 MB',
        // },
      ];

      setApps(mockApps);
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
                          // Fallback to emoji if image fails to load
                          console.log('Logo failed to load for:', app.name);
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
                  <View style={styles.appMeta}>
                    <View style={styles.metaItem}>
                      <Text style={[styles.metaLabel, {color: colors.textSecondary}]}>⭐ {app.rating}</Text>
                    </View>
                    <View style={styles.metaItem}>
                      <Text style={[styles.metaLabel, {color: colors.textSecondary}]}>📥 {app.downloads}</Text>
                    </View>
                    <View style={styles.metaItem}>
                      <Text style={[styles.metaLabel, {color: colors.textSecondary}]}>📱 {app.size}</Text>
                    </View>
                  </View>
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