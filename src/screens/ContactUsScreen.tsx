import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Linking,
  Alert,
  Modal,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useTheme} from '../utils/ThemeContext';
import {getThemeColors} from '../utils/themeStyles';
import CommonHeader from '../components/CommonHeader';
import {useTranslation} from 'react-i18next';
import {getClientConfig} from '../config/client-config';

const ContactUsScreen = ({navigation}: any) => {
  const {isDark} = useTheme();
  const colors = getThemeColors(isDark);
  const {t} = useTranslation();
  const [showEscalationModal, setShowEscalationModal] = useState(false);

  // Get client configuration
  const clientConfig = getClientConfig();
  const contactInfo = clientConfig.contact;

  const handlePhoneCall = (number: string) => {
    Linking.canOpenURL(`tel:${number}`).then(supported => {
      if (supported) {
        Linking.openURL(`tel:${number}`);
      } else {
        Alert.alert(t('contactUs.error'), t('contactUs.phoneNotSupported'));
      }
    });
  };

  const handleAddress = (address: string) => {
    const encodedAddress = encodeURIComponent(address);
    Linking.canOpenURL(`https://maps.google.com/?q=${encodedAddress}`).then(supported => {
      if (supported) {
        Linking.openURL(`https://maps.google.com/?q=${encodedAddress}`);
      } else {
        Alert.alert(t('contactUs.error'), t('contactUs.mapsNotSupported'));
      }
    });
  };

  const handleWhatsApp = () => {
    if (!contactInfo.whatsappNumber) {
      Alert.alert('Error', 'WhatsApp number not available');
      return;
    }
    
    const message = encodeURIComponent(t('contactUs.whatsappMessage'));
    // Format phone number for WhatsApp (remove + and spaces)
    const formattedPhone = contactInfo.whatsappNumber.replace(/[\s\+]/g, '');
    const url = `whatsapp://send?phone=${formattedPhone}&text=${message}`;
    
    Linking.canOpenURL(url).then(supported => {
      if (supported) {
        Linking.openURL(url);
      } else {
        // Fallback to web WhatsApp if app is not installed
        const webUrl = `https://wa.me/${formattedPhone}?text=${message}`;
        Linking.openURL(webUrl);
      }
    }).catch(() => {
      // Fallback to web WhatsApp
      const webUrl = `https://wa.me/${formattedPhone}?text=${message}`;
      Linking.openURL(webUrl);
    });
  };

  const handleEscalationMatrix = () => {
    setShowEscalationModal(true);
  };

  const ContactItem = ({icon, title, value, onPress, subtitle}: any) => (
    <TouchableOpacity
      style={[
        styles.contactItem,
        {backgroundColor: colors.card, shadowColor: colors.shadow},
        onPress && styles.clickableItem
      ]}
      onPress={onPress}
      disabled={!onPress}>
      <View style={styles.contactItemLeft}>
        <Text style={styles.contactIcon}>{icon}</Text>
        <View style={styles.contactTextContainer}>
          <Text style={[styles.contactTitle, {color: colors.text}]}>{title}</Text>
          <Text style={[styles.contactValue, {color: colors.textSecondary}]}>{value}</Text>
          {subtitle && (
            <Text style={[styles.contactSubtitle, {color: colors.textSecondary}]}>{subtitle}</Text>
          )}
        </View>
      </View>
      {onPress && (
        <Text style={[styles.arrowIcon, {color: colors.primary}]}>›</Text>
      )}
    </TouchableOpacity>
  );

  const OfficeCard = ({office, isHeadOffice = false}: any) => (
    <View style={[styles.officeCard, {backgroundColor: colors.card, shadowColor: colors.shadow}]}>
      <View style={styles.officeHeader}>
        <Text style={styles.officeIcon}>{isHeadOffice ? '🏢' : '🏛️'}</Text>
        <View style={styles.officeInfo}>
          <Text style={[styles.officeTitle, {color: colors.text}]}>
            {office.title}
          </Text>
        </View>
      </View>

      <ContactItem
        icon="📍"
        title={t('contactUs.address')}
        value={office.address}
        onPress={() => handleAddress(office.address)}
      />

      {isHeadOffice && office.customerSupport && (
        <ContactItem
          icon="📞"
          title={t('contactUs.customerSupport')}
          value={office.customerSupport}
          subtitle={office.customerSupportHours}
          onPress={() => handlePhoneCall(office.customerSupport)}
        />
      )}

      {isHeadOffice && office.corporateLandline && (
        <ContactItem
          icon="🏢"
          title={t('contactUs.corporateLandline')}
          value={office.corporateLandline}
          subtitle={office.corporateHours}
          onPress={() => handlePhoneCall(office.corporateLandline)}
        />
      )}

      {!isHeadOffice && office.corporateLandline && (
        <ContactItem
          icon="🏢"
          title={t('contactUs.corporateLandline')}
          value={office.corporateLandline}
          subtitle={office.corporateHours}
          onPress={() => handlePhoneCall(office.corporateLandline)}
        />
      )}
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, {backgroundColor: colors.background}]}>
      {/* Header */}
      <CommonHeader navigation={navigation} />

      {/* Page Heading */}
      <View style={styles.headingContainer}>
        <Text style={[styles.pageHeading, {color: colors.text}]}>
          {t('contactUs.title')}
        </Text>
        <Text style={[styles.pageSubheading, {color: colors.textSecondary}]}>
          {t('contactUs.subtitle')}
        </Text>
      </View>

      {/* Content */}
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {(contactInfo.tollFree || contactInfo.landline) && (
            <View style={[styles.contactNumbersCard, {backgroundColor: colors.card, shadowColor: colors.shadow}]}>
              <Text style={[styles.sectionTitle, {color: colors.text}]}> 
                Call Us
              </Text>
              {contactInfo.tollFree && (
                <TouchableOpacity
                  style={[styles.contactNumberItem, {backgroundColor: colors.primaryLight}]}
                  onPress={() => handlePhoneCall(contactInfo.tollFree!)}>
                  <Text style={styles.contactNumberIcon}>📞</Text>
                  <View style={styles.contactNumberInfo}>
                    <Text style={[styles.contactNumberTitle, {color: colors.text}]}>Toll-Free</Text>
                    <Text style={[styles.contactNumberValue, {color: colors.primary}]}> {contactInfo.tollFree} </Text>
                  </View>
                  <Text style={[styles.contactNumberArrow, {color: colors.primary}]}>›</Text>
                </TouchableOpacity>
              )}

              {contactInfo.landline && (
                <TouchableOpacity
                  style={[styles.contactNumberItem, {backgroundColor: colors.primaryLight}]}
                  onPress={() => handlePhoneCall(contactInfo.landline!)}>
                  <Text style={styles.contactNumberIcon}>📞</Text>
                  <View style={styles.contactNumberInfo}>
                    <Text style={[styles.contactNumberTitle, {color: colors.text}]}>Landline</Text>
                    <Text style={[styles.contactNumberValue, {color: colors.primary}]}> {contactInfo.landline} </Text>
                  </View>
                  <Text style={[styles.contactNumberArrow, {color: colors.primary}]}>›</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {contactInfo.emails && (
            <View style={[styles.emailCard, {backgroundColor: colors.card, shadowColor: colors.shadow}]}>
              <Text style={[styles.sectionTitle, {color: colors.text}]}>Email Us</Text>

              {contactInfo.emails.inquiries && (
                <View style={styles.emailItem}>
                  <Text style={styles.emailIcon}>📧</Text>
                  <View style={styles.emailInfo}>
                    <Text style={[styles.emailTitle, {color: colors.text}]}>Inquiries/Support</Text>
                    <Text style={[styles.emailValue, {color: colors.primary}]}> {contactInfo.emails.inquiries} </Text>
                  </View>
                </View>
              )}

              {contactInfo.emails.sales && (
                <View style={styles.emailItem}>
                  <Text style={styles.emailIcon}>📧</Text>
                  <View style={styles.emailInfo}>
                    <Text style={[styles.emailTitle, {color: colors.text}]}>New Connection</Text>
                    <Text style={[styles.emailValue, {color: colors.primary}]}> {contactInfo.emails.sales} </Text>
                  </View>
                </View>
              )}
            </View>
          )}
          {/* Company Info Card */}
          <View style={[styles.companyCard, {backgroundColor: colors.card, shadowColor: colors.shadow}]}>
            <View style={styles.companyHeader}>
              <Text style={styles.companyIcon}>🏢</Text>
              <View style={styles.companyInfo}>
                <Text style={[styles.companyName, {color: colors.text}]}>
                  {clientConfig.clientName}
                </Text>
                <Text style={[styles.companyTagline, {color: colors.textSecondary}]}>
                  {t('contactUs.tagline')}
                </Text>
                {contactInfo.gstin && (
                  <Text style={[styles.gstinText, {color: colors.textSecondary}]}>
                    GSTIN: {contactInfo.gstin}
                  </Text>
                )}
              </View>
            </View>
          </View>

          {/* Internet Support Inquiries */}
          {contactInfo.headOffice.customerSupport && (
            <View style={[styles.escalationCard, {backgroundColor: colors.card, shadowColor: colors.shadow}]}>
              <Text style={[styles.sectionTitle, {color: colors.text}]}>
                {t('contactUs.internetSupport')}
              </Text>
              
              <View style={styles.escalationItem}>
                <Text style={[styles.escalationTitle, {color: colors.text}]}>
                  {t('contactUs.customerSupport')}
                </Text>
                <Text style={[styles.escalationNumber, {color: colors.primary}]}>
                  {contactInfo.headOffice.customerSupport}
                </Text>
                {contactInfo.headOffice.customerSupportHours && (
                  <Text style={[styles.escalationHours, {color: colors.textSecondary}]}>
                    {contactInfo.headOffice.customerSupportHours}
                  </Text>
                )}
              </View>
            </View>
          )}

          {/* Head Office */}
          <View style={styles.officeSection}>
            {/* <Text style={[styles.sectionTitle, {color: colors.text}]}>
              {t('contactUs.headOffice')}
            </Text> */}
            <OfficeCard office={contactInfo.headOffice} isHeadOffice={true} />
          </View>

          {/* Branch Offices */}
          {contactInfo.branchOffices && contactInfo.branchOffices.length > 0 && (
            contactInfo.branchOffices.map((branchOffice, index) => (
              <View key={index} style={styles.officeSection}>
                <Text style={[styles.sectionTitle, {color: colors.text}]}>
                  {branchOffice.title}
                </Text>
                <OfficeCard office={branchOffice} isHeadOffice={false} />
              </View>
            ))
          )}

          

          {/* Enterprise Escalation Matrix */}
          {contactInfo.enterpriseEscalation && (
            <TouchableOpacity
              style={[styles.escalationCard, {backgroundColor: colors.card, shadowColor: colors.shadow}]}
              onPress={handleEscalationMatrix}>
              <Text style={[styles.sectionTitle, {color: colors.text}]}>
                {contactInfo.enterpriseEscalation.title}
              </Text>
              
              <View style={styles.escalationItem}>
                <Text style={[styles.escalationTitle, {color: colors.text}]}>
                  {t('contactUs.enterpriseSupport')}
                </Text>
                <Text style={[styles.escalationSubtitle, {color: colors.textSecondary}]}>
                  {t('contactUs.enterpriseEscalationSubtitle')}
                </Text>
              </View>
              <Text style={[styles.escalationArrow, {color: colors.primary}]}>›</Text>
            </TouchableOpacity>
          )}



          {/* WhatsApp Contact */}
          {contactInfo.whatsappNumber && (
            <View style={[styles.whatsappCard, {backgroundColor: colors.card, shadowColor: colors.shadow}]}>
              <Text style={[styles.sectionTitle, {color: colors.text}]}>
                {t('contactUs.whatsappSupport')}
              </Text>
              
              <TouchableOpacity
                style={[styles.whatsappItem, {backgroundColor: colors.primaryLight}]}
                onPress={handleWhatsApp}>
                <Text style={styles.whatsappIcon}>💬</Text>
                <View style={styles.whatsappInfo}>
                  <Text style={[styles.whatsappTitle, {color: colors.text}]}>
                    {t('contactUs.whatsapp')}
                  </Text>
                  <Text style={[styles.whatsappNumber, {color: colors.primary}]}>
                    {contactInfo.whatsappNumber}
                  </Text>
                  <Text style={[styles.whatsappSubtitle, {color: colors.textSecondary}]}>
                    {t('contactUs.whatsappSubtitle')}
                  </Text>
                </View>
                <Text style={[styles.whatsappArrow, {color: colors.primary}]}>›</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Quick Actions */}
          <View style={styles.quickActionsSection}>
            <Text style={[styles.sectionTitle, {color: colors.text}]}>
              {t('contactUs.quickActions')}
            </Text>

            <View style={styles.quickActionsGrid}>
              {contactInfo.headOffice.customerSupport && (
                <TouchableOpacity
                  style={[styles.quickActionCard, {backgroundColor: colors.card, shadowColor: colors.shadow}]}
                  onPress={() => handlePhoneCall(contactInfo.headOffice.customerSupport!)}>
                  <Text style={styles.quickActionIcon}>📞</Text>
                  <Text style={[styles.quickActionTitle, {color: colors.text}]}>
                    {t('contactUs.callSupport')}
                  </Text>
                  <Text style={[styles.quickActionSubtitle, {color: colors.textSecondary}]}>
                    {t('contactUs.callSupportSubtitle')}
                  </Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[styles.quickActionCard, {backgroundColor: colors.card, shadowColor: colors.shadow}]}
                onPress={() => handleAddress(contactInfo.headOffice.address)}>
                <Text style={styles.quickActionIcon}>🗺️</Text>
                <Text style={[styles.quickActionTitle, {color: colors.text}]}>
                  {t('contactUs.directions')}
                </Text>
                <Text style={[styles.quickActionSubtitle, {color: colors.textSecondary}]}>
                  {t('contactUs.directionsSubtitle')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Enterprise Escalation Matrix Modal */}
      <Modal
        visible={showEscalationModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowEscalationModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, {backgroundColor: colors.card}]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, {color: colors.text}]}>
                {contactInfo.enterpriseEscalation?.title || 'Enterprise Escalation'}
              </Text>
              <TouchableOpacity
                onPress={() => setShowEscalationModal(false)}
                style={styles.closeButton}>
                <Text style={[styles.closeButtonText, {color: colors.text}]}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {/* L1 - Call Centre */}
              {contactInfo.enterpriseEscalation?.l1 && (
                <View style={styles.escalationLevel}>
                  <Text style={[styles.levelTitle, {color: colors.primary}]}>
                    {contactInfo.enterpriseEscalation.l1.level}
                  </Text>
                  <View style={styles.contactRow}>
                    <Text style={styles.contactLabel}>📧 Email:</Text>
                    <Text style={[styles.modalContactValue, {color: colors.text}]}>
                      {contactInfo.enterpriseEscalation.l1.email}
                    </Text>
                  </View>
                  {contactInfo.enterpriseEscalation.l1.phone && (
                    <View style={styles.contactRow}>
                      <Text style={styles.contactLabel}>📞 Phone:</Text>
                      <Text style={[styles.modalContactValue, {color: colors.text}]}>
                        {contactInfo.enterpriseEscalation.l1.phone}
                      </Text>
                    </View>
                  )}
                </View>
              )}

              {/* L2 - Shift Lead */}
              {contactInfo.enterpriseEscalation?.l2 && (
                <View style={styles.escalationLevel}>
                  <Text style={[styles.levelTitle, {color: colors.primary}]}>
                    {contactInfo.enterpriseEscalation.l2.level}
                  </Text>
                  <View style={styles.contactRow}>
                    <Text style={styles.contactLabel}>📧 Email:</Text>
                    <Text style={[styles.modalContactValue, {color: colors.text}]}>
                      {contactInfo.enterpriseEscalation.l2.email}
                    </Text>
                  </View>
                </View>
              )}

              {/* L3 - Management */}
              {contactInfo.enterpriseEscalation?.l3 && (
                <View style={styles.escalationLevel}>
                  <Text style={[styles.levelTitle, {color: colors.primary}]}>
                    {contactInfo.enterpriseEscalation.l3.level}
                  </Text>
                  <View style={styles.contactRow}>
                    <Text style={styles.contactLabel}>📧 Emails:</Text>
                  </View>
                  {contactInfo.enterpriseEscalation.l3.emails.map((email, index) => (
                    <View key={index} style={styles.emailRow}>
                      <Text style={[styles.modalContactValue, {color: colors.text}]}>
                        {email}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </ScrollView>
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
  companyCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  companyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  companyIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  companyInfo: {
    flex: 1,
  },
  companyName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  companyTagline: {
    fontSize: 14,
    marginBottom: 4,
  },
  gstinText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  officeSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  officeCard: {
    borderRadius: 16,
    padding: 20,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  officeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  officeIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  officeInfo: {
    flex: 1,
  },
  officeTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  clickableItem: {
    shadowOpacity: 0.1,
    elevation: 3,
  },
  contactItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  contactIcon: {
    fontSize: 18,
    marginRight: 12,
  },
  contactTextContainer: {
    flex: 1,
  },
  contactTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  contactValue: {
    fontSize: 14,
    lineHeight: 18,
  },
  contactSubtitle: {
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 2,
  },
  arrowIcon: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  escalationCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  escalationItem: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  escalationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  escalationSubtitle: {
    fontSize: 14,
    marginBottom: 8,
  },
  escalationNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  escalationHours: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  escalationArrow: {
    fontSize: 18,
    fontWeight: 'bold',
    position: 'absolute',
    right: 20,
    top: 20,
  },
  whatsappCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  whatsappItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
  },
  whatsappIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  whatsappInfo: {
    flex: 1,
  },
  whatsappTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  whatsappNumber: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  whatsappSubtitle: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  whatsappArrow: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  quickActionsSection: {
    marginBottom: 24,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickActionCard: {
    width: '48%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
  },
  quickActionIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  quickActionTitle: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
  },
  quickActionSubtitle: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    borderRadius: 16,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalBody: {
    padding: 20,
  },
  escalationLevel: {
    marginBottom: 24,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#f8f9fa',
  },
  levelTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  contactLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginRight: 8,
    minWidth: 60,
  },
  modalContactValue: {
    fontSize: 14,
    flex: 1,
  },
  emailRow: {
    marginLeft: 68,
    marginBottom: 4,
  },
  // Contact Numbers Styles
  contactNumbersCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  contactNumberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
  },
  contactNumberIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  contactNumberInfo: {
    flex: 1,
  },
  contactNumberTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  contactNumberValue: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  contactNumberArrow: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  // Email Styles
  emailCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  emailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#f8f9fa',
  },
  emailIcon: {
    fontSize: 18,
    marginRight: 12,
  },
  emailInfo: {
    flex: 1,
  },
  emailTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  emailValue: {
    fontSize: 14,
    lineHeight: 18,
  },
});

export default ContactUsScreen; 