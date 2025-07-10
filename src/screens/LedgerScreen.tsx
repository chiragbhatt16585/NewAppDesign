import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  FlatList,
  Dimensions,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useTheme} from '../utils/ThemeContext';
import {getThemeColors} from '../utils/themeStyles';
import CommonHeader from '../components/CommonHeader';
import {useTranslation} from 'react-i18next';

const {width: screenWidth} = Dimensions.get('window');

const LedgerScreen = ({navigation}: any) => {
  const {isDark} = useTheme();
  const colors = getThemeColors(isDark);
  const {t} = useTranslation();
  const [activeTab, setActiveTab] = useState(0);

  // Mock data for proforma invoices
  const proformaInvoices = [
    {
      id: '1',
      no: 'PF-2024-001',
      date: '15 Jul 2024',
      particulars: 'Premium Fiber 100 Mbps - Monthly Plan',
      amount: '₹999',
    },
    {
      id: '2',
      no: 'PF-2024-002',
      date: '10 Jul 2024',
      particulars: 'Installation Charges - New Connection',
      amount: '₹500',
    },
    {
      id: '3',
      no: 'PF-2024-003',
      date: '05 Jul 2024',
      particulars: 'Additional Data Pack - 50 GB',
      amount: '₹200',
    },
    {
      id: '4',
      no: 'PF-2024-004',
      date: '25 Jun 2024',
      particulars: 'Premium Fiber 100 Mbps - Monthly Plan',
      amount: '₹999',
    },
  ];

  // Mock data for invoices generated
  const invoicesGenerated = [
    {
      id: '1',
      no: 'INV-2024-001',
      date: '15 Jul 2024',
      particulars: 'Premium Fiber 100 Mbps - Monthly Bill',
      amount: '₹999',
    },
    {
      id: '2',
      no: 'INV-2024-002',
      date: '10 Jul 2024',
      particulars: 'Installation Charges Invoice',
      amount: '₹500',
    },
    {
      id: '3',
      no: 'INV-2024-003',
      date: '05 Jul 2024',
      particulars: 'Additional Services Invoice',
      amount: '₹200',
    },
    {
      id: '4',
      no: 'INV-2024-004',
      date: '25 Jun 2024',
      particulars: 'Premium Fiber 100 Mbps - Monthly Bill',
      amount: '₹999',
    },
  ];

  // Mock data for payment received
  const paymentReceived = [
    {
      id: '1',
      no: 'PAY-2024-001',
      date: '15 Jul 2024',
      particulars: 'UPI Payment - Monthly Bill',
      amount: '₹999',
    },
    {
      id: '2',
      no: 'PAY-2024-002',
      date: '10 Jul 2024',
      particulars: 'Credit Card Payment - Installation',
      amount: '₹500',
    },
    {
      id: '3',
      no: 'PAY-2024-003',
      date: '05 Jul 2024',
      particulars: 'Net Banking - Additional Services',
      amount: '₹200',
    },
    {
      id: '4',
      no: 'PAY-2024-004',
      date: '25 Jun 2024',
      particulars: 'UPI Payment - Monthly Bill',
      amount: '₹999',
    },
  ];

  const tabs = [
    {id: 0, title: t('ledger.proforma')},
    {id: 1, title: t('ledger.invoices')},
    {id: 2, title: t('ledger.payments')},
  ];

  const renderProformaInvoiceItem = ({item}: {item: any}) => (
    <View style={[styles.itemCard, {backgroundColor: colors.card, shadowColor: colors.shadow}]}>
      <View style={styles.itemHeader}>
        <View style={styles.itemInfo}>
          <Text style={[styles.itemNo, {color: colors.text}]}>{item.no}</Text>
          <Text style={[styles.itemDate, {color: colors.textSecondary}]}>{item.date}</Text>
        </View>
        <TouchableOpacity style={styles.downloadButton}>
          <Text style={[styles.downloadIcon, {color: colors.accent}]}>📄</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.itemDetails}>
        <Text style={[styles.itemParticulars, {color: colors.text}]}>{item.particulars}</Text>
        <Text style={[styles.itemAmount, {color: colors.accent}]}>{item.amount}</Text>
      </View>
    </View>
  );

  const renderInvoiceGeneratedItem = ({item}: {item: any}) => (
    <View style={[styles.itemCard, {backgroundColor: colors.card, shadowColor: colors.shadow}]}>
      <View style={styles.itemHeader}>
        <View style={styles.itemInfo}>
          <Text style={[styles.itemNo, {color: colors.text}]}>{item.no}</Text>
          <Text style={[styles.itemDate, {color: colors.textSecondary}]}>{item.date}</Text>
        </View>
        <TouchableOpacity style={styles.downloadButton}>
          <Text style={[styles.downloadIcon, {color: colors.accent}]}>📄</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.itemDetails}>
        <Text style={[styles.itemParticulars, {color: colors.text}]}>{item.particulars}</Text>
        <Text style={[styles.itemAmount, {color: colors.accent}]}>{item.amount}</Text>
      </View>
    </View>
  );

  const renderPaymentReceivedItem = ({item}: {item: any}) => (
    <View style={[styles.itemCard, {backgroundColor: colors.card, shadowColor: colors.shadow}]}>
      <View style={styles.itemHeader}>
        <View style={styles.itemInfo}>
          <Text style={[styles.itemNo, {color: colors.text}]}>{item.no}</Text>
          <Text style={[styles.itemDate, {color: colors.textSecondary}]}>{item.date}</Text>
        </View>
        <TouchableOpacity style={styles.downloadButton}>
          <Text style={[styles.downloadIcon, {color: colors.accent}]}>📄</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.itemDetails}>
        <Text style={[styles.itemParticulars, {color: colors.text}]}>{item.particulars}</Text>
        <Text style={[styles.itemAmount, {color: colors.accent}]}>{item.amount}</Text>
      </View>
    </View>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 0:
        return (
          <FlatList
            data={proformaInvoices}
            renderItem={renderProformaInvoiceItem}
            keyExtractor={item => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContainer}
          />
        );
      case 1:
        return (
          <FlatList
            data={invoicesGenerated}
            renderItem={renderInvoiceGeneratedItem}
            keyExtractor={item => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContainer}
          />
        );
      case 2:
        return (
          <FlatList
            data={paymentReceived}
            renderItem={renderPaymentReceivedItem}
            keyExtractor={item => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContainer}
          />
        );
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={[styles.container, {backgroundColor: colors.background}]}>
      {/* Header */}
      <CommonHeader
        navigation={navigation}
      />

      {/* Page Heading */}
      <View style={styles.headingContainer}>
        <Text style={[styles.pageHeading, {color: colors.text}]}>{t('ledger.title')}</Text>
        <Text style={[styles.pageSubheading, {color: colors.textSecondary}]}>
          {t('ledger.subtitle')}
        </Text>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[
              styles.tab,
              activeTab === tab.id && {borderBottomColor: colors.primary},
            ]}
            onPress={() => setActiveTab(tab.id)}>
            <Text
              style={[
                styles.tabText,
                {color: activeTab === tab.id ? colors.primary : colors.textSecondary},
              ]}>
              {tab.title}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      <View style={styles.content}>
        {renderContent()}
      </View>

      {/* Bottom Total Section */}
      <View style={[styles.bottomSection, {backgroundColor: colors.card, shadowColor: colors.shadow}]}>
        <Text style={[styles.bottomSectionTitle, {color: colors.text}]}>{t('ledger.accountSummary')}</Text>
        
        <View style={styles.summaryRow}>
          <Text style={[styles.summaryLabel, {color: colors.textSecondary}]}>{t('ledger.openingBalance')}</Text>
          <Text style={[styles.summaryValue, {color: colors.text}]}>₹0.00</Text>
        </View>
        
        <View style={styles.summaryRow}>
          <Text style={[styles.summaryLabel, {color: colors.textSecondary}]}>{t('ledger.proformaAmount')}</Text>
          <Text style={[styles.summaryValue, {color: colors.accent}]}>₹2,698.00</Text>
        </View>
        
        <View style={styles.summaryRow}>
          <Text style={[styles.summaryLabel, {color: colors.textSecondary}]}>{t('ledger.billAmount')}</Text>
          <Text style={[styles.summaryValue, {color: colors.accent}]}>₹2,698.00</Text>
        </View>
        
        <View style={styles.summaryRow}>
          <Text style={[styles.summaryLabel, {color: colors.textSecondary}]}>{t('ledger.paidAmount')}</Text>
          <Text style={[styles.summaryValue, {color: colors.success}]}>₹2,698.00</Text>
        </View>
        
        <View style={[styles.summaryRow, styles.currentBalanceRow]}>
          <Text style={[styles.summaryLabel, styles.currentBalanceLabel, {color: colors.text}]}>{t('ledger.currentBalance')}</Text>
          <Text style={[styles.summaryValue, styles.currentBalanceValue, {color: colors.text}]}>₹0.00</Text>
        </View>
      </View>
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
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    marginHorizontal: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  listContainer: {
    paddingVertical: 16,
    paddingBottom: 200, // Add extra padding to avoid overlap with bottom section
  },
  itemCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  itemInfo: {
    flex: 1,
    marginRight: 12,
  },
  itemNo: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  itemDate: {
    fontSize: 14,
  },
  downloadButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  downloadIcon: {
    fontSize: 18,
  },
  itemParticulars: {
    fontSize: 14,
    flex: 1,
    marginRight: 12,
  },
  itemAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  itemDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  bottomSection: {
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
  bottomSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: 14,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  currentBalanceRow: {
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    marginTop: 8,
    paddingTop: 12,
  },
  currentBalanceLabel: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  currentBalanceValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default LedgerScreen; 