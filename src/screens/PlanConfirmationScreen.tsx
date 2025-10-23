import React, {useEffect} from 'react';
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

interface PlanData {
  id: string;
  name: string;
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

const PlanConfirmationScreen = ({navigation, route}: any) => {
  const {isDark} = useTheme();
  const colors = getThemeColors(isDark);
  const {t} = useTranslation();
  const {selectedPlan, totalAmount, admin_login_id: adminLoginId} = route.params;
  
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
  const [isAccountActive, setIsAccountActive] = React.useState<boolean>(false);

  useEffect(() => {
    loadCoupons();
  }, []);

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
      const couponData = await apiService.getCouponCode(realm);
      // console.log('=== PLAN CONFIRMATION COUPON DATA ===');
      // console.log('Available Coupons:', JSON.stringify(couponData, null, 2));
      // console.log('=== END PLAN CONFIRMATION COUPON DATA ===');
      setCoupons(couponData || []);
    } catch (error) {
      console.error('Error fetching coupons:', error);
      setCoupons([]);
    }
  };

  const calculateFinalAmount = () => {
    // Use the totalAmount from route params (which should already include mrp + dues)
    // But also calculate it from plan data as a fallback
    const routeTotalAmount = totalAmount || 0;
    const calculatedTotalAmount = (selectedPlan?.mrp || 0) + (selectedPlan?.dues || 0);
    
    // Use the route totalAmount if it exists, otherwise use calculated
    const baseAmount = routeTotalAmount > 0 ? routeTotalAmount : calculatedTotalAmount;
    
    let finalAmount = baseAmount;
    
    // Subtract coupon discount
    finalAmount -= couponDiscount;
    
    // console.log('=== CALCULATE FINAL AMOUNT DEBUG ===');
    // console.log('totalAmount from route:', totalAmount);
    // console.log('selectedPlan.mrp:', selectedPlan?.mrp);
    // console.log('selectedPlan.dues:', selectedPlan?.dues);
    // console.log('calculatedTotalAmount (mrp + dues):', calculatedTotalAmount);
    // console.log('baseAmount used:', baseAmount);
    // console.log('couponDiscount:', couponDiscount);
    // console.log('Final amount after discount:', finalAmount);
    // console.log('=== END CALCULATE FINAL AMOUNT DEBUG ===');
    
    return Math.max(0, finalAmount);
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
      
      setPaymentGateways(gateways || []);
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

  const handleGatewayPay = async () => {
    setShowPaymentModal(false);
    
    // Get username from current session
    const session = await sessionManager.getCurrentSession();
    if (!session || !session.username) {
      Alert.alert('Error', 'Please login again to continue with payment.');
      return;
    }
    
    const clientConfig = getClientConfig();
    const realm = clientConfig.clientId;
    const selectedGatewayObj = paymentGateways.find(g => g.id === selectedGateway);
    
    // Calculate final amount with coupon discount
    const finalAmount = calculateFinalAmount();
    
    const params = {
      amount: finalAmount, // Use calculated amount (mrp + dues)
      adminname: adminLoginId,
      username: session.username, // Use username from session instead of route.params
      planname: selectedPlan.name,
      selectedPGType: [{ label: selectedGatewayObj.gw_display_name, value: selectedGatewayObj.id }],
      payActionType: 'renewal',
      // Add coupon information for backend processing
      couponCode: selectedCoupon ? getDiscountCode(selectedCoupon) : null,
      campaignCode: selectedCoupon?.campaign_code || null,
      couponDiscount: couponDiscount,
      originalAmount: totalAmount,
      // Add proforma_invoice, refund_amount, old_pin_serial if needed
    };
    
    console.log('=== PAYMENT PARAMS WITH COUPON ===');
    console.log('Route totalAmount:', totalAmount);
    console.log('Selected Plan MRP:', selectedPlan?.mrp);
    console.log('Selected Plan Dues:', selectedPlan?.dues);
    console.log('Calculated Base Amount (mrp + dues):', (selectedPlan?.mrp || 0) + (selectedPlan?.dues || 0));
    console.log('Coupon Discount Applied:', couponDiscount);
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

  // Add this helper function for OTT icons, similar to RenewPlanScreen
  const renderOTTIcon = (provider: any) => {
    if (provider && provider.full_path_app_logo_file) {
      return (
        <Image
          source={{ uri: provider.full_path_app_logo_file }}
          style={{ width: 24, height: 24, marginBottom: 4 }}
          resizeMode="contain"
        />
      );
    }
    return null;
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
          {/* Plan Summary Card */}
          <View style={[styles.planSummaryCard, {backgroundColor: colors.card, shadowColor: colors.shadow}]}>
            <View style={styles.planHeader}>
              <View style={styles.planInfo}>
                {/* Price and Current Plan Badge Row */}
                <View style={styles.planBadgesRow}>
                  <View style={styles.planBadgesLeft}>
                    {selectedPlan.isCurrentPlan && (
                      <View style={[styles.currentPlanBadge, {backgroundColor: colors.success}]}>
                        <Text style={styles.currentPlanText}>{t('planConfirmation.currentPlan')}</Text>
                      </View>
                    )}
                  </View>
                  <View style={[styles.priceBadge, {backgroundColor: colors.primaryLight}]}>
                    <Text style={[styles.priceText, {color: colors.primary}]}>₹{selectedPlan.mrp}</Text>
                  </View>
                </View>
                
                {/* Plan Name Row */}
                <View style={styles.planTitleRow}>
                  <Text style={styles.planIcon}>🚀</Text>
                  <View style={styles.planTitleContainer}>
                    <Text style={[styles.planName, {color: colors.textSecondary}]} numberOfLines={2}>
                      {selectedPlan.name}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Plan Details */}
            <View style={styles.planDetails}>
              <View style={styles.detailRow}>
                <View style={styles.detailItem}>
                  <Text style={styles.detailIcon}>⚡</Text>
                  <Text style={[styles.detailValue, {color: colors.text}]}>{selectedPlan.speed}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailIcon}>💾</Text>
                  <Text style={[styles.detailValue, {color: colors.text}]}>
                    {selectedPlan.gbLimit === -1 ? 'Unlimited' : `${selectedPlan.gbLimit} GB`}
                  </Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailIcon}>⏰</Text>
                  <Text style={[styles.detailValue, {color: colors.text}]}>{selectedPlan.validity}</Text>
                </View>
              </View>
              
              {/* Plan Features */}
              <View style={styles.planFeaturesRow}>
                {selectedPlan.ott_plan?.toLowerCase() === 'yes' && (
                  <View style={[styles.featureBadge, {backgroundColor: colors.successLight}]}>
                    <Text style={[styles.featureIcon, {color: colors.success}]}>🎬</Text>
                    <Text style={[styles.featureText, {color: colors.success}]}>OTT</Text>
                  </View>
                )}
                {selectedPlan.voice_plan?.toLowerCase() === 'yes' && (
                  <View style={[styles.featureBadge, {backgroundColor: colors.accentLight}]}>
                    <Text style={[styles.featureIcon, {color: colors.accent}]}>📞</Text>
                    <Text style={[styles.featureText, {color: colors.accent}]}>VOIP</Text>
                  </View>
                )}
                {selectedPlan.iptv?.toLowerCase() === 'yes' && (
                  <View style={[styles.featureBadge, {backgroundColor: colors.primaryLight}]}>
                    <Text style={[styles.featureIcon, {color: colors.primary}]}>📺</Text>
                    <Text style={[styles.featureText, {color: colors.primary}]}>IPTV</Text>
                  </View>
                )}
                {selectedPlan.fup_flag?.toLowerCase() === 'yes' && (
                  <View style={[styles.featureBadge, {backgroundColor: colors.surface}]}>
                    <Text style={[styles.featureIcon, {color: colors.text}]}>📊</Text>
                    <Text style={[styles.featureText, {color: colors.text}]}>FUP</Text>
                  </View>
                )}
              </View>
            </View>

            {/* OTT Services */}
            {selectedPlan.ottServices && selectedPlan.ottServices.length > 0 && (
              <View style={styles.ottSection}>
                <Text style={[styles.ottTitle, {color: colors.textSecondary}]}>🎬 {t('planConfirmation.ottServices')}</Text>
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.ottScrollContainer}
                  nestedScrollEnabled={true}
                  scrollEnabled={true}>
                  {selectedPlan.ottServices.map((service: any, index: number) => (
                    <View key={index} style={styles.ottItem}>
                      {renderOTTIcon(service)}
                      <Text style={[styles.ottServiceName, {color: colors.textSecondary}]}>
                        {service.content_provider}
                      </Text>
                    </View>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>

          {/* Advance Renewal Note (only if account status is active) */}
          {isAccountActive && (
            <View style={[styles.noteCard, {backgroundColor: '#FFF8E1', shadowColor: colors.shadow}]}> 
              {/* <Text style={styles.noteTitle}>Note</Text> */}
              <Text style={[styles.noteText, {color: colors.textSecondary}]}>{t('planConfirmation.advanceRenewalNote')}</Text>
            </View>
          )}

          {/* Coupon Selection */}
          {coupons.length > 0 && (
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

          

          {/* Price Breakup */}
          <View style={[styles.pricingCard, {backgroundColor: colors.card, shadowColor: colors.shadow}]}>
            <Text style={[styles.pricingTitle, {color: colors.text}]}>{t('planConfirmation.pricingBreakdown')}</Text>
            
            <View style={styles.pricingRow}>
              <Text style={[styles.pricingLabel, {color: colors.textSecondary}]}>{t('planConfirmation.baseAmount')}</Text>
              <Text style={[styles.pricingValue, {color: colors.text}]}>₹{selectedPlan.baseAmount.toFixed(2)}</Text>
            </View>
            
            <View style={styles.pricingRow}>
              <Text style={[styles.pricingLabel, {color: colors.textSecondary}]}>{t('planConfirmation.cgst')} (9%)</Text>
              <Text style={[styles.pricingValue, {color: colors.text}]}>₹{selectedPlan.cgst.toFixed(2)}</Text>
            </View>
            
            <View style={styles.pricingRow}>
              <Text style={[styles.pricingLabel, {color: colors.textSecondary}]}>{t('planConfirmation.sgst')} (9%)</Text>
              <Text style={[styles.pricingValue, {color: colors.text}]}>₹{selectedPlan.sgst.toFixed(2)}</Text>
            </View>
            
            <View style={[styles.pricingRow, styles.totalRow]}>
              <Text style={[styles.pricingLabel, styles.totalLabel, {color: colors.text}]}>{t('planConfirmation.planMRP')}</Text>
              <Text style={[styles.pricingValue, styles.totalValue, {color: colors.accent}]}>₹{selectedPlan.mrp}</Text>
            </View>

            <View style={styles.pricingRow}>
              <Text style={[styles.pricingLabel, {color: colors.textSecondary}]}>{t('planConfirmation.previousDues')}</Text>
              <Text style={[styles.pricingValue, {color: colors.text}]}>₹{selectedPlan.dues}</Text>
            </View>



            {selectedCoupon && couponDiscount > 0 && (
              <View style={styles.pricingRow}>
                <Text style={[styles.pricingLabel, {color: colors.textSecondary}]}>Coupon Discount</Text>
                <Text style={[styles.pricingValue, {color: colors.success}]}>-₹{couponDiscount}</Text>
              </View>
            )}

            <View style={[styles.pricingRow, styles.finalTotalRow]}>
              <Text style={[styles.pricingLabel, styles.finalTotalLabel, {color: colors.text}]}>{t('planConfirmation.totalAmount')}</Text>
              <Text style={[styles.pricingValue, styles.finalTotalValue, {color: colors.accent}]}>₹{calculateFinalAmount()}</Text>
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
                {t('planConfirmation.confirmAndPay')} - ₹{calculateFinalAmount()}
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
                <Text style={[
                  styles.paymentGatewayButtonText, 
                  {color: selectedGateway ? '#fff' : colors.textSecondary}
                ]}>
                  Pay ₹{calculateFinalAmount()} with {selectedGateway ? paymentGateways.find(g => g.id === selectedGateway)?.gw_display_name : ''}
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
  ottServiceName: {
    fontSize: 12,
    textAlign: 'center',
  },
  pricingCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  pricingTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
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
  pricingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
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

});

export default PlanConfirmationScreen; 
