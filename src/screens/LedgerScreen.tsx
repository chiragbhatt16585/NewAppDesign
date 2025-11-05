import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  FlatList,
  Dimensions,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useTheme} from '../utils/ThemeContext';
import {getThemeColors} from '../utils/themeStyles';
import CommonHeader from '../components/CommonHeader';
import {useTranslation} from 'react-i18next';
import {apiService} from '../services/api';
import useMenuSettings from '../hooks/useMenuSettings';
import sessionManager from '../services/sessionManager';
import {downloadService} from '../services/downloadService';
import {useSessionValidation} from '../utils/useSessionValidation';

const {width: screenWidth} = Dimensions.get('window');

// console.log('=== LEDGER SCREEN: downloadService imported ===', downloadService);

const LedgerScreen = ({navigation}: any) => {
  const {isDark} = useTheme();
  const colors = getThemeColors(isDark);
  const {t} = useTranslation();
  const {checkSessionAndHandle} = useSessionValidation();
  const { menu } = useMenuSettings();
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [ledgerData, setLedgerData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  // Summary panel is always visible

  // State for different data types
  const [proformaInvoices, setProformaInvoices] = useState<any[]>([]);
  const [invoicesGenerated, setInvoicesGenerated] = useState<any[]>([]);
  const [paymentReceived, setPaymentReceived] = useState<any[]>([]);
  const [summaryData, setSummaryData] = useState<any>(null);
  const [displayFlags, setDisplayFlags] = useState<{ invoice: boolean; receipt: boolean; proforma: boolean }>({ invoice: true, receipt: true, proforma: true });
  const [showCounts, setShowCounts] = useState<{ invoice: number; receipt: number; proforma: number }>({ invoice: 0, receipt: 0, proforma: 0 });

  useEffect(() => {
    // console.log('=== LEDGER SCREEN: useEffect triggered ===');
    checkSessionAndLoadData();
  }, []);

  // Derive display flags and per-tab show counts from menu settings
  useEffect(() => {
    try {
      if (!Array.isArray(menu)) return;
      const ledgerEntry = menu.find((m: any) => (
        String(m?.menu_label) === 'Ledger' && String(m?.status).toLowerCase() === 'active'
      ));
      if (!ledgerEntry) return;
      const jsonVal = ledgerEntry.display_option_json;
      let parsed: any = {};
      if (typeof jsonVal === 'string') {
        const s = jsonVal.trim();
        if (s && (s.startsWith('{') || s.startsWith('['))) {
          try { parsed = JSON.parse(s); } catch { parsed = {}; }
        }
      } else if (jsonVal && typeof jsonVal === 'object') {
        parsed = jsonVal;
      }

      // New format: { ledger: [ {invoice:true, show_count:"5"}, {receipt:true, show_count:"5"}, {proforma:true, show_count:"5"} ] }
      // Backward-compatible: { ledger: { invoice:true, receipt:true, proforma:true } }
      const ledgerConfig = parsed?.ledger;
      let nextFlags = { invoice: true, receipt: true, proforma: true } as {invoice:boolean;receipt:boolean;proforma:boolean};
      let nextCounts = { invoice: 0, receipt: 0, proforma: 0 } as {invoice:number;receipt:number;proforma:number};

      if (Array.isArray(ledgerConfig)) {
        ledgerConfig.forEach((item: any) => {
          if (item && typeof item === 'object') {
            if (Object.prototype.hasOwnProperty.call(item, 'invoice')) {
              nextFlags.invoice = item.invoice !== false;
              const n = typeof item.show_count === 'string' ? parseInt(item.show_count, 10) : Number(item.show_count);
              nextCounts.invoice = Number.isFinite(n) ? n : 0;
            }
            if (Object.prototype.hasOwnProperty.call(item, 'receipt')) {
              nextFlags.receipt = item.receipt !== false;
              const n = typeof item.show_count === 'string' ? parseInt(item.show_count, 10) : Number(item.show_count);
              nextCounts.receipt = Number.isFinite(n) ? n : 0;
            }
            if (Object.prototype.hasOwnProperty.call(item, 'proforma')) {
              nextFlags.proforma = item.proforma !== false;
              const n = typeof item.show_count === 'string' ? parseInt(item.show_count, 10) : Number(item.show_count);
              nextCounts.proforma = Number.isFinite(n) ? n : 0;
            }
          }
        });
      } else if (ledgerConfig && typeof ledgerConfig === 'object') {
        nextFlags = {
          invoice: ledgerConfig.invoice !== false,
          receipt: ledgerConfig.receipt !== false,
          proforma: ledgerConfig.proforma !== false,
        };
        // No counts provided in legacy format
      }

      setDisplayFlags(nextFlags);
      setShowCounts(nextCounts);
    } catch {}
  }, [menu]);

  const checkSessionAndLoadData = async () => {
    try {
      // Check session validity before loading data
      const isSessionValid = await checkSessionAndHandle(navigation);
      if (!isSessionValid) {
        return;
      }
      
      // If session is valid, load ledger data
      loadLedgerData();
    } catch (error) {
      console.error('=== LEDGER SCREEN: Session check error ===', error);
      Alert.alert(
        'Authentication Error',
        'Please login again to continue.',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('Login')
          }
        ]
      );
    }
  };

  const loadLedgerData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Check session validity before making API call
      const isSessionValid = await checkSessionAndHandle(navigation);
      if (!isSessionValid) {
        // Don't return immediately, let the API call handle token regeneration
        console.log('Session validation failed, but continuing with API call');
      }
      
      const session = await sessionManager.getCurrentSession();
      if (!session?.username) {
        throw new Error('No user session found');
      }

      // Get current client configuration
      const {getClientConfig} = require('../config/client-config');
      const clientConfig = getClientConfig();
      const realm = clientConfig.clientId;
      
      const data = await apiService.userLedger(session.username, realm);
      // console.log('=== LEDGER SCREEN: API response data ===', data);
      
      // Extract data from the response array
      const payments = data[0] || [];
      const invoices = data[1] || [];
      const proforma = data[2] || [];
      const summary = data[3] || {};

      // console.log('=== LEDGER SCREEN: Extracted data ===', {
      //   payments: payments.length,
      //   invoices: invoices.length,
      //   proforma: proforma.length,
      //   summary
      // });

      // Transform data for display
      const transformedPayments = payments.map((item: any) => ({
        id: item.id,
        no: item.no,
        date: item.dateString,
        particulars: item.content,
        amount: `₹${item.amt}`,
      }));

      const transformedInvoices = invoices.map((item: any) => ({
        id: item.id,
        no: item.no,
        date: item.dateString,
        particulars: item.content,
        amount: `₹${item.amt}`,
      }));

      const transformedProforma = proforma.map((item: any) => ({
        id: item.id,
        no: item.no,
        date: item.dateString,
        particulars: item.content,
        amount: `₹${item.amt}`,
      }));

      // console.log('=== LEDGER SCREEN: Setting state with transformed data ===', {
      //   payments: transformedPayments.length,
      //   invoices: transformedInvoices.length,
      //   proforma: transformedProforma.length
      // });

      setPaymentReceived(transformedPayments);
      setInvoicesGenerated(transformedInvoices);
      setProformaInvoices(transformedProforma);
      setSummaryData(summary);
      setLedgerData(data);
      
      // console.log('=== LEDGER SCREEN: Data loading completed successfully ===');
    } catch (err: any) {
      console.error('=== LEDGER SCREEN: Error loading ledger data ===', err);
      setError(err.message || 'Failed to load ledger data');
      Alert.alert('Error', err.message || 'Failed to load ledger data');
    } finally {
      setLoading(false);
      // console.log('=== LEDGER SCREEN: Loading state set to false ===');
    }
  };

  const handleDownload = async (item: any) => {
    try {
      // console.log('=== LEDGER SCREEN: Download requested for item ===', item);
      // console.log('=== LEDGER SCREEN: downloadService ===', downloadService);
      
      if (!downloadService) {
        throw new Error('Download service is not available');
      }
      
      // Get the current tab's original ID to determine the type
      const currentTab = tabs[activeTab];
      const originalId = currentTab?.originalId ?? activeTab;
      
      let type: 'invoice' | 'receipt' | 'proforma';
      switch (originalId) {
        case 0:
          type = 'proforma';
          break;
        case 1:
          type = 'invoice';
          break;
        case 2:
          type = 'receipt';
          break;
        default:
          type = 'invoice';
      }
      
      // console.log('=== LEDGER SCREEN: Calling downloadPdf with ===', {
      //   id: item.id,
      //   type,
      //   invoiceNo: item.no
      // });
      
      await downloadService.downloadPdf({
        id: item.id,
        type,
        invoiceNo: item.no
      });
      
      // console.log('=== LEDGER SCREEN: Download completed successfully ===');
    } catch (error: any) {
      console.error('=== LEDGER SCREEN: Download error ===', error);
      Alert.alert('Download Error', error.message || 'Failed to download PDF');
    }
  };

  // Create dynamic tabs based on available data
  const getTabs = () => {
    const availableTabs = [];
    
    if (displayFlags.proforma && proformaInvoices.length > 0) {
      availableTabs.push({id: availableTabs.length, title: t('ledger.proforma'), originalId: 0});
    }
    
    if (displayFlags.invoice && invoicesGenerated.length > 0) {
      availableTabs.push({id: availableTabs.length, title: t('ledger.invoices'), originalId: 1});
    }
    
    if (displayFlags.receipt && paymentReceived.length > 0) {
      availableTabs.push({id: availableTabs.length, title: t('ledger.payments'), originalId: 2});
    }
    
    return availableTabs;
  };

  const tabs = getTabs();

  // Apply show_count limits per tab
  const limitedProforma = showCounts.proforma > 0 ? proformaInvoices.slice(0, showCounts.proforma) : proformaInvoices;
  const limitedInvoices = showCounts.invoice > 0 ? invoicesGenerated.slice(0, showCounts.invoice) : invoicesGenerated;
  const limitedReceipts = showCounts.receipt > 0 ? paymentReceived.slice(0, showCounts.receipt) : paymentReceived;

  const renderProformaInvoiceItem = ({item}: {item: any}) => (
    <View style={[styles.itemCard, {backgroundColor: colors.card, shadowColor: colors.shadow}]}>
      <View style={styles.itemHeader}>
        <View style={styles.itemInfo}>
          <Text style={[styles.itemNo, {color: colors.text}]}>{item.no}</Text>
          <Text style={[styles.itemDate, {color: colors.textSecondary}]}>{item.date}</Text>
        </View>
        <TouchableOpacity 
          style={styles.downloadButton}
          onPress={() => handleDownload(item)}
        >
          <Text style={[styles.downloadIcon, {color: '#4caf50'}]}>📄</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.itemDetails}>
        <Text style={[styles.itemParticulars, {color: colors.text}]}>{item.particulars}</Text>
        <Text style={[styles.itemAmount, {color: colors.text}]}>{item.amount}</Text>
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
        <TouchableOpacity 
          style={styles.downloadButton}
          onPress={() => handleDownload(item)}
        >
          <Text style={[styles.downloadIcon, {color: '#4caf50'}]}>📄</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.itemDetails}>
        <Text style={[styles.itemParticulars, {color: colors.text}]}>{item.particulars}</Text>
        <Text style={[styles.itemAmount, {color: colors.text}]}>{item.amount}</Text>
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
        <TouchableOpacity 
          style={styles.downloadButton}
          onPress={() => handleDownload(item)}
        >
          <Text style={[styles.downloadIcon, {color: '#4caf50'}]}>📄</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.itemDetails}>
        <Text style={[styles.itemParticulars, {color: colors.text}]}>{item.particulars}</Text>
        <Text style={[styles.itemAmount, {color: colors.text}]}>{item.amount}</Text>
      </View>
    </View>
  );

  const renderEmptyState = () => {
    const currentTab = tabs[activeTab];
    const tabTitle = currentTab?.title || 'transactions';
    
    return (
      <View style={styles.emptyContainer}>
        <Text style={[styles.emptyIcon, {color: colors.textSecondary}]}>📄</Text>
        <Text style={[styles.emptyTitle, {color: colors.text}]}>{t('ledger.noTransactions')}</Text>
        <Text style={[styles.emptySubtitle, {color: colors.textSecondary}]}>
          No {tabTitle.toLowerCase()} found
        </Text>
      </View>
    );
  };

  const renderContent = () => {
    // Get the current tab's original ID to determine which data to show
    const currentTab = tabs[activeTab];
    const originalId = currentTab?.originalId ?? activeTab;
    
    switch (originalId) {
      case 0:
        return (
          <FlatList
            data={limitedProforma}
            renderItem={renderProformaInvoiceItem}
            keyExtractor={item => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[
              styles.listContainer,
              limitedProforma.length === 0 && styles.emptyListContainer
            ]}
            refreshControl={
              <RefreshControl
                refreshing={loading}
                onRefresh={loadLedgerData}
                colors={[colors.primary]}
                tintColor={colors.primary}
              />
            }
            ListEmptyComponent={renderEmptyState}
          />
        );
      case 1:
        return (
          <FlatList
            data={limitedInvoices}
            renderItem={renderInvoiceGeneratedItem}
            keyExtractor={item => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[
              styles.listContainer,
              limitedInvoices.length === 0 && styles.emptyListContainer
            ]}
            refreshControl={
              <RefreshControl
                refreshing={loading}
                onRefresh={loadLedgerData}
                colors={[colors.primary]}
                tintColor={colors.primary}
              />
            }
            ListEmptyComponent={renderEmptyState}
          />
        );
      case 2:
        return (
          <FlatList
            data={limitedReceipts}
            renderItem={renderPaymentReceivedItem}
            keyExtractor={item => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[
              styles.listContainer,
              limitedReceipts.length === 0 && styles.emptyListContainer
            ]}
            refreshControl={
              <RefreshControl
                refreshing={loading}
                onRefresh={loadLedgerData}
                colors={[colors.primary]}
                tintColor={colors.primary}
              />
            }
            ListEmptyComponent={renderEmptyState}
          />
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, {backgroundColor: colors.background}]}>
        <CommonHeader navigation={navigation} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, {color: colors.text}]}>Loading ledger data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.container, {backgroundColor: colors.background}]}>
        <CommonHeader navigation={navigation} />
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, {color: colors.text}]}>Error loading ledger data</Text>
          <Text style={[styles.errorMessage, {color: colors.textSecondary}]}>{error}</Text>
          <TouchableOpacity 
            style={[styles.retryButton, {backgroundColor: colors.primary}]}
            onPress={loadLedgerData}
          >
            <Text style={[styles.retryButtonText, {color: '#FFFFFF'}]}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

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

      {/* Account Summary (always visible, non-collapsible) */}
      <View style={[styles.bottomSection, {backgroundColor: colors.card, shadowColor: colors.shadow}]}> 
        <View style={styles.summaryHeader}>
          <View style={styles.summaryHeaderContent}>
            <Text style={[styles.bottomSectionTitle, {color: colors.text}]}>{t('ledger.accountSummary')}</Text>
          </View>
        </View>
        <View style={styles.expandedSummary}>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, {color: colors.textSecondary}]}>{t('ledger.openingBalance')}</Text>
            <Text style={[styles.summaryValue, {color: colors.text}]}>₹{summaryData?.openingBalance || 0}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, {color: colors.textSecondary}]}>{t('ledger.proformaAmount')}</Text>
            <Text style={[styles.summaryValue, {color: colors.text}]}>₹{summaryData?.proforma_invoice || 0}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, {color: colors.textSecondary}]}>{t('ledger.billAmount')}</Text>
            <Text style={[styles.summaryValue, {color: colors.text}]}>₹{summaryData?.billAmount || 0}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, {color: colors.textSecondary}]}>{t('ledger.paidAmount')}</Text>
            <Text style={[styles.summaryValue, {color: colors.text}]}>₹{summaryData?.paidAmount || 0}</Text>
          </View>
          <View style={[styles.summaryRow, {paddingTop: 10, borderTopWidth: 1, borderTopColor: '#e0e0e0'}]}>
            <Text style={[styles.summaryLabel, {color: colors.textSecondary, fontWeight: '600'}]}>{t('ledger.currentBalance')}</Text>
            {(() => {
              const duesRaw = summaryData?.balance ?? 0;
              const dues = Number(duesRaw) || 0;
              const isZero = dues === 0;
              const isDr = dues > 0;
              const displayValue = Math.abs(dues).toFixed(2);
              return (
                <Text style={[styles.summaryValue, {color: colors.text, fontWeight: 'bold'}]}>
                  ₹{isZero ? '0.00' : displayValue}
                  {!isZero ? ' ' : ''}
                  {!isZero ? (
                    <Text style={{color: isDr ? '#d32f2f' : '#2e7d32'}}>{isDr ? 'DR' : 'CR'}</Text>
                  ) : null}
                </Text>
              );
            })()}
          </View>
        </View>
      </View>

      {/* Tab Navigation */}
      {tabs.length > 0 && (
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
      )}

      {/* Content */}
      <View style={styles.content}>
        {tabs.length > 0 ? (
          renderContent()
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyIcon, {color: colors.textSecondary}]}>📄</Text>
            <Text style={[styles.emptyTitle, {color: colors.text}]}>{t('ledger.noTransactions')}</Text>
            <Text style={[styles.emptySubtitle, {color: colors.textSecondary}]}>
              No transaction data available
            </Text>
          </View>
        )}
      </View>

      {/* Account Summary moved above; bottom section removed */}
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
    paddingBottom: 120, // Reduced padding since summary is now compact
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
    backgroundColor: '#e8f5e8',
    borderWidth: 1,
    borderColor: '#4caf50',
  },
  downloadIcon: {
    fontSize: 20,
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
    marginBottom: 12,
    borderRadius: 12,
    padding: 12,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryHeaderContent: {
    flex: 1,
  },
  expandIcon: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  expandedSummary: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  compactBalanceRow: {
    marginTop: 4,
    paddingTop: 0,
    borderTopWidth: 0,
  },
  bottomSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  summaryLabel: {
    fontSize: 13,
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: '600',
  },
  currentBalanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  loadingText: {
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  errorText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
  emptyListContainer: {
    flex: 1,
    justifyContent: 'center',
  },
});

export default LedgerScreen; 