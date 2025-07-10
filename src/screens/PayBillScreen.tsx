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
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useTheme} from '../utils/ThemeContext';
import {getThemeColors} from '../utils/themeStyles';
import CommonHeader from '../components/CommonHeader';
import {useTranslation} from 'react-i18next';

interface AccountData {
  openingBalance: number;
  billAmount: number;
  amountPaid: number;
  proformaInvoiceAmount: number;
  currentBalance: number;
  existingDues: number;
  renewDate: string;
  expDate: string;
}

const paymentGateways = [
  { key: 'atom', label: 'ATOM' },
  { key: 'paytm', label: 'Paytm' },
  { key: 'easebuzz', label: 'EASEBUZZ' },
  { key: 'razorpay', label: 'RazorPay' },
];

const PayBillScreen = ({navigation}: any) => {
  const {isDark} = useTheme();
  const colors = getThemeColors(isDark);
  const {t} = useTranslation();
  
  const [showPaymentModal, setShowPaymentModal] = React.useState(false);
  const [selectedGateway, setSelectedGateway] = React.useState('');

  // Mock account data
  const accountData: AccountData = {
    openingBalance: 1500,
    billAmount: 999,
    amountPaid: 500,
    proformaInvoiceAmount: 1499,
    currentBalance: 999,
    existingDues: 250,
    renewDate: '15 Dec 2024',
    expDate: '15 Jan 2025',
  };

  const handlePayDues = () => {
    setShowPaymentModal(true);
  };

  const handleGatewayPay = () => {
    setShowPaymentModal(false);
    Alert.alert(
      t('payBill.paymentSuccess'),
      t('payBill.paymentSuccessMessage'),
      [
        {
          text: t('common.ok'),
          onPress: () => navigation.navigate('Home'),
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, {backgroundColor: colors.background}]}>
      {/* Header */}
      <CommonHeader navigation={navigation} />

      {/* Page Heading */}
      <View style={styles.headingContainer}>
        <Text style={[styles.pageHeading, {color: colors.text}]}>
          {t('payBill.title')}
        </Text>
        <Text style={[styles.pageSubheading, {color: colors.textSecondary}]}>
          {t('payBill.subtitle')}
        </Text>
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
                <Text style={[styles.detailValue, {color: colors.text}]}>Premium Plan</Text>
              </View>
              <View style={styles.planDetailRow}>
                <Text style={styles.detailIcon}>⚡</Text>
                <Text style={[styles.detailLabel, {color: colors.textSecondary}]}>{t('payBill.speed')}</Text>
                <Text style={[styles.detailValue, {color: colors.text}]}>500 Mbps</Text>
              </View>
              <View style={styles.planDetailRow}>
                <Text style={styles.detailIcon}>⏰</Text>
                <Text style={[styles.detailLabel, {color: colors.textSecondary}]}>{t('payBill.renewDate')}</Text>
                <Text style={[styles.detailValue, {color: colors.text}]}>{accountData.renewDate}</Text>
              </View>
              <View style={styles.planDetailRow}>
                <Text style={styles.detailIcon}>📅</Text>
                <Text style={[styles.detailLabel, {color: colors.textSecondary}]}>{t('payBill.expDate')}</Text>
                <Text style={[styles.detailValue, {color: colors.text}]}>{accountData.expDate}</Text>
              </View>
            </View>
          </View>

          {/* Account Summary */}
          <View style={[styles.sectionCard, {backgroundColor: colors.card, shadowColor: colors.shadow}]}>
            <Text style={[styles.sectionTitle, {color: colors.text}]}>{t('payBill.accountSummary')}</Text>
            
            <View style={styles.summaryDetails}>
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, {color: colors.textSecondary}]}>{t('payBill.openingBalance')}</Text>
                <Text style={[styles.summaryValue, {color: colors.text}]}>₹{accountData.openingBalance}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, {color: colors.textSecondary}]}>{t('payBill.billAmount')}</Text>
                <Text style={[styles.summaryValue, {color: colors.text}]}>₹{accountData.billAmount}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, {color: colors.textSecondary}]}>{t('payBill.amountPaid')}</Text>
                <Text style={[styles.summaryValue, {color: colors.text}]}>₹{accountData.amountPaid}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, {color: colors.textSecondary}]}>{t('payBill.proformaInvoiceAmount')}</Text>
                <Text style={[styles.summaryValue, {color: colors.text}]}>₹{accountData.proformaInvoiceAmount}</Text>
              </View>
              <View style={[styles.summaryRow, styles.totalRow]}>
                <Text style={[styles.summaryLabel, styles.totalLabel, {color: colors.text}]}>{t('payBill.currentBalance')}</Text>
                <Text style={[styles.summaryValue, styles.totalValue, {color: colors.accent}]}>₹{accountData.currentBalance}</Text>
              </View>
            </View>
          </View>

          {/* Existing Dues */}
          <View style={[styles.sectionCard, {backgroundColor: colors.card, shadowColor: colors.shadow}]}>
            <Text style={[styles.sectionTitle, {color: colors.text}]}>{t('payBill.existingDues')}</Text>
            
            <View style={styles.duesSection}>
              <View style={styles.duesRow}>
                <Text style={[styles.duesLabel, {color: colors.textSecondary}]}>{t('payBill.duesAmount')}</Text>
                <Text style={[styles.duesValue, {color: colors.accent}]}>₹{accountData.existingDues}</Text>
              </View>
              
              <TouchableOpacity
                style={[styles.payDuesButton, {backgroundColor: colors.primary}]}
                onPress={handlePayDues}>
                <Text style={styles.payDuesButtonText}>
                  {t('payBill.payDues')} - ₹{accountData.existingDues}
                </Text>
              </TouchableOpacity>
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
          <Text style={styles.paymentModalTitle}>{t('payBill.selectPaymentGateway')}</Text>
          {paymentGateways.map(gateway => (
            <TouchableOpacity
              key={gateway.key}
              style={[styles.gatewayOption, selectedGateway === gateway.key && {backgroundColor: colors.primaryLight}]}
              onPress={() => setSelectedGateway(gateway.key)}>
              <Text style={[styles.gatewayLabel, {color: selectedGateway === gateway.key ? colors.primary : colors.text}]}>{gateway.label}</Text>
              {selectedGateway === gateway.key && <Text style={{color: colors.primary, fontWeight: 'bold'}}>✓</Text>}
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={[styles.paymentGatewayButton, {backgroundColor: selectedGateway ? colors.primary : colors.border}]}
            disabled={!selectedGateway}
            onPress={handleGatewayPay}>
            <Text style={[styles.paymentGatewayButtonText, {color: selectedGateway ? '#fff' : colors.textSecondary}]}>
              {t('payBill.payWith')} {selectedGateway ? paymentGateways.find(g => g.key === selectedGateway)?.label : ''}
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