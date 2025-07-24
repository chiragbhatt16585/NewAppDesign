import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useTheme } from '../utils/ThemeContext';
import { getThemeColors } from '../utils/themeStyles';
import { apiService } from '../services/api';
import sessionManager from '../services/sessionManager';

interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  type: 'text' | 'quick_reply' | 'action';
  actions?: string[];
}

const AISupportChat = ({ navigation }: { navigation?: any }) => {
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      text: 'Hello! I\'m your AI assistant. How can I help you today?',
      isUser: false,
      timestamp: new Date(),
      type: 'text',
      actions: ['Bill Payment', 'Plan Upgrade', 'Technical Issue', 'Usage Query'],
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const session = await sessionManager.getCurrentSession();
      if (!session) return;

      const { username } = session;
      const authResponse = await apiService.makeAuthenticatedRequest(async (token) => {
        return await apiService.authUser(username);
      });
      
      if (authResponse) {
        setUserData(authResponse);
      }
    } catch (error) {
      console.error('Error fetching user data for AI chat:', error);
    }
  };

  const quickReplies = [
    'How to pay my bill?',
    'I want to upgrade my plan',
    'My internet is slow',
    'Check my data usage',
    'Report an issue',
  ];

  const getAIResponses = () => {
    const usageDetails = userData?.usage_details?.[0];
    const dataUsed = usageDetails?.data_used || '0';
    const dataAllotted = usageDetails?.plan_data || '100 GB';
    const daysUsed = parseInt(usageDetails?.days_used || '0');
    const daysAllotted = parseInt(usageDetails?.plan_days || '30');
    const planPrice = userData?.planPrice || '₹1200';
    const currentPlan = userData?.currentPlan || 'Basic Plan';
    const paymentDues = userData?.paymentDues || '0';
    
    const dataUsedGB = parseFloat(dataUsed) / (1024 * 1024 * 1024);
    // Handle plan_data format like "100 GB" or "Unlimited"
    const isUnlimited = dataAllotted === 'Unlimited';
    const planDataGB = isUnlimited ? 1000 : parseFloat(dataAllotted.split(' ')[0]);
    const usagePercentage = isUnlimited ? 0 : (dataUsedGB / planDataGB) * 100;
    const daysRemaining = daysAllotted - daysUsed;

    return {
      'bill': {
        text: `I can help you with bill payment! You have several options:\n\n💳 **Online Payment**: Use the Pay Bill section in the app\n🏦 **Bank Transfer**: Use your account details\n🏪 **Cash Payment**: Visit any authorized center\n\nYour current plan: ${currentPlan} (${planPrice})\nPayment dues: ₹${paymentDues}\n\nWould you like me to help you pay now?`,
        actions: ['Pay Now', 'View Bill Details', 'Set Auto-Pay'],
      },
      'upgrade': {
        text: isUnlimited ? 
          `Great! You're already on an unlimited plan. Let me show you speed upgrade options:\n\n📊 **Your current usage**: ${dataUsedGB.toFixed(2)}GB/Unlimited\n💡 **Current Plan**: ${currentPlan} (${planPrice})\n\nSpeed upgrade options:\n• 100 Mbps - ₹1,500/month\n• 200 Mbps - ₹2,000/month\n• 500 Mbps - ₹3,000/month\n\nWhich speed interests you?` :
          `Great! Let me show you available plans based on your usage:\n\n📊 **Your current usage**: ${dataUsedGB.toFixed(2)}GB/${planDataGB.toFixed(2)}GB (${usagePercentage.toFixed(0)}%)\n💡 **Current Plan**: ${currentPlan} (${planPrice})\n\nAvailable upgrades:\n• 150GB - ₹1,600/month\n• 200GB - ₹1,800/month\n• Unlimited - ₹2,000/month\n\nWhich plan interests you?`,
        actions: isUnlimited ? ['100 Mbps', '200 Mbps', '500 Mbps', 'Compare Speeds'] : ['150GB Plan', '200GB Plan', 'Unlimited Plan', 'Compare Plans'],
      },
      'slow': {
        text: 'I\'m sorry to hear about the slow internet. Let me help you troubleshoot:\n\n🔍 **Quick Checks**:\n• Restart your router\n• Check if other devices are affected\n• Test speed at speedtest.net\n\n📱 **Current Status**: No network issues reported in your area\n\nWould you like me to run a diagnostic test?',
        actions: ['Run Diagnostic', 'Report Issue', 'Contact Human Agent'],
      },
      'usage': {
        text: isUnlimited ?
          `Here's your current usage status:\n\n📊 **Data Usage**: ${dataUsedGB.toFixed(2)}GB / Unlimited\n📅 **Days Remaining**: ${daysRemaining} days\n📈 **Daily Average**: ${(dataUsedGB / daysUsed).toFixed(2)}GB\n\n✅ **Status**: Unlimited data - no usage limits\n\nWould you like to check speed options or detailed usage?` :
          `Here's your current usage status:\n\n📊 **Data Usage**: ${dataUsedGB.toFixed(2)}GB / ${planDataGB.toFixed(2)}GB (${usagePercentage.toFixed(0)}%)\n📅 **Days Remaining**: ${daysRemaining} days\n📈 **Daily Average**: ${(dataUsedGB / daysUsed).toFixed(2)}GB\n\n${usagePercentage > 80 ? '⚠️ **Alert**: You\'re on track to exceed your plan' : '✅ **Status**: Usage is within normal range'}\n\nWould you like to upgrade your plan or check detailed usage?`,
        actions: isUnlimited ? ['Speed Options', 'View Details', 'Set Alerts'] : ['Upgrade Plan', 'View Details', 'Set Usage Alerts'],
      },
      'default': {
        text: 'I understand you\'re asking about that. Let me connect you with the right information. Could you please be more specific about what you need help with?',
        actions: ['Bill Payment', 'Technical Support', 'Plan Changes', 'Talk to Human'],
      },
    };
  };

  const sendMessage = (text: string) => {
    if (!text.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: text.trim(),
      isUser: true,
      timestamp: new Date(),
      type: 'text',
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);

    // Simulate AI thinking time
    setTimeout(() => {
      generateAIResponse(text.toLowerCase());
    }, 1000);
  };

  const generateAIResponse = (userText: string) => {
    const aiResponses = getAIResponses();
    let response = aiResponses.default;

    if (userText.includes('bill') || userText.includes('pay')) {
      response = aiResponses.bill;
    } else if (userText.includes('upgrade') || userText.includes('plan')) {
      response = aiResponses.upgrade;
    } else if (userText.includes('slow') || userText.includes('internet') || userText.includes('speed')) {
      response = aiResponses.slow;
    } else if (userText.includes('usage') || userText.includes('data')) {
      response = aiResponses.usage;
    }

    const aiMessage: ChatMessage = {
      id: (Date.now() + 1).toString(),
      text: response.text,
      isUser: false,
      timestamp: new Date(),
      type: 'text',
      actions: response.actions,
    };

    setMessages(prev => [...prev, aiMessage]);
    setIsTyping(false);
  };

  const handleQuickReply = (reply: string) => {
    sendMessage(reply);
  };

  const handleAction = (action: string) => {
    if (!navigation) {
      Alert.alert('Action', `Processing: ${action}`);
      return;
    }

    switch (action) {
      case 'Pay Now':
      case 'Pay Bill':
        navigation.navigate('PayBill');
        break;
      case 'View Bill Details':
        navigation.navigate('AccountDetails');
        break;
      case 'Upgrade Plan':
      case 'View Plans':
      case '150GB Plan':
      case '200GB Plan':
      case 'Unlimited Plan':
      case '100 Mbps':
      case '200 Mbps':
      case '500 Mbps':
        navigation.navigate('RenewPlan', { 
          recommendedPlan: action.includes('Mbps') ? action : action.replace(' Plan', ''),
          reason: 'chat_recommendation'
        });
        break;
      case 'View Speed Plans':
        navigation.navigate('RenewPlan', { 
          recommendedPlan: '100Mbps',
          reason: 'speed_upgrade',
          planType: 'speed'
        });
        break;
      case 'Check Usage':
      case 'Usage Query':
        navigation.navigate('UsageDetails');
        break;
      case 'Report Issue':
      case 'Technical Issue':
        navigation.navigate('Tickets');
        break;
      default:
        Alert.alert('Action', `Processing: ${action}`);
    }
  };

  const scrollToBottom = () => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          🤖 AI Support Assistant
        </Text>
        <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
          Available 24/7 • Instant responses
        </Text>
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        showsVerticalScrollIndicator={false}
      >
        {messages.map((message) => (
          <View key={message.id} style={styles.messageWrapper}>
            <View
              style={[
                styles.message,
                message.isUser ? styles.userMessage : styles.aiMessage,
                { backgroundColor: message.isUser ? colors.primary : colors.card }
              ]}
            >
              <Text
                style={[
                  styles.messageText,
                  { color: message.isUser ? '#ffffff' : colors.text }
                ]}
              >
                {message.text}
              </Text>
              
              {message.actions && !message.isUser && (
                <View style={styles.actionsContainer}>
                  {message.actions.map((action, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[styles.actionButton, { backgroundColor: colors.primary }]}
                      onPress={() => handleAction(action)}
                    >
                      <Text style={styles.actionButtonText}>{action}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
            
            <Text style={[styles.timestamp, { color: colors.textSecondary }]}>
              {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
        ))}
        
        {isTyping && (
          <View style={styles.messageWrapper}>
            <View style={[styles.message, styles.aiMessage, { backgroundColor: colors.card }]}>
              <View style={styles.typingIndicator}>
                <Text style={[styles.typingText, { color: colors.textSecondary }]}>
                  AI is typing
                </Text>
                <View style={styles.typingDots}>
                  <View style={[styles.dot, { backgroundColor: colors.textSecondary }]} />
                  <View style={[styles.dot, { backgroundColor: colors.textSecondary }]} />
                  <View style={[styles.dot, { backgroundColor: colors.textSecondary }]} />
                </View>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      <View style={styles.quickRepliesContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {quickReplies.map((reply, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.quickReply, { backgroundColor: colors.card }]}
              onPress={() => handleQuickReply(reply)}
            >
              <Text style={[styles.quickReplyText, { color: colors.text }]}>
                {reply}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.inputContainer}>
        <TextInput
          style={[
            styles.textInput,
            {
              backgroundColor: colors.card,
              color: colors.text,
              borderColor: colors.border,
            }
          ]}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Type your message..."
          placeholderTextColor={colors.textSecondary}
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            { backgroundColor: inputText.trim() ? colors.primary : colors.border }
          ]}
          onPress={() => sendMessage(inputText)}
          disabled={!inputText.trim()}
        >
          <Text style={styles.sendButtonText}>📤</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 12,
  },
  messagesContainer: {
    flex: 1,
    padding: 16,
  },
  messageWrapper: {
    marginBottom: 16,
  },
  message: {
    padding: 12,
    borderRadius: 16,
    maxWidth: '80%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  userMessage: {
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  aiMessage: {
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  actionsContainer: {
    marginTop: 12,
    gap: 8,
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  timestamp: {
    fontSize: 10,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typingText: {
    fontSize: 12,
    marginRight: 8,
  },
  typingDots: {
    flexDirection: 'row',
    gap: 2,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    opacity: 0.6,
  },
  quickRepliesContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  quickReply: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  quickReplyText: {
    fontSize: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonText: {
    fontSize: 16,
  },
});

export default AISupportChat; 