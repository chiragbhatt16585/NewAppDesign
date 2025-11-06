import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  FlatList,
  Dimensions,
  Alert,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useTheme} from '../utils/ThemeContext';
import {getThemeColors} from '../utils/themeStyles';
import CommonHeader from '../components/CommonHeader';
import {useTranslation} from 'react-i18next';
import {apiService} from '../services/api';
import {useAuth} from '../utils/AuthContext';
import sessionManager from '../services/sessionManager';
import {useFocusEffect} from '@react-navigation/native';
import {useSessionValidation} from '../utils/useSessionValidation';
import {useScreenDataReload} from '../utils/useAutoDataReload';

const {width: screenWidth} = Dimensions.get('window');

// Session interface to match the API response
interface Session {
  index: number;
  ipAddress: string;
  loginTime: string;
  loginDate: string;
  loginTs: string;
  logoutTs: string;
  sessionTime: string;
  download: string;
  upload: string;
  total_upload_download: string;
}

interface SessionData {
  id: string;
  date: string;
  totalDuration: string;
  totalUpload: string;
  totalDownload: string;
  sessionTime: string;
  downloadsGB: string;
  uploadsGB: string;
  totalDataGB: string;
  ipAddress: string;
  loginTime: string; // Now contains full timestamp with date and time
  logoutTime: string; // Now contains full timestamp with date and time
}

  // Helper function to convert API session to UI session data
  const convertApiSessionToUIData = (apiSession: Session): SessionData => {
    // Format date to be more user-friendly
    const formatDate = (dateStr: string) => {
      if (!dateStr || dateStr === '') return '';
      
      // Convert "10-Jul,25" to "10 Jul 2025"
      const parts = dateStr.split('-');
      if (parts.length === 2) {
        const day = parts[0];
        const monthYear = parts[1].split(',');
        if (monthYear.length === 2) {
          const month = monthYear[0];
          const year = monthYear[1];
          return `${day} ${month} 20${year}`;
        }
      }
      return dateStr;
    };
    
    // Format duration to be more readable
    const formatDuration = (duration: string) => {
      if (!duration || duration === '0:0:0') return '0h 0m 0s';
      
      const parts = duration.split(':');
      if (parts.length === 3) {
        const hours = parseInt(parts[0]) || 0;
        const minutes = parseInt(parts[1]) || 0;
        const seconds = parseInt(parts[2]) || 0;
        return `${hours}h ${minutes}m ${seconds}s`;
      }
      return duration;
    };
    
    // Format timestamp to show date and time
    const formatTimestamp = (timestamp: string) => {
      if (!timestamp || timestamp === '') return '';
      
      // If timestamp contains space, it likely has both date and time
      if (timestamp.includes(' ')) {
        return timestamp; // Return as is if it's already formatted
      }
      
      // Try to parse and format the timestamp
      try {
        const date = new Date(timestamp);
        if (!isNaN(date.getTime())) {
          return date.toLocaleString(); // This will show both date and time
        }
      } catch (e) {
        // If parsing fails, return as is
      }
      
      return timestamp;
    };
    
    const convertedData = {
      id: apiSession.index.toString(),
      date: formatDate(apiSession.loginDate),
      totalDuration: formatDuration(apiSession.sessionTime),
      totalUpload: apiSession.upload,
      totalDownload: apiSession.download,
      sessionTime: apiSession.sessionTime,
      downloadsGB: apiSession.download,
      uploadsGB: apiSession.upload,
      totalDataGB: apiSession.total_upload_download,
      ipAddress: apiSession.ipAddress,
      loginTime: formatTimestamp(apiSession.loginTs),
      logoutTime: formatTimestamp(apiSession.logoutTs),
    };
    
    return convertedData;
  };

