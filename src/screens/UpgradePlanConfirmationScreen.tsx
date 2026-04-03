import React, {useState, useEffect, useMemo} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
  Modal,
  TouchableWithoutFeedback,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useTheme} from '../utils/ThemeContext';
import {getThemeColors} from '../utils/themeStyles';
import CommonHeader from '../components/CommonHeader';
import {useTranslation} from 'react-i18next';
import {apiService} from '../services/api';
import sessionManager from '../services/sessionManager';
import {getClientConfig} from '../config/client-config';
import useMenuSettings from '../hooks/useMenuSettings';
import {handlePayment} from '../services/commonfunction';
import {credentialStorage} from '../services/credentialStorage';

const UpgradePlanConfirmationScreen = ({navigation, route}: any) => {
  const {isDark} = useTheme();
  const colors = getThemeColors(isDark);
  const {t} = useTranslation();

  const [isLoading, setIsLoading] = useState(false);
  const [currentPlanData, setCurrentPlanData] = useState<any>(null);
  const [currentPlanDetails, setCurrentPlanDetails] = useState<any>(null);
  const [loadingComparison, setLoadingComparison] = useState<boolean>(false);
  const [salesReturnData, setSalesReturnData] = useState<any>(null);
  const [coupons, setCoupons] = useState<any[]>([]);
  const [selectedCoupon, setSelectedCoupon] = useState<any>(null);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [complimentaryDiscountResponse, setComplimentaryDiscountResponse] = useState<any>(null);
  const [complimentaryDiscountError, setComplimentaryDiscountError] = useState<string>('');
  const complimentaryDiscountAvailable =
    String(complimentaryDiscountResponse?.data?.disc_available || '')
      .trim()
      .toLowerCase() === 'yes';
  const complimentaryDiscountAmount = complimentaryDiscountAvailable
    ? Number(complimentaryDiscountResponse?.data?.disc_value || 0)
    : 0;
  const appliedDiscount = complimentaryDiscountAvailable
    ? complimentaryDiscountAmount
    : couponDiscount;

  const {selectedPlan, totalAmount, payDues, admin_login_id} = route.params;
  const { menu } = useMenuSettings();

  // Payment gateway state (same pattern as PlanConfirmationScreen)
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedGateway, setSelectedGateway] = useState('');
  const [paymentGateways, setPaymentGateways] = useState<any[]>([]);
  const [loadingGateways, setLoadingGateways] = useState(false);
  const [gatewayError, setGatewayError] = useState('');
  const [adminLoginIdState, setAdminLoginIdState] = useState(admin_login_id);

  // Read display_option_json settings for "Upgrade Plan" menu
  const { showL2SPlanName, showPlanParamsBlend, highSpeedPlanNote, showDiscountCoupon } = useMemo(() => {
    let result = {
      showL2SPlanName: true,
      showPlanParamsBlend: false,
      highSpeedPlanNote: '',
      showDiscountCoupon: false,
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
      const rawHighSpeedPlanNote = parsed?.display_plan_settings?.high_speed_plan_note;
      const rawDiscountCouponFlag = parsed?.display_plan_settings?.discount_coupen;

      let nameFlag = true;
      let blendFlag = false;
      let noteText = '';
      let discountCouponFlag = false;

      if (typeof rawNameFlag === 'boolean') nameFlag = rawNameFlag;
      else if (typeof rawNameFlag === 'string') nameFlag = rawNameFlag.toLowerCase() === 'true';

      if (typeof rawBlendFlag === 'boolean') blendFlag = rawBlendFlag;
      else if (typeof rawBlendFlag === 'string') blendFlag = rawBlendFlag.toLowerCase() === 'true';

      if (typeof rawHighSpeedPlanNote === 'string' && rawHighSpeedPlanNote.trim()) {
        noteText = rawHighSpeedPlanNote.trim();
      }

      if (typeof rawDiscountCouponFlag === 'boolean') discountCouponFlag = rawDiscountCouponFlag;
      else if (typeof rawDiscountCouponFlag === 'string') discountCouponFlag = rawDiscountCouponFlag.toLowerCase() === 'true';

      return {
        showL2SPlanName: nameFlag,
        showPlanParamsBlend: blendFlag,
        highSpeedPlanNote: noteText,
        showDiscountCoupon: discountCouponFlag,
      };
    } catch {
      return result;
    }
  }, [menu]);

  useEffect(() => {
    loadCurrentPlanData();
  }, []);

  const loadCurrentPlanData = async () => {
    try {
      setIsLoading(true);
      
      const session = await sessionManager.getCurrentSession();
      if (!session) {
        Alert.alert('Error', 'Please login again');
        navigation.navigate('Login');
        return;
      }

      const {username} = session;
      
      setLoadingComparison(true);
      
      // Get current plan data
      const authResponse = await apiService.makeAuthenticatedRequest(async (token) => {
        return await apiService.authUser(username);
      });
      
      setCurrentPlanData(authResponse);

      // Extract refund data from authUser response
      // console.log('=== AUTH USER RESPONSE FOR REFUND ===');
      // console.log('Full Auth Response:', JSON.stringify(authResponse, null, 2));
      // console.log('=== CURRENT PLAN DATA DEBUG ===');
      // console.log('Full Current Plan Data:', JSON.stringify(authResponse, null, 2));
      // console.log('Current Plan Data Keys:', Object.keys(authResponse || {}));
      // console.log('Usage Details:', authResponse?.usage_details);
      //console.log('Sales Return Details:', authResponse?.sales_return_details);
      // console.log('Usage Details [0]:', authResponse?.usage_details?.[0]);
      // console.log('Usage Details [0] Keys:', authResponse?.usage_details?.[0] ? Object.keys(authResponse.usage_details[0]) : 'No usage details');
      // console.log('Plan Price Fields:', {
      //   plan_price: authResponse?.plan_price,
      //   price: authResponse?.price,
      //   current_plan_price: authResponse?.current_plan_price,
      //   plan_amount: authResponse?.plan_amount,
      //   amount: authResponse?.amount,
      //   usage_details: authResponse?.usage_details?.[0],
      //   'usage_details[0].plan_price': authResponse?.usage_details?.[0]?.plan_price,
      //   'usage_details[0].amount': authResponse?.usage_details?.[0]?.amount,
      //   'usage_details[0].plan_amount': authResponse?.usage_details?.[0]?.plan_amount,
      //   'usage_details[0].current_plan_price': authResponse?.usage_details?.[0]?.current_plan_price
      // });
      console.log('=== END CURRENT PLAN DATA DEBUG ===');
      console.log('=== END AUTH USER RESPONSE ===');
      
      // Check if authResponse contains sales_return_details
      if (authResponse && authResponse.sales_return_details) {
        // console.log('=== FOUND SALES RETURN DETAILS ===');
        // console.log('Sales Return Details:', JSON.stringify(authResponse.sales_return_details, null, 2));
        // console.log('=== END SALES RETURN DETAILS ===');
        setSalesReturnData(authResponse.sales_return_details);
      } else {
        // console.log('=== NO SALES RETURN DETAILS FOUND ===');
        // console.log('Auth Response Keys:', authResponse ? Object.keys(authResponse) : 'No response');
        // console.log('=== END NO SALES RETURN DETAILS ===');
        setSalesReturnData(null);
      }

      // Get current plan details from plan API
      try {
        const currentPlanName = authResponse?.current_plan || authResponse?.current_plan1;
        // console.log('=== GETTING CURRENT PLAN DETAILS ===');
        // console.log('Current Plan Name:', currentPlanName);
        // console.log('Admin Login ID:', authResponse?.admin_login_id);
        // console.log('Username:', username);
        
        if (currentPlanName && authResponse?.admin_login_id) {
          // Get admin tax info for plan API
          const taxInfo = await apiService.getAdminTaxInfo(authResponse.admin_login_id, 'default');
          const isShowAllPlan = taxInfo?.isShowAllPlan || false;
          
          // Get full plan list
          const planList = await apiService.planList(
            authResponse.admin_login_id,
            username,
            currentPlanName,
            isShowAllPlan,
            false, // is_dashboard
            'default'
          );
          
          // console.log('=== PLAN LIST RESPONSE ===');
          // console.log('Total Plans:', planList?.length || 0);
          // console.log('Full Plan List:', JSON.stringify(planList, null, 2));
          
          // Find current plan in the list
          const currentPlan = planList?.find((plan: any) => 
            plan.name === currentPlanName || 
            plan.name === authResponse?.current_plan || 
            plan.name === authResponse?.current_plan1
          );
          
          // console.log('=== CURRENT PLAN FOUND ===');
          // console.log('Current Plan Details:', JSON.stringify(currentPlan, null, 2));
          // console.log('=== END CURRENT PLAN DETAILS ===');
          
          setCurrentPlanDetails(currentPlan);
        }
      } catch (error) {
        console.error('Error fetching current plan details:', error);
      }

      // Get available coupons
      try {
        const clientConfig = getClientConfig();
        const realm = clientConfig.clientId;

        // First call complimentary discount API (as requested before coupon display)
        try {
          const adminLoginForDiscount = String(
            adminLoginIdState || admin_login_id || '',
          );
          const username = session?.username || '';
          const planname = selectedPlan?.name || '';

          if (username && planname && adminLoginForDiscount) {
            const complimentaryResponse = await apiService.getComplimentaryDiscountValue(
              {
                username,
                planname,
                admin_login_id: adminLoginForDiscount,
                request_source: 'app',
                request_app: 'user_app',
              },
              realm,
            );
            setComplimentaryDiscountResponse(complimentaryResponse);
            setComplimentaryDiscountError('');
            const isDiscountAvailable =
              String(complimentaryResponse?.data?.disc_available || '')
                .trim()
                .toLowerCase() === 'yes';
            if (isDiscountAvailable) {
              // If complimentary discount is available, skip coupon flow.
              setCoupons([]);
              setSelectedCoupon(null);
              setCouponDiscount(0);
            } else {
              const couponData = await apiService.getCouponCode(realm);
              setCoupons(couponData || []);
            }
          } else {
            setComplimentaryDiscountError(
              'Missing required params for selfcareGetComplimentaryDiscountValue',
            );
            const couponData = await apiService.getCouponCode(realm);
            setCoupons(couponData || []);
          }
        } catch (complimentaryError: any) {
          console.error(
            'Error fetching selfcareGetComplimentaryDiscountValue:',
            complimentaryError,
          );
          setComplimentaryDiscountError(
            complimentaryError?.message ||
              'Failed to fetch complimentary discount value',
          );
          const couponData = await apiService.getCouponCode(realm);
          setCoupons(couponData || []);
        }
      } catch (error) {
        //console.error('Error fetching coupons:', error);
        setCoupons([]);
      }

    } catch (error: any) {
      console.error('Error loading current plan data:', error);
      Alert.alert('Error', 'Failed to load plan information');
    } finally {
      setIsLoading(false);
      setLoadingComparison(false);
    }
  };

  const handleConfirmUpgrade = async () => {
    setLoadingGateways(true);
    setGatewayError('');
    setPaymentGateways([]);

    try {
      // Ensure user is logged in
      const isLoggedIn = await sessionManager.isLoggedIn();
      if (!isLoggedIn) {
        setGatewayError('Please login again to continue with payment.');
        setLoadingGateways(false);
        return;
      }

      // Get current session
      const session = await sessionManager.getCurrentSession();
      if (!session) {
        setGatewayError('Session not found. Please login again.');
        setLoadingGateways(false);
        return;
      }

      let adminId = adminLoginIdState;
      if (!adminId) {
        // Fallback: fetch from authUser if not provided
        try {
          const authData = await apiService.authUser(session.username);
          adminId = authData.admin_login_id;
          setAdminLoginIdState(adminId);
        } catch (e: any) {
          console.error('Failed to fetch admin ID:', e);
          setGatewayError('Could not determine admin. Please try again.');
          setLoadingGateways(false);
          return;
        }
      }

      // Optional debug similar to PlanConfirmationScreen
      const creds = await credentialStorage.getCredentials();
      if (!creds) {
        console.log('No stored credentials found - this may cause token regeneration issues');
      } else {
        console.log('Stored credentials found for user:', creds.username);
      }

      const clientConfig = getClientConfig();
      const realm = clientConfig.clientId;

      const gateways = await apiService.paymentGatewayOptions(adminId, realm);
      const gatewaysList = gateways || [];
      setPaymentGateways(gatewaysList);
      
      // If only one gateway, automatically proceed to payment
      if (gatewaysList.length === 1) {
        setSelectedGateway(gatewaysList[0].id);
        setLoadingGateways(false);
        // Directly proceed to payment without showing modal
        await handleGatewayPayDirect(gatewaysList[0]);
        return;
      }
      
      // Multiple gateways - show selection modal
      setShowPaymentModal(true);
    } catch (err: any) {
      console.error('Payment gateway fetch error (upgrade):', err);

      if (err.message?.includes('Invalid User')) {
        setGatewayError('Your session has expired. Please login again to continue.');
      } else if (err.message?.includes('network')) {
        setGatewayError('Network error while fetching payment options. Please check your connection and try again.');
      } else {
        setGatewayError(err.message || 'Could not load payment options. Please try again.');
      }
    } finally {
      setLoadingGateways(false);
    }
  };

  // Shared payment processing function
  const processPayment = async (gatewayObj: any) => {
    const session = await sessionManager.getCurrentSession();
    if (!session || !session.username) {
      Alert.alert('Error', 'Please login again to continue with payment.');
      return;
    }

    const clientConfig = getClientConfig();
    const realm = clientConfig.clientId;

    const finalAmount = calculateFinalAmount();

    const refundAmount =
      salesReturnData?.pin_detail?.[0]?.user_refund_amount || 0;
    const oldPinSerial =
      salesReturnData?.pin_detail?.[0]?.pin_serial || undefined;

    const params = {
      amount: finalAmount,
      adminname: adminLoginIdState,
      username: session.username,
      planname: selectedPlan.name,
      selectedPGType: [{label: gatewayObj.gw_display_name, value: gatewayObj.id}],
      payActionType: 'renewal', // same as PlanConfirmationScreen
      couponCode: complimentaryDiscountAvailable
        ? null
        : (selectedCoupon ? getDiscountCode(selectedCoupon) : null),
      campaignCode: complimentaryDiscountAvailable
        ? null
        : (selectedCoupon?.campaign_code || null),
      couponDiscount: appliedDiscount,
      isp_policy_discount: complimentaryDiscountAvailable
        ? complimentaryDiscountAmount
        : 'no',
      originalAmount: totalAmount,
      refund_amount: refundAmount,
      old_pin_serial: oldPinSerial,
    };

    handlePayment(params, 'renewal', navigation, realm);
  };

  // Direct payment handler (when only one gateway is available)
  const handleGatewayPayDirect = async (gatewayObj: any) => {
    await processPayment(gatewayObj);
  };

  // Payment handler from modal (when user selects a gateway)
  const handleGatewayPay = async () => {
    setShowPaymentModal(false);
    const selectedGatewayObj = paymentGateways.find(g => g.id === selectedGateway);
    if (!selectedGatewayObj) {
      Alert.alert('Error', 'Please select a payment gateway.');
      return;
    }
    await processPayment(selectedGatewayObj);
  };

  const handleCancel = () => {
    navigation.goBack();
  };

  const formatCurrency = (amount: number) => {
    const rounded = Math.round(amount || 0);
    const withCommas = rounded
      .toString()
      .replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return `₹${withCommas}`;
  };

  const getUsageSubtitle = (limit: string | number | undefined): string => {
    if (!limit) return '';
    const limitStr = String(limit);
    const lower = limitStr.toLowerCase();
    if (lower === 'unlimited' || limit === -1) return 'unlimited usage';
    return `${limit} GB`;
  };

  const formatSpeed = (speed: string | undefined): string => {
    if (!speed) return 'N/A';
    
    const lowerSpeed = speed.toLowerCase();
    if (lowerSpeed.includes('mbps') || lowerSpeed.includes('mb')) {
      const numericValue = parseFloat(speed.replace(/[^0-9.]/g, ''));
      if (!isNaN(numericValue)) {
        return `${Math.round(numericValue)} Mbps`;
      }
    }
    
    const numericValue = parseInt(speed.replace(/[^0-9]/g, ''));
    
    if (isNaN(numericValue) || numericValue === 0) return 'N/A';
    
    if (numericValue >= 1000) {
      const mbps = numericValue / 1024;
      const rounded = Math.round(mbps);
      return `${rounded} Mbps`;
    }
    
    return `${numericValue} Mbps`;
  };

  const renderOTTIcon = (provider: any) => {
    if (provider?.full_path_app_logo_file) {
      return (
        <Image 
          source={{ uri: provider.full_path_app_logo_file }}
          style={styles.ottLogoNew}
          resizeMode="contain"
        />
      );
    }
    const serviceName = provider?.content_provider?.toLowerCase() || '';
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

  const getDiscountCode = (coupon: any): string | null => {
    try {
      if (!coupon.discount_coupon_json) {
        return null;
      }
      
      const discountJson = JSON.parse(coupon.discount_coupon_json);
      const discountCode = discountJson?.discount_code;
      
      // Return null if discount_code is empty, null, or undefined
      if (!discountCode || discountCode.trim() === '') {
        return null;
      }
      
      return discountCode;
    } catch (error) {
      console.error('Error parsing discount coupon JSON:', error);
      return null;
    }
  };

  const calculateRefundAmount = () => {
    if (!currentPlanData || !currentPlanData.usage_details?.[0]) {
      return 0;
    }

    const currentPlan = currentPlanData.usage_details[0];
    const totalDays = currentPlan.plan_days || 0;
    const usedDays = currentPlan.used_days || 0;
    const currentPlanPrice = currentPlanData.plan_price || 0;

    if (totalDays <= 0 || usedDays >= totalDays) {
      return 0;
    }

    const unusedDays = totalDays - usedDays;
    const dailyRate = currentPlanPrice / totalDays;
    const refundAmount = dailyRate * unusedDays;

    return Math.round(refundAmount);
  };

  const handleCouponSelect = (coupon: any) => {
    if (selectedCoupon && selectedCoupon.id === coupon.id) {
      // Deselect if same coupon is clicked
      setSelectedCoupon(null);
      setCouponDiscount(0);
    } else {
      // Select new coupon
      setSelectedCoupon(coupon);
      
      // Calculate discount based on coupon
      try {
        const discountJson = JSON.parse(coupon.discount_coupon_json || '{}');
        const discountValue = parseFloat(discountJson.discount_option_value || '0');
        setCouponDiscount(discountValue);
      } catch (error) {
        console.error('Error parsing coupon discount:', error);
        setCouponDiscount(0);
      }
    }
  };

  const calculateFinalAmount = () => {
    let finalAmount = totalAmount;
    
    // Subtract refund amount if available
    if (salesReturnData && salesReturnData.pin_detail && salesReturnData.pin_detail.length > 0) {
      finalAmount -= salesReturnData.pin_detail[0].user_refund_amount || 0;
    }
    
    // Subtract complimentary discount (if available), otherwise coupon discount.
    finalAmount -= appliedDiscount;
    
    return Math.max(0, finalAmount);
  };

  const renderPlanComparison = () => {
    // Show loading state while fetching comparison data
    if (loadingComparison || (!currentPlanDetails && !currentPlanData)) {
      return (
        <View style={[styles.comparisonCard, {backgroundColor: colors.card, shadowColor: colors.shadow}]}>
          <Text style={[styles.comparisonTitle, {color: colors.text}]}>Plan Comparison</Text>
          <View style={[styles.comparisonTable, {padding: 20, alignItems: 'center', justifyContent: 'center', minHeight: 100}]}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={[styles.loadingText, {color: colors.textSecondary, marginTop: 12}]}>
              Loading comparison...
            </Text>
          </View>
        </View>
      );
    }

    if (!currentPlanDetails && !currentPlanData) {
      return null;
    }

    const currentPlanPrice =
      currentPlanDetails?.FinalAmount ||
      currentPlanDetails?.amt ||
      currentPlanDetails?.price ||
      currentPlanData?.plan_price ||
      currentPlanData?.price ||
      currentPlanData?.current_plan_price ||
      currentPlanData?.plan_amount ||
      currentPlanData?.amount ||
      currentPlanData?.usage_details?.[0]?.plan_price ||
      currentPlanData?.usage_details?.[0]?.amount ||
      0;

    // Compute values to compare
    const currentSpeed = currentPlanDetails?.downloadSpeed || currentPlanData?.plan_download_speed || '';
    const selectedSpeed = selectedPlan.speed || '';
    const currentSpeedFormatted = formatSpeed(currentSpeed);
    const selectedSpeedFormatted = formatSpeed(selectedSpeed);
    const speedDiffers = currentSpeedFormatted !== selectedSpeedFormatted;

    const currentData =
      currentPlanDetails?.limit === 'Unlimited'
        ? 'Unlimited'
        : `${currentPlanDetails?.limit || ''}`;
    const selectedData = selectedPlan.gbLimit === -1 ? 'Unlimited' : `${selectedPlan.gbLimit}`;
    const dataDiffers = currentData !== selectedData;

    const currentValidity = currentPlanDetails?.days ? `${currentPlanDetails.days}` : '';
    const selectedValidity = selectedPlan.validity || '';
    const validityDiffers = currentValidity !== selectedValidity;

    const currentOtt =
      currentPlanDetails?.ott_plan?.toLowerCase() === 'yes' ||
      (currentPlanDetails?.content_providers && currentPlanDetails.content_providers.length > 0);
    const selectedOtt =
      selectedPlan.ott_plan?.toLowerCase() === 'yes' ||
      (selectedPlan.ottServices && selectedPlan.ottServices.length > 0);
    const ottDiffers = currentOtt !== selectedOtt;

    const currentVoip = currentPlanDetails?.voice_plan?.toLowerCase() === 'yes';
    const selectedVoip = selectedPlan.voice_plan?.toLowerCase() === 'yes';
    const voipDiffers = currentVoip !== selectedVoip;

    const currentIptv = currentPlanDetails?.iptv?.toLowerCase() === 'yes';
    const selectedIptv = selectedPlan.iptv?.toLowerCase() === 'yes';
    const iptvDiffers = currentIptv !== selectedIptv;

    const currentFup = currentPlanDetails?.fup_flag?.toLowerCase() === 'yes';
    const selectedFup = selectedPlan.fup_flag?.toLowerCase() === 'yes';
    const fupDiffers = currentFup !== selectedFup;

    const selectedPrice = selectedPlan.price || 0;
    const priceDiffers = Number(currentPlanPrice) !== Number(selectedPrice);

    const currentPlanName = currentPlanDetails?.name || currentPlanData?.current_plan || '';
    const selectedPlanName = selectedPlan.name || '';
    const planNameDiffers = currentPlanName !== selectedPlanName;

    const hasDifference =
      (currentPlanDetails?.name || currentPlanData?.current_plan) !== selectedPlan.name ||
      currentSpeed !== selectedSpeed ||
      currentData !== selectedData ||
      currentValidity !== selectedValidity ||
      currentOtt !== selectedOtt ||
      currentVoip !== selectedVoip ||
      currentIptv !== selectedIptv ||
      currentFup !== selectedFup ||
      Number(currentPlanPrice) !== Number(selectedPrice);

    if (!hasDifference) {
      // No difference between current and selected plan – don't show comparison block
      return null;
    }

    return (
      <View style={[styles.comparisonCard, {backgroundColor: colors.card, shadowColor: colors.shadow}]}>
        <Text style={[styles.comparisonTitle, {color: colors.text}]}>Plan Comparison</Text>

        <View style={styles.comparisonTable}>
          {/* Header */}
          <View style={[styles.tableHeader, {borderBottomColor: colors.border, borderTopColor: colors.border, borderLeftColor: colors.border, borderRightColor: colors.border}]}>
            <View style={[styles.headerCellContainer, styles.parameterCellContainer, {borderRightWidth: 1, borderRightColor: colors.border}]}>
              <Text style={[styles.headerCell, {color: colors.textSecondary}]}>Parameters</Text>
            </View>
            <View style={[styles.headerCellContainer, {borderRightWidth: 1, borderRightColor: colors.border}]}>
              <Text style={[styles.headerCell, {color: colors.textSecondary}]}>Current</Text>
            </View>
            <View style={styles.headerCellContainer}>
              <Text style={[styles.headerCell, {color: colors.textSecondary}]}>Selected</Text>
            </View>
          </View>

          {/* Plan Name */}
          {showL2SPlanName && planNameDiffers && (
            <View style={[styles.tableRow, styles.planNameRow, {borderBottomColor: colors.border, borderLeftColor: colors.border, borderRightColor: colors.border, backgroundColor: '#F5F5F5'}]}>
              <View style={[styles.cellContainer, styles.parameterCellContainer, {borderRightWidth: 1, borderRightColor: colors.border}]}>
                <Text style={[styles.parameterCell, {color: colors.textSecondary}]}>Plan Name</Text>
              </View>
              <View style={[styles.cellContainer, {borderRightWidth: 1, borderRightColor: colors.border}]}>
                <Text style={[styles.currentCell, {color: colors.text}]}>
                  {currentPlanDetails?.name || currentPlanData?.current_plan || 'N/A'}
                </Text>
              </View>
              <View style={styles.cellContainer}>
                <Text style={[styles.newCell, {color: colors.primary, fontWeight: '600'}]}>
                  {selectedPlan.name}
                </Text>
              </View>
            </View>
          )}

          {/* Speed */}
          {speedDiffers && (
            <View style={[styles.tableRow, {borderBottomColor: colors.border, borderLeftColor: colors.border, borderRightColor: colors.border}]}>
              <View style={[styles.cellContainer, styles.parameterCellContainer, {borderRightWidth: 1, borderRightColor: colors.border}]}>
                <Text style={[styles.parameterCell, {color: colors.textSecondary}]}>Speed</Text>
              </View>
              <View style={[styles.cellContainer, {borderRightWidth: 1, borderRightColor: colors.border}]}>
                <Text style={[styles.currentCell, {color: colors.text}]}>
                  {currentSpeedFormatted}
                </Text>
              </View>
              <View style={styles.cellContainer}>
                <Text style={[styles.newCell, {color: colors.primary, fontWeight: '600'}]}>
                  {selectedSpeedFormatted}
                </Text>
              </View>
            </View>
          )}

          {/* Data */}
          {dataDiffers && (
            <View style={[styles.tableRow, {borderBottomColor: colors.border, borderLeftColor: colors.border, borderRightColor: colors.border}]}>
              <View style={[styles.cellContainer, styles.parameterCellContainer, {borderRightWidth: 1, borderRightColor: colors.border}]}>
                <Text style={[styles.parameterCell, {color: colors.textSecondary}]}>Data</Text>
              </View>
              <View style={[styles.cellContainer, {borderRightWidth: 1, borderRightColor: colors.border}]}>
                <Text style={[styles.currentCell, {color: colors.text}]}>
                  {currentPlanDetails?.limit === 'Unlimited'
                    ? 'Unlimited'
                    : `${currentPlanDetails?.limit || 'N/A'} GB`}
                </Text>
              </View>
              <View style={styles.cellContainer}>
                <Text style={[styles.newCell, {color: colors.primary, fontWeight: '600'}]}>
                  {selectedPlan.gbLimit === -1 ? 'Unlimited' : `${selectedPlan.gbLimit} GB`}
                </Text>
              </View>
            </View>
          )}

          {/* Validity */}
          {validityDiffers && (
            <View style={[styles.tableRow, {borderBottomColor: colors.border, borderLeftColor: colors.border, borderRightColor: colors.border}]}>
              <View style={[styles.cellContainer, styles.parameterCellContainer, {borderRightWidth: 1, borderRightColor: colors.border}]}>
                <Text style={[styles.parameterCell, {color: colors.textSecondary}]}>Validity</Text>
              </View>
              <View style={[styles.cellContainer, {borderRightWidth: 1, borderRightColor: colors.border}]}>
                <Text style={[styles.currentCell, {color: colors.text}]}>
                  {currentPlanDetails?.days ? `${currentPlanDetails.days} Days` : 'N/A'}
                </Text>
              </View>
              <View style={styles.cellContainer}>
                <Text style={[styles.newCell, {color: colors.primary, fontWeight: '600'}]}>
                  {selectedPlan.validity}
                </Text>
              </View>
            </View>
          )}

          {/* OTT */}
          {ottDiffers && (
            <View style={[styles.tableRow, {borderBottomColor: colors.border, borderLeftColor: colors.border, borderRightColor: colors.border}]}>
              <View style={[styles.cellContainer, styles.parameterCellContainer, {borderRightWidth: 1, borderRightColor: colors.border}]}>
                <Text style={[styles.parameterCell, {color: colors.textSecondary}]}>OTT</Text>
              </View>
              <View style={[styles.cellContainer, {borderRightWidth: 1, borderRightColor: colors.border}]}>
                <Text style={[styles.currentCell, {color: colors.text}]}>
                  {currentPlanDetails?.ott_plan?.toLowerCase() === 'yes' ||
                  (currentPlanDetails?.content_providers && currentPlanDetails.content_providers.length > 0)
                    ? 'Yes'
                    : 'No'}
                </Text>
              </View>
              <View style={styles.cellContainer}>
                <Text style={[styles.newCell, {color: colors.primary, fontWeight: '600'}]}>
                  {selectedPlan.ott_plan?.toLowerCase() === 'yes' ||
                  (selectedPlan.ottServices && selectedPlan.ottServices.length > 0)
                    ? 'Yes'
                    : 'No'}
                </Text>
              </View>
            </View>
          )}

          {/* VOIP – show only if values differ */}
          {voipDiffers && (
            <View style={[styles.tableRow, {borderBottomColor: colors.border, borderLeftColor: colors.border, borderRightColor: colors.border}]}>
              <View style={[styles.cellContainer, styles.parameterCellContainer, {borderRightWidth: 1, borderRightColor: colors.border}]}>
                <Text style={[styles.parameterCell, {color: colors.textSecondary}]}>VOIP</Text>
              </View>
              <View style={[styles.cellContainer, {borderRightWidth: 1, borderRightColor: colors.border}]}>
                <Text style={[styles.currentCell, {color: colors.text}]}>
                  {currentVoip ? 'Yes' : 'No'}
                </Text>
              </View>
              <View style={styles.cellContainer}>
                <Text style={[styles.newCell, {color: colors.primary, fontWeight: '600'}]}>
                  {selectedVoip ? 'Yes' : 'No'}
                </Text>
              </View>
            </View>
          )}

          {/* IPTV – show only if values differ */}
          {iptvDiffers && (
            <View style={[styles.tableRow, {borderBottomColor: colors.border, borderLeftColor: colors.border, borderRightColor: colors.border}]}>
              <View style={[styles.cellContainer, styles.parameterCellContainer, {borderRightWidth: 1, borderRightColor: colors.border}]}>
                <Text style={[styles.parameterCell, {color: colors.textSecondary}]}>IPTV</Text>
              </View>
              <View style={[styles.cellContainer, {borderRightWidth: 1, borderRightColor: colors.border}]}>
                <Text style={[styles.currentCell, {color: colors.text}]}>
                  {currentIptv ? 'Yes' : 'No'}
                </Text>
              </View>
              <View style={styles.cellContainer}>
                <Text style={[styles.newCell, {color: colors.primary, fontWeight: '600'}]}>
                  {selectedIptv ? 'Yes' : 'No'}
                </Text>
              </View>
            </View>
          )}

          {/* FUP – show only if values differ */}
          {fupDiffers && (
            <View style={[styles.tableRow, {borderBottomColor: colors.border, borderLeftColor: colors.border, borderRightColor: colors.border}]}>
              <View style={[styles.cellContainer, styles.parameterCellContainer, {borderRightWidth: 1, borderRightColor: colors.border}]}>
                <Text style={[styles.parameterCell, {color: colors.textSecondary}]}>FUP</Text>
              </View>
              <View style={[styles.cellContainer, {borderRightWidth: 1, borderRightColor: colors.border}]}>
                <Text style={[styles.currentCell, {color: colors.text}]}>
                  {currentFup ? 'Yes' : 'No'}
                </Text>
              </View>
              <View style={styles.cellContainer}>
                <Text style={[styles.newCell, {color: colors.primary, fontWeight: '600'}]}>
                  {selectedFup ? 'Yes' : 'No'}
                </Text>
              </View>
            </View>
          )}

          {/* Price */}
          {priceDiffers && (
            <View style={[styles.tableRow, {borderBottomColor: colors.border, borderLeftColor: colors.border, borderRightColor: colors.border}]}>
              <View style={[styles.cellContainer, styles.parameterCellContainer, {borderRightWidth: 1, borderRightColor: colors.border}]}>
                <Text style={[styles.parameterCell, {color: colors.textSecondary}]}>Price</Text>
              </View>
              <View style={[styles.cellContainer, {borderRightWidth: 1, borderRightColor: colors.border}]}>
                <Text style={[styles.currentCell, {color: colors.text}]}>
                  {formatCurrency(currentPlanPrice)}
                </Text>
              </View>
              <View style={styles.cellContainer}>
                <Text style={[styles.newCell, {color: colors.primary, fontWeight: '600'}]}>
                  {formatCurrency(selectedPlan.price)}
                </Text>
              </View>
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderSalesReturnDetails = () => {
    // console.log('=== RENDER SALES RETURN DEBUG ===');
    // console.log('salesReturnData:', salesReturnData);
    // console.log('salesReturnData?.pin_detail:', salesReturnData?.pin_detail);
    // console.log('salesReturnData?.pin_detail?.length:', salesReturnData?.pin_detail?.length);
    // console.log('=== END RENDER SALES RETURN DEBUG ===');
    
    if (!salesReturnData || !salesReturnData.pin_detail || salesReturnData.pin_detail.length === 0) {
      console.log('Returning null - no sales return data available');
      return null;
    }

    const pinDetail = salesReturnData.pin_detail[0];

    return (
      <View style={[styles.salesReturnCard, {backgroundColor: colors.card, shadowColor: colors.shadow}]}>
        <Text style={[styles.salesReturnTitle, {color: colors.text}]}>Refund Details</Text>
        
        <View style={styles.salesReturnRow}>
          <Text style={[styles.salesReturnLabel, styles.salesReturnLabelFixed, {color: colors.textSecondary}]}>
            Plan Name
          </Text>
          <Text style={[styles.salesReturnValue, styles.salesReturnValueWrap, {color: colors.text}]}>
            {pinDetail.planname || 'N/A'}
          </Text>
        </View>
        
        <View style={styles.salesReturnRow}>
          <Text style={[styles.salesReturnLabel, {color: colors.textSecondary}]}>Days Allocated</Text>
          <Text style={[styles.salesReturnValue, {color: colors.text}]}>
            {pinDetail.days_allocated || 0} Days
          </Text>
        </View>
        
        <View style={styles.salesReturnRow}>
          <Text style={[styles.salesReturnLabel, {color: colors.textSecondary}]}>Days Used</Text>
          <Text style={[styles.salesReturnValue, {color: colors.text}]}>
            {pinDetail.days_used || 0} Days
          </Text>
        </View>
        
        <View style={styles.salesReturnRow}>
          <Text style={[styles.salesReturnLabel, {color: colors.textSecondary}]}>Days Remaining</Text>
          <Text style={[styles.salesReturnValue, {color: colors.text}]}>
            {pinDetail.days_remaining || 0} Days
          </Text>
        </View>
        
        <View style={styles.salesReturnRow}>
          <Text style={[styles.salesReturnLabel, {color: colors.textSecondary}]}>Original Sale Amount</Text>
          <Text style={[styles.salesReturnValue, {color: colors.text}]}>
            {formatCurrency(parseFloat(pinDetail.sale_amount || 0))}
          </Text>
        </View>
        
        <View style={[styles.salesReturnRow, styles.refundRow]}>
          <Text style={[styles.salesReturnLabel, {color: colors.textSecondary, fontWeight: 'bold'}]}>Refund Amount</Text>
          <Text style={[styles.salesReturnValue, {color: colors.success, fontWeight: 'bold', fontSize: 16}]}>
            {formatCurrency(pinDetail.user_refund_amount || 0)}
          </Text>
        </View>
      </View>
    );
  };

  const renderCouponSelection = () => {
    if (!showDiscountCoupon && coupons.length === 0) {
      return null;
    }

    return (
      <View>
        {showDiscountCoupon && coupons.length > 0 && !complimentaryDiscountAvailable && (
          <View style={[styles.couponCard, {backgroundColor: colors.card, shadowColor: colors.shadow}]}>
            <Text style={[styles.couponTitle, {color: colors.text}]}> Coupons For You</Text>
        
            {coupons.map((coupon, index) => {
          let discountInfo = '';
          try {
            const discountJson = JSON.parse(coupon.discount_coupon_json || '{}');
            const discountType = discountJson.discount_option || 'flat';
            const discountValue = discountJson.discount_option_value || '0';
            discountInfo = `${discountType === 'flat' ? '₹' : ''}${discountValue}${discountType === 'percentage' ? '%' : ''} off`;
          } catch (error) {
            discountInfo = 'Discount available';
          }

          const isSelected = selectedCoupon && selectedCoupon.id === coupon.id;

              return (
                <TouchableOpacity
                  key={coupon.id || index}
                  style={[
                    styles.couponItem,
                    {borderColor: isSelected ? colors.primary : colors.border},
                    isSelected && {backgroundColor: colors.primary + '10'}
                  ]}
                  onPress={() => handleCouponSelect(coupon)}
                >
                  <View style={styles.couponContent}>
                    <View style={styles.couponLeft}>
                      <View style={styles.couponCodeRow}>
                        {getDiscountCode(coupon) && (
                          <Text style={[styles.couponCode, {color: isSelected ? colors.primary : colors.text}]} numberOfLines={1}>
                            {getDiscountCode(coupon)}
                          </Text>
                        )}
                        <Text style={[styles.couponPrice, {color: colors.success}]}>
                          {discountInfo}
                        </Text>
                      </View>
                      <View style={styles.campaignSection}>
                        <Text style={[styles.campaignHeading, {color: colors.textSecondary}]}>Campaign : </Text>
                        <Text style={[styles.couponDescription, {color: colors.textSecondary}]}>
                          {coupon.campaign_name || 'Coupon Description'}
                        </Text>
                      </View>
                    </View>
                    
                    {isSelected && (
                      <View style={[styles.selectedIndicator, {backgroundColor: colors.primary}]}>
                        <Text style={styles.selectedIndicatorText}>✓</Text>
                      </View>
                    )}
                  </View>
                  
                  <View style={styles.couponExpiryRow}>
                    <Text style={[styles.couponExpiry, {color: colors.textSecondary}]} numberOfLines={1}>
                      Valid till  {coupon.expiry_date || 'N/A'}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </View>
    )
  };

  const renderPaymentBreakdown = () => (
    <View style={[styles.paymentCard, {backgroundColor: colors.card, shadowColor: colors.shadow}]}>
      <Text style={[styles.paymentTitle, {color: colors.text}]}>{t('upgradePlan.paymentBreakdown')}</Text>
      
      <View style={styles.paymentRow}>
        <Text style={[styles.paymentLabel, {color: colors.textSecondary}]}>New Plan Price</Text>
        <Text style={[styles.paymentValue, {color: colors.text}]}>
          {formatCurrency(selectedPlan.price)}
        </Text>
      </View>
      
      {payDues > 0 && (
        <View style={styles.paymentRow}>
          <Text style={[styles.paymentLabel, {color: colors.textSecondary}]}>Outstanding Dues</Text>
          <Text style={[styles.paymentValue, {color: colors.error}]}>
            {formatCurrency(payDues)}
          </Text>
        </View>
      )}
      
      {salesReturnData && salesReturnData.pin_detail && salesReturnData.pin_detail.length > 0 && 
       salesReturnData.pin_detail[0].user_refund_amount > 0 && (
        <View style={styles.paymentRow}>
          <Text style={[styles.paymentLabel, {color: colors.textSecondary}]}>Refund Credit</Text>
          <Text style={[styles.paymentValue, {color: colors.success}]}>
            -{formatCurrency(salesReturnData.pin_detail[0].user_refund_amount)}
          </Text>
        </View>
      )}
      
      {appliedDiscount > 0 && (
        <View style={styles.paymentRow}>
          <Text style={[styles.paymentLabel, {color: colors.textSecondary}]}>
            {complimentaryDiscountAvailable
              ? 'Complimentary Discount'
              : 'Coupon Discount'}
          </Text>
          <Text style={[styles.paymentValue, {color: colors.success}]}>
            -{formatCurrency(appliedDiscount)}
          </Text>
        </View>
      )}
      
      <View style={[styles.paymentRow, styles.totalRow]}>
        <Text style={[styles.paymentLabel, {color: colors.text, fontWeight: 'bold'}]}>Final Amount</Text>
        <Text style={[styles.paymentValue, {color: colors.primary, fontWeight: 'bold', fontSize: 18}]}>
          {formatCurrency(calculateFinalAmount())}
        </Text>
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, {backgroundColor: colors.background}]}>
        <CommonHeader navigation={navigation} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, {color: colors.textSecondary}]}>
            Loading upgrade details...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, {backgroundColor: colors.background}]}>
      <CommonHeader navigation={navigation} />
      
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Page Title */}
          <View style={styles.titleSection}>
            <Text style={[styles.pageTitle, {color: colors.text}]}>Upgrade Confirmation</Text>
            <Text style={[styles.pageSubtitle, {color: colors.textSecondary}]}>
              Review your plan upgrade details
            </Text>
          </View>

          {/* Plan Summary Card - Matching RenewPlanScreen */}
          <View style={[styles.planCardNew, {borderColor: colors.border, backgroundColor: colors.card}]}>
            <View style={styles.planCardContent}>
              <View style={styles.planCardTopRow}>
                <View style={styles.planCardLeft}>
                  {showL2SPlanName ? (
                    <>
                      <Text style={[styles.planNameNew, {color: colors.text}]}>
                        {selectedPlan.name}
                      </Text>
                      {selectedPlan.description && (
                        <Text style={[styles.planDescriptionNew, {color: colors.textSecondary}]}>
                          {selectedPlan.description}
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
                          <Text style={[styles.planNameNew, {color: colors.text}]}>
                            {formatSpeed(selectedPlan.speed)}
                          </Text>
                          <Text style={styles.metricSubtitle} numberOfLines={1}>
                            {getUsageSubtitle(selectedPlan.gbLimit === -1 ? 'Unlimited' : `${selectedPlan.gbLimit}`)}
                          </Text>
                        </View>
                        <View style={styles.metricHeadlineCol}>
                          <Text style={[styles.planNameNew, {color: colors.text}]}>
                            {selectedPlan.validity}
                          </Text>
                          <Text style={styles.metricSubtitle}>validity</Text>
                        </View>
                        {selectedPlan.ottServices &&
                          Array.isArray(selectedPlan.ottServices) &&
                          selectedPlan.ottServices.length > 0 && (
                            <View style={styles.metricHeadlineCol}>
                              <Text style={[styles.planNameNew, {color: colors.text}]}>
                                {selectedPlan.ottServices.length}
                              </Text>
                              <Text style={styles.metricSubtitle}>OTTs</Text>
                            </View>
                          )}
                        {selectedPlan.fup_flag?.toLowerCase() === 'yes' && (
                          <View style={styles.metricHeadlineCol}>
                            <Text style={[styles.planNameNew, {color: colors.text}]}>FUP</Text>
                            <Text style={styles.metricSubtitle}>Yes</Text>
                          </View>
                        )}
                        {selectedPlan.voice_plan?.toLowerCase() === 'yes' && (
                          <View style={styles.metricHeadlineCol}>
                            <Text style={[styles.planNameNew, {color: colors.text}]}>VOIP</Text>
                            <Text style={styles.metricSubtitle}>Yes</Text>
                          </View>
                        )}
                        {selectedPlan.iptv?.toLowerCase() === 'yes' && (
                          <View style={styles.metricHeadlineCol}>
                            <Text style={[styles.planNameNew, {color: colors.text}]}>IPTV</Text>
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
                            <Text style={[styles.speedValidityLabel, styles.speedValidityLabelLarge, {color: colors.textSecondary}]}>
                              Speed
                            </Text>
                            <Text style={[styles.speedValidityValue, styles.speedValidityValueLarge, {color: colors.text}]}>
                              {formatSpeed(selectedPlan.speed)}
                            </Text>
                          </View>

                          {/* Validity column */}
                          <View style={styles.speedValidityCol}>
                            <Text style={[styles.speedValidityLabel, styles.speedValidityLabelLarge, {color: colors.textSecondary}]}>
                              Validity
                            </Text>
                            <Text style={[styles.speedValidityValue, styles.speedValidityValueLarge, {color: colors.text}]}>
                              {selectedPlan.validity}
                            </Text>
                          </View>

                          {/* OTTs column */}
                          {selectedPlan.ottServices &&
                            Array.isArray(selectedPlan.ottServices) &&
                            selectedPlan.ottServices.length > 0 && (
                              <View style={styles.speedValidityCol}>
                                <Text style={[styles.speedValidityLabel, styles.speedValidityLabelLarge, {color: colors.textSecondary}]}>
                                  OTTs
                                </Text>
                                <Text style={[styles.speedValidityValue, styles.speedValidityValueLarge, {color: colors.text}]}>
                                  {selectedPlan.ottServices.length}
                                </Text>
                              </View>
                            )}

                          {/* VOICE column */}
                          {selectedPlan.voice_plan?.toLowerCase() === 'yes' && (
                            <View style={styles.speedValidityCol}>
                              <Text style={[styles.speedValidityLabel, styles.speedValidityLabelLarge, {color: colors.textSecondary}]}>
                                VOICE
                              </Text>
                              <Text style={[styles.speedValidityValue, styles.speedValidityValueLarge, {color: colors.text}]}>
                                Yes
                              </Text>
                            </View>
                          )}

                          {/* IPTV column */}
                          {selectedPlan.iptv?.toLowerCase() === 'yes' && (
                            <View style={styles.speedValidityCol}>
                              <Text style={[styles.speedValidityLabel, styles.speedValidityLabelLarge, {color: colors.textSecondary}]}>
                                IPTV
                              </Text>
                              <Text style={[styles.speedValidityValue, styles.speedValidityValueLarge, {color: colors.text}]}>
                                Yes
                              </Text>
                            </View>
                          )}

                          {/* FUP column */}
                          {selectedPlan.fup_flag?.toLowerCase() === 'yes' && (
                            <View style={styles.speedValidityCol}>
                              <Text style={[styles.speedValidityLabel, styles.speedValidityLabelLarge, {color: colors.textSecondary}]}>
                                FUP
                              </Text>
                              <Text style={[styles.speedValidityValue, styles.speedValidityValueLarge, {color: colors.text}]}>
                                Yes
                              </Text>
                            </View>
                          )}
                        </View>
                      </ScrollView>
                    </View>
                  )}

                  {/* OTT strip inside the left block (same behavior as RenewPlanScreen) */}
                  {selectedPlan.ottServices && Array.isArray(selectedPlan.ottServices) && selectedPlan.ottServices.length > 0 && (
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
                          showsHorizontalScrollIndicator={false}
                          contentContainerStyle={styles.ottLogosScrollContainer}
                          style={styles.ottLogosScrollView}
                          nestedScrollEnabled={true}>
                          {selectedPlan.ottServices.map((provider: any, index: number) => (
                            <View key={index} style={styles.ottLogoItem}>
                              <View style={styles.ottLogoWrapper}>
                                {renderOTTIcon(provider)}
                              </View>
                              <Text style={[styles.ottServiceName, {color: colors.textSecondary}]} numberOfLines={1}>
                                {provider.content_provider || provider || 'OTT'}
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

                {/* Right: full-height grey price strip */}
                <View style={styles.planCardRight}>
                  <View style={styles.planPriceBlock}>
                    <Text style={[styles.planPriceNew, {color: colors.primary}]}>
                      {formatCurrency(selectedPlan.price || 0)}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* Plan Comparison */}
          {renderPlanComparison()}

          {/* Sales Return Details */}
          {renderSalesReturnDetails()}

          {/* Coupon Selection */}
          {renderCouponSelection()}

          {/* Payment Breakdown */}
          {renderPaymentBreakdown()}

          {/* High Speed Plan Note (if configured in settings) */}
          {highSpeedPlanNote && (
            <View style={[styles.noteCard, styles.highSpeedNoteCard, {backgroundColor: '#E3F2FD', shadowColor: colors.shadow}]}> 
              <Text style={[styles.noteText, styles.highSpeedNoteText, {color: '#1976D2'}]}>{highSpeedPlanNote}</Text>
            </View>
          )}

          {/* Upgrade Activation Note */}
          <View
            style={[
              styles.noteCard,
              {backgroundColor: '#FFF8E1', shadowColor: colors.shadow},
            ]}>
            <Text
              style={[
                styles.noteText,
                {color: colors.textSecondary},
              ]}>
              Note: The new plan will activate immediately after the payment is
              completed.
            </Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.cancelButton, {backgroundColor: colors.card, borderColor: colors.border}]}
              onPress={handleCancel}>
              <Text style={[styles.cancelButtonText, {color: colors.text}]}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.confirmButton, {backgroundColor: colors.primary}]}
              onPress={handleConfirmUpgrade}
              disabled={isLoading}>
              <Text style={[styles.confirmButtonText, {color: '#ffffff'}]}>
                {isLoading
                  ? 'Processing...'
                  : `Pay ${formatCurrency(calculateFinalAmount())}`}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Payment Gateway Modal (same UX as PlanConfirmationScreen) */}
      <Modal
        visible={showPaymentModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPaymentModal(false)}>
        <TouchableWithoutFeedback onPress={() => setShowPaymentModal(false)}>
          <View style={{flex: 1, backgroundColor: 'rgba(0,0,0,0.4)'}} />
        </TouchableWithoutFeedback>
        <View style={[styles.paymentModalContainer, {backgroundColor: colors.card, shadowColor: colors.shadow}]}>
          <Text style={[styles.paymentModalTitle, {color: colors.text}]}>Select Payment Gateway</Text>

          {loadingGateways ? (
            <Text style={[styles.loadingText, {color: colors.textSecondary}]}>{t('common.loading') || 'Loading...'}</Text>
          ) : gatewayError ? (
            <Text style={[styles.errorText, {color: colors.error}]}>{gatewayError}</Text>
          ) : paymentGateways.length === 0 ? (
            <Text style={[styles.noGatewaysText, {color: colors.textSecondary}]}>
              {t('planConfirmation.noGateways') || 'No gateways available'}
            </Text>
          ) : (
            paymentGateways.map((gateway: any) => (
              <TouchableOpacity
                key={gateway.id}
                style={[
                  styles.gatewayOption,
                  {backgroundColor: selectedGateway === gateway.id ? colors.primaryLight : colors.border},
                  selectedGateway === gateway.id && {borderColor: colors.primary, borderWidth: 1},
                ]}
                onPress={() => setSelectedGateway(gateway.id)}>
                <Text
                  style={[
                    styles.gatewayLabel,
                    {color: selectedGateway === gateway.id ? colors.primary : colors.text},
                  ]}>
                  {gateway.gw_display_name}
                </Text>
                {selectedGateway === gateway.id && (
                  <Text style={[styles.selectedIcon, {color: colors.primary}]}>✓</Text>
                )}
              </TouchableOpacity>
            ))
          )}

          <TouchableOpacity
            style={[
              styles.paymentGatewayButton,
              {backgroundColor: selectedGateway ? colors.primary : colors.border},
            ]}
            disabled={!selectedGateway}
            onPress={handleGatewayPay}>
            <Text
              style={[
                styles.paymentGatewayButtonText,
                {color: selectedGateway ? '#fff' : colors.textSecondary},
              ]}>
              {`Pay ${formatCurrency(calculateFinalAmount())} ${
                selectedGateway
                  ? `with ${
                      paymentGateways.find(g => g.id === selectedGateway)
                        ?.gw_display_name
                    }`
                  : ''
              }`}
            </Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  titleSection: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  pageSubtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  comparisonCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  comparisonTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  comparisonTable: {
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
  },
  headerCellContainer: {
    flex: 1,
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  headerCell: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
  },
  planNameRow: {
    backgroundColor: '#F5F5F5',
  },
  cellContainer: {
    flex: 1,
    paddingVertical: 4,
    paddingHorizontal: 4,
    justifyContent: 'center',
  },
  parameterCellContainer: {
    flex: 1.2,
  },
  parameterCell: {
    fontSize: 12,
    textAlign: 'left',
  },
  currentCell: {
    fontSize: 12,
    textAlign: 'left',
  },
  newCell: {
    fontSize: 12,
    textAlign: 'left',
  },
  planCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  planInfo: {
    flex: 1,
  },
  planName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  planPrice: {
    fontSize: 14,
    fontWeight: '500',
  },
  planStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  planStatusText: {
    fontSize: 10,
    fontWeight: 'bold',
  },

  planFeatures: {
    gap: 12,
  },
  planFeaturesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  planFeature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureItem: {
    flex: 1,
    minWidth: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  featureIcon: {
    fontSize: 16,
    width: 20,
    textAlign: 'center',
  },
  featureLabel: {
    fontSize: 12,
    flex: 1,
  },
  featureValue: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'right',
    flex: 1,
  },
  arrowContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowIcon: {
    fontSize: 24,
  },
  salesReturnCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  salesReturnTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  salesReturnRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 8,
  },
  salesReturnLabel: {
    fontSize: 14,
  },
  salesReturnLabelFixed: {
    width: '42%',
    paddingRight: 8,
  },
  salesReturnValue: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'right',
  },
  salesReturnValueWrap: {
    width: '58%',
    flexShrink: 1,
  },
  refundRow: {
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    marginTop: 8,
    paddingTop: 16,
  },
  couponCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 3,
  },
  couponTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  couponItem: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    position: 'relative',
  },
  couponContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  couponLeft: {
    flex: 1,
    marginRight: 12,
  },
  couponCodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  couponCode: {
    fontSize: 15,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  couponPrice: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  couponDescription: {
    fontSize: 11,
    color: '#666',
  },
  campaignSection: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  campaignHeading: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 2,
  },
  couponExpiryRow: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  couponExpiry: {
    fontSize: 10,
    fontStyle: 'italic',
    textAlign: 'right',
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
    fontSize: 14,
    fontWeight: 'bold',
  },
  paymentCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  paymentTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  paymentLabel: {
    fontSize: 14,
  },
  paymentValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    marginTop: 8,
    paddingTop: 16,
  },
  termsCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  termsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  termsText: {
    fontSize: 14,
    lineHeight: 20,
  },
  noteCard: {
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#FFE082',
  },
  noteText: {
    fontSize: 12,
    lineHeight: 18,
  },
  highSpeedNoteCard: {
    borderColor: '#90CAF9',
  },
  highSpeedNoteText: {
    fontWeight: '500',
  },
  paymentModalContainer: {
    position: 'absolute',
    left: 20,
    right: 20,
    top: '30%',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 10,
  },
  paymentModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  gatewayOption: {
    width: '100%',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  gatewayLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  paymentGatewayButton: {
    width: '100%',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  paymentGatewayButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  errorText: {
    marginVertical: 20,
  },
  noGatewaysText: {
    marginVertical: 20,
  },
  selectedIcon: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
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
  // Plan Card Styles (matching RenewPlanScreen)
  planCardNew: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 8,
    minHeight: 124, // allow the card to grow with content (like RenewPlanScreen)
    overflow: 'visible',
    marginBottom: 16,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
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
  planCardLeft: {
    flex: 1,
    marginRight: 0,
  },
  planCardRight: {
    width: 101.01,
    alignItems: 'stretch',
    justifyContent: 'center',
    marginLeft: 0,
    alignSelf: 'stretch',
    backgroundColor: '#F9F9F9',        // full-height grey strip (match RenewPlanScreen)
    borderTopRightRadius: 10,
    borderBottomRightRadius: 10,
  },
  planVerticalSeparator: {
    width: 1,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 8,
    alignSelf: 'stretch',
  },
  planNameNew: {
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'Inter',
    color: '#000000',
    marginTop: 4,      // add space below any heading/tag
    marginBottom: 2,
    paddingLeft: 6,    // align with plan content columns like RenewPlanScreen
  },
  planDescriptionNew: {
    fontSize: 11,
    fontWeight: '400',
    marginBottom: 8,
    lineHeight: 14,
    paddingLeft: 6,    // keep description aligned with plan name/content
  },
  planPriceNew: {
    fontSize: 16,
    fontFamily: 'Inter',
    fontWeight: '600',
    marginBottom: 4,
  },
  planPriceBlock: {
    width: 101.01,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 10,
    flex: 1,
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
    flexShrink: 0,
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
    maxHeight: 50,
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
  },
  ottLogoWrapper: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  ottLogoNew: {
    width: 30,
    height: 30,
  },
  ottIconNew: {
    fontSize: 24,
  },
  ottServiceName: {
    fontSize: 10,
    fontFamily: 'Inter',
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 12,
    maxWidth: 55,
  },
});

export default UpgradePlanConfirmationScreen; 