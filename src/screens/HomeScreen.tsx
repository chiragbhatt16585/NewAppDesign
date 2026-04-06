import React, {useState, useRef, useEffect, useMemo, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Alert,
  Linking,
  Image,
  Dimensions,
  FlatList,
  BackHandler,
  ActivityIndicator,
  Platform,
  Modal,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useFocusEffect, useIsFocused} from '@react-navigation/native';
import LogoImage from '../components/LogoImage';
import CommonHeader from '../components/CommonHeader';
import {useTheme} from '../utils/ThemeContext';
import {getThemeColors} from '../utils/themeStyles';
import {useTranslation} from 'react-i18next';
import {useAuth} from '../utils/AuthContext';
import {apiService} from '../services/api';
import sessionManager from '../services/sessionManager';
import {useSessionValidation} from '../utils/useSessionValidation';
import {useScreenDataReload} from '../utils/useAutoDataReload';
import { getClientConfig } from '../config/client-config';
import { initializePushNotifications, registerPendingPushToken, registerDeviceManually, updateDeviceWithRealFCMToken } from '../services/notificationService';
import { debugVersionCheck, quickVersionTest } from '../services/versionDebug';
import { debugFCMTokenIssues, forceFCMTokenGeneration } from '../services/fcmDebug';
//import { testFirebaseConfiguration, runComprehensiveFirebaseTest } from '../services/firebaseTest';
import useMenuSettings from '../hooks/useMenuSettings';
import menuService from '../services/menuService';
import dataCache from '../services/dataCache';
import { getSafeDaysRemaining } from '../utils/usageUtils';
import { useAuthData } from '../utils/AuthDataContext';
// import AIUsageInsights from '../components/AIUsageInsights';
//import ispLogo from '../assets/isp_logo.png';
import Feather from 'react-native-vector-icons/Feather';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const {width: screenWidth} = Dimensions.get('window');
const modalImageHeight = screenWidth * 0.9;

