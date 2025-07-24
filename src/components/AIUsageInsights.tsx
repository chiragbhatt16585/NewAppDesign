import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
} from 'react-native';
import { useTheme } from '../utils/ThemeContext';
import { getThemeColors } from '../utils/themeStyles';
import { apiService } from '../services/api';
import sessionManager from '../services/sessionManager';

const { width } = Dimensions.get('window');

interface UsageData {
  currentUsage: number;
  totalData: number;
  daysUsed: number;
  daysRemaining: number;
  averageDailyUsage: number;
  predictedUsage: number;
  isUnlimited: boolean;
}

interface AIInsight {
  type: 'warning' | 'recommendation' | 'info' | 'savings';
  title: string;
  message: string;
  action?: string;
  onAction?: () => void;
  icon: string;
  color: string;
}

const AIUsageInsights = ({ navigation }: { navigation?: any }) => {
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);
  const [usageData, setUsageData] = useState<UsageData>({
    currentUsage: 0,
    totalData: 0,
    daysUsed: 0,
    daysRemaining: 0,
    averageDailyUsage: 0,
    predictedUsage: 0,
    isUnlimited: false,
  });
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [authData, setAuthData] = useState<any>(null);

  useEffect(() => {
    fetchAccountData();
  }, []); // Empty dependency array - only run once on mount

  const fetchAccountData = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Get current session data
      const session = await sessionManager.getCurrentSession();
      if (!session) {
        setIsLoading(false);
        return;
      }

      const { username } = session;
      const authResponse = await apiService.makeAuthenticatedRequest(async (token) => {
        return await apiService.authUser(username);
      });
      
      if (authResponse) {
        setAuthData(authResponse);
      }
    } catch (error) {
      console.error('Error fetching account data for AI insights:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const processUsageData = useCallback(() => {
    if (!authData) return;

    // Extract data from the actual API response structure
    const usageDetails = authData.usage_details?.[0];
    if (!usageDetails) {
      console.log('No usage details found in authData');
      return;
    }

    const dataUsed = usageDetails.data_used || '0';
    const dataAllotted = usageDetails.plan_data || '100 GB';
    const daysUsed = parseInt(usageDetails.days_used || '0');
    const planDays = parseInt(usageDetails.plan_days || '30');
    
    // Convert bytes to GB
    const dataUsedGB = parseFloat(dataUsed) / (1024 * 1024 * 1024);
    
    // Handle unlimited plans
    const isUnlimited = dataAllotted === 'Unlimited';
    const planDataGB = isUnlimited ? 1000 : parseFloat(dataAllotted.split(' ')[0]);
    
    const daysRemaining = Math.max(0, planDays - daysUsed);
    const averageDailyUsage = daysUsed > 0 ? dataUsedGB / daysUsed : 0;
    const predictedUsage = averageDailyUsage * planDays;

    setUsageData({
      currentUsage: dataUsedGB,
      totalData: planDataGB,
      daysUsed,
      daysRemaining,
      averageDailyUsage,
      predictedUsage,
      isUnlimited,
    });
  }, [authData]);

  const generateAIInsights = useCallback(() => {
    if (!usageData || !authData) {
      console.log('generateAIInsights: Missing data', { usageData: !!usageData, authData: !!authData });
      return;
    }

    const newInsights: AIInsight[] = [];
    const currentPlan = authData.current_plan || 'Current Plan';
    const planPrice = authData.plan_price || '₹999';



    // High usage warning (only for limited plans) - Made more lenient (60% instead of 80%)
    if (!usageData.isUnlimited && usageData.currentUsage / usageData.totalData > 0.6) {
      newInsights.push({
        type: 'warning',
        title: 'High Data Usage Alert',
        message: `You've used ${(usageData.currentUsage / usageData.totalData * 100).toFixed(0)}% of your data. Consider upgrading to avoid overage charges.`,
        action: 'Upgrade Plan',
        onAction: () => {
          if (navigation) {
            navigation.navigate('RenewPlan', { 
              recommendedPlan: '150GB',
              reason: 'high_usage',
              currentUsage: usageData.currentUsage,
              totalData: usageData.totalData
            });
          }
        },
        icon: '⚠️',
        color: '#FF9800',
      });
    }

    // Speed upgrade recommendation for unlimited plans - Made more lenient (3GB instead of 6GB)
    if (usageData.isUnlimited && usageData.averageDailyUsage > 3) {
      newInsights.push({
        type: 'recommendation',
        title: 'Speed Upgrade Recommended',
        message: `You're using ${usageData.averageDailyUsage.toFixed(1)}GB daily. Upgrade to higher speeds for better performance.`,
        action: 'View Speed Plans',
        onAction: () => {
          if (navigation) {
            navigation.navigate('RenewPlan', { 
              recommendedPlan: '200Mbps',
              reason: 'speed_upgrade',
              currentUsage: usageData.averageDailyUsage,
              planType: 'speed'
            });
          }
        },
        icon: '⚡',
        color: '#2196F3',
      });
    }

    // Plan optimization (only for limited plans)
    if (!usageData.isUnlimited && usageData.currentUsage / usageData.totalData < 0.6 && usageData.daysUsed > 10) {
      newInsights.push({
        type: 'savings',
        title: 'Plan Optimization',
        message: `You're using only ${(usageData.currentUsage / usageData.totalData * 100).toFixed(0)}% of your data. Consider a smaller plan to save money.`,
        action: 'View Plans',
        onAction: () => {
          if (navigation) {
            navigation.navigate('RenewPlan', { 
              recommendedPlan: '50GB',
              reason: 'optimization',
              currentUsage: usageData.currentUsage,
              totalData: usageData.totalData
            });
          }
        },
        icon: '💰',
        color: '#4CAF50',
      });
    }

    // Usage pattern insight
    if (usageData.averageDailyUsage > 4) {
      newInsights.push({
        type: 'info',
        title: 'Usage Pattern Analysis',
        message: `You're averaging ${usageData.averageDailyUsage.toFixed(1)}GB daily. ${usageData.isUnlimited ? 'Great! You have unlimited data.' : 'This suggests you need a larger plan.'}`,
        action: usageData.isUnlimited ? 'View Speed Plans' : 'Upgrade Plan',
        onAction: () => {
          if (navigation) {
            if (usageData.isUnlimited) {
              navigation.navigate('RenewPlan', { 
                recommendedPlan: '100Mbps',
                reason: 'usage_pattern',
                currentUsage: usageData.averageDailyUsage,
                planType: 'speed'
              });
            } else {
              navigation.navigate('RenewPlan', { 
                recommendedPlan: '200GB',
                reason: 'usage_pattern',
                currentUsage: usageData.currentUsage,
                totalData: usageData.totalData
              });
            }
          }
        },
        icon: '📊',
        color: '#9C27B0',
      });
    }

    // Early renewal reminder
    if (usageData.daysRemaining <= 5) {
      newInsights.push({
        type: 'warning',
        title: 'Plan Expiring Soon',
        message: `Your plan expires in ${usageData.daysRemaining} days. Renew early to avoid service interruption.`,
        action: 'Renew Now',
        onAction: () => {
          if (navigation) {
            navigation.navigate('RenewPlan', { 
              recommendedPlan: currentPlan,
              reason: 'renewal',
              daysRemaining: usageData.daysRemaining
            });
          }
        },
        icon: '⏰',
        color: '#F44336',
      });
    }

    // Fallback insight to ensure something always shows
    if (newInsights.length === 0) {
      newInsights.push({
        type: 'info',
        title: 'AI Usage Analysis',
        message: `You're using ${usageData.averageDailyUsage.toFixed(1)}GB daily. ${usageData.isUnlimited ? 'Great! You have unlimited data.' : 'Monitor your usage to optimize your plan.'}`,
        action: 'View Plans',
        onAction: () => {
          if (navigation) {
            navigation.navigate('RenewPlan', { 
              recommendedPlan: usageData.isUnlimited ? '100Mbps' : '150GB',
              reason: 'general_analysis',
              currentUsage: usageData.currentUsage,
              totalData: usageData.totalData
            });
          }
        },
        icon: '📊',
        color: '#9C27B0',
      });
    }



    setInsights(newInsights);
  }, [usageData, authData, navigation]);

  useEffect(() => {
    if (authData) {
      processUsageData();
      generateAIInsights();
    }
  }, [authData, processUsageData, generateAIInsights]);

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'warning': return '⚠️';
      case 'recommendation': return '💡';
      case 'info': return 'ℹ️';
      case 'savings': return '💰';
      default: return '🤖';
    }
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'warning': return '#FF9800';
      case 'recommendation': return '#2196F3';
      case 'info': return '#9C27B0';
      case 'savings': return '#4CAF50';
      default: return '#607D8B';
    }
  };



  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>
          🤖 AI Insights
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Personalized recommendations based on your usage
        </Text>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading AI insights...
          </Text>
        </View>
      ) : (
        <View style={styles.usageSummary}>
          <View style={styles.usageItem}>
            <Text style={[styles.usageLabel, { color: colors.textSecondary }]}>
              Current Usage
            </Text>
            <Text style={[styles.usageValue, { color: colors.text }]}>
              {usageData.isUnlimited ? 
                `${usageData.currentUsage.toFixed(2)}GB / Unlimited` : 
                `${usageData.currentUsage.toFixed(2)}GB / ${usageData.totalData.toFixed(2)}GB`
              }
            </Text>
            {!usageData.isUnlimited && (
              <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
                <View 
                  style={[
                    styles.progressFill, 
                    { 
                      width: `${Math.min((usageData.currentUsage / usageData.totalData) * 100, 100)}%`,
                      backgroundColor: (usageData.currentUsage / usageData.totalData) > 0.8 ? '#FF9800' : colors.primary
                    }
                  ]} 
                />
              </View>
            )}
          </View>

          <View style={styles.prediction}>
            <Text style={[styles.predictionLabel, { color: colors.textSecondary }]}>
              AI Prediction
            </Text>
            <Text style={[styles.predictionValue, { color: colors.text }]}>
              {usageData.isUnlimited ? 
                `${usageData.predictedUsage.toFixed(2)}GB by month end` :
                `${usageData.predictedUsage.toFixed(2)}GB by month end`
              }
            </Text>
          </View>
        </View>
      )}

      <View style={styles.insightsContainer}>
        {insights.map((insight, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.insightCard,
              { 
                backgroundColor: colors.surface,
                borderLeftColor: insight.color,
                borderLeftWidth: 4,
              }
            ]}
            onPress={insight.onAction}
          >
            <View style={styles.insightHeader}>
              <Text style={styles.insightIcon}>{insight.icon}</Text>
              <Text style={[styles.insightTitle, { color: colors.text }]}>
                {insight.title}
              </Text>
            </View>
            
            <Text style={[styles.insightMessage, { color: colors.textSecondary }]}>
              {insight.message}
            </Text>
            
            {insight.action && (
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: insight.color }]}
                onPress={insight.onAction}
              >
                <Text style={styles.actionText}>{insight.action}</Text>
              </TouchableOpacity>
            )}
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.aiFooter}>
        <Text style={[styles.aiFooterText, { color: colors.textSecondary }]}>
          💡 AI analyzes your usage patterns every hour for personalized insights
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    margin: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
  },
  usageSummary: {
    marginBottom: 20,
  },
  usageItem: {
    marginBottom: 16,
  },
  usageLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  usageValue: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  prediction: {
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(33, 150, 243, 0.1)',
  },
  predictionLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  predictionValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  insightsContainer: {
    gap: 12,
  },
  insightCard: {
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  insightIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  insightMessage: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  actionButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  actionText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  aiFooter: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  aiFooterText: {
    fontSize: 12,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
});

export default AIUsageInsights; 