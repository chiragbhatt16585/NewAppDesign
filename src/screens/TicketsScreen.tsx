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

const TicketsScreen = ({navigation}: any) => {
  const {isDark} = useTheme();
  const colors = getThemeColors(isDark);
  const {t} = useTranslation();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddTicket, setShowAddTicket] = useState(false);
  const { menu } = useMenuSettings();

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
        return '#FF6B35';
      case 'in progress':
        return '#FFA500';
      case 'resolved':
        return '#4CAF50';
      case 'closed':
        return '#4CAF50';
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

  const renderTicketItem = ({item}: {item: Ticket}) => (
    <TouchableOpacity
      style={[styles.ticketCard, {backgroundColor: colors.card, shadowColor: colors.shadow}]}
      onPress={() => handleTicketPress(item)}>
      <View style={styles.ticketHeader}>
        <View style={styles.ticketInfo}>
          <Text style={[styles.ticketIcon, {color: colors.textSecondary}]}>🔢</Text>
          <Text style={[styles.ticketNo, {color: colors.text}]}>{item.ticketNo}</Text>
        </View>
        <View style={[styles.statusBadge, {backgroundColor: getStatusColor(item.status)}]}>
          <Text style={styles.statusText}>{t(`tickets.${item.status.toLowerCase().replace(' ', '')}`)}</Text>
        </View>
      </View>
      <View style={styles.titleRow}>
        <Text style={[styles.titleIcon, {color: colors.textSecondary}]}>📋</Text>
        <Text style={[styles.ticketTitle, {color: colors.textSecondary}]}>{item.title}</Text>
      </View>
      <View style={styles.ticketFooter}>
        <View style={styles.dateInfo}>
          <Text style={[styles.dateIcon, {color: colors.textSecondary}]}>📅</Text>
          <View style={styles.dateLabelContainer}>
            <Text style={[styles.dateLabel, {color: colors.textSecondary}]}>{t('tickets.created')}:</Text>
          </View>
          <Text style={[styles.dateValue, {color: colors.text}]}>{item.dateCreated}</Text>
        </View>
        {item.dateClosed && (
          <View style={styles.dateInfo}>
            <Text style={[styles.dateIcon, {color: colors.textSecondary}]}>✅</Text>
            <View style={styles.dateLabelContainer}>
              <Text style={[styles.dateLabel, {color: colors.textSecondary}]}>{t('tickets.closed')}:</Text>
            </View>
            <Text style={[styles.dateValue, {color: colors.text}]}>{item.dateClosed}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  const handleTicketPress = (ticket: Ticket) => {
    console.log('Ticket pressed:', ticket);
  };

  const handleCreateTicket = () => {
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
        rightComponent={
          <TouchableOpacity
            style={[styles.createButton, {backgroundColor: colors.primary}]}
            onPress={handleCreateTicket}>
            <Text style={styles.createButtonText}>+</Text>
          </TouchableOpacity>
        }
      />

      <View style={styles.headingContainer}>
        <View style={styles.headingRow}>
          <Text style={[styles.headingIcon, {color: colors.primary}]}>📋</Text>
          <Text style={[styles.pageHeading, {color: colors.text}]}>{t('tickets.title')}</Text>
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
          <Text style={[styles.errorIcon, {color: colors.textSecondary}]}>⚠️</Text>
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
              <Text style={[styles.emptyIcon, {color: colors.textSecondary}]}>📋</Text>
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
          onClose={() => setShowAddTicket(false)}
          onTicketCreated={handleTicketCreated}
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
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  createButtonText: {
    fontSize: 24,
    color: '#fff',
    fontWeight: 'bold',
  },
  headingContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  headingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  headingIcon: {
    fontSize: 28,
    marginRight: 12,
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
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  ticketInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  ticketIcon: {
    fontSize: 16,
    marginRight: 6,
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
    borderRadius: 12,
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
    marginBottom: 8,
  },
  titleIcon: {
    fontSize: 16,
    marginRight: 8,
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
    paddingTop: 12,
  },
  dateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    paddingVertical: 2,
  },
  dateIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  dateLabelContainer: {
    width: 70,
    alignItems: 'flex-end',
    marginRight: 8,
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