const HomeScreen = ({navigation}: any) => {
  const isFocused = useIsFocused();
  const {isDark} = useTheme();
  const colors = getThemeColors(isDark);
  const {t} = useTranslation();
  const [currentAdIndex, setCurrentAdIndex] = useState(0);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const currentAdIndexRef = useRef(0); // Use ref to track current index without re-renders
  const {logout, isAuthenticated} = useAuth();
  const {checkSessionAndHandle} = useSessionValidation();
  // Auto reload on focus is intentionally disabled to avoid duplicate app-state listeners
  // and unnecessary background/foreground fetch churn.
  const {reloadOnFocus} = useScreenDataReload({enabled: false});

  // State for API data - ALWAYS start with null to prevent old data display
  const [authData, setAuthData] = useState<any>(null);
  const { setAuthData: setGlobalAuthData } = useAuthData();
  const hasAuthDataRef = useRef(false);
  const isFetchingRef = useRef(false);
  const lastFetchTsRef = useRef<number>(0);
  const [planDetails, setPlanDetails] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [banners, setBanners] = useState<any[]>([]);
  const [loadingBanners, setLoadingBanners] = useState(true);
  const lastUsernameRef = useRef<string | null>(null);
  const hasClearedOnMountRef = useRef(false);
  const [currentUsername, setCurrentUsername] = useState<string | null>(null);
  const [selectedBanner, setSelectedBanner] = useState<any | null>(null);
  const [showBannerModal, setShowBannerModal] = useState(false);

  const closeBannerModal = useCallback(() => {
    setShowBannerModal(false);
    setSelectedBanner(null);
  }, []);

  useEffect(() => {
    hasAuthDataRef.current = !!authData;
  }, [authData]);

  // Sync current username and clear data if username doesn't match
  useEffect(() => {
    const syncUsername = async () => {
      if (!isAuthenticated) {
        setCurrentUsername(null);
        // Clear all data when not authenticated
        if (authData) {
          setAuthData(null);
          setGlobalAuthData(null);
          setPlanDetails(null);
          setBanners([]);
          lastUsernameRef.current = null;
        }
        return;
      }
      
      const session = await sessionManager.getCurrentSession();
      const sessionUsername = session?.username || null;
      
      // CRITICAL: If username changed, clear ALL data IMMEDIATELY and synchronously
      if (sessionUsername && lastUsernameRef.current !== null && lastUsernameRef.current !== sessionUsername) {
        console.log('[HomeScreen] 🚨 USERNAME CHANGED! Clearing all data immediately');
        console.log('[HomeScreen] Old username:', lastUsernameRef.current);
        console.log('[HomeScreen] New username:', sessionUsername);
        
        // Clear state IMMEDIATELY (synchronous)
        setAuthData(null);
        setGlobalAuthData(null);
        setPlanDetails(null);
        setBanners([]);
        setIsLoading(true);
        isFetchingRef.current = false;
        lastFetchTsRef.current = 0;
        
        // Clear caches asynchronously but don't wait
        dataCache.clearAllCache().catch(() => {});
        menuService.clearCache();
        
        // Update ref immediately
        lastUsernameRef.current = sessionUsername;
        setCurrentUsername(sessionUsername);
        return;
      }
      
      // If we have authData but username doesn't match, clear it immediately
      if (authData && sessionUsername && lastUsernameRef.current !== sessionUsername) {
        console.log('[HomeScreen] ⚠️ RENDER CHECK: Username mismatch detected!');
        console.log('[HomeScreen] AuthData exists for:', lastUsernameRef.current);
        console.log('[HomeScreen] Current session username:', sessionUsername);
        console.log('[HomeScreen] Clearing authData immediately...');
        
        setAuthData(null);
        setGlobalAuthData(null);
        setPlanDetails(null);
        setBanners([]);
        lastUsernameRef.current = sessionUsername;
        setCurrentUsername(sessionUsername);
        return;
      }
      
      // Update current username state
      if (sessionUsername) {
        // Only update if it's different to avoid unnecessary re-renders
        if (lastUsernameRef.current !== sessionUsername) {
          lastUsernameRef.current = sessionUsername;
        }
        if (currentUsername !== sessionUsername) {
          setCurrentUsername(sessionUsername);
        }
      }
    };
    
    syncUsername();
  }, [isAuthenticated]);

  // Debug: log next renewal date value when it changes
  useEffect(() => {
    // console.log('Next Renewal debug =>', authData?.next_renewal_date, 'type:', typeof authData?.next_renewal_date);
  }, [authData?.next_renewal_date]);

  // Debug: log account summary data when authData changes
  useEffect(() => {
    if (authData) {
      try {
        // console.log('[HomeScreen] Account summary data:', JSON.stringify({
        //   current_plan: authData?.current_plan,
        //   usage_details: authData?.usage_details?.[0],
        //   user_status: authData?.user_status,
        //   login_status: authData?.login_status,
        //   payment_dues: authData?.payment_dues,
        // }));
      } catch {
        //console.log('[HomeScreen] Account summary data (raw):', authData);
      }
    }
  }, [authData]);

  // Normalize next renewal value and filter placeholders like 'N/A', 'NA', '-', 'null'
  const nextRenewalValue = useMemo(() => {
    const raw = (authData?.next_renewal_date ?? '').toString().trim();
    const invalids = ['N/A', 'NA', '-', 'NULL', 'UNDEFINED', ''];
    return invalids.includes(raw.toUpperCase()) ? '' : raw;
  }, [authData?.next_renewal_date]);
  const { menu, loading: menuLoading, error: menuError, refresh: refreshMenu, forceRefresh: forceRefreshMenu } = useMenuSettings();
  const [refreshing, setRefreshing] = useState(false);
  const currentClientId = getClientConfig().clientId;
  const isMicroscan = currentClientId === 'microscan';
  // Clients that use a colored header background image – header icons should be white for contrast
  const headerBgClients = new Set([
    'spacecom-live',
    'spacecom-local',
    'linkway',
    'inshansa-dnagoa',
    'successbroadband',
    'logon-broadband',
    'dna-goa',
    'dna-infotel',
    'netfix',
    'gatewayftth',
    'one-sevenstar',
    'metanet',
    'monarknet',
    'graceway',
    'log2space-common',
  ]);
  const isHeaderBgClient = headerBgClients.has(currentClientId);
  const activeStatusColor = isMicroscan ? '#4CAF50' : colors.primary;
  const loginStatusColor = isMicroscan ? '#4CAF50' : colors.primary;
  
  // CRITICAL: Synchronous check to prevent rendering old user data
  // This runs on every render to immediately detect username changes
  const shouldShowData = useMemo(() => {
    // If not authenticated, don't show data
    if (!isAuthenticated) {
      return false;
    }
    
    // If no current username, don't show data
    if (!currentUsername) {
      return false;
    }
    
    // If username ref doesn't match current username, don't show data
    if (lastUsernameRef.current !== currentUsername) {
      return false;
    }
    
    // If we have authData but username doesn't match, don't show data
    if (authData && lastUsernameRef.current !== currentUsername) {
      return false;
    }
    
    // Only show data if everything matches
    return authData && currentUsername && lastUsernameRef.current === currentUsername;
  }, [isAuthenticated, currentUsername, authData]);

  const homeMenuConfig = useMemo(() => {
    // console.log('🔍 [HomeMenuConfig] === STARTING CONFIG COMPUTATION ===');
    const defaults = { 
      profileMenuEnabled: true, 
      directLogoutEnabled: false,
      accountSummaryEnabled: true,
      billingInformationEnabled: true,
      usageStatisticsEnabled: true,
      showL2SPlanName: true,
      showPlanParamsBlend: false,
    };
    
    if (!Array.isArray(menu)) {
      // console.log('🔍 [HomeMenuConfig] Menu is not an array, using defaults:', defaults);
      return defaults;
    }
    
    // console.log('🔍 [HomeMenuConfig] Menu array length:', menu.length);
    // console.log('🔍 [HomeMenuConfig] All menu labels:', menu.map((m: any) => m?.menu_label).filter(Boolean));
    
    const homeItem = menu.find((item: any) => {
      try {
        const label = String(item?.menu_label || '').trim();
        const matches = label === 'Home';
        if (matches) {
          // console.log('🔍 [HomeMenuConfig] Found Home item:', {
          //   menu_label: item?.menu_label,
          //   menu_api_type: item?.menu_api_type,
          //   status: item?.status,
          //   hasDisplayOptionJson: !!item?.display_option_json,
          //   displayOptionJsonType: typeof item?.display_option_json,
          // });
        }
        return matches;
      } catch (e) {
        // console.warn('🔍 [HomeMenuConfig] Error checking menu item:', e);
        return false;
      }
    });
    
    if (!homeItem) {
      // console.log('🔍 [HomeMenuConfig] Home item not found, using defaults:', defaults);
      return defaults;
    }
    
    let displayOptions: any = homeItem.display_option_json;
    // console.log('🔍 [HomeMenuConfig] Raw display_option_json:', {
    //   value: displayOptions,
    //   type: typeof displayOptions,
    //   isString: typeof displayOptions === 'string',
    //   isObject: typeof displayOptions === 'object',
    // });
    
    if (typeof displayOptions === 'string') {
      try {
        const trimmed = displayOptions.trim();
        // console.log('🔍 [HomeMenuConfig] Parsing JSON string, trimmed length:', trimmed.length);
        displayOptions = trimmed ? JSON.parse(trimmed) : {};
        // console.log('🔍 [HomeMenuConfig] Parsed display_options:', displayOptions);
      } catch (parseError) {
        // console.warn('🔍 [HomeMenuConfig] JSON parse error:', parseError);
        displayOptions = {};
      }
    }

    // Log the parsed display options for debugging
    try {
      //console.log('[HomeScreen] display_option_json (parsed):', JSON.stringify(displayOptions));
    } catch {
      //console.log('[HomeScreen] display_option_json (parsed):', displayOptions);
    }
    
    // Extract logout button style options - check multiple possible paths
    const logoutButtonOptions = displayOptions?.logout_button_style?.options || 
                                 displayOptions?.logout_button_style || 
                                 displayOptions?.options || 
                                 {};
    const profileMenuValue = logoutButtonOptions?.show_profile_menu !== undefined 
      ? logoutButtonOptions?.show_profile_menu 
      : displayOptions?.show_profile_menu;
    const directLogoutValue = logoutButtonOptions?.direct_logout !== undefined
      ? logoutButtonOptions?.direct_logout
      : displayOptions?.direct_logout;
    
    // Extract display option settings
    const displayOption = displayOptions?.display_option || {};
    const accountSummaryValue = displayOption?.account_summary;
    const billingInformationValue = displayOption?.billing_information;
    const usageStatisticsValue = displayOption?.usage_statistics;
    
    // Helper to interpret boolean-like values coming from API (including "true"/"false" strings)
    const parseBoolFlag = (raw: any, defaultValue: boolean): boolean => {
      // If value is explicitly undefined or null, use default
      if (raw === undefined || raw === null) return defaultValue;
      
      // Explicitly check for false values first (boolean false, string "false", number 0)
      if (raw === false) return false;
      if (raw === 0) return false;
      if (typeof raw === 'string') {
        const v = raw.trim().toLowerCase();
        if (v === 'false' || v === '0' || v === 'no' || v === 'n') return false;
      }
      
      // Then check for true values
      if (raw === true) return true;
      if (raw === 1) return true;
      if (typeof raw === 'string') {
        const v = raw.trim().toLowerCase();
        if (v === 'true' || v === '1' || v === 'yes' || v === 'y') return true;
      }
      
      // If value is provided but doesn't match known patterns, use default
      return defaultValue;
    };

    const result = {
      // IMPORTANT: respect API when it sends "false" as a string or boolean
      // Check if value is explicitly provided (not undefined), if so parse it; otherwise use default
      profileMenuEnabled: profileMenuValue !== undefined && profileMenuValue !== null
        ? parseBoolFlag(profileMenuValue, false) 
        : defaults.profileMenuEnabled,
      directLogoutEnabled: directLogoutValue !== undefined && directLogoutValue !== null
        ? parseBoolFlag(directLogoutValue, false)
        : defaults.directLogoutEnabled,
      accountSummaryEnabled: parseBoolFlag(accountSummaryValue, defaults.accountSummaryEnabled),
      billingInformationEnabled: parseBoolFlag(billingInformationValue, defaults.billingInformationEnabled),
      usageStatisticsEnabled: parseBoolFlag(usageStatisticsValue, defaults.usageStatisticsEnabled),
      showL2SPlanName: defaults.showL2SPlanName,
      showPlanParamsBlend: defaults.showPlanParamsBlend,
    };

    // Temporary client-specific overrides:
    // - Linkway: ALWAYS hide the profile menu regardless of API flags
    // - Metanet / log2space-common: ALWAYS show the profile menu (force enable avatar)
    try {
      const currentClientId = getClientConfig().clientId;
      if (currentClientId === 'linkway') {
        result.profileMenuEnabled = false;
      } else if (
        currentClientId === 'metanet' ||
        currentClientId === 'monarknet' ||
        currentClientId === 'log2space-common'
      ) {
        result.profileMenuEnabled = true;
      }
    } catch {
      // If client-config fails, just keep parsed value
    }

    // Debug log to verify settings coming from API and final parsed config
    if (__DEV__) {
      try {
        console.log('[HomeMenuConfig] Raw logout_button_style.options:', logoutButtonOptions);
        console.log('[HomeMenuConfig] Raw flags:', {
          show_profile_menu: profileMenuValue,
          direct_logout: directLogoutValue,
          account_summary: accountSummaryValue,
          billing_information: billingInformationValue,
          usage_statistics: usageStatisticsValue,
        });
        console.log('[HomeMenuConfig] Parsed result:', result);
      } catch {
        // Ignore logging errors
      }
    }

    // Parse display_plan_settings.show_plan.{l2s_planname, plan_params_blend}
    try {
      const rawPlanSettings = displayOptions?.display_plan_settings?.show_plan || {};
      const rawNameFlag = rawPlanSettings?.l2s_planname;
      const rawBlendFlag = rawPlanSettings?.plan_params_blend;

      if (typeof rawNameFlag === 'boolean') result.showL2SPlanName = rawNameFlag;
      else if (typeof rawNameFlag === 'string') result.showL2SPlanName = rawNameFlag.toLowerCase() === 'true';

      if (typeof rawBlendFlag === 'boolean') result.showPlanParamsBlend = rawBlendFlag;
      else if (typeof rawBlendFlag === 'string') result.showPlanParamsBlend = rawBlendFlag.toLowerCase() === 'true';
    } catch {
      // ignore parsing errors, fall back to defaults
    }
    
    // console.log('🔍 [HomeMenuConfig] === FINAL CONFIG ===');
    // console.log('🔍 [HomeMenuConfig] show_profile_menu raw value:', profileMenuValue);
    // console.log('🔍 [HomeMenuConfig] direct_logout raw value:', directLogoutValue);
    // console.log('🔍 [HomeMenuConfig] account_summary raw value:', accountSummaryValue);
    // console.log('🔍 [HomeMenuConfig] billing_information raw value:', billingInformationValue);
    // console.log('🔍 [HomeMenuConfig] usage_statistics raw value:', usageStatisticsValue);
    // console.log('🔍 [HomeMenuConfig] Final config:', result);
    // console.log('🔍 [HomeMenuConfig] === END CONFIG COMPUTATION ===');
    
    return result;
  }, [menu]);

  useEffect(() => {
    if (!homeMenuConfig.profileMenuEnabled && showProfileMenu) {
      setShowProfileMenu(false);
    }
  }, [homeMenuConfig.profileMenuEnabled, showProfileMenu]);

  // Debug menu loading
  useEffect(() => {
    //console.log('🔍 [HomeScreen] Menu state:', {
    //  menu,
    //  menuLoading,
    //  menuError,
    //  isArray: Array.isArray(menu),
    //  length: Array.isArray(menu) ? menu.length : 'N/A',
    //});
    
    if (menu && Array.isArray(menu)) {
      // console.log('🔍 [HomeScreen] Menu items:', menu.map((m: any) => ({
      //   menu_label: m?.menu_label,
      //   menu_api_type: m?.menu_api_type,
      //   status: m?.status,
      // })));
    }
  }, [menu, menuLoading, menuError]);

  // Derive dynamic main menu items from API
  const mainMenuItems = useMemo(() => {
    // console.log('🔍 [mainMenuItems] === RECOMPUTING MAIN MENU ITEMS ===');
    // console.log('🔍 [mainMenuItems] Menu input:', menu);
    // console.log('🔍 [mainMenuItems] Menu is array:', Array.isArray(menu));
    
    const desiredOrder = ['Account', 'Sessions', 'Tickets', 'Ledger'];
    // Use vector icons with lighter background colors for each menu item
    const iconMap: Record<string, { icon: string; iconType: 'feather' | 'material' | 'material-community'; backgroundColor: string; iconColor: string; textColor: string }> = {
      'Account': { icon: 'user', iconType: 'feather', backgroundColor: '#E4985A', iconColor: '#FFFFFF', textColor: '#E4985A' }, // Orange background, white icon, orange text
      'Sessions': { icon: 'bar-chart-2', iconType: 'feather', backgroundColor: '#3173E3', iconColor: '#FFFFFF', textColor: '#3173E3' }, // Blue background, white icon, blue text
      'Tickets': { icon: 'clipboard', iconType: 'feather', backgroundColor: '#bfbd70', iconColor: '#FFFFFF', textColor: '#bfbd70' },
      'Ledger': { icon: 'file-text', iconType: 'feather', backgroundColor: '#9998E6', iconColor: '#FFFFFF', textColor: '#9998E6' }, // Purple background, white icon, purple text - document/billing icon
    };
    const routeMap: Record<string, () => void> = {
      'Account': () => navigation.navigate('AccountDetails'),
      'Sessions': () => navigation.navigate('Sessions'),
      'Tickets': () => navigation.navigate('Tickets'),
      'Ledger': () => navigation.navigate('Ledger'),
      // 'Renew Plan': () => navigation.navigate('RenewPlan'),
      // 'Pay Bill': () => navigation.navigate('PayBill')
    };

    const list = Array.isArray(menu)
      ? menu.filter((m: any) => {
          const isMain = m?.menu_api_type === 'main';
          const isActive = String(m?.status).toLowerCase() === 'active';
          const result = isMain && isActive;
          //console.log('🔍 [mainMenuItems] Filtering item:', {
          //  menu_label: m?.menu_label,
          //  menu_api_type: m?.menu_api_type,
          //  status: m?.status,
          //  isMain,
          //  isActive,
          //  passes: result
          //});
          return result;
        })
      : [];
    
    // console.log('🔍 [mainMenuItems] Filtered list:', list);
    // console.log('🔍 [mainMenuItems] Filtered list length:', list.length);
    
    const byLabel = new Map<string, any>();
    list.forEach((item: any) => { 
      if (item?.menu_label) {
        //console.log('🔍 [mainMenuItems] Adding to map:', item.menu_label, item);
        byLabel.set(item.menu_label, item);
      }
    });

    //console.log('🔍 [mainMenuItems] Labels in map:', Array.from(byLabel.keys()));

    const result = desiredOrder
      .filter(label => {
        const hasLabel = byLabel.has(label);
        //console.log('🔍 [mainMenuItems] Checking desired label:', label, 'exists:', hasLabel);
        return hasLabel;
      })
      .map(label => ({ 
        label, 
        displayLabel: label === 'Ledger' ? t('navigation.billingHistory') : label,
        icon: iconMap[label]?.icon || 'circle', 
        iconType: iconMap[label]?.iconType || 'feather',
        iconColor: iconMap[label]?.iconColor || '#FFFFFF',
        backgroundColor: iconMap[label]?.backgroundColor || colors.primary,
        textColor: iconMap[label]?.textColor || colors.text,
        onPress: routeMap[label] 
      }));
    
    // console.log('🔍 [mainMenuItems] Final result:', result);
    // console.log('🔍 [mainMenuItems] Final result length:', result.length);
    // console.log('🔍 [mainMenuItems] === END RECOMPUTATION ===');
    
    return result;
  }, [menu, navigation]);

  // Flag for Renew Plan visibility based on menu API
  const hasRenewPlan = useMemo(() => {
    if (!Array.isArray(menu)) return false;
    return menu.some((m: any) => (
      m?.menu_api_type === 'main' &&
      m?.menu_label === 'Renew Plan' &&
      String(m?.status).toLowerCase() === 'active'
    ));
  }, [menu]);

  // Flag for Pay Bill visibility based on menu API
  const hasPayBill = useMemo(() => {
    if (!Array.isArray(menu)) return false;
    return menu.some((m: any) => (
      m?.menu_api_type === 'main' &&
      m?.menu_label === 'Pay Bill' &&
      String(m?.status).toLowerCase() === 'active'
    ));
  }, [menu]);

  // Flag for Tickets visibility based on menu API
  const hasTickets = useMemo(() => {
    if (!Array.isArray(menu)) return false;
    return menu.some((m: any) => (
      m?.menu_api_type === 'main' &&
      m?.menu_label === 'Tickets' &&
      String(m?.status).toLowerCase() === 'active'
    ));
  }, [menu]);

  // Flag for Usage Details visibility based on menu API
  const hasUsageDetails = useMemo(() => {
    if (!Array.isArray(menu)) return false;
    return menu.some((m: any) => (
      m?.menu_api_type === 'main' &&
      m?.menu_label === 'Usage Details' &&
      String(m?.status).toLowerCase() === 'active'
    ));
  }, [menu]);

  // Component rendering indicator (removed to prevent spam)



  // CRITICAL: Clear ALL state when authentication status changes
  // This runs IMMEDIATELY when isAuthenticated changes
  useEffect(() => {
    const clearAllState = async () => {
      if (!isAuthenticated) {
        console.log('[HomeScreen] 🚨🚨🚨 LOGOUT DETECTED: Clearing ALL state IMMEDIATELY 🚨🚨🚨');
        
        // CRITICAL: Clear ALL state SYNCHRONOUSLY first (don't wait for async operations)
        // This prevents any old data from being displayed even for a millisecond
        setAuthData(null);
        setGlobalAuthData(null); // CRITICAL: Clear global context too
        setPlanDetails(null);
        setBanners([]);
        setIsLoading(true);
        setLoadingBanners(true);
        isFetchingRef.current = false;
        lastFetchTsRef.current = 0;
        lastUsernameRef.current = null;
        setCurrentUsername(null);
        
        console.log('[HomeScreen] ✅ All state variables cleared synchronously');
        
        // Then clear caches (async, but state is already cleared)
        try {
          await dataCache.clearAllCache();
          console.log('[HomeScreen] ✅ Data cache cleared');
        } catch (cacheError) {
          console.warn('[HomeScreen] Error clearing cache:', cacheError);
        }
        
        try {
          menuService.clearCache();
          console.log('[HomeScreen] ✅ Menu cache cleared');
        } catch (menuError) {
          console.warn('[HomeScreen] Error clearing menu cache:', menuError);
        }
        
        console.log('[HomeScreen] ✅✅✅ LOGOUT CLEANUP COMPLETE - SCREEN IS CLEAN ✅✅✅');
      } else {
        // User just logged in - IMMEDIATELY clear state to prevent old data display
        console.log('[HomeScreen] 🚨 LOGIN: Clearing state for fresh data');
        
        // Get current username to check if it changed
        const session = await sessionManager.getCurrentSession();
        const newUsername = session?.username || null;
        
        // CRITICAL: Always clear state on login, regardless of username
        // This prevents old user data from being displayed
        setAuthData(null);
        setGlobalAuthData(null);
        setPlanDetails(null);
        setBanners([]);
        setIsLoading(true);
        setLoadingBanners(true);
        isFetchingRef.current = false;
        lastFetchTsRef.current = 0;
        
        // Reset username ref to force fresh data fetch
        // If username changed, this will trigger data clearing in other effects
        const previousUsername = lastUsernameRef.current;
        lastUsernameRef.current = null;
        setCurrentUsername(null);
        
        // Clear all caches
        await dataCache.clearAllCache();
        menuService.clearCache();
        
        console.log('[HomeScreen] ✅ State cleared, ready for new user:', newUsername);
        console.log('[HomeScreen] Previous username was:', previousUsername);
        
        // If username changed, log it
        if (previousUsername && newUsername && previousUsername !== newUsername) {
          console.log('[HomeScreen] 🚨 USER SWITCH DETECTED:', previousUsername, '->', newUsername);
        }
      }
    };
    
    clearAllState();
  }, [isAuthenticated]);

  // Clear state when user changes - moved after fetchAccountData definition
  // This will be set up in a separate useFocusEffect after fetchAccountData is defined

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const clientConfig = getClientConfig();
        const realm = clientConfig.clientId;
        const apiBaseUrl = clientConfig.api?.baseURL || '';
        const baseImageHost = apiBaseUrl.replace(/\/l2s\/api.*$/i, '');

        const bannerData = await apiService.bannerDisplay(realm);
        // console.log('[HomeScreen] Banner API response:', Array.isArray(bannerData) ? bannerData.length : bannerData);

        const normalizedBanners = (bannerData || [])
          .map((item: any) => {
            const pathCandidates = [
              item?.banner_full_path,
              item?.full_path,
              item?.banner_path && item?.banner_image ? `${item.banner_path}/${item.banner_image}` : null,
              item?.banner_path && item?.banner_name ? `${item.banner_path}/${item.banner_name}` : null,
            ];

            let resolvedPath = pathCandidates.find(candidate => typeof candidate === 'string' && candidate.trim().length > 0) || '';

            if (resolvedPath && !/^https?:/i.test(resolvedPath)) {
              resolvedPath = `${baseImageHost}${resolvedPath.startsWith('/') ? '' : '/'}${resolvedPath}`;
            }

            try {
              resolvedPath = encodeURI(resolvedPath);
            } catch {
              // ignore encoding error, keep raw path
            }

            return {
              ...item,
              banner_full_path: resolvedPath || '',
            };
          })
          .filter((item: any) => typeof item.banner_full_path === 'string' && item.banner_full_path.trim().length > 0);

        if (normalizedBanners.length === 0) {
          // console.warn('[HomeScreen] No valid banners after normalization. Raw data:', bannerData);
        }

        setBanners(normalizedBanners);
      } catch (e) {
        // console.error('[HomeScreen] Failed to load banners:', e);
        setBanners([]);
      } finally {
        setLoadingBanners(false);
      }
    };
    fetchBanners();
  }, []);

  // Log menu once loaded (for verification)
  useEffect(() => {
    // console.log('🔍 [MenuSettings] === DETAILED MENU DEBUG ===');
    // console.log('🔍 [MenuSettings] Loading state:', menuLoading);
    // console.log('🔍 [MenuSettings] Error:', menuError);
    // console.log('🔍 [MenuSettings] Menu exists:', !!menu);
    // console.log('🔍 [MenuSettings] Menu type:', typeof menu);
    // console.log('🔍 [MenuSettings] Is array:', Array.isArray(menu));
    
    if (menu) {
      // console.log('🔍 [MenuSettings] Full menu array:', JSON.stringify(menu, null, 2));
      // console.log('🔍 [MenuSettings] Menu length:', Array.isArray(menu) ? menu.length : 'Not an array');
      
      if (Array.isArray(menu)) {
        //console.log('🔍 [MenuSettings] Menu items:');
        menu.forEach((item: any, index: number) => {
          //console.log(`🔍 [MenuSettings] Item ${index}:`, {
          //  menu_label: item?.menu_label,
          //  menu_api_type: item?.menu_api_type,
          //  status: item?.status,
          //  full_item: item
          //});
        });
        
        const mainItems = menu.filter((m: any) => m?.menu_api_type === 'main' && String(m?.status).toLowerCase() === 'active');
        //console.log('🔍 [MenuSettings] Filtered main items:', mainItems);
        //console.log('🔍 [MenuSettings] Filtered main items count:', mainItems.length);
      }
    } else {
      //console.log('🔍 [MenuSettings] Menu is null/undefined/empty');
    }
    //console.log('🔍 [MenuSettings] === END DEBUG ===');
  }, [menuLoading, menu, menuError]);

  // Disabled: Auto reload on focus to prevent unintended refreshes when switching tabs
  // useFocusEffect(
  //   React.useCallback(() => {
  //     reloadOnFocus();
  //   }, [reloadOnFocus])
  // );

  const onRefresh = React.useCallback(async () => {
    try {
      setRefreshing(true);
      await refreshMenu();
      await fetchAccountData();
      // Optionally refresh banners as well
      try {
        const realm = getClientConfig().clientId;
        const bannerData = await apiService.bannerDisplay(realm);
        setBanners(bannerData);
      } catch {}
    } finally {
      setRefreshing(false);
    }
  }, [refreshMenu]);

  // Handle back button press - exit app instead of going back to login
  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        Alert.alert(
          'Exit App',
          'Are you sure you want to exit?',
          [
            {
              text: 'Cancel',
              onPress: () => null,
              style: 'cancel',
            },
            {
              text: 'Exit',
              onPress: () => BackHandler.exitApp(),
            },
          ]
        );
        return true; // Prevent default back behavior
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);

      return () => subscription.remove();
    }, [])
  );

  const fetchAccountData = React.useCallback(async () => {
    try {
      if (isFetchingRef.current) return;
      const now = Date.now();
      if (now - lastFetchTsRef.current < 15000) return; // debounce within 15s
      isFetchingRef.current = true;
      lastFetchTsRef.current = now;
      // console.log('🏠 [HomeScreen] fetchAccountData started');
      setIsLoading(true);
      
      // Get username BEFORE clearing to verify it matches
      const sessionBeforeFetch = await sessionManager.getCurrentSession();
      const usernameBeforeFetch = sessionBeforeFetch?.username;
      
      // If username changed, clear everything first
      if (lastUsernameRef.current !== null && lastUsernameRef.current !== usernameBeforeFetch) {
        // console.log('[HomeScreen] ⚠️ Username changed during fetch! Clearing everything...');
        setAuthData(null);
        setGlobalAuthData(null);
        setPlanDetails(null);
        setBanners([]);
      }
      
      // Check session validity before making API call
      const isSessionValid = await checkSessionAndHandle(navigation);
      // console.log('🏠 [HomeScreen] Session validation result:', isSessionValid);
      
      if (!isSessionValid) {
        // console.log('🏠 [HomeScreen] Session validation failed, but continuing with API call');
      }
      
      // Get current session data
      const session = await sessionManager.getCurrentSession();
      // console.log('🏠 [HomeScreen] Current session:', {
      //   username: session?.username,
      //   hasToken: !!session?.token,
      //   tokenLength: session?.token?.length || 0
      // });
      
      if (!session) {
        // console.log('🏠 [HomeScreen] No session found, stopping');
        setIsLoading(false);
        return;
      }

      const { username } = session;
      
      // CRITICAL: Verify this is the current user - clear state if username changed
      if (lastUsernameRef.current !== null && lastUsernameRef.current !== username) {
        // console.log('[HomeScreen] ⚠️ USERNAME MISMATCH DETECTED!');
        // console.log('[HomeScreen] Previous user:', lastUsernameRef.current);
        // console.log('[HomeScreen] Current user:', username);
        // console.log('[HomeScreen] Clearing ALL state immediately...');
        
          // Clear state immediately
          setAuthData(null);
          setGlobalAuthData(null);
          setPlanDetails(null);
          setBanners([]);
          
          // Clear all caches again
          await dataCache.clearAllCache();
          menuService.clearCache();
        
        // Update username ref
        lastUsernameRef.current = username;
        
        //console.log('[HomeScreen] State cleared, continuing with API call for new user');
      } else if (lastUsernameRef.current === null) {
        // First time setting username
        lastUsernameRef.current = username;
        //console.log('[HomeScreen] Setting initial username:', username);
      }
      
      //console.log('[HomeScreen] Making API call for username:', username);

      // Use the enhanced API service with automatic token regeneration
      // console.log('🏠 [HomeScreen] Calling makeAuthenticatedRequest...');
      const authResponse = await apiService.authUser(username);
      // console.log('🏠 [HomeScreen] API call completed, response received:', !!authResponse);
      
      if (__DEV__) {
        console.log('[HomeScreen] authUser response received:', {
          hasResponse: !!authResponse,
          keys: authResponse ? Object.keys(authResponse) : [],
        });
      }
      
      if (authResponse) {
        // CRITICAL: Triple-check username matches before setting ANY data
        const currentSession = await sessionManager.getCurrentSession();
        const currentUsername = currentSession?.username;
        
        if (!currentUsername || currentUsername !== username) {
          console.log('[HomeScreen] 🚨🚨🚨 USERNAME MISMATCH - NOT SETTING DATA 🚨🚨🚨');
          console.log('[HomeScreen] Expected:', username, 'Got:', currentUsername);
          setIsLoading(false);
          isFetchingRef.current = false;
          return;
        }
        
        // CRITICAL: Verify username ref matches too
        if (lastUsernameRef.current !== null && lastUsernameRef.current !== username) {
          console.log('[HomeScreen] 🚨🚨🚨 USERNAME REF MISMATCH - NOT SETTING DATA 🚨🚨🚨');
          console.log('[HomeScreen] Ref:', lastUsernameRef.current, 'Current:', username);
          setIsLoading(false);
          isFetchingRef.current = false;
          return;
        }
        
        // Update username ref and state FIRST
        lastUsernameRef.current = username;
        setCurrentUsername(username);
        
        if (__DEV__) {
          console.log('[HomeScreen] Setting authData for user:', username);
        }
        setAuthData(authResponse);
        setGlobalAuthData(authResponse);
        
        // Extract plan details from auth response
        if (authResponse.currentPlan) {
          setPlanDetails({
            name: authResponse.currentPlan,
            price: authResponse.planPrice || '₹999',
            duration: authResponse.planDuration || '30 days',
            dataLimit: authResponse.dataAllotted || '100 GB',
          });
        }
      } else {
        //console.warn('[HomeScreen] No auth response received');
      }
      // Menu settings load via hook; refresh only if stale to avoid repeated heavy calls
      try {
        await refreshMenu();
      } catch (e: any) {
        // console.warn('[HomeScreen] Menu refresh failed:', e?.message || e);
      }
    } catch (error: any) {
      //console.error('🏠 [HomeScreen] Error fetching account data:', error.message || error);
      //Alert.alert('Error', `Failed to load account data: ${error.message}`);
    } finally {
      // console.log('🏠 [HomeScreen] fetchAccountData completed, setting loading to false');
      setIsLoading(false);
      isFetchingRef.current = false;
    }
  }, [checkSessionAndHandle, navigation, refreshMenu]);

  // Initial data fetch and push notification setup - only when authenticated
  useEffect(() => {
    // Only fetch data if user is authenticated
    if (!isAuthenticated) {
      // console.log('[HomeScreen] User not authenticated, skipping data fetch');
      return;
    }
    
    // CRITICAL: Before fetching, verify username matches and clear if it doesn't
    const verifyAndFetch = async () => {
      const session = await sessionManager.getCurrentSession();
      const sessionUsername = session?.username || null;
      
      // If username changed, clear everything first
      if (sessionUsername && lastUsernameRef.current !== null && lastUsernameRef.current !== sessionUsername) {
        console.log('[HomeScreen] 🚨 Username changed on mount! Clearing all data');
        setAuthData(null);
        setGlobalAuthData(null);
        setPlanDetails(null);
        setBanners([]);
        lastUsernameRef.current = sessionUsername;
        setCurrentUsername(sessionUsername);
        await dataCache.clearAllCache();
        menuService.clearCache();
      }
      
      // Fetch data normally
      fetchAccountData();
    };
    
    verifyAndFetch();
    
    // Initialize push registration similar to old app behavior
    (async () => {
      try {
        const realm = getClientConfig().clientId;
        //console.log('[HomeScreen] Initializing push notifications for realm:', realm);
        await initializePushNotifications(realm);
        
        // Add delay for iOS to ensure FCM token is ready
        if (Platform.OS === 'ios') {
          //console.log('[HomeScreen] iOS detected, adding delay for FCM token...');
          await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay
        }
        
        //console.log('[HomeScreen] Trying pending token registration');
        await registerPendingPushToken(realm);
        //console.log('[HomeScreen] Trying manual device registration');
        await registerDeviceManually(realm);
        
      } catch (e) {
        //console.warn('[HomeScreen] Push initialization/registration error', (e as any)?.message || e);
      }
    })();
  }, [isAuthenticated, fetchAccountData]);

  // CRITICAL: Clear state when screen comes into focus - ALWAYS check and clear if needed
  useFocusEffect(
    React.useCallback(() => {
      const clearOnFocus = async () => {
        if (!isAuthenticated) {
          // If not authenticated, ensure state is cleared
          setAuthData(null);
          setGlobalAuthData(null);
          setPlanDetails(null);
          setBanners([]);
          return;
        }
        
        const session = await sessionManager.getCurrentSession();
        const currentUsername = session?.username || null;
        
        // ALWAYS clear if username changed, or if we have old data but username doesn't match
        const shouldClear = 
          !currentUsername || // No username
          lastUsernameRef.current === null || // First time
          lastUsernameRef.current !== currentUsername || // Username changed
          (hasAuthDataRef.current && lastUsernameRef.current !== currentUsername); // We have data but username doesn't match
        
        if (shouldClear && currentUsername) {
          // console.log('[HomeScreen] 🚨 FOCUS: Clearing state - Username check');
          // console.log('[HomeScreen] Previous:', lastUsernameRef.current, 'Current:', currentUsername);
          // console.log('[HomeScreen] Has authData:', !!authData);
          
          // Clear state immediately
          setAuthData(null);
          setGlobalAuthData(null);
          setPlanDetails(null);
          setBanners([]);
          setIsLoading(true);
          
          // Clear caches
          await dataCache.clearAllCache();
          menuService.clearCache();
          
          // Update username ref and state
          lastUsernameRef.current = currentUsername;
          setCurrentUsername(currentUsername);
          
          // Fetch fresh data
          //console.log('[HomeScreen] Fetching fresh data after focus...');
          await fetchAccountData();
        } else if (currentUsername && !hasAuthDataRef.current && lastUsernameRef.current === currentUsername) {
          // Username matches but no data - fetch it
          //console.log('[HomeScreen] Username matches but no data, fetching...');
          setCurrentUsername(currentUsername);
          await fetchAccountData();
        } else if (currentUsername) {
          // Update current username state even if not clearing
          setCurrentUsername(currentUsername);
        }
      };
      
      clearOnFocus();
    }, [isAuthenticated, fetchAccountData])
  );

  const handleAdPress = (ad: any) => {
    //Alert.alert('Advertisement', `Opening ${ad.title}...`);
  };

  

  const handleBannerPress = (banner: any) => {
    setSelectedBanner(banner);
    setShowBannerModal(true);
  };

  // Adjust renderAdItem to use banner data and open in popup
  const renderAdItem = ({item}: {item: any}) => {
    if (!item?.banner_full_path) {
      return null;
    }

    return (
      <TouchableOpacity
        style={styles.adCard}
      onPress={() => handleBannerPress(item)}
        activeOpacity={0.8}
      >
        <View style={styles.adImageContainer}>
          <Image
            source={{ uri: item.banner_full_path }}
            style={styles.adImage}
            resizeMode="cover"
            accessibilityLabel={item.alt_text || item.banner_title || 'Banner'}
          />
        </View>
        {(item.banner_title || item.title_text) && (
          <View style={[styles.adOverlay, {backgroundColor: 'rgba(26, 115, 232, 0.5)'}]}>
            <Text style={styles.adTitle}>{item.banner_title || item.title_text}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderAdDot = (index: number) => (
    <View
      key={index}
      style={[
        styles.adDot,
        {backgroundColor: index === currentAdIndex ? colors.primary : colors.borderLight},
      ]}
    />
  );

  const onAdViewableItemsChanged = ({viewableItems}: any) => {
    if (viewableItems.length > 0) {
      const newIndex = viewableItems[0].index;
      currentAdIndexRef.current = newIndex;
      setCurrentAdIndex(newIndex);
    }
  };

  const viewabilityConfig = {
    itemVisiblePercentThreshold: 50,
  };

  // Auto-scroll with lower impact:
  // - runs only while Home is focused
  // - slower cadence to reduce wakeups/animations
  useEffect(() => {
    if (!isFocused || banners.length <= 1) {
      return;
    }

    const interval = setInterval(() => {
      if (flatListRef.current && banners.length > 1) {
        const nextIndex = (currentAdIndexRef.current + 1) % banners.length;
        flatListRef.current.scrollToIndex({
          index: nextIndex,
          animated: true,
        });
        currentAdIndexRef.current = nextIndex;
        setCurrentAdIndex(nextIndex);
      }
    }, 8000);

    return () => clearInterval(interval);
  }, [banners.length, isFocused]);

  const handleRenew = () => {
    navigation.navigate('RenewPlan');
  };

  const handlePayBill = () => {
    navigation.navigate('PayBill');
  };

  const handleSupport = () => {
    navigation.navigate('Tickets');
  };

  const handleMore = () => {
    navigation.navigate('MoreOptions');
  };

  const toggleProfileMenu = () => {
    setShowProfileMenu(prev => !prev);
  };

  const closeProfileMenu = () => setShowProfileMenu(false);

  // const handleMoreOptions = () => {
  //   setShowProfileMenu(false);
  //   navigation.navigate('MoreOptions');
  // };

  // const handleContactUs = () => {
  //   setShowProfileMenu(false);
  //   navigation.navigate('ContactUs');
  // };

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Logout', 
        style: 'destructive', 
        onPress: async () => {
          try {
            await logout();
            navigation.navigate('Login');
          } catch (error) {
            // console.error('Logout error:', error);
            // Even if logout fails, navigate to login
            navigation.navigate('Login');
          }
        }
      }
    ]);
  };

  const handleProfileMoreOptions = () => {
    closeProfileMenu();
    navigation.navigate('MoreOptions');
  };

  const handleProfileContactUs = () => {
    closeProfileMenu();
    navigation.navigate('ContactUs');
  };

  const handleProfileLogout = () => {
    closeProfileMenu();
    handleLogout();
  };

  // Get user initials from first_name and last_name
  const getUserInitials = (): string => {
    if (!authData || !currentUsername || lastUsernameRef.current !== currentUsername) {
      return 'U'; // Default to 'U' for User
    }
    const firstName = authData.first_name || '';
    const lastName = authData.last_name || '';
    const firstInitial = firstName.trim().charAt(0).toUpperCase() || '';
    const lastInitial = lastName.trim().charAt(0).toUpperCase() || '';
    if (firstInitial && lastInitial) {
      return `${firstInitial}${lastInitial}`;
    } else if (firstInitial) {
      return firstInitial;
    } else if (lastInitial) {
      return lastInitial;
    }
    return 'U'; // Fallback to 'U'
  };

  // Test function to simulate token expiration and regeneration
  const handleTestTokenRegeneration = async () => {
    try {
      // console.log('🧪 === TOKEN REGENERATION TEST STARTED ===');
      
      // Get current session info
      const currentSession = await sessionManager.getCurrentSession();
      // console.log('🧪 Current session:', {
      //   username: currentSession?.username,
      //   hasToken: !!currentSession?.token,
      //   tokenLength: currentSession?.token?.length || 0
      // });

      // Test 1: Try to get current token
      // console.log('🧪 Test 1: Getting current token...');
      const currentToken = await sessionManager.getToken();
      // console.log('🧪 Current token exists:', !!currentToken);

      // Test 2: Simulate token expiration by clearing token from session
      // console.log('🧪 Test 2: Simulating token expiration...');
      if (currentSession) {
        currentSession.token = ''; // Clear the token
        await sessionManager.updateToken(''); // This will trigger regeneration on next API call
        // console.log('🧪 Token cleared from session');
      }

      // Test 3: Try to make an API call that should trigger regeneration
      // console.log('🧪 Test 3: Making API call to trigger token regeneration...');
      const testResult = await apiService.makeAuthenticatedRequest(async (token) => {
        // console.log('🧪 API call executed with token length:', token?.length || 0);
        return { success: true, message: 'Test API call successful' };
      });

      // console.log('🧪 Test 3 result:', testResult);

      // Test 4: Verify new token was generated
      // console.log('🧪 Test 4: Verifying new token...');
      const newToken = await sessionManager.getToken();
      // console.log('🧪 New token exists:', !!newToken);
      // console.log('🧪 New token length:', newToken?.length || 0);

      // Test 5: Try to fetch account data to verify everything works
      // console.log('🧪 Test 5: Testing account data fetch...');
      await fetchAccountData();
      // console.log('🧪 Account data fetch completed');

      // console.log('🧪 === TOKEN REGENERATION TEST COMPLETED ===');
      
      Alert.alert(
        'Token Regeneration Test',
        'Test completed! Check console logs for details.',
        [{ text: 'OK' }]
      );

    } catch (error: any) {
      // console.error('🧪 Token regeneration test failed:', error.message || error);
      Alert.alert(
        'Test Failed',
        `Error: ${error.message || 'Unknown error'}`,
        [{ text: 'OK' }]
      );
    }
  };

  // Test function to simulate the exact scenario from error logs
  const handleTestAutoDataReloader = async () => {
    try {
      // console.log('🧪 === AUTO DATA RELOADER TEST STARTED ===');
      
      // Import the auto data reloader
      const AutoDataReloader = require('../services/autoDataReloader').default;
      
      // Test 1: Simulate token expiration scenario
      // console.log('🧪 Test 1: Simulating token expiration scenario...');
      const currentSession = await sessionManager.getCurrentSession();
      if (currentSession) {
        // Clear the token to simulate expiration
        currentSession.token = '';
        await sessionManager.updateToken('');
        // console.log('🧪 Token cleared to simulate expiration');
      }

      // Test 2: Try auto data reload
      // console.log('🧪 Test 2: Testing auto data reload with expired token...');
      const reloadResult = await AutoDataReloader.autoReloadUserData();
      // console.log('🧪 Auto reload result:', reloadResult);

      // Test 3: Verify session state after reload
      // console.log('🧪 Test 3: Verifying session state...');
      const sessionAfterReload = await sessionManager.getCurrentSession();
      // console.log('🧪 Session after reload:', {
      //   username: sessionAfterReload?.username,
      //   hasToken: !!sessionAfterReload?.token,
      //   tokenLength: sessionAfterReload?.token?.length || 0
      // });

      // Test 4: Try to fetch fresh data
      // console.log('🧪 Test 4: Testing fresh data fetch...');
      await fetchAccountData();
      // console.log('🧪 Fresh data fetch completed');

      // console.log('🧪 === AUTO DATA RELOADER TEST COMPLETED ===');
      
      Alert.alert(
        'Auto Data Reloader Test',
        'Test completed! Check console logs for details.',
        [{ text: 'OK' }]
      );

    } catch (error: any) {
      // console.error('🧪 Auto data reloader test failed:', error.message || error);
      Alert.alert(
        'Test Failed',
        `Error: ${error.message || 'Unknown error'}`,
        [{ text: 'OK' }]
      );
    }
  };

  // Simple test that mimics the real error scenario
  const handleTestRealScenario = async () => {
    try {
      // console.log('🧪 === REAL SCENARIO TEST STARTED ===');
      
      // Step 1: Clear token (simulate expiration)
      // console.log('🧪 Step 1: Clearing token to simulate expiration...');
      const currentSession = await sessionManager.getCurrentSession();
      if (currentSession) {
        currentSession.token = '';
        await sessionManager.updateToken('');
        // console.log('🧪 Token cleared');
      }

      // Step 2: Try to fetch account data (this should trigger regeneration)
      // console.log('🧪 Step 2: Attempting to fetch account data...');
      await fetchAccountData();
      // console.log('🧪 Account data fetch completed');

      // Step 3: Verify data was loaded
      // console.log('🧪 Step 3: Verifying data was loaded...');
      // console.log('🧪 Auth data loaded:', !!authData);
      // console.log('🧪 Current session token exists:', !!(await sessionManager.getToken()));

      // console.log('🧪 === REAL SCENARIO TEST COMPLETED ===');
      
      Alert.alert(
        'Real Scenario Test',
        'Test completed! Check console logs for details.',
        [{ text: 'OK' }]
      );

    } catch (error: any) {
      // console.error('🧪 Real scenario test failed:', error.message || error);
      Alert.alert(
        'Test Failed',
        `Error: ${error.message || 'Unknown error'}`,
        [{ text: 'OK' }]
      );
    }
  };

  // Calculate usage percentages
  const dataFill = authData?.usage_details?.[0]?.plan_data === 'Unlimited' ? 50 : 
    authData?.usage_details?.[0] ? (parseFloat(authData.usage_details[0].data_used) / (1024 * 1024 * 1024) / 100 * 100) : 0;
  const daysFill = authData?.usage_details?.[0]?.plan_days === 'Unlimited' ? 50 : 
    authData?.usage_details?.[0] ? (parseFloat(authData.usage_details[0].days_used) / parseFloat(authData.usage_details[0].plan_days) * 100) : 0;
  const daysRemainingText = getSafeDaysRemaining(authData?.usage_details?.[0]);

  // Build plan parameter summary for Home header when plan name is hidden
  const planSpeedDisplay = useMemo(() => {
    // Prefer top-level Mbps values if present (from authUser response)
    const topMbps =
      typeof authData?.plan_download_speed_in_mb === 'number'
        ? authData.plan_download_speed_in_mb
        : authData?.plan_download_speed_in_mb
        ? Number(authData.plan_download_speed_in_mb)
        : null;

    if (topMbps && !Number.isNaN(topMbps)) {
      return `${topMbps} Mbps`;
    }

    const usage = authData?.usage_details?.[0];
    if (!usage) return '';
    const speed =
      usage.downloadSpeed ||
      usage.download_speed ||
      usage.plan_speed ||
      usage.speed;
    if (speed) {
      const num = Number(speed);
      // If numeric, append Mbps; otherwise show raw
      return Number.isNaN(num) ? String(speed) : `${num} Mbps`;
    }
    return '';
  }, [authData?.plan_download_speed_in_mb, authData?.usage_details]);

  const planDaysDisplay = useMemo(() => {
    const usage = authData?.usage_details?.[0];
    // Use plan_days from usage_details as primary source to match Validity display
    // This ensures Current Plan and Validity show the same number of days
    // Check explicitly for plan_days first (even if it's 0, null, or empty string)
    if (usage?.plan_days !== undefined && usage?.plan_days !== null && usage?.plan_days !== '') {
      return String(usage.plan_days);
    }
    // Fallback to other usage fields
    const fromUsage = usage?.days || usage?.validity;
    // Only use total_days as last resort if plan_days is not available
    const days = fromUsage || authData?.total_days;
    return days ? String(days) : '';
  }, [authData?.total_days, authData?.usage_details]);

  // Decide what to show for Current Plan label
  const currentPlanDisplay = useMemo(() => {
    // Plan name can come from current_plan, currentPlan, or usage_details[0]
    const planNameRaw =
      authData?.current_plan ??
      authData?.currentPlan ??
      authData?.usage_details?.[0]?.plan_name ??
      authData?.usage_details?.[0]?.current_plan ??
      authData?.plan_name ??
      '';
    const planName = (planNameRaw ?? '').toString().trim();
    const showPlanName = homeMenuConfig.showL2SPlanName && planName;

    // When menu says "show plan name" and we have current_plan, prefer plan name
    if (showPlanName) {
      if (homeMenuConfig.showPlanParamsBlend && (planSpeedDisplay || planDaysDisplay)) {
        const parts = [planSpeedDisplay, planDaysDisplay ? `${planDaysDisplay} Days` : ''].filter(Boolean);
        return parts.length ? `${planName} (${parts.join(', ')})` : planName;
      }
      return planName;
    }

    // Otherwise: prefer constructed speed + days (e.g., "100 Mbps 365 Days")
    if (planSpeedDisplay && planDaysDisplay) {
      return `${planSpeedDisplay} ${planDaysDisplay} Days`;
    }
    if (planSpeedDisplay) return planSpeedDisplay;
    if (planDaysDisplay) return `${planDaysDisplay} Days`;
    // Fallback to plan name if nothing else is available
    return planName || 'No Plan';
  }, [planSpeedDisplay, planDaysDisplay, authData?.current_plan, homeMenuConfig.showL2SPlanName, homeMenuConfig.showPlanParamsBlend]);

  // Debug: log what will render in Account Summary container
  useEffect(() => {
    if (!authData) return;
    try {
      console.log('[HomeScreen] AccountSummary container data:', JSON.stringify({
        currentPlanDisplay,
        planSpeedDisplay,
        planDaysDisplay,
        usage: authData?.usage_details?.[0],
        user_status: authData?.user_status,
        login_status: authData?.login_status,
        payment_dues: authData?.payment_dues,
      }));
    } catch {
      console.log('[HomeScreen] AccountSummary container data (raw):', {
        currentPlanDisplay,
        planSpeedDisplay,
        planDaysDisplay,
        usage: authData?.usage_details?.[0],
        user_status: authData?.user_status,
        login_status: authData?.login_status,
        payment_dues: authData?.payment_dues,
      });
    }
  }, [authData, currentPlanDisplay, planSpeedDisplay, planDaysDisplay]);

  // Loading spinner component
  const LoadingSpinner = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={[styles.loadingText, {color: colors.textSecondary}]}>Loading account data...</Text>
    </View>
  );

  // Get left border color from config
  // - If headerBorderColors is not present at all → no left border
  // - If headerBorderColors.left is undefined → no left border
  // - If headerBorderColors.left is empty string '' → no border (transparent)
  // - If headerBorderColors.left has a color → use that color
  const clientConfig = getClientConfig();
  const headerBorderColors = clientConfig.branding.headerBorderColors;
  const leftBorderColor = headerBorderColors?.left;
  const leftBorderBgColor = leftBorderColor ? leftBorderColor : 'transparent';
  const leftBorderWidth = leftBorderColor ? (Platform.OS === 'ios' ? 4 : 5) : 0;

  return (
    <SafeAreaView style={[styles.container, {backgroundColor: colors.background}]}>
      {/* Left border line - 5px from top to bottom */}
      <View style={[styles.leftBorderLine, {backgroundColor: leftBorderBgColor, width: leftBorderWidth}]} />
      
      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={(
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        )}
      >
        {/* Unified Header */}
        <CommonHeader
          navigation={navigation}
          showBackButton={false}
          logoPosition="center"
          rightComponent={(
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TouchableOpacity
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 12,
                  backgroundColor: isHeaderBgClient ? 'rgba(0,0,0,0.4)' : colors.background,
                }}
                onPress={() => navigation.navigate('Notifications')}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel="Notifications"
              >
                <Feather
                  name="bell"
                  size={20}
                  color={isHeaderBgClient ? '#FFFFFF' : (colors.primary || '#FF6B35')}
                />
              </TouchableOpacity>
              {homeMenuConfig.profileMenuEnabled ? (
                <TouchableOpacity 
                  style={styles.profileAvatarButton}
                  onPress={toggleProfileMenu}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityLabel="Profile menu"
                >
                  <View style={[styles.profileAvatar, {backgroundColor: colors.primary || '#FF6B35'}]}>
                    <Text style={styles.profileAvatarText}>{getUserInitials()}</Text>
                  </View>
                </TouchableOpacity>
              ) : homeMenuConfig.directLogoutEnabled ? (
                <TouchableOpacity 
                  style={styles.logoutButtonHeader}
                  onPress={handleLogout}
                  activeOpacity={0.8}
                >
                  <Feather name="log-out" size={20} color={colors.primary || '#FF6B35'} />
                  <Text style={[styles.logoutButtonText, {color: colors.primary || '#FF6B35'}]}>{t('common.logout')}</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          )}
        />

        {homeMenuConfig.profileMenuEnabled && showProfileMenu && (
          <View style={[styles.profileMenu, {backgroundColor: colors.card, shadowColor: colors.shadow}]}>
            <TouchableOpacity 
              style={[styles.menuItem, {backgroundColor: 'transparent'}]} 
              onPress={handleProfileMoreOptions}
              activeOpacity={0.7}>
              <Text style={[styles.menuIcon, {color: colors.textSecondary}]}>⋮</Text>
              <Text style={[styles.menuText, {color: colors.text}]}>More Options</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.menuItem, {backgroundColor: 'transparent'}]} 
              onPress={handleProfileContactUs}
              activeOpacity={0.7}>
              <Feather name="phone" size={20} color={colors.textSecondary} style={styles.menuIcon} />
              <Text style={[styles.menuText, {color: colors.text}]}>{t('common.contactUs')}</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.menuItem, {backgroundColor: 'transparent'}]} 
              onPress={handleProfileLogout}
              activeOpacity={0.7}>
              <Text style={[styles.menuIcon, {color: colors.textSecondary}]}>🚪</Text>
              <Text style={[styles.menuText, {color: colors.text}]}>{t('common.logout')}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Welcome Message */}
        <View style={styles.welcomeSection}>
          <Text style={[styles.welcomeText, {color: colors.textSecondary}]}>{t('common.welcome')},</Text>
          <View style={styles.userNameRow}>
            <Text style={[styles.userName, {color: colors.text}]}>
              {shouldShowData && authData
                ? `${authData.first_name || ''} ${authData.last_name || ''}`.trim() || 'User' 
                : 'User'}
            </Text>
            {shouldShowData && currentUsername && (
              <Text style={[styles.userNameText, {color: colors.textSecondary}]}>
                {' '}({currentUsername})
              </Text>
            )}
          </View>
        </View>

        {/* Account Summary Card */}
        {homeMenuConfig.accountSummaryEnabled && (
        <View style={[styles.accountCard, {backgroundColor: colors.card, shadowColor: colors.shadow}]}>
          <View style={styles.cardHeader}>
            <Text style={[styles.cardTitle, {color: colors.text}]}>{t('home.accountSummary')}</Text>
            <TouchableOpacity 
              style={[styles.viewDetailsButton, {backgroundColor: colors.primary}]}
              onPress={() => navigation.navigate('AccountDetails')}
              activeOpacity={0.8}
            >
              <Text style={styles.viewDetailsText}>{t('common.viewDetails')}</Text>
            </TouchableOpacity>
          </View>
          
          {isLoading ? (
            <LoadingSpinner />
          ) : !shouldShowData ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={[styles.loadingText, {color: colors.textSecondary}]}>Loading account data...</Text>
            </View>
          ) : (
            <>
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, {color: colors.textSecondary}]}>{t('home.currentPlan')}</Text>
                <View style={styles.detailValueContainer}>
                  <Text 
                    style={[styles.detailValue, {color: colors.text}]}
                    numberOfLines={2}
                    ellipsizeMode="tail"
                  >
                    {currentPlanDisplay || 'No Plan'}
                  </Text>
                </View>
              </View>
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, {color: colors.textSecondary}]}>{t('home.validity')}</Text>
                <Text style={[styles.detailValue, {color: colors.text}]}>
                  {authData?.usage_details?.[0] ? 
                    `${authData.usage_details[0].days_used} used of ${authData.usage_details[0].plan_days} days` : 
                    'No data available'}
                </Text>
              </View>

              {/* Account Status */}
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, {color: colors.textSecondary}]}>Account Status</Text>
                <Text style={[styles.detailValue, {color: authData?.user_status === 'active' ? activeStatusColor : '#F44336'}]}>
                  {authData?.user_status?.replace(/_+/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) || 'Active'}
                </Text>
              </View>

              {/* Login Status */}
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, {color: colors.textSecondary}]}>Login Status</Text>
                <Text style={[styles.detailValue, {color: authData?.login_status === 'IN' ? loginStatusColor : '#F44336'}]}>
                  {authData?.login_status === 'IN' ? 'Online' : 'Offline'}
                </Text>
              </View>

              {/* Payment Dues Row */}
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, {color: colors.textSecondary}]}>Payment Dues</Text>
                <Text style={[styles.detailValue, {color: authData?.payment_dues > 0 ? '#F44336' : colors.primary}]}>
                  {authData?.payment_dues > 0 ? `₹${authData?.payment_dues}` : 'Fully Paid'}
                </Text>
              </View>

              {/* Pay Now button - only show if there are payment dues */}
              {authData?.payment_dues > 0 && (
                <TouchableOpacity 
                  style={[styles.payNowButton, {backgroundColor: colors.primary, marginTop: 12}]} 
                  onPress={handlePayBill}>
                  <Text style={styles.payNowText}>Pay Now</Text>
                </TouchableOpacity>
              )}
            </>
          )}

          

          {/* Renewal Count */}
          {/* <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, {color: colors.textSecondary}]}>Renewal Count</Text>
            <Text style={[styles.detailValue, {color: colors.text}]}>
              {authData?.renewal_count || '0'}
            </Text>
          </View> */}

          {/* Connection Type */}
          {/* <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, {color: colors.textSecondary}]}>Connection Type</Text>
            <Text style={[styles.detailValue, {color: colors.text}]}>
              {authData?.connection_type || 'N/A'}
            </Text>
          </View> */}

          {/* User Profile */}
          {/* <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, {color: colors.textSecondary}]}>User Profile</Text>
            <Text style={[styles.detailValue, {color: colors.text}]}>
              {authData?.user_profile || 'N/A'}
            </Text>
          </View> */}
        </View>
        )}

        {/* Advertisement Carousel - only if banners exist */}
        {!loadingBanners && banners.length > 0 && (
          <View style={styles.adCarouselSection}>
            <FlatList
              ref={flatListRef}
              data={banners}
              renderItem={renderAdItem}
              keyExtractor={item => item.id?.toString() || item.banner_id?.toString() || Math.random().toString()}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onViewableItemsChanged={onAdViewableItemsChanged}
              viewabilityConfig={viewabilityConfig}
            />
            <View style={styles.adDots}>
              {banners.map((_, index) => renderAdDot(index))}
            </View>
          </View>
        )}

        {/* Banner Popup Modal */}
        {selectedBanner && showBannerModal && (
          <Modal
            visible={showBannerModal}
            transparent
            animationType="fade"
            onRequestClose={closeBannerModal}>
            <SafeAreaView style={styles.bannerModalOverlay} edges={['top', 'bottom']}>
              <View style={[styles.bannerModalContent, {backgroundColor: colors.card}]}>
                <TouchableOpacity
                  style={styles.bannerModalClose}
                  onPress={closeBannerModal}>
                  <Text style={styles.bannerModalCloseText}>✕</Text>
                </TouchableOpacity>

                <View style={styles.bannerModalImageContainer}>
                  <Image
                    source={{uri: selectedBanner.banner_full_path}}
                    style={styles.bannerModalImage}
                    resizeMode="contain"
                  />
                </View>

                {(selectedBanner.banner_title || selectedBanner.title_text) && (
                  <Text
                    style={[
                      styles.bannerModalTitle,
                      {color: colors.text},
                    ]}
                    numberOfLines={2}
                    ellipsizeMode="tail">
                    {selectedBanner.banner_title || selectedBanner.title_text}
                  </Text>
                )}

                {selectedBanner.target_url && (
                  <TouchableOpacity
                    style={[styles.bannerModalButton, {backgroundColor: colors.primary}]}
                    onPress={() => {
                      const url = selectedBanner?.target_url;
                      closeBannerModal();
                      if (url) {
                        Linking.openURL(url).catch(() => {
                          Alert.alert('Error', 'Unable to open link');
                        });
                      }
                    }}>
                    <Text style={styles.bannerModalButtonText}>Open Link</Text>
                  </TouchableOpacity>
                )}
              </View>
            </SafeAreaView>
          </Modal>
        )}

        {/* Quick Menu Section (dynamic from menu settings) */}
        <View style={[styles.quickMenuCard, {backgroundColor: colors.card, shadowColor: colors.shadow}]}>
          <Text style={[styles.quickMenuTitle, {color: colors.text}]}>{t('home.quickMenu')}</Text>
          {menuLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={[styles.loadingText, {color: colors.textSecondary}]}>Loading menu...</Text>
            </View>
          ) : menuError ? (
            <View style={styles.loadingContainer}>
              <Text style={[styles.loadingText, {color: colors.error || '#F44336'}]}>
                Error loading menu: {menuError}
              </Text>
              <TouchableOpacity 
                style={[styles.testButton, {backgroundColor: colors.primary}]}
                onPress={forceRefreshMenu}
              >
                <Text style={styles.testButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : mainMenuItems.length === 0 ? (
            <View style={styles.loadingContainer}>
              <Text style={[styles.loadingText, {color: colors.textSecondary}]}>
                No menu items available. {Array.isArray(menu) ? `Found ${menu.length} items in database.` : 'Menu data not loaded.'}
              </Text>
              <TouchableOpacity 
                style={[styles.testButton, {backgroundColor: colors.primary}]}
                onPress={forceRefreshMenu}
              >
                <Text style={styles.testButtonText}>Refresh Menu</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.quickMenuRow}>            
              {mainMenuItems.map(item => (
                <TouchableOpacity 
                  key={item.label}
                  style={styles.quickMenuRowItem}
                  onPress={item.onPress}
                  disabled={!item.onPress}
                >
                  {isMicroscan ? (
                    // For microscan: just the icon with primary color, no background container
                    <>
                      {item.iconType === 'feather' ? (
                        <Feather name={item.icon} size={24} color={colors.primary} />
                      ) : item.iconType === 'material' ? (
                        <MaterialIcons name={item.icon} size={24} color={colors.primary} />
                      ) : item.iconType === 'material-community' ? (
                        <MaterialCommunityIcons name={item.icon} size={24} color={colors.primary} />
                      ) : (
                        <Text style={[styles.quickMenuRowIcon, { color: colors.primary, fontWeight: 'bold' }]}>{item.icon}</Text>
                      )}
                    </>
                  ) : (
                    // For other clients: icon with filled background container
                    <View style={[styles.quickMenuIconContainer, { backgroundColor: item.backgroundColor || colors.primary }]}>
                      {item.iconType === 'feather' ? (
                        <Feather name={item.icon} size={26} color={item.iconColor || '#FFFFFF'} strokeWidth={2.5} />
                      ) : item.iconType === 'material' ? (
                        <MaterialIcons name={item.icon} size={26} color={item.iconColor || '#FFFFFF'} />
                      ) : item.iconType === 'material-community' ? (
                        <MaterialCommunityIcons name={item.icon} size={26} color={item.iconColor || '#FFFFFF'} />
                      ) : (
                        <Text style={[styles.quickMenuRowIcon, { color: item.iconColor || '#FFFFFF', fontWeight: 'bold' }]}>{item.icon}</Text>
                      )}
                    </View>
                  )}
                  <Text style={[styles.quickMenuRowTitle, {color: isMicroscan ? colors.text : (item.textColor || colors.text)}]}>{item.displayLabel || item.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Quick Actions (hidden for all clients per request) */}
        {false && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, {color: colors.text}]}>{t('home.quickActions')}</Text>
          <View style={styles.actionGrid}>
            {hasRenewPlan && (
              <TouchableOpacity 
                style={[styles.actionCard, {backgroundColor: colors.card, shadowColor: colors.shadow}]} 
                onPress={handleRenew}>
                <View style={[styles.actionIcon, {backgroundColor: colors.primaryLight}]}> 
                  <Text style={styles.iconText}>🔄</Text>
                </View>
                <Text style={[styles.actionTitle, {color: colors.text}]}>{t('home.renewPlan')}</Text>
                <Text style={[styles.actionSubtitle, {color: colors.textSecondary}]}>Extend your plan</Text>
              </TouchableOpacity>
            )}

            {hasPayBill && (
              <TouchableOpacity 
                style={[styles.actionCard, {backgroundColor: colors.card, shadowColor: colors.shadow}]} 
                onPress={handlePayBill}>
                <View style={[styles.actionIcon, {backgroundColor: colors.primaryLight}]}> 
                  <MaterialIcons name="credit-card" size={24} color={colors.primary} />
                </View>
                <Text style={[styles.actionTitle, {color: colors.text}]}>{t('home.payBill')}</Text>
                <Text style={[styles.actionSubtitle, {color: colors.textSecondary}]}>{Number(authData?.payment_dues) > 0 ? `₹${authData?.payment_dues}` : 'Fully Paid'}</Text>
              </TouchableOpacity>
            )}

            {hasTickets && (
              <TouchableOpacity 
                style={[styles.actionCard, {backgroundColor: colors.card, shadowColor: colors.shadow}]} 
                onPress={handleSupport}>
                <View style={[styles.actionIcon, {backgroundColor: colors.primaryLight}]}> 
                  <MaterialIcons name="help-outline" size={24} color={colors.primary} />
                </View>
                <Text style={[styles.actionTitle, {color: colors.text}]}>{t('home.support')}</Text>
                <Text style={[styles.actionSubtitle, {color: colors.textSecondary}]}>Get help</Text>
              </TouchableOpacity>
            )}



            <TouchableOpacity 
              style={[styles.actionCard, {backgroundColor: colors.card, shadowColor: colors.shadow}]} 
              onPress={() => navigation.navigate('ContactUs')}>
              <View style={[styles.actionIcon, {backgroundColor: colors.primaryLight}]}>
                <Feather name="phone" size={24} color={colors.primary} />
              </View>
              <Text style={[styles.actionTitle, {color: colors.text}]}>{t('common.contactUs')}</Text>
              <Text style={[styles.actionSubtitle, {color: colors.textSecondary}]}>Reach out</Text>
            </TouchableOpacity>
          </View>
        </View>
        )}

        {/* Bill Information */}
        {homeMenuConfig.billingInformationEnabled && (
        <View style={[styles.billCard, {backgroundColor: colors.card, shadowColor: colors.shadow}]}>
          <Text style={[styles.billTitle, {color: colors.text}]}>{t('account.billingInfo')}</Text>
          {isLoading ? (
            <LoadingSpinner />
          ) : !authData || (currentUsername && lastUsernameRef.current !== currentUsername) ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={[styles.loadingText, {color: colors.textSecondary}]}>Loading billing data...</Text>
            </View>
          ) : (
            <>
              <View style={styles.billDetails}>
                
                <View style={styles.billRow}>
                  <Text style={[styles.billLabel, {color: colors.textSecondary}]}>Renewal Date</Text>
                  <Text style={[styles.billDate, {color: colors.text}]}>{authData?.renew_date || 'N/A'}</Text>
                </View>
                <View style={styles.billRow}>
                  <Text style={[styles.billLabel, {color: colors.textSecondary}]}>Expiry Date</Text>
                  <Text style={[styles.billDate, {color: colors.text}]}>{authData?.exp_date || 'N/A'}</Text>
                </View>
                {nextRenewalValue ? (
                  <View style={styles.billRow}>
                    <Text style={[styles.billLabel, {color: colors.textSecondary}]}>Next Renewal</Text>
                    <Text style={[styles.billDate, {color: colors.text}]}>{nextRenewalValue}</Text>
                  </View>
                ) : null}
              </View>
            </>
          )}
        </View>
        )}

        {/* More Options*/}
        {/* <View style={styles.section}>
          <TouchableOpacity 
            style={[styles.moreOptionsButton, {backgroundColor: colors.card, shadowColor: colors.shadow}]} 
            onPress={handleMore}>
            <Text style={[styles.moreOptionsButtonText, {color: colors.text}]}>{t('more.title')}</Text>
            <Text style={[styles.arrowText, {color: colors.textSecondary}]}>›</Text>
          </TouchableOpacity>
        </View>  */}

        {/* Usage Statistics */}
        {hasUsageDetails && homeMenuConfig.usageStatisticsEnabled && (
        <View style={[styles.usageCard, {backgroundColor: colors.card, shadowColor: colors.shadow}]}>
          <View style={styles.usageHeader}>
            <Text style={[styles.usageTitle, {color: colors.text}]}>Usage Statistics</Text>
            <View style={[styles.usageBadge, {backgroundColor: colors.primaryLight}]}>
              <Text style={[styles.usageBadgeText, {color: colors.primary}]}>Live</Text>
            </View>
          </View>
          
          {isLoading ? (
            <LoadingSpinner />
          ) : !authData || (currentUsername && lastUsernameRef.current !== currentUsername) ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={[styles.loadingText, {color: colors.textSecondary}]}>Loading usage data...</Text>
            </View>
          ) : (
            <>
              {/* Data Usage Section */}
              <View style={styles.dataUsageSection}>
                <View style={styles.dataUsageHeader}>
                  <Text style={[styles.dataUsageLabel, {color: colors.textSecondary}]}>Data Usage</Text>
                  <Text style={[styles.dataUsageValue, {color: colors.text}]}>
                    {authData?.usage_details?.[0] ? 
                      `${(parseFloat(authData.usage_details[0].data_used) / (1024 * 1024 * 1024)).toFixed(2)} GB` : 
                      '0 GB'}
                  </Text>
                </View>
                <View style={[styles.dataUsageBar, {backgroundColor: colors.borderLight}]}>
                  <View style={[styles.dataUsageProgress, {width: `${dataFill}%`, backgroundColor: colors.primary}]} />
                </View>
                <Text style={[styles.dataUsageTotal, {color: colors.textSecondary}]}>
                  of {authData?.usage_details?.[0]?.plan_data || 'Unlimited'}
                </Text>
              </View>
              
              {/* Usage Stats Row */}
              <View style={styles.usageStatsRow}>
                <View style={styles.usageStat}>
                  <View style={[styles.usageStatIconContainer, {backgroundColor: colors.primaryLight}]}>
                    <Feather name="clock" size={20} color={colors.primary} />
                  </View>
                  <Text style={[styles.usageStatLabel, {color: colors.textSecondary}]}>Hours Used</Text>
                  <Text style={[styles.usageStatValue, {color: colors.text}]}>
                    {authData?.usage_details[0]?.hours_used || '0:00:00'}
                  </Text>
                </View>
                
                <View style={styles.usageStat}>
                  <View style={[styles.usageStatIconContainer, {backgroundColor: colors.primaryLight}]}>
                    <Feather name="calendar" size={20} color={colors.primary} />
                  </View>
                  <Text style={[styles.usageStatLabel, {color: colors.textSecondary}]}>Days Remaining</Text>
                  <Text style={[styles.usageStatValue, {color: colors.text}]}>
                    {daysRemainingText}
                  </Text>
                </View>
                
                {authData?.usage_details?.[0]?.plan_data !== 'Unlimited' && (
                  <View style={styles.usageStat}>
                    <View style={[styles.usageStatIconContainer, {backgroundColor: colors.primaryLight}]}>
                      <Feather name="bar-chart-2" size={20} color={colors.primary} />
                    </View>
                    <Text style={[styles.usageStatLabel, {color: colors.textSecondary}]}>Usage %</Text>
                    <Text style={[styles.usageStatValue, {color: colors.text}]}>
                      {Math.round(dataFill)}%
                    </Text>
                  </View>
                )}
              </View>
            </>
          )}
        </View>
        )}

        {/* AI Usage Insights - Hidden for now */}
        {/* <AIUsageInsights key="ai-insights" navigation={navigation} /> */}

        
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
    overflow: 'visible',
  },
  leftBorderLine: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    // Make the line a bit bolder on Android so it's clearly visible
    width: Platform.OS === 'ios' ? 4 : 5,
    // Ensure the line stays above card shadows and other content, especially on Android
    zIndex: 100,
    elevation: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'space-between',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  moreButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerActionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerActionText: {
    fontSize: 18,
  },
  profileMenu: {
    position: 'absolute',
    top: 80,
    right: 20,
    borderRadius: 16,
    padding: 8,
    minWidth: 180,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1000,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    marginVertical: 2,
  },
  menuIcon: {
    fontSize: 20,
    marginRight: 14,
    width: 24,
    textAlign: 'center',
  },
  menuText: {
    fontSize: 16,
    fontWeight: '600',
  },
  logo: {
    marginRight: 12,
  },
  profileAvatarButton: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 4,
  },
  profileAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  profileAvatarText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  logoutButtonHeader: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  logoutButtonText: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  welcomeSection: {
    paddingHorizontal: 20,
    marginTop: 8,
    paddingBottom: 20,
  },
  welcomeText: {
    fontSize: 16,
    marginBottom: 4,
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    flexWrap: 'wrap',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  userNameText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  accountCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    padding: 20,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  editText: {
    fontSize: 14,
    fontWeight: '500',
  },
  viewDetailsButton: {
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  viewDetailsText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  detailLabel: {
    fontSize: 14,
    flex: 1,
    marginRight: 12,
  },
  detailValueContainer: {
    flex: 2,
    alignItems: 'flex-end',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'right',
    flexShrink: 1,
  },
  adCarouselSection: {
    height: screenWidth * 0.4, // Reduced height for more compact design
    marginHorizontal: 20,
    marginBottom: 20,
  },
  adCard: {
    width: screenWidth - 40, // Account for horizontal margins
    height: '100%',
    position: 'relative',
  },
  adImageContainer: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
    overflow: 'hidden',
  },
  adImage: {
    width: '100%',
    height: '100%',
  },
  adOverlay: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    padding: 10,
    borderRadius: 8,
  },
  adTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  adSubtitle: {
    color: '#fff',
    fontSize: 10,
  },
  adDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
  },
  adDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  bannerModalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.85)',
    padding: 16,
  },
  bannerModalContent: {
    width: '92%',
    maxHeight: '85%',
    borderRadius: 16,
    padding: 16,
    paddingTop: Platform.OS === 'ios' ? 40 : 24,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  bannerModalClose: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 10 : 6,
    right: 10,
    padding: 10,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 10,
  },
  bannerModalCloseText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  bannerModalImageContainer: {
    width: '100%',
    height: modalImageHeight,
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 12,
    backgroundColor: '#000',
  },
  bannerModalImage: {
    width: '100%',
    height: '100%',
  },
  bannerModalTitle: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 12,
  },
  bannerModalButton: {
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
    alignSelf: 'center',
    minWidth: 140,
  },
  bannerModalButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionCard: {
    width: '48%',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  actionIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconText: {
    fontSize: 24,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  actionSubtitle: {
    fontSize: 12,
  },
  billCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    padding: 20,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  billTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  billDetails: {
    marginBottom: 16,
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  billLabel: {
    fontSize: 14,
  },
  billAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  billDate: {
    fontSize: 14,
    fontWeight: '600',
  },
  payNowButton: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  payNowText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },

  arrowText: {
    fontSize: 20,
  },
  moreOptionsButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 12,
    padding: 16,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  moreOptionsButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  usageCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    padding: 20,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  usageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  usageTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  usageBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  usageBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  dataUsageSection: {
    marginBottom: 20,
  },
  dataUsageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  dataUsageLabel: {
    fontSize: 14,
  },
  dataUsageValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  dataUsageBar: {
    height: 8,
    borderRadius: 4,
    marginBottom: 4,
  },
  dataUsageProgress: {
    height: '100%',
    borderRadius: 4,
  },
  dataUsageTotal: {
    fontSize: 12,
    textAlign: 'right',
  },
  usageStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  usageStat: {
    alignItems: 'center',
    flex: 1,
  },
  usageStatIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  usageStatIcon: {
    marginBottom: 4,
  },
  usageStatLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  usageStatValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  usageText: {
    fontSize: 14,
    textAlign: 'center',
  },
  usageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  usageLabel: {
    fontSize: 14,
  },
  usageValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  quickMenuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickMenuItem: {
    width: '48%',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  quickMenuIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickMenuIconText: {
    fontSize: 24,
  },
  quickMenuCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    padding: 20,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  quickMenuTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  quickMenuRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickMenuRowItem: {
    alignItems: 'center',
    flex: 1,
  },
  quickMenuIconContainer: {
    width: 50,
    height: 42,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickMenuRowIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  quickMenuRowTitle: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  testButton: {
    marginTop: 10,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  testButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  apiResponseCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    padding: 20,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  apiResponseTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  apiResponseScroll: {
    maxHeight: 200, // Limit height for scrolling
  },
  apiResponseText: {
    fontSize: 14,
    lineHeight: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    marginTop: 12,
    textAlign: 'center',
  },
});

export default HomeScreen; 