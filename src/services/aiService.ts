import { apiService } from './api';
import sessionManager from './sessionManager';

export interface AIUsageData {
  currentUsage: number;
  totalData: number;
  daysUsed: number;
  daysRemaining: number;
  averageDailyUsage: number;
  predictedUsage: number;
  usagePercentage: number;
  isUnlimited: boolean;
}

export interface AIInsight {
  type: 'warning' | 'recommendation' | 'info' | 'savings' | 'alert';
  title: string;
  message: string;
  action?: string;
  priority: 'high' | 'medium' | 'low';
  icon: string;
  color: string;
}

export interface AINotification {
  id: string;
  type: 'alert' | 'recommendation' | 'reminder' | 'info';
  title: string;
  message: string;
  priority: 'high' | 'medium' | 'low';
  timestamp: Date;
  action?: string;
  icon: string;
  color: string;
  isRead: boolean;
}

class AIService {
  private userData: any = null;

  async fetchUserData(): Promise<any> {
    try {
      const session = await sessionManager.getCurrentSession();
      if (!session) {
        throw new Error('No active session found');
      }

      const { username } = session;
      const authResponse = await apiService.makeAuthenticatedRequest(async (token) => {
        return await apiService.authUser(username);
      });

      this.userData = authResponse;
      return authResponse;
    } catch (error) {
      console.error('Error fetching user data for AI service:', error);
      throw error;
    }
  }

  processUsageData(): AIUsageData {
    if (!this.userData) {
      throw new Error('User data not available');
    }

    const usageDetails = this.userData.usage_details?.[0];
    if (!usageDetails) {
      throw new Error('Usage details not available');
    }

    const dataUsed = usageDetails.data_used || '0';
    const dataAllotted = usageDetails.plan_data || '100 GB';
    const daysUsed = parseInt(usageDetails.days_used || '0');
    const daysAllotted = parseInt(usageDetails.plan_days || '30');
    
    const dataUsedGB = parseFloat(dataUsed) / (1024 * 1024 * 1024);
    const isUnlimited = dataAllotted === 'Unlimited';
    const planDataGB = isUnlimited ? 1000 : parseFloat(dataAllotted.split(' ')[0]);
    const daysRemaining = daysAllotted - daysUsed;
    const averageDailyUsage = daysUsed > 0 ? dataUsedGB / daysUsed : 0;
    const predictedUsage = averageDailyUsage * daysAllotted;
    const usagePercentage = isUnlimited ? 0 : (dataUsedGB / planDataGB) * 100;

    return {
      currentUsage: dataUsedGB,
      totalData: planDataGB,
      daysUsed: daysUsed,
      daysRemaining: daysRemaining,
      averageDailyUsage: averageDailyUsage,
      predictedUsage: predictedUsage,
      usagePercentage: usagePercentage,
      isUnlimited: isUnlimited,
    };
  }

  generateUsageInsights(): AIInsight[] {
    const usageData = this.processUsageData();
    const insights: AIInsight[] = [];

    // High usage warning
    if (usageData.usagePercentage > 80) {
      insights.push({
        type: 'warning',
        title: 'High Data Usage Alert',
        message: `You've used ${usageData.usagePercentage.toFixed(0)}% of your data. At current rate, you'll exceed your plan by ${(usageData.predictedUsage - usageData.totalData).toFixed(2)}GB.`,
        action: 'Upgrade Plan',
        priority: 'high',
        icon: '⚠️',
        color: '#FF9800',
      });
    }

    // Usage pattern analysis
    if (usageData.averageDailyUsage > 4) {
      insights.push({
        type: 'info',
        title: 'Usage Pattern Detected',
        message: `You typically use ${usageData.averageDailyUsage.toFixed(2)}GB daily. Consider a higher data plan for better value.`,
        action: 'View Plans',
        priority: 'medium',
        icon: '📊',
        color: '#2196F3',
      });
    }

    // Cost savings opportunity
    if (usageData.usagePercentage < 50 && usageData.daysUsed > 10) {
      insights.push({
        type: 'savings',
        title: 'Cost Savings Opportunity',
        message: `You're using only ${usageData.usagePercentage.toFixed(0)}% of your plan. Consider downgrading to save money.`,
        action: 'Downgrade',
        priority: 'medium',
        icon: '💰',
        color: '#4CAF50',
      });
    }

    // Days remaining alert
    if (usageData.daysRemaining <= 7) {
      insights.push({
        type: 'alert',
        title: 'Plan Expiring Soon',
        message: `Your plan expires in ${usageData.daysRemaining} days. Renew now to avoid service interruption.`,
        action: 'Renew Now',
        priority: 'high',
        icon: '⏰',
        color: '#F44336',
      });
    }

    // Peak usage time (always show as general info)
    insights.push({
      type: 'info',
      title: 'Peak Usage Time',
      message: 'Your highest usage is between 8-10 PM. Consider scheduling downloads during off-peak hours.',
      action: 'Learn More',
      priority: 'low',
      icon: '⏰',
      color: '#9C27B0',
    });

    return insights;
  }

