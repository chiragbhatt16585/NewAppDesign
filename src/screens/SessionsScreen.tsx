import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  FlatList,
  Dimensions,
  Modal,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useTheme} from '../utils/ThemeContext';
import {getThemeColors} from '../utils/themeStyles';
import CommonHeader from '../components/CommonHeader';
import {useTranslation} from 'react-i18next';

const {width: screenWidth} = Dimensions.get('window');

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
  loginTime: string;
  logoutTime: string;
}

const SessionsScreen = ({navigation}: any) => {
  const {isDark} = useTheme();
  const colors = getThemeColors(isDark);
  const {t} = useTranslation();
  const [selectedSession, setSelectedSession] = useState<SessionData | null>(null);
  const [showSessionModal, setShowSessionModal] = useState(false);

  // Mock session data - replace with actual API data
  const sessionsData: SessionData[] = [
    {
      id: '1',
      date: '15 Jul 2024',
      totalDuration: '8h 32m',
      totalUpload: '2.5 GB',
      totalDownload: '15.8 GB',
      sessionTime: '8:32:15',
      downloadsGB: '15.8 GB',
      uploadsGB: '2.5 GB',
      totalDataGB: '18.3 GB',
      ipAddress: '192.168.1.100',
      loginTime: '08:30 AM',
      logoutTime: '05:02 PM',
    },
    {
      id: '2',
      date: '14 Jul 2024',
      totalDuration: '6h 15m',
      totalUpload: '1.8 GB',
      totalDownload: '12.3 GB',
      sessionTime: '6:15:42',
      downloadsGB: '12.3 GB',
      uploadsGB: '1.8 GB',
      totalDataGB: '14.1 GB',
      ipAddress: '192.168.1.100',
      loginTime: '09:15 AM',
      logoutTime: '03:30 PM',
    },
    {
      id: '3',
      date: '13 Jul 2024',
      totalDuration: '9h 45m',
      totalUpload: '3.2 GB',
      totalDownload: '18.7 GB',
      sessionTime: '9:45:30',
      downloadsGB: '18.7 GB',
      uploadsGB: '3.2 GB',
      totalDataGB: '21.9 GB',
      ipAddress: '192.168.1.100',
      loginTime: '07:45 AM',
      logoutTime: '05:30 PM',
    },
    {
      id: '4',
      date: '12 Jul 2024',
      totalDuration: '7h 20m',
      totalUpload: '2.1 GB',
      totalDownload: '14.2 GB',
      sessionTime: '7:20:18',
      downloadsGB: '14.2 GB',
      uploadsGB: '2.1 GB',
      totalDataGB: '16.3 GB',
      ipAddress: '192.168.1.100',
      loginTime: '08:20 AM',
      logoutTime: '03:40 PM',
    },
    {
      id: '5',
      date: '11 Jul 2024',
      totalDuration: '5h 50m',
      totalUpload: '1.5 GB',
      totalDownload: '10.8 GB',
      sessionTime: '5:50:25',
      downloadsGB: '10.8 GB',
      uploadsGB: '1.5 GB',
      totalDataGB: '12.3 GB',
      ipAddress: '192.168.1.100',
      loginTime: '10:10 AM',
      logoutTime: '04:00 PM',
    },
    {
      id: '6',
      date: '10 Jul 2024',
      totalDuration: '8h 10m',
      totalUpload: '2.8 GB',
      totalDownload: '16.5 GB',
      sessionTime: '8:10:33',
      downloadsGB: '16.5 GB',
      uploadsGB: '2.8 GB',
      totalDataGB: '19.3 GB',
      ipAddress: '192.168.1.100',
      loginTime: '08:00 AM',
      logoutTime: '04:10 PM',
    },
    {
      id: '7',
      date: '09 Jul 2024',
      totalDuration: '6h 35m',
      totalUpload: '1.9 GB',
      totalDownload: '13.1 GB',
      sessionTime: '6:35:47',
      downloadsGB: '13.1 GB',
      uploadsGB: '1.9 GB',
      totalDataGB: '15.0 GB',
      ipAddress: '192.168.1.100',
      loginTime: '09:25 AM',
      logoutTime: '04:00 PM',
    },
    {
      id: '8',
      date: '08 Jul 2024',
      totalDuration: '9h 15m',
      totalUpload: '3.0 GB',
      totalDownload: '17.9 GB',
      sessionTime: '9:15:12',
      downloadsGB: '17.9 GB',
      uploadsGB: '3.0 GB',
      totalDataGB: '20.9 GB',
      ipAddress: '192.168.1.100',
      loginTime: '07:30 AM',
      logoutTime: '04:45 PM',
    },
  ];

  const handleSessionPress = (session: SessionData) => {
    setSelectedSession(session);
    setShowSessionModal(true);
  };

  const renderSessionItem = ({item}: {item: SessionData}) => (
    <TouchableOpacity
      style={[styles.sessionCard, {backgroundColor: colors.card, shadowColor: colors.shadow}]}
      onPress={() => handleSessionPress(item)}>
      <View style={styles.sessionHeader}>
        <Text style={[styles.sessionDate, {color: colors.text}]}>{item.date}</Text>
        <View style={[styles.durationBadge, {backgroundColor: colors.primaryLight}]}>
          <Text style={[styles.durationText, {color: colors.primary}]}>{item.totalDuration}</Text>
        </View>
      </View>
      
      <View style={styles.sessionDetails}>
        <View style={styles.detailRow}>
          <View style={styles.detailItem}>
            <Text style={[styles.detailLabel, {color: colors.textSecondary}]}>
              {t('sessions.upload')}
            </Text>
            <Text style={[styles.detailValue, {color: colors.text}]}>{item.totalUpload}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={[styles.detailLabel, {color: colors.textSecondary}]}>
              {t('sessions.download')}
            </Text>
            <Text style={[styles.detailValue, {color: colors.text}]}>{item.totalDownload}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderHeader = () => (
    <View style={[styles.headerCard, {backgroundColor: colors.card, shadowColor: colors.shadow}]}>
      <Text style={[styles.headerTitle, {color: colors.text}]}>{t('sessions.sessionHistory')}</Text>
      <Text style={[styles.headerSubtitle, {color: colors.textSecondary}]}>
        {t('sessions.sessionHistorySubtitle')}
      </Text>
    </View>
  );

  const renderSummary = () => (
    <View style={[styles.summaryCard, {backgroundColor: colors.card, shadowColor: colors.shadow}]}>
      <Text style={[styles.summaryTitle, {color: colors.text}]}>{t('sessions.monthlySummary')}</Text>
      
      <View style={styles.summaryGrid}>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryLabel, {color: colors.textSecondary}]}>
            {t('sessions.totalSessions')}
          </Text>
          <Text style={[styles.summaryValue, {color: colors.text}]}>31</Text>
        </View>
        
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryLabel, {color: colors.textSecondary}]}>
            {t('sessions.totalDuration')}
          </Text>
          <Text style={[styles.summaryValue, {color: colors.text}]}>245h 12m</Text>
        </View>
        
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryLabel, {color: colors.textSecondary}]}>
            {t('sessions.totalUpload')}
          </Text>
          <Text style={[styles.summaryValue, {color: colors.accent}]}>78.5 GB</Text>
        </View>
        
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryLabel, {color: colors.textSecondary}]}>
            {t('sessions.totalDownload')}
          </Text>
          <Text style={[styles.summaryValue, {color: colors.success}]}>456.2 GB</Text>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, {backgroundColor: colors.background}]}>
      {/* Header */}
      <CommonHeader navigation={navigation} />

      {/* Page Heading */}
      <View style={styles.headingContainer}>
        <Text style={[styles.pageHeading, {color: colors.text}]}>{t('sessions.title')}</Text>
        <Text style={[styles.pageSubheading, {color: colors.textSecondary}]}>
          {t('sessions.subtitle')}
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
            {renderHeader()}
            {renderSummary()}
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyIcon, {color: colors.textSecondary}]}>📊</Text>
            <Text style={[styles.emptyTitle, {color: colors.text}]}>{t('sessions.noSessions')}</Text>
            <Text style={[styles.emptySubtitle, {color: colors.textSecondary}]}> 
              {t('sessions.noSessionsSubtitle')}
            </Text>
          </View>
        }
      />

      {/* Session Detail Modal */}
      <Modal
        visible={showSessionModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSessionModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, {backgroundColor: colors.card}]}> 
            <Text style={[styles.modalTitle, {color: colors.text}]}>{t('sessions.sessionDetails')}</Text>
            {selectedSession && (
              <>
                <View style={styles.modalRow}>
                  <Text style={[styles.modalLabel, {color: colors.textSecondary}]}>{t('sessions.sessionTime')}</Text>
                  <Text style={[styles.modalValue, {color: colors.text}]}>{selectedSession.sessionTime}</Text>
                </View>
                <View style={styles.modalRow}>
                  <Text style={[styles.modalLabel, {color: colors.textSecondary}]}>{t('sessions.downloadsGB')}</Text>
                  <Text style={[styles.modalValue, {color: colors.text}]}>{selectedSession.downloadsGB}</Text>
                </View>
                <View style={styles.modalRow}>
                  <Text style={[styles.modalLabel, {color: colors.textSecondary}]}>{t('sessions.uploadsGB')}</Text>
                  <Text style={[styles.modalValue, {color: colors.text}]}>{selectedSession.uploadsGB}</Text>
                </View>
                <View style={styles.modalRow}>
                  <Text style={[styles.modalLabel, {color: colors.textSecondary}]}>{t('sessions.totalDataGB')}</Text>
                  <Text style={[styles.modalValue, {color: colors.text}]}>{selectedSession.totalDataGB}</Text>
                </View>
                <View style={styles.modalRow}>
                  <Text style={[styles.modalLabel, {color: colors.textSecondary}]}>{t('sessions.ipAddress')}</Text>
                  <Text style={[styles.modalValue, {color: colors.text}]}>{selectedSession.ipAddress}</Text>
                </View>
                <View style={styles.modalRow}>
                  <Text style={[styles.modalLabel, {color: colors.textSecondary}]}>{t('sessions.loginTime')}</Text>
                  <Text style={[styles.modalValue, {color: colors.text}]}>{selectedSession.loginTime}</Text>
                </View>
                <View style={styles.modalRow}>
                  <Text style={[styles.modalLabel, {color: colors.textSecondary}]}>{t('sessions.logoutTime')}</Text>
                  <Text style={[styles.modalValue, {color: colors.text}]}>{selectedSession.logoutTime}</Text>
                </View>
              </>
            )}
            <TouchableOpacity style={[styles.closeButton, {backgroundColor: colors.primary}]} onPress={() => setShowSessionModal(false)}>
              <Text style={styles.closeButtonText}>{t('common.ok')}</Text>
            </TouchableOpacity>
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
  },
  summaryLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: 'bold',
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
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailItem: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
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
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    borderRadius: 16,
    padding: 24,
    alignItems: 'stretch',
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