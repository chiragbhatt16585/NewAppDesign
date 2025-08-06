import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  TextInput,
  Image,
  Modal,
  FlatList,
  Switch,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import { launchImageLibrary, launchCamera, ImagePickerResponse, ImageLibraryOptions, CameraOptions } from 'react-native-image-picker';
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

interface DocumentType {
  label: string;
  value: string;
}

interface DocumentUploadScreenProps {
  navigation: any;
  route?: any;
}

const DocumentUploadScreen = ({ navigation, route }: DocumentUploadScreenProps) => {
  
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);
  

  const [selectedDocumentType, setSelectedDocumentType] = useState('');
  const [documentId, setDocumentId] = useState('');
  const [documentPreviewUri, setDocumentPreviewUri] = useState<string | null>(null);
  const [documentName, setDocumentName] = useState('');
  const [showDocumentPicker, setShowDocumentPicker] = useState(false);
  const [document, setDocument] = useState<any>(null);
  const [documentType, setDocumentType] = useState('');
  const [isDocumentFound, setIsDocumentFound] = useState(false);
  const [isEkycEnabled, setIsEkycEnabled] = useState(true);
  const [useEkyc, setUseEkyc] = useState(true);
  const [aadharNumber, setAadharNumber] = useState('');
  const [showOtpField, setShowOtpField] = useState(false);
  const [otp, setOtp] = useState('');
  const [isOtpGenerated, setIsOtpGenerated] = useState(false);
  const [clientRefId, setClientRefId] = useState('');
  const [aadharDetails, setAadharDetails] = useState<any>({
    full_name: 'John Doe',
    dob: '1990-01-01',
    gender: 'M',
    house: '123',
    street: 'Main Street',
    loc: 'Downtown',
    vtc: 'City',
    po: 'Post Office',
    district: 'District',
    state: 'State',
    zip: '123456',
    profile_image: null,
    statuscode: 'Y',
    client_refid: 'test_ref_id'
  });
  const [showAadharDetails, setShowAadharDetails] = useState(true);
  const [otpTimer, setOtpTimer] = useState(60);
  const [showResendButton, setShowResendButton] = useState(false);
  const { checkSessionAndHandle } = useSessionValidation();

  // Get document type from navigation params
  const documentTypeFromRoute = route?.params?.documentType || 'Address Proof';
  
  // Map document title to display name for translations
  const getDocumentTypeDisplayName = (title: string): string => {
    switch (title.toLowerCase()) {
      case 'identity proof':
        return t('documentTypes.identityProof');
      case 'address proof':
        return t('documentTypes.addressProof');
      case 'caf':
        return t('documentTypes.caf');
      case 'user photo':
        return t('documentTypes.userPhoto');
      case 'gst certificate':
        return t('documentTypes.gstCertificate');
      case 'user signature':
        return t('documentTypes.userSignature');
      case 'additional documents':
        return t('documentTypes.additionalDocuments');
      default:
        return title;
    }
  };
  
  // Map document title to API doc type
  const getDocTypeFromTitle = (title: string): string => {
    switch (title.toLowerCase()) {
      case 'identity proof':
        return 'id_proof';
      case 'address proof':
        return 'address_proof';
      case 'caf':
      case 'connection application form':
        return 'caf';
      case 'user photo':
        return 'user_photo';
      case 'gst certificate':
      case 'gst':
        return 'gst_certificate';
      case 'user signature':
        return 'user_sign';
      case 'additional documents':
      case 'other':
        return 'other';
      default:
        return 'address_proof'; // Default fallback
    }
  };

  // Request camera permission for Android
  const requestCameraPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: 'Camera Permission',
            message: 'This app needs access to your camera to capture documents.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn(err);
        return false;
      }
    } else {
      return true;
    }
  };

  useEffect(() => {
    // console.log('=== USE EFFECT TRIGGERED ===');
    // console.log('Component mounted, calling loadDocumentTypes');
    loadDocumentTypes();
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

  const loadDocumentTypes = async () => {
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

      // Fetch document types from API based on document category
      const docType = getDocTypeFromTitle(documentTypeFromRoute);
      const dataObj: any = {};
      dataObj[docType] = ["general", docType];

      try {
        const dropdownRes = await apiService.Staticdropdown(dataObj, realm);
        
        if (dropdownRes && dropdownRes[docType] && Array.isArray(dropdownRes[docType])) {
          const formattedDocumentTypes = dropdownRes[docType].map((item: any) => ({
            label: item.label || item.value || 'Unknown',
            value: item.value || item.label || 'unknown'
          }));
          
          setDocumentTypes(formattedDocumentTypes);
        } else {
          Toast.show({
            type: 'error',
            text1: `Failed to load ${docType} types`,
            autoHide: true,
            position: 'bottom',
            bottomOffset: 20
          });
          
          // Fallback data based on document type
          let fallbackData: any[] = [];
          switch (docType) {
            case 'address_proof':
              fallbackData = [
                { label: 'Telephone Bill', value: 'telephone_bill' },
                { label: 'Electricity Bill', value: 'electricity_bill' },
                { label: 'Aadhar Card', value: 'aadhar_card' },
                { label: 'Ration Card', value: 'ration_card' },
                { label: 'Allotment Letter', value: 'allotment_letter' },
                { label: 'Rent Agreement', value: 'rent_agreement' },
                { label: 'Other', value: 'other' },
                { label: 'Gas Connection Bill', value: 'gas_connection_bill' }
              ];
              break;
            case 'id_proof':
              fallbackData = [
                { label: 'Aadhar Card', value: 'aadhar_card' },
                { label: 'PAN Card', value: 'pan_card' },
                { label: 'Driving Licence', value: 'driving_licence' },
                { label: 'Voter Id', value: 'voter_id' },
                { label: 'Passport', value: 'passport' },
                { label: 'Other', value: 'other' }
              ];
              break;
            case 'caf':
              fallbackData = [
                { label: 'Connection Application Form', value: 'connection_application_form' },
                { label: 'CAF Document', value: 'caf_document' },
                { label: 'Other', value: 'other' }
              ];
              break;
            case 'user_photo':
              fallbackData = [
                { label: 'Passport Size Photo', value: 'passport_photo' },
                { label: 'Other', value: 'other' }
              ];
              break;
            case 'gst_certificate':
              fallbackData = [
                { label: 'GST Certificate', value: 'gst_certificate' },
                { label: 'GST Registration', value: 'gst_registration' },
                { label: 'Other', value: 'other' }
              ];
              break;
            case 'user_sign':
              fallbackData = [
                { label: 'Digital Signature', value: 'digital_signature' },
                { label: 'Handwritten Signature', value: 'handwritten_signature' },
                { label: 'Other', value: 'other' }
              ];
              break;
            case 'other':
              fallbackData = [
                { label: 'Additional Document', value: 'additional_document' },
                { label: 'Supporting Document', value: 'supporting_document' },
                { label: 'Other', value: 'other' }
              ];
              break;
            default:
              fallbackData = [
                { label: 'Document', value: 'document' },
                { label: 'Other', value: 'other' }
              ];
          }
          setDocumentTypes(fallbackData);
        }

        // Check if E-KYC is enabled
        try {
          const taxInfo = await apiService.getAdminTaxInfo('admin', realm);
          if (taxInfo) {
            const ekycEnabled = taxInfo._obj?.settings?.ekyc_verification === 'yes';
            setIsEkycEnabled(ekycEnabled);
          }
        } catch (error) {
          console.error('Error fetching tax info:', error);
          setIsEkycEnabled(true);
        }

      } catch (error: any) {
        console.error('Error fetching document types:', error);
        Toast.show({
          type: 'error',
          text1: 'Failed to load address proof types',
          autoHide: true,
          position: 'bottom',
          bottomOffset: 20
        });
        setIsEkycEnabled(true);
      }

    } catch (error: any) {
      console.error('Error loading document types:', error);
      Toast.show({
        type: 'error',
        text1: error.message || 'Failed to load document types',
        autoHide: true,
        position: 'bottom',
        bottomOffset: 20
      });
    } finally {
      setLoading(false);
    }
  };

  const handleImagePickerResponse = (response: ImagePickerResponse) => {
    if (response.didCancel) {
      console.log('User cancelled image picker');
      return;
    }

    if (response.errorCode) {
      console.error('ImagePicker Error:', response.errorCode, response.errorMessage);
      Toast.show({
        type: 'error',
        text1: 'Failed to pick image',
        text2: response.errorMessage || 'Please try again',
        autoHide: true,
        position: 'bottom',
        bottomOffset: 20
      });
      return;
    }

    if (response.assets && response.assets.length > 0) {
      const asset = response.assets[0];
      
      if (asset.uri && asset.fileName && asset.type) {
        // Check file size (5MB limit)
        const fileSizeInMB = (asset.fileSize || 0) / (1024 * 1024);
        if (fileSizeInMB > 5) {
          Toast.show({
            type: 'error',
            text1: t('documentUpload.fileTooLarge'),
            text2: t('documentUpload.fileSizeLimit5MB'),
            autoHide: true,
            position: 'bottom',
            bottomOffset: 20
          });
          return;
        }

        // Check file type
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
        const allowedExtensions = ['.jpg', '.jpeg', '.png', '.pdf'];
        
        // Check MIME type
        const isValidMimeType = allowedTypes.includes(asset.type);
        
        // Check file extension as fallback
        const fileName = asset.fileName || '';
        const fileExtension = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
        const isValidExtension = allowedExtensions.includes(fileExtension);
        
        if (!isValidMimeType && !isValidExtension) {
          Toast.show({
            type: 'error',
            text1: t('documentUpload.invalidFileType'),
            text2: t('documentUpload.selectValidFileTypes'),
            autoHide: true,
            position: 'bottom',
            bottomOffset: 20
          });
          return;
        }

        // Set document data
        setDocument({
          uri: asset.uri,
          type: asset.type,
          name: asset.fileName,
          size: asset.fileSize
        });
        setDocumentName(asset.fileName);
        setDocumentType(asset.type);
        setIsDocumentFound(true);
        
        // Set preview for images
        if (asset.type.startsWith('image/')) {
          setDocumentPreviewUri(asset.uri);
        } else {
          setDocumentPreviewUri(null);
        }

        Toast.show({
          type: 'success',
          text1: 'Document selected',
          text2: asset.fileName,
          autoHide: true,
          position: 'bottom',
          bottomOffset: 20
        });
      }
    }
  };

  const openGallery = async () => {
    const options: ImageLibraryOptions = {
      mediaType: 'mixed',
      includeBase64: false,
      maxHeight: 2000,
      maxWidth: 2000,
      quality: 0.8,
      selectionLimit: 1,
    };

    try {
      const response = await launchImageLibrary(options);
      handleImagePickerResponse(response);
    } catch (error) {
      console.error('Error opening gallery:', error);
      Toast.show({
        type: 'error',
        text1: t('documentUpload.failedToOpenGallery'),
        autoHide: true,
        position: 'bottom',
        bottomOffset: 20
      });
    }
  };

  const openCamera = async () => {
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) {
      Toast.show({
        type: 'error',
        text1: t('documentUpload.cameraPermissionDenied'),
        text2: t('documentUpload.enableCameraAccess'),
        autoHide: true,
        position: 'bottom',
        bottomOffset: 20
      });
      return;
    }

    const options: CameraOptions = {
      mediaType: 'photo',
      includeBase64: false,
      maxHeight: 2000,
      maxWidth: 2000,
      quality: 0.8,
      saveToPhotos: false,
    };

    try {
      const response = await launchCamera(options);
      handleImagePickerResponse(response);
    } catch (error) {
      console.error('Error opening camera:', error);
      Toast.show({
        type: 'error',
        text1: t('documentUpload.failedToOpenCamera'),
        autoHide: true,
        position: 'bottom',
        bottomOffset: 20
      });
    }
  };

  const openDocumentPicker = async () => {
    const options: ImageLibraryOptions = {
      mediaType: 'mixed',
      includeBase64: false,
      selectionLimit: 1,
    };

    try {
      const response = await launchImageLibrary(options);
      handleImagePickerResponse(response);
    } catch (error) {
      console.error('Error opening document picker:', error);
      Toast.show({
        type: 'error',
        text1: t('documentUpload.failedToOpenDocumentPicker'),
        autoHide: true,
        position: 'bottom',
        bottomOffset: 20
      });
    }
  };

  const showUploadOptions = () => {
    Alert.alert(
      t('documentUpload.selectDocument'),
      t('documentUpload.chooseUploadMethod'),
      [
        {
          text: t('documentUpload.camera'),
          onPress: openCamera
        },
        {
          text: t('documentUpload.gallery'),
          onPress: openGallery
        },
        {
          text: t('documentUpload.documentPicker'),
          onPress: openDocumentPicker
        },
        {
          text: t('documentUpload.cancel'),
          style: 'cancel'
        }
      ]
    );
  };

  const handleSubmit = async () => {
    // For User Photo and User Signature, skip document type and document ID validation
    const isUserPhotoOrSignature = getDocTypeFromTitle(documentTypeFromRoute) === 'user_photo' || getDocTypeFromTitle(documentTypeFromRoute) === 'user_sign';
    
    if (!isUserPhotoOrSignature) {
      if (!selectedDocumentType) {
        Toast.show({
          type: 'error',
          text1: t('documentUpload.pleaseSelectDocumentType'),
          autoHide: true,
          position: 'bottom',
          bottomOffset: 20
        });
        return;
      }

      // For Aadhaar Card, check Aadhaar number instead of document ID
      if (selectedDocumentType === 'aadhar_card') {
        if (!aadharNumber) {
          Toast.show({
            type: 'error',
            text1: t('documentUpload.pleaseEnterAadharNumber'),
            autoHide: true,
            position: 'bottom',
            bottomOffset: 20
          });
          return;
        }
        
        if (aadharNumber.length !== 12) {
          Toast.show({
            type: 'error',
            text1: t('documentUpload.invalidAadharNumber'),
            text2: t('documentUpload.invalidAadharMessage'),
            autoHide: true,
            position: 'bottom',
            bottomOffset: 20
          });
          return;
        }
      } else if (!documentId) {
        // For other documents, check document ID
        Toast.show({
          type: 'error',
          text1: t('documentUpload.pleaseEnterDocumentId'),
          autoHide: true,
          position: 'bottom',
          bottomOffset: 20
        });
        return;
      }
    }

    // Check if this is Aadhar card and E-KYC is enabled
    if (selectedDocumentType === 'aadhar_card' && isEkycEnabled && useEkyc) {
      // Handle E-KYC submission
      handleAadharDetailsSubmit();
      return;
    }

    if (!document) {
      Toast.show({
        type: 'error',
        text1: t('documentUpload.pleaseSelectFile'),
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

      const docType = getDocTypeFromTitle(documentTypeFromRoute);
      
      // Handle different document types based on old app structure
      let finalDocumentId = documentId || '';
      let finalDocumentName = selectedDocumentType || '';
      
      if (docType === 'user_photo') {
        // User Photo only needs the file, no document ID or name
        finalDocumentId = '';
        finalDocumentName = '';
      } else if (docType === 'gst_certificate') {
        // GST Certificate uses document ID as GST number
        finalDocumentId = documentId || 'GST_NUMBER';
        finalDocumentName = '';
      } else if (isUserPhotoOrSignature) {
        // User Signature needs document ID and name
        finalDocumentId = 'USER_SIGNATURE';
        finalDocumentName = 'User Signature';
      } else if (selectedDocumentType === 'aadhar_card') {
        // Aadhaar Card uses Aadhaar number as document ID
        finalDocumentId = aadharNumber || '';
        finalDocumentName = 'Aadhaar Card';
      }
      
      console.log('=== DOCUMENT UPLOAD DEBUG ===');
      console.log('Username:', username);
      console.log('Document Type:', docType);
      console.log('Selected Document Type:', selectedDocumentType);
      console.log('Document Name:', finalDocumentName);
      console.log('Document ID:', finalDocumentId);
      console.log('Document Object:', document);
      console.log('Realm:', realm);
      console.log('Is User Photo/Signature:', isUserPhotoOrSignature);
      console.log('================================');
      
      const response = await apiService.updateKycDetails(username || '', finalDocumentName, finalDocumentId, document, docType, realm || '');
      
      console.log('=== API RESPONSE DEBUG ===');
      console.log('API Response:', JSON.stringify(response, null, 2));
      console.log('Response Status:', response?.status);
      console.log('Response Message:', response?.message);
      console.log('Response Data:', response?.data);
      console.log('================================');
      
      // Reset form after successful submission
      setDocumentId('');
      setDocument(null);
      setDocumentType('');
      setDocumentName('');
      setIsDocumentFound(false);
      setSelectedDocumentType('');
      
      Toast.show({
        type: 'success',
        text1: t('documentUpload.documentUploadSuccess'),
        autoHide: true,
        position: 'bottom',
        bottomOffset: 20
      });

      setTimeout(() => {
        navigation.goBack();
      }, 3000);

    } catch (error: any) {
      console.error('=== ERROR DEBUG ===');
      console.error('Error submitting document:', error);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      console.error('Error details:', JSON.stringify(error, null, 2));
      console.error('===================');
      
      Toast.show({
        type: 'error',
        text1: t('documentUpload.documentUploadError'),
        autoHide: true,
        position: 'bottom',
        bottomOffset: 20
      });
    } finally {
      setLoading(false);
    }
  };

  const generateAadharOtp = async () => {
    try {
      setLoading(true);
      const username = await sessionManager.getUsername();
      const { getClientConfig } = require('../config/client-config');
      const clientConfig = getClientConfig();
      const realm = clientConfig.clientId;

      const params = {
        aadhar_no: aadharNumber,
        username: username,
        request_source: 'app',
        request_app: 'user_app'
      };

      const response = await apiService.selfcareAadhaarVerificationOTP(params, realm);
      console.log('OTP response:', response);
      
      if (response && response.status === 'ok') {
        setClientRefId(response.data.client_refid);
        Toast.show({
          type: 'success',
          text1: t('documentUpload.otpGeneratedSuccess'),
          text2: t('documentUpload.otpSentMessage'),
          autoHide: true,
          position: 'bottom',
          bottomOffset: 20
        });
        setIsOtpGenerated(true);
        setShowOtpField(true);
        setOtpTimer(60);
        setShowResendButton(false);
      } else {
        throw new Error(response?.message || t('documentUpload.failedToGenerateOtp'));
      }
    } catch (error: any) {
      console.error('Error generating OTP:', error);
      Toast.show({
        type: 'error',
        text1: error.message || 'Failed to generate OTP',
        autoHide: true,
        position: 'bottom',
        bottomOffset: 20
      });
    } finally {
      setLoading(false);
    }
  };

  const verifyAadharOtp = async () => {
    try {
      setLoading(true);
      const username = await sessionManager.getUsername();
      const { getClientConfig } = require('../config/client-config');
      const clientConfig = getClientConfig();
      const realm = clientConfig.clientId;

      const params = {
        aadhar_no: aadharNumber,
        username: username,
        otp: otp,
        client_refid: clientRefId,
        request_source: 'app',
        request_app: 'user_app'
      };

      const response = await apiService.selfcareSubmitAadhaarOTP(params, realm);
      console.log('OTP verification response:', response);
      
      if (response && response.status === 'ok') {
        setAadharDetails(response.data);
        setShowAadharDetails(true);
        Toast.show({
          type: 'success',
          text1: t('documentUpload.aadharVerificationSuccess'),
          text2: t('documentUpload.aadharVerifiedMessage'),
          autoHide: true,
          position: 'bottom',
          bottomOffset: 20
        });
      } else {
        let errorMessage = t('documentUpload.otpVerificationFailed');
        if (response?.message) {
          errorMessage = response.message;
        } else if (response?.data?.message) {
          errorMessage = response.data.message;
        }
        
        Toast.show({
          type: 'error',
          text1: t('documentUpload.otpVerificationFailed'),
          text2: errorMessage,
          autoHide: true,
          position: 'bottom',
          bottomOffset: 20
        });

        setOtp('');
        setShowResendButton(true);
        setOtpTimer(0);
        
        throw new Error(errorMessage);
      }
    } catch (error: any) {
      console.error('Error verifying OTP:', error);
      Toast.show({
        type: 'error',
        text1: 'OTP Verification Failed',
        text2: error.message || 'Please try again with a valid OTP',
        autoHide: true,
        position: 'bottom',
        bottomOffset: 20
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAadharDetailsSubmit = async () => {
    try {
      setLoading(true);
      const username = await sessionManager.getUsername();
      const { getClientConfig } = require('../config/client-config');
      const clientConfig = getClientConfig();
      const realm = clientConfig.clientId;
      
      const kycData = {
        kyc_id: '',
        ekyc_api_status: aadharDetails.statuscode,
        ref_data: aadharDetails.client_refid || '',
        ekyc_json: JSON.stringify(aadharDetails),
        doc_name: selectedDocumentType
      };

      const response = await apiService.selfcareSubmiteKYCData(kycData, realm);
      
      if (response && response.status === 'ok') {
        const ekycData = {
          is_aadhar_verified: 'true',
          is_without_otp_ekyc_data_verified: '',
          address_proof_ekyc_table_id: response.extra_value || ''
        };

        const docType = getDocTypeFromTitle(documentTypeFromRoute);
        const updateResponse = await apiService.updateKycDetails(
          username || '', 
          selectedDocumentType || '', 
          aadharNumber || '',
          null,
          docType,
          realm || '',
          ekycData
        );

        Toast.show({
          type: 'success',
          text1: t('documentUpload.ekycSubmittedSuccess'),
          text2: t('documentUpload.ekycSubmittedMessage'),
          autoHide: true,
          position: 'bottom',
          bottomOffset: 20
        });
        
        setTimeout(() => {
          navigation.goBack();
        }, 2000);
      } else {
        throw new Error(response?.message || t('documentUpload.failedToSubmitEkyc'));
      }
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: t('documentUpload.failedToSubmitEkyc'),
        text2: error.message || 'Please try again',
        autoHide: true,
        position: 'bottom',
        bottomOffset: 20
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    Alert.alert(
      'Cancel Upload',
      'Are you sure you want to cancel? All entered data will be lost.',
      [
        {
          text: 'Continue Editing',
          style: 'cancel'
        },
        {
          text: 'Cancel Upload',
          style: 'destructive',
          onPress: () => navigation.goBack()
        }
      ]
    );
  };

  if (loading && !documentTypes.length) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <CommonHeader navigation={navigation} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            {t('documentUpload.loading')}
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
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              {t('documentUpload.upload')} {getDocumentTypeDisplayName(documentTypeFromRoute)}
            </Text>
            <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
              {t('documentUpload.provideDocumentDetailsText')} {getDocumentTypeDisplayName(documentTypeFromRoute).toLowerCase()} {t('documentUpload.detailsAndDocument')}
            </Text>
          </View>
        </View>
        




        {/* Document Type Selection - Hide for User Photo and User Signature */}
        {getDocTypeFromTitle(documentTypeFromRoute) !== 'user_photo' && getDocTypeFromTitle(documentTypeFromRoute) !== 'user_sign' && (
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>{t('documentUpload.select')} {getDocumentTypeDisplayName(documentTypeFromRoute)}</Text>
            <TouchableOpacity
              style={[styles.pickerContainer, { borderColor: colors.borderLight }]}
              onPress={() => {
                setShowDocumentPicker(true);
              }}
            >
              <View style={styles.pickerContent}>
                <Text style={[styles.pickerText, { color: colors.text }]}>
                  {selectedDocumentType ? 
                    documentTypes.find(item => item.value === selectedDocumentType)?.label 
                    : `${t('documentUpload.select')} ${getDocumentTypeDisplayName(documentTypeFromRoute)}`
                  }
                </Text>
                <Feather name="chevron-down" size={20} color={colors.textSecondary} />
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* Document ID Input - Hide for User Photo, User Signature, and Aadhaar Card */}
        {getDocTypeFromTitle(documentTypeFromRoute) !== 'user_photo' && 
         getDocTypeFromTitle(documentTypeFromRoute) !== 'user_sign' && 
         selectedDocumentType !== 'aadhar_card' && (
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>{t('documentUpload.documentId')}</Text>
            <TextInput
              style={[styles.input, { 
                backgroundColor: colors.background,
                borderColor: colors.borderLight,
                color: colors.text
              }]}
              placeholder={t('documentUpload.documentIdPlaceholder')}
              placeholderTextColor={colors.textSecondary}
              value={documentId}
              onChangeText={setDocumentId}
            />
          </View>
        )}

        {/* Aadhar Number Input - Only show for Aadhar Card */}
        {selectedDocumentType === 'aadhar_card' && (
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>{t('documentUpload.aadharNumber')}</Text>
            <TextInput
              style={[styles.input, { 
                backgroundColor: colors.background,
                borderColor: colors.borderLight,
                color: colors.text
              }]}
              placeholder={t('documentUpload.aadharNumberPlaceholder')}
              placeholderTextColor={colors.textSecondary}
              value={aadharNumber}
              onChangeText={setAadharNumber}
              keyboardType="numeric"
              maxLength={12}
            />
          </View>
        )}



        {/* E-KYC Toggle - Only show for Aadhar Card */}
        {selectedDocumentType === 'aadhar_card' && isEkycEnabled && (
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>{t('documentUpload.ekycVerification')}</Text>
            <View style={styles.ekycRow}>
              <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
                {t('documentUpload.ekycDescription')}
              </Text>
              <Switch
                value={useEkyc}
                onValueChange={setUseEkyc}
                trackColor={{ false: colors.borderLight, true: colors.primary }}
                thumbColor={useEkyc ? '#fff' : '#f4f3f4'}
              />
            </View>
            {!useEkyc && (
              <Text style={[styles.ekycDisabledText, { color: colors.textSecondary }]}>
                {t('documentUpload.manualUploadNote')}
              </Text>
            )}
          </View>
        )}

        {/* File Upload Section */}
        {(selectedDocumentType !== 'aadhar_card' || !useEkyc || !isEkycEnabled) && (
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>
              {getDocTypeFromTitle(documentTypeFromRoute) === 'user_photo' ? t('documentUpload.uploadPhoto') :
               getDocTypeFromTitle(documentTypeFromRoute) === 'user_sign' ? t('documentUpload.uploadSignature') :
               t('documentUpload.uploadDocument')}
            </Text>
            
            <View style={styles.uploadButtonsContainer}>
              <TouchableOpacity 
                style={[styles.uploadButton, { backgroundColor: colors.primary }]}
                onPress={openCamera}
              >
                <Feather name="camera" size={24} color="white" style={styles.uploadIcon} />
                <Text style={styles.uploadButtonText}>{t('documentUpload.camera')}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.uploadButton, { backgroundColor: colors.primary }]}
                onPress={openGallery}
              >
                <Feather name="image" size={24} color="white" style={styles.uploadIcon} />
                <Text style={styles.uploadButtonText}>{t('documentUpload.gallery')}</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.uploadButton, { backgroundColor: colors.primary }]}
                onPress={openDocumentPicker}
              >
                <Feather name="file-text" size={24} color="white" style={styles.uploadIcon} />
                <Text style={styles.uploadButtonText}>{t('documentUpload.pdf')}</Text>
              </TouchableOpacity>
            </View>

            {/* Document Preview */}
            {documentPreviewUri && (
              <View style={styles.previewContainer}>
                <Text style={[styles.previewTitle, { color: colors.text }]}>{t('documentUpload.selectedDocument')}</Text>
                <Image source={{ uri: documentPreviewUri }} style={styles.previewImage} />
                <Text style={[styles.previewName, { color: colors.textSecondary }]}>{documentName}</Text>
              </View>
            )}

            {/* Document Info for PDFs */}
            {document && !documentPreviewUri && (
              <View style={styles.previewContainer}>
                <Text style={[styles.previewTitle, { color: colors.text }]}>{t('documentUpload.selectedDocument')}</Text>
                <View style={styles.pdfPreview}>
                  <Feather name="file-text" size={48} color={colors.primary} />
                  <Text style={[styles.previewName, { color: colors.textSecondary }]}>{documentName}</Text>
                  {document.size && (
                    <Text style={[styles.fileSize, { color: colors.textSecondary }]}>
                      {(document.size / (1024 * 1024)).toFixed(2)} MB
                    </Text>
                  )}
                </View>
              </View>
            )}
          </View>
        )}

        {/* E-KYC Flow Sections */}
        {selectedDocumentType === 'aadhar_card' && isEkycEnabled && useEkyc && (
          <>
            {/* OTP Generation Section */}
            {!isOtpGenerated && !showAadharDetails && (
              <View style={[styles.card, { backgroundColor: colors.card }]}>
                <Text style={[styles.cardTitle, { color: colors.text }]}>{t('documentUpload.generateOtp')}</Text>
                <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
                  {t('documentUpload.generateOtpDescription')}
                </Text>
                <TouchableOpacity
                  style={[styles.ekycButton, { backgroundColor: colors.primary }]}
                  onPress={generateAadharOtp}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.ekycButtonText}>{t('documentUpload.generateOtp')}</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {/* OTP Verification Section */}
            {isOtpGenerated && !showAadharDetails && (
              <View style={[styles.card, { backgroundColor: colors.card }]}>
                <Text style={[styles.cardTitle, { color: colors.text }]}>{t('documentUpload.verifyOtp')}</Text>
                <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
                  {t('documentUpload.verifyOtpDescription')}
                </Text>
                <TextInput
                  style={[styles.input, { 
                    backgroundColor: colors.background,
                    borderColor: colors.borderLight,
                    color: colors.text
                  }]}
                  placeholder={t('documentUpload.otpPlaceholder')}
                  placeholderTextColor={colors.textSecondary}
                  value={otp}
                  onChangeText={setOtp}
                  keyboardType="numeric"
                  maxLength={6}
                />
                <TouchableOpacity
                  style={[styles.ekycButton, { backgroundColor: colors.primary }]}
                  onPress={verifyAadharOtp}
                  disabled={loading || otp.length !== 6}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.ekycButtonText}>{t('documentUpload.verifyOtpButton')}</Text>
                  )}
                </TouchableOpacity>
                {otpTimer > 0 && (
                  <Text style={[styles.timerText, { color: colors.textSecondary }]}>
                    {t('documentUpload.resendOtpIn')} {otpTimer} {t('documentUpload.seconds')}
                  </Text>
                )}
                {showResendButton && (
                  <TouchableOpacity
                    style={styles.resendButton}
                    onPress={generateAadharOtp}
                  >
                    <Text style={[styles.ekycButtonText, { color: colors.primary }]}>{t('documentUpload.resendOtp')}</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* Aadhar Details Display */}
            {showAadharDetails && aadharDetails && (
              <View style={[styles.card, { backgroundColor: colors.card }]}>
                <Text style={[styles.cardTitle, { color: colors.text }]}>{t('documentUpload.aadharDetails')}</Text>
                <View style={styles.detailsContainer}>
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: colors.text }]}>{t('documentUpload.name')}:</Text>
                    <Text style={[styles.detailValue, { color: colors.textSecondary }]}>{aadharDetails.full_name}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: colors.text }]}>{t('documentUpload.dateOfBirth')}:</Text>
                    <Text style={[styles.detailValue, { color: colors.textSecondary }]}>{aadharDetails.dob}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: colors.text }]}>{t('documentUpload.gender')}:</Text>
                    <Text style={[styles.detailValue, { color: colors.textSecondary }]}>{aadharDetails.gender}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: colors.text }]}>{t('documentUpload.address')}:</Text>
                    <Text style={[styles.detailValue, { color: colors.textSecondary }]}>
                      {aadharDetails.house}, {aadharDetails.street}, {aadharDetails.loc}, {aadharDetails.vtc}, {aadharDetails.po}, {aadharDetails.district}, {aadharDetails.state} - {aadharDetails.zip}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={[styles.ekycButton, { backgroundColor: colors.primary }]}
                  onPress={handleAadharDetailsSubmit}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.ekycButtonText}>{t('documentUpload.submitEkyc')}</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </>
        )}

        {/* Action Buttons - Only show for non-E-KYC or when E-KYC is disabled */}
        {(selectedDocumentType !== 'aadhar_card' || !useEkyc || !isEkycEnabled) && (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.cancelButton, {backgroundColor: colors.borderLight}]}
              onPress={handleCancel}
              disabled={loading}
            >
              <Text style={[styles.cancelButtonText, {color: colors.text}]}>{t('documentUpload.cancel')}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.submitButton, {backgroundColor: colors.primary}]}
              onPress={handleSubmit}
              disabled={
                (getDocTypeFromTitle(documentTypeFromRoute) === 'user_photo' || getDocTypeFromTitle(documentTypeFromRoute) === 'user_sign')
                  ? (!document || loading)
                  : selectedDocumentType === 'aadhar_card'
                    ? (!selectedDocumentType || !aadharNumber || !document || loading)
                    : (!selectedDocumentType || !documentId || !document || loading)
              }
            >
              <Text style={styles.submitButtonText}>
                {loading ? 'Uploading...' : t('documentUpload.submit')}
              </Text>
            </TouchableOpacity>
          </View>
        )}
        

      </ScrollView>
      
      {/* Document Picker Modal */}
      <Modal
        visible={showDocumentPicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowDocumentPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {t('documentUpload.select')} {getDocumentTypeDisplayName(documentTypeFromRoute)}
              </Text>
              <TouchableOpacity
                onPress={() => setShowDocumentPicker(false)}
                style={styles.closeButton}
              >
                <Feather name="x" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={documentTypes}
              keyExtractor={(item) => item.value}

              ListEmptyComponent={() => (
                <View style={{ padding: 20, alignItems: 'center' }}>
                  <Text style={{ color: colors.textSecondary, fontSize: 16 }}>
                    No document types available
                  </Text>
                  <Text style={{ color: colors.textSecondary, fontSize: 14, marginTop: 8 }}>
                    Count: {documentTypes.length}
                  </Text>
                </View>
              )}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.documentOption,
                    { borderBottomColor: colors.borderLight },
                    selectedDocumentType === item.value && { backgroundColor: colors.primary + '15' }
                  ]}
                  onPress={() => {
                    setSelectedDocumentType(item.value);
                    setDocumentId('');
                    setDocumentPreviewUri(null);
                    setDocumentName('');
                    setDocument(null);
                    setAadharNumber('');
                    setOtp('');
                    setIsOtpGenerated(false);
                    setShowOtpField(false);
                    setShowAadharDetails(false);
                    setClientRefId('');
                    setOtpTimer(60);
                    setShowResendButton(false);
                    setShowDocumentPicker(false);
                  }}
                >
                  <View style={styles.documentOptionContent}>
                    <Text style={[styles.documentOptionText, { color: colors.text }]}>
                      {item.label}
                    </Text>
                    {selectedDocumentType === item.value && (
                      <Feather name="check" size={20} color={colors.primary} />
                    )}
                  </View>
                </TouchableOpacity>
              )}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.documentList}
            />
          </View>
        </View>
      </Modal>
      
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
  ekycStatusContainer: {
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 122, 255, 0.2)',
  },
  ekycStatusText: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  ekycStatusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  ekycStatusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  ekycDisabledText: {
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
    fontStyle: 'italic',
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
  pickerContainer: {
    borderWidth: 1,
    borderRadius: 12,
    overflow: 'hidden',
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
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginTop: 8,
  },
  uploadButtonsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
    flexWrap: 'wrap',
  },
  uploadButton: {
    flex: 1,
    minWidth: '30%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 12,
  },
  uploadIcon: {
    marginRight: 8,
  },
  uploadButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  browseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  browseIcon: {
    marginRight: 8,
  },
  browseButtonText: {
    color: 'white',
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
  pdfPreview: {
    alignItems: 'center',
    padding: 20,
  },
  fileSize: {
    fontSize: 12,
    marginTop: 4,
    opacity: 0.7,
  },
  actionButtons: {
    flexDirection: 'row',
    marginHorizontal: 24,
    marginBottom: 24,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '70%',
    minHeight: '50%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
  },
  documentList: {
    paddingBottom: 20,
  },
  documentOption: {
    borderBottomWidth: 1,
  },
  documentOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  documentOptionText: {
    fontSize: 16,
    fontWeight: '500',
  },
  ekycRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardSubtitle: {
    fontSize: 14,
    marginTop: 4,
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
  otpContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    marginTop: 10,
  },
  resendButton: {
    marginTop: 10,
  },
  timerText: {
    marginTop: 10,
    fontSize: 14,
  },
  profileImageContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  profileImage: {
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 2,
    borderColor: '#E4E4E4',
  },
  detailsContainer: {
    marginBottom: 20,
  },
  detailRow: {
    marginBottom: 10,
  },
  detailLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  detailValue: {
    fontSize: 16,
    lineHeight: 20,
  },
});

export default DocumentUploadScreen; 