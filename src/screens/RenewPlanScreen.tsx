import React, {useState, useEffect} from 'react';
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
import {SafeAreaView} from 'react-native-safe-area-context';
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
}

const RenewPlanScreen = ({navigation}: any) => {
  const {isDark} = useTheme();
  const colors = getThemeColors(isDark);
  const {t} = useTranslation();

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
      //Alert.alert('Loading plan data...');
      
      // Get current session
      const session = await sessionManager.getCurrentSession();
      if (!session) {
        Alert.alert('Error', 'Please login again');
        navigation.navigate('Login');
        return;
      }

      const {username} = session;
      
      // Always fetch fresh data for RenewPlanScreen
      console.log('Fetching fresh data from API');
      
      // Get user authentication data
      const authResponse = await apiService.makeAuthenticatedRequest(async (token) => {
        return await apiService.authUser(username);
      });
      setAuthData(authResponse);

      // Get admin tax info
      const taxInfo = await apiService.getAdminTaxInfo(authResponse.admin_login_id, 'default');
      
      // Get payment dues
      const duesResponse = await apiService.userPaymentDues(username, 'default');
      const payDuesAmount = duesResponse ? Math.round(parseFloat(duesResponse)) : 0;
      setPayDues(payDuesAmount);

      // Get plan list
      const isShowAllPlan = taxInfo?.isShowAllPlan || false;
      //Alert.alert('isShowAllPlan', isShowAllPlan.toString());
      
      // console.log('=== PLAN API CALL DEBUG ===');
      // console.log('Admin ID:', authResponse.admin_login_id);
      // console.log('Username:', username);
      // console.log('Current Plan:', authResponse.current_plan1);
      // console.log('Show All Plans:', isShowAllPlan);
      // console.log('Is Dashboard:', false);
      // console.log('Realm:', 'default');
      // console.log('Auth Response Keys:', Object.keys(authResponse));
      // console.log('Full Auth Response:', authResponse);
      
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
        
        console.log('=== PLAN API RESPONSE SUCCESS ===');
        console.log('Plan Count:', planList?.length || 0);
        if (planList?.[0]) {
          console.log('First Plan Name:', planList[0].name);
          console.log('First Plan Speed:', planList[0].downloadSpeed);
          console.log('First Plan Price:', planList[0].FinalAmount);
          console.log('First Plan Validity:', planList[0].days);
          console.log('First Plan Data Limit:', planList[0].limit);
          console.log('First Plan OTT Count:', planList[0].content_providers?.length || 0);
        }
        console.log('=== END PLAN API RESPONSE ===');
        
        setPlansData(planList);
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

      // Set current plan as selected by default
      const currentPlan = planList.find((plan: any) => plan.name === authResponse.current_plan || plan.name === authResponse.current_plan1);
      if (currentPlan) {
        setSelectedPlan(currentPlan);
      }

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
    console.log('Manual refresh triggered');
    await dataCache.clearAllCache();
    await loadPlanData();
  };

  const getFilteredAndSortedPlans = () => {
    let filteredPlans = [...plansData];

    // Apply filters
    if (filters.speed) {
      filteredPlans = filteredPlans.filter(plan => 
        plan.downloadSpeed.toLowerCase().includes(filters.speed.toLowerCase())
      );
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
    if (filters.ottPlan) {
      if (filters.ottPlan === 'With OTT') {
        filteredPlans = filteredPlans.filter(plan => 
          plan.content_providers && plan.content_providers.length > 0
        );
      } else if (filters.ottPlan === 'Without OTT') {
        filteredPlans = filteredPlans.filter(plan => 
          !plan.content_providers || plan.content_providers.length === 0
        );
      }
    }

    // Sort plans based on selected sort option
    filteredPlans.sort((a, b) => {
      // console.log('Auth data current plan fields:', {
      //   current_plan: authData?.current_plan,
      //   current_plan1: authData?.current_plan1,
      //   plan_name: a.name
      // });
      const aIsCurrent = a.name === authData?.current_plan || a.name === authData?.current_plan1;
      const bIsCurrent = b.name === authData?.current_plan || b.name === authData?.current_plan1;
      
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
          // Default: Put current plan first, then sort by price low to high
          // console.log('Default sorting - Current plan:', authData?.current_plan);
          // console.log('Comparing plans:', { a: a.name, b: b.name, aIsCurrent, bIsCurrent });
          if (aIsCurrent && !bIsCurrent) return -1;
          if (!aIsCurrent && bIsCurrent) return 1;
          return a.FinalAmount - b.FinalAmount;
      }
    });

    return filteredPlans;
  };

  const handlePayNow = () => {
    if (!selectedPlan) {
      Alert.alert('Error', 'Please select a plan first');
      return;
    }

    const totalAmount = payDues > 0 ? selectedPlan.FinalAmount + payDues : selectedPlan.FinalAmount;

    // Map the selected plan to the expected structure for confirmation screen
    const planForConfirmation = {
      id: selectedPlan.id,
      name: selectedPlan.name,
      speed: selectedPlan.downloadSpeed || '-',
      upload: selectedPlan.uploadSpeed || '-',
      download: selectedPlan.downloadSpeed || '-',
      validity: selectedPlan.days ? `${selectedPlan.days} Days` : '-',
      price: selectedPlan.FinalAmount,
      baseAmount: selectedPlan.amt,
      cgst: selectedPlan.CGSTAmount,
      sgst: selectedPlan.SGSTAmount,
      mrp: selectedPlan.FinalAmount,
      dues: !payDues || isNaN(payDues) ? 0 : payDues,
      gbLimit: selectedPlan.limit === 'Unlimited' ? -1 : selectedPlan.limit,
      isCurrentPlan: selectedPlan.name === authData?.current_plan || selectedPlan.name === authData?.current_plan1,
      ottServices: selectedPlan.content_providers ? selectedPlan.content_providers : [],
    };

    navigation.navigate('PlanConfirmation', {
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
        (item.name === authData?.current_plan || item.name === authData?.current_plan1) && {borderColor: colors.success, borderWidth: 2},
      ]}>
      
      {/* Compact Plan Header */}
      <TouchableOpacity 
        style={styles.planHeader}
        onPress={() => handlePlanExpand(item.id)}>
        <View style={styles.planInfo}>
          <View style={styles.planTitleRow}>
            <Text style={styles.planIcon}>🚀</Text>
            <View style={styles.planTitleContainer}>
              <Text style={[styles.planName, {color: colors.text}]}>{item.name}</Text>
              <View style={styles.planBadges}>
                {(item.name === authData?.current_plan || item.name === authData?.current_plan1) && (
                  <View style={[styles.currentPlanBadge, {backgroundColor: colors.success}]}>
                    <Text style={styles.currentPlanText}>{t('renewPlan.currentPlan')}</Text>
                  </View>
                )}
              </View>
            </View>
          </View>
          
          {/* Compact Plan Details - Always Visible */}
          <View style={styles.compactDetails}>
            <View style={styles.leftDetails}>
              <View style={styles.compactDetailRow}>
                <Text style={styles.detailIcon}>⚡</Text>
                <Text style={[styles.detailValue, {color: colors.text}]}>{item.downloadSpeed}</Text>
              </View>
            </View>
            <View style={styles.centerDetails}>
              {item.content_providers && item.content_providers.length > 0 && (
                <View style={styles.compactDetailRow}>
                  <Text style={styles.detailIcon}>🎬</Text>
                  <Text style={[styles.detailValue, {color: colors.text}]}>OTT</Text>
                </View>
              )}
            </View>
            <View style={styles.rightDetails}>
              <View style={styles.compactDetailRow}>
                <Text style={styles.detailIcon}>⏰</Text>
                <Text style={[styles.detailValue, {color: colors.text}]}>{item.days} Days</Text>
              </View>
            </View>
          </View>
          
          
        </View>
        <View style={styles.planPriceContainer}>
          <View style={[styles.priceBadge, {backgroundColor: colors.primaryLight}]}>
            <Text style={[styles.priceText, {color: colors.primary}]}>₹{item.FinalAmount}</Text>
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

          {/* FUP Details */}
          {/* {item.isfupBriefDetailsAvailable().result && (
            <View style={styles.fupSection}>
              <Text style={[styles.fupText, {color: colors.warning}]}>
                After {item.fupBriefDetails()?.limit} GB, speed will be {item.fupBriefDetails()?.downloadSpeed}
              </Text>
            </View>
          )} */}

          {/* TBQ Details */}
          {/* {item.isTBQPlan() && (
            <View style={styles.tbqSection}>
              <Text style={[styles.tbqText, {color: colors.warning}]}>
                {item.tbqBriefDetails()?.days === 'all days' ? 'Between' : `On every ${item.tbqBriefDetails()?.days} between`} {item.tbqBriefDetails()?.start} and {item.tbqBriefDetails()?.stop}
              </Text>
            </View>
          )} */}

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


      {/* Page Heading */}
      <View style={styles.headingContainer}>
        <Text style={[styles.pageHeading, {color: colors.text}]}>
          {t('renewPlan.title')}
        </Text>
        <Text style={[styles.pageSubheading, {color: colors.textSecondary}]}>
          {t('renewPlan.subtitle')}
        </Text>
      </View>

      {/* Filter and Sort Buttons */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterButton, {backgroundColor: colors.card}]}
          onPress={() => setShowFilterModal(true)}>
          <Text style={styles.filterButtonIcon}>🔍</Text>
          <Text style={[styles.filterButtonText, {color: colors.text}]}>
            {t('renewPlan.filter')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, {backgroundColor: colors.card}]}
          onPress={() => setShowSortModal(true)}>
          <Text style={styles.filterButtonIcon}>📊</Text>
          <Text style={[styles.filterButtonText, {color: colors.text}]}>
            {t('renewPlan.sort')}
          </Text>
        </TouchableOpacity>
      </View>

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
            
            {/* OTT Filter */}
            {filters.ottPlan && (
              <View style={[styles.activeFilterChip, {backgroundColor: colors.primaryLight}]}>
                <Text style={[styles.activeFilterText, {color: colors.primary}]}>
                  OTT: {filters.ottPlan}
                </Text>
                <TouchableOpacity onPress={() => setFilters(prev => ({...prev, ottPlan: ''}))}>
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
              });
              setSortOption('');
            }}>
            <Text style={[styles.clearAllText, {color: colors.primary}]}>
              Clear All Filters
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Plans List */}
      <FlatList
        data={getFilteredAndSortedPlans()}
        renderItem={renderPlanItem}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.plansList}
        refreshing={isLoading}
        onRefresh={handleRefresh}
        nestedScrollEnabled={true}
        scrollEnabled={true}
      />

      {/* Pay Now Button */}
      {selectedPlan && (
        <View style={styles.payButtonContainer}>
          <TouchableOpacity
            style={[styles.payButton, {backgroundColor: colors.primary}]}
            onPress={handlePayNow}>
                         <Text style={[styles.payButtonText, {color: '#ffffff'}]}>
              {t('renewPlan.payNow')} ₹{payDues > 0 ? selectedPlan.FinalAmount + payDues : selectedPlan.FinalAmount}
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
            
            <View style={styles.modalBody}>
              {/* Speed Filter */}
              <View style={styles.filterSection}>
                <Text style={[styles.filterSectionTitle, {color: colors.text}]}>Speed</Text>
                <View style={styles.filterOptions}>
                  {['25Mbps', '50Mbps', '100Mbps', '200Mbps'].map((speed) => (
                    <TouchableOpacity
                      key={speed}
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

              {/* Validity Filter */}
              <View style={styles.filterSection}>
                <Text style={[styles.filterSectionTitle, {color: colors.text}]}>Validity</Text>
                <View style={styles.filterOptions}>
                  {['30', '90'].map((validity) => (
                    <TouchableOpacity
                      key={validity}
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

              {/* Price Filter */}
              <View style={styles.filterSection}>
                <Text style={[styles.filterSectionTitle, {color: colors.text}]}>Price Range</Text>
                <View style={styles.filterOptions}>
                  {['0-1000', '1000-2000', '2000-5000', '5000+'].map((price) => (
                    <TouchableOpacity
                      key={price}
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

              {/* OTT Filter */}
              <View style={styles.filterSection}>
                <Text style={[styles.filterSectionTitle, {color: colors.text}]}>OTT Services</Text>
                <View style={styles.filterOptions}>
                  {['With OTT', 'Without OTT'].map((ott) => (
                    <TouchableOpacity
                      key={ott}
                      style={[
                        styles.filterOption,
                        {borderColor: colors.border},
                        filters.ottPlan === ott && {backgroundColor: colors.primary, borderColor: colors.primary}
                      ]}
                      onPress={() => setFilters(prev => ({...prev, ottPlan: prev.ottPlan === ott ? '' : ott}))}>
                      <Text style={[
                        styles.filterOptionText,
                        {color: filters.ottPlan === ott ? '#fff' : colors.text}
                      ]}>
                        {ott}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
            
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
    marginBottom: 4,
  },
  currentPlanBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  currentPlanText: {
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
  ottPlanBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  ottPlanText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '600',
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
    fontSize: 14,
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
    fontSize: 24,
    marginRight: 8,
  },
  planTitleContainer: {
    flex: 1,
  },
  detailIcon: {
    fontSize: 16,
    marginRight: 8,
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    marginHorizontal: 0,
    paddingTop: 4,
    paddingHorizontal: 0,
    gap: 25,
  },
  compactDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
    minWidth: 80,
    paddingHorizontal: 8,
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
    bottom: 20,
    left: 20,
    right: 20,
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
});

export default RenewPlanScreen; 