  generateSmartNotifications(): AINotification[] {
    if (!this.userData) return [];

    const currentDate = new Date();
    const notifications: AINotification[] = [];
    const usageData = this.processUsageData();

    const planPrice = this.userData.planPrice || '₹1200';
    const paymentDues = this.userData.paymentDues || '0';
    const currentPlan = this.userData.currentPlan || 'Basic Plan';

    // High usage alert
    if (usageData.usagePercentage > 80) {
      notifications.push({
        id: '1',
        type: 'alert',
        title: 'High Data Usage Alert',
        message: `You've used ${usageData.usagePercentage.toFixed(0)}% of your monthly data. At current rate, you'll exceed your plan by ${(usageData.predictedUsage - usageData.totalData).toFixed(2)}GB.`,
        priority: 'high',
        timestamp: new Date(currentDate.getTime() - 2 * 60 * 60 * 1000),
        action: 'Upgrade Plan',
        icon: '⚠️',
        color: '#FF5722',
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
        icon: '💰',
        color: '#FF9800',
        isRead: false,
      });
    }

    // Plan optimization
    if (usageData.usagePercentage < 60 && usageData.daysUsed > 10) {
      notifications.push({
        id: '3',
        type: 'recommendation',
        title: 'Plan Optimization',
        message: `You're consistently using ${usageData.usagePercentage.toFixed(0)}% of your plan. Consider downgrading to save money.`,
        priority: 'medium',
        timestamp: new Date(currentDate.getTime() - 6 * 60 * 60 * 1000),
        action: 'View Plans',
        icon: '💡',
        color: '#2196F3',
        isRead: true,
      });
    }

    // Plan expiry warning
    if (usageData.daysRemaining <= 7) {
      notifications.push({
        id: '4',
        type: 'alert',
        title: 'Plan Expiring Soon',
        message: `Your ${currentPlan} expires in ${usageData.daysRemaining} days. Renew now to avoid service interruption.`,
        priority: 'high',
        timestamp: new Date(currentDate.getTime() - 8 * 60 * 60 * 1000),
        action: 'Renew Now',
        icon: '⏰',
        color: '#F44336',
        isRead: false,
      });
    }

    // Usage pattern insight
    if (usageData.averageDailyUsage > 4) {
      notifications.push({
        id: '5',
        type: 'info',
        title: 'High Daily Usage Detected',
        message: `You're using ${usageData.averageDailyUsage.toFixed(2)}GB daily. Consider a higher data plan for better value.`,
        priority: 'medium',
        timestamp: new Date(currentDate.getTime() - 12 * 60 * 60 * 1000),
        action: 'View Plans',
        icon: '📊',
        color: '#4CAF50',
        isRead: true,
      });
    }

    return notifications;
  }

