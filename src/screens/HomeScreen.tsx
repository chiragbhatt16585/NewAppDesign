import React, {useState, useRef, useEffect, useMemo} from 'react';
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
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useFocusEffect} from '@react-navigation/native';
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
// import AIUsageInsights from '../components/AIUsageInsights';
//import ispLogo from '../assets/isp_logo.png';
import Feather from 'react-native-vector-icons/Feather';

const {width: screenWidth} = Dimensions.get('window');

const HomeScreen = ({navigation}: any) => {
  const {isDark} = useTheme();
  const colors = getThemeColors(isDark);
  const {t} = useTranslation();
  const [currentAdIndex, setCurrentAdIndex] = useState(0);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const currentAdIndexRef = useRef(0); // Use ref to track current index without re-renders
  const {logout, isAuthenticated} = useAuth();
  const {checkSessionAndHandle} = useSessionValidation();
  const {reloadOnFocus} = useScreenDataReload({
    onReloadStart: () => {/* console.log('Auto reload starting...'); */},
    onReloadSuccess: (data) => {
      // console.log('Auto reload successful, refreshing screen data');
      fetchAccountData();
    },
    onReloadError: (error) => {/* console.log('Auto reload failed:', error) */}
  });

  // State for API data - ALWAYS start with null to prevent old data display
  const [authData, setAuthData] = useState<any>(null);
  const isFetchingRef = useRef(false);
  const lastFetchTsRef = useRef<number>(0);
  const [planDetails, setPlanDetails] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [apiResponse, setApiResponse] = useState<string>('');
  const [banners, setBanners] = useState<any[]>([]);
  const [loadingBanners, setLoadingBanners] = useState(true);
  const lastUsernameRef = useRef<string | null>(null);
  const hasClearedOnMountRef = useRef(false);
  const [currentUsername, setCurrentUsername] = useState<string | null>(null);

  // CRITICAL: Sync current username and clear data if username doesn't match
  useEffect(() => {
    const syncUsername = async () => {
      if (!isAuthenticated) {
        setCurrentUsername(null);
        return;
      }
      
      const session = await sessionManager.getCurrentSession();
      const sessionUsername = session?.username || null;
      
      // If we have authData but username doesn't match, clear it immediately
      if (authData && sessionUsername && lastUsernameRef.current !== sessionUsername) {
        console.log('[HomeScreen] ⚠️ RENDER CHECK: Username mismatch detected!');
        console.log('[HomeScreen] AuthData exists for:', lastUsernameRef.current);
        console.log('[HomeScreen] Current session username:', sessionUsername);
        console.log('[HomeScreen] Clearing authData immediately...');
        
        setAuthData(null);
        setPlanDetails(null);
        setApiResponse('');
        lastUsernameRef.current = null;
        setCurrentUsername(null);
      }
      
      // Update current username state
      if (sessionUsername) {
        setCurrentUsername(sessionUsername);
      }
    };
    
    syncUsername();
  }, [isAuthenticated, authData]);

  // Debug: log next renewal date value when it changes
  useEffect(() => {
    console.log('Next Renewal debug =>', authData?.next_renewal_date, 'type:', typeof authData?.next_renewal_date);
  }, [authData?.next_renewal_date]);

  // Normalize next renewal value and filter placeholders like 'N/A', 'NA', '-', 'null'
  const nextRenewalValue = useMemo(() => {
    const raw = (authData?.next_renewal_date ?? '').toString().trim();
    const invalids = ['N/A', 'NA', '-', 'NULL', 'UNDEFINED', ''];
    return invalids.includes(raw.toUpperCase()) ? '' : raw;
  }, [authData?.next_renewal_date]);
  const { menu, loading: menuLoading, error: menuError, refresh: refreshMenu, forceRefresh: forceRefreshMenu } = useMenuSettings();
  const [refreshing, setRefreshing] = useState(false);
  const isMicroscan = getClientConfig().clientId === 'microscan';

  // Debug menu loading
  useEffect(() => {
    console.log('🔍 [HomeScreen] Menu state:', {
      menu,
      menuLoading,
      menuError,
      isArray: Array.isArray(menu),
      length: Array.isArray(menu) ? menu.length : 'N/A',
    });
    
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
    // Use vector icons so we can tint them with theme primary (orange)
    const iconMap: Record<string, { icon: string; iconType: 'feather' }> = {
      'Account': { icon: 'user', iconType: 'feather' },
      'Sessions': { icon: 'bar-chart-2', iconType: 'feather' },
      'Tickets': { icon: 'clipboard', iconType: 'feather' },
      'Ledger': { icon: 'book', iconType: 'feather' },
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
        icon: iconMap[label]?.icon || 'circle', 
        iconType: iconMap[label]?.iconType || 'feather', 
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



  // Mock advertisement data
  // const advertisements = [
  //   {
  //     id: '1',
  //     image: require('../assets/1st-slide-desk.webp'),
  //     // title: 'First time in GOA',
  //     // subtitle: 'Experience blazing fast connectivity',
  //     backgroundColor: 'rgba(26, 115, 232, 0.8)',
  //   },
  //   {
  //     id: '2',
  //     image: require('../assets/DNA3.jpg'),
  //     // title: 'Advanced Technology',
  //     // subtitle: 'Cutting-edge network solutions',
  //     backgroundColor: 'rgba(220, 53, 69, 0.8)',
  //   },
  //   {
  //     id: '3',
  //     image: require('../assets/Group-60974.webp'),
  //     // title: 'Premium Service',
  //     // subtitle: 'Unmatched quality and reliability',
  //     backgroundColor: 'rgba(40, 167, 69, 0.8)',
  //   },
  // ];

  // CRITICAL: Clear ALL state when authentication status changes
  useEffect(() => {
    const clearAllState = async () => {
      if (!isAuthenticated) {
        //console.log('[HomeScreen] 🚨 LOGOUT: Clearing ALL state immediately');
        setAuthData(null);
        setPlanDetails(null);
        setApiResponse('');
        setBanners([]);
        setIsLoading(true);
        setLoadingBanners(true);
        isFetchingRef.current = false;
        lastFetchTsRef.current = 0;
        lastUsernameRef.current = null;
        setCurrentUsername(null);
        await dataCache.clearAllCache();
        menuService.clearCache();
      } else {
        // User just logged in - IMMEDIATELY clear state to prevent old data display
        console.log('[HomeScreen] 🚨 LOGIN: Clearing state for fresh data');
        
        // Get current username to check if it changed
        const session = await sessionManager.getCurrentSession();
        const newUsername = session?.username || null;
        
        // Always clear state on login, regardless of username
        setAuthData(null);
        setPlanDetails(null);
        setApiResponse('');
        setBanners([]);
        setIsLoading(true);
        setLoadingBanners(true);
        isFetchingRef.current = false;
        lastFetchTsRef.current = 0;
        
        // Reset username ref to force fresh data fetch
        lastUsernameRef.current = null;
        setCurrentUsername(null);
        
        // Clear all caches
        await dataCache.clearAllCache();
        menuService.clearCache();
        
        console.log('[HomeScreen] ✅ State cleared, ready for new user:', newUsername);
      }
    };
    
    clearAllState();
  }, [isAuthenticated]);

  // Clear state when user changes - moved after fetchAccountData definition
  // This will be set up in a separate useFocusEffect after fetchAccountData is defined

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const realm = getClientConfig().clientId;
        const bannerData = await apiService.bannerDisplay(realm);
        setBanners(bannerData);
      } catch (e) {
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
      if (now - lastFetchTsRef.current < 5000) return; // debounce within 5s
      isFetchingRef.current = true;
      lastFetchTsRef.current = now;
      // console.log('🏠 [HomeScreen] fetchAccountData started');
      setIsLoading(true);
      
      // Get username BEFORE clearing to verify it matches
      const sessionBeforeFetch = await sessionManager.getCurrentSession();
      const usernameBeforeFetch = sessionBeforeFetch?.username;
      
      // If username changed, clear everything first
      if (lastUsernameRef.current !== null && lastUsernameRef.current !== usernameBeforeFetch) {
        console.log('[HomeScreen] ⚠️ Username changed during fetch! Clearing everything...');
        setAuthData(null);
        setPlanDetails(null);
        setApiResponse('');
        setBanners([]);
      }
      
      // Always clear caches before fetch to ensure fresh data
      //console.log('[HomeScreen] Clearing caches before fetch...');
      await dataCache.clearAllCache();
      menuService.clearCache();
      
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
        console.log('[HomeScreen] ⚠️ USERNAME MISMATCH DETECTED!');
        console.log('[HomeScreen] Previous user:', lastUsernameRef.current);
        console.log('[HomeScreen] Current user:', username);
        console.log('[HomeScreen] Clearing ALL state immediately...');
        
        // Clear state immediately
        setAuthData(null);
        setPlanDetails(null);
        setApiResponse('');
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
      
      // console.warn('=== AUTH USER API RESPONSE ===');
      // console.warn('Full Response:', JSON.stringify(authResponse, null, 2));
      // console.warn('Response Type:', typeof authResponse);
      // console.warn('Is Array:', Array.isArray(authResponse));
      // console.warn('Keys:', authResponse ? Object.keys(authResponse) : 'No response');
      
      // Display response on screen and in alert
      const responseString = JSON.stringify(authResponse, null, 2);
      setApiResponse(responseString);
      //Alert.alert('API Response', `Response received: ${responseString.substring(0, 200)}...`);
      
      if (authResponse) {
        // Verify username matches before setting data
        const currentSession = await sessionManager.getCurrentSession();
        if (currentSession?.username !== username) {
          console.warn('[HomeScreen] Username changed during API call, skipping data set');
          return;
        }
        
        // Update username ref and state
        lastUsernameRef.current = username;
        setCurrentUsername(username);
        
        console.log('[HomeScreen] Setting authData for user:', username);
        setAuthData(authResponse);
        
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
        console.warn('[HomeScreen] No auth response received');
      }
      // Menu settings load via hook; force refresh to get latest from server
      try {
        console.log('[HomeScreen] Force refreshing menu after login...');
        await forceRefreshMenu();
        const latestMenu = await menuService.get();
          // console.log('🔍 [HomeScreen] Menu after refresh:', {
          //   isArray: Array.isArray(latestMenu),
          //   length: Array.isArray(latestMenu) ? latestMenu.length : 'N/A',
          //   items: Array.isArray(latestMenu) ? latestMenu.map((m: any) => ({
          //     label: m?.menu_label,
          //     type: m?.menu_api_type,
          //     status: m?.status,
          //   })) : latestMenu,
          // });
      } catch (e: any) {
        console.warn('[HomeScreen] Menu refresh failed:', e?.message || e);
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
      console.log('[HomeScreen] User not authenticated, skipping data fetch');
      return;
    }
    
    // Fetch data normally - don't clear state here, let fetchAccountData handle it
    console.log('[HomeScreen] Starting data fetch...');
    fetchAccountData();
    
    // Initialize push registration similar to old app behavior
    (async () => {
      try {
        const realm = getClientConfig().clientId;
        console.log('[HomeScreen] Initializing push notifications for realm:', realm);
        await initializePushNotifications(realm);
        
        // Add delay for iOS to ensure FCM token is ready
        if (Platform.OS === 'ios') {
          console.log('[HomeScreen] iOS detected, adding delay for FCM token...');
          await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay
        }
        
        console.log('[HomeScreen] Trying pending token registration');
        await registerPendingPushToken(realm);
        console.log('[HomeScreen] Trying manual device registration');
        await registerDeviceManually(realm);
        
      } catch (e) {
        console.warn('[HomeScreen] Push initialization/registration error', (e as any)?.message || e);
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
          setPlanDetails(null);
          setApiResponse('');
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
          (authData && lastUsernameRef.current !== currentUsername); // We have data but username doesn't match
        
        if (shouldClear && currentUsername) {
          console.log('[HomeScreen] 🚨 FOCUS: Clearing state - Username check');
          console.log('[HomeScreen] Previous:', lastUsernameRef.current, 'Current:', currentUsername);
          console.log('[HomeScreen] Has authData:', !!authData);
          
          // Clear state immediately
          setAuthData(null);
          setPlanDetails(null);
          setApiResponse('');
          setBanners([]);
          setIsLoading(true);
          
          // Clear caches
          await dataCache.clearAllCache();
          menuService.clearCache();
          
          // Update username ref and state
          lastUsernameRef.current = currentUsername;
          setCurrentUsername(currentUsername);
          
          // Fetch fresh data
          console.log('[HomeScreen] Fetching fresh data after focus...');
          await fetchAccountData();
        } else if (currentUsername && !authData && lastUsernameRef.current === currentUsername) {
          // Username matches but no data - fetch it
          console.log('[HomeScreen] Username matches but no data, fetching...');
          setCurrentUsername(currentUsername);
          await fetchAccountData();
        } else if (currentUsername) {
          // Update current username state even if not clearing
          setCurrentUsername(currentUsername);
        }
      };
      
      clearOnFocus();
    }, [isAuthenticated, fetchAccountData, authData])
  );

  const handleAdPress = (ad: any) => {
    //Alert.alert('Advertisement', `Opening ${ad.title}...`);
  };

  // Replace static advertisements with banners
  // const advertisements = [
  //   {
  //     id: '1',
  //     image: require('../assets/1st-slide-desk.webp'),
  //     // title: 'First time in GOA',
  //     // subtitle: 'Experience blazing fast connectivity',
  //     backgroundColor: 'rgba(26, 115, 232, 0.8)',
  //   },
  //   {
  //     id: '2',
  //     image: require('../assets/DNA3.jpg'),
  //     // title: 'Advanced Technology',
  //     // subtitle: 'Cutting-edge network solutions',
  //     backgroundColor: 'rgba(220, 53, 69, 0.8)',
  //   },
  //   {
  //     id: '3',
  //     image: require('../assets/Group-60974.webp'),
  //     // title: 'Premium Service',
  //     // subtitle: 'Unmatched quality and reliability',
  //     backgroundColor: 'rgba(40, 167, 69, 0.8)',
  //   },
  // ];

  // Adjust renderAdItem to use banner data
  const renderAdItem = ({item}: {item: any}) => (
    <TouchableOpacity
      style={styles.adCard}
      onPress={() => {
        if (item.target_url) {
          Linking.openURL(item.target_url);
        }
      }}
      activeOpacity={0.8}
      disabled={!item.target_url}
    >
      <View style={styles.adImageContainer}>
        <Image
          source={{ uri: encodeURI(item.banner_full_path) }}
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

  // Auto-scroll functionality
  useEffect(() => {
    const interval = setInterval(() => {
      if (flatListRef.current) {
        const nextIndex = (currentAdIndexRef.current + 1) % banners.length;
        flatListRef.current.scrollToIndex({
          index: nextIndex,
          animated: true,
        });
        currentAdIndexRef.current = nextIndex;
        setCurrentAdIndex(nextIndex);
      }
    }, 3000); // Change every 3 seconds

    return () => clearInterval(interval);
  }, [banners.length]); // Empty dependency array to prevent infinite re-renders

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

  const handleProfilePress = () => {
    setShowProfileMenu(!showProfileMenu);
  };

  const handleMoreOptions = () => {
    setShowProfileMenu(false);
    navigation.navigate('MoreOptions');
  };

  const handleContactUs = () => {
    setShowProfileMenu(false);
    navigation.navigate('ContactUs');
  };

  const handleLogout = async () => {
    setShowProfileMenu(false);
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
            console.error('Logout error:', error);
            // Even if logout fails, navigate to login
            navigation.navigate('Login');
          }
        }
      }
    ]);
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
      console.error('🧪 Token regeneration test failed:', error.message || error);
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
      console.error('🧪 Auto data reloader test failed:', error.message || error);
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
      console.error('🧪 Real scenario test failed:', error.message || error);
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

  // Loading spinner component
  const LoadingSpinner = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={[styles.loadingText, {color: colors.textSecondary}]}>Loading account data...</Text>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, {backgroundColor: colors.background}]}>
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
          rightComponent={(
            <TouchableOpacity 
              style={[styles.profileButton, {backgroundColor: colors.accent}]}
              onPress={handleProfilePress}
            >
              <Text style={styles.profileText}>
                {authData ? `${authData.first_name?.[0] || ''}${authData.last_name?.[0] || ''}` : 'CB'}
              </Text>
            </TouchableOpacity>
          )}
        />

        

        {/* Profile Dropdown Menu */}
        {showProfileMenu && (
          <View style={[styles.profileMenu, {backgroundColor: colors.card, shadowColor: colors.shadow}]}>
            <TouchableOpacity 
              style={[styles.menuItem, {backgroundColor: 'transparent'}]} 
              onPress={handleMoreOptions}
              activeOpacity={0.7}>
              <Text style={[styles.menuIcon, {color: colors.textSecondary}]}>⋮</Text>
              <Text style={[styles.menuText, {color: colors.text}]}>More Options</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.menuItem, {backgroundColor: 'transparent'}]} 
              onPress={handleContactUs}
              activeOpacity={0.7}>
              <Text style={[styles.menuIcon, {color: colors.textSecondary}]}>📞</Text>
              <Text style={[styles.menuText, {color: colors.text}]}>{t('common.contactUs')}</Text>
            </TouchableOpacity>
            {/* Test buttons - commented out for production
            <TouchableOpacity 
              style={[styles.menuItem, {backgroundColor: 'transparent'}]} 
              onPress={handleTestTokenRegeneration}
              activeOpacity={0.7}>
              <Text style={[styles.menuIcon, {color: colors.textSecondary}]}>🧪</Text>
              <Text style={[styles.menuText, {color: colors.text}]}>Test Token Regeneration</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.menuItem, {backgroundColor: 'transparent'}]} 
              onPress={handleTestAutoDataReloader}
              activeOpacity={0.7}>
              <Text style={[styles.menuIcon, {color: colors.textSecondary}]}>🔄</Text>
              <Text style={[styles.menuText, {color: colors.text}]}>Test Auto Data Reloader</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.menuItem, {backgroundColor: 'transparent'}]} 
              onPress={handleTestRealScenario}
              activeOpacity={0.7}>
              <Text style={[styles.menuIcon, {color: colors.textSecondary}]}>🎯</Text>
              <Text style={[styles.menuText, {color: colors.text}]}>Test Real Scenario</Text>
            </TouchableOpacity>
            */}
            {/* <TouchableOpacity 
              style={[styles.menuItem, {backgroundColor: 'transparent'}]} 
              onPress={() => {
                setShowProfileMenu(false);
                navigation.navigate('NotificationTest');
              }}
              activeOpacity={0.7}>
              <Text style={[styles.menuIcon, {color: colors.textSecondary}]}>🔔</Text>
              <Text style={[styles.menuText, {color: colors.text}]}>Test Notifications</Text>
            </TouchableOpacity> */}
            {/* <TouchableOpacity 
              style={[styles.menuItem, {backgroundColor: 'transparent'}]} 
              onPress={async () => {
                setShowProfileMenu(false);
                await debugVersionCheck();
              }}
              activeOpacity={0.7}>
              <Text style={[styles.menuIcon, {color: colors.textSecondary}]}>🔍</Text>
              <Text style={[styles.menuText, {color: colors.text}]}>Debug Version Check</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.menuItem, {backgroundColor: 'transparent'}]} 
              onPress={async () => {
                setShowProfileMenu(false);
                await quickVersionTest();
              }}
              activeOpacity={0.7}>
              <Text style={[styles.menuIcon, {color: colors.textSecondary}]}>⚡</Text>
              <Text style={[styles.menuText, {color: colors.text}]}>Quick Version Test</Text>
            </TouchableOpacity> */}
            {/* <TouchableOpacity 
              style={[styles.menuItem, {backgroundColor: 'transparent'}]} 
              onPress={async () => {
                setShowProfileMenu(false);
                await debugFCMTokenIssues();
              }}
              activeOpacity={0.7}>
              <Text style={[styles.menuIcon, {color: colors.textSecondary}]}>🔥</Text>
              <Text style={[styles.menuText, {color: colors.text}]}>Debug FCM Token</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.menuItem, {backgroundColor: 'transparent'}]} 
              onPress={async () => {
                setShowProfileMenu(false);
                const token = await forceFCMTokenGeneration();
                Alert.alert('FCM Token', token ? `Token: ${token.substring(0, 20)}...` : 'No token generated');
              }}
              activeOpacity={0.7}>
              <Text style={[styles.menuIcon, {color: colors.textSecondary}]}>🔄</Text>
              <Text style={[styles.menuText, {color: colors.text}]}>Force FCM Token</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.menuItem, {backgroundColor: 'transparent'}]} 
              onPress={async () => {
                setShowProfileMenu(false);
                const results = await runComprehensiveFirebaseTest();
                const status = results.overall ? '✅ All tests passed!' : '❌ Some tests failed';
                Alert.alert('Firebase Test Results', status);
              }}
              activeOpacity={0.7}>
              <Text style={[styles.menuIcon, {color: colors.textSecondary}]}>🧪</Text>
              <Text style={[styles.menuText, {color: colors.text}]}>Firebase Test</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.menuItem, {backgroundColor: 'transparent'}]} 
              onPress={async () => {
                setShowProfileMenu(false);
                const realm = getClientConfig().clientId;
                const success = await updateDeviceWithRealFCMToken(realm);
                Alert.alert('Update FCM Token', success ? '✅ Device updated with real FCM token!' : '❌ No real FCM token available');
              }}
              activeOpacity={0.7}>
              <Text style={[styles.menuIcon, {color: colors.textSecondary}]}>🔄</Text>
              <Text style={[styles.menuText, {color: colors.text}]}>Update FCM Token</Text>
            </TouchableOpacity> */}
            <TouchableOpacity 
              style={[styles.menuItem, {backgroundColor: 'transparent'}]} 
              onPress={handleLogout}
              activeOpacity={0.7}>
              <Text style={[styles.menuIcon, {color: colors.textSecondary}]}>🚪</Text>
              <Text style={[styles.menuText, {color: colors.text}]}>{t('common.logout')}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Welcome Message */}
        <View style={styles.welcomeSection}>
          <Text style={[styles.welcomeText, {color: colors.textSecondary}]}>{t('common.welcome')},</Text>
          <Text style={[styles.userName, {color: colors.text}]}>
            {authData && currentUsername && lastUsernameRef.current === currentUsername 
              ? `${authData.first_name || ''} ${authData.last_name || ''}`.trim() || 'User' 
              : 'User'}
          </Text>
        </View>

        {/* Account Summary Card */}
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
          ) : !authData || (currentUsername && lastUsernameRef.current !== currentUsername) ? (
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
                    {authData?.current_plan || 'No Plan'}
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
                <Text style={[styles.detailValue, {color: authData?.user_status === 'active' ? '#4CAF50' : '#F44336'}]}>
                  {authData?.user_status?.replace(/_+/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) || 'Active'}
                </Text>
              </View>

              {/* Login Status */}
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, {color: colors.textSecondary}]}>Login Status</Text>
                <Text style={[styles.detailValue, {color: authData?.login_status === 'IN' ? '#4CAF50' : '#F44336'}]}>
                  {authData?.login_status === 'IN' ? 'Online' : 'Offline'}
                </Text>
              </View>
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
                  {item.iconType === 'feather' ? (
                    <Feather name={item.icon} size={24} color={colors.primary} />
                  ) : (
                    <Text style={styles.quickMenuRowIcon}>{item.icon}</Text>
                  )}
                  <Text style={[styles.quickMenuRowTitle, {color: colors.text}]}>{item.label}</Text>
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
                  <Text style={styles.iconText}>💳</Text>
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
                  <Text style={styles.iconText}>🆘</Text>
                </View>
                <Text style={[styles.actionTitle, {color: colors.text}]}>{t('home.support')}</Text>
                <Text style={[styles.actionSubtitle, {color: colors.textSecondary}]}>Get help</Text>
              </TouchableOpacity>
            )}



            <TouchableOpacity 
              style={[styles.actionCard, {backgroundColor: colors.card, shadowColor: colors.shadow}]} 
              onPress={() => navigation.navigate('ContactUs')}>
              <View style={[styles.actionIcon, {backgroundColor: colors.primaryLight}]}>
                <Text style={styles.iconText}>📞</Text>
              </View>
              <Text style={[styles.actionTitle, {color: colors.text}]}>{t('common.contactUs')}</Text>
              <Text style={[styles.actionSubtitle, {color: colors.textSecondary}]}>Reach out</Text>
            </TouchableOpacity>
          </View>
        </View>
        )}

        {/* Bill Information */}
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
                <View style={styles.billRow}>
                  <Text style={[styles.billLabel, {color: colors.textSecondary}]}>Payment Dues</Text>
                  <Text style={[styles.billAmount, {color: authData?.payment_dues > 0 ? '#F44336' : '#4CAF50'}]}>
                    ₹{authData?.payment_dues || 0}
                  </Text>
                </View>
              </View>
              {/* Only show Pay Now button if there are payment dues */}
              {authData?.payment_dues > 0 && (
                <TouchableOpacity 
                  style={[styles.payNowButton, {backgroundColor: colors.primary}]} 
                  onPress={handlePayBill}>
                  <Text style={styles.payNowText}>Pay Now</Text>
                </TouchableOpacity>
              )}
            </>
          )}
        </View>

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
        {hasUsageDetails && (
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
                  <Text style={[styles.usageStatIcon, {color: colors.primary}]}>⏱️</Text>
                  <Text style={[styles.usageStatLabel, {color: colors.textSecondary}]}>Hours Used</Text>
                  <Text style={[styles.usageStatValue, {color: colors.text}]}>
                    {authData?.usage_details[0]?.hours_used || '0:00:00'}
                  </Text>
                </View>
                
                <View style={styles.usageStat}>
                  <Text style={[styles.usageStatIcon, {color: colors.success}]}>📅</Text>
                  <Text style={[styles.usageStatLabel, {color: colors.textSecondary}]}>Days Remaining</Text>
                  <Text style={[styles.usageStatValue, {color: colors.text}]}>
                    {daysRemainingText}
                  </Text>
                </View>
                
                {authData?.usage_details?.[0]?.plan_data !== 'Unlimited' && (
                  <View style={styles.usageStat}>
                    <Text style={[styles.usageStatIcon, {color: colors.accent}]}>📊</Text>
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
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
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
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
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
  usageStatIcon: {
    fontSize: 24,
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