import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Entypo from 'react-native-vector-icons/Entypo';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import moment from 'moment';
import { apiService } from '../services/api';
import { getClientConfig } from '../config/client-config';
import { useTheme } from '../utils/ThemeContext';
import { getThemeColors } from '../utils/themeStyles';
import CommonHeader from '../components/CommonHeader';

interface NotificationItem {
  id: string;
  alert_event: string;
  msg_content: string;
  notification_seen_at: string | null;
  entry_date: string;
  alert_type: string;
}

const NotificationsScreen = ({ navigation }: any) => {
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);

  const realm = getClientConfig().clientId;

  const normalizeHtmlMessage = (raw: string | null | undefined): string => {
    if (!raw) {
      return '';
    }
    let text = String(raw);
    // Replace common break tags with newlines
    text = text.replace(/<br\s*\/?>/gi, '\n');
    text = text.replace(/<\/p>/gi, '\n');
    // Strip all remaining HTML tags
    text = text.replace(/<[^>]+>/g, '');
    // Decode a few common HTML entities
    text = text
      .replace(/&nbsp;/gi, ' ')
      .replace(/&amp;/gi, '&')
      .replace(/&lt;/gi, '<')
      .replace(/&gt;/gi, '>')
      .replace(/&quot;/gi, '"')
      .replace(/&#39;/g, "'");
    // Collapse excessive newlines
    text = text.replace(/\n{3,}/g, '\n\n');
    return text.trim();
  };

  const loadNotifications = useCallback(async (showLoader: boolean) => {
    try {
      if (showLoader) {
        setLoading(true);
      }
      const list = await apiService.lastTenNotification(realm);
      if (Array.isArray(list) && list.length > 0) {
        setItems(list as NotificationItem[]);
      } else {
        // No notifications from server
        setItems([]);
      }
    } catch {
      // On error, clear list; empty state will be shown
      setItems([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [realm]);

  useEffect(() => {
    loadNotifications(true);
  }, [loadNotifications]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadNotifications(false);
  }, [loadNotifications]);

  const handleRefreshPress = () => {
    onRefresh();
  };

  const isNotificationSeen = (seenAt: string | null) => {
    return !!seenAt && seenAt !== '0000-00-00 00:00:00';
  };

  const handleMarkAllRead = async () => {
    if (!items.length) {
      return;
    }
    try {
      const ids = items.map(n => String(n.id));
      if (ids.length) {
        await apiService.updateNotificationStatusToSeen(ids, realm);
        setItems(prev =>
          prev.map(n => ({
            ...n,
            notification_seen_at: new Date().toISOString(),
          })),
        );
      }
    } catch {
      // silent for now; could show an in-app notification
    }
  };

  const handleNotificationPress = async (item: NotificationItem) => {
    if (isNotificationSeen(item.notification_seen_at)) {
      // Already read; no need to call API again
      return;
    }
    try {
      await apiService.updateNotificationStatusToSeen([String(item.id)], realm);
      setItems(prev =>
        prev.map(n =>
          n.id === item.id
            ? {
                ...n,
                notification_seen_at: new Date().toISOString(),
              }
            : n,
        ),
      );
    } catch {
      // silent for now
    }
  };

  const renderItem = ({ item }: { item: NotificationItem }) => {
    const isSeen = isNotificationSeen(item.notification_seen_at);
    const timestamp = item.entry_date
      ? moment(item.entry_date).format('DD MMM, YYYY • hh:mm A')
      : '';
    const alertType = (item.alert_type || '').toLowerCase();
    const isSms = alertType === 'sms';
    const iconName = isSms ? 'cellphone' : 'bell-ring-outline';
    const iconColor = isSeen ? colors.textSecondary : colors.primary;
    const cardBackground = isSeen ? colors.card : colors.primaryLight;
    const title =
      item.alert_event && item.alert_event.length > 0
        ? item.alert_event.replace(/_/g, ' ').toLowerCase().replace(/^\w/, c => c.toUpperCase())
        : 'Notification';

    return (
      <View
        style={[styles.card, { backgroundColor: cardBackground, shadowColor: colors.shadow }]}
      >
        {/* Row 1: icon + title (left) + NEW badge (right) */}
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleRow}>
            <MaterialCommunityIcons
              name={iconName}
              size={18}
              color={iconColor}
              style={styles.cardIcon}
            />
            <Text style={[styles.cardTitle, { color: colors.text }]}>
              {title}
            </Text>
          </View>
          {!isSeen && (
            <View style={styles.newBadge}>
              <Text style={styles.newBadgeText}>NEW</Text>
            </View>
          )}
        </View>

        {/* Row 2: time (left) + Mark read/Read (right) */}
        {(timestamp || true) && (
          <View style={styles.metaRow}>
            {timestamp ? (
              <Text style={[styles.cardTimestamp, { color: colors.textSecondary }]}>
                {timestamp}
              </Text>
            ) : <View />}
            <TouchableOpacity
              onPress={() => {
                if (!isSeen) {
                  handleNotificationPress(item);
                }
              }}
              activeOpacity={isSeen ? 1 : 0.7}
              disabled={isSeen}
            >
              <Text
                style={[
                  styles.markReadText,
                  { color: isSeen ? colors.textSecondary : colors.primary },
                ]}
              >
                {isSeen ? 'Read' : 'Mark read'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Row 3: message */}
        <Text
          style={[
            styles.cardMessage,
            { color: colors.text, fontWeight: isSeen ? '400' : '500' },
          ]}
        >
          {normalizeHtmlMessage(item.msg_content)}
        </Text>

      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <CommonHeader navigation={navigation} showBackButton title={undefined} />
      <View style={styles.headingContainer}>
        <View style={styles.headingRow}>
          <Text style={[styles.pageHeading, { color: colors.text }]}>
            Notifications
          </Text>
          <View style={styles.actionsRow}>
            <TouchableOpacity
              onPress={handleRefreshPress}
              style={[styles.actionButton, { borderColor: colors.primary }]}
              activeOpacity={0.8}
            >
              <Text style={[styles.actionButtonText, { color: colors.primary }]}>
                Refresh
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleMarkAllRead}
              style={[styles.actionButtonFilled, { backgroundColor: colors.primary }]}
              activeOpacity={0.8}
            >
              <Text style={styles.actionButtonFilledText}>
                Mark all read
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        <Text style={[styles.pageSubheading, { color: colors.textSecondary }]}>
          Latest alerts and updates from your ISP
        </Text>
      </View>
      <FlatList
        data={items}
        keyExtractor={item => item.id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyContainer}>
              <Ionicons
                name="notifications-off-outline"
                size={48}
                color={colors.textSecondary}
                style={styles.emptyIcon}
              />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                No notifications yet
              </Text>
              <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                When your ISP sends important alerts, they will appear here.
              </Text>
            </View>
          ) : null
        }
        renderItem={renderItem}
      />
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
    paddingBottom: 12,
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
    fontSize: 14,
    lineHeight: 20,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    marginRight: 8,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '500',
  },
  actionButtonFilled: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  actionButtonFilledText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  card: {
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  cardIcon: {
    marginRight: 8,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginRight: 4,
  },
  newBadge: {
    marginRight: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: '#16a34a',
  },
  newBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#ffffff',
  },
  cardTimestamp: {
    fontSize: 11,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  cardMessage: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
  },
  markReadText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 8,
  },
  emptyContainer: {
    flex: 1,
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIcon: {
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
});

export default NotificationsScreen;

