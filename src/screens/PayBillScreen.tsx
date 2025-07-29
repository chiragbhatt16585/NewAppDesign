import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  TouchableWithoutFeedback,
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
import {apiService} from '../services/api';
import { credentialStorage } from '../services/credentialStorage';

const PayBillScreen = ({navigation}: any) => {
  const {isDark} = useTheme();
  const colors = getThemeColors(isDark);
  const {t} = useTranslation();
  const [showPaymentModal, setShowPaymentModal] = React.useState(false);
  const [selectedGateway, setSelectedGateway] = React.useState('');
  const [paymentGateways, setPaymentGateways] = React.useState<any[]>([]);
  const [loadingGateways, setLoadingGateways] = React.useState(false);
  const [gatewayError, setGatewayError] = React.useState('');
  const [authData, setAuthData] = React.useState<any>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [summary, setSummary] = React.useState<any>(null);

  React.useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const session = await sessionManager.getCurrentSession();
        if (!session?.username) {
          setError('No user session found. Please login again.');
          setIsLoading(false);
          return;
        }
        const data = await apiService.authUser(session.username);
        setAuthData(data);
        // Fetch account summary from userLedger (like LedgerScreen)
        const {getClientConfig} = require('../config/client-config');
        const clientConfig = getClientConfig();
        const realm = clientConfig.clientId;
        const ledgerData = await apiService.userLedger(session.username, realm);
        setSummary(ledgerData[3] || {});
      } catch (e: any) {
        setError(e.message || 'Failed to fetch account data.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const handlePayDues = async () => {
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

      console.log('=== PAYMENT GATEWAY DEBUG ===');
      console.log('Current session username:', session.username);
      console.log('Session isLoggedIn:', session.isLoggedIn);
      
      // Get admin_login_id from authData
      let adminId = authData?.admin_login_id;
      if (!adminId) {
        console.log('No admin_login_id in authData, fetching from authUser...');
        try {
          const authDataRefresh = await apiService.authUser(session.username);
          adminId = authDataRefresh.admin_login_id;
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
    
    // Check ATOM minimum amount requirement
    if (selectedGatewayObj?.gw_display_name?.toLowerCase().includes('atom') && existingDues < 50) {
      Alert.alert(
        'ATOM Payment Gateway',
        'ATOM requires minimum Rs. 50 for payment. Please select a different payment gateway or contact support.',
        [
          {
            text: 'OK',
            onPress: () => setShowPaymentModal(true), // Reopen modal to select different gateway
          },
        ]
      );
      return;
    }
    
    const params = {
      amount: existingDues,
      adminname: authData?.admin_login_id,
      username: session.username,
      planname: planName,
      selectedPGType: [{ label: selectedGatewayObj.gw_display_name, value: selectedGatewayObj.id }],
      payActionType: 'payDues',
    };
    
    console.log('=== PAYMENT DUES DEBUG ===');
    console.log('Payment Type: PAY DUES (not renewal)');
    console.log('Amount:', existingDues);
    console.log('Admin Login ID:', authData?.admin_login_id);
    console.log('Username:', session.username);
    console.log('Plan Name:', planName);
    console.log('Selected Gateway:', selectedGatewayObj);
    console.log('Pay Action Type:', 'payDues');
    console.log('Realm:', realm);
    console.log('Full Params Object:', JSON.stringify(params, null, 2));
    console.log('=== END PAYMENT DUES DEBUG ===');
    
    handlePayment(params, 'payDues', navigation, realm);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, {backgroundColor: colors.background}]}> 
        <CommonHeader navigation={navigation} />
        <View style={{flex:1, justifyContent:'center', alignItems:'center'}}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{marginTop:16, color: colors.textSecondary}}>Loading account data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.container, {backgroundColor: colors.background}]}> 
        <CommonHeader navigation={navigation} />
        <View style={{flex:1, justifyContent:'center', alignItems:'center'}}>
          <Text style={{color: colors.error, fontSize: 16, marginBottom: 12}}>Error</Text>
          <Text style={{color: colors.textSecondary}}>{error}</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Fallbacks for missing data
  const planName = authData?.current_plan || 'N/A';
  const planSpeed = authData?.plan_download_speed ? `${authData.plan_download_speed} Mbps` : 'N/A';
  const renewDate = authData?.renew_date || 'N/A';
  const expDate = authData?.exp_date || 'N/A';
  // Account summary from ledger
  const openingBalance = summary?.openingBalance || 0;
  const proformaInvoiceAmount = summary?.proforma_invoice || 0;
  const billAmount = summary?.billAmount || 0;
  const amountPaid = summary?.paidAmount || 0;
  const currentBalance = summary?.balance || 0;
  const existingDues = authData?.payment_dues || 0;

  return (
    <SafeAreaView style={[styles.container, {backgroundColor: colors.background}]}> 
      {/* Header */}
      <CommonHeader navigation={navigation} />

      {/* Page Heading */}
      <View style={styles.headingContainer}>
        <Text style={[styles.pageHeading, {color: colors.text}]}> {t('payBill.title')} </Text>
        <Text style={[styles.pageSubheading, {color: colors.textSecondary}]}> {t('payBill.subtitle')} </Text>
      </View>

      {/* Content */}
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Active Plan Details */}
          <View style={[styles.sectionCard, {backgroundColor: colors.card, shadowColor: colors.shadow}]}> 
            <Text style={[styles.sectionTitle, {color: colors.text}]}>{t('payBill.activePlan')}</Text>
            <View style={styles.planDetails}>
              <View style={styles.planDetailRow}>
                <Text style={styles.detailIcon}>🚀</Text>
                <Text style={[styles.detailLabel, {color: colors.textSecondary}]}>{t('payBill.planName')}</Text>
                <Text style={[styles.detailValue, {color: colors.text}]}>{planName}</Text>
              </View>
              <View style={styles.planDetailRow}>
                <Text style={styles.detailIcon}>⚡</Text>
                <Text style={[styles.detailLabel, {color: colors.textSecondary}]}>{t('payBill.speed')}</Text>
                <Text style={[styles.detailValue, {color: colors.text}]}>{planSpeed}</Text>
              </View>
              <View style={styles.planDetailRow}>
                <Text style={styles.detailIcon}>⏰</Text>
                <Text style={[styles.detailLabel, {color: colors.textSecondary}]}>{t('payBill.renewDate')}</Text>
                <Text style={[styles.detailValue, {color: colors.text}]}>{renewDate}</Text>
              </View>
              <View style={styles.planDetailRow}>
                <Text style={styles.detailIcon}>📅</Text>
                <Text style={[styles.detailLabel, {color: colors.textSecondary}]}>{t('payBill.expDate')}</Text>
                <Text style={[styles.detailValue, {color: colors.text}]}>{expDate}</Text>
              </View>
            </View>
          </View>

          {/* Account Summary */}
          <View style={[styles.sectionCard, {backgroundColor: colors.card, shadowColor: colors.shadow}]}> 
            <Text style={[styles.sectionTitle, {color: colors.text}]}>{t('payBill.accountSummary')}</Text>
            <View style={styles.summaryDetails}>
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, {color: colors.textSecondary}]}>{t('payBill.openingBalance')}</Text>
                <Text style={[styles.summaryValue, {color: colors.text}]}>₹{openingBalance}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, {color: colors.textSecondary}]}>{t('payBill.billAmount')}</Text>
                <Text style={[styles.summaryValue, {color: colors.text}]}>₹{billAmount}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, {color: colors.textSecondary}]}>{t('payBill.amountPaid')}</Text>
                <Text style={[styles.summaryValue, {color: colors.text}]}>₹{amountPaid}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, {color: colors.textSecondary}]}>{t('payBill.proformaInvoiceAmount')}</Text>
                <Text style={[styles.summaryValue, {color: colors.text}]}>₹{proformaInvoiceAmount}</Text>
              </View>
              <View style={[styles.summaryRow, styles.totalRow]}>
                <Text style={[styles.summaryLabel, styles.totalLabel, {color: colors.text}]}>{t('payBill.currentBalance')}</Text>
                <Text style={[styles.summaryValue, styles.totalValue, {color: colors.accent}]}>₹{currentBalance}</Text>
              </View>
            </View>
          </View>

          {/* Existing Dues */}
          <View style={[styles.sectionCard, {backgroundColor: colors.card, shadowColor: colors.shadow}]}> 
            <Text style={[styles.sectionTitle, {color: colors.text}]}>{t('payBill.existingDues')}</Text>
            <View style={styles.duesSection}>
              <View style={styles.duesRow}>
                <Text style={[styles.duesLabel, {color: colors.textSecondary}]}>{t('payBill.duesAmount')}</Text>
                <Text style={[styles.duesValue, {color: colors.accent}]}>₹{existingDues}</Text>
              </View>
              {existingDues > 0 && (
                <TouchableOpacity
                  style={[styles.payDuesButton, {backgroundColor: colors.primary}]}
                  onPress={handlePayDues}>
                  <Text style={styles.payDuesButtonText}>
                    {t('payBill.payDues')} - ₹{existingDues}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Payment Gateway Modal */}
      <Modal
        visible={showPaymentModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPaymentModal(false)}>
        <TouchableWithoutFeedback onPress={() => setShowPaymentModal(false)}>
          <View style={{flex: 1, backgroundColor: 'rgba(0,0,0,0.4)'}} />
        </TouchableWithoutFeedback>
        <View style={styles.paymentModalContainer}>
          <Text style={styles.paymentModalTitle}>Select Payment Gateway</Text>
          {loadingGateways ? (
            <Text style={{marginVertical: 20}}>{t('common.loading') || 'Loading...'}</Text>
          ) : gatewayError ? (
            <Text style={{color: 'red', marginVertical: 20}}>{gatewayError}</Text>
          ) : paymentGateways.length === 0 ? (
            <Text style={{marginVertical: 20}}>{t('payBill.noGateways') || 'No gateways available'}</Text>
          ) : (
            paymentGateways.map((gateway: any) => (
              <TouchableOpacity
                key={gateway.id}
                style={[styles.gatewayOption, selectedGateway === gateway.id && {backgroundColor: colors.primaryLight}]}
                onPress={() => setSelectedGateway(gateway.id)}>
                <Text style={[styles.gatewayLabel, {color: selectedGateway === gateway.id ? colors.primary : colors.text}]}>{gateway.gw_display_name}</Text>
                {selectedGateway === gateway.id && <Text style={{color: colors.primary, fontWeight: 'bold'}}>✓</Text>}
              </TouchableOpacity>
            ))
          )}
          <TouchableOpacity
            style={[styles.paymentGatewayButton, {backgroundColor: selectedGateway ? colors.primary : colors.border}]}
            disabled={!selectedGateway}
            onPress={handleGatewayPay}>
            <Text style={[styles.paymentGatewayButtonText, {color: selectedGateway ? '#fff' : colors.textSecondary}]}>
              Pay with {selectedGateway ? paymentGateways.find(g => g.id === selectedGateway)?.gw_display_name : ''}
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
  sectionCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  planDetails: {
    gap: 12,
  },
  planDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailIcon: {
    fontSize: 18,
    marginRight: 12,
  },
  detailLabel: {
    fontSize: 14,
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  summaryDetails: {
    gap: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 14,
  },
  summaryValue: {
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
  duesSection: {
    alignItems: 'center',
  },
  duesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 16,
  },
  duesLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  duesValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  payDuesButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  payDuesButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  paymentModalContainer: {
    position: 'absolute',
    left: 20,
    right: 20,
    top: '30%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
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
    backgroundColor: '#f5f5f5',
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
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
});

export default PayBillScreen; 