import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../utils/ThemeContext';
import { getThemeColors } from '../utils/themeStyles';
import CommonHeader from '../components/CommonHeader';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

const FAQScreen = ({ navigation }: any) => {
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Static FAQ data
  const faqData: FAQItem[] = [
    // Connection & Setup
    {
      id: '1',
      question: 'How do I set up my internet connection?',
      answer: 'To set up your internet connection, please contact our customer support team. They will guide you through the installation process and ensure proper setup of your modem/router. You can reach us at our support number or visit our office.',
      category: 'connection'
    },
    {
      id: '2',
      question: 'What equipment do I need for internet service?',
      answer: 'You will need a modem/router provided by us, Ethernet cables, and a device to connect (computer, phone, etc.). Our team will install and configure all necessary equipment during setup.',
      category: 'connection'
    },
    {
      id: '3',
      question: 'How long does installation take?',
      answer: 'Standard installation typically takes 2-4 hours. This includes setting up the equipment, testing the connection, and ensuring everything works properly. Our technicians will inform you of the exact timeline.',
      category: 'connection'
    },

    // Billing & Payments
    {
      id: '4',
      question: 'What payment methods do you accept?',
      answer: 'We accept various payment methods including online payments, UPI, credit/debit cards, net banking, and cash payments at our office. You can also set up auto-pay for convenience.',
      category: 'billing'
    },
    {
      id: '5',
      question: 'When is my bill due?',
      answer: 'Your bill is typically due on the 15th of each month. You can check your exact due date in your account dashboard or on your monthly bill statement.',
      category: 'billing'
    },
    {
      id: '6',
      question: 'What happens if I miss a payment?',
      answer: 'Late payments may result in service suspension. We recommend paying on time to avoid any service interruptions. Contact us if you need assistance with payment arrangements.',
      category: 'billing'
    },

    // Speed & Performance
    {
      id: '7',
      question: 'Why is my internet speed slow?',
      answer: 'Slow internet can be caused by multiple devices using bandwidth, outdated equipment, or network congestion. Try restarting your router, closing unnecessary applications, or contact support for assistance.',
      category: 'performance'
    },
    {
      id: '8',
      question: 'How can I check my internet speed?',
      answer: 'You can check your internet speed using online speed test websites or our mobile app. For accurate results, ensure no other devices are using the internet during the test.',
      category: 'performance'
    },
    {
      id: '9',
      question: 'What affects my internet speed?',
      answer: 'Internet speed can be affected by the number of connected devices, router placement, physical obstacles, network congestion, and the type of content you\'re accessing.',
      category: 'performance'
    },

    // Troubleshooting
    {
      id: '10',
      question: 'My internet is not working, what should I do?',
      answer: 'First, check if your modem/router is powered on and all cables are properly connected. Try restarting your equipment. If the issue persists, contact our 24/7 support team.',
      category: 'troubleshooting'
    },
    {
      id: '11',
      question: 'How do I reset my router?',
      answer: 'To reset your router, locate the reset button (usually a small hole) and press it with a paperclip for 10-15 seconds. Note: This will restore factory settings and you\'ll need to reconfigure your network.',
      category: 'troubleshooting'
    },
    {
      id: '12',
      question: 'Why does my connection keep dropping?',
      answer: 'Connection drops can be caused by loose cables, router overheating, or network issues. Check cable connections, ensure proper ventilation around your router, and contact support if the problem continues.',
      category: 'troubleshooting'
    },

    // Plans & Upgrades
    {
      id: '13',
      question: 'How do I upgrade my internet plan?',
      answer: 'You can upgrade your plan through our mobile app, website, or by contacting customer support. Plan changes typically take effect within 24-48 hours.',
      category: 'plans'
    },
    {
      id: '14',
      question: 'Can I change my plan mid-month?',
      answer: 'Yes, you can change your plan at any time. The new plan will be prorated for the remaining days of your billing cycle.',
      category: 'plans'
    },
    {
      id: '15',
      question: 'What is the difference between plans?',
      answer: 'Plans differ in internet speed, data limits (if applicable), and additional features. Higher-tier plans offer faster speeds and more features. Contact us to find the best plan for your needs.',
      category: 'plans'
    },

    // Support & Contact
    {
      id: '16',
      question: 'How can I contact customer support?',
      answer: 'You can reach our customer support team through multiple channels: phone support, live chat on our website, email, or by visiting our office. We offer 24/7 support for urgent issues.',
      category: 'support'
    },
    {
      id: '17',
      question: 'What are your support hours?',
      answer: 'Our general support is available from 8:00 AM to 8:00 PM daily. For urgent technical issues, we provide 24/7 support. Emergency support is always available.',
      category: 'support'
    },
    {
      id: '18',
      question: 'How do I report a service outage?',
      answer: 'Report service outages through our mobile app, website, or by calling our support number. We prioritize outage reports and work to restore service as quickly as possible.',
      category: 'support'
    }
  ];

  const categories = [
    { id: 'all', name: 'All Questions', icon: '❓' },
    { id: 'connection', name: 'Connection', icon: '🔌' },
    { id: 'billing', name: 'Billing', icon: '💰' },
    { id: 'performance', name: 'Speed & Performance', icon: '⚡' },
    { id: 'troubleshooting', name: 'Troubleshooting', icon: '🔧' },
    { id: 'plans', name: 'Plans & Upgrades', icon: '📋' },
    { id: 'support', name: 'Support & Contact', icon: '📞' },
  ];

  const filteredFAQs = selectedCategory === 'all' 
    ? faqData 
    : faqData.filter(faq => faq.category === selectedCategory);

  const toggleExpanded = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const renderFAQItem = (faq: FAQItem) => {
    const isExpanded = expandedId === faq.id;
    
    return (
      <View key={faq.id} style={[styles.faqItem, { backgroundColor: colors.card }]}>
        <TouchableOpacity
          style={styles.questionContainer}
          onPress={() => toggleExpanded(faq.id)}
          activeOpacity={0.7}
        >
          <Text style={[styles.question, { color: colors.text }]}>
            {faq.question}
          </Text>
          <Text style={[styles.expandIcon, { color: colors.primary }]}>
            {isExpanded ? '−' : '+'}
          </Text>
        </TouchableOpacity>
        
        {isExpanded && (
          <View style={styles.answerContainer}>
            <Text style={[styles.answer, { color: colors.textSecondary }]}>
              {faq.answer}
            </Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <CommonHeader navigation={navigation} />
      
      <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
        {/* Header Section */}
        <View style={styles.headerSection}>
          <Text style={[styles.title, { color: colors.text }]}>
            Frequently Asked Questions
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Find answers to common questions about our services
          </Text>
        </View>

        {/* Category Filter */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.categoryScrollView}
          contentContainerStyle={styles.categoryContainer}
        >
          {categories.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryButton,
                { 
                  backgroundColor: selectedCategory === category.id 
                    ? colors.primary 
                    : colors.surface,
                  borderColor: colors.border
                }
              ]}
              onPress={() => setSelectedCategory(category.id)}
            >
              <Text style={styles.categoryIcon}>{category.icon}</Text>
              <Text style={[
                styles.categoryText,
                { 
                  color: selectedCategory === category.id 
                    ? 'white' 
                    : colors.text 
                }
              ]}>
                {category.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* FAQ List */}
        <View style={styles.faqContainer}>
          {filteredFAQs.length > 0 ? (
            filteredFAQs.map(renderFAQItem)
          ) : (
            <View style={styles.emptyState}>
              <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
                No questions found for this category.
              </Text>
            </View>
          )}
        </View>

        {/* Contact Support Section */}
        <View style={[styles.contactSection, { backgroundColor: colors.card }]}>
          <Text style={[styles.contactTitle, { color: colors.text }]}>
            Still need help?
          </Text>
          <Text style={[styles.contactText, { color: colors.textSecondary }]}>
            Can't find the answer you're looking for? Our support team is here to help.
          </Text>
          <TouchableOpacity
            style={[styles.contactButton, { backgroundColor: colors.primary }]}
            onPress={() => navigation.navigate('ContactUs')}
          >
            <Text style={styles.contactButtonText}>Contact Support</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  headerSection: {
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
  categoryScrollView: {
    marginBottom: 20,
  },
  categoryContainer: {
    paddingHorizontal: 20,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 25,
    marginRight: 12,
    borderWidth: 1,
    minWidth: 100,
  },
  categoryIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
  },
  faqContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  faqItem: {
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  questionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  question: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    marginRight: 16,
    lineHeight: 22,
  },
  expandIcon: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  answerContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  answer: {
    fontSize: 15,
    lineHeight: 22,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    textAlign: 'center',
  },
  contactSection: {
    margin: 20,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
  },
  contactTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  contactText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  contactButton: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  contactButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default FAQScreen;
