import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useTheme} from '../utils/ThemeContext';
import {getThemeColors} from '../utils/themeStyles';
import CommonHeader from '../components/CommonHeader';
import {useTranslation} from 'react-i18next';
import {apiService} from '../services/api';
import sessionManager from '../services/sessionManager';
import {getClientConfig} from '../config/client-config';

const UpgradePlanConfirmationScreen = ({navigation, route}: any) => {
  const {isDark} = useTheme();
  const colors = getThemeColors(isDark);
  const {t} = useTranslation();

  const [isLoading, setIsLoading] = useState(false);
  const [currentPlanData, setCurrentPlanData] = useState<any>(null);
  const [currentPlanDetails, setCurrentPlanDetails] = useState<any>(null);
  const [salesReturnData, setSalesReturnData] = useState<any>(null);
  const [coupons, setCoupons] = useState<any[]>([]);
  const [selectedCoupon, setSelectedCoupon] = useState<any>(null);
  const [couponDiscount, setCouponDiscount] = useState(0);

  const {selectedPlan, totalAmount, payDues, admin_login_id} = route.params;

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
      
      // Get current plan data
      const authResponse = await apiService.makeAuthenticatedRequest(async (token) => {
        return await apiService.authUser(username);
      });
      
      setCurrentPlanData(authResponse);

      // Extract refund data from authUser response
      console.log('=== AUTH USER RESPONSE FOR REFUND ===');
      console.log('Full Auth Response:', JSON.stringify(authResponse, null, 2));
      console.log('=== CURRENT PLAN DATA DEBUG ===');
      console.log('Full Current Plan Data:', JSON.stringify(authResponse, null, 2));
      console.log('Current Plan Data Keys:', Object.keys(authResponse || {}));
      console.log('Usage Details:', authResponse?.usage_details);
      console.log('Usage Details [0]:', authResponse?.usage_details?.[0]);
      console.log('Usage Details [0] Keys:', authResponse?.usage_details?.[0] ? Object.keys(authResponse.usage_details[0]) : 'No usage details');
      console.log('Plan Price Fields:', {
        plan_price: authResponse?.plan_price,
        price: authResponse?.price,
        current_plan_price: authResponse?.current_plan_price,
        plan_amount: authResponse?.plan_amount,
        amount: authResponse?.amount,
        usage_details: authResponse?.usage_details?.[0],
        'usage_details[0].plan_price': authResponse?.usage_details?.[0]?.plan_price,
        'usage_details[0].amount': authResponse?.usage_details?.[0]?.amount,
        'usage_details[0].plan_amount': authResponse?.usage_details?.[0]?.plan_amount,
        'usage_details[0].current_plan_price': authResponse?.usage_details?.[0]?.current_plan_price
      });
      console.log('=== END CURRENT PLAN DATA DEBUG ===');
      console.log('=== END AUTH USER RESPONSE ===');
      
      // Check if authResponse contains sales_return_details
      if (authResponse && authResponse.sales_return_details) {
        console.log('=== FOUND SALES RETURN DETAILS ===');
        console.log('Sales Return Details:', JSON.stringify(authResponse.sales_return_details, null, 2));
        console.log('=== END SALES RETURN DETAILS ===');
        setSalesReturnData(authResponse.sales_return_details);
      } else {
        console.log('=== NO SALES RETURN DETAILS FOUND ===');
        console.log('Auth Response Keys:', authResponse ? Object.keys(authResponse) : 'No response');
        console.log('=== END NO SALES RETURN DETAILS ===');
        
        // TEMPORARY: Mock data for testing refund display
        const mockSalesReturnData = {
          pin_detail: [
            {
              id: "346296",
              pin_serial: "31085469",
              admin_login_id: "VIRAR",
              dist_login_id: "",
              lco_effective_rate: "398.31",
              planname: "ULTD_25Mbps_30DAYS",
              dist_effective_rate: "0",
              sale_amount: "10",
              days_allocated: "30",
              days_used: "15",
              days_remaining: 15,
              data_allocated: 0,
              data_used: "315371545796",
              data_remaining: null,
              fup_topup: null,
              user_refund_amount: 5,
              dist_refund_amount: 0,
              lco_final_refund_amount: 199
            }
          ]
        };
        console.log('=== USING MOCK DATA ===');
        console.log('Mock Sales Return Data:', JSON.stringify(mockSalesReturnData, null, 2));
        console.log('=== END MOCK DATA ===');
        setSalesReturnData(mockSalesReturnData);
      }

      // Get current plan details from plan API
      try {
        const currentPlanName = authResponse?.current_plan || authResponse?.current_plan1;
        console.log('=== GETTING CURRENT PLAN DETAILS ===');
        console.log('Current Plan Name:', currentPlanName);
        console.log('Admin Login ID:', authResponse?.admin_login_id);
        console.log('Username:', username);
        
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
          
          console.log('=== PLAN LIST RESPONSE ===');
          console.log('Total Plans:', planList?.length || 0);
          console.log('Full Plan List:', JSON.stringify(planList, null, 2));
          
          // Find current plan in the list
          const currentPlan = planList?.find((plan: any) => 
            plan.name === currentPlanName || 
            plan.name === authResponse?.current_plan || 
            plan.name === authResponse?.current_plan1
          );
          
          console.log('=== CURRENT PLAN FOUND ===');
          console.log('Current Plan Details:', JSON.stringify(currentPlan, null, 2));
          console.log('=== END CURRENT PLAN DETAILS ===');
          
          setCurrentPlanDetails(currentPlan);
        }
      } catch (error) {
        console.error('Error fetching current plan details:', error);
      }

      // Get available coupons
      try {
        const clientConfig = getClientConfig();
        const realm = clientConfig.clientId;
        const couponData = await apiService.getCouponCode(realm);
        console.log('=== COUPON DATA ===');
        console.log('Available Coupons:', JSON.stringify(couponData, null, 2));
        console.log('=== END COUPON DATA ===');
        setCoupons(couponData || []);
      } catch (error) {
        console.error('Error fetching coupons:', error);
        setCoupons([]);
      }

    } catch (error: any) {
      console.error('Error loading current plan data:', error);
      Alert.alert('Error', 'Failed to load plan information');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmUpgrade = async () => {
    try {
      setIsLoading(true);
      
      const session = await sessionManager.getCurrentSession();
      if (!session) {
        Alert.alert('Error', 'Please login again');
        navigation.navigate('Login');
        return;
      }

      const {username} = session;
      
      // Call upgrade plan API
      const upgradeResponse = await apiService.upgradePlan(
        admin_login_id,
        username,
        selectedPlan.id,
        totalAmount,
        payDues || 0
      );

      if (upgradeResponse && upgradeResponse.success) {
        Alert.alert(
          'Upgrade Successful',
          'Your plan has been upgraded successfully!',
          [
            {
              text: 'OK',
              onPress: () => navigation.navigate('Home')
            }
          ]
        );
      } else {
        Alert.alert('Error', upgradeResponse?.message || 'Failed to upgrade plan');
      }

    } catch (error: any) {
      console.error('Error upgrading plan:', error);
      Alert.alert('Error', error.message || 'Failed to upgrade plan');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    navigation.goBack();
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toFixed(2)}`;
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
    
    // Subtract coupon discount
    finalAmount -= couponDiscount;
    
    return Math.max(0, finalAmount);
  };

  const renderPlanComparison = () => {
    // Debug current plan price calculation
    const currentPlanPrice = currentPlanDetails?.FinalAmount || 
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
    
    console.log('=== PLAN COMPARISON DEBUG ===');
    console.log('Current Plan Data:', currentPlanData);
    console.log('Current Plan Details:', currentPlanDetails);
    console.log('Calculated Current Plan Price:', currentPlanPrice);
    console.log('Selected Plan Price:', selectedPlan.price);
    console.log('=== END PLAN COMPARISON DEBUG ===');
    
    return (
      <View style={[styles.comparisonCard, {backgroundColor: colors.card, shadowColor: colors.shadow}]}>
        <Text style={[styles.comparisonTitle, {color: colors.text}]}>Plan Comparison</Text>
      
      <View style={styles.comparisonTable}>
        {/* Header Row */}
        <View style={[styles.tableHeader, {borderBottomColor: colors.border}]}>
          <Text style={[styles.headerCell, {color: colors.textSecondary}]}>Parameters</Text>
          <Text style={[styles.headerCell, {color: colors.textSecondary}]}>Current</Text>
          <Text style={[styles.headerCell, {color: colors.textSecondary}]}>New</Text>
        </View>
        
        {/* Plan Name Row */}
        <View style={[styles.tableRow, {borderBottomColor: colors.border}]}>
          <Text style={[styles.parameterCell, {color: colors.textSecondary}]}>Plan Name</Text>
          <Text style={[styles.currentCell, {color: colors.text}]}>
            {currentPlanDetails?.name || currentPlanData?.current_plan || 'N/A'}
          </Text>
          <Text style={[styles.newCell, {color: colors.primary, fontWeight: '600'}]}>
            {selectedPlan.name}
          </Text>
        </View>
        
        {/* Speed Row */}
        <View style={[styles.tableRow, {borderBottomColor: colors.border}]}>
          <Text style={[styles.parameterCell, {color: colors.textSecondary}]}>⚡ Speed</Text>
          <Text style={[styles.currentCell, {color: colors.text}]}>
            {currentPlanDetails?.downloadSpeed || currentPlanData?.plan_download_speed || 'N/A'}
          </Text>
          <Text style={[styles.newCell, {color: colors.primary, fontWeight: '600'}]}>
            {selectedPlan.speed}
          </Text>
        </View>
        
        {/* Data Row */}
        <View style={[styles.tableRow, {borderBottomColor: colors.border}]}>
          <Text style={[styles.parameterCell, {color: colors.textSecondary}]}>📊 Data</Text>
          <Text style={[styles.currentCell, {color: colors.text}]}>
            {currentPlanDetails?.limit === 'Unlimited' ? 'Unlimited' : `${currentPlanDetails?.limit || 'N/A'} GB`}
          </Text>
          <Text style={[styles.newCell, {color: colors.primary, fontWeight: '600'}]}>
            {selectedPlan.gbLimit === -1 ? 'Unlimited' : `${selectedPlan.gbLimit} GB`}
          </Text>
        </View>
        
        {/* Validity Row */}
        <View style={[styles.tableRow, {borderBottomColor: colors.border}]}>
          <Text style={[styles.parameterCell, {color: colors.textSecondary}]}>⏰ Validity</Text>
          <Text style={[styles.currentCell, {color: colors.text}]}>
            {currentPlanDetails?.days ? `${currentPlanDetails.days} Days` : 'N/A'}
          </Text>
          <Text style={[styles.newCell, {color: colors.primary, fontWeight: '600'}]}>
            {selectedPlan.validity}
          </Text>
        </View>
        
        {/* OTT Row */}
        <View style={[styles.tableRow, {borderBottomColor: colors.border}]}>
          <Text style={[styles.parameterCell, {color: colors.textSecondary}]}>🎬 OTT</Text>
          <Text style={[styles.currentCell, {color: colors.text}]}>
            {currentPlanDetails?.ott_plan?.toLowerCase() === 'yes' || (currentPlanDetails?.content_providers && currentPlanDetails.content_providers.length > 0) ? 'Yes' : 'No'}
          </Text>
          <Text style={[styles.newCell, {color: colors.primary, fontWeight: '600'}]}>
            {selectedPlan.ott_plan?.toLowerCase() === 'yes' || (selectedPlan.ottServices && selectedPlan.ottServices.length > 0) ? 'Yes' : 'No'}
          </Text>
        </View>
        
        {/* VOIP Row */}
        <View style={[styles.tableRow, {borderBottomColor: colors.border}]}>
          <Text style={[styles.parameterCell, {color: colors.textSecondary}]}>📞 VOIP</Text>
          <Text style={[styles.currentCell, {color: colors.text}]}>
            {currentPlanDetails?.voice_plan?.toLowerCase() === 'yes' ? 'Yes' : 'No'}
          </Text>
          <Text style={[styles.newCell, {color: colors.primary, fontWeight: '600'}]}>
            {selectedPlan.voice_plan?.toLowerCase() === 'yes' ? 'Yes' : 'No'}
          </Text>
        </View>
        
        {/* IPTV Row */}
        <View style={[styles.tableRow, {borderBottomColor: colors.border}]}>
          <Text style={[styles.parameterCell, {color: colors.textSecondary}]}>📺 IPTV</Text>
          <Text style={[styles.currentCell, {color: colors.text}]}>
            {currentPlanDetails?.iptv?.toLowerCase() === 'yes' ? 'Yes' : 'No'}
          </Text>
          <Text style={[styles.newCell, {color: colors.primary, fontWeight: '600'}]}>
            {selectedPlan.iptv?.toLowerCase() === 'yes' ? 'Yes' : 'No'}
          </Text>
        </View>
        
        {/* FUP Row */}
        <View style={[styles.tableRow, {borderBottomColor: colors.border}]}>
          <Text style={[styles.parameterCell, {color: colors.textSecondary}]}>📊 FUP</Text>
          <Text style={[styles.currentCell, {color: colors.text}]}>
            {currentPlanDetails?.fup_flag?.toLowerCase() === 'yes' ? 'Yes' : 'No'}
          </Text>
          <Text style={[styles.newCell, {color: colors.primary, fontWeight: '600'}]}>
            {selectedPlan.fup_flag?.toLowerCase() === 'yes' ? 'Yes' : 'No'}
          </Text>
        </View>
        
        {/* Price Row */}
        <View style={[styles.tableRow, {borderBottomColor: colors.border}]}>
          <Text style={[styles.parameterCell, {color: colors.textSecondary}]}>💰 Price</Text>
          <Text style={[styles.currentCell, {color: colors.text}]}>
            {formatCurrency(currentPlanPrice)}
          </Text>
          <Text style={[styles.newCell, {color: colors.primary, fontWeight: 'bold', fontSize: 16}]}>
            {formatCurrency(selectedPlan.price)}
          </Text>
        </View>
      </View>
    </View>
  );
  };

  const renderSalesReturnDetails = () => {
    console.log('=== RENDER SALES RETURN DEBUG ===');
    console.log('salesReturnData:', salesReturnData);
    console.log('salesReturnData?.pin_detail:', salesReturnData?.pin_detail);
    console.log('salesReturnData?.pin_detail?.length:', salesReturnData?.pin_detail?.length);
    console.log('=== END RENDER SALES RETURN DEBUG ===');
    
    if (!salesReturnData || !salesReturnData.pin_detail || salesReturnData.pin_detail.length === 0) {
      console.log('Returning null - no sales return data available');
      return null;
    }

    const pinDetail = salesReturnData.pin_detail[0];

    return (
      <View style={[styles.salesReturnCard, {backgroundColor: colors.card, shadowColor: colors.shadow}]}>
        <Text style={[styles.salesReturnTitle, {color: colors.text}]}>Refund Details</Text>
        
        <View style={styles.salesReturnRow}>
          <Text style={[styles.salesReturnLabel, {color: colors.textSecondary}]}>Plan Name</Text>
          <Text style={[styles.salesReturnValue, {color: colors.text}]}>
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
    if (coupons.length === 0) return null;

    return (
      <View style={[styles.couponCard, {backgroundColor: colors.card, shadowColor: colors.shadow}]}>
        <Text style={[styles.couponTitle, {color: colors.text}]}>Available Coupons</Text>
        
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
                  {getDiscountCode(coupon) && (
                    <Text style={[styles.couponCode, {color: isSelected ? colors.primary : colors.text}]}>
                      {getDiscountCode(coupon)}
                    </Text>
                  )}
                  <Text style={[styles.couponDiscount, {color: colors.success}]}>
                    {discountInfo}
                  </Text>
                </View>
                
                <View style={styles.couponRight}>
                  <Text style={[styles.couponName, {color: colors.text}]} numberOfLines={1}>
                    {coupon.campaign_name || 'Coupon'}
                  </Text>
                  <Text style={[styles.couponExpiry, {color: colors.textSecondary}]} numberOfLines={1}>
                    {coupon.expiry_date || 'N/A'}
                  </Text>
                </View>
                
                {isSelected && (
                  <View style={[styles.selectedIndicator, {backgroundColor: colors.primary}]}>
                    <Text style={styles.selectedIndicatorText}>✓</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  const renderPaymentBreakdown = () => (
    <View style={[styles.paymentCard, {backgroundColor: colors.card, shadowColor: colors.shadow}]}>
      <Text style={[styles.paymentTitle, {color: colors.text}]}>Payment Breakdown</Text>
      
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
      
      {selectedCoupon && couponDiscount > 0 && (
        <View style={styles.paymentRow}>
          <Text style={[styles.paymentLabel, {color: colors.textSecondary}]}>Coupon Discount</Text>
          <Text style={[styles.paymentValue, {color: colors.success}]}>
            -{formatCurrency(couponDiscount)}
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

          {/* Plan Comparison */}
          {renderPlanComparison()}

          {/* Sales Return Details */}
          {renderSalesReturnDetails()}

          {/* Coupon Selection */}
          {renderCouponSelection()}

          {/* Payment Breakdown */}
          {renderPaymentBreakdown()}

          {/* Terms and Conditions */}
          <View style={[styles.termsCard, {backgroundColor: colors.card, shadowColor: colors.shadow}]}>
            <Text style={[styles.termsTitle, {color: colors.text}]}>Terms & Conditions</Text>
            <Text style={[styles.termsText, {color: colors.textSecondary}]}>
              • Your current plan will be upgraded immediately upon confirmation{'\n'}
              • Any unused data or time from your current plan will be forfeited{'\n'}
              • The new plan will be active from the confirmation date{'\n'}
              • Payment will be processed according to your selected method{'\n'}
              • No refunds will be provided for the current plan
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
                {isLoading ? 'Processing...' : 'Confirm Upgrade'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
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
  comparisonTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  comparisonTable: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  headerCell: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  parameterCell: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  currentCell: {
    flex: 1,
    fontSize: 14,
    textAlign: 'center',
  },
  newCell: {
    flex: 1,
    fontSize: 14,
    textAlign: 'center',
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
    alignItems: 'center',
    paddingVertical: 8,
  },
  salesReturnLabel: {
    fontSize: 14,
  },
  salesReturnValue: {
    fontSize: 14,
    fontWeight: '600',
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
  couponRight: {
    flex: 2,
    alignItems: 'flex-end',
  },
  couponName: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 2,
  },
  couponCode: {
    fontSize: 15,
    fontWeight: 'bold',
    fontFamily: 'monospace',
    marginBottom: 2,
  },
  couponDiscount: {
    fontSize: 12,
    fontWeight: '600',
  },
  couponExpiry: {
    fontSize: 11,
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
});

export default UpgradePlanConfirmationScreen; 