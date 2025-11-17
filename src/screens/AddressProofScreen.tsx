import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Dimensions,
  TextInput,
  Image,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../utils/ThemeContext';
import { getThemeColors } from '../utils/themeStyles';
import CommonHeader from '../components/CommonHeader';
import { useTranslation } from 'react-i18next';
import { apiService } from '../services/api';
import sessionManager from '../services/sessionManager';
import { useSessionValidation } from '../utils/useSessionValidation';
import Feather from 'react-native-vector-icons/Feather';
import Toast from 'react-native-toast-message';

const { width: screenWidth } = Dimensions.get('window');

interface AddressProofOption {
  label: string;
  value: string;
}

interface AddressProofScreenProps {
  navigation: any;
  route?: any;
}

const AddressProofScreen = ({ navigation, route }: AddressProofScreenProps) => {
  console.log('AddressProofScreen rendered');
  console.log('Route params:', route?.params);
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [addressProofOptions, setAddressProofOptions] = useState<AddressProofOption[]>([]);
  const [selectedProofType, setSelectedProofType] = useState('');
  const [documentId, setDocumentId] = useState('');
  const [documentPreviewUri, setDocumentPreviewUri] = useState<string | null>(null);
  const [documentName, setDocumentName] = useState('');
  const [isEkycEnabled, setIsEkycEnabled] = useState(false);
  const [useEkyc, setUseEkyc] = useState(false);
  const [aadharNumber, setAadharNumber] = useState('');
  const [showOtpField, setShowOtpField] = useState(false);
  const [otp, setOtp] = useState('');
  const [isOtpGenerated, setIsOtpGenerated] = useState(false);
  const [clientRefId, setClientRefId] = useState('');
  const [otpTimer, setOtpTimer] = useState(60);
  const [showResendButton, setShowResendButton] = useState(false);
  const [aadharDetails, setAadharDetails] = useState(null);
  const [showAadharDetails, setShowAadharDetails] = useState(false);
  const { checkSessionAndHandle } = useSessionValidation();

  useEffect(() => {
    loadAddressProofOptions();
  }, []);

  useEffect(() => {
    let timer: NodeJS.Timeout | undefined;
    if (isOtpGenerated && otpTimer > 0) {
      timer = setInterval(() => {
        setOtpTimer((prevTimer) => {
          if (prevTimer <= 1) {
            setShowResendButton(true);
            if (timer) clearInterval(timer);
            return 0;
          }
          return prevTimer - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isOtpGenerated, otpTimer]);

  const loadAddressProofOptions = async () => {
    try {
      setLoading(true);
      
      const username = await sessionManager.getUsername();
      if (!username) {
        throw new Error('No user session found. Please login again.');
      }

      // Get current client configuration
      const { getClientConfig } = require('../config/client-config');
      const clientConfig = getClientConfig();
      const realm = clientConfig.clientId;

      // Fetch address proof options from API
      const dataObj = {
        "address_proof": ["general", "address_proof"]
      };

      // Call the Staticdropdown API to get address proof options
      const dropdownData = {
        "address_proof": ["general", "address_proof"]
      };
      
      try {
        const dropdownRes = await apiService.Staticdropdown(dropdownData, realm);
        // console.log('Address proof options from API:', dropdownRes);
        // console.log('API response type:', typeof dropdownRes);
        // console.log('API response keys:', Object.keys(dropdownRes || {}));
        // console.log('address_proof data:', dropdownRes?.address_proof);
        
        if (dropdownRes && dropdownRes.address_proof && Array.isArray(dropdownRes.address_proof)) {
          const formattedOptions = dropdownRes.address_proof.map((item: any) => ({
            label: item.label || item.value || item,
            value: item.value || item
          }));
          console.log('Formatted options:', formattedOptions);
          setAddressProofOptions(formattedOptions);
        } else {
          console.log('No address_proof data in response, using fallback');
          // Fallback to static options if API doesn't return data
          setAddressProofOptions([
            { label: 'Aadhar Card', value: 'aadhar_card' },
            { label: 'Passport', value: 'passport' },
            { label: 'Driving License', value: 'driving_license' },
            { label: 'Voter ID', value: 'voter_id' },
            { label: 'Utility Bill', value: 'utility_bill' }
          ]);
        }
      } catch (error) {
        console.error('Error fetching address proof options:', error);
        // Fallback to static options on error
        setAddressProofOptions([
          { label: 'Aadhar Card', value: 'aadhar_card' },
          { label: 'Passport', value: 'passport' },
          { label: 'Driving License', value: 'driving_license' },
          { label: 'Voter ID', value: 'voter_id' },
          { label: 'Utility Bill', value: 'utility_bill' }
        ]);
      }

      // TODO: Implement API call for E-KYC check
      // const taxInfo = await apiService.getAdminTaxInfo('admin', realm);
      // if (taxInfo) {
      //   const ekycEnabled = taxInfo._obj?.settings?.ekyc_verification === 'yes';
      //   setIsEkycEnabled(ekycEnabled);
      // }
      
      // For now, enable E-KYC
      setIsEkycEnabled(true);

    } catch (error: any) {
      console.error('Error loading address proof options:', error);
      Toast.show({
        type: 'error',
        text1: error.message || 'Failed to load address proof options',
        autoHide: true,
        position: 'bottom',
        bottomOffset: 20
      });
    } finally {
      setLoading(false);
    }
  };

  const browseFileDocuments = async () => {
    try {
      // For now, we'll use a placeholder implementation
      // In a real app, you would integrate with react-native-image-picker or similar
      Toast.show({
        type: 'info',
        text1: 'Document picker functionality to be implemented',
        autoHide: true,
        position: 'bottom',
        bottomOffset: 20
      });
      
      // Placeholder: simulate document selection
      setDocumentName('sample_document.jpg');
      setDocumentPreviewUri('https://via.placeholder.com/300x200');
      
    } catch (error: any) {
      console.error('Error:', error);
      Toast.show({
        type: 'error',
        text1: error.message || 'Failed to select document',
        autoHide: true,
        position: 'bottom',
        bottomOffset: 20
      });
    }
  };

  const handleSubmit = async () => {
    if (!selectedProofType) {
      Toast.show({
        type: 'error',
        text1: 'Please select an address proof type',
        autoHide: true,
        position: 'bottom',
        bottomOffset: 20
      });
      return;
    }

    if (!documentId) {
      Toast.show({
        type: 'error',
        text1: 'Please enter document ID',
        autoHide: true,
        position: 'bottom',
        bottomOffset: 20
      });
      return;
    }

    if (selectedProofType === 'aadhar_card' && useEkyc) {
      if (!aadharNumber) {
        Toast.show({
          type: 'error',
          text1: 'Please enter Aadhar number',
          autoHide: true,
          position: 'bottom',
          bottomOffset: 20
        });
        return;
      }
      // Handle E-KYC submission
      handleEkycSubmission();
      return;
    }

    if (!documentPreviewUri) {
      Toast.show({
        type: 'error',
        text1: 'Please select a document',
        autoHide: true,
        position: 'bottom',
        bottomOffset: 20
      });
      return;
    }

    try {
      setLoading(true);
      
      const username = await sessionManager.getUsername();
      const { getClientConfig } = require('../config/client-config');
      const clientConfig = getClientConfig();
      const realm = clientConfig.clientId;

      // TODO: Implement API call to submit address proof
      // await apiService.updateKycDetailsAddressProof(
      //   username,
      //   selectedProofType,
      //   documentId,
      //   documentPreviewUri,
      //   realm
      // );
      
      // For now, just simulate success
      console.log('Address proof submission:', {
        username,
        selectedProofType,
        documentId,
        documentPreviewUri,
        realm
      });

      Toast.show({
        type: 'success',
        text1: 'Address proof submitted successfully',
        autoHide: true,
        position: 'bottom',
        bottomOffset: 20
      });

      setTimeout(() => {
        navigation.goBack();
      }, 2000);

    } catch (error: any) {
      console.error('Error submitting address proof:', error);
      Toast.show({
        type: 'error',
        text1: error.message || 'Failed to submit address proof',
        autoHide: true,
        position: 'bottom',
        bottomOffset: 20
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEkycSubmission = async () => {
    // Implement E-KYC submission logic here
    // This would include OTP generation, verification, and submission
    console.log('E-KYC submission logic to be implemented');
  };

  const resetForm = () => {
    setSelectedProofType('');
    setDocumentId('');
    setDocumentPreviewUri(null);
    setDocumentName('');
    setUseEkyc(false);
    setAadharNumber('');
    setOtp('');
    setIsOtpGenerated(false);
    setShowOtpField(false);
    setAadharDetails(null);
    setShowAadharDetails(false);
  };

  if (loading && !addressProofOptions.length) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <CommonHeader navigation={navigation} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading address proof options...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <CommonHeader navigation={navigation} />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>Upload Address Proof</Text>
            <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
              Please select your address proof type and upload the document
            </Text>
          </View>
        </View>

        {/* Address Proof Type Picker */}
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Document Type</Text>
          <TouchableOpacity
            style={[styles.pickerContainer, { borderColor: colors.borderLight }]}
            onPress={() => {
              // Simple dropdown implementation
              Alert.alert(
                'Select Address Proof',
                'Choose an address proof type:',
                [
                  ...addressProofOptions.map((item, index) => ({
                    text: item.label,
                    onPress: () => {
                      setSelectedProofType(item.value);
                      resetForm();
                    }
                  })),
                  {
                    text: 'Cancel',
                    style: 'cancel'
                  }
                ]
              );
            }}
          >
            <View style={styles.pickerContent}>
              <Text style={[styles.pickerText, { color: colors.text }]}>
                {selectedProofType ? 
                  addressProofOptions.find(item => item.value === selectedProofType)?.label || 'Select Address Proof' 
                  : 'Select Address Proof'
                }
              </Text>
              <Feather name="chevron-down" size={20} color={colors.textSecondary} />
            </View>
          </TouchableOpacity>
        </View>

        {/* E-KYC Toggle for Aadhar Card */}
        {selectedProofType === 'aadhar_card' && isEkycEnabled && (
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <View style={styles.ekycRow}>
              <View>
                <Text style={[styles.cardTitle, { color: colors.text }]}>E-KYC Verification</Text>
                <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
                  Use Aadhar E-KYC for instant verification
                </Text>
              </View>
              <Switch
                value={useEkyc}
                onValueChange={setUseEkyc}
                trackColor={{ false: colors.borderLight, true: colors.primary + '40' }}
                thumbColor={useEkyc ? colors.primary : colors.textSecondary}
              />
            </View>
          </View>
        )}

        {/* Document ID Input */}
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Document Number</Text>
          <TextInput
            style={[styles.input, { 
              backgroundColor: colors.background,
              borderColor: colors.borderLight,
              color: colors.text
            }]}
            placeholder="Enter document number"
            placeholderTextColor={colors.textSecondary}
            value={documentId}
            onChangeText={setDocumentId}
          />
        </View>

        {/* Upload Section */}
        {!useEkyc && (
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Upload Document</Text>
            
            <View style={styles.uploadButtons}>
              <TouchableOpacity 
                style={[styles.uploadButton, { backgroundColor: colors.primary }]}
                onPress={browseFileDocuments}
              >
                <Text style={[styles.uploadButtonText, { color: 'white' }]}>Browse File</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.uploadButton, { backgroundColor: colors.primary }]}
                onPress={() => {
                  // Implement camera functionality
                  Toast.show({
                    type: 'info',
                    text1: 'Camera functionality to be implemented',
                    autoHide: true,
                    position: 'bottom',
                    bottomOffset: 20
                  });
                }}
              >
                <Text style={[styles.uploadButtonText, { color: 'white' }]}>Capture</Text>
              </TouchableOpacity>
            </View>

            {/* Document Preview */}
            {documentPreviewUri && (
              <View style={styles.previewContainer}>
                <Text style={[styles.previewTitle, { color: colors.text }]}>Selected Document</Text>
                <Image source={{ uri: documentPreviewUri }} style={styles.previewImage} />
                <Text style={[styles.previewName, { color: colors.textSecondary }]}>{documentName}</Text>
              </View>
            )}
          </View>
        )}

        {/* E-KYC Input Section */}
        {selectedProofType === 'aadhar_card' && useEkyc && (
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Aadhar E-KYC</Text>
            
            <TextInput
              style={[styles.input, { 
                backgroundColor: colors.background,
                borderColor: colors.borderLight,
                color: colors.text
              }]}
              placeholder="Enter 12-digit Aadhar number"
              placeholderTextColor={colors.textSecondary}
              value={aadharNumber}
              onChangeText={setAadharNumber}
              keyboardType="numeric"
              maxLength={12}
            />

            {!isOtpGenerated ? (
              <TouchableOpacity 
                style={[styles.ekycButton, { backgroundColor: colors.primary }]}
                onPress={() => {
                  if (aadharNumber.length !== 12) {
                    Toast.show({
                      type: 'error',
                      text1: 'Please enter valid 12-digit Aadhar number',
                      autoHide: true,
                      position: 'bottom',
                      bottomOffset: 20
                    });
                    return;
                  }
                  // Implement OTP generation
                  Toast.show({
                    type: 'info',
                    text1: 'OTP generation to be implemented',
                    autoHide: true,
                    position: 'bottom',
                    bottomOffset: 20
                  });
                }}
              >
                <Text style={styles.ekycButtonText}>Generate OTP</Text>
              </TouchableOpacity>
            ) : (
              <View>
                <TextInput
                  style={[styles.input, { 
                    backgroundColor: colors.background,
                    borderColor: colors.borderLight,
                    color: colors.text,
                    marginTop: 10
                  }]}
                  placeholder="Enter 6-digit OTP"
                  placeholderTextColor={colors.textSecondary}
                  value={otp}
                  onChangeText={setOtp}
                  keyboardType="numeric"
                  maxLength={6}
                />
                <TouchableOpacity 
                  style={[styles.ekycButton, { backgroundColor: colors.primary }]}
                  onPress={() => {
                    if (otp.length !== 6) {
                      Toast.show({
                        type: 'error',
                        text1: 'Please enter valid 6-digit OTP',
                        autoHide: true,
                        position: 'bottom',
                        bottomOffset: 20
                      });
                      return;
                    }
                    // Implement OTP verification
                    Toast.show({
                      type: 'info',
                      text1: 'OTP verification to be implemented',
                      autoHide: true,
                      position: 'bottom',
                      bottomOffset: 20
                    });
                  }}
                >
                  <Text style={styles.ekycButtonText}>Verify OTP</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* Submit and Cancel Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[
              styles.actionButton,
              { backgroundColor: colors.primary },
              (!selectedProofType || !documentId || (!useEkyc && !documentPreviewUri)) && {
                backgroundColor: colors.borderLight,
                opacity: 0.6
              }
            ]}
            onPress={handleSubmit}
            disabled={!selectedProofType || !documentId || (!useEkyc && !documentPreviewUri) || loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.actionButtonText}>Submit</Text>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.actionButton,
              { backgroundColor: colors.borderLight }
            ]}
            onPress={() => navigation.goBack()}
          >
            <Text style={[styles.actionButtonText, { color: colors.text }]}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      
      <Toast />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 20,
  },
  headerContent: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 16,
    lineHeight: 22,
    textAlign: 'center',
    opacity: 0.8,
  },
  card: {
    marginHorizontal: 24,
    marginBottom: 16,
    borderRadius: 16,
    padding: 20,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  cardSubtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  pickerContainer: {
    borderWidth: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  pickerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  pickerText: {
    fontSize: 16,
    flex: 1,
  },
  ekycRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginTop: 8,
  },
  uploadButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  uploadButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 6,
  },
  uploadButtonText: {
    marginLeft: 8,
    fontWeight: '600',
    fontSize: 16,
  },
  previewContainer: {
    alignItems: 'center',
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(25, 118, 210, 0.1)',
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  previewImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  previewName: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  ekycButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  ekycButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    marginHorizontal: 24,
    marginBottom: 24,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
  },
  actionButtonText: {
    fontWeight: '700',
    fontSize: 18,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
  },
});

export default AddressProofScreen; 