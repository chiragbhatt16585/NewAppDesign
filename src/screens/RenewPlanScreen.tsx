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
import {SafeAreaView} from 'react-native-safe-area-context';
import Feather from 'react-native-vector-icons/Feather';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {useTheme} from '../utils/ThemeContext';
import {getThemeColors} from '../utils/themeStyles';
import CommonHeader from '../components/CommonHeader';
import {useTranslation} from 'react-i18next';
import {apiService} from '../services/api';
import sessionManager from '../services/sessionManager';
import dataCache from '../services/dataCache';
import LeftBorderLine from '../components/LeftBorderLine';
import useMenuSettings from '../hooks/useMenuSettings';
import { getClientConfig } from '../config/client-config';

interface Plan {
  id: string;
  name: string;
  description?: string;
  downloadSpeed: string;
  uploadSpeed: string;
  days: number;
  FinalAmount: number;
  user_mrp?: number;
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

const RenewPlanScreen = ({navigation}: any) => {
  const {isDark} = useTheme();
  const colors = getThemeColors(isDark);
  const {t} = useTranslation();
  const { menu } = useMenuSettings();
  const isMicroscan = getClientConfig().clientId === 'microscan';

  const [isLoading, setIsLoading] = useState(true);
  const [plansData, setPlansData] = useState<Plan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
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

  // Read display_option_json settings for "Renew Plan" menu to control plan name visibility
  // and whether to blend plan params (speed/validity/OTTs) into the header row.
  const { showL2SPlanName, showPlanParamsBlend } = useMemo(() => {
    let result = {
      showL2SPlanName: true,
      showPlanParamsBlend: false,
    };
    try {
      if (!Array.isArray(menu)) return result;
      const renewMenu = menu.find((m: any) =>
        String(m?.menu_label).trim().toLowerCase() === 'renew plan'
      );
      if (!renewMenu) return result;

      const jsonVal = renewMenu.display_option_json;
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
            // Attempt to repair extra trailing braces (same strategy as AddTicketScreen)
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

      console.log('[RenewPlan] display_option_json raw:', jsonVal);
      console.log('[RenewPlan] display_option_json parsed:', parsed);
      console.log('[RenewPlan] resolved settings:', {
        showL2SPlanName: nameFlag,
        showPlanParamsBlend: blendFlag,
        rawNameFlag,
        rawBlendFlag,
      });

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
      //console.log('Fetching fresh data from API');
      
      // Get user authentication data
      const authResponse = await apiService.makeAuthenticatedRequest(async (token) => {
        return await apiService.authUser(username);
      });
      setAuthData(authResponse);

      // Get admin tax info
      const taxInfo = await apiService.getAdminTaxInfo(authResponse.admin_login_id, 'default');
      
      // Keep dues source aligned with HomeScreen (authUser -> payment_dues).
      const payDuesAmount = parseDuesAmount(
        authResponse?.payment_dues ?? authResponse?.user_payment_dues,
      );
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
        // FULL RAW RESPONSE (Plan List)
        console.log('=== FULL PLAN LIST RAW RESPONSE START ===');
        console.log('Plan List Type:', typeof planList);
        console.log('Plan List Is Array:', Array.isArray(planList));
        console.log('Plan List Length:', Array.isArray(planList) ? planList.length : 'N/A');
        // try {
        //   console.log('=== FULL PLAN LIST JSON ===');
        //   console.log(JSON.stringify(planList, null, 2));
        //   console.log('=== END FULL PLAN LIST JSON ===');
        // } catch (e) {
        //   console.error('Error stringifying plan list:', e);
        // }
        
        console.log('=== PLAN API RESPONSE SUCCESS ===');
        console.log('Plan Count:', planList?.length || 0);
        // if (planList?.[0]) {
        //   console.log('First Plan Name:', planList[0].name);
        //   console.log('First Plan Speed:', planList[0].downloadSpeed);
        //   console.log('First Plan Price:', planList[0].FinalAmount);
        //   console.log('First Plan Validity:', planList[0].days);
        //   console.log('First Plan Data Limit:', planList[0].limit);
        //   console.log('First Plan OTT Count:', planList[0].content_providers?.length || 0);
        //   console.log('First Plan content_providers:', planList[0].content_providers);
        //   console.log('First Plan content_providers type:', typeof planList[0].content_providers);
        //   console.log('First Plan content_providers is array:', Array.isArray(planList[0].content_providers));
          
        //   // Detailed OTT logo debugging
        //   if (planList[0].content_providers) {
        //     console.log('=== OTT CONTENT PROVIDERS DEBUG ===');
        //     if (Array.isArray(planList[0].content_providers)) {
        //       console.log('Content Providers Array Length:', planList[0].content_providers.length);
        //       planList[0].content_providers.forEach((provider: any, idx: number) => {
        //         console.log(`Provider ${idx + 1}:`, {
        //           content_provider: provider.content_provider,
        //           app_logo_file: provider.app_logo_file,
        //           full_path_app_logo_file: provider.full_path_app_logo_file,
        //           all_keys: Object.keys(provider),
        //           full_object: JSON.stringify(provider, null, 2)
        //         });
        //       });
        //     } else {
        //       console.log('Content Providers is NOT an array:', planList[0].content_providers);
        //       console.log('Content Providers type:', typeof planList[0].content_providers);
        //     }
        //     console.log('=== END OTT CONTENT PROVIDERS DEBUG ===');
        //   } else {
        //     console.log('No content_providers field in first plan');
        //   }
        // }
        // console.log('=== END PLAN API RESPONSE ===');
        // Debug: print raw plan API payload (first item and count)
        // try {
        //   console.log('RAW planList length =>', Array.isArray(planList) ? planList.length : 'not array');
        //   if (Array.isArray(planList) && planList.length > 0) {
        //     console.log('RAW planList[0] =>', JSON.stringify(planList[0], null, 2));
        //   }
        // } catch (e) {
        //   console.error('Error logging raw plan list:', e);
        // }
        try {
          // Alert.alert(
          //   'Plan API Debug',
          //   `Count: ${Array.isArray(planList) ? planList.length : 0}\nFirst: ${Array.isArray(planList) && planList[0] ? JSON.stringify({
          //     id: planList[0].id,
          //     name: planList[0].name,
          //     user_mrp: planList[0].user_mrp,
          //     FinalAmount: planList[0].FinalAmount,
          //     amt: planList[0].amt,
          //   }) : 'N/A'}`
          // );
        } catch (e) {}
        
        // Print plan list array for debugging
        //console.log('=== PLAN LIST ARRAY DEBUG ===');
        //console.log('Total Plans:', planList?.length || 0);
        if (planList && planList.length > 0) {
          // console.log('First Plan Object:', JSON.stringify(planList[0], null, 2));
          // console.log('All Plan Names:', planList.map(plan => plan.name));
          // console.log('Sample Plan Fields:', {
          //   id: planList[0].id,
          //   name: planList[0].name,
          //   downloadSpeed: planList[0].downloadSpeed,
          //   uploadSpeed: planList[0].uploadSpeed,
          //   days: planList[0].days,
          //   FinalAmount: planList[0].FinalAmount,
          //   amt: planList[0].amt,
          //   CGSTAmount: planList[0].CGSTAmount,
          //   SGSTAmount: planList[0].SGSTAmount,
          //   limit: planList[0].limit,
          //   ott_plan: planList[0].ott_plan,
          //   voice_plan: planList[0].voice_plan,
          //   fup_flag: planList[0].fup_flag,
          //   iptv: planList[0].iptv,
          //   content_providers: planList[0].content_providers
          // });
          // console.log('=== PLAN FILTER DEBUG ===');
          // console.log('Voice plan value:', planList[0].voice_plan);
          // console.log('OTT plan value:', planList[0].ott_plan);
          // console.log('IPTV value:', planList[0].iptv);
          // console.log('FUP flag value:', planList[0].fup_flag);
        }
        //console.log('=== END PLAN LIST ARRAY DEBUG ===');
        
        // Normalize numeric amounts to ensure UI shows correct values
        const normalizedPlans = Array.isArray(planList)
          ? planList.map((p: any) => {
              const finalAmtRaw = p?.FinalAmount ?? p?.finalAmount ?? p?.mrp ?? p?.amt;
              const finalAmtNum = Number(finalAmtRaw);
              const userMrpNum = Number(p?.user_mrp);
              
              // Debug: Check for content_providers in various formats
              // console.log(`=== Normalizing Plan: ${p?.name} ===`);
              // console.log('Raw content_providers:', p?.content_providers);
              // console.log('content_providers type:', typeof p?.content_providers);
              // console.log('All plan keys:', Object.keys(p || {}));
              
              // DON'T normalize content_providers - preserve exactly as it comes from API (like UpgradePlanScreen)
              // This ensures OTT content is not lost during normalization
              
              const normalizedPlan = {
                ...p, // Spread all original properties including content_providers
                FinalAmount: Number.isFinite(finalAmtNum) ? finalAmtNum : 0,
                user_mrp: Number.isFinite(userMrpNum)
                  ? userMrpNum
                  : (Number.isFinite(Number(p?.mrp)) ? Number(p?.mrp) : undefined),
                amt: Number.isFinite(Number(p?.amt)) ? Number(p?.amt) : p?.amt,
                CGSTAmount: Number.isFinite(Number(p?.CGSTAmount)) ? Number(p?.CGSTAmount) : p?.CGSTAmount,
                SGSTAmount: Number.isFinite(Number(p?.SGSTAmount)) ? Number(p?.SGSTAmount) : p?.SGSTAmount,
                // content_providers is preserved from ...p spread above - don't overwrite it
              };
              
              // Debug: Log OTT content for plans that should have it
              if (p?.ott_plan?.toLowerCase() === 'yes' || (normalizedPlan.content_providers && Array.isArray(normalizedPlan.content_providers) && normalizedPlan.content_providers.length > 0)) {
                console.log(`[RenewPlan] Plan "${p?.name}": content_providers length = ${normalizedPlan.content_providers?.length || 0}`, normalizedPlan.content_providers);
              }
              
              return normalizedPlan;
            })
          : [];
        
        // Debug: Print plan array with OTT information
        // console.log('=== PLAN ARRAY DEBUG (NORMALIZED) ===');
        // console.log('Total Plans:', normalizedPlans.length);
        // normalizedPlans.forEach((plan: any, index: number) => {
        //   console.log(`\n--- Plan ${index + 1}: ${plan.name} ---`);
        //   console.log('Plan ID:', plan.id);
        //   console.log('Plan Name:', plan.name);
        //   console.log('Plan Description:', plan.description);
        //   console.log('Download Speed:', plan.downloadSpeed);
        //   console.log('Days:', plan.days);
        //   console.log('Amount:', plan.amt);
        //   console.log('Final Amount:', plan.FinalAmount);
        //   console.log('CGST Amount:', plan.CGSTAmount);
        //   console.log('SGST Amount:', plan.SGSTAmount);
        //   console.log('Content Providers (OTT):', plan.content_providers);
        //   console.log('Content Providers Type:', typeof plan.content_providers);
        //   console.log('Content Providers Is Array:', Array.isArray(plan.content_providers));
        //   console.log('Content Providers Length:', plan.content_providers?.length || 0);
        //   if (plan.content_providers && Array.isArray(plan.content_providers) && plan.content_providers.length > 0) {
        //     console.log('=== Content Providers Details ===');
        //     plan.content_providers.forEach((provider: any, pIndex: number) => {
        //       console.log(`  Provider ${pIndex + 1}:`, {
        //         content_provider: provider.content_provider,
        //         app_logo_file: provider.app_logo_file,
        //         full_path_app_logo_file: provider.full_path_app_logo_file,
        //         all_keys: Object.keys(provider),
        //         full_object: JSON.stringify(provider, null, 2)
        //       });
        //       // Check if URL is valid
        //       if (provider.full_path_app_logo_file) {
        //         console.log(`    URL Check: ${provider.full_path_app_logo_file}`);
        //         console.log(`    URL starts with http: ${provider.full_path_app_logo_file.startsWith('http')}`);
        //         console.log(`    URL length: ${provider.full_path_app_logo_file.length}`);
        //       } else {
        //         console.log(`    ⚠️ NO full_path_app_logo_file for provider ${pIndex + 1}`);
        //       }
        //     });
        //     console.log('=== End Content Providers Details ===');
        //   } else {
        //     console.log('⚠️ No content_providers or empty array for plan:', plan.name);
        //   }
        //   console.log('OTT Plan:', plan.ott_plan);
        //   console.log('Voice Plan:', plan.voice_plan);
        //   console.log('IPTV:', plan.iptv);
        //   console.log('FUP Flag:', plan.fup_flag);
        //   console.log('Limit:', plan.limit);
        // });
        // console.log('=== END PLAN ARRAY DEBUG ===\n');
        
        setPlansData(normalizedPlans);
      } catch (planError: any) {
        // console.error('=== PLAN API ERROR ===');
        // console.error('Error:', planError);
        // console.error('Error Message:', planError.message);
        // console.error('Error Stack:', planError.stack);
        // console.error('=== END PLAN API ERROR ===');
        
        // Set empty array if API fails
        setPlansData([]);
        return; // Exit early if plan API fails
      }

      // Cache the data
      await dataCache.setUserData({
        authData: authResponse,
        plansData: plansData,
        taxInfo: taxInfo,
        payDues: payDuesAmount,
        lastUpdated: Date.now()
      });

      // Set current plan as selected by default
      const currentPlan = plansData.find((plan: any) => plan.name === authResponse.current_plan || plan.name === authResponse.current_plan1);
      if (currentPlan) {
        setSelectedPlan(currentPlan);
      }

    } catch (error: any) {
      // console.error('Load plan data error:', error);
      
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

  const proceedToPlanConfirmation = (plan: Plan) => {
    if (!plan) {
      Alert.alert('Error', 'Please select a plan first');
      return;
    }

    const basePrice = calculateTotalAmount(plan);
    const latestDues = parseDuesAmount(
      authData?.payment_dues ?? authData?.user_payment_dues ?? payDues,
    );
    const totalAmount = latestDues > 0 ? basePrice + latestDues : basePrice;

    const planForConfirmation = {
      id: plan.id,
      name: plan.name,
      description: plan.description,
      speed: plan.downloadSpeed || '-',
      upload: plan.uploadSpeed || '-',
      download: plan.downloadSpeed || '-',
      validity: plan.days ? `${plan.days} Days` : '-',
      price: basePrice,
      baseAmount: plan.amt,
      cgst: plan.CGSTAmount,
      sgst: plan.SGSTAmount,
      mrp: basePrice,
      dues: latestDues > 0 ? latestDues : 0,
      gbLimit: plan.limit === 'Unlimited' ? -1 : plan.limit,
      isCurrentPlan: plan.name === authData?.current_plan || plan.name === authData?.current_plan1,
      ottServices: plan.content_providers ? plan.content_providers : [],
      ott_plan: plan.ott_plan,
      voice_plan: plan.voice_plan,
      iptv: plan.iptv,
      fup_flag: plan.fup_flag,
    };

    navigation.navigate('PlanConfirmation', {
      selectedPlan: planForConfirmation,
      totalAmount: totalAmount,
      payDues: latestDues,
      admin_login_id: authData?.admin_login_id,
    });
  };

  const handlePlanSelect = (plan: Plan) => {
    setSelectedPlan(plan);
    proceedToPlanConfirmation(plan);
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
      console.log('=== STATIC FILTER OPTIONS (RenewPlanScreen) ===');
      console.log('Raw dropdownRes:', JSON.stringify(dropdownRes, null, 2));

      const extractDropdownOptions = (arr: any): DropdownOption[] => {
        if (!Array.isArray(arr)) return [];
        const result: DropdownOption[] = [];
        arr.forEach((item: any) => {
          const rawValue = item?.value ?? item?.label ?? item;
          const rawLabel = item?.label ?? item?.value ?? item;
          if (rawValue == null || rawLabel == null) {
            return;
          }
          const valueStr = String(rawValue).trim();
          const labelStr = String(rawLabel).trim();
          if (!valueStr || !labelStr) {
            return;
          }
          result.push({ value: valueStr, label: labelStr });
        });
        return result;
      };

      const extractLabelList = (arr: any): string[] =>
        extractDropdownOptions(arr).map(o => o.label);

      if (dropdownRes) {
        const speeds = extractDropdownOptions(dropdownRes.selfcare_speed_options);
        const valids = extractLabelList(dropdownRes.selfcare_validity_options);
        const prices = extractDropdownOptions(dropdownRes.selfcare_price_options);

        console.log('Parsed speed options:', speeds);
        console.log('Parsed validity options:', valids);
        console.log('Parsed price options:', prices);

        if (speeds.length) setSpeedOptions(speeds);
        if (valids.length) setStaticValidityOptions(valids);
        if (prices.length) setPriceOptions(prices);
      }
    } catch (e) {
      console.error('Error loading static filter options:', e);
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
    
    console.log('=== FILTERING PLANS ===');
    console.log('Total plans before filtering:', filteredPlans.length);
    console.log('Active filters:', filters);
    console.log('Sort option:', sortOption);

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
      // console.log('=== VOICE PLAN FILTER DEBUG ===');
      // console.log('Filter value:', filters.voipPlan);
      // console.log('Plans before filter:', filteredPlans.length);
      // console.log('Plan voice_plan values:', filteredPlans.map(p => ({ name: p.name, voice_plan: p.voice_plan })));
      filteredPlans = filteredPlans.filter(plan => 
        plan.voice_plan?.toLowerCase() === 'yes'
      );
      // console.log('Plans after filter:', filteredPlans.length);
      // console.log('=== END VOICE PLAN FILTER DEBUG ===');
    }
    if (filters.iptvPlan) {
      filteredPlans = filteredPlans.filter(plan => 
        plan.iptv?.toLowerCase() === 'yes'
      );
    }
    if (filters.fupPlan) {
      // console.log('=== FUP PLAN FILTER DEBUG ===');
      // console.log('Filter value:', filters.fupPlan);
      // console.log('Plans before filter:', filteredPlans.length);
      // console.log('Plan fup_flag values:', filteredPlans.map(p => ({ name: p.name, fup_flag: p.fup_flag })));
      filteredPlans = filteredPlans.filter(plan => 
        plan.fup_flag?.toLowerCase() === 'yes'
      );
      // console.log('Plans after filter:', filteredPlans.length);
      // console.log('=== END FUP PLAN FILTER DEBUG ===');
    }

    // Sort only when user explicitly selects a sort option.
    // Default view keeps API order as-is.
    if (sortOption) {
      filteredPlans.sort((a, b) => {
        // Keep sorting aligned with what the UI displays (tax-inclusive total amount).
        const aDisplayPrice = calculateTotalAmount(a);
        const bDisplayPrice = calculateTotalAmount(b);

        switch (sortOption) {
          case 'price-low-high':
            return aDisplayPrice - bDisplayPrice;
          case 'price-high-low':
            return bDisplayPrice - aDisplayPrice;
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

    console.log('Total plans after filtering and sorting:', filteredPlans.length);
    console.log('Filtered plan names:', filteredPlans.map(p => p.name));
    console.log('=== END FILTERING PLANS ===');

    return filteredPlans;
  };

  // Dynamic validity options derived from plan API data (fallback if Staticdropdown not available)
  const availableValidities = useMemo(() => {
    const vals = Array.from(new Set(plansData.map(p => p.days).filter(v => Number.isFinite(v)))) as number[];
    return vals.sort((a, b) => a - b).map(v => v.toString());
  }, [plansData]);

  

  

  const handlePayNow = () => {
    if (!selectedPlan) {
      Alert.alert('Error', 'Please select a plan first');
      return;
    }
    proceedToPlanConfirmation(selectedPlan);
  };

  const renderOTTIcon = (provider: any) => {
    // console.log('=== renderOTTIcon DEBUG ===');
    // console.log('Provider object:', provider);
    // console.log('Provider keys:', Object.keys(provider || {}));
    // console.log('full_path_app_logo_file:', provider?.full_path_app_logo_file);
    // console.log('app_logo_file:', provider?.app_logo_file);
    // console.log('content_provider:', provider?.content_provider);
    
    if (provider?.full_path_app_logo_file) {
      const imageUri = provider.full_path_app_logo_file;
      // console.log('Using image URI:', imageUri);
      // console.log('URI is valid:', typeof imageUri === 'string' && imageUri.length > 0);
      return (
        <Image 
          source={{ uri: imageUri }}
          style={styles.ottLogoNew}
          resizeMode="contain"
          onError={(error) => {
            // console.error('Image load error:', error.nativeEvent.error);
            // console.error('Failed URI:', imageUri);
          }}
          onLoad={() => {
            // console.log('Image loaded successfully:', imageUri);
          }}
        />
      );
    }
    // Fallback to icon if no logo available
    const serviceName = provider.content_provider?.toLowerCase() || '';
    let iconName = 'movie';
    
    switch (serviceName) {
      case 'netflix':
      case 'amazon prime':
      case 'disney+ hotstar':
      case 'jiohotstar':
      case 'jiocinema':
      case 'sonyliv':
      default:
        iconName = 'movie';
        break;
    }
    
    return <MaterialIcons name={iconName} size={24} color={colors.primary} style={styles.ottIconNew} />;
  };

  const renderPlanItem = ({item}: {item: Plan}) => {
    try {
      //console.log('Rendering plan item:', item.name);
      return (
    <View style={styles.planCardWrapper}>
      {(item.name === authData?.current_plan || item.name === authData?.current_plan1) && (
        <View style={[styles.currentPlanTopBadge, {backgroundColor: colors.primary}]}>
          <Text style={styles.currentPlanTopText}>{t('renewPlan.currentPlan')}</Text>
        </View>
      )}
      <View
        style={[
          styles.planCard,
          {backgroundColor: colors.card, shadowColor: colors.shadow},
          (item.name === authData?.current_plan || item.name === authData?.current_plan1) && {borderColor: colors.primaryLight, borderWidth: 1},
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
                  <Text style={styles.planName}>{item.name}</Text>
                  {item.description && (
                    <Text style={[styles.planDescription, {color: colors.textSecondary}]}>{item.description}</Text>
                  )}
                </>
              ) : (
                <>
                  <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false}
                    style={styles.metricHeadlineRowScroll}
                    contentContainerStyle={styles.metricHeadlineRow}>
                    <View style={[styles.metricHeadlineCol, styles.metricHeadlineColWide]}>
                      <Text style={styles.planName}>{formatSpeed(item.downloadSpeed)}</Text>
                      <Text style={styles.metricSubtitle} numberOfLines={1}>{getUsageSubtitle(item.limit)}</Text>
                    </View>
                    <View style={styles.metricHeadlineCol}>
                      <Text style={styles.planName}>{item.days || 0} Days</Text>
                      <Text style={styles.metricSubtitle}>validity</Text>
                    </View>
                    {item.content_providers &&
                      Array.isArray(item.content_providers) &&
                      item.content_providers.length > 0 && (
                        <View style={styles.metricHeadlineCol}>
                          <Text style={styles.planName}>{item.content_providers.length}</Text>
                          <Text style={styles.metricSubtitle}>OTTs</Text>
                        </View>
                      )}
                    {item.fup_flag?.toLowerCase() === 'yes' && (
                      <View style={styles.metricHeadlineCol}>
                        <Text style={styles.planName}>FUP</Text>
                        <Text style={styles.metricSubtitle}>Yes</Text>
                      </View>
                    )}
                    {item.voice_plan?.toLowerCase() === 'yes' && (
                      <View style={styles.metricHeadlineCol}>
                        <Text style={styles.planName}>VOIP</Text>
                        <Text style={styles.metricSubtitle}>Yes</Text>
                      </View>
                    )}
                    {item.iptv?.toLowerCase() === 'yes' && (
                      <View style={styles.metricHeadlineCol}>
                        <Text style={styles.planName}>IPTV</Text>
                        <Text style={styles.metricSubtitle}>Yes</Text>
                      </View>
                    )}
                  </ScrollView>
                </>
              )}
              <View style={styles.planBadges}>
              </View>
            </View>
          </View>
          
          {/* Compact Plan Details - Always Visible */}
          <View style={styles.compactDetails}>
            {/* First Row: Speed and Validity */}
            <View style={styles.speedValidityRow}>
              <View style={styles.compactDetailRow}>
                <MaterialIcons name="bolt" size={16} color={colors.primary} />
                <Text style={styles.detailValue}>{item.downloadSpeed || 'N/A'}</Text>
              </View>
              <View style={styles.compactDetailRow}>
                <MaterialIcons name="access-time" size={16} color={colors.primary} />
                <Text style={styles.detailValue}>{item.days || 0} Days</Text>
              </View>
            </View>
            
            {/* Second Row: Services */}
            <View style={styles.servicesRow}>
              {item.ott_plan?.toLowerCase() === 'yes' && (
                <View style={[styles.serviceBadge, {backgroundColor: colors.successLight}]}>
                  <MaterialIcons name="movie" size={16} color={colors.success} />
                  <Text style={[styles.serviceText, {color: colors.success}]}>OTT</Text>
                </View>
              )}
              {item.voice_plan?.toLowerCase() === 'yes' && (
                <View style={[styles.serviceBadge, {backgroundColor: colors.accentLight}]}>
                  <MaterialIcons name="phone" size={16} color={colors.accent} />
                  <Text style={[styles.serviceText, {color: colors.accent}]}>VOIP</Text>
                </View>
              )}
              {item.iptv?.toLowerCase() === 'yes' && (
                <View style={[styles.serviceBadge, {backgroundColor: colors.primaryLight}]}>
                  <MaterialIcons name="tv" size={16} color={colors.primary} />
                  <Text style={[styles.serviceText, {color: colors.primary}]}>IPTV</Text>
                </View>
              )}
              {item.fup_flag?.toLowerCase() === 'yes' && (
                <View style={[styles.serviceBadge, {backgroundColor: colors.surface}]}>
                  <MaterialIcons name="bar-chart" size={16} color={colors.text} />
                  <Text style={[styles.serviceText, {color: colors.text}]}>FUP</Text>
                </View>
              )}
            </View>
          </View>
          
          
        </View>
        <View style={styles.planPriceContainer}>
          <View style={[styles.priceBadge, {backgroundColor: colors.primaryLight}]}>
            <Text style={[styles.priceText, {color: colors.primary}]}>{formatCurrency((item.user_mrp ?? item.FinalAmount) || 0)}</Text>
          </View>
          <TouchableOpacity 
            style={styles.expandButton}
            onPress={(e) => {
              e.stopPropagation();
              handlePlanExpand(item.id);
            }}>
            <MaterialIcons 
              name={item.isExpanded ? 'expand-more' : 'chevron-right'} 
              size={20} 
              color={colors.textSecondary} 
            />
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
    </View>
    );
    } catch (error) {
      // console.error('Error rendering plan item:', error);
      return (
        <View style={[styles.planCard, {backgroundColor: colors.card}]}>
          <Text style={[{color: colors.text}]}>Error loading plan: {item.name}</Text>
        </View>
      );
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, {backgroundColor: colors.background}]}>
        <LeftBorderLine />
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

  // Get current plan and recommended plan
  const currentPlan = plansData.find((plan: Plan) => 
    plan.name === authData?.current_plan || plan.name === authData?.current_plan1
  );
  
  // Get recommended plan (could be based on logic, for now using first non-current plan)
  // Currently: Just finds the first plan that is NOT the current plan
  // TODO: Implement proper recommendation logic (e.g., based on speed, price, user preferences, etc.)
  // Temporarily disabled - hiding recommended plan section until logic is finalized
  // const recommendedPlan = plansData.find((plan: Plan) => plan.id !== currentPlan?.id);

  // Helper: whether current plan has any OTT content
  const currentPlanHasOtt = !!(
    currentPlan &&
    currentPlan.content_providers &&
    Array.isArray(currentPlan.content_providers) &&
    currentPlan.content_providers.length > 0
  );

  return (
    <SafeAreaView style={[styles.container, {backgroundColor: colors.background}]}>
      <LeftBorderLine />
      <CommonHeader navigation={navigation} />

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Page Heading */}
        <View style={styles.headingContainer}>
          <Text style={[styles.pageHeading, {color: colors.text}]}>
            {t('renewPlan.title')}
          </Text>
          <Text style={[styles.pageSubheading, {color: colors.textSecondary}]}>
            {t('renewPlan.subtitle')}
          </Text>
        </View>

        {/* Current Plan Card */}
        {currentPlan && (
          <View style={styles.currentPlanSection}>
            {(() => {
              console.log('=== CURRENT PLAN DEBUG ===');
              console.log('Current Plan Name:', currentPlan.name);
              console.log('Current Plan Content Providers:', currentPlan.content_providers);
              console.log('Current Plan Content Providers Type:', typeof currentPlan.content_providers);
              console.log('Current Plan Content Providers Is Array:', Array.isArray(currentPlan.content_providers));
              console.log('Current Plan Content Providers Length:', currentPlan.content_providers?.length || 0);
              console.log('Current Plan ott_plan:', currentPlan.ott_plan);
              if (currentPlan.content_providers) {
                console.log('Current Plan Content Providers Full:', JSON.stringify(currentPlan.content_providers, null, 2));
              }
              console.log('=== END CURRENT PLAN DEBUG ===');
              return null;
            })()}
              <View
                style={[
                  styles.planCardNew,
                  styles.currentPlanCard,
                  {
                    borderColor: isMicroscan ? '#4CAF50' : colors.primary,
                    backgroundColor: colors.card,
                  },
                ]}>
              <View
                style={[
                  styles.planTag,
                  {backgroundColor: isMicroscan ? '#4CAF50' : colors.primary},
                ]}>
                <Text style={styles.planTagText}>Current Plan</Text>
              </View>
              <View style={styles.planCardContent}>
                {showL2SPlanName ? (
                  <>
                    {/* Row 1: Plan Name (full width) */}
                    <View style={styles.planNameRow}>
                      <Text style={styles.planNameNew} numberOfLines={0}>
                        {currentPlan.name}
                      </Text>
                    </View>

                    {/* Row 2: Plan Description (full width, if exists) */}
                    {currentPlan.description && (
                      <View style={styles.planDescriptionRow}>
                        <Text style={[styles.planDescriptionNew, {color: colors.textSecondary}]} numberOfLines={0}>
                          {currentPlan.description}
                        </Text>
                      </View>
                    )}

                    {/* Row 3: Plan Params (left) | Price + Button (right) - SAME ROW */}
                    <View style={styles.planCardBottomRow}>
                      {/* Left: Plan Parameters + OTT logos (same column) */}
                      <View style={styles.planCardLeft}>
                        <View style={styles.speedValiditySection}>
                          <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.speedValidityScrollContainer}>
                            <View style={styles.speedValidityRowScrollable}>
                              {/* Speed column */}
                              <View style={styles.speedValidityCol}>
                                <Text
                                  style={[
                                    styles.speedValidityLabel,
                                    styles.speedValidityLabelLarge,
                                  ]}>
                                  Speed
                                </Text>
                                <Text
                                  style={[
                                    styles.speedValidityValue,
                                    styles.speedValidityValueLarge,
                                  ]}>
                                  {formatSpeed(currentPlan.downloadSpeed)}
                                </Text>
                              </View>

                              {/* Validity column */}
                              <View style={styles.speedValidityCol}>
                                <Text
                                  style={[
                                    styles.speedValidityLabel,
                                    styles.speedValidityLabelLarge,
                                  ]}>
                                  Validity
                                </Text>
                                <Text
                                  style={[
                                    styles.speedValidityValue,
                                    styles.speedValidityValueLarge,
                                  ]}>
                                  {currentPlan.days || 0} Days
                                </Text>
                              </View>

                              {/* OTTs column - Always show like Speed and Validity */}
                              <View style={styles.speedValidityCol}>
                                <Text
                                  style={[
                                    styles.speedValidityLabel,
                                    styles.speedValidityLabelLarge,
                                  ]}>
                                  OTTs
                                </Text>
                                <Text
                                  style={[
                                    styles.speedValidityValue,
                                    styles.speedValidityValueLarge,
                                  ]}>
                                  {(() => {
                                    // Check if content_providers exists and has items
                                    if (
                                      currentPlan.content_providers &&
                                      Array.isArray(currentPlan.content_providers) &&
                                      currentPlan.content_providers.length > 0
                                    ) {
                                      return currentPlan.content_providers.length;
                                    }
                                    // If ott_plan is yes but no content_providers, show 1 or Yes
                                    if (currentPlan.ott_plan?.toLowerCase() === 'yes') {
                                      return '1';
                                    }
                                    // Otherwise show 0
                                    return '0';
                                  })()}
                                </Text>
                              </View>

                              {/* VOICE column */}
                              {currentPlan.voice_plan?.toLowerCase() === 'yes' && (
                                <View style={styles.speedValidityCol}>
                                  <Text
                                    style={[
                                      styles.speedValidityLabel,
                                      styles.speedValidityLabelLarge,
                                    ]}>
                                    VOICE
                                  </Text>
                                  <Text
                                    style={[
                                      styles.speedValidityValue,
                                      styles.speedValidityValueLarge,
                                    ]}>
                                    Yes
                                  </Text>
                                </View>
                              )}

                              {/* IPTV column */}
                              {currentPlan.iptv?.toLowerCase() === 'yes' && (
                                <View style={styles.speedValidityCol}>
                                  <Text
                                    style={[
                                      styles.speedValidityLabel,
                                      styles.speedValidityLabelLarge,
                                    ]}>
                                    IPTV
                                  </Text>
                                  <Text
                                    style={[
                                      styles.speedValidityValue,
                                      styles.speedValidityValueLarge,
                                    ]}>
                                    Yes
                                  </Text>
                                </View>
                              )}

                              {/* FUP column */}
                              {currentPlan.fup_flag?.toLowerCase() === 'yes' && (
                                <View style={styles.speedValidityCol}>
                                  <Text
                                    style={[
                                      styles.speedValidityLabel,
                                      styles.speedValidityLabelLarge,
                                    ]}>
                                    FUP
                                  </Text>
                                  <Text
                                    style={[
                                      styles.speedValidityValue,
                                      styles.speedValidityValueLarge,
                                    ]}>
                                    Yes
                                  </Text>
                                </View>
                              )}
                            </View>
                          </ScrollView>
                        </View>

                        {/* Thin grey separator + OTT row (only if OTT data exists) */}
                        {currentPlan.content_providers && Array.isArray(currentPlan.content_providers) && currentPlan.content_providers.length > 0 && (
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
                                {currentPlan.content_providers.map((provider: any, index: number) => (
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

                      {/* Vertical separator */}
                      <View style={styles.planVerticalSeparator} />

                      {/* Right: Price + Button */}
                      <View style={styles.planCardRight}>
                        <View style={styles.planPriceBlock}>
                          <Text style={[styles.planPriceNew, {color: colors.primary}]}>
                            {formatCurrency(calculateTotalAmount(currentPlan))}
                          </Text>
                          <TouchableOpacity
                            style={[styles.planActionButton, {backgroundColor: colors.primary}]}
                            onPress={() => handlePlanSelect(currentPlan)}>
                            <Text style={styles.planActionButtonText}>Renew</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  </>
                ) : (
                  <>
                    {/* Original layout when showL2SPlanName is false */}
                    <View style={styles.planCardTopRow}>
                      <View style={styles.planCardLeft}>
                        <ScrollView 
                          horizontal 
                          showsHorizontalScrollIndicator={false}
                          style={styles.metricHeadlineRowScroll}
                          contentContainerStyle={styles.metricHeadlineRow}>
                          <View style={[styles.metricHeadlineCol, styles.metricHeadlineColWide]}>
                            <Text style={styles.planNameNew}>{formatSpeed(currentPlan.downloadSpeed)}</Text>
                            <Text style={styles.metricSubtitle} numberOfLines={1}>{getUsageSubtitle(currentPlan.limit)}</Text>
                          </View>
                          <View style={[styles.metricHeadlineCol, styles.metricHeadlineColWide]}>
                            <Text style={styles.planNameNew}>{currentPlan.days || 0} Days</Text>
                            <Text style={styles.metricSubtitle}>validity</Text>
                          </View>
                          <View style={styles.metricHeadlineCol}>
                            <Text style={styles.planNameNew}>
                              {currentPlan.content_providers &&
                              Array.isArray(currentPlan.content_providers) &&
                              currentPlan.content_providers.length > 0
                                ? currentPlan.content_providers.length
                                : '0'}
                            </Text>
                            <Text style={styles.metricSubtitle}>OTTs</Text>
                          </View>
                          {currentPlan.fup_flag?.toLowerCase() === 'yes' && (
                            <View style={styles.metricHeadlineCol}>
                              <Text style={styles.planNameNew}>FUP</Text>
                              <Text style={styles.metricSubtitle}>Yes</Text>
                            </View>
                          )}
                          {currentPlan.voice_plan?.toLowerCase() === 'yes' && (
                            <View style={styles.metricHeadlineCol}>
                              <Text style={styles.planNameNew}>VOIP</Text>
                              <Text style={styles.metricSubtitle}>Yes</Text>
                            </View>
                          )}
                          {currentPlan.iptv?.toLowerCase() === 'yes' && (
                            <View style={styles.metricHeadlineCol}>
                              <Text style={styles.planNameNew}>IPTV</Text>
                              <Text style={styles.metricSubtitle}>Yes</Text>
                            </View>
                          )}
                        </ScrollView>
                        
                        {/* Thin grey separator + OTT row (only if OTT data exists) */}
                        {currentPlan.content_providers && Array.isArray(currentPlan.content_providers) && currentPlan.content_providers.length > 0 && (
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
                                {currentPlan.content_providers.map((provider: any, index: number) => (
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
                      <View style={styles.planVerticalSeparator} />
                      <View style={styles.planCardRight}>
                        <View style={styles.planPriceBlock}>
                          <Text style={[styles.planPriceNew, {color: colors.primary}]}>
                            {formatCurrency(calculateTotalAmount(currentPlan))}
                          </Text>
                          <TouchableOpacity
                            style={[styles.planActionButton, {backgroundColor: colors.primary}]}
                            onPress={() => handlePlanSelect(currentPlan)}>
                            <Text style={styles.planActionButtonText}>Renew</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  </>
                )}
              </View>
            </View>
          </View>
        )}

        {/* Separator line */}
        <View style={styles.separatorLine}>
          <View style={[styles.separator, {backgroundColor: '#B4B4B4'}]} />
        </View>

        {/* Change your plan section */}
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
                      <MaterialIcons name="close" size={16} color={colors.primary} />
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
                      <MaterialIcons name="close" size={16} color={colors.primary} />
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
                      <MaterialIcons name="close" size={16} color={colors.primary} />
                    </TouchableOpacity>
                  </View>
                )}
                
                {/* Plan Features Filters */}
                {filters.ottPlan && (
                  <View style={[styles.activeFilterChip, {backgroundColor: colors.primaryLight}]}>
                    <View style={{flexDirection: 'row', alignItems: 'center', gap: 4}}>
                      <MaterialIcons name="movie" size={16} color={colors.primary} />
                      <Text style={[styles.activeFilterText, {color: colors.primary}]}>OTT</Text>
                    </View>
                    <TouchableOpacity onPress={() => setFilters(prev => ({...prev, ottPlan: ''}))}>
                      <MaterialIcons name="close" size={16} color={colors.primary} />
                    </TouchableOpacity>
                  </View>
                )}
                
                {filters.voipPlan && (
                  <View style={[styles.activeFilterChip, {backgroundColor: colors.primaryLight}]}>
                    <View style={{flexDirection: 'row', alignItems: 'center', gap: 4}}>
                      <MaterialIcons name="phone" size={16} color={colors.primary} />
                      <Text style={[styles.activeFilterText, {color: colors.primary}]}>VOIP</Text>
                    </View>
                    <TouchableOpacity onPress={() => setFilters(prev => ({...prev, voipPlan: ''}))}>
                      <MaterialIcons name="close" size={16} color={colors.primary} />
                    </TouchableOpacity>
                  </View>
                )}
                
                {filters.iptvPlan && (
                  <View style={[styles.activeFilterChip, {backgroundColor: colors.primaryLight}]}>
                    <View style={{flexDirection: 'row', alignItems: 'center', gap: 4}}>
                      <MaterialIcons name="tv" size={16} color={colors.primary} />
                      <Text style={[styles.activeFilterText, {color: colors.primary}]}>IPTV</Text>
                    </View>
                    <TouchableOpacity onPress={() => setFilters(prev => ({...prev, iptvPlan: ''}))}>
                      <MaterialIcons name="close" size={16} color={colors.primary} />
                    </TouchableOpacity>
                  </View>
                )}
                
                {filters.fupPlan && (
                  <View style={[styles.activeFilterChip, {backgroundColor: colors.primaryLight}]}>
                    <View style={{flexDirection: 'row', alignItems: 'center', gap: 4}}>
                      <MaterialIcons name="bar-chart" size={16} color={colors.primary} />
                      <Text style={[styles.activeFilterText, {color: colors.primary}]}>FUP</Text>
                    </View>
                    <TouchableOpacity onPress={() => setFilters(prev => ({...prev, fupPlan: ''}))}>
                      <MaterialIcons name="close" size={16} color={colors.primary} />
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

        {/* Recommended Plan Card - Temporarily hidden until recommendation logic is finalized */}
        {/* Currently the logic was: Just finds the first plan that is NOT the current plan */}
        {/* TODO: Implement proper recommendation logic (e.g., based on speed, price, user preferences, etc.) */}
        {/* 
        {(() => {
          const recommendedPlan = plansData.find((plan: Plan) => plan.id !== currentPlan?.id);
          return recommendedPlan ? (
            <View style={styles.recommendedPlanSection}>
              <View style={[styles.planCardNew, styles.recommendedPlanCard, {borderColor: '#2196F3', backgroundColor: colors.card}]}>
                <View style={[styles.planTag, {backgroundColor: '#2196F3'}]}>
                  <Text style={styles.planTagText}>Recommended Plan</Text>
                </View>
                <View style={styles.planCardContent}>
                  <View style={styles.planCardLeft}>
                    <Text style={[styles.planNameNew, {color: colors.text}]}>
                      {recommendedPlan.name}
                    </Text>
                    {recommendedPlan.content_providers && recommendedPlan.content_providers.length > 0 && (
                      <View style={styles.planDetailsRow}>
                        <Text style={[styles.planDetailText, {color: colors.textSecondary}]}>
                          {recommendedPlan.content_providers.length} OTTs
                        </Text>
                      </View>
                    )}
                    <View style={styles.speedValiditySection}>
                      <View style={styles.speedValidityHeaders}>
                        <Text style={[styles.speedValidityLabel, {color: colors.textSecondary}]}>Speed</Text>
                        <Text style={[styles.speedValidityLabel, {color: colors.textSecondary}]}>Validity</Text>
                      </View>
                      <View style={styles.speedValidityValues}>
                        <Text style={[styles.speedValidityValue, {color: colors.text}]}>
                          {formatSpeed(recommendedPlan.downloadSpeed)}
                        </Text>
                        <Text style={[styles.speedValidityValue, {color: colors.text}]}>
                          {recommendedPlan.days || 0} Days
                        </Text>
                      </View>
                    </View>
                    {recommendedPlan.content_providers && recommendedPlan.content_providers.length > 0 && (
                      <View style={styles.ottLogosContainer}>
                        {recommendedPlan.content_providers.slice(0, 4).map((provider: any, index: number) => (
                          <View key={index} style={styles.ottLogoWrapper}>
                            {renderOTTIcon(provider)}
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                  <View style={styles.planCardRight}>
                    <Text style={[styles.planPriceNew, {color: colors.primary}]}>
                      ₹{(recommendedPlan.user_mrp ?? recommendedPlan.FinalAmount) || 0}
                    </Text>
                    <TouchableOpacity
                      style={[
                        styles.planActionButton, 
                        {
                          backgroundColor: selectedPlan?.id === recommendedPlan.id ? colors.success : colors.primary
                        }
                      ]}
                      onPress={() => handlePlanSelect(recommendedPlan)}>
                      <Text style={styles.planActionButtonText}>
                        {selectedPlan?.id === recommendedPlan.id ? 'Selected' : 'Select'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          ) : null;
        })()}
        */}

        {/* Other Plans List */}
        {(() => {
          const filteredPlans = getFilteredAndSortedPlans();
          const otherPlans = filteredPlans.filter((plan: Plan) => 
            plan.id !== currentPlan?.id
            // plan.id !== recommendedPlan?.id // Temporarily disabled - recommended plan section is hidden
          );
          console.log('=== RENDERING PLANS ===');
          console.log('Current plan ID:', currentPlan?.id);
          console.log('Current plan name:', currentPlan?.name);
          console.log('Total filtered plans:', filteredPlans.length);
          console.log('Other plans (excluding current):', otherPlans.length);
          console.log('Other plan names:', otherPlans.map(p => p.name));
          console.log('=== END RENDERING PLANS ===');
          
          return otherPlans.map((plan: Plan) => {
            const planHasOtt = !!(
              plan.content_providers &&
              Array.isArray(plan.content_providers) &&
              plan.content_providers.length > 0
            );
            return (
            <View key={plan.id} style={styles.otherPlanSection}>
              <View style={[styles.planCardNew, styles.otherPlanCard, {borderColor: colors.border, backgroundColor: colors.card}]}>
                <View style={styles.planCardContent}>
                  {showL2SPlanName ? (
                    <>
                      {/* Row 1: Plan Name (full width) */}
                      <View style={styles.planNameRow}>
                        <Text style={styles.planNameNew} numberOfLines={0}>
                          {plan.name}
                        </Text>
                      </View>

                      {/* Row 2: Plan Description (full width, if exists) */}
                      {plan.description && (
                        <View style={styles.planDescriptionRow}>
                          <Text style={[styles.planDescriptionNew, {color: colors.textSecondary}]} numberOfLines={0}>
                            {plan.description}
                          </Text>
                        </View>
                      )}

                      {/* Row 3: Plan Params (left, scrollable) | Price + Button (right) - SAME ROW */}
                      <View style={styles.planCardBottomRow}>
                        {/* Left: Plan Parameters + OTT logos (same column) */}
                      <View style={styles.planCardLeft}>
                          <View style={styles.speedValiditySection}>
                            <ScrollView
                              horizontal
                              showsHorizontalScrollIndicator={false}
                              contentContainerStyle={styles.speedValidityScrollContainer}>
                              <View style={styles.speedValidityRowScrollable}>
                                {/* Speed column */}
                                <View style={styles.speedValidityCol}>
                                  <Text
                                    style={[
                                      styles.speedValidityLabel,
                                      styles.speedValidityLabelLarge,
                                    ]}>
                                    Speed
                                  </Text>
                                  <Text
                                    style={[
                                      styles.speedValidityValue,
                                      styles.speedValidityValueLarge,
                                    ]}>
                                    {formatSpeed(plan.downloadSpeed)}
                                  </Text>
                                </View>

                                {/* Validity column */}
                                <View style={styles.speedValidityCol}>
                                  <Text
                                    style={[
                                      styles.speedValidityLabel,
                                      styles.speedValidityLabelLarge,
                                    ]}>
                                    Validity
                                  </Text>
                                  <Text
                                    style={[
                                      styles.speedValidityValue,
                                      styles.speedValidityValueLarge,
                                    ]}>
                                    {plan.days || 0} Days
                                  </Text>
                                </View>

                                {/* OTTs column */}
                                {plan.content_providers &&
                                  Array.isArray(plan.content_providers) &&
                                  plan.content_providers.length > 0 && (
                                    <View style={styles.speedValidityCol}>
                                      <Text
                                        style={[
                                          styles.speedValidityLabel,
                                          styles.speedValidityLabelLarge,
                                        ]}>
                                        OTTs
                                      </Text>
                                      <Text
                                        style={[
                                          styles.speedValidityValue,
                                          styles.speedValidityValueLarge,
                                        ]}>
                                        {plan.content_providers.length}
                                      </Text>
                                    </View>
                                  )}

                                {/* VOICE column */}
                                {plan.voice_plan?.toLowerCase() === 'yes' && (
                                  <View style={styles.speedValidityCol}>
                                    <Text
                                      style={[
                                        styles.speedValidityLabel,
                                        styles.speedValidityLabelLarge,
                                      ]}>
                                      VOICE
                                    </Text>
                                    <Text
                                      style={[
                                        styles.speedValidityValue,
                                        styles.speedValidityValueLarge,
                                      ]}>
                                      Yes
                                    </Text>
                                  </View>
                                )}

                                {/* IPTV column */}
                                {plan.iptv?.toLowerCase() === 'yes' && (
                                  <View style={styles.speedValidityCol}>
                                    <Text
                                      style={[
                                        styles.speedValidityLabel,
                                        styles.speedValidityLabelLarge,
                                      ]}>
                                      IPTV
                                    </Text>
                                    <Text
                                      style={[
                                        styles.speedValidityValue,
                                        styles.speedValidityValueLarge,
                                      ]}>
                                      Yes
                                    </Text>
                                  </View>
                                )}

                                {/* FUP column */}
                                {plan.fup_flag?.toLowerCase() === 'yes' && (
                                  <View style={styles.speedValidityCol}>
                                    <Text
                                      style={[
                                        styles.speedValidityLabel,
                                        styles.speedValidityLabelLarge,
                                      ]}>
                                      FUP
                                    </Text>
                                    <Text
                                      style={[
                                        styles.speedValidityValue,
                                        styles.speedValidityValueLarge,
                                      ]}>
                                      Yes
                                    </Text>
                                  </View>
                                )}
                              </View>
                            </ScrollView>
                          </View>

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

                        {/* Vertical separator */}
                        <View style={styles.planVerticalSeparator} />

                        {/* Right: Price + Button */}
                        <View style={styles.planCardRight}>
                          <View style={styles.planPriceBlock}>
                            <Text style={[styles.planPriceNew, {color: colors.primary}]}>
                              {formatCurrency(calculateTotalAmount(plan))}
                            </Text>
                            <TouchableOpacity
                              style={[styles.planActionButton, {backgroundColor: colors.primary}]}
                              onPress={() => handlePlanSelect(plan)}>
                              <Text style={styles.planActionButtonText}>Select</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      </View>
                    </>
                  ) : (
                    <>
                      {/* Original layout when showL2SPlanName is false */}
                      <View style={styles.planCardTopRow}>
                        <View style={styles.planCardLeft}>
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
                        <View style={styles.planVerticalSeparator} />
                        <View style={styles.planCardRight}>
                          <View style={styles.planPriceBlock}>
                            <Text style={[styles.planPriceNew, {color: colors.primary}]}>
                              {formatCurrency(calculateTotalAmount(plan))}
                            </Text>
                            <TouchableOpacity
                              style={[styles.planActionButton, {backgroundColor: colors.primary}]}
                              onPress={() => handlePlanSelect(plan)}>
                              <Text style={styles.planActionButtonText}>Select</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      </View>
                    </>
                  )}
                </View>
              </View>
            </View>
          )});
        })()}

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
                <MaterialIcons name="close" size={24} color={colors.text} />
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
                    { key: 'ottPlan', label: 'OTT', icon: 'movie' },
                    { key: 'voipPlan', label: 'VOIP', icon: 'phone' },
                    { key: 'iptvPlan', label: 'IPTV', icon: 'tv' },
                    { key: 'fupPlan', label: 'FUP', icon: 'bar-chart' }
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
                      <MaterialIcons 
                        name={feature.icon} 
                        size={20} 
                        color={filters[feature.key as keyof typeof filters] ? '#fff' : colors.text} 
                      />
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
                <MaterialIcons name="close" size={24} color={colors.text} />
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
    position: 'relative',
    overflow: 'visible',
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
    position: 'relative',
    overflow: 'visible',
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
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter',
    color: '#000000',
    marginBottom: 2,
  },
  planDescription: {
    fontSize: 12,
    fontWeight: '400',
    marginBottom: 2,
    opacity: 0.8,
    lineHeight: 14,
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
  planCardWrapper: {
    position: 'relative',
    marginTop: 16,
  },
  currentPlanTopBadge: {
    position: 'absolute',
    top: -14,
    left: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    zIndex: 2,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  currentPlanTopText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  planBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 2,
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
  metricHeadlineSeparator: {
    marginTop: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#cccccc',
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
    fontSize: 10,
    fontWeight: '400',
    fontFamily: 'Inter',
    color: '#4D4D4D',
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
    minHeight: 50,
    flex: 1,
  },
  detailIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  ottSection: {
    marginTop: 14,    // space above the separator line
    paddingTop: 22,   // slightly more space between the line and OTT content
    borderTopWidth: 2,
    borderTopColor: '#B0B0B0', // slightly darker separator
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
    borderWidth: 0.5,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
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
    marginVertical: 0,  // reduce extra space above/below OTT icons
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
    marginTop: 4,
  },
  ottServiceName: {
    fontSize: 10,
    fontFamily: 'Inter',
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 12,
    maxWidth: 55,
    flexShrink: 1,
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
  servicesSection: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  servicesTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  serviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  serviceIcon: {
    fontSize: 14,
  },
  serviceLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  noServicesText: {
    fontSize: 12,
    fontStyle: 'italic',
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
  currentPlanSection: {
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 8,
  },
  recommendedPlanSection: {
    paddingHorizontal: 20,
    marginTop: 16,
    marginBottom: 16,
  },
  otherPlanSection: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  planCardNew: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 8,
    minHeight: 124,
    // Allow the top badge (planTag) to render fully above the card
    overflow: 'visible',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  currentPlanCard: {
    // borderColor will be set dynamically via inline style using colors.primary
  },
  recommendedPlanCard: {
    borderColor: '#2196F3',
  },
  otherPlanCard: {
    borderColor: '#e0e0e0',
  },
  planTag: {
    position: 'absolute',
    top: -12,
    left: 16,
    width: 106,
    height: 21,
    // backgroundColor will be set dynamically via inline style using colors.primary
    borderRadius: 3,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  planTagText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  // Container that holds the top row (name + price block) and the details below.
  // This should remain vertical so that all plan details are visible.
  planCardContent: {
    flexDirection: 'column',
    marginTop: 0,
    flex: 1,
  },
  planCardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 0,
  },
  planNameRow: {
    width: '100%',
    marginTop: 4,   // add breathing space below "Current Plan" heading
    marginBottom: 4,
    paddingLeft: 6, // align with plan content columns
  },
  planDescriptionRow: {
    width: '100%',
    marginBottom: 8,
    paddingLeft: 6, // keep description aligned with plan name/content
  },
  planCardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 0,
  },
  planCardLeft: {
    flex: 1,
    marginRight: 0,
    justifyContent: 'flex-start',
  },
  planCardRight: {
    width: 101.01,
    alignItems: 'stretch',
    justifyContent: 'center',
    marginLeft: 0,
    alignSelf: 'stretch',
    backgroundColor: '#F9F9F9',        // full-height grey strip
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
    // Inner block for price + button (no background, centered)
    width: 101.01,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 10,
    flex: 1,
  },
  planNameNew: {
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'Inter',
    color: '#000000',
    marginBottom: 2,
  },
  planDescriptionNew: {
    fontSize: 11,
    fontWeight: '400',
    marginBottom: 2,
    lineHeight: 14,
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
  planDetailSeparator: {
    fontSize: 13,
    marginHorizontal: 4,
  },
  ottLogosContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 8,
    gap: 12,
    flexWrap: 'wrap',
  },
  ottLogosSection: {
    // Visually separate OTT logos from plan row (more top, less bottom)
    marginTop: 14,
    marginBottom: 2,
    width: '100%',
  },
  ottLogosScrollView: {
    paddingVertical: 0,
    width: '100%',
  },
  ottLogosScrollContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingRight: 8,
    paddingLeft: 0,
    gap: 6,
  },
  ottLogoItem: {
    alignItems: 'center',
    width: 55,
    marginRight: 0,
    marginBottom: 4,
  },
  // scrollHint style no longer used (text removed)
  ottLogoWrapper: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  planPriceNew: {
    fontSize: 16,
    fontFamily: 'Inter',
    fontWeight: '600',
    marginBottom: 4,
  },
  planPriceStrikethrough: {
    fontSize: 14,
    textDecorationLine: 'line-through',
    marginBottom: 4,
  },
  planActionButton: {
    paddingHorizontal: 16,
    paddingVertical: 5,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 75,
  },
  planActionButtonText: {
    color: '#ffffff',
    fontSize: 11,
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
  ottLogoNew: {
    width: 30,
    height: 30,
  },
  ottIconNew: {
    fontSize: 24,
  },
  speedValiditySection: {
    marginTop: 1,
    marginBottom: 1,
  },
  speedValidityHeaders: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
    gap: 8,
  },
  speedValidityLabel: {
    fontSize: 9,
    fontWeight: '400',
    fontFamily: 'Inter',
    color: '#4D4D4D',
    marginHorizontal: 4,
    flexShrink: 0, // prevent wrapping; allow horizontal scroll instead
  },
  // Larger heading font when there is no OTT content so that
  // Speed / Validity / FUP details are more visible.
  speedValidityLabelLarge: {
    fontSize: 12,
    fontWeight: '600',
  },
  speedValidityValues: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  speedValidityValue: {
    fontSize: 9,
    fontWeight: '400',
    fontFamily: 'Inter',
    color: '#4D4D4D',
    marginHorizontal: 4,
    flexShrink: 0, // prevent wrapping; allow horizontal scroll instead
  },
  speedValidityScrollContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingRight: 8,
  },
  // One column in the Speed/Validity/OTTs/FUP horizontal row (used inside horizontal ScrollView)
  speedValidityRowScrollable: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  speedValidityCol: {
    minWidth: 80,
    marginRight: 12,
  },
  // Larger value font when there is no OTT content
  speedValidityValueLarge: {
    fontSize: 12,
    fontWeight: '500',
    color: '#5A5A5A',
  },
});

export default RenewPlanScreen; 