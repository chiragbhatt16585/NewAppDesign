import React, { useEffect, useState, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  TouchableHighlight,
  ActivityIndicator,
  Platform,
  Modal,
  TouchableWithoutFeedback,
  Dimensions,
  Alert,
  KeyboardAvoidingView,
  Image,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../utils/ThemeContext';
import { getThemeColors } from '../utils/themeStyles';
import CommonHeader from '../components/CommonHeader';
import Toast from 'react-native-toast-message';
import { Picker } from '@react-native-picker/picker';
import { apiService } from '../services/api';
import sessionManager from '../services/sessionManager';
import { useTranslation } from 'react-i18next';

const ReferFriendScreen = ({ navigation }: any) => {
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [buildings, setBuildings] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [salesPersons, setSalesPersons] = useState<any[]>([]);
  const [showSalesExec, setShowSalesExec] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [filteredBuildings, setFilteredBuildings] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    mobileNumber: '',
    email: '',
    address1: '',
    address2: '',
    building: '',
    building_id: '',
    building_name: '',
    area: '',
    location: '',
    pincode: '',
    city: '',
    city_name: '',
    remarks: '',
    salesPerson: '',
  });
  const [errors, setErrors] = useState<any>({});
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [justSelectedBuilding, setJustSelectedBuilding] = useState(false);
  const [selectedBuilding, setSelectedBuilding] = useState<any>(null);
  const [showBuildingDropdown, setShowBuildingDropdown] = useState(false);
  // Remove isSelectingBuilding state

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Get session and realm
        const session = await sessionManager.getCurrentSession();
        if (!session?.username) throw new Error('No user session found');
        const { getClientConfig } = require('../config/client-config');
        const clientConfig = getClientConfig();
        const realm = clientConfig.clientId;
        // Fetch buildings and cities
        const [buildingsData, citiesData] = await Promise.all([
          apiService.getAllBuildings(realm),
          apiService.getAllCities(realm),
        ]);
        console.log('Buildings data:', buildingsData);
        console.log('Cities data:', citiesData);
        setBuildings(buildingsData);
        setCities(citiesData);
        // Check if sales exec selection is needed
        const authData = await apiService.authUser(session.username);
        if (authData?.display_sales_exec_selection_in_customer_referral === 'yes') {
          const salesData = await apiService.getAllSalesPersons(realm);
          setShowSalesExec(true);
          setSalesPersons(salesData);
        } else {
          setShowSalesExec(false);
        }
      } catch (e: any) {
        Toast.show({ type: 'error', text1: e.message || 'Error loading data' });
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // Building search
  useEffect(() => {
    if (searchText.length >= 3) {
      const filtered = buildings.filter(b => b.label.toLowerCase().includes(searchText.toLowerCase()));
      console.log('Filtered buildings:', filtered);
      setFilteredBuildings(filtered);
    } else {
      setFilteredBuildings([]);
    }
  }, [searchText, buildings]);

  // Debug form data changes
  useEffect(() => {
    console.log('Form data changed:', formData);
  }, [formData]);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
    setErrors((prev: any) => ({ ...prev, [field]: '' }));
  };

  const validateForm = () => {
    let isValid = true;
    let newErrors: any = {};
    if (!formData.firstName.trim()) { newErrors.firstName = 'First name is required'; isValid = false; }
    if (!formData.lastName.trim()) { newErrors.lastName = 'Last name is required'; isValid = false; }
    if (!formData.mobileNumber.trim()) { newErrors.mobileNumber = 'Mobile number is required'; isValid = false; }
    else if (!/^\d{10}$/.test(formData.mobileNumber)) { newErrors.mobileNumber = 'Invalid mobile number'; isValid = false; }
    if (formData.email.trim() && !/\S+@\S+\.\S+/.test(formData.email)) { newErrors.email = 'Invalid email format'; isValid = false; }
    if (formData.pincode.trim() && !/^\d{6}$/.test(formData.pincode)) { newErrors.pincode = 'Invalid pincode'; isValid = false; }
    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      Toast.show({ type: 'error', text1: 'Please fill all required fields' });
      return;
    }
    setIsLoading(true);
    try {
      const session = await sessionManager.getCurrentSession();
      if (!session?.username) throw new Error('No user session found');
      const { getClientConfig } = require('../config/client-config');
      const clientConfig = getClientConfig();
      const realm = clientConfig.clientId;
      // Prepare payload
      const payload = {
        ...formData,
        building_id: formData.building_id,
        building_name: formData.building_name,
        city_id: formData.city,
        city_name: formData.city_name,
        sales_executive: formData.salesPerson,
      };
      await apiService.addNewInquiry(session.username, payload, realm);
      setFormData({
        firstName: '', lastName: '', mobileNumber: '', email: '', address1: '', address2: '', building: '', building_id: '', building_name: '', area: '', location: '', pincode: '', city: '', city_name: '', remarks: '', salesPerson: '',
      });
      Alert.alert(
        'Success', 
        'Your Inquiry submitted successfully!',
        [
          {
            text: 'OK',
            onPress: () => {
              // Form is already reset above
            }
          }
        ]
      );
    } catch (e: any) {
      Toast.show({ type: 'error', text1: e.message || 'Something went wrong' });
    } finally {
      setIsLoading(false);
    }
  };

  // Building selector modal
  const handleBuildingSelection = (building: any) => {
    console.log('Building selected:', building);
    
    Keyboard.dismiss();
    setSelectedBuilding(building);
    setSearchText(building.label);
    setShowBuildingDropdown(false);
    
    // Find the city name
    const cityObj = cities.find(c => c.value === building.city_id);
    const cityName = cityObj ? cityObj.label : '';
    
    // Update form data
    setFormData((prev: any) => ({
      ...prev,
      building: building.value || building.building_id,
      building_id: building.building_id,
      building_name: building.label,
      area: building.area_name || '',
      location: building.location_name || '',
      city: building.city_id || '',
      city_name: cityName,
      pincode: building.pincode || ''
    }));
    
    // Clear errors
    setErrors((prev: any) => ({
      ...prev,
      building: '',
      area: '',
      location: '',
      city: '',
      pincode: ''
    }));
  };

  // Building Selector Component
  const BuildingSelector = () => {
    const [showDropdown, setShowDropdown] = useState(false);
    const [searchText, setSearchText] = useState('');
    const inputRef = useRef<TextInput>(null);

    useEffect(() => {
      if (formData.building) {
        const selectedBuilding = buildings.find(b => b.value === formData.building);
        if (selectedBuilding) {
          setSearchText(selectedBuilding.label);
        }
      }
    }, [formData.building]);

    const filteredBuildings = useMemo(() => {
      if (!searchText || searchText.length < 3) return [];
      
      return buildings.filter(building => 
        building.label && 
        building.label.toLowerCase().includes(searchText.toLowerCase())
      ).slice(0, 5);
    }, [searchText, buildings]);

    const handleBuildingSelect = (building: any) => {
      setSearchText(building.label);
      setShowDropdown(false);
      
      // Find the city name from the cities array
      const cityObj = cities.find(c => c.value === building.city_id);
      const cityName = cityObj ? cityObj.label : '';
      
      handleInputChange('building', building.value);
      handleInputChange('building_id', building.building_id);
      handleInputChange('building_name', building.label);
      handleInputChange('area', building.area_name || '');
      handleInputChange('location', building.location_name || '');
      handleInputChange('city', building.city_id || '');
      handleInputChange('city_name', cityName);
      handleInputChange('pincode', building.pincode || '');
    };

    const renderBuildingItem = (building: any) => (
      <TouchableHighlight
        key={building.value}
        onPress={() => {
          handleBuildingSelect(building);
          inputRef.current?.blur?.();
        }}
        underlayColor="#f0f0f0"
      >
        <View style={[styles.dropdownItem, { borderBottomColor: colors.border }]}>
          <Text style={[styles.buildingName, { color: colors.text }]}>{building.label}</Text>
          <View style={styles.buildingDetails}>
            <Text style={[styles.buildingSubText, { color: colors.textSecondary }]}>
              {building.area_name && `${building.area_name}`}
              {building.area_name && building.location_name && ' • '}
              {building.location_name && `${building.location_name}`}
            </Text>
          </View>
        </View>
      </TouchableHighlight>
    );

    return (
      <View style={styles.inputContainer}>
        <View style={[styles.autocompleteContainer, errors.building ? styles.inputError : null]}>
          <TextInput
            ref={inputRef}
            placeholder={t('referFriend.building')}
            value={searchText}
            onChangeText={(text) => {
              setSearchText(text);
              setShowDropdown(text.length >= 3);
              if (formData.building) {
                handleInputChange('building', '');
                handleInputChange('building_name', '');
                handleInputChange('area', '');
                handleInputChange('location', '');
                handleInputChange('city', '');
                handleInputChange('city_name', '');
                handleInputChange('pincode', '');
              }
            }}
            style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
            onFocus={() => {
              if (searchText.length >= 3) {
                setShowDropdown(true);
              }
            }}
            placeholderTextColor={colors.textSecondary}
            autoCorrect={false}
            autoCapitalize="none"
          />
          {showDropdown && filteredBuildings.length > 0 && (
            <TouchableWithoutFeedback>
              <View style={[styles.dropdownContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                {filteredBuildings.map(renderBuildingItem)}
              </View>
            </TouchableWithoutFeedback>
          )}
        </View>
      </View>
    );
  };

  // Use SafeAreaView + ScrollView for a full page
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}> 
      <CommonHeader navigation={navigation} />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Heading section matching LedgerScreen */}
        <View style={styles.headingContainer}>
          <Text style={[styles.pageHeading, { color: colors.text }]}>{t('referFriend.title')}</Text>
          <Text style={[styles.pageSubheading, { color: colors.textSecondary }]}>{t('referFriend.subtitle')}</Text>
        </View>
        {/* Visually separated card form */}
        <View style={[styles.formCard, { backgroundColor: colors.card, shadowColor: colors.shadow }]}> 
          <Text style={[styles.sectionTitle, { color: colors.primary }]}>{t('referFriend.personalDetails')}</Text>
          <View style={styles.inputRow}>
            <TextInput style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }, errors.firstName && styles.inputError]} placeholder={t('referFriend.firstName')} value={formData.firstName} onChangeText={t => handleInputChange('firstName', t)} placeholderTextColor={colors.textSecondary} />
            <TextInput style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }, errors.lastName && styles.inputError]} placeholder={t('referFriend.lastName')} value={formData.lastName} onChangeText={t => handleInputChange('lastName', t)} placeholderTextColor={colors.textSecondary} />
          </View>
          <View style={styles.errorRow}>
            {errors.firstName && <Text style={styles.errorText}>{t('referFriend.firstNameRequired')}</Text>}
            {errors.lastName && <Text style={styles.errorText}>{t('referFriend.lastNameRequired')}</Text>}
          </View>
          <TextInput style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }, errors.mobileNumber && styles.inputError]} placeholder={t('referFriend.mobileNumber')} value={formData.mobileNumber} onChangeText={t => handleInputChange('mobileNumber', t)} keyboardType="phone-pad" placeholderTextColor={colors.textSecondary} />
          {errors.mobileNumber && <Text style={styles.errorText}>{t('referFriend.mobileNumberRequired')}</Text>}
          <TextInput style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }, errors.email && styles.inputError]} placeholder={t('referFriend.email')} value={formData.email} onChangeText={t => handleInputChange('email', t)} keyboardType="email-address" placeholderTextColor={colors.textSecondary} />
          {errors.email && <Text style={styles.errorText}>{t('referFriend.emailRequired')}</Text>}

          <Text style={[styles.sectionTitle, { color: colors.primary }]}>{t('referFriend.addressDetails')}</Text>
          <TextInput style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]} placeholder={t('referFriend.address1')} value={formData.address1} onChangeText={t => handleInputChange('address1', t)} placeholderTextColor={colors.textSecondary} />
          <TextInput style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]} placeholder={t('referFriend.address2')} value={formData.address2} onChangeText={t => handleInputChange('address2', t)} placeholderTextColor={colors.textSecondary} />
          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>{t('referFriend.building')}</Text>
          <BuildingSelector />
          <TextInput style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]} placeholder={t('referFriend.area')} value={formData.area} onChangeText={t => handleInputChange('area', t)} placeholderTextColor={colors.textSecondary} />
          <TextInput style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]} placeholder={t('referFriend.location')} value={formData.location} onChangeText={t => handleInputChange('location', t)} placeholderTextColor={colors.textSecondary} />
          <TextInput style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }, errors.pincode && styles.inputError]} placeholder={t('referFriend.pincode')} value={formData.pincode} onChangeText={t => handleInputChange('pincode', t)} keyboardType="numeric" placeholderTextColor={colors.textSecondary} />
          {errors.pincode && <Text style={styles.errorText}>{t('referFriend.pincodeRequired')}</Text>}
          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>{t('referFriend.city')}</Text>
          <View style={[styles.cityPickerContainer, { backgroundColor: colors.background, borderColor: colors.border }]}> 
            <TouchableOpacity
              style={[styles.cityPickerButton]}
              onPress={() => setShowCityDropdown(!showCityDropdown)}
              activeOpacity={0.7}
            >
              <Text style={[styles.cityPickerButtonText, { color: formData.city ? colors.primary : colors.textSecondary }]}> 
                {formData.city_name || t('referFriend.selectCity')}
              </Text>
              <Text style={[styles.cityPickerArrow, { color: formData.city ? colors.primary : colors.textSecondary }]}> 
                {showCityDropdown ? '▲' : '▼'} 
              </Text>
            </TouchableOpacity>
            {showCityDropdown && (
              <View style={[styles.cityDropdownContainer, { backgroundColor: colors.card, borderColor: colors.border }]}> 
                <View style={{ paddingVertical: 8 }}>
                  {cities.map(city => (
                    <TouchableHighlight
                      key={city.value}
                      style={[
                        styles.cityDropdownItem,
                        { borderBottomColor: colors.border },
                        formData.city === city.value && { backgroundColor: colors.primary + '15' }
                      ]}
                      onPress={() => {
                        handleInputChange('city', city.value);
                        handleInputChange('city_name', city.label);
                        setShowCityDropdown(false);
                      }}
                      underlayColor="#f8f9fa"
                    >
                      <View style={styles.cityItemContent}>
                        <Text style={[
                          styles.cityItemText,
                          { color: formData.city === city.value ? colors.primary : colors.text }
                        ]}>
                          {city.label}
                        </Text>
                        {formData.city === city.value && (
                          <Text style={[styles.cityCheckmark, { color: colors.primary }]}>✓</Text>
                        )}
                      </View>
                    </TouchableHighlight>
                  ))}
                </View>
              </View>
            )}
          </View>

          {showSalesExec && (
            <>
              <Text style={[styles.sectionTitle, { color: colors.primary }]}>{t('referFriend.salesExecutive')}</Text>
              <View style={[styles.salesPickerContainer, { backgroundColor: colors.background, borderColor: colors.border }]}> 
                <Picker
                  selectedValue={formData.salesPerson}
                  onValueChange={v => handleInputChange('salesPerson', v)}
                  style={[styles.salesPicker, { color: colors.text }]}
                >
                  <Picker.Item label={t('referFriend.selectSalesExecutive')} value="" />
                  {salesPersons.map(person => (
                    <Picker.Item key={person.value} label={person.label} value={person.value} />
                  ))}
                </Picker>
              </View>
            </>
          )}
          <TextInput style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]} placeholder={t('referFriend.remarks')} value={formData.remarks} onChangeText={t => handleInputChange('remarks', t)} placeholderTextColor={colors.textSecondary} />
          {/* Modern, prominent submit button */}
          <TouchableOpacity style={[styles.submitButton, { backgroundColor: colors.primary, shadowColor: colors.primary }, isLoading && { backgroundColor: colors.border }]} onPress={handleSubmit} disabled={isLoading}>
            {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitButtonText}>{t('referFriend.submit')}</Text>}
          </TouchableOpacity>
        </View>
        {isLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        )}
        <Toast />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 0, paddingBottom: 30 },
  heroContainer: { alignItems: 'center', marginTop: 32, marginBottom: 8 },
  heroIcon: { fontSize: 64, marginBottom: 8 },
  heroHeading: { fontSize: 28, fontWeight: 'bold', textAlign: 'center', marginBottom: 6 },
  heroSubtitle: { fontSize: 16, color: '#888', textAlign: 'center', marginBottom: 18 },
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
  heading: { fontSize: 26, fontWeight: 'bold', marginBottom: 4 },
  subheading: { fontSize: 15, color: '#888', marginBottom: 8, textAlign: 'center' },
  formCard: { borderRadius: 18, padding: 22, margin: 18, marginTop: 0, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 8, elevation: 4 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginTop: 18, marginBottom: 8, color: '#3498db' },
  inputRow: { flexDirection: 'row', gap: 8 },
  errorRow: { flexDirection: 'row', gap: 8, marginBottom: 4 },
  input: { backgroundColor: '#f8f9fa', borderRadius: 8, paddingHorizontal: 14, paddingVertical: Platform.OS === 'ios' ? 14 : 10, fontSize: 16, marginBottom: 10, borderWidth: 1, borderColor: '#e1e4e8', color: '#222', flex: 1 },
  inputError: { borderColor: 'red' },
  errorText: { color: 'red', fontSize: 12, marginBottom: 8, marginLeft: 2 },
  submitButton: { backgroundColor: '#3498db', borderRadius: 12, paddingVertical: 18, alignItems: 'center', marginTop: 18, marginBottom: 6, shadowColor: '#3498db', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.18, shadowRadius: 8, elevation: 6 },
  submitButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)' },
  modalContent: { borderRadius: 16, padding: 20, alignItems: 'center', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 10, margin: 18 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  buildingItem: { padding: 14, borderBottomWidth: 1, borderBottomColor: '#f0f0f0', fontSize: 16 },
  noResultsText: { padding: 15, textAlign: 'center', color: '#888' },
  closeButton: { marginTop: 10, padding: 10, alignItems: 'center', backgroundColor: '#f0f0f0', borderRadius: 5, width: 100 },
  loadingOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(255,255,255,0.6)', justifyContent: 'center', alignItems: 'center', zIndex: 10 },
  inputLabel: { fontSize: 14, color: '#555', marginTop: 15, marginBottom: 5 },
  pickerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    minHeight: 52,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e1e4e8',
    marginBottom: 10,
  },
  pickerButtonText: { fontSize: 16, flex: 1 },
  pickerArrow: { fontSize: 18 },
  pickerContainer: { borderRadius: 8, borderWidth: 1, borderColor: '#e1e4e8', marginBottom: 10 },
  picker: { backgroundColor: '#f8f9fa', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 10 },
  pickerDropdown: { borderRadius: 8, borderWidth: 1, borderColor: '#e1e4e8', marginTop: 5, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  pickerScroll: { maxHeight: 200 },
  pickerItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 15, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  pickerItemText: { fontSize: 16, flex: 1 },
  pickerCheckmark: { fontSize: 20, marginLeft: 10 },
  buildingItemText: { fontSize: 16 },
  closeButtonText: { fontSize: 16, fontWeight: '600' },
  autocompleteContainer: { 
    position: 'relative', 
    zIndex: 1000,
    marginBottom: 10,
    borderRadius: 8
  },
  dropdownContainer: { 
    position: 'absolute', 
    top: '100%', 
    left: 0, 
    right: 0, 
    backgroundColor: 'white', 
    borderWidth: 1, 
    borderColor: '#e1e4e8', 
    borderRadius: 8, 
    maxHeight: 200, 
    zIndex: 1001, 
    elevation: 10, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.1, 
    shadowRadius: 6,
    marginTop: 2
  },
  dropdownItem: { 
    padding: 12, 
    borderBottomWidth: 1, 
    borderBottomColor: '#f5f5f5',
    minHeight: 50
  },
  buildingItemContent: {
    flex: 1
  },
  buildingName: { 
    fontSize: 15, 
    fontWeight: '600',
    color: '#333', 
    marginBottom: 4 
  },
  buildingDetails: { 
    flexDirection: 'row', 
    alignItems: 'center' 
  },
  buildingSubText: { 
    fontSize: 12, 
    color: '#666',
    lineHeight: 16
  },
  cityPickerContainer: { 
    borderRadius: 12, 
    borderWidth: 1, 
    borderColor: '#e1e4e8', 
    marginBottom: 10,
    overflow: 'hidden'
  },
  cityPickerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    minHeight: 52,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e1e4e8',
    marginBottom: 0,
  },
  cityPickerButtonText: { 
    fontSize: 16, 
    flex: 1,
    fontWeight: '500'
  },
  cityPickerArrow: { 
    fontSize: 18,
    marginLeft: 8
  },
  cityDropdownContainer: { 
    position: 'absolute', 
    top: '100%', 
    left: 0, 
    right: 0, 
    backgroundColor: 'white', 
    borderWidth: 1, 
    borderColor: '#e1e4e8', 
    borderRadius: 12, 
    maxHeight: 250, 
    zIndex: 1001, 
    elevation: 8, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 4 }, 
    shadowOpacity: 0.15, 
    shadowRadius: 8,
    marginTop: 4
  },
  cityDropdownItem: { 
    padding: 16, 
    borderBottomWidth: 1, 
    borderBottomColor: '#f5f5f5',
    minHeight: 60
  },
  cityItemContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  cityItemText: { 
    fontSize: 16, 
    fontWeight: '500',
    flex: 1
  },
  cityCheckmark: { 
    fontSize: 20, 
    marginLeft: 10,
    fontWeight: 'bold'
  },
  salesPickerContainer: { 
    borderRadius: 12, 
    borderWidth: 1, 
    borderColor: '#e1e4e8', 
    marginBottom: 10,
    overflow: 'hidden'
  },
  salesPicker: { 
    backgroundColor: '#f8f9fa', 
    borderRadius: 12, 
    paddingHorizontal: 16, 
    paddingVertical: 12,
    height: 52
  },
  inputContainer: {
    marginBottom: 10,
  },
});

export default ReferFriendScreen; 