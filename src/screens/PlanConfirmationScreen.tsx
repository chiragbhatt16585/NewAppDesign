import React, {useEffect, useMemo} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  TouchableWithoutFeedback,
  Image,
  ActivityIndicator,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useTheme} from '../utils/ThemeContext';
import {getThemeColors} from '../utils/themeStyles';
import CommonHeader from '../components/CommonHeader';
import {useTranslation} from 'react-i18next';
import { handlePayment } from '../services/commonfunction';
import { getClientConfig } from '../config/client-config';
import sessionManager from '../services/sessionManager';
import { apiService } from '../services/api';
import { credentialStorage } from '../services/credentialStorage';
import useMenuSettings from '../hooks/useMenuSettings';

interface PlanData {
  id: string;
  name: string;
  description?: string;
  speed: string;
  upload: string;
  download: string;
  validity: string;
  price: number;
  baseAmount: number;
  cgst: number;
  sgst: number;
  mrp: number;
  dues: number;
  gbLimit: number;
  isCurrentPlan: boolean;
  ottServices?: string[];
  ott_plan?: string;
  voice_plan?: string;
  iptv?: string;
  fup_flag?: string;
}

/** selfcareMenuSettings may return a bare array or an object wrapping the list. */
function normalizeMenuItems(raw: any): any[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw.data)) return raw.data;
  if (Array.isArray(raw.menu)) return raw.menu;
  if (Array.isArray(raw.menu_items)) return raw.menu_items;
  if (Array.isArray(raw.items)) return raw.items;
  return [];
}

/**
 * Blue info note on Plan Confirmation: text comes from Renew Plan → display_option_json,
 * not from detecting "high speed" on the plan object. Supports common key aliases.
 */
function extractRenewPlanHighSpeedNote(parsed: any): string {
  if (!parsed || typeof parsed !== 'object') return '';
  const dps =
    parsed.display_plan_settings ||
    parsed.displayPlanSettings ||
    parsed.display_plan_setting ||
    {};
  const candidates = [
    dps.high_speed_plan_note,
    dps.high_speed_router_note,
    dps.router_note,
    dps.highSpeedPlanNote,
    parsed.high_speed_plan_note,
    parsed.high_speed_router_note,
  ];
  for (const c of candidates) {
    if (typeof c === 'string' && c.trim()) return c.trim();
  }
  return '';
}

