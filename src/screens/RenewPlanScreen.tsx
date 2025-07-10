import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  FlatList,
  Alert,
  Modal,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useTheme} from '../utils/ThemeContext';
import {getThemeColors} from '../utils/themeStyles';
import CommonHeader from '../components/CommonHeader';
import {useTranslation} from 'react-i18next';

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
  isExpanded?: boolean;
}

const RenewPlanScreen = ({navigation}: any) => {
  const {isDark} = useTheme();
  const colors = getThemeColors(isDark);
  const {t} = useTranslation();

  // Mock plan data - replace with actual API data
  const [plansData, setPlansData] = useState<PlanData[]>([
    {
      id: '1',
      name: 'Premium Fiber 100 Mbps',
      speed: '100 Mbps',
      upload: '50 Mbps',
      download: '100 Mbps',
      validity: '30 Days',
      price: 999,
      baseAmount: 847.46,
      cgst: 76.27,
      sgst: 76.27,
      mrp: 999,
      dues: 150,
      gbLimit: 100,
      isCurrentPlan: true,
      ottServices: ['Netflix', 'Amazon Prime'],
    },
    {
      id: '2',
      name: 'Premium Fiber 200 Mbps',
      speed: '200 Mbps',
      upload: '100 Mbps',
      download: '200 Mbps',
      validity: '30 Days',
      price: 1499,
      baseAmount: 1270.34,
      cgst: 114.33,
      sgst: 114.33,
      mrp: 1499,
      dues: 0,
      gbLimit: 200,
      isCurrentPlan: false,
      ottServices: ['Netflix', 'Amazon Prime', 'Disney+ Hotstar'],
    },
    {
      id: '3',
      name: 'Premium Fiber 500 Mbps',
      speed: '500 Mbps',
      upload: '250 Mbps',
      download: '500 Mbps',
      validity: '30 Days',
      price: 2499,
      baseAmount: 2117.80,
      cgst: 190.60,
      sgst: 190.60,
      mrp: 2499,
      dues: 0,
      gbLimit: 500,
      isCurrentPlan: false,
      ottServices: ['Netflix', 'Amazon Prime', 'Disney+ Hotstar', 'JioCinema'],
    },
    {
      id: '4',
      name: 'Premium Fiber 1 Gbps',
      speed: '1 Gbps',
      upload: '500 Mbps',
      download: '1 Gbps',
      validity: '30 Days',
      price: 3999,
      baseAmount: 3388.98,
      cgst: 305.01,
      sgst: 305.01,
      mrp: 3999,
      dues: 0,
      gbLimit: 1000,
      isCurrentPlan: false,
      ottServices: ['Netflix', 'Amazon Prime', 'Disney+ Hotstar', 'JioCinema', 'SonyLIV'],
    },
  ]);

  const [selectedPlan, setSelectedPlan] = useState<PlanData>(plansData[0]);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showSortModal, setShowSortModal] = useState(false);
  const [sortOption, setSortOption] = useState('price-low-high');
  const [filters, setFilters] = useState({
    speed: '',
    validity: '',
    price: '',
    gbLimit: '',
    ottPlan: '',
  });

  const handlePlanSelect = (plan: PlanData) => {
    setSelectedPlan(plan);
  };

  const handlePlanExpand = (planId: string) => {
    setPlansData(prevPlans => 
      prevPlans.map(plan => 
        plan.id === planId 
          ? { ...plan, isExpanded: !plan.isExpanded }
          : { ...plan, isExpanded: false }
      )
    );
  };

  const getFilteredAndSortedPlans = () => {
    let filteredPlans = [...plansData];

    // Apply filters
    if (filters.speed) {
      filteredPlans = filteredPlans.filter(plan => 
        plan.speed.toLowerCase().includes(filters.speed.toLowerCase())
      );
    }
    if (filters.validity) {
      filteredPlans = filteredPlans.filter(plan => 
        plan.validity.toLowerCase().includes(filters.validity.toLowerCase())
      );
    }
    if (filters.price) {
      const priceRange = filters.price.split('-');
      if (priceRange.length === 2) {
        const minPrice = parseInt(priceRange[0]);
        const maxPrice = parseInt(priceRange[1]);
        filteredPlans = filteredPlans.filter(plan => 
          plan.mrp >= minPrice && plan.mrp <= maxPrice
        );
      }
    }
    if (filters.gbLimit) {
      if (filters.gbLimit === 'Fair Usage Unlimited') {
        filteredPlans = filteredPlans.filter(plan => plan.gbLimit === -1);
      } else {
        const gbRange = filters.gbLimit.split('-');
        if (gbRange.length === 2) {
          const minGB = parseInt(gbRange[0]);
          const maxGB = parseInt(gbRange[1]);
          filteredPlans = filteredPlans.filter(plan => 
            plan.gbLimit >= minGB && plan.gbLimit <= maxGB
          );
        }
      }
    }
    if (filters.ottPlan) {
      if (filters.ottPlan === 'With OTT') {
        filteredPlans = filteredPlans.filter(plan => 
          plan.ottServices && plan.ottServices.length > 0
        );
      } else if (filters.ottPlan === 'Without OTT') {
        filteredPlans = filteredPlans.filter(plan => 
          !plan.ottServices || plan.ottServices.length === 0
        );
      }
    }

    // Apply sorting
    switch (sortOption) {
      case 'price-low-high':
        filteredPlans.sort((a, b) => a.mrp - b.mrp);
        break;
      case 'price-high-low':
        filteredPlans.sort((a, b) => b.mrp - a.mrp);
        break;
      case 'speed-high-low':
        filteredPlans.sort((a, b) => {
          const speedA = parseInt(a.speed.split(' ')[0]);
          const speedB = parseInt(b.speed.split(' ')[0]);
          return speedB - speedA;
        });
        break;
      case 'validity-high-low':
        filteredPlans.sort((a, b) => {
          const validityA = parseInt(a.validity.split(' ')[0]);
          const validityB = parseInt(b.validity.split(' ')[0]);
          return validityB - validityA;
        });
        break;
      case 'gb-high-low':
        filteredPlans.sort((a, b) => b.gbLimit - a.gbLimit);
        break;
    }

    return filteredPlans;
  };

  const handlePayNow = () => {
    navigation.navigate('PlanConfirmation', {
      selectedPlan: selectedPlan,
      totalAmount: selectedPlan.dues > 0 ? selectedPlan.mrp + selectedPlan.dues : selectedPlan.mrp,
    });
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

  const renderPlanItem = ({item}: {item: PlanData}) => (
    <TouchableOpacity
      style={[
        styles.planCard,
        {backgroundColor: colors.card, shadowColor: colors.shadow},
        selectedPlan.id === item.id && {borderColor: colors.primary, borderWidth: 2},
        item.isCurrentPlan && {borderColor: colors.success, borderWidth: 2},
      ]}
      onPress={() => handlePlanExpand(item.id)}>
      
      {/* Compact Plan Header */}
      <View style={styles.planHeader}>
        <View style={styles.planInfo}>
          <View style={styles.planTitleRow}>
            <Text style={styles.planIcon}>🚀</Text>
            <View style={styles.planTitleContainer}>
              <Text style={[styles.planName, {color: colors.text}]}>{item.name}</Text>
              <View style={styles.planBadges}>
                {item.isCurrentPlan && (
                  <View style={[styles.currentPlanBadge, {backgroundColor: colors.success}]}>
                    <Text style={styles.currentPlanText}>{t('renewPlan.currentPlan')}</Text>
                  </View>
                )}

              </View>
            </View>
          </View>
        </View>
        <View style={styles.planPriceContainer}>
          <View style={[styles.priceBadge, {backgroundColor: colors.primaryLight}]}>
            <Text style={[styles.priceText, {color: colors.primary}]}>₹{item.mrp}</Text>
          </View>
          <TouchableOpacity 
            style={styles.expandButton}
            onPress={() => handlePlanExpand(item.id)}>
            <Text style={[styles.expandIcon, {color: colors.textSecondary}]}>
              {item.isExpanded ? '▼' : '▶'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Compact Plan Details */}
      <View style={styles.compactDetails}>
        <View style={styles.compactDetailRow}>
          <Text style={styles.detailIcon}>⚡</Text>
          <Text style={[styles.detailValue, {color: colors.text}]}>{item.speed}</Text>
        </View>
        {item.ottServices && item.ottServices.length > 0 && (
          <View style={styles.compactDetailRow}>
            <Text style={styles.detailIcon}>🎬</Text>
            <Text style={[styles.detailValue, {color: colors.text}]}>OTT</Text>
          </View>
        )}
        <View style={styles.compactDetailRow}>
          <Text style={styles.detailIcon}>⏰</Text>
          <Text style={[styles.detailValue, {color: colors.text}]}>{item.validity}</Text>
        </View>
      </View>

      {/* Expanded Details */}
      {item.isExpanded && (
        <View style={styles.expandedSection}>
          {/* Full Plan Details */}
          <View style={styles.planDetails}>
            <View style={styles.detailRow}>
              <Text style={styles.detailIcon}>⬆️</Text>
              <Text style={[styles.detailValue, {color: colors.text}]}>{item.upload}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailIcon}>⬇️</Text>
              <Text style={[styles.detailValue, {color: colors.text}]}>{item.download}</Text>
            </View>
          </View>

          {/* OTT Services */}
          {item.ottServices && item.ottServices.length > 0 && (
            <View style={styles.ottSection}>
              <Text style={[styles.ottTitle, {color: colors.textSecondary}]}>🎬 {t('renewPlan.ottServices')}</Text>
              <View style={styles.ottIcons}>
                {item.ottServices.map((service, index) => (
                  <View key={index} style={styles.ottIcon}>
                    <Text style={styles.ottIconText}>{getOTTIcon(service)}</Text>
                    <Text style={[styles.ottServiceName, {color: colors.textSecondary}]}>{service}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Price Breakdown */}
          <View style={styles.priceBreakdownSection}>
            <Text style={[styles.priceBreakdownTitle, {color: colors.textSecondary}]}>💰 {t('renewPlan.pricingBreakdown')}</Text>
            <View style={styles.priceBreakdownList}>
              <View style={styles.priceBreakdownRow}>
                <Text style={[styles.priceBreakdownLabel, {color: colors.textSecondary}]}>{t('renewPlan.baseAmount')}</Text>
                <Text style={[styles.priceBreakdownValue, {color: colors.text}]}>₹{item.baseAmount}</Text>
              </View>
              <View style={styles.priceBreakdownRow}>
                <Text style={[styles.priceBreakdownLabel, {color: colors.textSecondary}]}>{t('renewPlan.cgst')} (9%)</Text>
                <Text style={[styles.priceBreakdownValue, {color: colors.text}]}>₹{item.cgst}</Text>
              </View>
              <View style={styles.priceBreakdownRow}>
                <Text style={[styles.priceBreakdownLabel, {color: colors.textSecondary}]}>{t('renewPlan.sgst')} (9%)</Text>
                <Text style={[styles.priceBreakdownValue, {color: colors.text}]}>₹{item.sgst}</Text>
              </View>
              <View style={[styles.priceBreakdownRow, styles.totalPriceRow]}>
                <Text style={[styles.priceBreakdownLabel, styles.totalPriceLabel, {color: colors.text}]}>{t('renewPlan.planMRP')}</Text>
                <Text style={[styles.priceBreakdownValue, styles.totalPriceValue, {color: colors.accent}]}>₹{item.mrp}</Text>
              </View>
              {item.dues > 0 && (
                <View style={styles.priceBreakdownRow}>
                  <Text style={[styles.priceBreakdownLabel, {color: colors.textSecondary}]}>{t('renewPlan.dues')}</Text>
                  <Text style={[styles.priceBreakdownValue, {color: colors.text}]}>₹{item.dues}</Text>
                </View>
              )}
            </View>
          </View>

          {/* Select Plan Button */}
          <TouchableOpacity
            style={[styles.selectPlanButton, {backgroundColor: colors.primary}]}
            onPress={() => handlePlanSelect(item)}>
            <Text style={styles.selectPlanButtonText}>
              {selectedPlan.id === item.id ? t('renewPlan.selected') : t('renewPlan.selectPlan')}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );



  return (
    <SafeAreaView style={[styles.container, {backgroundColor: colors.background}]}>
      {/* Header */}
      <CommonHeader navigation={navigation} />

      {/* Page Heading */}
      <View style={styles.headingContainer}>
        <Text style={[styles.pageHeading, {color: colors.text}]}>{t('renewPlan.title')}</Text>
        <Text style={[styles.pageSubheading, {color: colors.textSecondary}]}>
          {t('renewPlan.subtitle')}
        </Text>
      </View>

      {/* Filter and Sort Options */}
      <View style={styles.filterSortContainer}>
        <TouchableOpacity
          style={[styles.filterSortButton, {backgroundColor: colors.card, borderColor: colors.border}]}
          onPress={() => setShowFilterModal(true)}>
          <Text style={styles.filterSortIcon}>🔍</Text>
          <Text style={[styles.filterSortText, {color: colors.text}]}>{t('renewPlan.filter')}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.filterSortButton, {backgroundColor: colors.card, borderColor: colors.border}]}
          onPress={() => setShowSortModal(true)}>
          <Text style={styles.filterSortIcon}>📊</Text>
          <Text style={[styles.filterSortText, {color: colors.text}]}>{t('renewPlan.sort')}</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Plans List */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, {color: colors.text}]}>{t('renewPlan.availablePlans')}</Text>
            <FlatList
              data={getFilteredAndSortedPlans()}
              renderItem={renderPlanItem}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
            />
          </View>

          {/* Pay Button */}
          <TouchableOpacity
            style={[styles.payButton, {backgroundColor: colors.primary}]}
            onPress={handlePayNow}>
            <Text style={styles.payButtonText}>
              {t('renewPlan.payNow')} - ₹{selectedPlan.dues > 0 ? selectedPlan.mrp + selectedPlan.dues : selectedPlan.mrp}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Filter Modal */}
      <Modal
        visible={showFilterModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowFilterModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, {backgroundColor: colors.card}]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, {color: colors.text}]}>{t('renewPlan.filter')}</Text>
              <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                <Text style={[styles.modalCloseButton, {color: colors.textSecondary}]}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalBody}>
              {/* Speed Filter */}
              <View style={styles.filterSection}>
                <Text style={[styles.filterSectionTitle, {color: colors.text}]}>{t('renewPlan.speed')}</Text>
                <View style={styles.filterOptions}>
                  {['100 Mbps', '200 Mbps', '500 Mbps', '1 Gbps'].map((speed) => (
                    <TouchableOpacity
                      key={speed}
                      style={[
                        styles.filterOption,
                        filters.speed === speed && {backgroundColor: colors.primary}
                      ]}
                      onPress={() => setFilters(prev => ({...prev, speed: filters.speed === speed ? '' : speed}))}>
                      <Text style={[
                        styles.filterOptionText,
                        {color: filters.speed === speed ? '#fff' : colors.text}
                      ]}>{speed}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Validity Filter */}
              <View style={styles.filterSection}>
                <Text style={[styles.filterSectionTitle, {color: colors.text}]}>{t('renewPlan.validity')}</Text>
                <View style={styles.filterOptions}>
                  {['30 Days', '90 Days', '180 Days', '360 Days'].map((validity) => (
                    <TouchableOpacity
                      key={validity}
                      style={[
                        styles.filterOption,
                        filters.validity === validity && {backgroundColor: colors.primary}
                      ]}
                      onPress={() => setFilters(prev => ({...prev, validity: filters.validity === validity ? '' : validity}))}>
                      <Text style={[
                        styles.filterOptionText,
                        {color: filters.validity === validity ? '#fff' : colors.text}
                      ]}>{validity}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Price Range Filter */}
              <View style={styles.filterSection}>
                <Text style={[styles.filterSectionTitle, {color: colors.text}]}>{t('renewPlan.price')}</Text>
                <View style={styles.filterOptions}>
                  {['0-1000', '1000-2000', '2000-3000', '3000-5000'].map((price) => (
                    <TouchableOpacity
                      key={price}
                      style={[
                        styles.filterOption,
                        filters.price === price && {backgroundColor: colors.primary}
                      ]}
                      onPress={() => setFilters(prev => ({...prev, price: filters.price === price ? '' : price}))}>
                      <Text style={[
                        styles.filterOptionText,
                        {color: filters.price === price ? '#fff' : colors.text}
                      ]}>₹{price}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* GB Limit Filter */}
              <View style={styles.filterSection}>
                <Text style={[styles.filterSectionTitle, {color: colors.text}]}>{t('renewPlan.gbLimit')}</Text>
                <View style={styles.filterOptions}>
                  {['0-100', '100-500', '500-1000', '1000+', 'Fair Usage Unlimited'].map((gb) => (
                    <TouchableOpacity
                      key={gb}
                      style={[
                        styles.filterOption,
                        filters.gbLimit === gb && {backgroundColor: colors.primary}
                      ]}
                      onPress={() => setFilters(prev => ({...prev, gbLimit: filters.gbLimit === gb ? '' : gb}))}>
                      <Text style={[
                        styles.filterOptionText,
                        {color: filters.gbLimit === gb ? '#fff' : colors.text}
                      ]}>{gb === 'Fair Usage Unlimited' ? gb : `${gb} GB`}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* OTT Plan Filter */}
              <View style={styles.filterSection}>
                <Text style={[styles.filterSectionTitle, {color: colors.text}]}>{t('renewPlan.ottPlan')}</Text>
                <View style={styles.filterOptions}>
                  {['With OTT', 'Without OTT'].map((ott) => (
                    <TouchableOpacity
                      key={ott}
                      style={[
                        styles.filterOption,
                        filters.ottPlan === ott && {backgroundColor: colors.primary}
                      ]}
                      onPress={() => setFilters(prev => ({...prev, ottPlan: filters.ottPlan === ott ? '' : ott}))}>
                      <Text style={[
                        styles.filterOptionText,
                        {color: filters.ottPlan === ott ? '#fff' : colors.text}
                      ]}>{ott}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, {backgroundColor: colors.border}]}
                onPress={() => setFilters({speed: '', validity: '', price: '', gbLimit: '', ottPlan: ''})}>
                <Text style={[styles.modalButtonText, {color: colors.text}]}>{t('renewPlan.clearFilters')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, {backgroundColor: colors.primary}]}
                onPress={() => setShowFilterModal(false)}>
                <Text style={styles.modalButtonText}>{t('renewPlan.applyFilters')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Sort Modal */}
      <Modal
        visible={showSortModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowSortModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, {backgroundColor: colors.card}]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, {color: colors.text}]}>{t('renewPlan.sort')}</Text>
              <TouchableOpacity onPress={() => setShowSortModal(false)}>
                <Text style={[styles.modalCloseButton, {color: colors.textSecondary}]}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalBody}>
              {[
                {key: 'price-low-high', label: t('renewPlan.priceLowToHigh')},
                {key: 'price-high-low', label: t('renewPlan.priceHighToLow')},
                {key: 'speed-high-low', label: t('renewPlan.speedHighToLow')},
                {key: 'validity-high-low', label: t('renewPlan.validityHighToLow')},
                {key: 'gb-high-low', label: t('renewPlan.gbHighToLow')},
              ].map((option) => (
                <TouchableOpacity
                  key={option.key}
                  style={[
                    styles.sortOption,
                    sortOption === option.key && {backgroundColor: colors.primary}
                  ]}
                  onPress={() => {
                    setSortOption(option.key);
                    setShowSortModal(false);
                  }}>
                  <Text style={[
                    styles.sortOptionText,
                    {color: sortOption === option.key ? '#fff' : colors.text}
                  ]}>{option.label}</Text>
                  {sortOption === option.key && (
                    <Text style={styles.sortOptionCheck}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
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
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  planCard: {
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
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  planInfo: {
    flex: 1,
  },
  planName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
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
  planBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 4,
  },
  ottPlanBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  ottPlanText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '600',
  },
  priceBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  priceText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  planDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 14,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
  },

  payButton: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  payButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
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
  detailIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  ottSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  ottTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  ottIcons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  ottIcon: {
    alignItems: 'center',
    minWidth: 60,
  },
  ottIconText: {
    fontSize: 20,
    marginBottom: 4,
  },
  ottServiceName: {
    fontSize: 10,
    textAlign: 'center',
  },
  priceBreakdownSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  priceBreakdownTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  priceBreakdownList: {
    gap: 6,
  },
  priceBreakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceBreakdownLabel: {
    fontSize: 12,
  },
  priceBreakdownValue: {
    fontSize: 12,
    fontWeight: '600',
  },
  totalPriceRow: {
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    marginTop: 6,
    paddingTop: 6,
  },
  totalPriceLabel: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  totalPriceValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  planPriceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  expandButton: {
    padding: 4,
  },
  expandIcon: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  compactDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  compactDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  expandedSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  selectPlanButton: {
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  selectPlanButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  filterSortContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 16,
  },
  filterSortButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  filterSortIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  filterSortText: {
    fontSize: 14,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalCloseButton: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  modalBody: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  filterSection: {
    marginBottom: 24,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  filterOptionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  modalFooter: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  sortOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginBottom: 8,
  },
  sortOptionText: {
    fontSize: 16,
    fontWeight: '500',
  },
  sortOptionCheck: {
    fontSize: 18,
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default RenewPlanScreen; 