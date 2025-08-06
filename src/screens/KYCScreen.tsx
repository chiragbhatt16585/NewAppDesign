import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Dimensions,
  Linking,
  RefreshControl,
} from 'react-native';
import ImageViewing from 'react-native-image-viewing';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useTheme} from '../utils/ThemeContext';
import {getThemeColors} from '../utils/themeStyles';
import CommonHeader from '../components/CommonHeader';
import {useTranslation} from 'react-i18next';
import {apiService} from '../services/api';
import sessionManager from '../services/sessionManager';
import {useSessionValidation} from '../utils/useSessionValidation';
import Feather from 'react-native-vector-icons/Feather';

const {width: screenWidth} = Dimensions.get('window');

interface KYCItem {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  status: 'not_uploaded' | 'pending' | 'uploaded' | 'verified' | 'rejected';
  uploadedDate?: string;
  documentName?: string;
}

interface KYCDocument {
  id: string;
  username: string;
  doc_type: string;
  doc_name: string;
  doc_id: string;
  filename: string;
  entry_date: string;
  last_update: string;
  kyc_status: string;
  record_status: string;
  approval_date: string;
  admin_login_id: string;
  full_name: string;
  dist_login_id: string;
  primary_mobile: string;
  ekyc_id: number;
}

const KYCScreen = ({navigation}: any) => {
  const {isDark} = useTheme();
  const colors = getThemeColors(isDark);
  const {t} = useTranslation();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [kycData, setKycData] = useState<KYCItem[]>([]);
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);
  const {checkSessionAndHandle} = useSessionValidation();

  useEffect(() => {
    loadKYCData();
  }, []);

  // Add focus listener to refresh data when returning from DocumentUpload
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      console.log('KYC Screen focused - refreshing data');
      loadKYCData();
    });

    return unsubscribe;
  }, [navigation]);

  const loadKYCData = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      
      // Get username from session manager
      const username = await sessionManager.getUsername();
      if (!username) {
        console.log('No username found in session');
        throw new Error('No user session found. Please login again.');
      }

      console.log('Loading KYC data for username:', username);
      
      // Get current client configuration
      const {getClientConfig} = require('../config/client-config');
      const clientConfig = getClientConfig();
      const realm = clientConfig.clientId;

      console.log('Using realm:', realm);

      // Call the viewUserKyc API to get KYC information
      const kycResponse = await apiService.viewUserKyc(username, realm);
      
      // Define all required document types
      const allRequiredDocuments = [
        {
          doc_type: 'id_proof',
          doc_name: 'Identity Proof',
          icon: '🆔',
          subtitle: 'Aadhaar card, PAN card, or driving license'
        },
        {
          doc_type: 'address_proof',
          doc_name: 'Address Proof',
          icon: '🏠',
          subtitle: 'Utility bill, rental agreement, or bank statement'
        },
        {
          doc_type: 'user_photo',
          doc_name: 'User Photo',
          icon: '📸',
          subtitle: 'Recent passport size photograph'
        },
        {
          doc_type: 'gst_certificate',
          doc_name: 'GST Certificate',
          icon: '🏢',
          subtitle: 'GST registration certificate'
        },
        {
          doc_type: 'user_sign',
          doc_name: 'User Signature',
          icon: '✍️',
          subtitle: 'Digital signature or handwritten signature'
        },
        {
          doc_type: 'other',
          doc_name: 'Additional Documents',
          icon: '📄',
          subtitle: 'Additional supporting documents'
        }
      ];

      if (kycResponse && Array.isArray(kycResponse) && kycResponse.length > 0) {
        console.log('=== KYC DATA REFRESH DEBUG ===');
        console.log('KYC Data received:', JSON.stringify(kycResponse, null, 2));
        console.log('Number of documents:', kycResponse.length);
        kycResponse.forEach((doc: KYCDocument, index: number) => {
          console.log(`Document ${index + 1}:`, {
            doc_type: doc.doc_type,
            doc_name: doc.doc_name,
            doc_id: doc.doc_id,
            kyc_status: doc.kyc_status,
            filename: doc.filename
          });
        });
        console.log('================================');
        
        // Create a map of uploaded documents by doc_type
        const uploadedDocsMap = new Map();
        kycResponse.forEach((doc: KYCDocument) => {
          uploadedDocsMap.set(doc.doc_type, doc);
        });

        // Filter required documents - exclude User Signature and Other documents if no existing data
        const filteredRequiredDocuments = allRequiredDocuments.filter(requiredDoc => {
          // Always include User Signature if it exists in uploaded data
          if (requiredDoc.doc_type === 'user_sign') {
            return uploadedDocsMap.has('user_sign');
          }
          // Always include Other documents if it exists in uploaded data
          if (requiredDoc.doc_type === 'other') {
            return uploadedDocsMap.has('other');
          }
          // Include all other documents
          return true;
        });

        // Merge API data with filtered required documents
        const mergedData: KYCItem[] = filteredRequiredDocuments.map((requiredDoc, index) => {
          const uploadedDoc = uploadedDocsMap.get(requiredDoc.doc_type);
          
          if (uploadedDoc) {
            // Document exists in API response
            const getStatus = (kycStatus: string) => {
              switch (kycStatus?.toLowerCase()) {
                case 'approved': return 'verified';
                case 'pending': return 'pending'; // Document uploaded but not verified
                case 'rejected': return 'rejected';
                default: return 'pending';
              }
            };

            const status = getStatus(uploadedDoc.kyc_status) as 'pending' | 'uploaded' | 'verified' | 'rejected';
            
            const mappedItem: KYCItem = {
              id: uploadedDoc.id,
              title: uploadedDoc.doc_name.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
              subtitle: `ID No. : ${uploadedDoc.doc_id}`,
              icon: requiredDoc.icon,
              status: status,
              uploadedDate: uploadedDoc.entry_date || uploadedDoc.last_update || 'Date not available',
              documentName: uploadedDoc.filename || 'Document',
            };
            
            console.log('=== KYC ITEM DEBUG ===');
            console.log('Document Type:', requiredDoc.doc_type);
            console.log('Status:', status);
            console.log('Uploaded Date:', mappedItem.uploadedDate);
            console.log('Document Name:', mappedItem.documentName);
            console.log('========================');
            
            return mappedItem;
          } else {
            // Document not uploaded yet (this should not happen for user_sign due to filtering)
            return {
              id: `not_uploaded_${index}`,
              title: requiredDoc.doc_name,
              subtitle: requiredDoc.subtitle,
              icon: requiredDoc.icon,
              status: 'not_uploaded',
            };
          }
        });

        setKycData(mergedData);
      } else {
        console.log('No KYC data received, showing test data with uploaded documents');
        // Show test data with some uploaded documents for testing (excluding User Signature and Other)
        const testKYCData: KYCItem[] = [
          {
            id: '1',
            title: 'Identity Proof',
            subtitle: 'ID No. : A123456789',
            icon: '🆔',
            status: 'pending',
            uploadedDate: '2024-01-15 14:30:00',
            documentName: 'aadhar_card.pdf',
          },
          {
            id: '2',
            title: 'Address Proof',
            subtitle: 'ID No. : 123456789',
            icon: '🏠',
            status: 'verified',
            uploadedDate: '2024-01-10 09:15:00',
            documentName: 'utility_bill.pdf',
          },
          {
            id: '3',
            title: 'User Photo',
            subtitle: 'Recent passport size photograph',
            icon: '📸',
            status: 'not_uploaded',
          },
          {
            id: '4',
            title: 'GST Certificate',
            subtitle: 'GST registration certificate',
            icon: '🏢',
            status: 'rejected',
            uploadedDate: '2024-01-12 16:45:00',
            documentName: 'gst_cert.pdf',
          },
        ];
        
        setKycData(testKYCData);
      }
    } catch (error: any) {
      console.error('Error loading KYC data:', error);
      // Show static sample data even when API fails
      console.log('API failed, showing static sample data');
      const staticKYCData: KYCItem[] = [
        {
          id: '1',
          title: 'Identity Proof',
          subtitle: 'Aadhaar card, PAN card, or driving license',
          icon: '🆔',
          status: 'not_uploaded',
        },
        {
          id: '2',
          title: 'Address Proof',
          subtitle: 'Utility bill, rental agreement, or bank statement',
          icon: '🏠',
          status: 'not_uploaded',
        },
        {
          id: '3',
          title: 'User Photo',
          subtitle: 'Recent passport size photograph',
          icon: '📸',
          status: 'not_uploaded',
        },
        {
          id: '4',
          title: 'GST Certificate',
          subtitle: 'GST registration certificate',
          icon: '🏢',
          status: 'not_uploaded',
        },
      ];
      
      setKycData(staticKYCData);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    console.log('Manual refresh triggered');
    loadKYCData(true);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified':
        return '#10B981';
      case 'uploaded':
        return '#3B82F6';
      case 'rejected':
        return '#EF4444';
      case 'pending':
        return '#F59E0B';
      case 'not_uploaded':
        return '#6B7280';
      default:
        return '#6B7280';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'verified':
        return 'Verified';
      case 'uploaded':
        return 'Uploaded';
      case 'rejected':
        return 'Rejected';
      case 'pending':
        return 'Pending';
      case 'not_uploaded':
        return ''; // No status text for not uploaded documents
      default:
        return '';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified':
        return '✓';
      case 'uploaded':
        return '↑';
      case 'rejected':
        return '✕';
      case 'pending':
        return '⏳';
      case 'not_uploaded':
        return '📄';
      default:
        return '📄';
    }
  };

  const handleKYCPress = (item: KYCItem) => {
    if (item.status === 'uploaded' || item.status === 'verified' || item.status === 'rejected') {
      Alert.alert(
        item.title,
        `Status: ${getStatusText(item.status)}\n${
          item.uploadedDate ? `Uploaded: ${item.uploadedDate}\n` : ''
        }${
          item.documentName ? `Document: ${item.documentName}` : ''
        }`,
        [
          {text: 'View Details', onPress: () => console.log('View document details')},
          {text: 'Cancel', style: 'cancel'},
        ]
      );
    } else {
      Alert.alert(
        'Upload Document',
        `Upload your ${item.title.toLowerCase()}`,
        [
          {text: 'Camera', onPress: () => console.log('Open camera')},
          {text: 'Gallery', onPress: () => console.log('Open gallery')},
          {text: 'Cancel', style: 'cancel'},
        ]
      );
    }
  };

  const handleViewDocument = (item: KYCItem) => {
    const baseUrl = 'https://crm.dnainfotel.com/kyc_docs/';
    const documentUrl = baseUrl + item.documentName;
    
    // Check if the document is a PDF
    const isPDF = item.documentName?.toLowerCase().endsWith('.pdf');
    
    if (isPDF) {
      // For PDF files, open in browser or external PDF viewer
      Alert.alert(
        'View PDF Document',
        `Opening ${item.title}\nUploaded: ${item.uploadedDate}`,
        [
          {text: 'Open PDF', onPress: () => {
            Linking.openURL(documentUrl);
          }},
          {text: 'Cancel', style: 'cancel'},
        ]
      );
    } else {
      // For images, use the in-app image viewer
      setCurrentImageUrl(documentUrl);
      setImageViewerVisible(true);
    }
  };

  const handleUploadDocument = (item: KYCItem) => {
    console.log('handleUploadDocument called for:', item.title);
    
    try {
      navigation.navigate('DocumentUpload', { documentType: item.title });
      console.log('Navigation call completed');
    } catch (error) {
      console.error('Navigation error:', error);
      Alert.alert('Navigation Error', 'Failed to navigate to Document Upload screen');
    }
  };





  const renderKYCItem = (item: KYCItem) => {
    // Allow upload for not uploaded documents
    const isUpload = item.status === 'not_uploaded';
    const canUpload = item.status === 'pending' || item.status === 'uploaded' || item.status === 'verified' || item.status === 'rejected';
    
    console.log('=== RENDER DEBUG ===');
    console.log('Item Title:', item.title);
    console.log('Item Status:', item.status);
    console.log('Item Uploaded Date:', item.uploadedDate);
    console.log('Item Document Name:', item.documentName);
    console.log('Show Document Info:', (item.status === 'uploaded' || item.status === 'verified' || item.status === 'rejected'));
    console.log('===================');
    return (
      <View
        key={item.id}
        style={[styles.kycCard, {backgroundColor: colors.card}]}>
        <View style={styles.kycCardContent}>
          <View style={styles.kycCardLeft}>
            <View style={[styles.kycIconContainer, {backgroundColor: getStatusColor(item.status) + '15'}]}>
              <Text style={styles.kycIcon}>{item.icon}</Text>
            </View>
            <View style={styles.kycTextContainer}>
              <Text style={[styles.kycTitle, {color: colors.text}]}>{item.title}</Text>
              <Text style={[styles.kycSubtitle, {color: colors.textSecondary}]}>{item.subtitle}</Text>
            </View>
          </View>
          <View style={styles.statusActionsContainer}>
            {/* Status Display - Only show when there's a status text */}
            {getStatusText(item.status) && (
              <View
                style={[
                  styles.statusContainer,
                  {backgroundColor: getStatusColor(item.status) + '15'}
                ]}
              >
                <Text style={[styles.statusIcon, {color: getStatusColor(item.status)}]}>
                  {getStatusIcon(item.status)}
                </Text>
                <Text style={[styles.statusText, {color: getStatusColor(item.status)}]}>
                  {getStatusText(item.status)}
                </Text>
              </View>
            )}
            
            {/* Upload Button - Only show for not uploaded documents */}
            {isUpload && (
              <TouchableOpacity
                style={[
                  styles.uploadActionButton,
                  {backgroundColor: colors.primary}
                ]}
                onPress={() => handleUploadDocument(item)}
              >
                <Text style={[styles.uploadActionText, {color: 'white'}]}>
                  Upload
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
        

        
        {/* Document info for uploaded/pending/verified/rejected documents */}
        {(item.status === 'uploaded' || item.status === 'pending' || item.status === 'verified' || item.status === 'rejected') && (
          <View style={[styles.documentInfoRow, {borderTopColor: colors.borderLight}]}> 
            <View style={styles.dateContainer}>
              <Text style={styles.dateIcon}>📅</Text>
              <Text style={[styles.uploadedDate, {color: colors.textSecondary}]}> 
                {item.uploadedDate || 'Date not available'} 
              </Text> 
            </View> 
            <TouchableOpacity  
              style={styles.viewDocumentButton} 
              onPress={() => handleViewDocument(item)}> 
              <Text style={styles.viewIcon}>👁️</Text> 
              <Text style={[styles.viewText, {color: colors.primary}]}>View</Text> 
            </TouchableOpacity> 
          </View> 
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, {backgroundColor: colors.background}]}>
        <CommonHeader navigation={navigation} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, {color: colors.textSecondary}]}>
            Loading KYC information...
          </Text>
        </View>
      </SafeAreaView>
    );
  }



  const verifiedCount = kycData.filter(item => item.status === 'verified').length;
  const totalCount = kycData.length;
  const progressPercentage = (verifiedCount / totalCount) * 100;

  return (
    <SafeAreaView style={[styles.container, {backgroundColor: colors.background}]}>
      <CommonHeader navigation={navigation} />
      
      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {/* Modern Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={[styles.headerTitle, {color: colors.text}]}>View Your KYC</Text>
            <Text style={[styles.headerSubtitle, {color: colors.textSecondary}]}>See your submitted KYC documents and their status.</Text>
          </View>
        </View>

        {/* Modern Progress Card - Only show when there are uploaded documents */}
        {verifiedCount > 0 && (
          <View style={[styles.progressCard, {backgroundColor: colors.card}]}>
            <View style={styles.progressHeader}>
              <Text style={[styles.progressTitle, {color: colors.text}]}>Verification Status</Text>
              <Text style={[styles.progressCount, {color: colors.primary}]}>
                {verifiedCount}/{totalCount}
              </Text>
            </View>
            
            <View style={[styles.progressBar, {backgroundColor: colors.borderLight}]}>
              <View 
                style={[
                  styles.progressFill, 
                  {backgroundColor: colors.primary, width: `${progressPercentage}%`}
                ]} 
              />
            </View>
            
            <Text style={[styles.progressText, {color: colors.textSecondary}]}>
              {verifiedCount} of {totalCount} documents verified
            </Text>
          </View>
        )}

        {/* KYC Items */}
        <View style={styles.kycSection}>
          <Text style={[styles.sectionTitle, {color: colors.text}]}>Required Documents</Text>
          <View style={styles.kycList}>
            {kycData.map(renderKYCItem)}
          </View>
        </View>



        {/* Modern Info Card */}
        <View style={[styles.infoCard, {backgroundColor: colors.card}]}>
          <View style={styles.infoHeader}>
            <Text style={styles.infoIcon}>ℹ️</Text>
            <Text style={[styles.infoTitle, {color: colors.text}]}>Important Information</Text>
          </View>
          <View style={styles.infoContent}>
            <Text style={[styles.infoText, {color: colors.textSecondary}]}>
              • All documents must be clear and legible{'\n'}
              • File size should be less than 5MB{'\n'}
              • Supported formats: PDF, JPG, PNG{'\n'}
              • Verification may take 24-48 hours
            </Text>
          </View>
        </View>
       </ScrollView>
       
       {/* Image Viewer Modal */}
       {currentImageUrl && (
         <ImageViewing
           images={[{ uri: currentImageUrl || '' }]}
           imageIndex={0}
           visible={imageViewerVisible}
           onRequestClose={() => setImageViewerVisible(false)}
           swipeToCloseEnabled={true}
           doubleTapToZoomEnabled={true}
         />
       )}
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
  progressCard: {
    marginHorizontal: 24,
    marginBottom: 24,
    borderRadius: 20,
    padding: 24,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  progressCount: {
    fontSize: 20,
    fontWeight: '700',
  },
  progressBar: {
    height: 12,
    borderRadius: 6,
    marginBottom: 12,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 6,
  },
  progressText: {
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.8,
  },
  kycSection: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  kycList: {
    gap: 12,
  },
  kycCard: {
    borderRadius: 16,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  kycCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  kycCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  kycIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  kycIcon: {
    fontSize: 24,
  },
  kycTextContainer: {
    flex: 1,
  },
  kycTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  kycSubtitle: {
    fontSize: 14,
    lineHeight: 18,
    opacity: 0.8,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  statusIcon: {
    fontSize: 14,
    fontWeight: '600',
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  documentInfo: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderTopWidth: 1,
  },
  uploadedDate: {
    fontSize: 12,
    marginBottom: 4,
    opacity: 0.8,
  },
  documentName: {
    fontSize: 12,
    fontStyle: 'italic',
    opacity: 0.8,
  },
  documentInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    paddingBottom: 12,
    paddingHorizontal: 20,
    borderTopWidth: 1,
  },
  infoCard: {
    marginHorizontal: 24,
    marginBottom: 24,
    borderRadius: 20,
    padding: 24,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  infoIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  infoContent: {
    paddingLeft: 32,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
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

  viewDocumentButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewIcon: {
    fontSize: 16,
    marginRight: 4,
  },
  viewText: {
    fontSize: 14,
    fontWeight: '600',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  uploadCard: {
    marginHorizontal: 24,
    marginBottom: 24,
    borderRadius: 20,
    padding: 24,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  uploadHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  uploadIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  uploadTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  uploadSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
  },
  uploadButton: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  uploadButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  statusActionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  uploadActionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadActionText: {
    fontSize: 12,
    fontWeight: '600',
  },


});

export default KYCScreen; 