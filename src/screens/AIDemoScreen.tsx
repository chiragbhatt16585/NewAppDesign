import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../utils/ThemeContext';
import { getThemeColors } from '../utils/themeStyles';
import CommonHeader from '../components/CommonHeader';
import AIUsageInsights from '../components/AIUsageInsights';
import AISupportChat from '../components/AISupportChat';
import AISmartNotifications from '../components/AISmartNotifications';

const AIDemoScreen = ({ navigation }: any) => {
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);
  const [activeFeature, setActiveFeature] = useState<string | null>(null);

  const aiFeatures = [
    {
      id: 'insights',
      title: '🤖 AI Usage Insights',
      subtitle: 'Personalized usage analysis and recommendations',
      description: 'Analyzes your data usage patterns and provides smart recommendations for plan optimization, cost savings, and usage alerts.',
      icon: '📊',
      color: '#2196F3',
    },
    {
      id: 'support',
      title: '💬 AI Support Chat',
      subtitle: '24/7 intelligent customer support',
      description: 'Get instant help with billing, plan changes, technical issues, and usage queries. AI understands context and provides relevant solutions.',
      icon: '🤖',
      color: '#4CAF50',
    },
    {
      id: 'notifications',
      title: '🔔 Smart Notifications',
      subtitle: 'Proactive alerts and reminders',
      description: 'AI monitors your account and sends personalized notifications for bill payments, usage alerts, maintenance updates, and optimization opportunities.',
      icon: '⚡',
      color: '#FF9800',
    },
  ];

  const renderFeature = () => {
    switch (activeFeature) {
      case 'insights':
        return <AIUsageInsights navigation={navigation} />;
      case 'support':
        return <AISupportChat navigation={navigation} />;
      case 'notifications':
        return <AISmartNotifications navigation={navigation} />;
      default:
        return null;
    }
  };

  const getFeatureTitle = () => {
    const feature = aiFeatures.find(f => f.id === activeFeature);
    return feature?.title || '';
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <CommonHeader navigation={navigation} title="AI Features Demo" />
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>
            🤖 AI-Powered Features
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Experience the future of ISP management with intelligent automation
          </Text>
        </View>

        <View style={styles.featuresContainer}>
          {aiFeatures.map((feature) => (
            <TouchableOpacity
              key={feature.id}
              style={[
                styles.featureCard,
                { 
                  backgroundColor: colors.card,
                  borderLeftColor: feature.color,
                  borderLeftWidth: 4,
                }
              ]}
              onPress={() => setActiveFeature(feature.id)}
            >
              <View style={styles.featureHeader}>
                <Text style={styles.featureIcon}>{feature.icon}</Text>
                <View style={styles.featureInfo}>
                  <Text style={[styles.featureTitle, { color: colors.text }]}>
                    {feature.title}
                  </Text>
                  <Text style={[styles.featureSubtitle, { color: colors.textSecondary }]}>
                    {feature.subtitle}
                  </Text>
                </View>
              </View>
              
              <Text style={[styles.featureDescription, { color: colors.textSecondary }]}>
                {feature.description}
              </Text>
              
              <TouchableOpacity
                style={[styles.tryButton, { backgroundColor: feature.color }]}
                onPress={() => setActiveFeature(feature.id)}
              >
                <Text style={styles.tryButtonText}>Try Demo</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.benefitsSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            🎯 Key Benefits
          </Text>
          
          <View style={styles.benefitsList}>
            {[
              { icon: '⚡', title: 'Instant Responses', desc: 'Get answers in seconds, not hours' },
              { icon: '💰', title: 'Cost Savings', desc: 'AI suggests optimal plans and identifies savings' },
              { icon: '🔍', title: 'Proactive Monitoring', desc: 'Issues detected before you notice them' },
              { icon: '📊', title: 'Smart Analytics', desc: 'Personalized insights based on your usage' },
              { icon: '🛡️', title: '24/7 Availability', desc: 'Support available anytime, anywhere' },
              { icon: '🎯', title: 'Personalized Experience', desc: 'Tailored recommendations just for you' },
            ].map((benefit, index) => (
              <View key={index} style={[styles.benefitItem, { backgroundColor: colors.card }]}>
                <Text style={styles.benefitIcon}>{benefit.icon}</Text>
                <View style={styles.benefitContent}>
                  <Text style={[styles.benefitTitle, { color: colors.text }]}>
                    {benefit.title}
                  </Text>
                  <Text style={[styles.benefitDesc, { color: colors.textSecondary }]}>
                    {benefit.desc}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={[styles.footerTitle, { color: colors.text }]}>
            🚀 Ready to Experience AI?
          </Text>
          <Text style={[styles.footerText, { color: colors.textSecondary }]}>
            These AI features are designed to make your internet experience smarter, faster, and more personalized. Try them out and see the difference!
          </Text>
        </View>
      </ScrollView>

      {/* Feature Demo Modal */}
      <Modal
        visible={!!activeFeature}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setActiveFeature(null)}
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setActiveFeature(null)}
            >
              <Text style={[styles.closeButtonText, { color: colors.text }]}>✕</Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {getFeatureTitle()}
            </Text>
            <View style={styles.placeholder} />
          </View>
          
          <View style={styles.modalContent}>
            {renderFeature()}
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  header: {
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
  featuresContainer: {
    padding: 20,
    gap: 16,
  },
  featureCard: {
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  featureHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  featureInfo: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  featureSubtitle: {
    fontSize: 14,
  },
  featureDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  tryButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  tryButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  benefitsSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  benefitsList: {
    gap: 12,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
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
  benefitIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  benefitContent: {
    flex: 1,
  },
  benefitTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  benefitDesc: {
    fontSize: 14,
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  footerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  footerText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  closeButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  placeholder: {
    width: 32,
  },
  modalContent: {
    flex: 1,
  },
});

export default AIDemoScreen; 