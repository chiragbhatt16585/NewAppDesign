import React, {useState, useEffect, useMemo} from 'react';
import {useFocusEffect} from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  FlatList,
  Alert,
  Modal,
  ActivityIndicator,
  Image,
} from 'react-native';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTheme} from '../utils/ThemeContext';
import {getThemeColors} from '../utils/themeStyles';
import CommonHeader from '../components/CommonHeader';
import {useTranslation} from 'react-i18next';
import {apiService} from '../services/api';
import sessionManager from '../services/sessionManager';
import dataCache from '../services/dataCache';

interface Plan {
  id: string;
  name: string;
  description?: string;
  downloadSpeed: string;
  uploadSpeed: string;
  days: number;
  FinalAmount: number;
  amt: number;
  CGSTAmount: number;
  SGSTAmount: number;
  limit: string;
  content_providers?: Array<{
    content_provider: string;
    app_logo_file: string;
    full_path_app_logo_file: string;
  }>;
  isExpanded?: boolean;
  ott_plan?: string;
  voice_plan?: string;
  fup_flag?: string;
  iptv?: string;
}

const UpgradePlanScreen = ({navigation}: any) => {
  const {isDark} = useTheme();
  const colors = getThemeColors(isDark);
  const {t} = useTranslation();
  const insets = useSafeAreaInsets();

  const [isLoading, setIsLoading] = useState(true);
  const [plansData, setPlansData] = useState<Plan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [authData, setAuthData] = useState<any>(null);
  const [payDues, setPayDues] = useState(0);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showSortModal, setShowSortModal] = useState(false);
  const [sortOption, setSortOption] = useState('');
  const [filters, setFilters] = useState({
    speed: '',
    validity: '',
    price: '',
    gbLimit: '',
    ottPlan: '',
    voipPlan: '',
    iptvPlan: '',
    fupPlan: '',
  });

  useEffect(() => {
    // Clear cache and load fresh data when component mounts
    const initializeData = async () => {
      await dataCache.clearAllCache();
      loadPlanData();
    };
    initializeData();
  }, []);

  // Refresh data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      const refreshData = async () => {
        await dataCache.clearAllCache();
        loadPlanData();
      };
      refreshData();
    }, [])
  );

  const loadPlanData = async (forceRefresh = false) => {
    try {
      setIsLoading(true);
      
      // Get current session
      const session = await sessionManager.getCurrentSession();
      if (!session) {
        Alert.alert('Error', 'Please login again');
        navigation.navigate('Login');
        return;
      }

      const {username} = session;
      
      // Always fetch fresh data for UpgradePlanScreen
      // console.log('Fetching fresh data from API');
      
      // Get user authentication data
      const authResponse = await apiService.makeAuthenticatedRequest(async (token) => {
        return await apiService.authUser(username);
      });
      console.log('=== AUTH RESPONSE ===');
      console.log('Full Auth Response:', JSON.stringify(authResponse, null, 2));
      console.log('Current Plan:', authResponse?.current_plan);
      console.log('Current Plan1:', authResponse?.current_plan1);
      console.log('Plan Price:', authResponse?.plan_price);
      console.log('Admin Login ID:', authResponse?.admin_login_id);
      console.log('=== END AUTH RESPONSE ===');
      setAuthData(authResponse);

      // Get admin tax info
      const taxInfo = await apiService.getAdminTaxInfo(authResponse.admin_login_id, 'default');
      console.log('=== TAX INFO ===');
      console.log('Tax Info:', JSON.stringify(taxInfo, null, 2));
      console.log('Show All Plans:', taxInfo?.isShowAllPlan);
      console.log('=== END TAX INFO ===');
      
      // Get payment dues
      const duesResponse = await apiService.userPaymentDues(username, 'default');
      const payDuesAmount = duesResponse ? Math.round(parseFloat(duesResponse)) : 0;
      setPayDues(payDuesAmount);
      console.log('=== PAYMENT DUES ===');
      console.log('Dues Response:', duesResponse);
      console.log('Dues Amount:', payDuesAmount);
      console.log('=== END PAYMENT DUES ===');

      // Get plan list
      const isShowAllPlan = taxInfo?.isShowAllPlan || false;
      
      let planList: any[] = [];
      try {
        planList = await apiService.planList(
          authResponse.admin_login_id,
          username,
          authResponse.current_plan1,
          isShowAllPlan,
          false, // is_dashboard
          'default'
        );
        
        // Filter out current plan and only show higher plans
        const currentPlanName = authResponse.current_plan || authResponse.current_plan1;
        const currentPlanPrice = authResponse.plan_price || 0;
        
        const upgradePlans = planList.filter((plan: any) => {
          // Filter out current plan by name
          if (plan.name === currentPlanName) {
            return false;
          }
          
          // Filter out plans with same or lower price
          if (plan.FinalAmount <= currentPlanPrice) {
            return false;
          }
          
          return true;
        });
        
        console.log('=== UPGRADE PLAN FILTERING ===');
        console.log('Current Plan:', currentPlanName);
        console.log('Current Plan Price:', currentPlanPrice);
        console.log('Total Plans:', planList.length);
        console.log('Full Plan List:', JSON.stringify(planList, null, 2));
        console.log('Upgrade Plans:', upgradePlans.length);
        console.log('Filtered Upgrade Plans:', JSON.stringify(upgradePlans, null, 2));
        console.log('=== END UPGRADE PLAN FILTERING ===');
        
        setPlansData(upgradePlans);
      } catch (planError: any) {
        console.error('=== PLAN API ERROR ===');
        console.error('Error:', planError);
        console.error('Error Message:', planError.message);
        console.error('Error Stack:', planError.stack);
        console.error('=== END PLAN API ERROR ===');
        
        // Set empty array if API fails
        setPlansData([]);
        return; // Exit early if plan API fails
      }

      // Cache the data
      await dataCache.setUserData({
        authData: authResponse,
        plansData: planList,
        taxInfo: taxInfo,
        payDues: payDuesAmount,
        lastUpdated: Date.now()
      });

    } catch (error: any) {
      console.error('Load plan data error:', error);
      
      // Handle specific authentication errors
      if (error.message?.includes('Session expired') || 
          error.message?.includes('Authentication required') || 
          error.message?.includes('Authentication failed') ||
          error.message?.includes('login again')) {
        Alert.alert(
          'Session Expired', 
          'Your session has expired. Please login again.',
          [
            {
              text: 'OK',
              onPress: () => navigation.navigate('Login')
            }
          ]
        );
      } else {
        Alert.alert('Error', error.message || 'Failed to load plan data');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Convert speed to Mbps format (e.g., 61440 -> "60 Mbps")
  const formatSpeed = (speed: string | undefined): string => {
    if (!speed) return 'N/A';
    
    // Check if already contains "Mbps" or "mbps"
    const lowerSpeed = speed.toLowerCase();
    if (lowerSpeed.includes('mbps') || lowerSpeed.includes('mb')) {
      // Extract number and return as is
      const numericValue = parseFloat(speed.replace(/[^0-9.]/g, ''));
      if (!isNaN(numericValue)) {
        return `${Math.round(numericValue)} Mbps`;
      }
    }
    
    // Extract numeric value
    const numericValue = parseInt(speed.replace(/[^0-9]/g, ''));
    
    if (isNaN(numericValue) || numericValue === 0) return 'N/A';
    
    // If the value is large (like 61440 Kbps), convert to Mbps
    // Values >= 1000 are likely in Kbps, convert to Mbps
    if (numericValue >= 1000) {
      const mbps = numericValue / 1024;
      // Round to nearest integer
      const rounded = Math.round(mbps);
      return `${rounded} Mbps`;
    }
    
    // If already in reasonable range (< 1000), assume it's already in Mbps
    return `${numericValue} Mbps`;
  };

  // Calculate total amount including taxes (amount + CGST + SGST) and round it
  const calculateTotalAmount = (plan: Plan): number => {
    const baseAmount = plan.amt || plan.FinalAmount || 0;
    const cgst = plan.CGSTAmount || 0;
    const sgst = plan.SGSTAmount || 0;
    const total = baseAmount + cgst + sgst;
    return Math.round(total);
  };

  const handlePlanSelect = (plan: Plan) => {
    setSelectedPlan(plan);
  };

  const handlePlanExpand = (planId: string) => {
    setPlansData(prevPlans => 
      prevPlans.map(plan => {
        if (plan.id === planId) {
          plan.isExpanded = !plan.isExpanded;
        } else {
          plan.isExpanded = false;
        }
        return plan;
      })
    );
  };

  const handleRefresh = async () => {
    // console.log('Manual refresh triggered');
    await dataCache.clearAllCache();
    await loadPlanData();
  };

  const getFilteredAndSortedPlans = () => {
    let filteredPlans = [...plansData];

    // Apply filters
    if (filters.speed) {
      filteredPlans = filteredPlans.filter(plan => {
        const speedValue = parseInt(plan.downloadSpeed.replace(/[^0-9]/g, '')) || 0;
        
        switch (filters.speed) {
          case '10 to 50 Mbps':
            return speedValue >= 10 && speedValue <= 50;
          case '50 to 100 Mbps':
            return speedValue > 50 && speedValue <= 100;
          case '100 to 200 Mbps':
            return speedValue > 100 && speedValue <= 200;
          case '200 to 350 Mbps':
            return speedValue > 200 && speedValue <= 350;
          case '350 to 500 Mbps':
            return speedValue > 350 && speedValue <= 500;
          case '500 to 1000 Mbps':
            return speedValue > 500 && speedValue <= 1000;
          case '1000+ Mbps':
            return speedValue > 1000;
          default:
            return true;
        }
      });
    }
    if (filters.validity) {
      filteredPlans = filteredPlans.filter(plan => 
        plan.days.toString().includes(filters.validity)
      );
    }
    if (filters.price) {
      const priceRange = filters.price.split('-');
      if (priceRange.length === 2) {
        const minPrice = parseInt(priceRange[0]);
        const maxPrice = parseInt(priceRange[1]);
        filteredPlans = filteredPlans.filter(plan => 
          plan.FinalAmount >= minPrice && plan.FinalAmount <= maxPrice
        );
      }
    }
    if (filters.gbLimit) {
      if (filters.gbLimit === 'Fair Usage Unlimited') {
        filteredPlans = filteredPlans.filter(plan => plan.limit === 'Unlimited');
      } else {
        const gbRange = filters.gbLimit.split('-');
        if (gbRange.length === 2) {
          const minGB = parseInt(gbRange[0]);
          const maxGB = parseInt(gbRange[1]);
          filteredPlans = filteredPlans.filter(plan => {
            const limit = parseInt(plan.limit);
            return limit >= minGB && limit <= maxGB;
          });
        }
      }
    }
    // Plan Features filtering
    if (filters.ottPlan) {
      filteredPlans = filteredPlans.filter(plan => 
        plan.ott_plan?.toLowerCase() === 'yes' || (plan.content_providers && plan.content_providers.length > 0)
      );
    }
    if (filters.voipPlan) {
      filteredPlans = filteredPlans.filter(plan => 
        plan.voice_plan?.toLowerCase() === 'yes'
      );
    }
    if (filters.iptvPlan) {
      filteredPlans = filteredPlans.filter(plan => 
        plan.iptv?.toLowerCase() === 'yes'
      );
    }
    if (filters.fupPlan) {
      filteredPlans = filteredPlans.filter(plan => 
        plan.fup_flag?.toLowerCase() === 'yes'
      );
    }

    // Sort plans based on selected sort option
    filteredPlans.sort((a, b) => {
      switch (sortOption) {
        case 'price-low-high':
          return a.FinalAmount - b.FinalAmount;
        case 'price-high-low':
          return b.FinalAmount - a.FinalAmount;
        case 'speed-high-low':
          const speedA = parseInt(a.downloadSpeed.split(' ')[0]);
          const speedB = parseInt(b.downloadSpeed.split(' ')[0]);
          return speedB - speedA;
        case 'validity-high-low':
          return b.days - a.days;
        case 'gb-high-low':
          const limitA = a.limit === 'Unlimited' ? -1 : parseInt(a.limit);
          const limitB = b.limit === 'Unlimited' ? -1 : parseInt(b.limit);
          return limitB - limitA;
        case '':
        default:
          // Default: Sort by price low to high for upgrade plans
          return a.FinalAmount - b.FinalAmount;
      }
    });

    return filteredPlans;
  };

  // Dynamic filter options derived from plan API data
  const availableValidities = useMemo(() => {
    const vals = Array.from(new Set(plansData.map(p => p.days).filter(v => Number.isFinite(v)))) as number[];
    return vals.sort((a, b) => a - b).map(v => v.toString());
  }, [plansData]);

  const handlePayNow = () => {
    if (!selectedPlan) {
      Alert.alert('Error', 'Please select a plan first');
      return;
    }

    const basePrice = calculateTotalAmount(selectedPlan);
    const totalAmount = payDues > 0 ? basePrice + payDues : basePrice;

    // Map the selected plan to the expected structure for confirmation screen
    const planForConfirmation = {
      id: selectedPlan.id,
      name: selectedPlan.name,
      speed: selectedPlan.downloadSpeed || '-',
      upload: selectedPlan.uploadSpeed || '-',
      download: selectedPlan.downloadSpeed || '-',
      validity: selectedPlan.days ? `${selectedPlan.days} Days` : '-',
      price: calculateTotalAmount(selectedPlan),
      baseAmount: selectedPlan.amt,
      cgst: selectedPlan.CGSTAmount,
      sgst: selectedPlan.SGSTAmount,
      mrp: calculateTotalAmount(selectedPlan),
      dues: !payDues || isNaN(payDues) ? 0 : payDues,
      gbLimit: selectedPlan.limit === 'Unlimited' ? -1 : selectedPlan.limit,
      isCurrentPlan: false, // Always false for upgrade plans
      ottServices: selectedPlan.content_providers ? selectedPlan.content_providers : [],
      ott_plan: selectedPlan.ott_plan,
      voice_plan: selectedPlan.voice_plan,
      iptv: selectedPlan.iptv,
      fup_flag: selectedPlan.fup_flag,
    };

    navigation.navigate('UpgradePlanConfirmation', {
      selectedPlan: planForConfirmation,
      totalAmount: totalAmount,
      payDues: payDues,
      admin_login_id: authData?.admin_login_id,
    });
  };

  const renderOTTIcon = (provider: any) => {
    if (provider.full_path_app_logo_file) {
      return (
        <Image 
          source={{ uri: provider.full_path_app_logo_file }}
          style={styles.ottLogo}
          resizeMode="contain"
        />
      );
    }
    // Fallback to emoji if no logo available
    const serviceName = provider.content_provider?.toLowerCase() || '';
    let emoji = '🎬';
    
    switch (serviceName) {
      case 'netflix':
        emoji = '🎬';
        break;
      case 'amazon prime':
        emoji = '📺';
        break;
      case 'disney+ hotstar':
      case 'jiohotstar':
        emoji = '⭐';
        break;
      case 'jiocinema':
        emoji = '🎭';
        break;
      case 'sonyliv':
        emoji = '📡';
        break;
      default:
        emoji = '🎬';
    }
    
    return <Text style={styles.ottIcon}>{emoji}</Text>;
  };

  const renderPlanItem = ({item}: {item: Plan}) => (
    <View
      style={[
        styles.planCard,
        {backgroundColor: colors.card, shadowColor: colors.shadow},
        selectedPlan?.id === item.id && {borderColor: colors.primary, borderWidth: 2},
      ]}>
      
      {/* Compact Plan Header */}
      <TouchableOpacity 
        style={styles.planHeader}
        onPress={() => handlePlanExpand(item.id)}>
        <View style={styles.planInfo}>
          <View style={styles.planTitleRow}>
            <Text style={styles.planIcon}>🚀</Text>
            <View style={styles.planTitleContainer}>
              <Text style={[styles.planName, {color: colors.textSecondary}]}>{item.name}</Text>
              {item.description && (
                <Text style={[styles.planDescription, {color: colors.textSecondary}]}>{item.description}</Text>
              )}
            </View>
          </View>
          
          {/* Compact Plan Details - Always Visible */}
          <View style={styles.compactDetails}>
            {/* First Row: Speed and Validity */}
            <View style={styles.speedValidityRow}>
              <View style={styles.compactDetailRow}>
                <Text style={styles.detailIcon}>⚡</Text>
                <Text style={[styles.detailValue, {color: colors.text}]}>{item.downloadSpeed || 'N/A'}</Text>
              </View>
              <View style={styles.compactDetailRow}>
                <Text style={styles.detailIcon}>⏰</Text>
                <Text style={[styles.detailValue, {color: colors.text}]}>{item.days || 0} Days</Text>
              </View>
            </View>
            
            {/* Second Row: Services */}
            <View style={styles.servicesRow}>
              {item.ott_plan?.toLowerCase() === 'yes' && (
                <View style={[styles.serviceBadge, {backgroundColor: colors.successLight}]}>
                  <Text style={[styles.serviceBadgeIcon, {color: colors.success}]}>🎬</Text>
                  <Text style={[styles.serviceText, {color: colors.success}]}>OTT</Text>
                </View>
              )}
              {item.voice_plan?.toLowerCase() === 'yes' && (
                <View style={[styles.serviceBadge, {backgroundColor: colors.accentLight}]}>
                  <Text style={[styles.serviceBadgeIcon, {color: colors.accent}]}>📞</Text>
                  <Text style={[styles.serviceText, {color: colors.accent}]}>VOIP</Text>
                </View>
              )}
              {item.iptv?.toLowerCase() === 'yes' && (
                <View style={[styles.serviceBadge, {backgroundColor: colors.primaryLight}]}>
                  <Text style={[styles.serviceBadgeIcon, {color: colors.primary}]}>📺</Text>
                  <Text style={[styles.serviceText, {color: colors.primary}]}>IPTV</Text>
                </View>
              )}
              {item.fup_flag?.toLowerCase() === 'yes' && (
                <View style={[styles.serviceBadge, {backgroundColor: colors.surface}]}>
                  <Text style={[styles.serviceBadgeIcon, {color: colors.text}]}>📊</Text>
                  <Text style={[styles.serviceText, {color: colors.text}]}>FUP</Text>
                </View>
              )}
            </View>
          </View>
          
          
        </View>
        <View style={styles.planPriceContainer}>
          <View style={[styles.priceBadge, {backgroundColor: colors.primaryLight}]}>
            <Text style={[styles.priceText, {color: colors.primary}]}>₹{calculateTotalAmount(item)}</Text>
          </View>
          <TouchableOpacity 
            style={styles.expandButton}
            onPress={(e) => {
              e.stopPropagation();
              handlePlanExpand(item.id);
            }}>
            <Text style={[styles.expandIcon, {color: colors.textSecondary}]}>
              {item.isExpanded ? '▼' : '▶'}
            </Text>
          </TouchableOpacity>
          {selectedPlan?.id === item.id && (
            <View style={[styles.selectedIndicator, {backgroundColor: colors.primary}]}>
              <Text style={styles.selectedIndicatorText}>✓</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>

      {/* Compact Plan Details */}
      {item.isExpanded && (
        <View style={styles.planDetails}>
          {/* {(!selectedPlan || selectedPlan.id !== item.id) && (
            <View style={styles.detailRow}>
              <Text style={styles.detailIcon}>⬆️</Text>
              <Text style={styles.detailValue}>{item.uploadSpeed}</Text>
              <Text style={styles.detailIcon}>⬇️</Text>
              <Text style={styles.detailValue}>{item.downloadSpeed}</Text>
              <Text style={styles.detailIcon}>💾</Text>
              <Text style={styles.detailValue}>{item.limit === 'Unlimited' ? 'Unlimited' : `${item.limit} GB`}</Text>
            </View>
          )} */}

          {/* OTT Services */}
          {item.content_providers && item.content_providers.length > 0 && (!selectedPlan || selectedPlan.id !== item.id) && (
            <View style={styles.ottSection}>
              <Text style={[styles.ottTitle, {color: colors.textSecondary}]}>
                {t('renewPlan.ottServices')}
              </Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.ottScrollContainer}
                nestedScrollEnabled={true}
                scrollEnabled={true}>
                {item.content_providers.map((provider: any, index: number) => (
                  <View key={index} style={styles.ottItem}>
                    {renderOTTIcon(provider)}
                    <Text style={[styles.ottName, {color: colors.textSecondary}]}>
                      {provider.content_provider}
                    </Text>
                  </View>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Select Plan Button */}
          {!selectedPlan || selectedPlan.id !== item.id ? (
            <View style={styles.selectPlanContainer}>
              <TouchableOpacity
                style={[styles.selectPlanButton, {backgroundColor: colors.card, borderColor: colors.primary}]}
                onPress={() => handlePlanSelect(item)}>
                <Text style={[styles.selectPlanText, {color: colors.primary}]}>
                  {t('renewPlan.selectPlan')}
                </Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </View>
      )}
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, {backgroundColor: colors.background}]}>
        <CommonHeader navigation={navigation} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, {color: colors.textSecondary}]}>
            {t('common.loading')}
          </Text>

        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, {backgroundColor: colors.background}]}>
      <CommonHeader navigation={navigation} />

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Page Heading */}
        <View style={styles.headingContainer}>
          <Text style={[styles.pageHeading, {color: colors.text}]}>
            Upgrade Plan
          </Text>
          <Text style={[styles.pageSubheading, {color: colors.textSecondary}]}>
            Choose a higher plan to upgrade your current subscription
          </Text>
        </View>

        {/* Pay Dues Button */}
        {payDues > 0 && (
          <View style={styles.payDuesContainer}>
            <TouchableOpacity
              style={[styles.payDuesButton, {backgroundColor: colors.primary}]}
              onPress={handlePayNow}>
              <Text style={styles.payDuesButtonText}>
                Pay Dues - ₹{payDues}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Upgrade your plan section */}
        <View style={styles.changePlanSection}>
          {/* <Text style={[styles.changePlanTitle, {color: colors.primary}]}>
            {t('renewPlan.upgradeYourPlan')}
          </Text> */}
          <View style={styles.filterButtonsRow}>
            <TouchableOpacity
              style={[styles.filterButtonNew, {backgroundColor: colors.card, borderColor: colors.border}]}
              onPress={() => setShowFilterModal(true)}>
              <Text style={styles.filterButtonIconNew}>🔍</Text>
              <Text style={[styles.filterButtonTextNew, {color: colors.text}]}>
                Filter
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterButtonNew, {backgroundColor: colors.card, borderColor: colors.border}]}
              onPress={() => setShowSortModal(true)}>
              <Text style={styles.filterButtonIconNew}>⇅</Text>
              <Text style={[styles.filterButtonTextNew, {color: colors.text}]}>
                Sort
              </Text>
            </TouchableOpacity>
          </View>
        </View>


        {/* Other Plans List */}
        {getFilteredAndSortedPlans().map((plan: Plan) => (
          <View key={plan.id} style={styles.otherPlanSection}>
            <View style={[styles.planCardNew, styles.otherPlanCard, {borderColor: colors.border, backgroundColor: colors.card}]}>
              <View style={styles.planCardContent}>
                <View style={styles.planCardTopRow}>
                  <View style={styles.planCardLeft}>
                    <Text style={[styles.planNameNew, {color: colors.text}]}>
                      {plan.name}
                    </Text>
                    {plan.description && (
                      <Text style={[styles.planDescriptionNew, {color: colors.textSecondary}]}>
                        {plan.description}
                      </Text>
                    )}
                  </View>
                  <View style={styles.planCardRight}>
                    <Text style={[styles.planPriceNew, {color: colors.primary}]}>
                      ₹{calculateTotalAmount(plan)}
                    </Text>
                    <TouchableOpacity
                      style={[
                        styles.planActionButton, 
                        {
                          backgroundColor: selectedPlan?.id === plan.id ? colors.success : colors.primary
                        }
                      ]}
                      onPress={() => handlePlanSelect(plan)}>
                      <Text style={styles.planActionButtonText}>
                        {selectedPlan?.id === plan.id ? 'Selected' : 'Select'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={styles.speedValiditySection}>
                  <View style={styles.speedValidityHeaders}>
                    <Text style={[styles.speedValidityLabel, {color: colors.textSecondary}]}>Speed</Text>
                    <Text style={[styles.speedValidityLabel, {color: colors.textSecondary}]}>Validity</Text>
                    {plan.content_providers && Array.isArray(plan.content_providers) && plan.content_providers.length > 0 && (
                      <Text style={[styles.speedValidityLabel, {color: colors.textSecondary}]}>OTTs</Text>
                    )}
                    {plan.voice_plan?.toLowerCase() === 'yes' && (
                      <Text style={[styles.speedValidityLabel, {color: colors.textSecondary}]}>VOICE</Text>
                    )}
                    {plan.iptv?.toLowerCase() === 'yes' && (
                      <Text style={[styles.speedValidityLabel, {color: colors.textSecondary}]}>IPTV</Text>
                    )}
                    {plan.fup_flag?.toLowerCase() === 'yes' && (
                      <Text style={[styles.speedValidityLabel, {color: colors.textSecondary}]}>FUP</Text>
                    )}
                  </View>
                  <View style={styles.speedValidityValues}>
                    <Text style={[styles.speedValidityValue, {color: colors.text}]}>
                      {formatSpeed(plan.downloadSpeed)}
                    </Text>
                    <Text style={[styles.speedValidityValue, {color: colors.text}]}>
                      {plan.days || 0} Days
                    </Text>
                    {plan.content_providers && Array.isArray(plan.content_providers) && plan.content_providers.length > 0 && (
                      <Text style={[styles.speedValidityValue, {color: colors.text}]}>
                        {plan.content_providers.length}
                      </Text>
                    )}
                    {plan.voice_plan?.toLowerCase() === 'yes' && (
                      <Text style={[styles.speedValidityValue, {color: colors.text}]}>Yes</Text>
                    )}
                    {plan.iptv?.toLowerCase() === 'yes' && (
                      <Text style={[styles.speedValidityValue, {color: colors.text}]}>Yes</Text>
                    )}
                    {plan.fup_flag?.toLowerCase() === 'yes' && (
                      <Text style={[styles.speedValidityValue, {color: colors.text}]}>Yes</Text>
                    )}
                  </View>
                </View>
                {plan.content_providers && Array.isArray(plan.content_providers) && plan.content_providers.length > 0 && (
                  <View style={styles.ottLogosSection}>
                    <ScrollView 
                      horizontal 
                      showsHorizontalScrollIndicator={true}
                      contentContainerStyle={styles.ottLogosScrollContainer}
                      style={styles.ottLogosScrollView}
                      nestedScrollEnabled={true}>
                      {plan.content_providers.map((provider: any, index: number) => (
                        <View key={index} style={styles.ottLogoItem}>
                          <View style={styles.ottLogoWrapper}>
                            {renderOTTIcon(provider)}
                          </View>
                          <Text style={[styles.ottServiceName, {color: colors.textSecondary}]} numberOfLines={1}>
                            {provider.content_provider || 'OTT'}
                          </Text>
                        </View>
                      ))}
                    </ScrollView>
                    {plan.content_providers.length > 5 && (
                      <Text style={[styles.scrollHint, {color: colors.textSecondary}]}>
                        ← Scroll to see more →
                      </Text>
                    )}
                  </View>
                )}
              </View>
            </View>
          </View>
        ))}

        {/* Active Filters Summary */}
        {(Object.values(filters).some(filter => filter !== '') || sortOption !== '') && (
          <View style={styles.activeFiltersContainer}>
            <Text style={[styles.activeFiltersTitle, {color: colors.textSecondary}]}>
              Active Filters:
            </Text>
            <View style={styles.activeFiltersList}>
              {/* Speed Filter */}
              {filters.speed && (
                <View style={[styles.activeFilterChip, {backgroundColor: colors.primaryLight}]}>
                  <Text style={[styles.activeFilterText, {color: colors.primary}]}>
                    Speed: {filters.speed}
                  </Text>
                  <TouchableOpacity onPress={() => setFilters(prev => ({...prev, speed: ''}))}>
                    <Text style={[styles.removeFilterText, {color: colors.primary}]}>✕</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Validity Filter */}
              {filters.validity && (
                <View style={[styles.activeFilterChip, {backgroundColor: colors.primaryLight}]}>
                  <Text style={[styles.activeFilterText, {color: colors.primary}]}>
                    Validity: {filters.validity} Days
                  </Text>
                  <TouchableOpacity onPress={() => setFilters(prev => ({...prev, validity: ''}))}>
                    <Text style={[styles.removeFilterText, {color: colors.primary}]}>✕</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Price Filter */}
              {filters.price && (
                <View style={[styles.activeFilterChip, {backgroundColor: colors.primaryLight}]}>
                  <Text style={[styles.activeFilterText, {color: colors.primary}]}>
                    Price: ₹{filters.price}
                  </Text>
                  <TouchableOpacity onPress={() => setFilters(prev => ({...prev, price: ''}))}>
                    <Text style={[styles.removeFilterText, {color: colors.primary}]}>✕</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Plan Features Filters */}
              {filters.ottPlan && (
                <View style={[styles.activeFilterChip, {backgroundColor: colors.primaryLight}]}>
                  <Text style={[styles.activeFilterText, {color: colors.primary}]}>
                    🎬 OTT
                  </Text>
                  <TouchableOpacity onPress={() => setFilters(prev => ({...prev, ottPlan: ''}))}>
                    <Text style={[styles.removeFilterText, {color: colors.primary}]}>✕</Text>
                  </TouchableOpacity>
                </View>
              )}

              {filters.voipPlan && (
                <View style={[styles.activeFilterChip, {backgroundColor: colors.primaryLight}]}>
                  <Text style={[styles.activeFilterText, {color: colors.primary}]}>
                    📞 VOIP
                  </Text>
                  <TouchableOpacity onPress={() => setFilters(prev => ({...prev, voipPlan: ''}))}>
                    <Text style={[styles.removeFilterText, {color: colors.primary}]}>✕</Text>
                  </TouchableOpacity>
                </View>
              )}

              {filters.iptvPlan && (
                <View style={[styles.activeFilterChip, {backgroundColor: colors.primaryLight}]}>
                  <Text style={[styles.activeFilterText, {color: colors.primary}]}>
                    📺 IPTV
                  </Text>
                  <TouchableOpacity onPress={() => setFilters(prev => ({...prev, iptvPlan: ''}))}>
                    <Text style={[styles.removeFilterText, {color: colors.primary}]}>✕</Text>
                  </TouchableOpacity>
                </View>
              )}

              {filters.fupPlan && (
                <View style={[styles.activeFilterChip, {backgroundColor: colors.primaryLight}]}>
                  <Text style={[styles.activeFilterText, {color: colors.primary}]}>
                    📊 FUP
                  </Text>
                  <TouchableOpacity onPress={() => setFilters(prev => ({...prev, fupPlan: ''}))}>
                    <Text style={[styles.removeFilterText, {color: colors.primary}]}>✕</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Sort Option */}
              {sortOption && (
                <View style={[styles.activeFilterChip, {backgroundColor: colors.successLight}]}>
                  <Text style={[styles.activeFilterText, {color: colors.success}]}>
                    Sort: {sortOption.replace('-', ' ').replace(/([A-Z])/g, ' $1').trim()}
                  </Text>
                  <TouchableOpacity onPress={() => setSortOption('')}>
                    <Text style={[styles.removeFilterText, {color: colors.success}]}>✕</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Clear All Filters Button */}
            <TouchableOpacity 
              style={styles.clearAllButton}
              onPress={() => {
                setFilters({
                  speed: '',
                  validity: '',
                  price: '',
                  gbLimit: '',
                  ottPlan: '',
                  voipPlan: '',
                  iptvPlan: '',
                  fupPlan: '',
                });
                setSortOption('');
              }}>
              <Text style={[styles.clearAllText, {color: colors.primary}]}>
                Clear All Filters
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Add bottom padding to prevent content from being hidden behind fixed button */}
        {selectedPlan && <View style={{ height: 80 }} />}
      </ScrollView>

      {/* Pay Now Button - Fixed at bottom */}
      {selectedPlan && (
        <View style={[styles.payButtonContainer, {backgroundColor: colors.background, borderTopColor: colors.border}]}>
          <TouchableOpacity
            style={[styles.payButton, {backgroundColor: colors.primary}]}
            onPress={handlePayNow}>
            <Text style={[styles.payButtonText, {color: '#ffffff'}]}>
              {(() => {
                const displayBase = calculateTotalAmount(selectedPlan);
                const displayTotal = payDues > 0 ? displayBase + payDues : displayBase;
                return `Pay Now ₹ ${displayTotal}`;
              })()}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Filter Modal */}
      <Modal
        visible={showFilterModal}
        transparent={true}
        animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, {backgroundColor: colors.card}]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, {color: colors.text}]}>
                {t('renewPlan.filter')}
              </Text>
              <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                <Text style={[styles.modalCloseButton, {color: colors.text}]}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {/* Validity Filter (Dynamic) */}
              <View style={styles.filterSection}>
                <Text style={[styles.filterSectionTitle, {color: colors.text}]}>Validity</Text>
                <View style={styles.filterOptions}>
                  {availableValidities.map((validity) => (
                    <TouchableOpacity
                      key={`val-${validity}`}
                      style={[
                        styles.filterOption,
                        {borderColor: colors.border},
                        filters.validity === validity && {backgroundColor: colors.primary, borderColor: colors.primary}
                      ]}
                      onPress={() => setFilters(prev => ({...prev, validity: prev.validity === validity ? '' : validity}))}>
                      <Text style={[
                        styles.filterOptionText,
                        {color: filters.validity === validity ? '#fff' : colors.text}
                      ]}>
                        {validity} Days
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Price Filter (Static) */}
              <View style={styles.filterSection}>
                <Text style={[styles.filterSectionTitle, {color: colors.text}]}>Price Range</Text>
                <View style={styles.filterOptions}>
                  {['0-1000', '1000-2000', '2000-5000', '5000-10000'].map((price) => (
                    <TouchableOpacity
                      key={`pr-${price}`}
                      style={[
                        styles.filterOption,
                        {borderColor: colors.border},
                        filters.price === price && {backgroundColor: colors.primary, borderColor: colors.primary}
                      ]}
                      onPress={() => setFilters(prev => ({...prev, price: prev.price === price ? '' : price}))}>
                      <Text style={[
                        styles.filterOptionText,
                        {color: filters.price === price ? '#fff' : colors.text}
                      ]}>
                        ₹{price}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Speed Filter (Static) */}
              <View style={styles.filterSection}>
                <Text style={[styles.filterSectionTitle, {color: colors.text}]}>Speed</Text>
                <View style={styles.filterOptions}>
                  {['10 to 50 Mbps', '50 to 100 Mbps', '100 to 200 Mbps', '200 to 350 Mbps', '350 to 500 Mbps', '500 to 1000 Mbps', '1000+ Mbps'].map((speed) => (
                    <TouchableOpacity
                      key={`sp-${speed}`}
                      style={[
                        styles.filterOption,
                        {borderColor: colors.border},
                        filters.speed === speed && {backgroundColor: colors.primary, borderColor: colors.primary}
                      ]}
                      onPress={() => setFilters(prev => ({...prev, speed: prev.speed === speed ? '' : speed}))}>
                      <Text style={[
                        styles.filterOptionText,
                        {color: filters.speed === speed ? '#fff' : colors.text}
                      ]}>
                        {speed}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Plan Features */}
              <View style={styles.filterSection}>
                <Text style={[styles.filterSectionTitle, {color: colors.text}]}>Plan Features</Text>
                <View style={styles.featuresGrid}>
                  {[
                    { key: 'ottPlan', label: 'OTT', icon: '🎬' },
                    { key: 'voipPlan', label: 'VOIP', icon: '📞' },
                    { key: 'iptvPlan', label: 'IPTV', icon: '📺' },
                    { key: 'fupPlan', label: 'FUP', icon: '📊' }
                  ].map((feature) => (
                    <TouchableOpacity
                      key={feature.key}
                      style={[
                        styles.featureOption,
                        {borderColor: colors.border},
                        filters[feature.key as keyof typeof filters] && {backgroundColor: colors.primary, borderColor: colors.primary}
                      ]}
                      onPress={() => {
                        const currentValue = filters[feature.key as keyof typeof filters];
                        setFilters(prev => ({
                          ...prev,
                          [feature.key]: currentValue ? '' : `With ${feature.label}`
                        }));
                      }}>
                      <Text style={[styles.featureIcon, {color: filters[feature.key as keyof typeof filters] ? '#fff' : colors.text}]}>
                        {feature.icon}
                      </Text>
                      <Text style={[
                        styles.featureText,
                        {color: filters[feature.key as keyof typeof filters] ? '#fff' : colors.text}
                      ]}>
                        {feature.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </ScrollView>
            
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, {backgroundColor: colors.primary}]}
                onPress={() => setShowFilterModal(false)}>
                <Text style={[styles.modalButtonText, {color: '#ffffff'}]}>
                  {t('common.ok')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Sort Modal */}
      <Modal
        visible={showSortModal}
        transparent={true}
        animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, {backgroundColor: colors.card}]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, {color: colors.text}]}>
                {t('renewPlan.sort')}
              </Text>
              <TouchableOpacity onPress={() => setShowSortModal(false)}>
                <Text style={[styles.modalCloseButton, {color: colors.text}]}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalBody}>
              {/* Sort Options */}
              {[
                { key: 'price-low-high', label: 'Price: Low to High' },
                { key: 'price-high-low', label: 'Price: High to Low' },
                { key: 'speed-high-low', label: 'Speed: High to Low' },
                { key: 'validity-high-low', label: 'Validity: High to Low' },
                { key: 'gb-high-low', label: 'Data Limit: High to Low' }
              ].map((option) => (
                <TouchableOpacity
                  key={option.key}
                  style={[
                    styles.sortOption,
                    {backgroundColor: colors.card},
                    sortOption === option.key && {backgroundColor: colors.primary}
                  ]}
                  onPress={() => {
                    setSortOption(option.key);
                    setShowSortModal(false);
                  }}>
                  <Text style={[
                    styles.sortOptionText,
                    {color: sortOption === option.key ? '#fff' : colors.text}
                  ]}>
                    {option.label}
                  </Text>
                  {sortOption === option.key && (
                    <Text style={[styles.sortOptionCheck, {color: '#fff'}]}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headingContainer: {
    paddingHorizontal: 20,
    paddingTop: 0,
    paddingBottom: 0,
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
  content: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  planCard: {
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
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 5,
  },
  planInfo: {
    flex: 1,
  },
  planName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  planDescription: {
    fontSize: 12,
    fontWeight: '400',
    marginBottom: 2,
    opacity: 0.8,
    lineHeight: 14,
  },
  upgradePlanBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  upgradePlanText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  planBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 4,
  },
  priceBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  priceText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  planDetails: {
    gap: 4,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 14,
  },
  detailValue: {
    fontSize: 12,
    fontWeight: '500',
  },

  payButton: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  payButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  planTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  planIcon: {
    fontSize: 18,
    marginRight: 6,
  },
  planTitleContainer: {
    flex: 1,
  },
  detailIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  ottSection: {
    marginTop: 4,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  ottTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  ottIcons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  ottIconContainer: {
    alignItems: 'center',
    minWidth: 60,
  },
  ottIconText: {
    fontSize: 20,
    marginBottom: 4,
  },
  ottServiceName: {
    fontSize: 10,
    textAlign: 'center',
  },
  priceBreakdownSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  priceBreakdownTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  priceBreakdownList: {
    gap: 6,
  },
  priceBreakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceBreakdownLabel: {
    fontSize: 12,
  },
  priceBreakdownValue: {
    fontSize: 12,
    fontWeight: '600',
  },
  totalPriceRow: {
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    marginTop: 6,
    paddingTop: 6,
  },
  totalPriceLabel: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  totalPriceValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  planPriceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  expandButton: {
    padding: 4,
  },
  expandIcon: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  compactDetails: {
    marginTop: 2,
    marginHorizontal: 0,
    paddingTop: 2,
    paddingHorizontal: 0,
    gap: 6,
  },
  speedValidityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  compactDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  leftDetails: {
    flex: 0,
    alignItems: 'flex-start',
    minWidth: 80,
  },
  centerDetails: {
    flex: 0,
    alignItems: 'center',
    minWidth: 60,
  },
  rightDetails: {
    flex: 0,
    alignItems: 'flex-end',
    minWidth: 80,
  },
  expandedSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  selectPlanButton: {
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  selectPlanButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  filterSortContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 16,
  },
  filterSortButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    borderRadius: 20,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 20,
    maxHeight: '80%',
    width: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalCloseButton: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  modalBody: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  filterSection: {
    marginBottom: 24,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  filterOptionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  modalFooter: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  sortOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginBottom: 8,
  },
  sortOptionText: {
    fontSize: 16,
    fontWeight: '500',
  },
  sortOptionCheck: {
    fontSize: 18,
    color: '#fff',
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 12,
  },
  filterButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  filterButtonIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  activeFiltersContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginBottom: 8,
  },
  activeFiltersTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  activeFiltersList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  activeFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  activeFilterText: {
    fontSize: 12,
    fontWeight: '500',
  },
  removeFilterText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  clearAllButton: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
  },
  clearAllText: {
    fontSize: 12,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  plansList: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  fupSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  fupText: {
    fontSize: 12,
    textAlign: 'center',
  },
  tbqSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  tbqText: {
    fontSize: 12,
    textAlign: 'center',
  },
  detailSeparator: {
    fontSize: 14,
    color: '#555',
  },
  ottGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    marginTop: 8,
  },
  ottScrollContainer: {
    paddingHorizontal: 4,
    gap: 16,
  },
  ottItem: {
    alignItems: 'center',
    marginVertical: 4,
  },
  ottIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  ottLogo: {
    width: 24,
    height: 24,
    marginBottom: 4,
  },
  ottName: {
    fontSize: 10,
    textAlign: 'center',
  },
  selectPlanText: {
    fontSize: 14,
    fontWeight: '600',
  },
  selectPlanContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  selectedIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  selectedIndicatorText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  payButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 20,
    borderTopWidth: 1,
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  payButton: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  payButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  // New Redesigned Styles
  payDuesContainer: {
    paddingHorizontal: 20,
    marginTop: 16,
    marginBottom: 8,
  },
  payDuesButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  payDuesButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  otherPlanSection: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  planCardNew: {
    borderRadius: 12,
    borderWidth: 2,
    padding: 16,
    minHeight: 140,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  otherPlanCard: {
    borderColor: '#e0e0e0',
  },
  planCardContent: {
    flexDirection: 'column',
    marginTop: 8,
    flex: 1,
  },
  planCardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  planCardLeft: {
    flex: 1,
    marginRight: 16,
  },
  planCardRight: {
    alignItems: 'flex-end',
    justifyContent: 'flex-start',
    marginLeft: 8,
  },
  planNameNew: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  planDescriptionNew: {
    fontSize: 12,
    fontWeight: '400',
    marginBottom: 8,
    lineHeight: 16,
  },
  planDetailsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginBottom: 12,
  },
  planDetailText: {
    fontSize: 13,
  },
  planPriceNew: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  planActionButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 70,
  },
  planActionButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  changePlanSection: {
    paddingHorizontal: 20,
    marginTop: 12,
    marginBottom: 16,
  },
  changePlanTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  filterButtonsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  filterButtonNew: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    gap: 8,
  },
  filterButtonIconNew: {
    fontSize: 18,
  },
  filterButtonTextNew: {
    fontSize: 14,
    fontWeight: '600',
  },
  speedValiditySection: {
    marginTop: 4,
    marginBottom: 8,
  },
  speedValidityHeaders: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
    gap: 12,
  },
  speedValidityLabel: {
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
    marginHorizontal: 6,
  },
  speedValidityValues: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  speedValidityValue: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
    marginHorizontal: 6,
  },
  ottLogosSection: {
    marginTop: 8,
    marginBottom: 4,
    width: '100%',
  },
  ottLogosScrollView: {
    maxHeight: 90,
    paddingVertical: 4,
    width: '100%',
  },
  ottLogosScrollContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingRight: 4,
    paddingLeft: 0,
    gap: 4,
  },
  ottLogoItem: {
    alignItems: 'center',
    width: 48,
    marginRight: 0,
  },
  scrollHint: {
    fontSize: 10,
    textAlign: 'center',
    marginTop: 4,
    fontStyle: 'italic',
  },
  ottLogoWrapper: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  ottServiceName: {
    fontSize: 9,
    textAlign: 'center',
    fontWeight: '500',
    marginTop: 2,
  },
  expandedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    marginHorizontal: 0,
    paddingTop: 4,
    paddingHorizontal: 0,
    gap: 25,
  },
  servicesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    justifyContent: 'flex-start',
  },
  serviceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 4,
  },
  serviceBadgeIcon: {
    fontSize: 12,
  },
  serviceText: {
    fontSize: 11,
    fontWeight: '600',
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'space-around',
  },
  featureOption: {
    width: '20%',
    minWidth: 60,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 12,
    borderWidth: 1.5,
    backgroundColor: 'transparent',
  },
  featureIcon: {
    fontSize: 20,
    marginBottom: 2,
  },
  featureText: {
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default UpgradePlanScreen; 