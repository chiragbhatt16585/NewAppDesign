import React, {useMemo, useState} from 'react';
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
import Feather from 'react-native-vector-icons/Feather';

const ContactUsScreen = ({navigation}: any) => {
  const {isDark} = useTheme();
  const colors = getThemeColors(isDark);
  const {t} = useTranslation();
  const [showEscalationModal, setShowEscalationModal] = useState(false);

  const tr = (key: string, fallback: string) => t(key, {defaultValue: fallback});

  // Get client configuration
  const clientConfig = getClientConfig();
  const contactInfo = clientConfig.contact;
  const hasEscalationData = Boolean(
    contactInfo.enterpriseEscalation &&
    (
      contactInfo.enterpriseEscalation.l1 ||
      contactInfo.enterpriseEscalation.l2 ||
      contactInfo.enterpriseEscalation.l3
    )
  );

  const handlePhoneCall = (number: string) => {
    Linking.canOpenURL(`tel:${number}`).then(supported => {
      if (supported) {
        Linking.openURL(`tel:${number}`);
      } else {
        Alert.alert(t('contactUs.error'), t('contactUs.phoneNotSupported'));
      }
    });
  };

  const openMapsForAddress = (address: string) => {
    const encodedAddress = encodeURIComponent(address);
    const url = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
    Linking.canOpenURL(url).then(supported => {
      if (supported) {
        Linking.openURL(url);
      } else {
        Alert.alert(t('contactUs.error'), t('contactUs.mapsNotSupported'));
      }
    });
  };

  const openEmail = (email: string) => {
    Linking.openURL(`mailto:${email}`).catch(() => {
      Alert.alert(t('contactUs.error'), t('contactUs.emailNotSupported'));
    });
  };

  const openWebsite = (url: string) => {
    const normalized = url.startsWith('http') ? url : `https://${url}`;
    Linking.canOpenURL(normalized).then(supported => {
      if (supported) {
        Linking.openURL(normalized);
      } else {
        Alert.alert(t('contactUs.error'), t('contactUs.websiteNotSupported'));
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
    if (hasEscalationData) {
      setShowEscalationModal(true);
    }
  };

  const defaultWebsite = useMemo(() => {
    const sanitizedName = clientConfig.clientName.replace(/\s+/g, '').toLowerCase();
    const configuredWebsite = (contactInfo as any)?.website;
    return configuredWebsite || `www.${sanitizedName}.com`;
  }, [clientConfig.clientName, contactInfo]);

  const bestEmail =
    contactInfo.emails?.support ||
    contactInfo.emails?.inquiries ||
    contactInfo.emails?.sales;

  const primaryPhone =
    contactInfo.headOffice.customerSupport ||
    contactInfo.tollFree ||
    contactInfo.landline;

  const contactRows = [
    {
      icon: '📞',
      label: tr('contactUs.callSupport', 'Call Support'),
      value: primaryPhone,
      onPress: primaryPhone ? () => handlePhoneCall(primaryPhone) : undefined,
    },
    {
      icon: '✉️',
      label: tr('contactUs.email', 'Email'),
      value: bestEmail,
      onPress: bestEmail ? () => openEmail(bestEmail) : undefined,
    },
    {
      icon: '🌐',
      label: tr('contactUs.website', 'Website'),
      value: defaultWebsite,
      onPress: () => openWebsite(defaultWebsite),
    },
    {
      icon: '🗓️',
      label: tr('contactUs.supportHours', 'Support Hours'),
      value: contactInfo.headOffice.customerSupportHours || 'Monday - Sunday | 24×7',
    },
    ...(hasEscalationData ? [{
      icon: '🛠️',
      label: tr('contactUs.escalationMatrix', 'Escalation Matrix'),
      value: tr('contactUs.viewDetails', 'View details'),
      onPress: handleEscalationMatrix,
    }] : []),
  ].filter(row => row.value);

  const locations = [
    { ...contactInfo.headOffice, isPrimary: true },
    ...(contactInfo.branchOffices || []).map(office => ({ ...office, isPrimary: false })),
  ];

  const getLocationCityLabel = (location: any) => {
    const titleParts = location.title?.split('-');
    const lastPart = titleParts?.[titleParts.length - 1]?.trim();
    if (lastPart && lastPart.length >= 3) {
      return lastPart;
    }

    const cityMatch = location.address?.match(/([A-Za-z\s]+),(?:\s*[A-Za-z\s]+)?$/);
    if (cityMatch?.[1]) {
      return cityMatch[1].trim();
    }

    return tr('contactUs.location', 'Location');
  };

  const LocationCard = ({location}: any) => {
    const cityLabel = getLocationCityLabel(location);
    return (
    <View style={[styles.locationCard, {backgroundColor: colors.card, shadowColor: colors.shadow}]}>
      <View style={styles.locationContentRow}>
        <View style={styles.locationInfoBlock}>
          <Text style={[styles.locationTitle, {color: colors.text}]}>
            {location.title}
          </Text>
          <Text style={[styles.locationAddress, {color: colors.textSecondary}]}>
            {location.address}
          </Text>

          {(location.corporateLandline || location.customerSupport) && (
          <TouchableOpacity
            style={[styles.locationContactRow, {borderColor: colors.border || '#eee'}]}
            onPress={() => handlePhoneCall(location.corporateLandline || location.customerSupport)}>
              <Text style={styles.locationContactIcon}>📞</Text>
              <View style={{flex: 1}}>
                <Text style={[styles.locationContactLabel, {color: colors.text}]}>
                  {tr('contactUs.callOffice', 'Call office')}
                </Text>
                <Text style={[styles.locationContactValue, {color: colors.primary}]}>
                  {location.corporateLandline || location.customerSupport}
                </Text>
              </View>
              <Text style={[styles.locationContactArrow, {color: colors.primary}]}>›</Text>
            </TouchableOpacity>
          )}

        </View>

        <TouchableOpacity
          activeOpacity={0.8}
          style={[styles.locationMapThumb, {backgroundColor: colors.primaryLight || '#f0f5ff'}]}
          onPress={() => openMapsForAddress(location.address)}>
          <View style={styles.mapPinBubble}>
            <Feather name="map-pin" size={24} color="#FF3B30" />
          </View>
          <Text style={styles.mapThumbText}>{tr('contactUs.viewMap', 'View map')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
  };

  return (
    <SafeAreaView style={[styles.container, {backgroundColor: colors.background}]}>
      {/* Header */}
      <CommonHeader navigation={navigation} />

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.headingContainer}>
          <Text style={[styles.pageHeading, {color: colors.text}]}>
            {tr('contactUs.title', 'Support')}
          </Text>
          <Text style={[styles.pageSubheading, {color: colors.textSecondary}]}>
            {tr('contactUs.subtitle', 'Get in touch with us')}
          </Text>
        </View>

        <View style={styles.content}>
          <View style={[styles.heroCard, {backgroundColor: colors.card, shadowColor: colors.shadow}]}>
            {contactRows.map((row, index) => (
              <TouchableOpacity
                key={`${row.label}-${index}`}
                style={[
                  styles.heroRow,
                  index !== contactRows.length - 1 && styles.heroRowDivider,
                ]}
                disabled={!row.onPress}
                onPress={row.onPress}>
                <View style={styles.heroRowLeft}>
                  <View style={styles.heroIconBubble}>
                    <Text style={styles.heroIcon}>{row.icon}</Text>
                  </View>
                  <View style={{flex: 1}}>
                    <Text style={[styles.heroLabel, {color: colors.text}]}>{row.label}</Text>
                    <Text style={[styles.heroValue, {color: colors.textSecondary}]}>
                      {row.value}
                    </Text>
                  </View>
                </View>
                {row.onPress && <Text style={[styles.heroArrow, {color: colors.primary}]}>›</Text>}
              </TouchableOpacity>
            ))}
          </View>

          {contactInfo.whatsappNumber && (
            <TouchableOpacity
              style={[styles.whatsappPill, {backgroundColor: colors.primary}]}
              onPress={handleWhatsApp}>
              <Text style={styles.whatsappPillIcon}>💬</Text>
              <Text style={styles.whatsappPillText}>
                {t('contactUs.whatsapp')} {contactInfo.whatsappNumber}
              </Text>
            </TouchableOpacity>
          )}

          <Text style={[styles.sectionHeading, {color: colors.text}]}>
            {tr('contactUs.locationsHeading', 'Our locations')}
          </Text>

          {locations.map((location, index) => (
            <LocationCard key={`${location.title}-${index}`} location={location} />
          ))}
        </View>
      </ScrollView>

      {/* Enterprise Escalation Matrix Modal */}
      {hasEscalationData && (
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
      )}
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
  heroCard: {
    borderRadius: 20,
    paddingVertical: 4,
    marginBottom: 24,
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  heroRowDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ececec',
  },
  heroRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  heroIconBubble: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E5F1FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  heroIcon: {
    fontSize: 18,
  },
  heroLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  heroValue: {
    fontSize: 14,
  },
  heroArrow: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 12,
  },
  whatsappPill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  whatsappPillIcon: {
    fontSize: 18,
    marginRight: 10,
    color: '#fff',
  },
  whatsappPillText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  sectionHeading: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  locationCard: {
    borderRadius: 18,
    padding: 20,
    marginBottom: 20,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.08,
    shadowRadius: 5,
    elevation: 3,
  },
  locationContentRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  locationInfoBlock: {
    flex: 1,
    marginRight: 16,
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  locationTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  locationTag: {
    fontSize: 13,
    marginTop: 2,
  },
  locationAddress: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 14,
  },
  locationContactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  locationContactIcon: {
    fontSize: 18,
    marginRight: 12,
  },
  locationContactLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 2,
  },
  locationContactValue: {
    fontSize: 15,
    fontWeight: '700',
  },
  locationContactArrow: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  mapContainer: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  mapPlaceholder: {
    height: 150,
    borderRadius: 12,
    backgroundColor: '#e6f0ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  mapPlaceholderText: {
    color: '#5b6c8f',
    fontSize: 13,
    fontWeight: '600',
  },
  locationMapThumb: {
    width: 110,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 10,
  },
  mapPinBubble: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 6,
  },
  mapThumbText: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    color: '#324156',
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