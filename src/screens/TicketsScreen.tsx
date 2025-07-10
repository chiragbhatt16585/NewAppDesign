import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  FlatList,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useTheme} from '../utils/ThemeContext';
import {getThemeColors} from '../utils/themeStyles';
import CommonHeader from '../components/CommonHeader';
import {useTranslation} from 'react-i18next';

interface Ticket {
  id: string;
  ticketNo: string;
  status: 'Open' | 'In Progress' | 'Resolved' | 'Closed';
  title: string;
  remarks: string;
  dateCreated: string;
  dateClosed?: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
}

const TicketsScreen = ({navigation}: any) => {
  const {isDark} = useTheme();
  const colors = getThemeColors(isDark);
  const {t} = useTranslation();


  // Mock ticket data - replace with actual API data
  const tickets: Ticket[] = [
    {
      id: '1',
      ticketNo: 'TKT-2024-001',
      status: 'Open',
      title: 'Internet connectivity issue',
      remarks: 'Unable to connect to internet since morning. Router shows red light.',
      dateCreated: '2024-01-15 09:30 AM',
      priority: 'High',
    },
    {
      id: '2',
      ticketNo: 'TKT-2024-002',
      status: 'In Progress',
      title: 'Slow internet speed',
      remarks: 'Internet speed is very slow during peak hours. Getting only 10 Mbps instead of 100 Mbps.',
      dateCreated: '2024-01-14 02:15 PM',
      priority: 'Medium',
    },
    {
      id: '3',
      ticketNo: 'TKT-2024-003',
      status: 'Resolved',
      title: 'Router configuration issue',
      remarks: 'Router settings were reset. Need help to reconfigure WiFi settings.',
      dateCreated: '2024-01-13 11:45 AM',
      dateClosed: '2024-01-14 10:30 AM',
      priority: 'Medium',
    },
    {
      id: '4',
      ticketNo: 'TKT-2024-004',
      status: 'Closed',
      title: 'Billing query',
      remarks: 'Incorrect amount charged in the last bill. Need clarification on charges.',
      dateCreated: '2024-01-12 04:20 PM',
      dateClosed: '2024-01-13 03:15 PM',
      priority: 'Low',
    },
    {
      id: '5',
      ticketNo: 'TKT-2024-005',
      status: 'Open',
      title: 'Service upgrade request',
      remarks: 'Want to upgrade from 50 Mbps to 100 Mbps plan. Please provide details.',
      dateCreated: '2024-01-15 01:30 PM',
      priority: 'Low',
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Open':
        return '#FF6B35';
      case 'In Progress':
        return '#FFA500';
      case 'Resolved':
        return '#4CAF50';
      case 'Closed':
        return '#9E9E9E';
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
    switch (status) {
      case 'Open':
        return '🔴';
      case 'In Progress':
        return '🟡';
      case 'Resolved':
        return '🟢';
      case 'Closed':
        return '⚫';
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
          <Text style={[styles.ticketNo, {color: colors.text}]}>{item.ticketNo}</Text>
          <View style={[styles.statusBadge, {backgroundColor: getStatusColor(item.status)}]}>
            <Text style={styles.statusIcon}>{getStatusIcon(item.status)}</Text>
            <Text style={styles.statusText}>{t(`tickets.${item.status.toLowerCase().replace(' ', '')}`)}</Text>
          </View>
        </View>
        <View style={[styles.priorityBadge, {backgroundColor: getPriorityColor(item.priority)}]}>
          <Text style={styles.priorityText}>{t(`tickets.${item.priority.toLowerCase()}`)}</Text>
        </View>
      </View>

      <Text style={[styles.ticketTitle, {color: colors.text}]}>{item.title}</Text>
      <Text style={[styles.ticketRemarks, {color: colors.textSecondary}]} numberOfLines={2}>
        {item.remarks}
      </Text>

      <View style={styles.ticketFooter}>
        <View style={styles.dateInfo}>
          <Text style={[styles.dateLabel, {color: colors.textSecondary}]}>{t('tickets.created')}:</Text>
          <Text style={[styles.dateValue, {color: colors.text}]}>{item.dateCreated}</Text>
        </View>
        {item.dateClosed && (
          <View style={styles.dateInfo}>
            <Text style={[styles.dateLabel, {color: colors.textSecondary}]}>{t('tickets.closed')}:</Text>
            <Text style={[styles.dateValue, {color: colors.text}]}>{item.dateClosed}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  const handleTicketPress = (ticket: Ticket) => {
    // Navigate to ticket details screen or show modal
    console.log('Ticket pressed:', ticket);
  };

  const handleCreateTicket = () => {
    // Navigate to create ticket screen
    console.log('Create new ticket');
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

      {/* Page Heading */}
      <View style={styles.headingContainer}>
        <Text style={[styles.pageHeading, {color: colors.text}]}>{t('tickets.title')}</Text>
        <Text style={[styles.pageSubheading, {color: colors.textSecondary}]}>
          {t('tickets.subtitle')}
        </Text>
      </View>

      {/* Tickets List */}
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
  pageHeading: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
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
  ticketTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
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
});

export default TicketsScreen; 