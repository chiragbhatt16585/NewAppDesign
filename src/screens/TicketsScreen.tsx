import React, {useState, useEffect} from 'react';
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

const TicketsScreen = ({navigation}: any) => {
  const {isDark} = useTheme();
  const colors = getThemeColors(isDark);
  const {t} = useTranslation();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddTicket, setShowAddTicket] = useState(false);


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

      // Format username to lowercase and trim (same as other API calls)
      const formattedUsername = username.toLowerCase().trim();

      // Get current client configuration
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
      {/* <Text style={[styles.ticketRemarks, {color: colors.textSecondary}]}>
        {item.remarks}
      </Text> */}

      <View style={styles.ticketFooter}>
        <View style={styles.dateInfo}>
          <Text style={[styles.dateIcon, {color: colors.textSecondary}]}>📅</Text>
          <Text style={[styles.dateLabel, {color: colors.textSecondary}]}>{t('tickets.created')}:</Text>
          <Text style={[styles.dateValue, {color: colors.text}]}>{item.dateCreated}</Text>
        </View>
        {item.dateClosed && (
          <View style={styles.dateInfo}>
            <Text style={[styles.dateIcon, {color: colors.textSecondary}]}>✅</Text>
            <Text style={[styles.dateLabel, {color: colors.textSecondary}]}>{t('tickets.closed')}:</Text>
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
    // Refresh the tickets list after creating a new ticket
    loadTickets();
  };


  return (
    <SafeAreaView style={[styles.container, {backgroundColor: colors.background}]}>
      {/* Header */}
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
          data={tickets}
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
    marginBottom: 4,
  },
  dateIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  dateLabel: {
    fontSize: 12,
    marginRight: 8,
  },
  dateValue: {
    fontSize: 12,
    fontWeight: '500',
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