  generateChatResponse(userQuery: string): { text: string; actions: string[] } {
    const usageData = this.processUsageData();
    const planPrice = this.userData?.planPrice || '₹1200';
    const paymentDues = this.userData?.paymentDues || '0';
    const currentPlan = this.userData?.currentPlan || 'Basic Plan';

    const query = userQuery.toLowerCase();

    if (query.includes('bill') || query.includes('pay')) {
      return {
        text: `I can help you with bill payment! You have several options:\n\n💳 **Online Payment**: Use the Pay Bill section in the app\n🏦 **Bank Transfer**: Use your account details\n🏪 **Cash Payment**: Visit any authorized center\n\nYour current plan: ${currentPlan} (${planPrice})\nPayment dues: ₹${paymentDues}\n\nWould you like me to help you pay now?`,
        actions: ['Pay Now', 'View Bill Details', 'Set Auto-Pay'],
      };
    }

    if (query.includes('upgrade') || query.includes('plan')) {
      return {
        text: `Great! Let me show you available plans based on your usage:\n\n📊 **Your current usage**: ${usageData.currentUsage.toFixed(2)}GB/${usageData.totalData.toFixed(2)}GB (${usageData.usagePercentage.toFixed(0)}%)\n💡 **Current Plan**: ${currentPlan} (${planPrice})\n\nAvailable upgrades:\n• 150GB - ₹1,600/month\n• 200GB - ₹1,800/month\n• Unlimited - ₹2,000/month\n\nWhich plan interests you?`,
        actions: ['150GB Plan', '200GB Plan', 'Unlimited Plan', 'Compare Plans'],
      };
    }

    if (query.includes('slow') || query.includes('internet') || query.includes('speed')) {
      return {
        text: 'I\'m sorry to hear about the slow internet. Let me help you troubleshoot:\n\n🔍 **Quick Checks**:\n• Restart your router\n• Check if other devices are affected\n• Test speed at speedtest.net\n\n📱 **Current Status**: No network issues reported in your area\n\nWould you like me to run a diagnostic test?',
        actions: ['Run Diagnostic', 'Report Issue', 'Contact Human Agent'],
      };
    }

    if (query.includes('usage') || query.includes('data')) {
      return {
        text: `Here's your current usage status:\n\n📊 **Data Usage**: ${usageData.currentUsage.toFixed(2)}GB / ${usageData.totalData.toFixed(2)}GB (${usageData.usagePercentage.toFixed(0)}%)\n📅 **Days Remaining**: ${usageData.daysRemaining} days\n📈 **Daily Average**: ${usageData.averageDailyUsage.toFixed(2)}GB\n\n${usageData.usagePercentage > 80 ? '⚠️ **Alert**: You\'re on track to exceed your plan' : '✅ **Status**: Usage is within normal range'}\n\nWould you like to upgrade your plan or check detailed usage?`,
        actions: ['Upgrade Plan', 'View Details', 'Set Usage Alerts'],
      };
    }

    return {
      text: 'I understand you\'re asking about that. Let me connect you with the right information. Could you please be more specific about what you need help with?',
      actions: ['Bill Payment', 'Technical Support', 'Plan Changes', 'Talk to Human'],
    };
  }

  getPlanRecommendations(): { action: string; reason: string; savings?: number }[] {
    const usageData = this.processUsageData();
    const recommendations = [];

    if (usageData.usagePercentage > 80) {
      recommendations.push({
        action: 'Upgrade Plan',
        reason: `You're using ${usageData.usagePercentage.toFixed(0)}% of your data and will likely exceed your limit`,
      });
    }

    if (usageData.usagePercentage < 50 && usageData.daysUsed > 10) {
      recommendations.push({
        action: 'Downgrade Plan',
        reason: `You're only using ${usageData.usagePercentage.toFixed(0)}% of your plan`,
        savings: 200,
      });
    }

    if (usageData.daysRemaining <= 7) {
      recommendations.push({
        action: 'Renew Plan',
        reason: `Your plan expires in ${usageData.daysRemaining} days`,
      });
    }

    return recommendations;
  }

  getPredictiveAnalytics() {
    const usageData = this.processUsageData();
    
    return {
      predictedUsage: usageData.predictedUsage,
      willExceedPlan: usageData.predictedUsage > usageData.totalData,
      excessAmount: Math.max(0, usageData.predictedUsage - usageData.totalData),
      dailyTrend: usageData.averageDailyUsage,
      daysUntilExceed: usageData.totalData > 0 ? Math.floor((usageData.totalData - usageData.currentUsage) / usageData.averageDailyUsage) : 0,
    };
  }
}

export default new AIService(); 