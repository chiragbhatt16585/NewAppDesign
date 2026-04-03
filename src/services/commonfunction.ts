import { Alert } from 'react-native';
import { apiService } from './api';
// @ts-ignore - Temporarily commented out due to compatibility issues with RN 0.80.1
// import AllInOneSDKManager from 'paytm_allinone_react-native';
// @ts-ignore
import RazorpayCheckout from 'react-native-razorpay';
import queryString from 'query-string';
import sessionManager from './sessionManager';
import { getClientConfig } from '../config/client-config';

const domain = ''; // TODO: Set your domain if needed for EBS/PayuMoney

async function navigateWithServerStatus(
  navigation: any,
  txnRef: string,
  source: any,
  pgInfo: string,
  amount: number,
  fallbackStatus: string,
  gatewayResponse?: any,
  tpGatewayId?: string,
) {
  try {
    const session = await sessionManager.getCurrentSession();
    const username = session?.username;
    if (!username) {
      throw new Error('User session not found');
    }
    const realm = getClientConfig().clientId;
    const paymentStatusResponse = await apiService.getPaymentStatus(username, txnRef, realm);
    
    // CRITICAL: Check if payment was cancelled by user
    // If gatewayResponse indicates cancellation, override backend status
    const isCancelled = gatewayResponse?.cancelled === true || 
                        gatewayResponse?.error?.code === 'BAD_REQUEST_ERROR' ||
                        gatewayResponse?.error?.code === 'GATEWAY_ERROR' ||
                        gatewayResponse?.error?.code === 'PAYMENT_CANCELLED';
    
    // Also check if backend status is 'new' (unprocessed) and we have cancellation indicator
    const backendTxnStatus = paymentStatusResponse?.data?.[0]?.txn_status || 
                             paymentStatusResponse?.data?.txn_status || 
                             '';
    const isBackendNew = backendTxnStatus.toLowerCase() === 'new';
    
    // Determine final status
    let finalStatus = fallbackStatus;
    if (isCancelled || (isBackendNew && isCancelled)) {
      console.log('⚠️ Payment was cancelled, overriding backend status to failed');
      finalStatus = 'failed';
      // Override the backend response status
      if (paymentStatusResponse?.data?.[0]) {
        paymentStatusResponse.data[0].txn_status = 'failed';
      } else if (paymentStatusResponse?.data) {
        paymentStatusResponse.data.txn_status = 'failed';
      }
    } else if (paymentStatusResponse?.data?.[0]?.txn_status) {
      // Use backend status if not cancelled
      finalStatus = paymentStatusResponse.data[0].txn_status;
    } else if (paymentStatusResponse?.data?.txn_status) {
      finalStatus = paymentStatusResponse.data.txn_status;
    }
    
    navigation.navigate('PaymentResponse', {
      ...paymentStatusResponse,
      status: finalStatus, // Override with our determined status
      txnRef,
      source,
      pgInfo,
      amount,
      gatewayResponse,
      tpGatewayId,
    });
  } catch (error) {
    console.error('Failed to fetch gateway payment status:', error);
    navigation.navigate('PaymentResponse', {
      txnRef,
      source,
      pgInfo,
      amount,
      status: fallbackStatus,
      gatewayResponse,
      tpGatewayId,
    });
  }
}

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
      // Preserve numeric 0; only default when undefined/null (not when amount is 0).
      isp_policy_discount: params.isp_policy_discount ?? 'no',
    };
    
    console.log('=== FINAL API PARAMS ===');
    console.log('API Params:', apiParams);
    console.log('Amount being sent to payment gateway:', apiParams.amount);
    console.log('Campaign Code:', apiParams.campaign_code);
    console.log('Coupon Amount:', apiParams.coupon_amount);
    console.log('ISP Policy Discount:', apiParams.isp_policy_discount);
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
      // Simple GET load for Atom – no POST/body/headers
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
      const tpGatewayId = selectedPg || pgInfo || 'RAZORPAY';

      console.log('=== RAZORPAY PAYMENT DEBUG ===');
      console.log('Backend parameters:', JSON.stringify(data, null, 2));
      console.log('Txn Ref:', txnInfo.merTxnId);
      console.log('=== END RAZORPAY PAYMENT DEBUG ===');

      const options = {
        key: data.key,
        amount: data.amount, // Use backend order amount to match Razorpay order
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
        .then(async (result: any) => {
          console.log('=== RAZORPAY RESPONSE ===');
          try {
            console.log(JSON.stringify(result, null, 2));
          } catch (err) {
            console.log(result);
          }
          console.log('=== END RESPONSE ===');

          // CRITICAL: Validate that this is actually a successful payment
          // Check if result indicates cancellation or failure
          const isCancelled = 
            !result || 
            result === null ||
            (result.error && (
              result.error.code === 'BAD_REQUEST_ERROR' ||
              result.error.code === 'GATEWAY_ERROR' ||
              result.error.code === 'PAYMENT_CANCELLED' ||
              (result.error.description && (
                result.error.description.toLowerCase().includes('cancel') ||
                result.error.description.toLowerCase().includes('cancelled') ||
                result.error.description.toLowerCase().includes('aborted')
              ))
            )) ||
            (result.description && (
              result.description.toLowerCase().includes('cancel') ||
              result.description.toLowerCase().includes('cancelled') ||
              result.description.toLowerCase().includes('aborted')
            )) ||
            // Check if payment_id is missing (cancelled payments won't have payment_id)
            (!result.razorpay_payment_id && !result.payment_id);

          if (isCancelled) {
            console.log('⚠️ Razorpay payment was cancelled by user');
            await navigateWithServerStatus(
              navigation,
              txnInfo.merTxnId,
              null,
              pgInfo,
              params.amount,
              'failed',
              { ...result, cancelled: true, description: 'Payment cancelled by user' },
              tpGatewayId,
            );
            return;
          }

          // Validate that we have a payment ID (required for successful payment)
          if (!result.razorpay_payment_id && !result.payment_id) {
            console.log('⚠️ Razorpay response missing payment_id, treating as failed');
            await navigateWithServerStatus(
              navigation,
              txnInfo.merTxnId,
              null,
              pgInfo,
              params.amount,
              'failed',
              { ...result, description: 'Payment failed: Missing payment ID' },
              tpGatewayId,
            );
            return;
          }

          console.log('✅ Razorpay payment successful');
          try {
            await apiService.activatePaymentGatewayResponse(
              tpGatewayId,
              txnInfo.merTxnId,
              {
                ...result,
                amount: params.amount,
                pgInfo,
              },
              realm,
            );
            console.log('✅ Razorpay activation sent to backend');
          } catch (activationError) {
            console.error('Failed to activate Razorpay payment:', activationError);
          }

          await navigateWithServerStatus(
            navigation,
            txnInfo.merTxnId,
            null,
            pgInfo,
            params.amount,
            'success',
            result,
            tpGatewayId,
          );
        })
        .catch(async (error: any) => {
          console.log('=== RAZORPAY ERROR RESPONSE ===');
          try {
            console.log(JSON.stringify(error, null, 2));
          } catch (err) {
            console.log(error);
          }
          console.log('=== END ERROR RESPONSE ===');

          // Check if this is a cancellation error
          const isCancelled = 
            error === null ||
            error === undefined ||
            (error.error && (
              error.error.code === 'BAD_REQUEST_ERROR' ||
              error.error.code === 'GATEWAY_ERROR' ||
              error.error.code === 'PAYMENT_CANCELLED' ||
              (error.error.description && (
                error.error.description.toLowerCase().includes('cancel') ||
                error.error.description.toLowerCase().includes('cancelled') ||
                error.error.description.toLowerCase().includes('aborted')
              ))
            )) ||
            (error.code && (
              error.code === 'BAD_REQUEST_ERROR' ||
              error.code === 'GATEWAY_ERROR' ||
              error.code === 'PAYMENT_CANCELLED'
            )) ||
            (error.description && (
              error.description.toLowerCase().includes('cancel') ||
              error.description.toLowerCase().includes('cancelled') ||
              error.description.toLowerCase().includes('aborted')
            )) ||
            (typeof error === 'string' && (
              error.toLowerCase().includes('cancel') ||
              error.toLowerCase().includes('cancelled') ||
              error.toLowerCase().includes('aborted')
            ));

          const status = isCancelled ? 'failed' : 'failed';
          const errorMessage = isCancelled 
            ? 'Payment cancelled by user' 
            : (error?.description || error?.message || 'Payment failed');

          console.log(`⚠️ Razorpay payment ${isCancelled ? 'cancelled' : 'failed'}:`, errorMessage);

          await navigateWithServerStatus(
            navigation,
            txnInfo.merTxnId,
            null,
            pgInfo,
            params.amount,
            status,
            { ...error, cancelled: isCancelled, description: errorMessage },
            tpGatewayId,
          );
        });
    } else if (pgInfo === 'HDFC') {
      // For HDFC Smart Gateway, load the payment page with a simple GET request
      // (same behavior as opening the URL directly in a browser)
      txnInfo.merTxnId = res.data.txn_ref_no;
      source.uri = res.data.url;
      navigation.navigate("PaymentLink", { source: source, pgInfo: pgInfo, amount: params.amount, merTxnId: txnInfo.merTxnId })
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
