import React, {useState, useEffect, useMemo} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useTheme} from '../utils/ThemeContext';
import {getThemeColors} from '../utils/themeStyles';
import CommonHeader from '../components/CommonHeader';
import {useTranslation} from 'react-i18next';
import {apiService, Ticket} from '../services/api';
import sessionManager from '../services/sessionManager';
import AddTicketScreen from './AddTicketScreen';
import useMenuSettings from '../hooks/useMenuSettings';
import {
  getAppSettingsFromMenu,
  isFixYourInternetEnabled,
} from '../utils/appSettingsFromMenu';
import {getClientConfig} from '../config/client-config';
import Feather from 'react-native-vector-icons/Feather';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

const TicketsScreen = ({navigation, route}: any) => {
  const {isDark} = useTheme();
  const colors = getThemeColors(isDark);
  const {t} = useTranslation();
  const isMicroscan = getClientConfig().clientId === 'microscan';
  const showCreateTicketButton = !isMicroscan;
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddTicket, setShowAddTicket] = useState(false);
  const [troubleshootingPrefill, setTroubleshootingPrefill] = useState('');
  const { menu } = useMenuSettings();

  useEffect(() => {
    const params = route?.params;
    if (params?.fromTroubleshooting && params?.troubleshootingSummary) {
      setTroubleshootingPrefill(String(params.troubleshootingSummary));
      setShowAddTicket(true);
      navigation?.setParams?.({
        fromTroubleshooting: undefined,
        troubleshootingSummary: undefined,
      });
    }
  }, [route?.params, navigation]);

  const tryParseJson = (val: any): any => {
    if (val && typeof val === 'object') return val;
    if (typeof val !== 'string') return {};
    const trimmed = val.trim();
    if (!trimmed || (!trimmed.startsWith('{') && !trimmed.startsWith('['))) return {};
    try {
      return JSON.parse(trimmed);
    } catch {
      const openCount = (trimmed.match(/\{/g) || []).length;
      let s = trimmed;
      let closeCount = (s.match(/\}/g) || []).length;
      while (closeCount > openCount && s.endsWith('}')) {
        s = s.slice(0, -1);
        closeCount--;
      }
      try { return JSON.parse(s); } catch { return {}; }
    }
  };

  const showTicketCount: number = useMemo(() => {
    try {
      if (!Array.isArray(menu)) return 0;
      const ticketsEntry = menu.find((m: any) => (
        String(m?.menu_label).trim().toLowerCase() === 'tickets'
      )) || menu.find((m: any) => {
        try {
          const parsed = tryParseJson(m?.display_option_json);
          return typeof parsed?.show_ticket_count !== 'undefined';
        } catch { return false; }
      });
      if (!ticketsEntry) return 0;
      const parsed = tryParseJson(ticketsEntry.display_option_json);
      const raw = parsed?.show_ticket_count;
      const n = typeof raw === 'string' ? parseInt(raw, 10) : Number(raw);
      return Number.isFinite(n) ? n : 0;
    } catch {
      return 0;
    }
  }, [menu]);

  const showFixYourInternet = useMemo(
    () => isFixYourInternetEnabled(getAppSettingsFromMenu(menu)),
    [menu],
  );

  useEffect(() => {
    loadTickets();
  }, []);

  const loadTickets = async () => {
    try {
      setLoading(true);
      setError(null);
      const username = await sessionManager.getUsername();
      if (!username) {
        throw new Error('Username not found');
      }
      const formattedUsername = username.toLowerCase().trim();
      const {getClientConfig} = require('../config/client-config');
      const clientConfig = getClientConfig();
      const realm = clientConfig.clientId;
      const ticketsData = await apiService.lastTenComplaints(realm);
      setTickets(ticketsData);
    } catch (err: any) {
      console.error('Error loading tickets:', err);
      setError(err.message || 'Failed to load tickets');
      Alert.alert('Error', err.message || 'Failed to load tickets');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const statusLower = status.toLowerCase();
    switch (statusLower) {
      case 'open':
        return '#FBBC05';
      case 'in progress':
        return '#FFA500';
      case 'resolved':
        return '#4CAF50';
      case 'closed':
        return '#000000';
      default:
        return '#757575';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Critical':
        return '#F44336';
      case 'High':
        return '#FF9800';
      case 'Medium':
        return '#FFC107';
      case 'Low':
        return '#4CAF50';
      default:
        return '#757575';
    }
  };

  const getStatusIcon = (status: string) => {
    const statusLower = status.toLowerCase();
    switch (statusLower) {
      case 'open':
        return '🔴';
      case 'in progress':
        return '🟡';
      case 'resolved':
        return '🟢';
      case 'closed':
        return '🟢';
      default:
        return '⚪';
    }
  };

  const getStatusTranslationKey = (status: string): string => {
    const normalized = status.toLowerCase().replace(/[\s_]/g, '');
    // Map common variations to translation keys
    const statusMap: Record<string, string> = {
      'open': 'open',
      'inprogress': 'inprogress',
      'in-progress': 'inprogress',
      'resolved': 'resolved',
      'closed': 'closed',
      'closedonline': 'closed_online',
      'closed-online': 'closed_online',
      'closed_online': 'closed_online',
    };
    return statusMap[normalized] || normalized;
  };

  const formatTicketDate = (dateString: string): string => {
    if (!dateString) return '';
    
    try {
      // If already in the correct format "DD-MMM,YY HH:mm", return as-is
      if (dateString.match(/^\d{1,2}-[A-Za-z]{3},\d{2}\s+\d{1,2}:\d{2}$/)) {
        return dateString;
      }
      
      // Handle "DD-MM-YYYY HH:mm" format (e.g., "25-04-2025 10:56")
      if (dateString.match(/^\d{1,2}-\d{2}-\d{4}\s+\d{1,2}:\d{2}$/)) {
        const parts = dateString.split(' ');
        const datePart = parts[0]; // "25-04-2025"
        const timePart = parts[1] || ''; // "10:56"
        
        const [day, month, year] = datePart.split('-');
        const monthNum = parseInt(month, 10) - 1; // Month is 0-indexed
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const monthAbbr = monthNames[monthNum];
        const year2Digit = year.slice(-2);
        
        return `${day}-${monthAbbr},${year2Digit} ${timePart}`;
      }
      
      // Handle format: "15-Jul,24 14:30" or "15-Jul,24 14:30:45"
      if (dateString.includes('-') && dateString.includes(',')) {
        const parts = dateString.split(' ');
        const datePart = parts[0]; // "15-Jul,24"
        const originalTimePart = parts[1] || ''; // "14:30" or "14:30:45"
        
        const dateComponents = datePart.split('-');
        if (dateComponents.length >= 2) {
          const day = dateComponents[0]; // "15"
          const monthYear = dateComponents[1]; // "Jul,24"
          const monthYearParts = monthYear.split(',');
          if (monthYearParts.length >= 2) {
            const month = monthYearParts[0]; // "Jul"
            const year = monthYearParts[1]; // "24"
            
            // Extract time as HH:mm (remove seconds if present)
            let timePart = '';
            if (originalTimePart) {
              const timeMatch = originalTimePart.match(/(\d{1,2}):(\d{2})/);
              if (timeMatch) {
                const hours = timeMatch[1].padStart(2, '0');
                const minutes = timeMatch[2];
                timePart = `${hours}:${minutes}`;
              }
            }
            
            return `${day}-${month},${year} ${timePart}`.trim();
          }
        }
      }
      
      // Try to parse as standard date format
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) {
        const day = date.getDate().toString();
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const month = monthNames[date.getMonth()];
        const year = date.getFullYear().toString().slice(-2);
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        
        return `${day}-${month},${year} ${hours}:${minutes}`;
      }
      
      // Return original if parsing fails
      return dateString;
    } catch (error) {
      console.error('Error formatting date:', error);
      return dateString; // Return original if formatting fails
    }
  };

  const renderTicketItem = ({item}: {item: Ticket}) => (
    <TouchableOpacity
      style={[styles.ticketCard, {backgroundColor: colors.card, shadowColor: colors.shadow}]}
      onPress={() => handleTicketPress(item)}>
      <View style={styles.ticketHeader}>
        <View style={styles.ticketInfo}>
          <Text style={[styles.ticketNo, {color: colors.text}]}>{item.ticketNo}</Text>
        </View>
        <View style={[styles.statusBadge, {backgroundColor: getStatusColor(item.status)}]}>
          <Text style={styles.statusText}>{t(`tickets.${getStatusTranslationKey(item.status)}`)}</Text>
        </View>
      </View>
      <View style={styles.titleRow}>
        <Text style={[styles.ticketTitle, {color: colors.textSecondary}]}>{item.title}</Text>
      </View>
      <View style={styles.ticketFooter}>
        <View style={styles.dateInfo}>
          <View style={styles.dateLabelContainer}>
            <Text style={[styles.dateLabel, {color: colors.textSecondary}]}>{t('tickets.created')}:</Text>
          </View>
          <Text style={[styles.dateValue, {color: colors.text}]}>{formatTicketDate(item.dateCreated)}</Text>
        </View>
        {item.dateClosed && (
          <View style={styles.dateInfo}>
            <View style={styles.dateLabelContainer}>
              <Text style={[styles.dateLabel, {color: colors.textSecondary}]}>{t('tickets.closed')}:</Text>
            </View>
            <Text style={[styles.dateValue, {color: colors.text}]}>{formatTicketDate(item.dateClosed)}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  const handleTicketPress = (ticket: Ticket) => {
    console.log('Ticket pressed:', ticket);
  };

  const handleCreateTicket = () => {
    if (showFixYourInternet) {
      navigation.navigate('FixYourInternet');
      return;
    }
    setShowAddTicket(true);
  };

  const handleTicketCreated = () => {
    loadTickets();
  };

  const limitedTickets = useMemo(() => {
    if (!showTicketCount || showTicketCount <= 0) return tickets;
    return tickets.slice(0, showTicketCount);
  }, [tickets, showTicketCount]);

  return (
    <SafeAreaView style={[styles.container, {backgroundColor: colors.background}]}> 
      <CommonHeader
        navigation={navigation}
      />

      <View style={styles.headingContainer}>
        <View style={styles.headingRow}>
          <Text style={[styles.pageHeading, {color: colors.text}]}>{t('tickets.title')}</Text>
          {showCreateTicketButton ? (
            <TouchableOpacity
              style={[styles.createButton, {backgroundColor: colors.primary}]}
              onPress={handleCreateTicket}>
              <MaterialIcons name="confirmation-number" size={18} color="#fff" style={styles.createButtonIcon} />
              <Text style={styles.createButtonText}>New</Text>
            </TouchableOpacity>
          ) : null}
        </View>
        <Text style={[styles.pageSubheading, {color: colors.textSecondary}]}> 
          {t('tickets.subtitle')}
        </Text>
      </View>

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, {color: colors.textSecondary}]}> 
            {t('common.loading')}
          </Text>
        </View>
      )}

      {error && !loading && (
        <View style={styles.errorContainer}>
          <MaterialIcons name="warning" size={48} color={colors.textSecondary} />
          <Text style={[styles.errorTitle, {color: colors.text}]}>{t('common.error')}</Text>
          <Text style={[styles.errorMessage, {color: colors.textSecondary}]}>{error}</Text>
          <TouchableOpacity
            style={[styles.retryButton, {backgroundColor: colors.primary}]}
            onPress={loadTickets}>
            <Text style={styles.retryButtonText}>{t('common.retry')}</Text>
          </TouchableOpacity>
        </View>
      )}

      {!loading && !error && (
        <FlatList
          data={limitedTickets}
          renderItem={renderTicketItem}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.ticketsList}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialIcons name="confirmation-number" size={48} color={colors.textSecondary} />
              <Text style={[styles.emptyTitle, {color: colors.text}]}>{t('tickets.noTickets')}</Text>
              <Text style={[styles.emptySubtitle, {color: colors.textSecondary}]}> 
                {t('tickets.noTicketsSubtitle')}
              </Text>
            </View>
          }
        />
      )}

      {showAddTicket && (
        <AddTicketScreen
          visible={showAddTicket}
          onClose={() => {
            setShowAddTicket(false);
            setTroubleshootingPrefill('');
          }}
          onTicketCreated={handleTicketCreated}
          navigation={navigation}
          initialDescription={troubleshootingPrefill}
          fromTroubleshooting={!!troubleshootingPrefill}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    justifyContent: 'center',
  },
  createButtonIcon: {
    marginRight: 6,
  },
  createButtonText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
  },
  headingContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  headingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  pageHeading: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  pageSubheading: {
    fontSize: 16,
    lineHeight: 22,
  },
  ticketsList: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  ticketCard: {
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  ticketInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  ticketIcon: {
    fontSize: 0,
    marginRight: 0,
  },
  ticketNo: {
    fontSize: 16,
    fontWeight: '600',
    marginRight: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  statusText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '500',
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  priorityText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '600',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  titleIcon: {
    fontSize: 0,
    marginRight: 0,
  },
  ticketTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  ticketRemarks: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  ticketFooter: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
    paddingTop: 8,
  },
  dateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 0,
    paddingVertical: 0,
  },
  dateIcon: {
    fontSize: 0,
    marginRight: 0,
  },
  dateLabelContainer: {
    alignItems: 'flex-start',
    marginRight: 4,
  },
  dateLabel: {
    fontSize: 12,
  },
  dateValue: {
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 16,
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 60,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
});

export default TicketsScreen; 