const PlanConfirmationScreen = ({navigation, route}: any) => {
  const {isDark} = useTheme();
  const colors = getThemeColors(isDark);
  const {t} = useTranslation();
  const {selectedPlan, totalAmount, admin_login_id: adminLoginId} = route.params;
  const { menu } = useMenuSettings();

  // Extra state for comparison with current plan (like UpgradePlanConfirmation)
  const [currentPlanData, setCurrentPlanData] = React.useState<any>(null);
  const [currentPlanDetails, setCurrentPlanDetails] = React.useState<any>(null);
  const [loadingComparison, setLoadingComparison] = React.useState<boolean>(false);
  
  // // Debug: Log the values we receive
  // console.log('=== PLAN CONFIRMATION SCREEN INIT ===');
  // console.log('selectedPlan:', selectedPlan);
  // console.log('totalAmount from route:', totalAmount);
  // console.log('selectedPlan.mrp:', selectedPlan?.mrp);
  // console.log('selectedPlan.dues:', selectedPlan?.dues);
  
  // Check if totalAmount matches what we expect
  const expectedTotal = (selectedPlan?.mrp || 0) + (selectedPlan?.dues || 0);
  // console.log('Expected total (mrp + dues):', expectedTotal);
  // console.log('totalAmount matches expected:', totalAmount === expectedTotal);
  // console.log('=== END INIT DEBUG ===');

  const [showPaymentModal, setShowPaymentModal] = React.useState(false);
  const [selectedGateway, setSelectedGateway] = React.useState('');
  const [paymentGateways, setPaymentGateways] = React.useState<any[]>([]);
  const [loadingGateways, setLoadingGateways] = React.useState(false);
  const [gatewayError, setGatewayError] = React.useState('');
  const [adminLoginIdState, setAdminLoginIdState] = React.useState(adminLoginId);
  const [coupons, setCoupons] = React.useState<any[]>([]);
  const [selectedCoupon, setSelectedCoupon] = React.useState<any>(null);
  const [couponDiscount, setCouponDiscount] = React.useState(0);
  const [complimentaryDiscountResponse, setComplimentaryDiscountResponse] = React.useState<any>(null);
  const [complimentaryDiscountError, setComplimentaryDiscountError] = React.useState<string>('');
  const [isAccountActive, setIsAccountActive] = React.useState<boolean>(false);

  const toNumber = (value: any): number => {
    if (value === null || value === undefined) return 0;
    if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
    const cleaned = String(value).replace(/[^0-9.-]/g, '');
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : 0;
  };

  const isTruthyValue = (value: any): boolean => {
    if (value === true) return true;
    if (value === false || value === null || value === undefined) return false;
    if (typeof value === 'number') return value !== 0;
    if (typeof value === 'string') {
      const s = value.trim().toLowerCase();
      if (!s) return false;
      return s === 'yes' || s === 'y' || s === 'true' || s === '1';
    }
    return Boolean(value);
  };

  const complimentaryDiscountAvailable = isTruthyValue(
    complimentaryDiscountResponse?.data?.disc_available,
  );
  const complimentaryDiscountAmount = complimentaryDiscountAvailable
    ? toNumber(complimentaryDiscountResponse?.data?.disc_value)
    : 0;
  const appliedDiscount = complimentaryDiscountAvailable
    ? complimentaryDiscountAmount
    : couponDiscount;

  const getUsageSubtitle = (limit: string | undefined): string => {
    if (!limit) return '';
    const lower = limit.toLowerCase();
    if (lower === 'unlimited') return 'unlimited usage';
    return `${limit} GB`;
  };

  // Read display_option_json settings for "Renew Plan" menu to control plan name visibility
  // and whether to blend plan params (speed/validity/OTTs) into the header row.
  // The high-speed / router note is static text from menu JSON (not inferred from plan speed).
  const { showL2SPlanName, showPlanParamsBlend, showDiscountCoupon, highSpeedPlanNote } = useMemo(() => {
    let result = {
      showL2SPlanName: true,
      showPlanParamsBlend: false,
      showDiscountCoupon: false,
      highSpeedPlanNote: '',
    };
    try {
      const menuItems = normalizeMenuItems(menu);
      if (!menuItems.length) return result;
      const renewMenu = menuItems.find((m: any) => {
        const label = String(m?.menu_label || '').trim().toLowerCase();
        if (label === 'renew plan') return true;
        const key = String(m?.menu_key || m?.menu_slug || '').trim().toLowerCase();
        return key === 'renew_plan' || key === 'renewplan';
      });
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
      const rawDiscountCouponFlag = parsed?.display_plan_settings?.discount_coupen;

      let nameFlag = true;
      let blendFlag = false;
      let discountCouponFlag = false;
      const noteText = extractRenewPlanHighSpeedNote(parsed);

      if (typeof rawNameFlag === 'boolean') nameFlag = rawNameFlag;
      else if (typeof rawNameFlag === 'string') nameFlag = rawNameFlag.toLowerCase() === 'true';

      if (typeof rawBlendFlag === 'boolean') blendFlag = rawBlendFlag;
      else if (typeof rawBlendFlag === 'string') blendFlag = rawBlendFlag.toLowerCase() === 'true';

      if (typeof rawDiscountCouponFlag === 'boolean') discountCouponFlag = rawDiscountCouponFlag;
      else if (typeof rawDiscountCouponFlag === 'string') discountCouponFlag = rawDiscountCouponFlag.toLowerCase() === 'true';

      return {
        showL2SPlanName: nameFlag,
        showPlanParamsBlend: blendFlag,
        showDiscountCoupon: discountCouponFlag,
        highSpeedPlanNote: noteText,
      };
    } catch {
      return result;
    }
  }, [menu]);

  useEffect(() => {
    loadCoupons();
  }, []);

  // Load current plan info only when comparing with a different plan
  useEffect(() => {
    const loadCurrentPlanForComparison = async () => {
      try {
        if (selectedPlan?.isCurrentPlan) {
          setLoadingComparison(false);
          return;
        }

        setLoadingComparison(true);
        const session = await sessionManager.getCurrentSession();
        if (!session?.username) {
          setLoadingComparison(false);
          return;
        }

        // Get auth data to know current plan name and admin id
        const authResponse = await apiService.authUser(session.username);
        setCurrentPlanData(authResponse);

        const currentPlanName = authResponse?.current_plan || authResponse?.current_plan1;
        if (!currentPlanName || !authResponse?.admin_login_id) {
          setLoadingComparison(false);
          return;
        }

        // Get current plan details from planList (same as UpgradePlanConfirmation)
        const taxInfo = await apiService.getAdminTaxInfo(authResponse.admin_login_id, 'default');
        const isShowAllPlan = taxInfo?.isShowAllPlan || false;

        const planList = await apiService.planList(
          authResponse.admin_login_id,
          session.username,
          currentPlanName,
          isShowAllPlan,
          false,
          'default',
        );

        const currentPlan = planList?.find((plan: any) =>
          plan.name === currentPlanName ||
          plan.name === authResponse?.current_plan ||
          plan.name === authResponse?.current_plan1,
        );

        setCurrentPlanDetails(currentPlan || null);
      } catch (e) {
        // Silent fail – comparison will just not show
      } finally {
        setLoadingComparison(false);
      }
    };

    loadCurrentPlanForComparison();
  }, [selectedPlan]);

  // Fetch user's account status (Active/Inactive/etc.)
  useEffect(() => {
    (async () => {
      try {
        const session = await sessionManager.getCurrentSession();
        if (session?.username) {
          const authData = await apiService.authUser(session.username);
          const statusCandidates: any[] = [
            authData?.account_status,
            authData?.status,
            authData?.accountStatus,
            authData?.user_status,
            authData?.userStatus,
            authData?.service_status,
            authData?.serviceStatus,
            authData?.active_status,
            authData?.is_active,
          ];
          let active = false;
          for (const val of statusCandidates) {
            if (typeof val === 'boolean' && val) { active = true; break; }
            if (typeof val === 'number' && val === 1) { active = true; break; }
            if (typeof val === 'string') {
              const s = val.trim().toLowerCase();
              if (s === 'active' || s === 'a' || s === 'enabled') { active = true; break; }
            }
          }
          setIsAccountActive(active);
        }
      } catch (e) {
        // Silent fail; note will simply not render
      }
    })();
  }, []);

  const loadCoupons = async () => {
    try {
      const clientConfig = getClientConfig();
      const realm = clientConfig.clientId;

      // First call complimentary discount API (as requested before coupon display)
      try {
        const session = await sessionManager.getCurrentSession();
        const username = session?.username || '';
        const planname = selectedPlan?.name || '';
        const admin_login_id = String(adminLoginIdState || adminLoginId || '');

        if (username && planname && admin_login_id) {
          const complimentaryResponse = await apiService.getComplimentaryDiscountValue(
            {
              username,
              planname,
              admin_login_id,
              request_source: 'app',
              request_app: 'user_app',
            },
            realm,
          );
          setComplimentaryDiscountResponse(complimentaryResponse);
          setComplimentaryDiscountError('');
          const isDiscountAvailable = isTruthyValue(
            complimentaryResponse?.data?.disc_available,
          );
          if (isDiscountAvailable) {
            // If complimentary discount is available, skip coupon flow.
            setCoupons([]);
            setSelectedCoupon(null);
            setCouponDiscount(0);
            return;
          }
        } else {
          setComplimentaryDiscountError(
            'Missing required params for selfcareGetComplimentaryDiscountValue',
          );
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
      }
      
      // DEBUG: Print parameters being sent to coupon API
      console.log('=== PLAN CONFIRMATION COUPON API REQUEST PARAMS ===');
      console.log('realm (clientId):', realm);

      const couponData = await apiService.getCouponCode(realm);

      // DEBUG: Print full coupon API response in console
      console.log('=== PLAN CONFIRMATION COUPON API RESPONSE START ===');
      console.log('Raw couponData:', couponData);
      try {
        console.log('CouponData JSON:', JSON.stringify(couponData, null, 2));
      } catch (e) {
        console.log('Error stringifying couponData:', e);
      }
      console.log('=== PLAN CONFIRMATION COUPON API RESPONSE END ===');

      setCoupons(couponData || []);
    } catch (error) {
      console.error('Error fetching coupons:', error);
      setCoupons([]);
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
  const calculateTotalAmount = (plan: PlanData): number => {
    const baseAmount = plan.baseAmount || plan.price || 0;
    const cgst = plan.cgst || 0;
    const sgst = plan.sgst || 0;
    const total = baseAmount + cgst + sgst;
    return Math.round(total);
  };

  const calculateFinalAmount = () => {
    // Calculate total amount with taxes (baseAmount + CGST + SGST)
    const planTotal = calculateTotalAmount(selectedPlan);
    
    // Add dues
    const totalWithDues = planTotal + (selectedPlan?.dues || 0);
    
    // Subtract complimentary discount (if available), otherwise coupon discount.
    const finalAmount = totalWithDues - appliedDiscount;
    
    // console.log('=== CALCULATE FINAL AMOUNT DEBUG ===');
    // console.log('baseAmount:', selectedPlan?.baseAmount);
    // console.log('cgst:', selectedPlan?.cgst);
    // console.log('sgst:', selectedPlan?.sgst);
    // console.log('planTotal (with taxes):', planTotal);
    // console.log('dues:', selectedPlan?.dues);
    // console.log('totalWithDues:', totalWithDues);
    // console.log('couponDiscount:', couponDiscount);
    // console.log('Final amount after discount:', finalAmount);
    // console.log('=== END CALCULATE FINAL AMOUNT DEBUG ===');
    
    return Math.max(0, finalAmount);
  };

  const formatCurrency = (amount: number) => {
    const rounded = Math.round(amount || 0);
    const withCommas = rounded
      .toString()
      .replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return `₹${withCommas}`;
  };

  const renderPlanComparison = () => {
    if (selectedPlan?.isCurrentPlan) {
      return null;
    }

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

    if (!currentPlanDetails) {
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

  const getOTTIcon = (service: string) => {
    switch (service.toLowerCase()) {
      case 'netflix':
        return '🎬';
      case 'amazon prime':
        return '📺';
      case 'disney+ hotstar':
        return '⭐';
      case 'jiocinema':
        return '🎭';
      case 'sonyliv':
        return '📡';
      default:
        return '🎬';
    }
  };

  const handleCouponSelect = (coupon: any) => {
    if (selectedCoupon && selectedCoupon.id === coupon.id) {
      // Deselect if same coupon is clicked
      setSelectedCoupon(null);
      setCouponDiscount(0);
      console.log('Coupon deselected, discount reset to 0');
    } else {
      // Select new coupon
      setSelectedCoupon(coupon);
      
      // Calculate discount based on coupon
      try {
        const discountJson = JSON.parse(coupon.discount_coupon_json || '{}');
        const discountValue = parseFloat(discountJson.discount_option_value || '0');
        setCouponDiscount(discountValue);
        
        // console.log('=== COUPON SELECTION DEBUG ===');
        // console.log('Selected Coupon:', coupon);
        // console.log('Discount JSON:', discountJson);
        // console.log('Discount Value:', discountValue);
        // console.log('Original Amount:', totalAmount);
        // console.log('Final Amount:', totalAmount - discountValue);
        // console.log('=== END COUPON DEBUG ===');
      } catch (error) {
        console.error('Error parsing coupon discount:', error);
        setCouponDiscount(0);
      }
    }
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



  const handleConfirmPayment = async () => {
    setLoadingGateways(true);
    setGatewayError('');
    setPaymentGateways([]);
    
    try {
      // First, check if user is logged in
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

      // console.log('=== PAYMENT GATEWAY DEBUG ===');
      // console.log('Current session username:', session.username);
      // console.log('Session isLoggedIn:', session.isLoggedIn);
      
      let adminId = adminLoginIdState;
      if (!adminId) {
        console.log('No admin_login_id provided, fetching from authUser...');
        // Fallback: fetch from authUser if not provided
        try {
                     const authData = await apiService.authUser(session.username);
           adminId = authData.admin_login_id;
           setAdminLoginIdState(adminId);
           console.log('Admin ID fetched from authUser:', adminId);
        } catch (e: any) {
          console.error('Failed to fetch admin ID:', e);
          setGatewayError('Could not determine admin. Please try again.');
          setLoadingGateways(false);
          return;
        }
      }

      // Check if we have stored credentials for token regeneration
      const creds = await credentialStorage.getCredentials();
      if (!creds) {
        console.log('No stored credentials found - this may cause token regeneration issues');
      } else {
        console.log('Stored credentials found for user:', creds.username);
      }

      const clientConfig = getClientConfig();
      const realm = clientConfig.clientId;
      console.log('Using realm:', realm);
      console.log('Using admin ID:', adminId);
      
      const gateways = await apiService.paymentGatewayOptions(adminId, realm);
      console.log('Payment gateways fetched successfully:', gateways?.length || 0);
      
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
      console.error('Payment gateway fetch error:', err);
      
      // Provide more specific error messages
      if (err.message?.includes('Invalid User')) {
        setGatewayError('Your session has expired. Please login again to continue.');
      } else if (err.message?.includes('network')) {
        setGatewayError('Network error. Please check your internet connection and try again.');
      } else {
        setGatewayError(err.message || 'Failed to load payment gateways. Please try again.');
      }
    } finally {
      setLoadingGateways(false);
    }
  };

  // Shared payment processing function
  const processPayment = async (gatewayObj: any) => {
    // Get username from current session
    const session = await sessionManager.getCurrentSession();
    if (!session || !session.username) {
      Alert.alert('Error', 'Please login again to continue with payment.');
      return;
    }
    
    const clientConfig = getClientConfig();
    const realm = clientConfig.clientId;
    
    // Calculate final amount with coupon discount
    const finalAmount = calculateFinalAmount();
    
    const params = {
      amount: finalAmount, // Use calculated amount (mrp + dues)
      adminname: adminLoginId,
      username: session.username, // Use username from session instead of route.params
      planname: selectedPlan.name,
      selectedPGType: [{ label: gatewayObj.gw_display_name, value: gatewayObj.id }],
      payActionType: 'renewal',
      // Add coupon information for backend processing
      couponCode: complimentaryDiscountAvailable
        ? null
        : (selectedCoupon ? getDiscountCode(selectedCoupon) : null),
      campaignCode: complimentaryDiscountAvailable
        ? null
        : (selectedCoupon?.campaign_code || null),
      couponDiscount: appliedDiscount,
      // Merchant API expects the policy discount rupee amount (e.g. 49), not only yes/no.
      isp_policy_discount: complimentaryDiscountAvailable
        ? complimentaryDiscountAmount
        : 'no',
      originalAmount: totalAmount,
      // Add proforma_invoice, refund_amount, old_pin_serial if needed
    };
    
    console.log('=== PAYMENT PARAMS WITH COUPON ===');
    console.log('Route totalAmount:', totalAmount);
    console.log('Selected Plan MRP:', selectedPlan?.mrp);
    console.log('Selected Plan Dues:', selectedPlan?.dues);
    console.log('Calculated Base Amount (mrp + dues):', (selectedPlan?.mrp || 0) + (selectedPlan?.dues || 0));
    console.log('Discount Applied:', appliedDiscount);
    console.log('Final Amount to Pay:', finalAmount);
    console.log('Admin Login ID:', adminLoginId);
    console.log('Username:', session.username);
    console.log('Plan Name:', selectedPlan.name);
    console.log('Coupon Code:', params.couponCode);
    console.log('Campaign Code:', params.campaignCode);
    console.log('Coupon Discount:', params.couponDiscount);
    console.log('=== END PAYMENT PARAMS ===');
    
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

  // Add this helper function for OTT icons, similar to RenewPlanScreen
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
    // Fallback to emoji if no logo available
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

  // Debug: log OTT services data
  console.log('PlanConfirmationScreen ottServices:', selectedPlan.ottServices);

  return (
    <SafeAreaView style={[styles.container, {backgroundColor: colors.background}]}>
      {/* Header */}
      <CommonHeader navigation={navigation} />

      {/* Page Heading */}
      <View style={styles.headingContainer}>
        <Text style={[styles.pageHeading, {color: colors.text}]}>
          {t('planConfirmation.title')}
        </Text>
        <Text style={[styles.pageSubheading, {color: colors.textSecondary}]}>
          {t('planConfirmation.subtitle')}
        </Text>
      </View>

      {/* Content */}
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Plan Summary Card - Redesigned to match RenewPlanScreen */}
          <View style={styles.planCardSection}>
            <View style={[styles.planCardNew, {borderColor: selectedPlan.isCurrentPlan ? '#4CAF50' : colors.border, backgroundColor: colors.card}]}>
              {selectedPlan.isCurrentPlan && (
                <View style={[styles.planTag, {backgroundColor: '#4CAF50'}]}>
                  <Text style={styles.planTagText}>Current Plan</Text>
                </View>
              )}
            <View style={styles.planCardContent}>
              {/* Top row: behaves like two <td>s (left details + right grey price strip) */}
              <View style={styles.planCardTopRow}>
                {/* Left: name + description + metrics + OTT (same structure as RenewPlanScreen) */}
                <View style={styles.planCardLeft}>
                  {showL2SPlanName || !showPlanParamsBlend ? (
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

                  {/* Speed / Validity / OTT / Voice / IPTV / FUP - Only show if plan name is displayed */}
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
                      {formatCurrency(calculateTotalAmount(selectedPlan))}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
            </View>
          </View>

          {/* Advance Renewal Note (only if account status is active) */}
          {isAccountActive && (
            <View style={[styles.noteCard, {backgroundColor: '#FFF8E1', shadowColor: colors.shadow}]}> 
              {/* <Text style={styles.noteTitle}>Note</Text> */}
              <Text style={[styles.noteText, {color: colors.textSecondary}]}>{t('planConfirmation.advanceRenewalNote')}</Text>
            </View>
          )}

          {/* High Speed Plan Note (if configured in settings) */}
          {highSpeedPlanNote && (
            <View style={[styles.noteCard, styles.highSpeedNoteCard, {backgroundColor: '#E3F2FD', shadowColor: colors.shadow}]}> 
              <Text style={[styles.noteText, styles.highSpeedNoteText, {color: '#1976D2'}]}>{highSpeedPlanNote}</Text>
            </View>
          )}

          {/* Plan Comparison (only when selected plan is different from current) */}
          {!selectedPlan.isCurrentPlan && renderPlanComparison()}

          {/* Coupon Selection */}
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

          

          {/* Price Breakdown */}
          <View style={[styles.pricingCard, {backgroundColor: colors.card, shadowColor: colors.shadow}]}>
            <Text style={[styles.pricingTitle, {color: colors.text}]}>{t('planConfirmation.pricingBreakdown')}</Text>
            
            <View style={styles.pricingRow}>
              <Text style={[styles.pricingLabel, {color: colors.textSecondary}]}>{t('planConfirmation.baseAmount')}</Text>
              <Text style={[styles.pricingValue, {color: colors.text}]}>{formatCurrency(selectedPlan.baseAmount || 0)}</Text>
            </View>
            
            <View style={styles.pricingRow}>
              <Text style={[styles.pricingLabel, {color: colors.textSecondary}]}>{t('planConfirmation.cgst')} (9%)</Text>
              <Text style={[styles.pricingValue, {color: colors.text}]}>{formatCurrency(selectedPlan.cgst || 0)}</Text>
            </View>
            
            <View style={styles.pricingRow}>
              <Text style={[styles.pricingLabel, {color: colors.textSecondary}]}>{t('planConfirmation.sgst')} (9%)</Text>
              <Text style={[styles.pricingValue, {color: colors.text}]}>{formatCurrency(selectedPlan.sgst || 0)}</Text>
            </View>
            
            <View style={[styles.pricingRow, styles.totalRow]}>
              <Text style={[styles.pricingLabel, styles.totalLabel, {color: colors.text}]}>{t('planConfirmation.planMRP')}</Text>
              <Text style={[styles.pricingValue, styles.totalValue, {color: colors.primary}]}>{formatCurrency(calculateTotalAmount(selectedPlan))}</Text>
            </View>

            {(selectedPlan.dues || 0) > 0 && (
              <View style={styles.pricingRow}>
                <Text style={[styles.pricingLabel, {color: colors.textSecondary}]}>{t('planConfirmation.previousDues')}</Text>
                <Text style={[styles.pricingValue, {color: colors.text}]}>{formatCurrency(selectedPlan.dues || 0)}</Text>
              </View>
            )}



            {appliedDiscount > 0 && (
              <View style={styles.pricingRow}>
                <Text style={[styles.pricingLabel, {color: colors.textSecondary}]}>
                  {complimentaryDiscountAvailable
                    ? 'Complimentary Discount'
                    : 'Coupon Discount'}
                </Text>
                <Text style={[styles.pricingValue, {color: colors.success}]}>
                  -{formatCurrency(appliedDiscount)}
                </Text>
              </View>
            )}

            <View style={[styles.pricingRow, styles.finalTotalRow]}>
              <Text style={[styles.pricingLabel, styles.finalTotalLabel, {color: colors.text}]}>{t('planConfirmation.totalAmount')}</Text>
              <Text style={[styles.pricingValue, styles.finalTotalValue, {color: colors.primary}]}>{formatCurrency(calculateFinalAmount())}</Text>
            </View>
            

          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.cancelButton, {backgroundColor: colors.border}]}
              onPress={() => navigation.goBack()}>
              <Text style={[styles.cancelButtonText, {color: colors.text}]}>{t('planConfirmation.cancel')}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.confirmButton, {backgroundColor: colors.primary}]}
              onPress={handleConfirmPayment}>
              <Text style={styles.confirmButtonText}>
                {`Pay ${formatCurrency(calculateFinalAmount())}`}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Payment Gateway Modal */}
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
                <Text style={[styles.noGatewaysText, {color: colors.textSecondary}]}>{t('planConfirmation.noGateways') || 'No gateways available'}</Text>
              ) : (
                paymentGateways.map((gateway: any) => (
                  <TouchableOpacity
                    key={gateway.id}
                    style={[
                      styles.gatewayOption, 
                      {backgroundColor: selectedGateway === gateway.id ? colors.primaryLight : colors.border},
                      selectedGateway === gateway.id && {borderColor: colors.primary, borderWidth: 1}
                    ]}
                    onPress={() => setSelectedGateway(gateway.id)}>
                    <Text style={[
                      styles.gatewayLabel, 
                      {color: selectedGateway === gateway.id ? colors.primary : colors.text}
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
                  {backgroundColor: selectedGateway ? colors.primary : colors.border}
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
        </View>
      </ScrollView>
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
  planSummaryCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  planInfo: {
    flex: 1,
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
  planName: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  planBadgesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  planBadgesLeft: {
    flexDirection: 'row',
    alignItems: 'center',
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
  priceBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  priceText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  planDetails: {
    gap: 12,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  detailIcon: {
    fontSize: 18,
    marginRight: 12,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  detailSeparator: {
    fontSize: 16,
    color: '#ccc',
    marginHorizontal: 8,
  },
  ottSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  ottTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 24,
  },
  ottIcons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 0,
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
    alignItems: 'center',
    width: '25%',
    marginBottom: 16,
  },
  ottIconText: {
    fontSize: 24,
    marginBottom: 4,
  },
  pricingCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  pricingTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
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
  noteTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#795548',
    marginBottom: 6,
    textTransform: 'uppercase',
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
  pricingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  pricingLabel: {
    fontSize: 14,
  },
  pricingValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    marginTop: 8,
    paddingTop: 12,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  finalTotalRow: {
    borderTopWidth: 2,
    borderTopColor: '#e0e0e0',
    marginTop: 12,
    paddingTop: 16,
  },
  finalTotalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  finalTotalValue: {
    fontSize: 20,
    fontWeight: 'bold',
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
  // Comparison table styles (aligned with UpgradePlanConfirmation)
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
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
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
  loadingText: {
    marginVertical: 20,
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
  planFeaturesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'flex-start',
    marginTop: 12,
  },
  featureBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  featureIcon: {
    fontSize: 14,
  },
  featureText: {
    fontSize: 12,
    fontWeight: '600',
  },
  // New styles matching RenewPlanScreen design
  planCardSection: {
    marginTop: 20,
    marginBottom: 8,
  },
  planCardNew: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 8,
    minHeight: 124, // allow the card to grow with content (like RenewPlanScreen)
    overflow: 'visible',
    marginBottom: 0,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  planTag: {
    position: 'absolute',
    top: -12,
    left: 16,
    width: 106,
    height: 21,
    backgroundColor: '#019701',
    borderRadius: 3,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  planTagText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
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
  planNameNew: {
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'Inter',
    color: '#000000',
    marginTop: 4,      // add space below any heading/tag
    marginBottom: 2,
    paddingLeft: 6,    // align with plan content columns like RenewPlanScreen
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
  planVerticalSeparator: {
    width: 1,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 8,
    alignSelf: 'stretch',
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
  scrollHint: {
    fontSize: 10,
    textAlign: 'center',
    marginTop: 4,
    fontStyle: 'italic',
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

export default PlanConfirmationScreen; 
