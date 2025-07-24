import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { useTheme } from '../utils/ThemeContext';
import { getThemeColors } from '../utils/themeStyles';
import { apiService } from '../services/api';
import sessionManager from '../services/sessionManager';

interface SmartNotification {
  id: string;
  type: 'alert' | 'recommendation' | 'reminder' | 'info';
  title: string;
  message: string;
  priority: 'high' | 'medium' | 'low';
  timestamp: Date;
  action?: string;
  onAction?: () => void;
  icon: string;
  color: string;
  isRead: boolean;
}

const AISmartNotifications = ({ navigation }: { navigation?: any }) => {
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);
  const [notifications, setNotifications] = useState<SmartNotification[]>([]);
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    fetchUserData();
  }, []);

  useEffect(() => {
    if (userData) {
      generateSmartNotifications();
    }
  }, [userData]);

  const fetchUserData = async () => {
    try {
      const session = await sessionManager.getCurrentSession();
      if (!session) return;

      const { username } = session;
      const authResponse = await apiService.makeAuthenticatedRequest(async (token) => {
        return await apiService.authUser(username, token);
      });
      
      if (authResponse) {
        setUserData(authResponse);
      }
    } catch (error) {
      console.error('Error fetching user data for notifications:', error);
    }
  };

  const generateSmartNotifications = () => {
    if (!userData) return;

    const currentDate = new Date();
    const notifications: SmartNotification[] = [];

    // Extract user data
    const usageDetails = userData.usage_details?.[0];
    if (!usageDetails) return;

    const dataUsed = usageDetails.data_used || '0';
    const dataAllotted = usageDetails.plan_data || '100 GB';
    const daysUsed = parseInt(usageDetails.days_used || '0');
    const daysAllotted = parseInt(usageDetails.plan_days || '30');
    const planPrice = userData.planPrice || '₹1200';
    const paymentDues = userData.paymentDues || '0';
    const currentPlan = userData.currentPlan || 'Basic Plan';
    
    const dataUsedGB = parseFloat(dataUsed) / (1024 * 1024 * 1024);
    // Handle plan_data format like "100 GB" or "Unlimited"
    const isUnlimited = dataAllotted === 'Unlimited';
    const planDataGB = isUnlimited ? 1000 : parseFloat(dataAllotted.split(' ')[0]);
    const usagePercentage = isUnlimited ? 0 : (dataUsedGB / planDataGB) * 100;
    const daysRemaining = daysAllotted - daysUsed;
    const averageDailyUsage = daysUsed > 0 ? dataUsedGB / daysUsed : 0;
    const predictedUsage = averageDailyUsage * daysAllotted;

    // High usage alert (only for limited plans)
    if (!isUnlimited && usagePercentage > 80) {
      notifications.push({
        id: '1',
        type: 'alert',
        title: 'High Data Usage Alert',
        message: `You've used ${usagePercentage.toFixed(0)}% of your monthly data. At current rate, you'll exceed your plan by ${(predictedUsage - planDataGB).toFixed(2)}GB.`,
        priority: 'high',
        timestamp: new Date(currentDate.getTime() - 2 * 60 * 60 * 1000),
        action: 'Upgrade Plan',
        onAction: () => {
          if (navigation) {
            navigation.navigate('RenewPlan', { 
              recommendedPlan: '150GB',
              reason: 'high_usage',
              currentUsage: dataUsedGB,
              totalData: planDataGB
            });
          }
        },
        icon: '⚠️',
        color: '#FF5722',
        isRead: false,
      });
    }

    // Speed upgrade recommendation for unlimited plans
    if (isUnlimited && averageDailyUsage > 6) {
      notifications.push({
        id: '1',
        type: 'recommendation',
        title: 'Speed Upgrade Recommended',
        message: `You're using ${averageDailyUsage.toFixed(2)}GB daily. Consider upgrading to higher speeds for better performance.`,
        priority: 'medium',
        timestamp: new Date(currentDate.getTime() - 2 * 60 * 60 * 1000),
        action: 'Upgrade Speed',
        onAction: () => {
          if (navigation) {
            navigation.navigate('RenewPlan', { 
              recommendedPlan: '200Mbps',
              reason: 'speed_upgrade',
              currentUsage: averageDailyUsage,
              planType: 'speed'
            });
          }
        },
        icon: '⚡',
        color: '#2196F3',
        isRead: false,
      });
    }

    // Bill payment reminder
    if (parseFloat(paymentDues) > 0) {
      notifications.push({
        id: '2',
        type: 'reminder',
        title: 'Bill Payment Due',
        message: `Your bill of ₹${paymentDues} is due. Enable auto-pay to avoid late fees.`,
        priority: 'high',
        timestamp: new Date(currentDate.getTime() - 4 * 60 * 60 * 1000),
        action: 'Pay Now',
        onAction: () => {
          if (navigation) {
            navigation.navigate('PayBill');
          }
        },
        icon: '💰',
        color: '#FF9800',
        isRead: false,
      });
    }

    // Plan optimization (only for limited plans)
    if (!isUnlimited && usagePercentage < 60 && daysUsed > 10) {
      notifications.push({
        id: '3',
        type: 'recommendation',
        title: 'Plan Optimization',
        message: `You're consistently using ${usagePercentage.toFixed(0)}% of your plan. Consider downgrading to save money.`,
        priority: 'medium',
        timestamp: new Date(currentDate.getTime() - 6 * 60 * 60 * 1000),
        action: 'View Plans',
        onAction: () => {
          if (navigation) {
            navigation.navigate('RenewPlan', { 
              recommendedPlan: '50GB',
              reason: 'optimization',
              currentUsage: dataUsedGB,
              totalData: planDataGB
            });
          }
        },
        icon: '💡',
        color: '#2196F3',
        isRead: true,
      });
    }

    // Plan expiry warning
    if (daysRemaining <= 7) {
      notifications.push({
        id: '4',
        type: 'alert',
        title: 'Plan Expiring Soon',
        message: `Your ${currentPlan} expires in ${daysRemaining} days. Renew now to avoid service interruption.`,
        priority: 'high',
        timestamp: new Date(currentDate.getTime() - 8 * 60 * 60 * 1000),
        action: 'Renew Now',
        onAction: () => {
          if (navigation) {
            navigation.navigate('RenewPlan', { 
              recommendedPlan: currentPlan,
              reason: 'renewal',
              daysRemaining: daysRemaining
            });
          }
        },
        icon: '⏰',
        color: '#F44336',
        isRead: false,
      });
    }

    // Usage pattern insight (different for unlimited vs limited)
    if (averageDailyUsage > 4) {
      notifications.push({
        id: '5',
        type: 'info',
        title: isUnlimited ? 'Heavy Data Usage' : 'High Daily Usage Detected',
        message: isUnlimited ? 
          `You're using ${averageDailyUsage.toFixed(2)}GB daily. Consider upgrading to higher speeds for better performance.` :
          `You're using ${averageDailyUsage.toFixed(2)}GB daily. Consider upgrading to unlimited for better value.`,
        priority: 'medium',
        timestamp: new Date(currentDate.getTime() - 12 * 60 * 60 * 1000),
        action: isUnlimited ? 'Upgrade Speed' : 'View Plans',
        onAction: () => {
          if (navigation) {
            if (isUnlimited) {
              navigation.navigate('RenewPlan', { 
                recommendedPlan: '100Mbps',
                reason: 'usage_pattern',
                currentUsage: averageDailyUsage,
                planType: 'speed'
              });
            } else {
              navigation.navigate('RenewPlan', { 
                recommendedPlan: 'Unlimited',
                reason: 'usage_pattern',
                currentUsage: dataUsedGB,
                totalData: planDataGB
              });
            }
          }
        },
        icon: '📊',
        color: '#4CAF50',
        isRead: true,
      });
    }

    setNotifications(notifications);
  };

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === id ? { ...notification, isRead: true } : notification
      )
    );
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#FF5722';
      case 'medium': return '#FF9800';
      case 'low': return '#757575';
      default: return '#757575';
    }
  };

  const getTimeAgo = (timestamp: Date) => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - timestamp.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            🤖 Smart Notifications
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            AI-powered alerts and recommendations
          </Text>
        </View>
        {unreadCount > 0 && (
          <View style={[styles.badge, { backgroundColor: colors.primary }]}>
            <Text style={styles.badgeText}>{unreadCount}</Text>
          </View>
        )}
      </View>

      <ScrollView style={styles.notificationsContainer} showsVerticalScrollIndicator={false}>
        {notifications.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyIcon, { color: colors.textSecondary }]}>🎉</Text>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              All caught up!
            </Text>
            <Text style={[styles.emptyMessage, { color: colors.textSecondary }]}>
              No new notifications. AI is monitoring your account for any important updates.
            </Text>
          </View>
        ) : (
          notifications.map((notification) => (
            <TouchableOpacity
              key={notification.id}
              style={[
                styles.notificationCard,
                { 
                  backgroundColor: colors.card,
                  borderLeftColor: notification.color,
                  opacity: notification.isRead ? 0.7 : 1,
                }
              ]}
              onPress={() => {
                markAsRead(notification.id);
                notification.onAction?.();
              }}
            >
              <View style={styles.notificationHeader}>
                <View style={styles.notificationIcon}>
                  <Text style={styles.iconText}>{notification.icon}</Text>
                </View>
                <View style={styles.notificationContent}>
                  <View style={styles.notificationTitleRow}>
                    <Text style={[styles.notificationTitle, { color: colors.text }]}>
                      {notification.title}
                    </Text>
                    {!notification.isRead && (
                      <View style={[styles.unreadDot, { backgroundColor: notification.color }]} />
                    )}
                  </View>
                  <Text style={[styles.notificationMessage, { color: colors.textSecondary }]}>
                    {notification.message}
                  </Text>
                  <View style={styles.notificationFooter}>
                    <Text style={[styles.timestamp, { color: colors.textSecondary }]}>
                      {getTimeAgo(notification.timestamp)}
                    </Text>
                    <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(notification.priority) }]}>
                      <Text style={styles.priorityText}>
                        {notification.priority.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
              
              {notification.action && (
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: notification.color }]}
                  onPress={() => {
                    markAsRead(notification.id);
                    notification.onAction?.();
                  }}
                >
                  <Text style={styles.actionButtonText}>{notification.action}</Text>
                </TouchableOpacity>
              )}
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: colors.textSecondary }]}>
          💡 AI analyzes your account every hour for personalized notifications
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 12,
  },
  badge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  notificationsContainer: {
    flex: 1,
    padding: 16,
  },
  emptyState: {
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
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  notificationCard: {
    marginBottom: 12,
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  notificationHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  iconText: {
    fontSize: 20,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 8,
  },
  notificationMessage: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  notificationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timestamp: {
    fontSize: 12,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  priorityText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  actionButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  footerText: {
    fontSize: 12,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default AISmartNotifications; 