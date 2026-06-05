import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Dimensions,
  Animated,
  Easing,
  Image,
  Linking,
  BackHandler,
  Modal,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LogoImage from '../components/LogoImage';
import {useTheme} from '../utils/ThemeContext';
import {getThemeColors} from '../utils/themeStyles';
import { useAuth } from '../utils/AuthContext';
import DeviceInfo from 'react-native-device-info';
import {apiService} from '../services/api';
import sessionManager from '../services/sessionManager';
import { useLanguage } from '../utils/LanguageContext';
import { useTranslation } from 'react-i18next';
import { getClientStrings } from '../config/client-config';
import { credentialStorage } from '../services/credentialStorage';
import { pinStorage } from '../services/pinStorage';
import biometricAuthService from '../services/biometricAuth';
import { ensureDeviceRegistrationAfterLogin } from '../services/notificationService';
import { getClientConfig } from '../config/client-config';
import { shouldShowOtpLoginLink } from '../config/login-ui-config';
import { getCustomApi } from '../config/customApiStorage';
import { getWebsite } from '../config';
import menuService from '../services/menuService';
import Feather from 'react-native-vector-icons/Feather';
import LeftBorderLine from '../components/LeftBorderLine';

const {width, height} = Dimensions.get('window');

const LoginScreen = ({navigation, disableSessionCheck = false}: any) => {
  const {isDark} = useTheme();
  const colors = getThemeColors(isDark);
  const { currentLanguage, changeLanguage, availableLanguages } = useLanguage();
  const { t } = useTranslation();
  const { login, loginWithOtp } = useAuth();
  const clientStrings = getClientStrings();
  const clientId = getClientConfig().clientId;
  const showOtpLoginLink = shouldShowOtpLoginLink(clientId);

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-50)).current;
  
  // State management
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [ispDetailsDebug, setIspDetailsDebug] = useState<any | null>(null);
  const [ispDetailsUrl, setIspDetailsUrl] = useState<string | null>(null);
  const [ispDetailsError, setIspDetailsError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);
  const [loginMode, setLoginMode] = useState<'password' | 'otp'>('password');
  const [otpTargetPhone, setOtpTargetPhone] = useState<string | null>(null);
  const [otpSent, setOtpSent] = useState(false); // Track if OTP has been sent
  const [otpResponseUsername, setOtpResponseUsername] = useState<string | null>(null); // Username from send OTP response, used when submitting OTP
  // By default, enable both password and OTP login for all clients
  const [allowPasswordLogin, setAllowPasswordLogin] = useState<boolean>(true);
  const [allowOtpLogin, setAllowOtpLogin] = useState<boolean>(true);
  // UI settings from isp_details.json
  const [showLanguageSwitcher, setShowLanguageSwitcher] = useState<boolean>(true);
  const [ispWebsite, setIspWebsite] = useState<string | null>(null);
  const [ispCompanyName, setIspCompanyName] = useState<string | null>(null);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showDomainMenu, setShowDomainMenu] = useState(false);
  
  // Validation states
  const [usernameError, setUsernameError] = useState(false);
  const [passwordError, setPasswordError] = useState(false);
  const [otpError, setOtpError] = useState(false);
  
  // Auth flow states
  const [authType, setAuthType] = useState<'none' | 'password' | 'otp' | 'both'>('none');
  const [showPasswordInput, setShowPasswordInput] = useState(false);
  const [showOtpSection, setShowOtpSection] = useState(false);
  const [currentStep, setCurrentStep] = useState<'username' | 'auth' | 'both'>('username');
  // Remember me for password login – default ON so token regeneration works as before
  const [rememberMe, setRememberMe] = useState(true);

  // Effective website URL
  // For Microscan, ALWAYS use the new official site (ignore old values from isp_details.json)
  // For Inshansa (dna-goa), ALWAYS use https://dnagoa.com (ignore old values from isp_details.json)
  // For Skynetwifi, ALWAYS use client-config website (ignore stale desktop/website from isp_details.json)
  // For other clients, prefer isp_details.json, fallback to static config
  const effectiveWebsiteUrl = (() => {
    const clientId = getClientConfig().clientId;
    if (clientId === 'microscan') {
      return 'https://www.microscaninternet.com/';
    }
    if (clientId === 'inshansa-dnagoa') {
      return 'https://dnagoa.com/';
    }
    if (clientId === 'skynetwifi') {
      const w = getWebsite().trim();
      if (!w) {
        return null;
      }
      return w.startsWith('http://') || w.startsWith('https://') ? w : `https://${w}`;
    }

    const url = ispWebsite || getWebsite();
    // Return null if empty, null, undefined, or doesn't look like a URL
    if (!url || typeof url !== 'string' || url.trim() === '') {
      return null;
    }
    let trimmed = url.trim();
    // If URL doesn't start with http:// or https://, add https://
    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
      trimmed = 'https://' + trimmed;
    }
    return trimmed;
  })();

  // Normalize any backend-provided branding so we consistently match
  // the exact client naming requested.
  const normalizeCompanyName = (rawCompanyName: string) => {
    const clientId = getClientConfig().clientId;
    const name = rawCompanyName.trim();
    if (clientId === 'skynetwifi') {
      // Covers: "Skynet WiFi", "Skynet Wi-Fi", "Skynet  Wi   Fi", etc.
      if (/skynet\s*wi\s*-?\s*fi/i.test(name)) return 'Skynetwifi';
    }
    return name;
  };

  const effectiveCompanyName = (() => {
    if (ispCompanyName && ispCompanyName.trim().length > 0) {
      return ispCompanyName.trim();
    }
    return clientStrings.companyName;
  })();

  // Check for existing session on component mount
  useEffect(() => {
    checkExistingSession();
  }, []);

  useEffect(() => {
    if (!showOtpLoginLink) {
      setLoginMode('password');
    }
  }, [showOtpLoginLink]);

  // Fetch isp_details.json from serverURL/tmp/isp_details.json for the current client
  useEffect(() => {
    const fetchIspDetails = async () => {
      try {
        const cfg = getClientConfig();
        let serverURL = cfg.api?.serverURL;

        if (!serverURL) {
          setIspDetailsError('serverURL is not configured in client-config');
          return;
        }

        // Ensure the URL has a scheme
        if (!serverURL.startsWith('http://') && !serverURL.startsWith('https://')) {
          serverURL = `https://${serverURL}`;
        }

        const url = `${serverURL.replace(/\/+$/, '')}/tmp/isp_details.json`;
        setIspDetailsUrl(url);
        setIspDetailsError(null);

        // Log the exact URL used to download isp_details.json
        console.log('isp_details.json URL:', url);

        // Add headers to match browser request (might help if server returns different content)
        const response = await fetch(url, {
          headers: {
            'Accept': 'application/json',
            'Cache-Control': 'no-cache',
          },
        });
        const statusInfo = `status ${response.status} ${response.statusText || ''}`.trim();

        if (!response.ok) {
          setIspDetailsError(`Failed to load isp_details.json (${statusInfo})`);
          return;
        }

        // Simple and direct: fetch → json → use res.data[0] (exactly as user requested)
        // First get raw text to verify what server actually sent
        const rawText = await response.text();
        console.log('=== RAW RESPONSE TEXT (checking for user_app_settings) ===');
        console.log('Contains "user_app_settings"?', rawText.includes('user_app_settings'));
        console.log('Raw text length:', rawText.length);
        console.log('Last 500 chars of raw text:', rawText.substring(Math.max(0, rawText.length - 500)));
        console.log('=== END RAW RESPONSE CHECK ===');
        
        // Now parse JSON
        const json = JSON.parse(rawText);
        setIspDetailsDebug(json);

        console.log('=== ISP DETAILS JSON FETCH ===');
        console.log('Full JSON response:', JSON.stringify(json, null, 2));
        console.log('json.data exists?', !!json?.data);
        console.log('json.data is array?', Array.isArray(json?.data));
        console.log('json.data length:', json?.data?.length);

        const dataArray = Array.isArray(json?.data) ? json.data : [];
        const clientData = dataArray[0];

        console.log('clientData exists?', !!clientData);
        console.log('clientData keys:', clientData ? Object.keys(clientData) : 'N/A');
        console.log('ALL clientData keys (full list):', clientData ? Object.keys(clientData).join(', ') : 'N/A');
        console.log('Looking for user_app_settings in keys:', clientData ? Object.keys(clientData).includes('user_app_settings') : false);
        console.log('clientData.user_app_settings exists?', !!clientData?.user_app_settings);
        console.log('clientData.user_app_settings:', JSON.stringify(clientData?.user_app_settings, null, 2));
        console.log('Full clientData object:', JSON.stringify(clientData, null, 2));

        let userAppSettings = clientData?.user_app_settings;
        let authMethods = userAppSettings?.auth_methods;
        
        // FALLBACK: If user_app_settings is missing from parsed JSON but exists in raw text,
        // try to extract it manually from raw text
        if (!userAppSettings && rawText.includes('user_app_settings')) {
          console.log('⚠️ user_app_settings missing from parsed JSON but found in raw text - attempting manual extraction');
          try {
            // Try to find and parse just the user_app_settings part
            const settingsMatch = rawText.match(/"user_app_settings"\s*:\s*({[^}]*"auth_methods"[^}]*})/);
            if (settingsMatch && settingsMatch[1]) {
              const extractedSettings = JSON.parse(settingsMatch[1]);
              userAppSettings = extractedSettings;
              authMethods = extractedSettings?.auth_methods;
              console.log('✅ Successfully extracted user_app_settings from raw text:', userAppSettings);
            }
          } catch (extractError) {
            console.log('❌ Failed to extract user_app_settings from raw text:', extractError);
          }
        }
        
        console.log('authMethods exists?', !!authMethods);
        console.log('authMethods:', JSON.stringify(authMethods, null, 2));
        console.log('colour_mode_option:', JSON.stringify(userAppSettings?.colour_mode_option, null, 2));
        console.log('language settings:', JSON.stringify(userAppSettings?.language, null, 2));
        console.log('website from isp_details.json:', clientData?.website);
        console.log('=== END ISP DETAILS JSON FETCH ===');

        // Default: Enable both password and OTP login for ALL clients
        // Server config can only DISABLE methods, not enable them (both are enabled by default)
        let pwdFlag = true;   // default: password allowed for all clients
        let otpFlag = true;   // default: OTP allowed for all clients
        // Defaults for UI options: show language selector if settings are missing
        let languageShowFlag = true;

        // Helper function to check if a value is truthy (handles boolean, string, number)
        const isTruthy = (value: any): boolean => {
          if (value === null || value === undefined) return false;
          if (typeof value === 'boolean') return value;
          if (typeof value === 'number') return value !== 0;
          if (typeof value === 'string') {
            const lower = value.toLowerCase().trim();
            return lower === 'true' || lower === '1' || lower === 'yes';
          }
          return Boolean(value);
        };

        // Only apply server config if auth_methods is explicitly provided
        // Server can only DISABLE methods (set to false), not enable them
        // Both methods are enabled by default for all clients
        if (authMethods) {
          // Only disable password if server explicitly sets it to false
          if ('password' in authMethods) {
            const serverPwdValue = isTruthy(authMethods.password);
            // Only disable if explicitly false, otherwise keep enabled
            if (serverPwdValue === false) {
              pwdFlag = false;
            }
          }
          
          // Only disable OTP if server explicitly sets it to false
          if ('sms_otp' in authMethods) {
            const serverOtpValue = isTruthy(authMethods.sms_otp);
            // Only disable if explicitly false, otherwise keep enabled
            if (serverOtpValue === false) {
              otpFlag = false;
            }
          }
          
          console.log('=== AUTH METHODS PARSING ===');
          console.log('authMethods.password:', authMethods.password, '→ pwdFlag:', pwdFlag);
          console.log('authMethods.sms_otp:', authMethods.sms_otp, '→ otpFlag:', otpFlag);
          console.log('=== END AUTH METHODS PARSING ===');
        } else {
          // No auth_methods in server config - both methods enabled by default
          console.log('=== NO AUTH_METHODS IN SERVER CONFIG, BOTH METHODS ENABLED BY DEFAULT ===');
        }

        // Website URL from isp_details.json (e.g. https://www.microscaninternet.com/)
        if (typeof clientData?.website === 'string' && clientData.website.trim().length > 0) {
          setIspWebsite(clientData.website.trim());
        }

        // Company name and logo from isp_details.json (used especially for log2space-common)
        if (typeof clientData?.company_name === 'string' && clientData.company_name.trim().length > 0) {
          setIspCompanyName(normalizeCompanyName(clientData.company_name));
        }
        if (typeof clientData?.company_logo === 'string' && clientData.company_logo.trim().length > 0) {
          const logoFile = clientData.company_logo.trim();
          const logoBase = serverURL.replace(/\/+$/, '');
          const remoteLogoUrl = `${logoBase}/tmp/upload/${logoFile}`;
          try {
            await AsyncStorage.setItem('log2space_dynamic_logo_url', remoteLogoUrl);
          } catch (_) {}
        }

        // Read optional UI settings for language from user_app_settings
        if (userAppSettings?.language) {
          const rawLangShow = userAppSettings.language.show;
          if (typeof rawLangShow === 'boolean') {
            languageShowFlag = rawLangShow;
          } else if (typeof rawLangShow === 'string') {
            languageShowFlag = rawLangShow.toLowerCase() === 'true';
          }
        }

        const otpAllowedForUi = otpFlag && showOtpLoginLink;

        setAllowPasswordLogin(pwdFlag);
        setAllowOtpLogin(otpAllowedForUi);
        setShowLanguageSwitcher(languageShowFlag);
        
        console.log('=== FINAL LOGIN METHOD FLAGS ===');
        console.log('allowPasswordLogin:', pwdFlag);
        console.log('allowOtpLogin:', otpAllowedForUi);
        console.log('showOtpLoginLink:', showOtpLoginLink);
        console.log('loginMode:', loginMode);
        console.log('=== END FINAL FLAGS ===');

        // Ensure current loginMode is valid based on allowed methods
        setLoginMode(prevMode => {
          if (pwdFlag && otpAllowedForUi) {
            return showOtpLoginLink ? prevMode : 'password';
          }
          if (pwdFlag && !otpAllowedForUi) {
            return 'password';
          }
          if (!pwdFlag && otpAllowedForUi) {
            return 'otp';
          }
          return 'password';
        });
      } catch (error: any) {
        setIspDetailsError(`Error fetching isp_details.json: ${error?.message || 'Unknown error'}`);
      }
    };

    fetchIspDetails();
  }, []);

  // Handle back button on login screen
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      // Prevent going back from login screen
      return true;
    });

    return () => backHandler.remove();
  }, []);

  // Reset auth step if username is cleared
  useEffect(() => {
    if (!username.trim()) {
      setCurrentStep('username');
      setShowPasswordInput(false);
      setShowOtpSection(false);
      setAuthType('none');
      setPassword('');
      setOtp('');
      setOtpSent(false); // Reset OTP sent state when username is cleared
      setOtpResponseUsername(null);
      setUsernameError(false);
      setPasswordError(false);
      setOtpError(false);
    }
  }, [username]);

  const checkExistingSession = async () => {
    try {
      // Check if session check should be disabled
      const disableCheck = await AsyncStorage.getItem('disableSessionCheck');
      if (disableCheck === 'true' || disableSessionCheck) {
        // console.log('Session check disabled, allowing login screen to show');
        // Clear the flag after using it
        await AsyncStorage.removeItem('disableSessionCheck');
        return;
      }
      
      const isLoggedIn = await sessionManager.isLoggedIn();
      if (isLoggedIn) {
        // console.log('User is already logged in, navigating to Home');
        navigation.navigate('Home');
      }
    } catch (error) {
      // console.error('Error checking session:', error);
    }
  };

  // Animation effects
  useEffect(() => {
    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();

    // Slide up animation
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 800,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, []);

  // Countdown timer for resend button
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (resendCountdown > 0) {
      interval = setInterval(() => {
        setResendCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [resendCountdown]);

  const checkAuthType = async () => {
    if (!username || username.trim() === '') {
      setUsernameError(true);
      Alert.alert('Error', 'Please enter your username');
      return;
    }
    
    setUsernameError(false);

    setIsLoading(true);
    
    try {
      // console.log('=== CHECKING AUTH TYPE ===');
      // console.log('Username:', username);
      
      // Call API to check auth type
      const response = await apiService.checkAuthType(username.trim());
      
      // console.log('=== AUTH TYPE RESPONSE ===');
      // console.log('Response:', response);
      
      if (response && response.auth_type) {
        const authTypeValue = response.auth_type.toLowerCase() as 'password' | 'otp' | 'both';
        setAuthType(authTypeValue);

        if (authTypeValue === 'password') {
          setShowPasswordInput(true);
          setCurrentStep('auth');
        } else if (authTypeValue === 'otp') {
          setShowOtpSection(true);
          setCurrentStep('auth');
          // Send OTP automatically
          await sendOtp();
        }
      } else {
        // Fallback: show both options if we can't determine auth type
        setAuthType('password');
      }

      // Always show both login options so user can choose password or OTP
      setShowPasswordInput(false);
      setShowOtpSection(false);
      setCurrentStep('both');
    } catch (error: any) {
      // console.error('=== AUTH TYPE CHECK ERROR ===');
      // console.error('Error:', error);
      
      // If we get token expired error, show both options
      if (error.message && error.message.includes('Token Expired')) {
        Alert.alert('Info', 'Please choose your login method');
      } else {
        Alert.alert('Error', error.message || 'Failed to check authentication type. Please try again.');
      }
      // On error, still allow user to pick their preferred login method
      setAuthType('password');
      setShowPasswordInput(false);
      setShowOtpSection(false);
      setCurrentStep('both');
    } finally {
      setIsLoading(false);
    }
  };

  const sendOtp = async () => {
    if (!username || username.trim() === '') {
      setUsernameError(true);
      Alert.alert('Error', 'Please enter your username');
      return;
    }
    
    setUsernameError(false);
    
    setIsLoading(true);
    
    try {
      // Send OTP with required flags for user app flow; pass same username as phone_no for OTP flow
      const trimmedUsername = username.trim().toLowerCase();
      const response = await apiService.authenticate(
        username,       // username
        '',             // password
        '',             // otp (none for send)
        'no',           // resend_otp
        trimmedUsername, // phone_no: same as username for OTP login
        'otp',          // auth_type
      );
      
      console.log('=== OTP SEND RESPONSE ===');
      console.log('Response:', JSON.stringify(response, null, 2));
      console.log('Response type:', typeof response);
      console.log('Response.message:', (response as any)?.message);
      console.log('Response.status:', (response as any)?.status);
      console.log('Response.token:', (response as any)?.token);
      console.log('Response.masked_mobile:', (response as any)?.masked_mobile);
      
      // Check if OTP was sent successfully - prefer message/auth_type checks
      const otpSentSuccess =
        !!response &&
        (
          (response as any).message?.toLowerCase().includes('otp send') ||
          (response as any).status === 'ok' ||
          (response as any).auth_type === 'otp'
        );

      if (otpSentSuccess) {
        console.log('✅ OTP send successful - setting otpSent to true');

        // Store username from response for use when submitting OTP (verify/login)
        const usernameFromResponse =
          (response as any)?.username ||
          (response as any)?.data?.username;
        if (usernameFromResponse && typeof usernameFromResponse === 'string') {
          setOtpResponseUsername(usernameFromResponse.trim());
        } else {
          setOtpResponseUsername(null);
        }

        // Prefer masked_mobile from response; fall back to previous masking logic if missing
        const maskedFromResponse =
          (response as any)?.masked_mobile ||
          (response as any)?.data?.masked_mobile;

        const rawPhone =
          maskedFromResponse ||
          (response as any)?.data?.phone_no ||
          (response as any)?.data?.phone ||
          (response as any)?.phone_no ||
          (response as any)?.phone;

        if (rawPhone) {
          // If API already returns masked mobile, use it directly; otherwise mask last 4 digits
          if (String(rawPhone).includes('*')) {
            setOtpTargetPhone(String(rawPhone));
          } else {
            const digits = String(rawPhone).replace(/\D/g, '');
            if (digits.length >= 4) {
              const last4 = digits.slice(-4);
              const masked = `XXXXXX${last4}`;
              setOtpTargetPhone(masked);
            } else {
              setOtpTargetPhone(null);
            }
          }
        } else {
          setOtpTargetPhone(null);
        }

        setResendCountdown(30); // Start 30 second countdown
        setOtpSent(true); // Mark OTP as sent so we show OTP input field
        Alert.alert('Success', 'OTP sent to your registered number');
      } else {
        console.log('❌ OTP send failed - response does not match success conditions');
        console.log('Response keys:', response ? Object.keys(response) : 'No response');
        Alert.alert('Error', 'Failed to send OTP. Please try again.');
      }
    } catch (error: any) {
      console.error('=== OTP SEND ERROR ===');
      console.error('Error:', error);
      console.error('Error message:', error?.message);
      console.error('Error stack:', error?.stack);
      Alert.alert('Error', error.message || 'Failed to send OTP');
      setOtpTargetPhone(null);
      setOtpResponseUsername(null);
      // Don't set otpSent to true on error - user should retry with "Send OTP" button
    } finally {
      setIsLoading(false);
    }
  };

  const validateForm = () => {
    let isValid = true;
    
    // Validate username
    if (!username || username.trim() === '') {
      setUsernameError(true);
      isValid = false;
    } else {
      setUsernameError(false);
    }
    
    // Validate based on current login mode
    if (loginMode === 'password') {
      if (!password || password.trim() === '') {
        setPasswordError(true);
        isValid = false;
      } else {
        setPasswordError(false);
      }
    } else if (loginMode === 'otp') {
      // For OTP mode, OTP must have been sent first
      if (!otpSent) {
        Alert.alert('Info', 'Please click "Send OTP" first');
        isValid = false;
      } else if (!otp || otp.trim() === '') {
        setOtpError(true);
        isValid = false;
      } else {
        setOtpError(false);
      }
    }
    
    return isValid;
  };

  // Handle device registration after successful login
  const handleDeviceRegistration = async () => {
    try {
      // console.log('[LoginScreen] Starting device registration after login...');
      const realm = getClientConfig().clientId;
      const registrationSuccess = await ensureDeviceRegistrationAfterLogin(realm);
      if (!registrationSuccess) {
        // console.warn('[LoginScreen] Device registration flow did not complete');
      } else {
        // console.log('[LoginScreen] Device registration process completed');
      }
    } catch (error) {
      // console.warn('[LoginScreen] Device registration failed:', error);
      // Don't block login flow if device registration fails
    }
  };

  // Fetch and print menu settings after successful login
  const fetchMenuSettings = async () => {
    try {
      //console.log('[LoginScreen] === FETCHING MENU SETTINGS AFTER LOGIN ===');
      const menuData = await menuService.refresh();
      
      // console.log('[LoginScreen] === MENU SETTINGS DATA ===');
      // console.log('[LoginScreen] Menu Settings Type:', typeof menuData);
      // console.log('[LoginScreen] Is Array:', Array.isArray(menuData));
      
      // Safe JSON stringify with error handling
      try {
        const jsonString = JSON.stringify(menuData, null, 2);
        //console.log('[LoginScreen] Full Menu Data:', jsonString);
      } catch (stringifyError) {
        //console.log('[LoginScreen] Could not stringify menu data (may contain circular refs), logging object directly');
        //console.log('[LoginScreen] Menu Data:', menuData);
      }
      
      if (Array.isArray(menuData)) {
        // console.log('[LoginScreen] Menu Items Count:', menuData.length);
        menuData.forEach((item: any, index: number) => {
          try {
            // console.log(`[LoginScreen] Menu Item ${index}:`, {
            //   menu_label: item?.menu_label,
            //   menu_api_type: item?.menu_api_type,
            //   status: item?.status,
            //   display_option_json: item?.display_option_json,
            // });
          } catch (itemError) {
            // console.log(`[LoginScreen] Menu Item ${index}: Error logging item`);
          }
        });
      } else if (menuData && typeof menuData === 'object') {
        try {
          // console.log('[LoginScreen] Menu Data Keys:', Object.keys(menuData));
          // console.log('[LoginScreen] Menu Data:', menuData);
        } catch (objError) {
          // console.log('[LoginScreen] Error logging menu data object');
        }
      }
      
      // console.log('[LoginScreen] === END MENU SETTINGS DATA ===');
      
      return menuData;
    } catch (error: any) {
      // console.error('[LoginScreen] Error fetching menu settings:', error);
      // console.error('[LoginScreen] Error message:', error?.message || 'Unknown error');
      // console.error('[LoginScreen] Error stack:', error?.stack);
      return null;
    }
  };

  // Check if auth settings should be shown based on menu settings
  const shouldShowAuthSetup = async (menuData: any): Promise<boolean> => {
    try {
      if (!menuData) {
        // console.log('[LoginScreen] No menu data, defaulting to show auth setup');
        return true; // Default to showing if no menu data
      }
      
      // Find Settings menu item
      let settingsItem = null;
      try {
        if (Array.isArray(menuData)) {
          settingsItem = menuData.find((item: any) => {
            try {
              const label = String(item?.menu_label || '').trim().toLowerCase();
              const status = String(item?.status || '').toLowerCase();
              return label === 'settings' && status === 'active';
            } catch (findError) {
              return false;
            }
          });
        }
      } catch (findError) {
        // console.error('[LoginScreen] Error finding settings item:', findError);
      }
      
      if (!settingsItem) {
        // console.log('[LoginScreen] Settings menu item not found, defaulting to show auth setup');
        return true; // Default to showing if settings not found
      }
      
      // Parse display_option_json safely
      let parsed: any = {};
      try {
        const jsonVal = settingsItem.display_option_json;
        if (typeof jsonVal === 'string') {
          const trimmed = jsonVal.trim();
          if (trimmed && (trimmed.startsWith('{') || trimmed.startsWith('['))) {
            parsed = JSON.parse(trimmed);
          }
        } else if (jsonVal && typeof jsonVal === 'object') {
          parsed = jsonVal;
        }
      } catch (parseError) {
        // console.error('[LoginScreen] Error parsing display_option_json:', parseError);
        return true; // Default to showing on parse error
      }
      
      // Check auth_settings.show
      const authSettings = parsed?.app_settings?.auth_settings || parsed?.settings?.auth_settings;
      const showAuthSettings = authSettings?.show;
      
      // console.log('[LoginScreen] Auth Settings Config:', {
      //   show: showAuthSettings,
      //   hasAuthSettings: !!authSettings
      // });
      
      // If show is explicitly false, don't show auth setup
      if (showAuthSettings === false) {
        // console.log('[LoginScreen] auth_settings.show is false, skipping AuthSetupScreen');
        return false;
      }
      
      // Default to showing auth setup
      return true;
    } catch (error: any) {
      // console.error('[LoginScreen] Error checking auth settings:', error);
      // console.error('[LoginScreen] Error message:', error?.message || 'Unknown error');
      // console.error('[LoginScreen] Error stack:', error?.stack);
      return true; // Default to showing on error
    }
  };

  const handleLogin = async () => {
    // Validate form before proceeding
    if (!validateForm()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }
    
    setIsLoading(true);
    
    try {
      if (loginMode === 'password') {
        const result = await login(username, password);
        
        if (result.success) {
          try {
            if (result.consentRequired) {
              navigation.replace('CustomerConsent');
              setTimeout(() => {
                try {
                  Alert.alert('Success', 'Login successful!');
                } catch {
                  // ignore
                }
              }, 100);
              return;
            }
            // Save or clear credentials for session regeneration (non-blocking) based on rememberMe
            if (rememberMe) {
              credentialStorage.saveCredentials(username, password).catch(err => {
                console.warn('[LoginScreen] Failed to save credentials:', err);
              });
            } else {
              credentialStorage.clearCredentials().catch(err => {
                console.warn('[LoginScreen] Failed to clear credentials:', err);
              });
            }
            
            // Device registration is already handled in AuthContext.login()
            // No need to call it again here - it would be duplicate and slow
            
            // Try to fetch menu settings with a timeout (1.5 seconds max wait)
            // This allows us to check auth_settings.show if available quickly
            let menuData = null;
            let showAuthSetup = true; // Default to showing auth setup
            
            try {
              const menuPromise = fetchMenuSettings();
              const timeoutPromise = new Promise((resolve) => setTimeout(() => resolve(null), 1500));
              menuData = await Promise.race([menuPromise, timeoutPromise]) as any;
              
              if (menuData) {
                // Menu settings fetched quickly, check if auth setup should be shown
                showAuthSetup = await shouldShowAuthSetup(menuData);
              }
            } catch (menuError) {
              console.warn('[LoginScreen] Error fetching menu settings (using fallback):', menuError);
              // Continue with default behavior if menu fetch fails
            }
            
            // If auth_settings.show is false, go directly to home
            if (!showAuthSetup) {
              // Only set biometric flag if biometric is enabled for client
              const clientConfig = getClientConfig();
              if (clientConfig.features?.biometricAuth === true) {
                await AsyncStorage.setItem('showBiometricAfterLogin', 'true');
              }
              navigation.replace('Home');
            } else {
              // Check if user has set up any authentication (quick local check)
              try {
                const clientConfig = getClientConfig();
                const useBiometric = clientConfig.features?.biometricAuth === true;
                const pin = useBiometric ? await pinStorage.getPin() : null;
                const biometricEnabled = useBiometric ? await biometricAuthService.isAuthEnabled() : false;

                if (useBiometric && !pin && !biometricEnabled) {
                  navigation.replace('AuthSetupScreen');
                } else {
                  if (useBiometric) {
                    await AsyncStorage.setItem('showBiometricAfterLogin', 'true');
                  }
                  navigation.replace('Home');
                }
              } catch (navErr) {
                console.warn('[LoginScreen] Post-login nav check failed, going to Home:', (navErr as Error)?.message);
                navigation.replace('Home');
              }
            }

            setTimeout(() => {
              try {
                Alert.alert('Success', 'Login successful!');
              } catch {
                // ignore
              }
            }, 100);
          } catch (navErr) {
            console.warn('[LoginScreen] Navigation after login failed:', (navErr as Error)?.message);
            navigation.replace('Home');
            Alert.alert('Success', 'Login successful!');
          }
        } else {
          const errorMessage = result.error || 'Login failed. Please check your credentials.';
          Alert.alert('Login Failed', errorMessage);
        }
      } else {
        // OTP login: use username from send OTP response if available, else textbox username
        const usernameForVerify = otpResponseUsername || username.trim();
        const result = await loginWithOtp(usernameForVerify, otp);
        
        if (result.success) {
          try {
            if (result.consentRequired) {
              navigation.replace('CustomerConsent');
              setTimeout(() => {
                try {
                  Alert.alert('Success', 'Login successful!');
                } catch {
                  // ignore
                }
              }, 100);
              return;
            }
            // Device registration is already handled in AuthContext.loginWithOtp()
            // No need to call it again here - it would be duplicate and slow
            
            // Try to fetch menu settings with a timeout (1.5 seconds max wait)
            // This allows us to check auth_settings.show if available quickly
            let menuData = null;
            let showAuthSetup = true; // Default to showing auth setup
            
            try {
              const menuPromise = fetchMenuSettings();
              const timeoutPromise = new Promise((resolve) => setTimeout(() => resolve(null), 1500));
              menuData = await Promise.race([menuPromise, timeoutPromise]) as any;
              
              if (menuData) {
                // Menu settings fetched quickly, check if auth setup should be shown
                showAuthSetup = await shouldShowAuthSetup(menuData);
              }
            } catch (menuError) {
              console.warn('[LoginScreen] Error fetching menu settings (using fallback):', menuError);
              // Continue with default behavior if menu fetch fails
            }
            
            // If auth_settings.show is false, go directly to home
            if (!showAuthSetup) {
              const clientConfig = getClientConfig();
              if (clientConfig.features?.biometricAuth === true) {
                await AsyncStorage.setItem('showBiometricAfterLogin', 'true');
              }
              navigation.replace('Home');
            } else {
              try {
                const clientConfig = getClientConfig();
                const useBiometric = clientConfig.features?.biometricAuth === true;
                const pin = useBiometric ? await pinStorage.getPin() : null;
                const biometricEnabled = useBiometric ? await biometricAuthService.isAuthEnabled() : false;

                if (useBiometric && !pin && !biometricEnabled) {
                  navigation.replace('AuthSetupScreen');
                } else {
                  if (useBiometric) {
                    await AsyncStorage.setItem('showBiometricAfterLogin', 'true');
                  }
                  navigation.replace('Home');
                }
              } catch (navErr) {
                console.warn('[LoginScreen] OTP post-login nav check failed, going to Home:', (navErr as Error)?.message);
                navigation.replace('Home');
              }
            }

            setTimeout(() => {
              try {
                Alert.alert('Success', 'Login successful!');
              } catch {
                // ignore
              }
            }, 100);
          } catch (navErr) {
            console.warn('[LoginScreen] OTP navigation after login failed:', (navErr as Error)?.message);
            navigation.replace('Home');
            Alert.alert('Success', 'Login successful!');
          }
        } else {
          const errorMessage = result.error || 'Invalid OTP. Please try again.';
          Alert.alert('OTP Verification Failed', errorMessage);
        }
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderLoadingSpinner = () => (
    <View style={styles.spinnerContainer}>
      <View style={styles.spinner} />
    </View>
  );

  const appVersion = DeviceInfo.getVersion();
  const buildNumber = DeviceInfo.getBuildNumber();

  // Language icon handler: show language selection modal
  const handleLanguageIconPress = () => {
    setShowLanguageModal(true);
  };

  // Handle language selection from modal
  const handleLanguageSelect = async (languageCode: string) => {
    try {
      await changeLanguage(languageCode);
      setShowLanguageModal(false);
    } catch (error: any) {
      console.error('Error changing language:', error);
      Alert.alert('Error', `Failed to change language: ${error?.message || 'Unknown error'}`);
    }
  };

  // Open Spacecom website
  const handleSpacecomWebsite = async () => {
    try {
      const url = 'https://spacecom.in/';
      
      // Try to open URL directly without canOpenURL check
      // This works better on iOS and Android
      await Linking.openURL(url);
    } catch (error) {
      // console.error('Failed to open website:', error);
      Alert.alert('Error', 'Failed to open website. Please try again.');
    }
  };

  // Handle Speed Test
  const handleSpeedTest = () => {
    navigation.navigate('WebView', {
      url: 'https://www.speedtest.net',
      title: 'Speed Test'
    });
  };

  // Handle Support
  const handleSupport = () => {
    navigation.navigate('ContactUs');
  };

  // Handle Company Website
  const handleCompanyWebsite = async () => {
    try {
      if (effectiveWebsiteUrl) {
        await Linking.openURL(effectiveWebsiteUrl);
      } else {
        Alert.alert('Error', 'Website URL not available');
      }
    } catch (error) {
      // console.error('Failed to open website:', error);
      Alert.alert('Error', 'Failed to open website. Please try again.');
    }
  };

  return (
    <SafeAreaView style={[styles.container, {backgroundColor: colors.background}]}>
      <LeftBorderLine />
      <StatusBar 
        barStyle={isDark ? 'light-content' : 'dark-content'} 
        backgroundColor={colors.background} 
      />
      {getClientConfig().clientId === 'log2space-common' && getCustomApi() && (
        <View style={styles.changeDomainBar}>
          <TouchableOpacity
            onPress={() => setShowDomainMenu(true)}
            style={styles.menuIconButton}
            activeOpacity={0.7}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Feather name="menu" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>
      )}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}>
        <View style={styles.mainContainer}>
          {/* Header Section */}
          <Animated.View 
            style={[
              styles.header,
              {
                opacity: fadeAnim,
                transform: [{translateY: slideAnim}],
              },
            ]}>
            <View style={styles.logoAndTitleContainer}>
              <View style={styles.logoSection}>
                <LogoImage type="login" />
              </View>
              {/* Put company name clearly below the logo instead of tight side-by-side */}
              <Text style={[styles.title, {color: colors.text}]}>{effectiveCompanyName}</Text>
            </View>
          </Animated.View>

          {/* Login Interface */}
          <Animated.View 
            style={[
              styles.loginInterface,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                opacity: fadeAnim,
                transform: [{translateY: slideAnim}],
              },
            ]}>
            {/* Username Input */}
            <View style={styles.formSection}>
              <View style={styles.inputField}>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={[styles.textInput, {
                      borderColor: usernameError ? '#EF4444' : colors.border,
                      backgroundColor: colors.surface,
                      color: colors.text,
                      flex: 1,
                    }]}
                    placeholder={loginMode === 'otp' ? 'Username / Mobile No' : 'Username'}
                    placeholderTextColor={colors.textTertiary}
                    value={username}
                    onChangeText={(text) => {
                      setUsername(text);
                      if (text.trim()) setUsernameError(false);
                    }}
                    autoComplete="off"
                    importantForAutofill="no"
                    autoCorrect={false}
                    autoCapitalize="none"
                  />
                </View>
                {usernameError && (
                  <Text style={[styles.errorText, {color: '#EF4444'}]}>
                    {t('login.usernameRequired') || 'Please enter your username'}
                  </Text>
                )}
              </View>

              {/* Password Login Mode */}
              {loginMode === 'password' && allowPasswordLogin && (
                <View style={styles.inputField}>
                  <View style={styles.inputContainer}>
                    <View style={{flex: 1, position: 'relative', height: 60}}>
                      <TextInput
                        style={[styles.passwordInput, {
                          borderColor: passwordError ? '#EF4444' : colors.border,
                          backgroundColor: colors.surface,
                          color: colors.text,
                        }]}
                        placeholder={t('login.password')}
                        placeholderTextColor={colors.textTertiary}
                        secureTextEntry={!showPassword}
                        value={password}
                        onChangeText={(text) => {
                          setPassword(text);
                          if (text.trim()) setPasswordError(false);
                        }}
                      />
                      <TouchableOpacity
                        style={styles.eyeButton}
                        onPress={() => setShowPassword(!showPassword)}>
                        <Feather name={showPassword ? "eye" : "eye-off"} size={18} color={colors.textSecondary} />
                      </TouchableOpacity>
                    </View>
                  </View>
                  {passwordError && (
                    <Text style={[styles.errorText, {color: '#EF4444'}]}>
                      {t('login.passwordRequired') || 'Please enter your password'}
                    </Text>
                  )}
                </View>
              )}

              {/* OTP Login Mode */}
              {loginMode === 'otp' && allowOtpLogin && (
                <>
                  {/* Show "Send OTP" button only if OTP hasn't been sent yet */}
                  {!otpSent && (
                    <TouchableOpacity
                      style={[
                        styles.resendButton, 
                        {borderColor: colors.primary, marginTop: 0}
                      ]}
                      onPress={sendOtp}
                      disabled={isLoading}>
                      <Text style={[
                        styles.resendButtonText, 
                        {color: colors.primary}
                      ]}>
                        {t('login.sendOtp') || 'Send OTP'}
                      </Text>
                    </TouchableOpacity>
                  )}

                  {/* Show OTP input and Resend button only after OTP has been sent */}
                  {otpSent && (
                    <View style={styles.inputField}>
                      <View style={styles.inputContainer}>
                        <TextInput
                          style={[styles.textInput, {
                            borderColor: otpError ? '#EF4444' : colors.border,
                            backgroundColor: colors.surface,
                            color: colors.text,
                            flex: 1,
                          }]}
                          placeholder={t('login.enterOtp')}
                          placeholderTextColor={colors.textTertiary}
                          keyboardType="number-pad"
                          value={otp}
                          onChangeText={(text) => {
                            setOtp(text);
                            if (text.trim()) setOtpError(false);
                          }}
                        />
                      </View>
                      <TouchableOpacity
                        style={[
                          styles.resendButton, 
                          {borderColor: colors.primary},
                          resendCountdown > 0 && {borderColor: colors.textTertiary}
                        ]}
                        onPress={sendOtp}
                        disabled={isLoading || resendCountdown > 0}>
                        <Text style={[
                          styles.resendButtonText, 
                          {color: resendCountdown > 0 ? colors.textTertiary : colors.primary}
                        ]}>
                          {resendCountdown > 0 
                            ? `${t('login.resendOtp') || 'Resend OTP'} (${resendCountdown}s)` 
                            : t('login.resendOtp') || 'Resend OTP'}
                        </Text>
                      </TouchableOpacity>
                      {otpError && (
                        <Text style={[styles.errorText, {color: '#EF4444'}]}>
                          {t('login.otpRequired') || 'Please enter OTP'}
                        </Text>
                      )}
                      {!!otpTargetPhone && (
                        <Text style={[styles.errorText, {color: colors.textSecondary, marginTop: 4}]}>
                          OTP code sent to {otpTargetPhone}
                        </Text>
                      )}
                    </View>
                  )}
                </>
              )}

              {/* Remember me checkbox (password login only) */}
              {loginMode === 'password' && allowPasswordLogin && (
                <TouchableOpacity
                  style={styles.rememberRow}
                  activeOpacity={0.7}
                  onPress={() => setRememberMe(prev => !prev)}
                >
                  <View
                    style={[
                      styles.rememberCheckbox,
                      {
                        borderColor: colors.border,
                        backgroundColor: rememberMe ? colors.primary : 'transparent',
                      },
                    ]}
                  >
                    {rememberMe && (
                      <Feather name="check" size={14} color="#ffffff" />
                    )}
                  </View>
                  <Text style={[styles.rememberText, { color: colors.textSecondary }]}>
                    {t('login.rememberMe') || 'Remember my login on this device'}
                  </Text>
                </TouchableOpacity>
              )}

              {/* Toggle between Password and OTP (only if both methods are allowed and client permits link) */}
              {allowPasswordLogin && allowOtpLogin && showOtpLoginLink && (
                <TouchableOpacity
                  onPress={async () => {
                    if (loginMode === 'password') {
                      setLoginMode('otp');
                      setPassword('');
                      setPasswordError(false);
                      setOtpSent(false);
                      setOtpResponseUsername(null);
                      setOtp(''); // Clear OTP
                      setOtpError(false);
                      setResendCountdown(0); // Reset countdown
                    } else {
                      setLoginMode('password');
                      setOtp('');
                      setOtpError(false);
                      setOtpSent(false);
                      setOtpResponseUsername(null);
                      setResendCountdown(0); // Reset countdown
                    }
                  }}
                  style={{ marginTop: 8, alignSelf: 'center' }}>
                  <Text style={{ color: colors.primary, fontSize: 14, fontWeight: '600' }}>
                    {loginMode === 'password' 
                      ? t('login.loginWithOtp') || 'Login with OTP' 
                      : t('login.loginWithPassword') || 'Login with Password'}
                  </Text>
                </TouchableOpacity>
              )}

              
              {/* Login Button - Only show if:
                  - Password mode: always show
                  - OTP mode: only show after OTP has been sent */}
              {(loginMode === 'password' || (loginMode === 'otp' && otpSent)) && (
                <TouchableOpacity
                  style={[styles.loginButton, {backgroundColor: colors.primary}]}
                  onPress={handleLogin}
                  disabled={isLoading}>
                  {isLoading ? (
                    renderLoadingSpinner()
                  ) : (
                    <Text style={styles.loginButtonText}>
                      {t('login.login')}
                    </Text>
                  )}
                </TouchableOpacity>
              )}
            </View>
          </Animated.View>

          {/* Features Display - Compact Style */}
          <View style={styles.featuresContainer}>
            <TouchableOpacity 
              style={[styles.featureCard, {backgroundColor: colors.card, borderColor: colors.border}]}
              onPress={handleSpeedTest}
              activeOpacity={0.7}
            > 
              <Feather name="activity" size={22} color={colors.primary} style={styles.featureIcon} />
              <Text style={[styles.featureText, {color: colors.text}]}>Speed Test</Text> 
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.featureCard, {backgroundColor: colors.card, borderColor: colors.border}]}
              onPress={handleSupport}
              activeOpacity={0.7}
            >
              <Feather name="headphones" size={22} color={colors.primary} style={styles.featureIcon} />
              <Text style={[styles.featureText, {color: colors.text}]}>Support</Text>
            </TouchableOpacity>
            {effectiveWebsiteUrl && (
              <TouchableOpacity 
                style={[styles.featureCard, {backgroundColor: colors.card, borderColor: colors.border}]}
                onPress={handleCompanyWebsite}
                activeOpacity={0.7}
              > 
                <Feather name="globe" size={22} color={colors.primary} style={styles.featureIcon} />
                <Text style={[styles.featureText, {color: colors.text}]}>Website</Text> 
              </TouchableOpacity>
            )}
          </View>


          {/* Language Row (controlled by isp_details.json settings; hidden for log2space-common) */}
          {showLanguageSwitcher && getClientConfig().clientId !== 'log2space-common' && (
            <View style={{ width: '100%', alignItems: 'center', marginBottom: 8 }}>
              <View style={{ flexDirection: 'row', gap: 16 }}>
              <TouchableOpacity 
                onPress={handleLanguageIconPress} 
                accessibilityLabel="Change Language"
                activeOpacity={0.7}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Feather name="type" size={22} color={colors.primary} />
              </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Powered By Info */}
          <Text style={[styles.poweredByText, {color: colors.textSecondary}]}> 
            Powered By{"\n"}
            <Text  
              style={[styles.companyLink, {color: colors.primary}]} 
              onPress={handleSpacecomWebsite} 
            > 
              Spacecom Software LLP 
            </Text> 
          </Text>
          {/* Version Info */}
          <Text style={[styles.versionText, {color: colors.textSecondary}]}> 
            Version {appVersion} ({buildNumber}) 
          </Text>
        </View>
      </KeyboardAvoidingView>

      {/* Change Domain / IP menu (log2space-common) */}
      <Modal
        visible={showDomainMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDomainMenu(false)}
      >
        <View style={styles.domainMenuOverlay}>
          <TouchableWithoutFeedback onPress={() => setShowDomainMenu(false)}>
            <View style={styles.domainMenuBackdrop} />
          </TouchableWithoutFeedback>
          <View style={[styles.domainMenuCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <TouchableOpacity
              style={[styles.domainMenuItem, { borderBottomColor: colors.border }]}
              onPress={() => {
                setShowDomainMenu(false);
                // Mark that user wants to change the domain so app starts on DomainEntry next launch
                AsyncStorage.setItem('log2space_force_domain_entry', 'true').catch(() => {});
                navigation.navigate('DomainEntry');
              }}
              activeOpacity={0.7}
            >
              <Text style={[styles.domainMenuItemText, { color: colors.text }]}>Change Domain / IP</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Language Selection Modal */}
      <Modal
        visible={showLanguageModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLanguageModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {t('settings.selectLanguage') || 'Select Language'}
              </Text>
              <TouchableOpacity
                onPress={() => setShowLanguageModal(false)}
                style={styles.closeButton}
              >
                <Feather name="x" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            
            <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
              {t('settings.selectLanguageSubtitle') || 'Choose your preferred language'}
            </Text>

            <View style={styles.languageList}>
              {availableLanguages.map((language) => (
                <TouchableOpacity
                  key={language.code}
                  style={[
                    styles.languageItem,
                    { 
                      backgroundColor: currentLanguage === language.code ? colors.primary : colors.surface,
                      borderColor: colors.border
                    }
                  ]}
                  onPress={() => handleLanguageSelect(language.code)}
                >
                  <View style={styles.languageInfo}>
                    <Text style={styles.languageFlag}>
                      {language.code === 'en' ? '🇺🇸' : '🇮🇳'}
                    </Text>
                    <View style={styles.languageText}>
                      <Text style={[
                        styles.languageName,
                        { color: currentLanguage === language.code ? '#ffffff' : colors.text }
                      ]}>
                        {language.nativeName}
                      </Text>
                      <Text style={[
                        styles.languageNameEn,
                        { color: currentLanguage === language.code ? '#ffffff' : colors.textSecondary }
                      ]}>
                        {language.name}
                      </Text>
                    </View>
                  </View>
                  {currentLanguage === language.code && (
                    <Feather name="check" size={18} color="#ffffff" />
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
  changeDomainBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  menuIconButton: {
    padding: 4,
  },
  domainMenuOverlay: {
    flex: 1,
  },
  domainMenuBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  domainMenuCard: {
    position: 'absolute',
    top: 56,
    left: 16,
    minWidth: 220,
    borderRadius: 10,
    borderWidth: 1,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  domainMenuItem: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 0,
  },
  domainMenuItemText: {
    fontSize: 15,
    fontWeight: '500',
  },
  keyboardView: {
    flex: 1,
    paddingHorizontal: 10,
    paddingTop: 20,
    paddingBottom: 20,
  },
  mainContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 10,
  },
  header: {
    alignItems: 'center',
    marginBottom: 16,
  },
  logoAndTitleContainer: {
    // Stack logo and company name vertically so they don't clash
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoSection: {
    marginBottom: 8, // Add space below logo so name sits clearly under it
    marginRight: 0,
  },
  logo: {
    marginBottom: 0,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 0,
    textAlign: 'center',
    flexShrink: 1,
  },
  loginInterface: {
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    width: '100%',
    maxWidth: 600,
  },
  formSection: {
    gap: 16,
    width: '100%',
  },
  inputField: {
    gap: 6,
    width: '100%',
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
    width: '100%',
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    height: 60,
    flex: 1,
    minWidth: 200,
  },
  passwordInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingRight: 60, // Extra padding for eye icon
    paddingVertical: 16,
    fontSize: 16,
    height: 60,
    flex: 1,
    minWidth: 200,
  },
  checkButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  checkButtonText: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  eyeButton: {
    position: 'absolute',
    right: 15,
    top: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resendContainer: {
    alignItems: 'flex-end',
    marginTop: 8,
  },
  resendButton: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  resendButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  tabNavigation: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
    backgroundColor: '#f5f5f5',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTabButton: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  activeTabButtonText: {
    color: '#ffffff',
  },
  loginButton: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  loginButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 4,
  },
  rememberCheckbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  rememberText: {
    fontSize: 13,
  },
  spinnerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinner: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#ffffff',
    borderTopColor: 'transparent',
  },
  featuresContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    marginBottom: 15,
    paddingHorizontal: 20,
    gap: 15,
  },
  featureCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  featureIcon: {
    marginBottom: 8,
  },
  featureEmoji: {
    fontSize: 24,
  },
  featureText: {
    fontSize: 12,
    textAlign: 'center',
  },
  poweredByText: {
    fontSize: 12,
    marginTop: 10,
    textAlign: 'center',
  },
  companyLink: {
    fontWeight: '600',
  },
  versionText: {
    fontSize: 12,
    marginTop: 5,
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: Dimensions.get('window').width * 0.85,
    maxWidth: 400,
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    marginBottom: 24,
  },
  languageList: {
    gap: 12,
  },
  languageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  languageInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  languageFlag: {
    fontSize: 24,
    marginRight: 16,
  },
  languageText: {
    flex: 1,
  },
  languageName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  languageNameEn: {
    fontSize: 14,
  },
});

export default LoginScreen; 