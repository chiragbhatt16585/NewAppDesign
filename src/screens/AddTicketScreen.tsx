import React, {useState, useEffect, useMemo} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  TextInput,
  Modal,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useTheme} from '../utils/ThemeContext';
import {getThemeColors} from '../utils/themeStyles';
import {useTranslation} from 'react-i18next';
import {apiService} from '../services/api';
import sessionManager from '../services/sessionManager';
import useMenuSettings from '../hooks/useMenuSettings';

interface AddTicketScreenProps {
  visible: boolean;
  onClose: () => void;
  onTicketCreated?: () => void;
}

const AddTicketScreen = ({visible, onClose, onTicketCreated}: AddTicketScreenProps) => {
  const {isDark} = useTheme();
  const colors = getThemeColors(isDark);
  const {t} = useTranslation();
  const { menu } = useMenuSettings();
  
  const [problemTitle, setProblemTitle] = useState('');
  const [problemDescription, setProblemDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [problemOptions, setProblemOptions] = useState<any[]>([]);
  const [showProblemDropdown, setShowProblemDropdown] = useState(false);
  const [loadingProblems, setLoadingProblems] = useState(false);
  const [selectedProblem, setSelectedProblem] = useState<any>(null);
  const [faqItems, setFaqItems] = useState<any[]>([]);
  const [showFaqModal, setShowFaqModal] = useState(false);
  const [loadingFaqData, setLoadingFaqData] = useState(false);

  // Determine if description (remarks) should be shown based on menu settings for Tickets
  const allowDescription: boolean = useMemo(() => {
    try {
      if (!Array.isArray(menu)) return false;
      const tickets = menu.find((m: any) => (
        String(m?.menu_label).trim().toLowerCase() === 'tickets'
      )) || menu.find((m: any) => {
        try {
          const jsonVal = m?.display_option_json;
          const parsed = typeof jsonVal === 'string' ? JSON.parse(String(jsonVal)) : (jsonVal || {});
          return typeof parsed?.allow_remarks_on_new_ticket !== 'undefined' || parsed?.ticket_settings;
        } catch { return false; }
      });
      if (!tickets) return false;
      const jsonVal = tickets.display_option_json;
      let parsed: any = {};
      if (typeof jsonVal === 'string') {
        const trimmed = jsonVal.trim();
        if (trimmed && (trimmed.startsWith('{') || trimmed.startsWith('['))) {
          try {
            parsed = JSON.parse(trimmed);
          } catch {
            // Attempt to repair extra trailing braces
            const openCount = (trimmed.match(/\{/g) || []).length;
            let s = trimmed;
            let closeCount = (s.match(/\}/g) || []).length;
            while (closeCount > openCount && s.endsWith('}')) {
              s = s.slice(0, -1);
              closeCount--;
            }
            try { parsed = JSON.parse(s); } catch { parsed = {}; }
          }
        }
      } else if (jsonVal && typeof jsonVal === 'object') {
        parsed = jsonVal;
      }
      const allow = parsed?.allow_remarks_on_new_ticket;
      const legacy = parsed?.ticket_settings?.add_remarks_on_create_ticket;
      const result = !!(typeof allow !== 'undefined' ? allow : legacy);
      // eslint-disable-next-line no-console
      console.log('[AddTicket] Parsed allow_remarks_on_new_ticket:', allow, 'legacy:', legacy, 'final:', result);
      return result;
    } catch {
      return false;
    }
  }, [menu]);

  useEffect(() => {
    try {
      if (!Array.isArray(menu)) return;
      // eslint-disable-next-line no-console
      console.log('[AddTicket] Menu loaded, entries:', menu.length);
      const tickets = menu.find((m: any) => (
        String(m?.menu_label).trim().toLowerCase() === 'tickets'
      ));
      if (!tickets) {
        // eslint-disable-next-line no-console
        console.log('[AddTicket] Tickets menu entry not found');
        return;
      }
      const jsonVal = tickets.display_option_json;
      // eslint-disable-next-line no-console
      console.log('[AddTicket] Tickets display_option_json preview:', typeof jsonVal === 'string' ? String(jsonVal).slice(0, 200) + '...' : jsonVal);
      try {
        let parsed: any = {};
        if (typeof jsonVal === 'string') {
          const trimmed = jsonVal.trim();
          if (trimmed && (trimmed.startsWith('{') || trimmed.startsWith('['))) {
            parsed = JSON.parse(trimmed);
          }
        } else if (jsonVal && typeof jsonVal === 'object') {
          parsed = jsonVal;
        }
        // eslint-disable-next-line no-console
        console.log('[AddTicket] Parsed tickets settings:', parsed);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn('[AddTicket] Failed to parse tickets display_option_json:', e);
      }
    } catch {}
  }, [menu]);

  // Read optional count: how many tickets to show (for future use)
  const showTicketCount: number = useMemo(() => {
    try {
      if (!Array.isArray(menu)) return 0;
      const tickets = menu.find((m: any) => (
        String(m?.menu_label).trim().toLowerCase() === 'tickets'
      )) || menu.find((m: any) => {
        try {
          const jsonVal = m?.display_option_json;
          const parsed = typeof jsonVal === 'string' ? JSON.parse(String(jsonVal)) : (jsonVal || {});
          return typeof parsed?.show_ticket_count !== 'undefined';
        } catch { return false; }
      });
      if (!tickets) return 0;
      const jsonVal = tickets.display_option_json;
      let parsed: any = {};
      if (typeof jsonVal === 'string') {
        const trimmed = jsonVal.trim();
        if (trimmed && (trimmed.startsWith('{') || trimmed.startsWith('['))) {
          try {
            parsed = JSON.parse(trimmed);
          } catch {
            const openCount = (trimmed.match(/\{/g) || []).length;
            let s = trimmed;
            let closeCount = (s.match(/\}/g) || []).length;
            while (closeCount > openCount && s.endsWith('}')) {
              s = s.slice(0, -1);
              closeCount--;
            }
            try { parsed = JSON.parse(s); } catch { parsed = {}; }
          }
        }
      } else if (jsonVal && typeof jsonVal === 'object') {
        parsed = jsonVal;
      }
      const raw = parsed?.show_ticket_count;
      const n = typeof raw === 'string' ? parseInt(raw, 10) : Number(raw);
      return Number.isFinite(n) ? n : 0;
    } catch {
      return 0;
    }
  }, [menu]);

  useEffect(() => {
    if (visible) {
      loadProblemOptions();
      if (showTicketCount > 0) {
        // eslint-disable-next-line no-console
        console.log('[AddTicket] show_ticket_count from settings:', showTicketCount);
      }
    }
  }, [visible, showTicketCount]);

  const loadProblemOptions = async () => {
    try {
      setLoadingProblems(true);
      // Get current client configuration
      const {getClientConfig} = require('../config/client-config');
      const clientConfig = getClientConfig();
      const realm = clientConfig.clientId;
      const options = await apiService.getComplaintProblems(realm);
      
      // Transform the data to match the expected format
      const transformedOptions = options.map((option: any, index: number) => ({
        label: option.name || option.title || option,
        value: option.id || option.value || index.toString(),
        ...option
      }));
      
      setProblemOptions(transformedOptions || []);
    } catch (error: any) {
      console.error('Error loading problem options:', error);
      Alert.alert('Error', error.message || 'Failed to load problem options');
    } finally {
      setLoadingProblems(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedProblem) {
      Alert.alert('Error', 'Please select a problem type');
      return;
    }

    if (allowDescription && !problemDescription.trim()) {
      Alert.alert('Error', 'Please enter a problem description');
      return;
    }

    try {
      setIsSubmitting(true);
      
      const username = await sessionManager.getUsername();
      if (!username) {
        throw new Error('Username not found');
      }

      // Format username to lowercase and trim
      const formattedUsername = username.toLowerCase().trim();
      // Get current client configuration
      const {getClientConfig} = require('../config/client-config');
      const clientConfig = getClientConfig();
      const realm = clientConfig.clientId;

      // Prepare remarks based on settings
      const remarksToSend = allowDescription
        ? problemDescription.trim()
        : `New ticket from app${selectedProblem?.label ? ` - ${selectedProblem.label}` : ''}`;

      // Call API to create ticket
      const response = await apiService.submitComplaint(
        formattedUsername,
        selectedProblem,
        remarksToSend,
        realm
      );

      if (response && response.success) {
        Alert.alert(
          'Success', 
          response.message || 'Ticket created successfully!',
          [
            {
              text: 'OK',
              onPress: () => {
                // Reset form
                setSelectedProblem(null);
                setFaqItems([]);
                setProblemDescription('');
                onClose();
                // Notify parent component to refresh tickets
                if (onTicketCreated) {
                  onTicketCreated();
                }
              }
            }
          ]
        );
      } else {
        throw new Error(response?.message || 'Failed to create ticket');
      }
    } catch (error: any) {
      console.error('Error creating ticket:', error);
      Alert.alert('Error', error.message || 'Failed to create ticket');
    } finally {
      setIsSubmitting(false);
    }
  };

  const loadFaqForProblem = async (problemValue: string) => {
    if (!problemValue) {
      setFaqItems([]);
      return;
    }

    setLoadingFaqData(true);
    try {
      const faqData = await apiService.getFaqList(problemValue);
      if (Array.isArray(faqData) && faqData.length > 0) {
        setFaqItems(faqData);
        setShowFaqModal(true);
      } else {
        setFaqItems([]);
      }
    } catch (error: any) {
      console.error('[AddTicket] FAQ load error:', error);
      Alert.alert('Error', error?.message || 'Failed to load FAQ details');
      setFaqItems([]);
    } finally {
      setLoadingFaqData(false);
    }
  };

  const handleProblemSelect = (option: any) => {
    setSelectedProblem(option);
    setShowProblemDropdown(false);
    loadFaqForProblem(option?.value);
  };

  const renderFaqModal = () => (
    <Modal
      visible={showFaqModal}
      transparent
      animationType="fade"
      onRequestClose={() => setShowFaqModal(false)}
    >
      <TouchableWithoutFeedback onPress={() => setShowFaqModal(false)}>
        <View style={styles.faqModalOverlay}>
          <TouchableWithoutFeedback>
            <View style={[styles.faqModalContent, {backgroundColor: colors.card}]}>
              <View style={styles.faqModalHeader}>
                <Text style={[styles.faqModalTitle, {color: colors.text}]}>Helpful FAQs</Text>
                <TouchableOpacity onPress={() => setShowFaqModal(false)}>
                  <Text style={[styles.faqModalClose, {color: colors.primary}]}>Close</Text>
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.faqList} showsVerticalScrollIndicator={false}>
                {faqItems.map((faq, idx) => (
                  <View key={`${faq.id || idx}`} style={[styles.faqItem, {borderBottomColor: colors.border}]}>
                    <Text style={[styles.faqQuestion, {color: colors.text}]}>
                      {faq.faq_question || faq.question || `FAQ ${idx + 1}`}
                    </Text>
                    <Text style={[styles.faqAnswer, {color: colors.textSecondary}]}>
                      {faq.faq_text || faq.answer || faq.description || ''}
                    </Text>
                  </View>
                ))}
              </ScrollView>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );

  const handleCancel = () => {
    if (selectedProblem || problemDescription.trim()) {
      Alert.alert(
        'Cancel',
        'Are you sure you want to cancel? Your changes will be lost.',
        [
          {text: 'Keep Editing', style: 'cancel'},
          {
            text: 'Cancel',
            style: 'destructive',
            onPress: () => {
              setSelectedProblem(null);
              setProblemDescription('');
              onClose();
            }
          }
        ]
      );
    } else {
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleCancel}
    >
      <KeyboardAvoidingView 
        style={[styles.modalOverlay, {backgroundColor: isDark ? 'rgba(0, 0, 0, 0.8)' : 'rgba(0, 0, 0, 0.6)'}]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={[
          styles.modalContainer,
          allowDescription ? styles.modalContainerTall : styles.modalContainerCompact
        ]}> 
          <View style={[
            styles.modalContent,
            {backgroundColor: colors.card, shadowColor: colors.shadow},
            allowDescription ? styles.modalContentTall : styles.modalContentCompact
          ]}> 
            {/* Header */}
            <View style={[styles.header, {borderBottomColor: colors.border}]}>
              <Text style={[styles.headerTitle, {color: colors.text}]}>📋 Create New Complaint</Text>
              <TouchableOpacity onPress={handleCancel} style={[styles.closeButton, {backgroundColor: colors.background}]}>
                <Text style={[styles.closeButtonText, {color: colors.textSecondary}]}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView 
              style={[
                styles.formContainer,
                allowDescription ? styles.formContainerTall : styles.formContainerCompact
              ]}
              showsVerticalScrollIndicator={false}
            >
              {/* Problem Title */}
              <View style={styles.inputContainer}>
                <Text style={[styles.inputLabel, {color: colors.text}]}>Problem Type</Text>
                <View style={[styles.pickerContainer, {backgroundColor: colors.background, borderColor: selectedProblem ? colors.primary : colors.border}]}>
                  <TouchableOpacity
                    style={[styles.pickerButton, {backgroundColor: selectedProblem ? colors.primary + '15' : 'transparent'}]}
                    onPress={() => setShowProblemDropdown(!showProblemDropdown)}
                    disabled={loadingProblems}
                  >
                    <Text style={[styles.pickerButtonText, {color: selectedProblem ? colors.primary : colors.textSecondary}]}>
                      {selectedProblem ? selectedProblem.label : 'Select a problem type...'}
                    </Text>
                    <Text style={[styles.pickerArrow, {color: selectedProblem ? colors.primary : colors.textSecondary}]}>
                      {showProblemDropdown ? '▲' : '▼'}
                    </Text>
                  </TouchableOpacity>
                  
                  {showProblemDropdown && (
                    <View style={[styles.pickerDropdown, {backgroundColor: colors.card, borderColor: colors.border}]}>
                      <ScrollView style={styles.pickerScroll} showsVerticalScrollIndicator={false}>
                        {problemOptions.map((option, index) => (
                          <TouchableOpacity
                            key={index}
                            style={[
                              styles.pickerItem, 
                              {borderBottomColor: colors.border},
                              selectedProblem?.value === option.value && {backgroundColor: colors.primary + '20'}
                            ]}
                            onPress={() => {
                              handleProblemSelect(option);
                            }}
                          >
                            <Text style={[
                              styles.pickerItemText, 
                              {color: selectedProblem?.value === option.value ? colors.primary : colors.text}
                            ]}>
                              {option.label}
                            </Text>
                            {selectedProblem?.value === option.value && (
                              <Text style={[styles.pickerCheckmark, {color: colors.primary}]}>✓</Text>
                            )}
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  )}
                </View>
              </View>

              {loadingFaqData && (
                <Text style={[styles.helperText, {color: colors.textSecondary}]}>
                  Loading FAQs...
                </Text>
              )}

              {faqItems.length > 0 && (
                <TouchableOpacity style={[styles.faqBadge, {backgroundColor: colors.primary + '15'}]} onPress={() => setShowFaqModal(true)}>
                  <Text style={[styles.faqBadgeText, {color: colors.primary}]}>
                    View {faqItems.length} FAQ{faqItems.length > 1 ? 's' : ''} related to this issue
                  </Text>
                </TouchableOpacity>
              )}

              {/* Problem Description */}
              {allowDescription && (
              <View style={styles.inputContainer}>
                <Text style={[styles.inputLabel, {color: colors.text}]}>Problem Description</Text>
                <TextInput
                  style={[styles.textArea, {backgroundColor: colors.background, borderColor: colors.border, color: colors.text}]}
                  value={problemDescription}
                  onChangeText={setProblemDescription}
                  placeholder="Describe your problem in detail..."
                  placeholderTextColor={colors.textSecondary}
                  multiline={true}
                  numberOfLines={6}
                  textAlignVertical="top"
                  maxLength={500}
                />
                <Text style={[styles.characterCount, {color: colors.textSecondary}]}>
                  {problemDescription.length}/500
                </Text>
              </View>
              )}
            </ScrollView>

            {/* Action Buttons */}
            <View style={[styles.buttonContainer, {borderTopColor: colors.border, backgroundColor: colors.card}]}>
              <TouchableOpacity
                style={[styles.cancelButton, {backgroundColor: colors.background, borderColor: colors.border}]}
                onPress={handleCancel}
                disabled={isSubmitting}
              >
                <Text style={[styles.cancelButtonText, {color: colors.text}]}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.submitButton, {backgroundColor: colors.primary}]}
                onPress={handleSubmit}
                disabled={isSubmitting || !selectedProblem || (allowDescription && !problemDescription.trim())}
              >
                <Text style={styles.submitButtonText}>
                  {isSubmitting ? 'Creating...' : 'Submit'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
        {renderFaqModal()}
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 400,
    maxHeight: '90%',
    minHeight: 500,
  },
  modalContainerTall: {
    minHeight: 500,
  },
  modalContainerCompact: {
    minHeight: 420,
  },
  modalContent: {
    borderRadius: 16,
    padding: 20,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    maxHeight: '90%',
    minHeight: 500,
    flex: 1,
  },
  modalContentTall: {
    minHeight: 500,
  },
  modalContentCompact: {
    minHeight: 420,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  formContainer: {
    flex: 1,
    minHeight: 300,
  },
  formContainerTall: {
    minHeight: 300,
  },
  formContainerCompact: {
    minHeight: 200,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    minHeight: 48,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  characterCount: {
    fontSize: 12,
    textAlign: 'right',
    marginTop: 4,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    gap: 12,
    paddingTop: 16,
    paddingBottom: 8,
    borderTopWidth: 1,
  },
  cancelButton: {
    flex: 1,
    borderWidth: 1,
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
  dropdownButton: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 48,
  },
  dropdownButtonText: {
    fontSize: 16,
    flex: 1,
  },
  dropdownArrow: {
    fontSize: 16,
    marginLeft: 8,
  },
  dropdownList: {
    borderWidth: 1,
    borderRadius: 8,
    marginTop: 4,
    maxHeight: 200,
    zIndex: 1000,
  },
  dropdownScroll: {
    maxHeight: 200,
  },
  dropdownItem: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  dropdownItemText: {
    fontSize: 16,
  },
  pickerContainer: {
    borderWidth: 1,
    borderRadius: 12,
    marginTop: 8,
    overflow: 'hidden',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  pickerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    minHeight: 52,
  },
  pickerButtonText: {
    fontSize: 16,
    flex: 1,
    fontWeight: '500',
    flexShrink: 1,
    maxWidth: '85%',
  },
  pickerArrow: {
    fontSize: 18,
    marginLeft: 12,
    fontWeight: 'bold',
  },
  pickerDropdown: {
    borderTopWidth: 1,
    maxHeight: 200,
    zIndex: 1000,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  pickerScroll: {
    maxHeight: 200,
  },
  pickerItem: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  pickerItemText: {
    fontSize: 16,
    fontWeight: '400',
    flex: 1,
  },
  pickerCheckmark: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  helperText: {
    fontSize: 14,
    marginBottom: 12,
    textAlign: 'center',
  },
  faqBadge: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    marginBottom: 16,
  },
  faqBadgeText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  faqModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  faqModalContent: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 16,
    padding: 20,
    maxHeight: '75%',
  },
  faqModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  faqModalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  faqModalClose: {
    fontSize: 16,
    fontWeight: '600',
  },
  faqList: {
    maxHeight: '100%',
  },
  faqItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  faqQuestion: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6,
  },
  faqAnswer: {
    fontSize: 14,
    lineHeight: 20,
  },
});

export default AddTicketScreen; 