const SessionsScreen = ({navigation}: any) => {
  const {isDark} = useTheme();
  const colors = getThemeColors(isDark);
  const {t} = useTranslation();
  const {userData} = useAuth();
  const {checkSessionAndHandle} = useSessionValidation();
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [sessionsData, setSessionsData] = useState<SessionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch sessions data function
  const fetchSessions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Check session validity before making API call
      const isSessionValid = await checkSessionAndHandle(navigation);
      if (!isSessionValid) {
        // Don't return immediately, let the API call handle token regeneration
        console.log('Session validation failed, but continuing with API call');
      }

      // Get fresh user data from session
      const currentSession = await sessionManager.getCurrentSession();
      if (!currentSession || !currentSession.username) {
        throw new Error('No valid user session found');
      }

      const username = currentSession.username;
      // Get current client configuration
      const {getClientConfig} = require('../config/client-config');
      const clientConfig = getClientConfig();
      const realm = clientConfig.clientId;
      const accountStatus = 'active';
      
      console.log('=== FETCHING SESSIONS FOR CURRENT USER ===');
      console.log('Current username:', username);
      console.log('Realm:', realm);
      console.log('User data from context:', userData);
      
      const apiSessions = await apiService.lastTenSessions(username, accountStatus, realm);
      console.log('Sessions received:', apiSessions.length);
      console.log('=== RAW API SESSIONS DATA ===');
      apiSessions.forEach((session: Session, index: number) => {
        console.log(`Session ${index + 1}:`, JSON.stringify(session, null, 2));
      });
      console.log('=== END RAW API DATA ===');
      
      const convertedSessions = apiSessions.map(convertApiSessionToUIData);
      
      // Filter out empty sessions
      const validSessions = convertedSessions.filter((session: SessionData) => 
        session.totalDuration !== "0h 0m" && session.date !== ""
      );
      
      console.log('Valid sessions:', validSessions.length);
      setSessionsData(validSessions);
      
    } catch (err: any) {
      console.error('Error fetching sessions:', err);
      setError(err.message || 'Failed to fetch sessions');
      Alert.alert('Error', err.message || 'Failed to fetch sessions');
    } finally {
      setLoading(false);
    }
  };

  const {reloadOnFocus} = useScreenDataReload({
    onReloadStart: () => console.log('Auto reload starting in SessionsScreen...'),
    onReloadSuccess: (data) => {
      console.log('Auto reload successful in SessionsScreen, refreshing data');
      fetchSessions();
    },
    onReloadError: (error) => console.log('Auto reload failed in SessionsScreen:', error)
  });

    // Fetch sessions data
  useEffect(() => {
    // Fetch sessions immediately when component mounts
    fetchSessions();
    
    // Also fetch when userData changes (in case of login/logout)
    if (userData?.username) {
      fetchSessions();
    }
  }, [userData?.username]);

  // Auto reload data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      reloadOnFocus();
    }, [reloadOnFocus])
  );

  // Loading state
  if (loading) {
    return (
      <SafeAreaView style={[styles.container, {backgroundColor: colors.background}]}>
        <CommonHeader navigation={navigation} />
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, {color: colors.textSecondary}]}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (error) {
    return (
      <SafeAreaView style={[styles.container, {backgroundColor: colors.background}]}>
        <CommonHeader navigation={navigation} />
        <View style={styles.headingContainer}>
          <Text style={[styles.pageHeading, {color: colors.text}]}>{t('sessions.title')}</Text>
          <Text style={[styles.pageSubheading, {color: colors.textSecondary}]}>
            {t('sessions.subtitle')}
          </Text>
        </View>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorIcon, {color: colors.textSecondary}]}>⚠️</Text>
          <Text style={[styles.errorTitle, {color: colors.text}]}>Error</Text>
          <Text style={[styles.errorSubtitle, {color: colors.textSecondary}]}>{error}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const toggleExpanded = (id: string) => {
    setExpandedIds(prev => {
      const isOpen = prev.has(id);
      if (isOpen) {
        return new Set(); // close if already open
      }
      // open only this id and close others
      return new Set([id]);
    });
  };

  const renderSessionItem = ({item}: {item: SessionData}) => {
    return (
      <TouchableOpacity
        style={[styles.sessionCard, {backgroundColor: colors.card, shadowColor: colors.shadow}]}
        onPress={() => toggleExpanded(item.id)}>
        <View style={styles.sessionHeader}>
          <Text style={[styles.sessionDate, {color: colors.text}]}>{item.date}</Text>
          <View style={[styles.durationBadge, {backgroundColor: colors.primary + '20'}]}>
            <Text style={[styles.durationText, {color: colors.primary}]}>{item.totalDuration}</Text>
          </View>
        </View>

        {expandedIds.has(item.id) && (
          <View style={styles.sessionDetails}>
            <View style={styles.collapsedStatsRow}>
              <View style={styles.collapsedStatItem}>
                <View style={[styles.collapsedIconContainer, {backgroundColor: colors.accent + '15'}]}>
                  <Text style={[styles.collapsedIcon, {color: colors.accent}]}>↑</Text>
                </View>
                <Text style={[styles.collapsedValue, {color: colors.text}]}>{item.totalUpload}</Text>
              </View>

              <View style={styles.collapsedStatItem}>
                <View style={[styles.collapsedIconContainer, {backgroundColor: colors.success + '15'}]}>
                  <Text style={[styles.collapsedIcon, {color: colors.success}]}>↓</Text>
                </View>
                <Text style={[styles.collapsedValue, {color: colors.text}]}>{item.totalDownload}</Text>
              </View>

              <View style={styles.collapsedStatItem}>
                <View style={[styles.collapsedIconContainer, {backgroundColor: colors.primary + '15'}]}>
                  <Text style={[styles.collapsedIcon, {color: colors.primary}]}>⇅</Text>
                </View>
                <Text style={[styles.collapsedValue, {color: colors.text}]}>{item.totalDataGB}</Text>
            </View>
            </View>

            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, {color: colors.textSecondary}]}>{t('sessions.ipAddress')}</Text>
              <Text style={[styles.detailValue, {color: colors.text}]}>{item.ipAddress}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, {color: colors.textSecondary}]}>{t('sessions.loginTime')}</Text>
              <Text style={[styles.detailValue, {color: colors.text}]}>{item.loginTime}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, {color: colors.textSecondary}]}>{t('sessions.logoutTime')}</Text>
              <Text style={[styles.detailValue, {color: colors.text}]}>{item.logoutTime}</Text>
            </View>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderHeader = () => (
    <View style={[styles.headerCard, {backgroundColor: colors.card, shadowColor: colors.shadow}]}>
      <Text style={[styles.headerTitle, {color: colors.text}]}>{t('sessions.sessionHistory')}</Text>
      <Text style={[styles.headerSubtitle, {color: colors.textSecondary}]}>
        {t('sessions.sessionHistorySubtitle')}
      </Text>
    </View>
  );

  // Calculate dynamic summary from actual session data
  const calculateSummary = () => {
    const validSessions = sessionsData.filter(session => 
      session.totalDuration !== "0h 0m" && session.date !== ""
    );
    
    const totalSessions = validSessions.length;
    
    // Calculate total duration using sessionTime (original format)
    let totalHours = 0;
    let totalMinutes = 0;
    let totalSeconds = 0;
    
    validSessions.forEach(session => {
      // Use sessionTime which has the original "105:40:8" format
      const timeParts = session.sessionTime.split(':');
      if (timeParts.length === 3) {
        totalHours += parseInt(timeParts[0]) || 0;
        totalMinutes += parseInt(timeParts[1]) || 0;
        totalSeconds += parseInt(timeParts[2]) || 0;
      }
    });
    
    // Convert to proper format
    totalMinutes += Math.floor(totalSeconds / 60);
    totalSeconds = totalSeconds % 60;
    totalHours += Math.floor(totalMinutes / 60);
    totalMinutes = totalMinutes % 60;
    
    const totalDuration = `${totalHours}h ${totalMinutes}m`;
    
    // Calculate total data usage with better format handling
    let totalUpload = 0;
    let totalDownload = 0;
    
    console.log('=== UPLOAD/DOWNLOAD DEBUG ===');
    validSessions.forEach((session, index) => {
      console.log(`Session ${index + 1}:`);
      console.log('  Upload:', session.totalUpload);
      console.log('  Download:', session.totalDownload);
      
      // Handle upload - try different formats
      let uploadValue = 0;
      if (session.totalUpload.includes('GB')) {
        const match = session.totalUpload.match(/(\d+\.?\d*)/);
        if (match) uploadValue = parseFloat(match[1]);
      } else if (session.totalUpload.includes('MB')) {
        const match = session.totalUpload.match(/(\d+\.?\d*)/);
        if (match) uploadValue = parseFloat(match[1]) / 1024; // Convert MB to GB
      } else if (session.totalUpload.includes('KB')) {
        const match = session.totalUpload.match(/(\d+\.?\d*)/);
        if (match) uploadValue = parseFloat(match[1]) / (1024 * 1024); // Convert KB to GB
      } else {
        // Try to parse as plain number (assume MB)
        const match = session.totalUpload.match(/(\d+\.?\d*)/);
        if (match) uploadValue = parseFloat(match[1]) / 1024;
      }
      totalUpload += uploadValue;
      
      // Handle download - try different formats
      let downloadValue = 0;
      if (session.totalDownload.includes('GB')) {
        const match = session.totalDownload.match(/(\d+\.?\d*)/);
        if (match) downloadValue = parseFloat(match[1]);
      } else if (session.totalDownload.includes('MB')) {
        const match = session.totalDownload.match(/(\d+\.?\d*)/);
        if (match) downloadValue = parseFloat(match[1]) / 1024; // Convert MB to GB
      } else if (session.totalDownload.includes('KB')) {
        const match = session.totalDownload.match(/(\d+\.?\d*)/);
        if (match) downloadValue = parseFloat(match[1]) / (1024 * 1024); // Convert KB to GB
      } else {
        // Try to parse as plain number (assume MB)
        const match = session.totalDownload.match(/(\d+\.?\d*)/);
        if (match) downloadValue = parseFloat(match[1]) / 1024;
      }
      totalDownload += downloadValue;
    });
    
    console.log('=== SUMMARY DEBUG ===');
    console.log('Valid sessions:', validSessions.length);
    console.log('Session times:', validSessions.map(s => s.sessionTime));
    console.log('Calculated duration:', totalDuration);
    console.log('Total hours:', totalHours, 'Total minutes:', totalMinutes);
    console.log('Total upload (GB):', totalUpload);
    console.log('Total download (GB):', totalDownload);
    
    return {
      totalSessions,
      totalDuration,
      totalUpload: `${totalUpload.toFixed(2)} GB`,
      totalDownload: `${totalDownload.toFixed(2)} GB`
    };
  };

  const renderSummary = () => {
    const summary = calculateSummary();
    
    return (
      <View style={[styles.summaryCard, {backgroundColor: colors.card, shadowColor: colors.shadow}]}>
        <Text style={[styles.summaryTitle, {color: colors.text}]}>{t('sessions.monthlySummary')}</Text>
        
        <View style={styles.summaryGrid}>
          <View style={styles.summaryItem}>
            <View style={[styles.summaryIconContainer, {backgroundColor: colors.primary + '15'}]}>
              <Text style={[styles.summaryIcon, {color: colors.primary}]}>📊</Text>
            </View>
            <Text style={[styles.summaryLabel, {color: colors.textSecondary}]}>
              {t('sessions.totalSessions')}
            </Text>
            <Text style={[styles.summaryValue, {color: colors.text}]}>{summary.totalSessions}</Text>
          </View>
          
          <View style={styles.summaryItem}>
            <View style={[styles.summaryIconContainer, {backgroundColor: colors.accent + '15'}]}>
              <Text style={[styles.summaryIcon, {color: colors.accent}]}>⏱️</Text>
            </View>
            <Text style={[styles.summaryLabel, {color: colors.textSecondary}]}>
              {t('sessions.totalDuration')}
            </Text>
            <Text style={[styles.summaryValue, {color: colors.text}]}>{summary.totalDuration}</Text>
          </View>
          
          <View style={styles.summaryItem}>
            <View style={[styles.summaryIconContainer, {backgroundColor: colors.primary + '15'}]}>
              <Text style={[styles.summaryIcon, {color: colors.primary}]}>↑</Text>
            </View>
            <Text style={[styles.summaryLabel, {color: colors.textSecondary}]}>
              {t('sessions.totalUpload')}
            </Text>
            <Text style={[styles.summaryValue, {color: colors.accent}]}>{summary.totalUpload}</Text>
          </View>
          
          <View style={styles.summaryItem}>
            <View style={[styles.summaryIconContainer, {backgroundColor: colors.success + '15'}]}>
              <Text style={[styles.summaryIcon, {color: colors.success}]}>↓</Text>
            </View>
            <Text style={[styles.summaryLabel, {color: colors.textSecondary}]}>
              {t('sessions.totalDownload')}
            </Text>
            <Text style={[styles.summaryValue, {color: colors.success}]}>{summary.totalDownload}</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, {backgroundColor: colors.background}]}>
      {/* Header */}
      <CommonHeader navigation={navigation} />

      {/* Page Heading */}
      <View style={styles.headingContainer}>
        <Text style={[styles.pageHeading, {color: colors.text}]}>{t('sessions.sessionHistory')}</Text>
        <Text style={[styles.pageSubheading, {color: colors.textSecondary}]}> 
          {t('sessions.sessionHistorySubtitle')}
        </Text>
      </View>

      {/* Content */}
      <FlatList
        data={sessionsData}
        renderItem={renderSessionItem}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
        ListHeaderComponent={
          <View>
            {renderSummary()}
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyIcon, {color: colors.textSecondary}]}>📊</Text>
            <Text style={[styles.emptyTitle, {color: colors.text}]}>
              {loading ? 'Loading sessions...' : 'No sessions found'}
            </Text>
            <Text style={[styles.emptySubtitle, {color: colors.textSecondary}]}> 
              {loading 
                ? 'Please wait while we fetch your session history...' 
                : 'Your recent session history will appear here once available.'
              }
            </Text>
          </View>
        }
      />

      {/* Modal removed; using inline expand/collapse per row */}
    </SafeAreaView>
  );
};

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
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 16,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  errorSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  summaryCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  summaryItem: {
    width: '48%',
    marginBottom: 16,
    alignItems: 'center',
  },
  summaryIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryIcon: {
    fontSize: 20,
  },
  summaryLabel: {
    fontSize: 12,
    marginBottom: 4,
    textAlign: 'center',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  sessionCard: {
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
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sessionDate: {
    fontSize: 16,
    fontWeight: '600',
  },
  durationBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  durationText: {
    fontSize: 12,
    fontWeight: '600',
  },
  sessionDetails: {
    gap: 8,
  },
  collapsedStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  collapsedStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  collapsedIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  collapsedIcon: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  collapsedValue: {
    fontSize: 12,
    fontWeight: '600',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailItem: {
    flex: 1,
    alignItems: 'center',
  },
  detailIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  detailIcon: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  detailLabel: {
    fontSize: 12,
    marginBottom: 4,
    textAlign: 'center',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    padding: 24,
    alignItems: 'stretch',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalLabel: {
    fontSize: 14,
    flex: 1,
  },
  modalValue: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  closeButton: {
    marginTop: 20,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default SessionsScreen; 