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
import Feather from 'react-native-vector-icons/Feather';
import {useTheme} from '../utils/ThemeContext';
import {getThemeColors} from '../utils/themeStyles';
import CommonHeader from '../components/CommonHeader';
import {useTranslation} from 'react-i18next';
import {apiService} from '../services/api';
import sessionManager from '../services/sessionManager';
import dataCache from '../services/dataCache';
import useMenuSettings from '../hooks/useMenuSettings';

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

type DropdownOption = {
  value: string;
  label: string;
};

// Fixed speed filter options (temporarily limit to 3 buckets)
const SPEED_FILTER_OPTIONS = ['Upto 50Mbps', '50-100Mbps', '100Mbps above'];

const UpgradePlanScreen = ({navigation}: any) => {
  const {isDark} = useTheme();
  const colors = getThemeColors(isDark);
  const {t} = useTranslation();
  const insets = useSafeAreaInsets();
  const { menu } = useMenuSettings();

  const [isLoading, setIsLoading] = useState(true);
  const [plansData, setPlansData] = useState<Plan[]>([]);
  const [authData, setAuthData] = useState<any>(null);
  const [payDues, setPayDues] = useState(0);
  const parseDuesAmount = (value: any): number => {
    if (value === null || value === undefined) return 0;
    const cleaned = String(value).replace(/,/g, '').replace(/[^0-9.-]/g, '');
    const num = Number(cleaned);
    return Number.isFinite(num) ? Math.round(num) : 0;
  };

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
  // Dynamic filter options from Staticdropdown API
  const [speedOptions, setSpeedOptions] = useState<DropdownOption[]>([]);
  const [priceOptions, setPriceOptions] = useState<DropdownOption[]>([]);
  const [staticValidityOptions, setStaticValidityOptions] = useState<string[]>([]);

  const getUsageSubtitle = (limit: string | undefined): string => {
    if (!limit) return '';
    const lower = limit.toLowerCase();
    if (lower === 'unlimited') return 'unlimited usage';
    return `${limit} GB`;
  };

  // Read display_option_json settings for "Upgrade Plan" menu to control plan name visibility
  // and whether to blend plan params (speed/validity/OTTs) into the header row.
  const { showL2SPlanName, showPlanParamsBlend } = useMemo(() => {
    let result = {
      showL2SPlanName: true,
      showPlanParamsBlend: false,
    };
    try {
      if (!Array.isArray(menu)) return result;
      const upgradeMenu = menu.find((m: any) =>
        String(m?.menu_label).trim().toLowerCase() === 'upgrade plan'
      );
      if (!upgradeMenu) return result;

      const jsonVal = upgradeMenu.display_option_json;
      let parsed: any = {};
      if (typeof jsonVal === 'string') {
        // Normalize smart quotes from backend/editor copy-paste to avoid JSON.parse failure.
        const normalizedJson = jsonVal
          .replace(/[“”]/g, '"')
          .replace(/[‘’]/g, "'");
        const trimmed = normalizedJson.trim();
        if (trimmed && (trimmed.startsWith('{') || trimmed.startsWith('['))) {
          try {
            parsed = JSON.parse(trimmed);
          } catch {
            const openCount = (trimmed.match(/\{/g) || []).length;
            let s = trimmed;
            let closeCount = (s.match(/\}/g) || []).length;
            while (closeCount > openCount && s.endsWith('}')) {
              s = s.slice(0, -1);
              closeCount--;
            }
            try { parsed = JSON.parse(s); } catch { parsed = {}; }
          }
        }
      } else if (jsonVal && typeof jsonVal === 'object') {
        parsed = jsonVal;
      }

      const rawNameFlag = parsed?.display_plan_settings?.show_plan?.l2s_planname;
      const rawBlendFlag = parsed?.display_plan_settings?.show_plan?.plan_params_blend;

      let nameFlag = true;
      let blendFlag = false;

      if (typeof rawNameFlag === 'boolean') nameFlag = rawNameFlag;
      else if (typeof rawNameFlag === 'string') nameFlag = rawNameFlag.toLowerCase() === 'true';

      if (typeof rawBlendFlag === 'boolean') blendFlag = rawBlendFlag;
      else if (typeof rawBlendFlag === 'string') blendFlag = rawBlendFlag.toLowerCase() === 'true';

      return {
        showL2SPlanName: nameFlag,
        showPlanParamsBlend: blendFlag,
      };
    } catch {
      return result;
    }
  }, [menu]);

  useEffect(() => {
    // Clear cache and load fresh data when component mounts
    const initializeData = async () => {
      await dataCache.clearAllCache();
      loadPlanData();
      loadStaticFilterOptions();
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
      
      // Keep dues source aligned with HomeScreen (authUser -> payment_dues).
      const payDuesAmount = parseDuesAmount(
        authResponse?.payment_dues ?? authResponse?.user_payment_dues,
      );
      setPayDues(payDuesAmount);
      console.log('=== PAYMENT DUES ===');
      console.log('Dues Source (authUser.payment_dues):', authResponse?.payment_dues);
      console.log('Dues Amount:', payDuesAmount);
      console.log('=== END PAYMENT DUES ===');

      // Get plan list
      const isShowAllPlan = taxInfo?.isShowAllPlan || false;
      
      let planList: any[] = [];
      try {
        // Log exactly what we're passing to the plan API
        console.log('=== UPGRADE PLAN API REQUEST ===');
        console.log('admin_login_id:', authResponse.admin_login_id);
        console.log('username:', username);
        console.log('current_plan1 (for comparison):', authResponse.current_plan1);
        console.log('isShowAllPlan:', isShowAllPlan);
        console.log('is_dashboard:', false);
        console.log('realm:', 'default');
        console.log('=== END UPGRADE PLAN API REQUEST ===');

        planList = await apiService.planList(
          authResponse.admin_login_id,
          username,
          authResponse.current_plan1,
          isShowAllPlan,
          false, // is_dashboard
          'default'
        );

        // High-level summary of what we got back
        console.log('=== UPGRADE PLAN API RESPONSE SUMMARY ===');
        console.log('Type:', typeof planList);
        console.log('Is Array:', Array.isArray(planList));
        console.log('Length:', Array.isArray(planList) ? planList.length : 'N/A');
        if (Array.isArray(planList) && planList.length > 0) {
          const first = planList[0];
          console.log('First plan (summary):', {
            id: first?.id,
            name: first?.name,
            downloadSpeed: first?.downloadSpeed,
            days: first?.days,
            FinalAmount: first?.FinalAmount,
            amt: first?.amt,
          });
        }
        console.log('=== END UPGRADE PLAN API RESPONSE SUMMARY ===');

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

  // Format currency with comma separators (₹X,XXX)
  const formatCurrency = (amount: number) => {
    const rounded = Math.round(amount || 0);
    const withCommas = rounded
      .toString()
      .replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return `₹${withCommas}`;
  };

  const handlePlanSelect = (plan: Plan) => {
    const basePrice = calculateTotalAmount(plan);
    const latestDues = parseDuesAmount(
      authData?.payment_dues ?? authData?.user_payment_dues ?? payDues,
    );
    const totalAmount = latestDues > 0 ? basePrice + latestDues : basePrice;

    // Map the selected plan to the expected structure for confirmation screen
    const planForConfirmation = {
      id: plan.id,
      name: plan.name,
      description: plan.description,
      speed: plan.downloadSpeed || '-',
      upload: plan.uploadSpeed || '-',
      download: plan.downloadSpeed || '-',
      validity: plan.days ? `${plan.days} Days` : '-',
      price: calculateTotalAmount(plan),
      baseAmount: plan.amt,
      cgst: plan.CGSTAmount,
      sgst: plan.SGSTAmount,
      mrp: calculateTotalAmount(plan),
      dues: latestDues > 0 ? latestDues : 0,
      gbLimit: plan.limit === 'Unlimited' ? -1 : plan.limit,
      isCurrentPlan: false, // Always false for upgrade plans
      ottServices: plan.content_providers ? plan.content_providers : [],
      ott_plan: plan.ott_plan,
      voice_plan: plan.voice_plan,
      iptv: plan.iptv,
      fup_flag: plan.fup_flag,
    };

    navigation.navigate('UpgradePlanConfirmation', {
      selectedPlan: planForConfirmation,
      totalAmount: totalAmount,
      payDues: latestDues,
      admin_login_id: authData?.admin_login_id,
    });
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

  // Load dynamic speed / validity / price filter options from Staticdropdown API
  const loadStaticFilterOptions = async () => {
    try {
      const { getClientConfig } = require('../config/client-config');
      const clientConfig = getClientConfig();
      const realm = clientConfig.clientId;

      const dataObj = {
        selfcare_speed_options: ['general', 'selfcare_speed_options'],
        selfcare_validity_options: ['general', 'selfcare_validity_options'],
        selfcare_price_options: ['general', 'selfcare_price_options'],
      };

      const dropdownRes = await apiService.Staticdropdown(dataObj, realm);

      const extractDropdownOptions = (arr: any): DropdownOption[] => {
        if (!Array.isArray(arr)) return [];
        return arr
          .map((item: any) => {
            const rawValue = item?.value ?? item?.label ?? item;
            const rawLabel = item?.label ?? item?.value ?? item;
            if (rawValue == null || rawLabel == null) return null;
            return {
              value: String(rawValue),
              label: String(rawLabel),
            };
          })
          .filter((opt): opt is DropdownOption => Boolean(opt && opt.value?.trim && opt.value.trim()));
      };

      const extractLabelList = (arr: any): string[] =>
        extractDropdownOptions(arr).map(o => o.label);

      if (dropdownRes) {
        const speeds = extractDropdownOptions(dropdownRes.selfcare_speed_options);
        const valids = extractLabelList(dropdownRes.selfcare_validity_options);
        const prices = extractDropdownOptions(dropdownRes.selfcare_price_options);

        if (speeds.length) setSpeedOptions(speeds);
        if (valids.length) setStaticValidityOptions(valids);
        if (prices.length) setPriceOptions(prices);
      }
    } catch (e) {
      console.error('Error loading static filter options (upgrade):', e);
      // On error, we simply fall back to existing hard-coded / derived options
    }
  };

  // Normalize speed string (e.g. "100 Mbps", "1 Gbps", "100/50 Mbps" or raw "102400") into a numeric Mbps value
  const getNumericSpeedMbps = (speed: string | undefined | null): number => {
    if (!speed) return 0;
    const lower = String(speed).toLowerCase();
    // Take only the first numeric token (so "100/50 Mbps" becomes 100)
    const match = lower.match(/(\d+(\.\d+)?)/);
    const numeric = match ? parseFloat(match[1]) : 0;

    if (!numeric) return 0;

    // Explicit units
    if (lower.includes('gbps') || lower.includes('gbit')) {
      return numeric * 1000;
    }
    if (lower.includes('mbps') || lower.includes('mbit')) {
      return numeric;
    }
    if (lower.includes('kbps') || lower.includes('kbit')) {
      return numeric / 1000;
    }

    // No explicit unit: API sometimes sends raw Kbps in "download" (e.g. 102400 for ~100 Mbps)
    // Heuristic: if value is very large, treat as Kbps and convert down
    if (numeric > 2000) {
      return numeric / 1024; // ~100 Mbps for 102400
    }

    // Otherwise assume it's already Mbps
    return numeric;
  };

  const getFilteredAndSortedPlans = () => {
    let filteredPlans = [...plansData];

    // Apply filters
    if (filters.speed) {
      filteredPlans = filteredPlans.filter(plan => {
        const speedMbps = getNumericSpeedMbps(plan.downloadSpeed);
        // If we fail to parse speed, don't exclude the plan just because of bad data
        if (!speedMbps) {
          return true;
        }
        const speedKbps = speedMbps * 1024;
        const v = filters.speed.trim();

        // New dynamic format from Staticdropdown, e.g. "0 AND 51200" (Kbps range)
        if (/and/i.test(v)) {
          const parts = v.split(/and/i).map(p => p.trim());
          const min = parseFloat(parts[0] || '');
          const max = parseFloat(parts[1] || '');

          if (!isNaN(min) && !isNaN(max)) {
            return speedKbps >= min && speedKbps <= max;
          }
          if (!isNaN(min) && isNaN(max)) {
            return speedKbps >= min;
          }
        }

        // Single numeric value => treat as minimum Kbps
        if (/^\d+(\.\d+)?$/.test(v)) {
          const min = parseFloat(v);
          if (!isNaN(min)) {
            return speedKbps >= min;
          }
        }

        // Fallback to label-based ranges
        switch (v) {
          // New 3-option buckets
          case 'Upto 50Mbps':
            return speedMbps <= 50;
          case '50-100Mbps':
            return speedMbps > 50 && speedMbps <= 100;
          case '100Mbps above':
            return speedMbps > 100;
          // Legacy labels (kept for safety)
          case '10 to 50 Mbps':
            return speedMbps >= 10 && speedMbps <= 50;
          case '50 to 100 Mbps':
            return speedMbps > 50 && speedMbps <= 100;
          case '100 to 200 Mbps':
            return speedMbps > 100 && speedMbps <= 200;
          case '200 to 350 Mbps':
            return speedMbps > 200 && speedMbps <= 350;
          case '350 to 500 Mbps':
            return speedMbps > 350 && speedMbps <= 500;
          case '500 to 1000 Mbps':
            return speedMbps > 500 && speedMbps <= 1000;
          case '1000+ Mbps':
            return speedMbps > 1000;
          default:
            return true;
        }
      });
    }
    if (filters.validity) {
      const selValidity = parseInt(filters.validity);
      filteredPlans = filteredPlans.filter(plan => plan.days === selValidity);
    }
    if (filters.price) {
      const value = filters.price.trim();
      const priceRange = value.split('-');
      let minPrice: number | undefined;
      let maxPrice: number | undefined;

      if (priceRange.length === 2) {
        minPrice = parseInt(priceRange[0]);
        maxPrice = parseInt(priceRange[1]);
      } else if (priceRange.length === 1) {
        // "10000" => 10000+
        minPrice = parseInt(priceRange[0]);
      }

      if (!isNaN(minPrice as number) || !isNaN(maxPrice as number)) {
        filteredPlans = filteredPlans.filter(plan => {
          // Use the same tax-inclusive total that we display in the UI
          const price = calculateTotalAmount(plan);
          if (minPrice != null && !isNaN(minPrice) && price < minPrice) return false;
          if (maxPrice != null && !isNaN(maxPrice) && price > maxPrice) return false;
          return true;
        });
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

    // Sort only when user explicitly selects a sort option.
    // Default view keeps API order as-is.
    if (sortOption) {
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
          default:
            return 0;
        }
      });
    }

    return filteredPlans;
  };

  // Dynamic validity options derived from plan API data (fallback if Staticdropdown not available)
  const availableValidities = useMemo(() => {
    const vals = Array.from(new Set(plansData.map(p => p.days).filter(v => Number.isFinite(v)))) as number[];
    return vals.sort((a, b) => a - b).map(v => v.toString());
  }, [plansData]);


  const renderOTTIcon = (provider: any) => {
    if (provider?.full_path_app_logo_file) {
      const imageUri = provider.full_path_app_logo_file;
      return (
        <Image 
          source={{ uri: imageUri }}
          style={styles.ottLogoNew}
          resizeMode="contain"
        />
      );
    }
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
    
    return <Text style={styles.ottIconNew}>{emoji}</Text>;
  };

  const renderPlanItem = ({item}: {item: Plan}) => (
    <View
      style={[
        styles.planCard,
        {backgroundColor: colors.card, shadowColor: colors.shadow},
      ]}>
      
      {/* Compact Plan Header */}
      <TouchableOpacity 
        style={styles.planHeader}
        onPress={() => handlePlanExpand(item.id)}>
        <View style={styles.planInfo}>
          <View style={styles.planTitleRow}>
            <Text style={styles.planIcon}>🚀</Text>
            <View style={styles.planTitleContainer}>
              {showL2SPlanName ? (
                <>
                  <Text style={[styles.planName, {color: colors.textSecondary}]}>{item.name}</Text>
                  {item.description && (
                    <Text style={[styles.planDescription, {color: colors.textSecondary}]}>{item.description}</Text>
                  )}
                </>
              ) : (
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  style={styles.metricHeadlineRowScroll}
                  contentContainerStyle={styles.metricHeadlineRow}>
                  <View style={[styles.metricHeadlineCol, styles.metricHeadlineColWide]}>
                    <Text style={[styles.planName, {color: colors.textSecondary}]}>{formatSpeed(item.downloadSpeed)}</Text>
                    <Text style={styles.metricSubtitle} numberOfLines={1}>{getUsageSubtitle(item.limit)}</Text>
                  </View>
                  <View style={styles.metricHeadlineCol}>
                    <Text style={[styles.planName, {color: colors.textSecondary}]}>{item.days || 0} Days</Text>
                    <Text style={styles.metricSubtitle}>validity</Text>
                  </View>
                  {item.content_providers &&
                    Array.isArray(item.content_providers) &&
                    item.content_providers.length > 0 && (
                      <View style={styles.metricHeadlineCol}>
                        <Text style={[styles.planName, {color: colors.textSecondary}]}>{item.content_providers.length}</Text>
                        <Text style={styles.metricSubtitle}>OTTs</Text>
                      </View>
                    )}
                  {item.fup_flag?.toLowerCase() === 'yes' && (
                    <View style={styles.metricHeadlineCol}>
                      <Text style={[styles.planName, {color: colors.textSecondary}]}>FUP</Text>
                      <Text style={styles.metricSubtitle}>Yes</Text>
                    </View>
                  )}
                  {item.voice_plan?.toLowerCase() === 'yes' && (
                    <View style={styles.metricHeadlineCol}>
                      <Text style={[styles.planName, {color: colors.textSecondary}]}>VOIP</Text>
                      <Text style={styles.metricSubtitle}>Yes</Text>
                    </View>
                  )}
                  {item.iptv?.toLowerCase() === 'yes' && (
                    <View style={styles.metricHeadlineCol}>
                      <Text style={[styles.planName, {color: colors.textSecondary}]}>IPTV</Text>
                      <Text style={styles.metricSubtitle}>Yes</Text>
                    </View>
                  )}
                </ScrollView>
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
            <Text style={[styles.priceText, {color: colors.primary}]}>{formatCurrency(calculateTotalAmount(item))}</Text>
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
          {item.content_providers && item.content_providers.length > 0 && (
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
          <View style={styles.selectPlanContainer}>
            <TouchableOpacity
              style={[styles.selectPlanButton, {backgroundColor: colors.card, borderColor: colors.primary}]}
              onPress={() => handlePlanSelect(item)}>
              <Text style={[styles.selectPlanText, {color: colors.primary}]}>
                {t('renewPlan.selectPlan')}
              </Text>
            </TouchableOpacity>
          </View>
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
            {t('upgradePlan.title')}
          </Text>
          <Text style={[styles.pageSubheading, {color: colors.textSecondary}]}>
            {t('upgradePlan.subtitle')}
          </Text>
        </View>

        {/* Separator line (same as RenewPlanScreen) */}
        <View style={styles.separatorLine}>
          <View style={[styles.separator, {backgroundColor: '#B4B4B4'}]} />
        </View>

        {/* Change your plan section with compact Filter/Sort (same as RenewPlanScreen) */}
        <View style={styles.changePlanSection}>
          <View style={styles.compactFilterRow}>
            <TouchableOpacity
              style={[styles.compactFilterButton, {borderColor: colors.border}]}
              onPress={() => setShowFilterModal(true)}>
              <Feather name="filter" size={14} color={colors.primary} style={styles.compactFilterIcon} />
              <Text style={styles.compactFilterText}>Filter</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.compactFilterButton, {borderColor: colors.border}]}
              onPress={() => setShowSortModal(true)}>
              <Text style={[styles.compactFilterIcon, {color: colors.primary, fontSize: 18}]}>⇅</Text>
              <Text style={styles.compactFilterText}>Sort</Text>
            </TouchableOpacity>
          </View>

          {/* Active Filters Summary (just below Filter & Sort buttons) */}
          {(Object.values(filters).some(filter => filter !== '') || sortOption !== '') && (
            <View style={styles.activeFiltersContainer}>
              <View style={styles.activeFiltersHeaderRow}>
                <Text style={[styles.activeFiltersTitle, {color: colors.textSecondary}]}>
                  Active Filters:
                </Text>
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
            </View>
          )}
        </View>


        {/* Other Plans List - same layout as RenewPlanScreen cards */}
        {getFilteredAndSortedPlans().map((plan: Plan) => (
          <View key={plan.id} style={styles.otherPlanSection}>
            <View style={[styles.planCardNew, styles.otherPlanCard, {borderColor: colors.border, backgroundColor: colors.card}]}>
              <View style={styles.planCardContent}>
                {/* Row 1: two "cells" like <td> */}
                <View style={styles.planCardTopRow}>
                  {/* Left cell: title + metrics + OTT logos */}
                  <View style={styles.planCardLeft}>
                    {showL2SPlanName ? (
                      <>
                        <Text style={styles.planNameNew}>
                          {plan.name}
                        </Text>
                        {plan.description && (
                          <Text style={[styles.planDescriptionNew, {color: colors.textSecondary}]}>
                            {plan.description}
                          </Text>
                        )}
                      </>
                    ) : (
                      <>
                        <ScrollView 
                          horizontal 
                          showsHorizontalScrollIndicator={false}
                          style={styles.metricHeadlineRowScroll}
                          contentContainerStyle={styles.metricHeadlineRow}>
                          <View style={styles.metricHeadlineCol}>
                            <Text style={styles.planNameNew}>{formatSpeed(plan.downloadSpeed)}</Text>
                            <Text style={styles.metricSubtitle} numberOfLines={1}>{getUsageSubtitle(plan.limit)}</Text>
                          </View>
                          <View style={styles.metricHeadlineCol}>
                            <Text style={styles.planNameNew}>{plan.days || 0} Days</Text>
                            <Text style={styles.metricSubtitle}>validity</Text>
                          </View>
                          {plan.content_providers &&
                            Array.isArray(plan.content_providers) &&
                            plan.content_providers.length > 0 && (
                              <View style={styles.metricHeadlineCol}>
                                <Text style={styles.planNameNew}>{plan.content_providers.length}</Text>
                                <Text style={styles.metricSubtitle}>OTTs</Text>
                              </View>
                            )}
                          {plan.fup_flag?.toLowerCase() === 'yes' && (
                            <View style={styles.metricHeadlineCol}>
                              <Text style={styles.planNameNew}>FUP</Text>
                              <Text style={styles.metricSubtitle}>Yes</Text>
                            </View>
                          )}
                          {plan.voice_plan?.toLowerCase() === 'yes' && (
                            <View style={styles.metricHeadlineCol}>
                              <Text style={styles.planNameNew}>VOIP</Text>
                              <Text style={styles.metricSubtitle}>Yes</Text>
                            </View>
                          )}
                          {plan.iptv?.toLowerCase() === 'yes' && (
                            <View style={styles.metricHeadlineCol}>
                              <Text style={styles.planNameNew}>IPTV</Text>
                              <Text style={styles.metricSubtitle}>Yes</Text>
                            </View>
                          )}
                        </ScrollView>
                      </>
                    )}
                    {showL2SPlanName && (
                      <View style={styles.speedValiditySection}>
                        <ScrollView
                          horizontal
                          showsHorizontalScrollIndicator={false}
                          contentContainerStyle={styles.speedValidityScrollContainer}>
                          <View style={styles.speedValidityRowScrollable}>
                            {/* Speed column */}
                            <View style={styles.speedValidityCol}>
                              <Text style={[styles.speedValidityLabel, styles.speedValidityLabelLarge]}>
                                Speed
                              </Text>
                              <Text style={[styles.speedValidityValue, styles.speedValidityValueLarge]}>
                                {formatSpeed(plan.downloadSpeed)}
                              </Text>
                            </View>

                            {/* Validity column */}
                            <View style={styles.speedValidityCol}>
                              <Text style={[styles.speedValidityLabel, styles.speedValidityLabelLarge]}>
                                Validity
                              </Text>
                              <Text style={[styles.speedValidityValue, styles.speedValidityValueLarge]}>
                                {plan.days || 0} Days
                              </Text>
                            </View>

                            {/* OTTs column */}
                            {plan.content_providers &&
                              Array.isArray(plan.content_providers) &&
                              plan.content_providers.length > 0 && (
                                <View style={styles.speedValidityCol}>
                                  <Text style={[styles.speedValidityLabel, styles.speedValidityLabelLarge]}>
                                    OTTs
                                  </Text>
                                  <Text style={[styles.speedValidityValue, styles.speedValidityValueLarge]}>
                                    {plan.content_providers.length}
                                  </Text>
                                </View>
                              )}

                            {/* VOICE column */}
                            {plan.voice_plan?.toLowerCase() === 'yes' && (
                              <View style={styles.speedValidityCol}>
                                <Text style={[styles.speedValidityLabel, styles.speedValidityLabelLarge]}>
                                  VOICE
                                </Text>
                                <Text style={[styles.speedValidityValue, styles.speedValidityValueLarge]}>
                                  Yes
                                </Text>
                              </View>
                            )}

                            {/* IPTV column */}
                            {plan.iptv?.toLowerCase() === 'yes' && (
                              <View style={styles.speedValidityCol}>
                                <Text style={[styles.speedValidityLabel, styles.speedValidityLabelLarge]}>
                                  IPTV
                                </Text>
                                <Text style={[styles.speedValidityValue, styles.speedValidityValueLarge]}>
                                  Yes
                                </Text>
                              </View>
                            )}

                            {/* FUP column */}
                            {plan.fup_flag?.toLowerCase() === 'yes' && (
                              <View style={styles.speedValidityCol}>
                                <Text style={[styles.speedValidityLabel, styles.speedValidityLabelLarge]}>
                                  FUP
                                </Text>
                                <Text style={[styles.speedValidityValue, styles.speedValidityValueLarge]}>
                                  Yes
                                </Text>
                              </View>
                            )}
                          </View>
                        </ScrollView>
                      </View>
                    )}

                    {/* Thin grey separator + OTT row (only if OTT data exists) */}
                    {plan.content_providers && Array.isArray(plan.content_providers) && plan.content_providers.length > 0 && (
                      <>
                        <View
                          style={{
                            height: StyleSheet.hairlineWidth * 2,
                            backgroundColor: colors.border || '#B0B0B0',
                            marginTop: 2,
                            marginBottom: 2,
                          }}
                        />
                        <View style={styles.ottLogosSection}>
                          <ScrollView 
                            horizontal 
                            scrollEnabled={true}
                            showsHorizontalScrollIndicator={false}
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
                        </View>
                      </>
                    )}
                  </View>

                  {/* Vertical separator between content and price box */}
                  <View style={styles.planVerticalSeparator} />

                  {/* Right cell: price + Select */}
                  <View style={styles.planCardRight}>
                    <View style={styles.planPriceBlock}>
                      <Text style={[styles.planPriceNew, {color: colors.primary}]}>
                        {formatCurrency(calculateTotalAmount(plan))}
                      </Text>
                      <TouchableOpacity
                        style={[
                          styles.planActionButton, 
                          {
                            backgroundColor: colors.primary
                          }
                        ]}
                        onPress={() => handlePlanSelect(plan)}>
                        <Text style={styles.planActionButtonText}>
                          Select
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          </View>
        ))}

        {/* Active Filters Summary */}
        {/* (Now rendered inside changePlanSection just below Filter/Sort buttons) */}

      </ScrollView>

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
                  {(staticValidityOptions.length
                    ? staticValidityOptions
                    : availableValidities.map(v => `${v} Days`)
                  ).map((label) => (
                    <TouchableOpacity
                      key={`val-${label}`}
                      style={[
                        styles.filterOption,
                        {borderColor: colors.border},
                        filters.validity === label && {backgroundColor: colors.primary, borderColor: colors.primary}
                      ]}
                      onPress={() => {
                        setFilters(prev => ({
                          ...prev,
                          validity: prev.validity === label ? '' : label
                        }));
                      }}>
                      <Text style={[
                        styles.filterOptionText,
                        {color: filters.validity === label ? '#fff' : colors.text}
                      ]}>
                        {label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Price Filter (Dynamic from Staticdropdown, fallback to static ranges) */}
              <View style={styles.filterSection}>
                <Text style={[styles.filterSectionTitle, {color: colors.text}]}>Price Range</Text>
                <View style={styles.filterOptions}>
                  {(priceOptions.length
                    ? priceOptions.map(opt => ({ value: opt.value, label: opt.label }))
                    : ['0-1000', '1000-2000', '2000-5000', '5000-10000'].map(p => ({ value: p, label: p }))
                  ).map((opt) => (
                    <TouchableOpacity
                      key={`pr-${opt.value}`}
                      style={[
                        styles.filterOption,
                        {borderColor: colors.border},
                        filters.price === opt.value && {backgroundColor: colors.primary, borderColor: colors.primary}
                      ]}
                      onPress={() => setFilters(prev => ({
                        ...prev,
                        price: prev.price === opt.value ? '' : opt.value
                      }))}>
                      <Text style={[
                        styles.filterOptionText,
                        {color: filters.price === opt.value ? '#fff' : colors.text}
                      ]}>
                        ₹{opt.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Speed Filter (temporarily fixed to 3 buckets) */}
              <View style={styles.filterSection}>
                <Text style={[styles.filterSectionTitle, {color: colors.text}]}>Speed</Text>
                <View style={styles.filterOptions}>
                  {(speedOptions.length
                    ? speedOptions.map(opt => ({ value: opt.value, label: opt.label }))
                    : SPEED_FILTER_OPTIONS.map(label => ({ value: label, label }))
                  ).map((opt) => (
                    <TouchableOpacity
                      key={`sp-${opt.value}`}
                      style={[
                        styles.filterOption,
                        {borderColor: colors.border},
                        filters.speed === opt.value && {backgroundColor: colors.primary, borderColor: colors.primary}
                      ]}
                      onPress={() => setFilters(prev => ({
                        ...prev,
                        speed: prev.speed === opt.value ? '' : opt.value
                      }))}>
                      <Text style={[
                        styles.filterOptionText,
                        {color: filters.speed === opt.value ? '#fff' : colors.text}
                      ]}>
                        {opt.label}
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
    minHeight: 80,
  },
  planInfo: {
    flex: 1,
    minHeight: 80,
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
  metricHeadlineRowScroll: {
    marginBottom: 4,
    minHeight: 50,
  },
  metricHeadlineRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingVertical: 2,
    gap: 12,
    paddingRight: 8,
  },
  metricHeadlineCol: {
    minWidth: 80,
  },
  metricHeadlineColWide: {
    minWidth: 120,
  },
  metricSubtitle: {
    fontSize: 10,
    color: '#4D4D4D',
    flexShrink: 0,
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
    minHeight: 50,
  },
  detailIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  ottSection: {
    marginTop: 14,
    paddingTop: 22,
    borderTopWidth: 2,
    borderTopColor: '#B0B0B0',
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
    paddingVertical: 6,
    marginBottom: 4,
  },
  activeFiltersHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  activeFiltersTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  activeFiltersList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 4,
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
    paddingVertical: 2,
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
  ottLogoNew: {
    width: 30,
    height: 30,
  },
  ottIconNew: {
    fontSize: 24,
  },
  ottName: {
    fontSize: 10,
    textAlign: 'center',
    marginTop: 4,
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
    borderRadius: 8,
    borderWidth: 1,
    padding: 10,
    minHeight: 124, // allow card to grow with OTT/content instead of clipping
    overflow: 'visible',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  otherPlanCard: {
    borderColor: '#e0e0e0',
  },
  planCardContent: {
    flexDirection: 'column',
    marginTop: 4,
    flex: 1,
  },
  planCardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  planCardLeft: {
    flex: 1,
    marginRight: 0,
  },
  planCardRight: {
    width: 101.01,
    height: 104,
    alignItems: 'stretch',
    justifyContent: 'center',
    marginLeft: 0,
    alignSelf: 'flex-start',
    backgroundColor: '#F9F9F9',
    borderTopRightRadius: 10,
    borderBottomRightRadius: 10,
  },
  planVerticalSeparator: {
    width: 1,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 8,
    alignSelf: 'stretch',
  },
  planPriceBlock: {
    width: 101.01,
    height: 104,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 10,
  },
  planNameNew: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter',
    color: '#000000',
    marginBottom: 4,
  },
  planDescriptionNew: {
    fontSize: 12,
    fontWeight: '400',
    marginBottom: 4,
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
    fontFamily: 'Inter',
    fontWeight: '600',
    marginBottom: 6,
  },
  planActionButton: {
    paddingHorizontal: 20,
    paddingVertical: 6,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
  },
  planActionButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  separatorLine: {
    paddingHorizontal: 20,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 8,
  },
  separator: {
    width: '100%',
    height: 1,
  },
  changePlanSection: {
    paddingHorizontal: 20,
    marginTop: 2,
    marginBottom: 12,
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
  compactFilterRow: {
    flexDirection: 'row',
    gap: 8,
  },
  compactFilterButton: {
    flex: 1,
    height: 29,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    opacity: 1,
    borderRadius: 5,
    borderWidth: 1,
  },
  compactFilterIcon: {
    fontSize: 18,
    marginRight: 6,
  },
  compactFilterText: {
    fontSize: 12,
    fontWeight: '500',
    fontFamily: 'Inter',
    color: '#4D4D4D',
  },
  speedValiditySection: {
    marginTop: 2,
    marginBottom: 2,
  },
  speedValidityHeaders: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
    gap: 12,
  },
  speedValidityLabel: {
    fontSize: 10,
    fontWeight: '400',
    fontFamily: 'Inter',
    color: '#4D4D4D',
    marginHorizontal: 6,
    flexShrink: 0,
  },
  speedValidityValues: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  speedValidityValue: {
    fontSize: 10,
    fontWeight: '400',
    fontFamily: 'Inter',
    color: '#4D4D4D',
    marginHorizontal: 6,
    flexShrink: 0,
  },
  // Larger heading font for Speed / Validity / OTT / VOICE / IPTV / FUP
  speedValidityLabelLarge: {
    fontSize: 12,
    fontWeight: '600',
  },
  // Scroll container for the horizontal row of plan parameters
  speedValidityScrollContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingRight: 8,
  },
  // Row inside the horizontal ScrollView that contains parameter columns
  speedValidityRowScrollable: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  // Single column (heading + value) for a plan parameter
  speedValidityCol: {
    minWidth: 80,
    marginRight: 12,
  },
  // Slightly lighter style for values so they are distinct from headings
  speedValidityValueLarge: {
    fontSize: 12,
    fontWeight: '500',
    color: '#5A5A5A',
  },
  ottLogosSection: {
    marginTop: 14,
    marginBottom: 2,
    width: '100%',
  },
  ottLogosScrollView: {
    maxHeight: 70,
    paddingVertical: 0,
    width: '100%',
  },
  ottLogosScrollContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingRight: 8,
    paddingLeft: 0,
    gap: 8,
  },
  ottLogoItem: {
    alignItems: 'center',
    width: 60,
    marginRight: 0,
  },
  ottLogoWrapper: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  ottServiceName: {
    fontSize: 10,
    fontFamily: 'Inter',
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 12,
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