import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
  ActivityIndicator,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useTheme} from '../utils/ThemeContext';
import {getThemeColors} from '../utils/themeStyles';
import CommonHeader from '../components/CommonHeader';
import {useTranslation} from 'react-i18next';

interface Offer {
  id: string;
  title: string;
  description: string;
  reward: string;
  type: 'referral' | 'survey' | 'app' | 'shopping' | 'cashback';
  status: 'active' | 'completed' | 'pending';
  icon: string;
  color: string;
  actionText: string;
  url?: string;
  requirements?: string[];
  expiryDate?: string;
}

const OffersScreen = ({navigation}: any) => {
  const {isDark} = useTheme();
  const colors = getThemeColors(isDark);
  const {t} = useTranslation();
  
  const [isLoading, setIsLoading] = useState(false);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [offers, setOffers] = useState<Offer[]>([]);

  useEffect(() => {
    fetchOffers();
  }, []);

  const fetchOffers = async () => {
    setIsLoading(true);
    try {
      // Mock data - replace with real API call later
      const mockOffers: Offer[] = [
        {
          id: '1',
          title: 'Refer Friends & Earn',
          description: 'Invite friends to join our network and earn ₹100 for each successful referral',
          reward: '₹100 per referral',
          type: 'referral',
          status: 'active',
          icon: '👥',
          color: '#4CAF50',
          actionText: 'Share Referral Link',
          requirements: ['Friend must sign up', 'Complete 1 month subscription'],
        },
        {
          id: '2',
          title: 'Complete Surveys',
          description: 'Share your opinion and earn rewards for each completed survey',
          reward: '₹50-200 per survey',
          type: 'survey',
          status: 'active',
          icon: '📊',
          color: '#2196F3',
          actionText: 'Start Survey',
          url: 'https://surveys.example.com',
        },
        {
          id: '3',
          title: 'Download Partner Apps',
          description: 'Try our partner apps and earn instant rewards',
          reward: '₹25-100 per app',
          type: 'app',
          status: 'active',
          icon: '📱',
          color: '#FF9800',
          actionText: 'View Apps',
          requirements: ['Install app', 'Use for 7 days'],
        },
        {
          id: '4',
          title: 'Shopping Cashback',
          description: 'Shop through our affiliate links and get cashback on purchases',
          reward: '2-15% cashback',
          type: 'shopping',
          status: 'active',
          icon: '🛒',
          color: '#9C27B0',
          actionText: 'Shop Now',
          url: 'https://shop.example.com',
        },
        {
          id: '5',
          title: 'Refer Business Clients',
          description: 'Refer business clients and earn higher rewards',
          reward: '₹500 per business referral',
          type: 'referral',
          status: 'active',
          icon: '🏢',
          color: '#607D8B',
          actionText: 'Refer Business',
          requirements: ['Business must sign up', 'Minimum 6 months contract'],
        },
        {
          id: '6',
          title: 'Social Media Promotion',
          description: 'Share our posts on social media and earn rewards',
          reward: '₹25 per post',
          type: 'referral',
          status: 'active',
          icon: '📢',
          color: '#E91E63',
          actionText: 'Share Now',
          requirements: ['Minimum 100 followers', 'Post must be public'],
        },
      ];

      setOffers(mockOffers);
      setTotalEarnings(1250); // Mock total earnings
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to fetch offers');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOfferAction = async (offer: Offer) => {
    if (offer.url) {
      try {
        await Linking.openURL(offer.url);
      } catch (error) {
        Alert.alert('Error', 'Could not open the link');
      }
    } else {
      // Handle internal actions
      switch (offer.type) {
        case 'referral':
          handleReferralAction(offer);
          break;
        case 'survey':
          handleSurveyAction(offer);
          break;
        case 'app':
          handleAppAction(offer);
          break;
        case 'shopping':
          handleShoppingAction(offer);
          break;
        default:
          Alert.alert('Coming Soon', 'This feature will be available soon!');
      }
    }
  };

  const handleReferralAction = (offer: Offer) => {
    Alert.alert(
      'Share Referral Link',
      'Share your unique referral link with friends and family to earn rewards!',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Share',
          onPress: () => {
            // Mock sharing functionality
            Alert.alert('Success', 'Referral link shared! You\'ll earn rewards when friends sign up.');
          },
        },
      ]
    );
  };

  const handleSurveyAction = (offer: Offer) => {
    Alert.alert(
      'Start Survey',
      'Complete surveys to earn rewards. Each survey takes 5-15 minutes.',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Start',
          onPress: () => {
            Alert.alert('Survey Started', 'Redirecting to survey...');
          },
        },
      ]
    );
  };

  const handleAppAction = (offer: Offer) => {
    Alert.alert(
      'Download Partner Apps',
      'Download and use our partner apps to earn instant rewards.',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'View Apps',
          onPress: () => {
            Alert.alert('Partner Apps', 'Available apps will be shown here.');
          },
        },
      ]
    );
  };

  const handleShoppingAction = (offer: Offer) => {
    Alert.alert(
      'Shopping Cashback',
      'Shop through our affiliate links to earn cashback on your purchases.',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Shop Now',
          onPress: () => {
            Alert.alert('Shopping', 'Redirecting to partner stores...');
          },
        },
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return colors.success;
      case 'completed':
        return colors.primary;
      case 'pending':
        return colors.warning;
      default:
        return colors.textSecondary;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Active';
      case 'completed':
        return 'Completed';
      case 'pending':
        return 'Pending';
      default:
        return 'Unknown';
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, {backgroundColor: colors.background}]}>
        <CommonHeader navigation={navigation} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, {color: colors.text}]}>Loading offers...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, {backgroundColor: colors.background}]}>
      <CommonHeader navigation={navigation} />
      
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Earnings Summary */}
          <View style={[styles.earningsCard, {backgroundColor: colors.card}]}>
            <View style={styles.earningsHeader}>
              <Text style={[styles.earningsTitle, {color: colors.text}]}>Total Earnings</Text>
              <Text style={[styles.earningsAmount, {color: colors.primary}]}>₹{totalEarnings}</Text>
            </View>
            <View style={styles.earningsStats}>
              <View style={styles.statItem}>
                <Text style={[styles.statNumber, {color: colors.success}]}>12</Text>
                <Text style={[styles.statLabel, {color: colors.textSecondary}]}>Referrals</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statNumber, {color: colors.primary}]}>8</Text>
                <Text style={[styles.statLabel, {color: colors.textSecondary}]}>Surveys</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statNumber, {color: colors.accent}]}>₹500</Text>
                <Text style={[styles.statLabel, {color: colors.textSecondary}]}>This Month</Text>
              </View>
            </View>
          </View>

          {/* Offers Section */}
          <View style={styles.offersSection}>
            <Text style={[styles.sectionTitle, {color: colors.text}]}>Available Offers</Text>
            <Text style={[styles.sectionSubtitle, {color: colors.textSecondary}]}>
              Complete offers to earn extra income
            </Text>
          </View>

          {/* Offers List */}
          {offers.map((offer) => (
            <View key={offer.id} style={[styles.offerCard, {backgroundColor: colors.card}]}>
              <View style={styles.offerHeader}>
                <View style={[styles.offerIcon, {backgroundColor: offer.color + '20'}]}>
                  <Text style={styles.iconText}>{offer.icon}</Text>
                </View>
                <View style={styles.offerInfo}>
                  <Text style={[styles.offerTitle, {color: colors.text}]}>{offer.title}</Text>
                  <Text style={[styles.offerDescription, {color: colors.textSecondary}]}>
                    {offer.description}
                  </Text>
                </View>
                <View style={[styles.statusBadge, {backgroundColor: getStatusColor(offer.status) + '20'}]}>
                  <Text style={[styles.statusText, {color: getStatusColor(offer.status)}]}>
                    {getStatusText(offer.status)}
                  </Text>
                </View>
              </View>

              <View style={styles.offerDetails}>
                <View style={styles.rewardSection}>
                  <Text style={[styles.rewardLabel, {color: colors.textSecondary}]}>Reward:</Text>
                  <Text style={[styles.rewardAmount, {color: colors.success}]}>{offer.reward}</Text>
                </View>

                {offer.requirements && offer.requirements.length > 0 && (
                  <View style={styles.requirementsSection}>
                    <Text style={[styles.requirementsTitle, {color: colors.textSecondary}]}>Requirements:</Text>
                    {offer.requirements.map((req, index) => (
                      <Text key={index} style={[styles.requirement, {color: colors.textSecondary}]}>
                        • {req}
                      </Text>
                    ))}
                  </View>
                )}

                <TouchableOpacity
                  style={[styles.actionButton, {backgroundColor: offer.color}]}
                  onPress={() => handleOfferAction(offer)}
                >
                  <Text style={[styles.actionButtonText, {color: '#ffffff'}]}>
                    {offer.actionText}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}

          {/* How It Works */}
          <View style={[styles.howItWorksCard, {backgroundColor: colors.card}]}>
            <Text style={[styles.howItWorksTitle, {color: colors.text}]}>How It Works</Text>
            <View style={styles.stepsContainer}>
              <View style={styles.step}>
                <View style={[styles.stepNumber, {backgroundColor: colors.primary}]}>
                  <Text style={styles.stepNumberText}>1</Text>
                </View>
                <Text style={[styles.stepText, {color: colors.text}]}>Choose an offer</Text>
              </View>
              <View style={styles.step}>
                <View style={[styles.stepNumber, {backgroundColor: colors.primary}]}>
                  <Text style={styles.stepNumberText}>2</Text>
                </View>
                <Text style={[styles.stepText, {color: colors.text}]}>Complete the task</Text>
              </View>
              <View style={styles.step}>
                <View style={[styles.stepNumber, {backgroundColor: colors.primary}]}>
                  <Text style={styles.stepNumberText}>3</Text>
                </View>
                <Text style={[styles.stepText, {color: colors.text}]}>Earn rewards</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  earningsCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  earningsHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  earningsTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  earningsAmount: {
    fontSize: 32,
    fontWeight: '700',
  },
  earningsStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  offersSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
  },
  offerCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  offerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  offerIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  iconText: {
    fontSize: 24,
  },
  offerInfo: {
    flex: 1,
  },
  offerTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  offerDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  offerDetails: {
    gap: 12,
  },
  rewardSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rewardLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  rewardAmount: {
    fontSize: 16,
    fontWeight: '700',
  },
  requirementsSection: {
    gap: 4,
  },
  requirementsTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  requirement: {
    fontSize: 12,
    lineHeight: 16,
  },
  actionButton: {
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  howItWorksCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  howItWorksTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
  },
  stepsContainer: {
    gap: 16,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumberText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  stepText: {
    fontSize: 16,
    fontWeight: '500',
  },
});

export default OffersScreen; 