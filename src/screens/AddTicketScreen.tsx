import React, {useState, useEffect, useMemo} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
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

  // Determine if description (remarks) should be shown based on menu settings for Tickets
  const allowDescription: boolean = useMemo(() => {
    try {
      if (!Array.isArray(menu)) return false;
      const tickets = menu.find((m: any) => (
        String(m?.menu_label) === 'Tickets' && String(m?.status).toLowerCase() === 'active'
      ));
      if (!tickets) return false;
      const jsonStr = tickets.display_option_json || '';
      if (!jsonStr || typeof jsonStr !== 'string') return false;
      const parsed = JSON.parse(jsonStr);
      return !!parsed?.ticket_settings?.add_remarks_on_create_ticket;
    } catch {
      return false;
    }
  }, [menu]);

  useEffect(() => {
    if (visible) {
      loadProblemOptions();
    }
  }, [visible]);

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
                              setSelectedProblem(option);
                              setShowProblemDropdown(false);
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
});

export default AddTicketScreen; 