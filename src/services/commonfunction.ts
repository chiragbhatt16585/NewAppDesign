import { Alert } from 'react-native';
import { apiService } from './api';
// @ts-ignore - Temporarily commented out due to compatibility issues with RN 0.80.1
// import AllInOneSDKManager from 'paytm_allinone_react-native';
// @ts-ignore
import RazorpayCheckout from 'react-native-razorpay';
import queryString from 'query-string';

const domain = ''; // TODO: Set your domain if needed for EBS/PayuMoney

export function handlePayment(params: any, payActionType: string, navigation: any, realm: string) {
  console.log('=== HANDLE PAYMENT DEBUG ===');
  console.log('Payment params:', params);
  console.log('Amount received:', params.amount);
  console.log('Coupon Code received:', params.couponCode);
  console.log('Coupon Discount received:', params.couponDiscount);
  console.log('Pay action type:', payActionType);
  console.log('Realm:', realm);
  
  // Use makeAuthenticatedRequest instead of handleTokenUpdate (same pattern as other screens)
  apiService.makeAuthenticatedRequest(async (token) => {
    console.log('Token received for payment request:', token ? 'exists' : 'missing');
    
    // Add campaign_code and coupon_amount using existing variables
    const apiParams = {
      ...params,
      // Prefer explicit campaignCode from selected coupon; fallback to couponCode
      campaign_code: params.campaignCode || params.couponCode || null,
      coupon_amount: params.couponDiscount || 0,
    };
    
    console.log('=== FINAL API PARAMS ===');
    console.log('API Params:', apiParams);
    console.log('Amount being sent to payment gateway:', apiParams.amount);
    console.log('Campaign Code:', apiParams.campaign_code);
    console.log('Coupon Amount:', apiParams.coupon_amount);
    console.log('Original Amount (before discount):', apiParams.originalAmount);
    console.log('=== BACKEND API CALL DEBUG ===');
    console.log('Calling apiService.paymentRequestDetails with params:', JSON.stringify(apiParams, null, 2));
    console.log('Realm:', realm);
    console.log('=== END API PARAMS ===');
    
    return await apiService.paymentRequestDetails(apiParams, realm);
  }).then((res: any) => {
    console.log('=== BACKEND RESPONSE DEBUG ===');
    console.log('Backend response received:', JSON.stringify(res, null, 2));
    console.log('Backend response data:', JSON.stringify(res.data, null, 2));
    console.log('Backend amount in response:', res.data?.amount || 'NOT FOUND');
    console.log('Backend txn_ref_no:', res.data?.txn_ref_no || 'NOT FOUND');
    console.log('Backend URL:', res.data?.url || 'NOT FOUND');
    console.log('=== END BACKEND RESPONSE ===');
    console.log('Payment request successful:', res);
    const txnInfo: any = {}; // TODO: Implement or import TxnInfo from your utils if needed
    var pgInfo = params.selectedPGType && params.selectedPGType[0].label;
    var selectedPg = params.selectedPGType && params.selectedPGType[0].value;
    var source: any = {};
    if (pgInfo === 'ATOM') {
      source.uri = res.data.url;
      txnInfo.merTxnId = res.data.txn_ref_no;
      source.headers = { "Content-Type": "application/x-www-form-urlencoded" };
      navigation.navigate("PaymentLink", { source: source, pgInfo: pgInfo, amount: params.amount, merTxnId: txnInfo.merTxnId })
    } else if (pgInfo === 'ccAvenue') {
      txnInfo.merTxnId = res.data[0].TransactionRef;
      source.uri = res.data[0].URL;
      source.method = 'POST';
      source.body = queryString.stringify(res.data[0].Parameter);
      navigation.navigate("PaymentLink", { source: source, pgInfo: pgInfo, amount: params.amount, merTxnId: txnInfo.merTxnId })
    } else if (pgInfo === 'EBS') {
      txnInfo.merTxnId = res.data[0].Parameter.reference_no;
      source.uri = `${domain}/EBSRedirect.php`;
      source.method = 'POST';
      source.body = queryString.stringify(
        Object.assign({}, res.data[0].Parameter, { url: res.data[0].URL })
      );
      // Optionally add key/accId to pgInfo if needed
      navigation.navigate("PaymentLink", { source: source, pgInfo: pgInfo, amount: params.amount, merTxnId: txnInfo.merTxnId })
    } else if (pgInfo === 'PayuMoney') {
      txnInfo.merTxnId = res.data[0].TransactionRef;
      source.uri = `${domain}/PayuMoneyRedirect.php`;
      source.method = 'POST';
      source.body = queryString.stringify(
        Object.assign({}, res.data[0].Parameter, { url: res.data[0].URL })
      );
      navigation.navigate("PaymentLink", { source: source, pgInfo: pgInfo, amount: params.amount, merTxnId: txnInfo.merTxnId })
    } else if (pgInfo === 'EASEBUZZ') {
      // Handle EASEBUZZ payment gateway specifically
      txnInfo.merTxnId = res.data.txn_ref_no;
      source.uri = res.data.url;
      source.method = 'POST';
      source.headers = { 
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1"
      };
      source.body = queryString.stringify(res.data.parameters);
      console.log('=== EASEBUZZ PAYMENT DEBUG ===');
      console.log('EASEBUZZ payment configuration:', {
        url: res.data.url,
        txnRef: txnInfo.merTxnId,
        parameters: res.data.parameters
      });
      console.log('Amount being sent to PaymentLink:', params.amount);
      console.log('Backend amount from response:', res.data?.amount);
      console.log('Amount mismatch check:', params.amount !== res.data?.amount ? 'MISMATCH!' : 'OK');
      console.log('=== END EASEBUZZ DEBUG ===');
      navigation.navigate("PaymentLink", { source: source, pgInfo: pgInfo, amount: params.amount, merTxnId: txnInfo.merTxnId })
    } else if (pgInfo === 'PAYTM') {
      // Temporarily disabled due to compatibility issues with React Native 0.80.1
      Alert.alert(
        'Paytm Not Available', 
        'Paytm integration is temporarily disabled due to compatibility issues. Please use another payment gateway.',
        [{ text: 'OK' }]
      );
      return;
      
      // Original Paytm code (commented out):
      /*
      const data = res.data.parameters;
      const txnRef = res.data.txn_ref_no;
      const orderId = data.orderId;
      const tranxToken = data.token;
      const callbackUrl = `https://securegw.paytm.in/theia/paytmCallback?ORDER_ID=${orderId}`;
      const amount = data.amount;
      const mid = data.mid;
      const isStaging = false;
      const appInvokeRestricted = false;
      const urlScheme = '';
      AllInOneSDKManager.startTransaction(
        orderId,
        mid,
        tranxToken,
        amount.toString(),
        callbackUrl,
        isStaging,
        appInvokeRestricted,
        urlScheme
      )
        .then((result: any) => {
          navigation.navigate('PaymentResponse', { txnRef, source, pgInfo, amount, status: 'success' });
          // TODO: Optionally call activateUser and toPaymentFeedback if needed
        })
        .catch((err: any) => {
          navigation.navigate('PaymentResponse', { txnRef, source, pgInfo, amount, status: 'failed' });
        });
      */
    } else if (pgInfo === 'RAZORPAY') {
      txnInfo.merTxnId = res.data.txn_ref_no;
      const data = res.data.parameters;
      
      console.log('=== RAZORPAY PAYMENT DEBUG ===');
      console.log('Backend amount from data:', data.amount);
      console.log('Our calculated amount (params.amount):', params.amount);
      console.log('Using amount for Razorpay:', params.amount);
      console.log('=== END RAZORPAY DEBUG ===');
      
      const options = {
        key: data.key,
        amount: data.amount, // Use backend order amount to match server-created Razorpay order
        name: data.name,
        description: data.description,
        image: '',
        prefill: {
          name: data.name,
          email: data.email,
          contact: data.contact
        },
        theme: {
          color: '#3399FF'
        },
        order_id: data.razorpayOrderId
      };
      RazorpayCheckout.open(options)
        .then((result: any) => {
          navigation.navigate('PaymentResponse', { txnRef: txnInfo.merTxnId, source, pgInfo, amount: params.amount, status: 'success' });
          // TODO: Optionally call activateUser and toPaymentFeedback if needed
        })
        .catch((error: any) => {
          navigation.navigate('PaymentResponse', { txnRef: txnInfo.merTxnId, source, pgInfo, amount: params.amount, status: 'failed' });
        });
    } else if (pgInfo) {
      txnInfo.merTxnId = res.data.txn_ref_no;
      source.uri = res.data.url;
      source.method = 'POST';
      source.headers = { "Content-Type": "application/x-www-form-urlencoded" };
      source.body = queryString.stringify(res.data.parameters);
      navigation.navigate("PaymentLink", { source: source, pgInfo: pgInfo, amount: params.amount, merTxnId: txnInfo.merTxnId })
    } else {
      Alert.alert('Not implemented', 'Gateway not implemented yet: ' + pgInfo);
    }
  }).catch((error: any) => {
    console.error('Handle payment error:', error);
    Alert.alert('Payment Error', error.message || 'An error occurred during payment processing.');
  });
}
