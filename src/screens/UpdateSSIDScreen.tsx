import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useTheme} from '../utils/ThemeContext';
import {getThemeColors} from '../utils/themeStyles';
import CommonHeader from '../components/CommonHeader';
import {useTranslation} from 'react-i18next';
import {apiService} from '../services/api';

interface WlanDetail {
  index: number;
  ssid: string;
  enable: boolean;
  cpeId?: string;
}

interface FormData {
  [key: string]: string;
}

interface Errors {
  [key: string]: string;
}

interface ShowPassword {
  [key: number]: boolean;
}

const UpdateSSIDScreen = ({navigation}: any) => {
  const {isDark} = useTheme();
  const colors = getThemeColors(isDark);
  const {t} = useTranslation();
  
  const [isLoading, setIsLoading] = useState(false);
  const [wlanDetails, setWlanDetails] = useState<WlanDetail[]>([]);
  const [formData, setFormData] = useState<FormData>({});
  const [errors, setErrors] = useState<Errors>({});
  const [expandedSSID, setExpandedSSID] = useState<number | null>(null);
  const [showPassword, setShowPassword] = useState<ShowPassword>({});

  useEffect(() => {
    fetchSSIDDetails();
  }, []);

  const fetchSSIDDetails = async () => {
    setIsLoading(true);
    try {
      const response = await apiService.getCPESSIDDetails('default');
      const wlanDetailsArray = response?.wlan_details || [];
      const cpeId = response?.id;
      
      const enabledWlans: WlanDetail[] = wlanDetailsArray
        .filter((wlan: any) => wlan.enable)
        .sort((a: any, b: any) => a.index - b.index)
        .map((wlan: any) => ({
          ...wlan,
          cpeId: cpeId
        }));
        
      setWlanDetails(enabledWlans);
      
      const initialFormData: FormData = {};
      enabledWlans.forEach((wlan: WlanDetail) => {
        initialFormData[`ssid_${wlan.index}`] = wlan.ssid;
        initialFormData[`password_${wlan.index}`] = '';
      });
      setFormData(initialFormData);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to fetch SSID details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const validateForm = (ssidIndex: number) => {
    let isValid = true;
    let newErrors = {};

    const ssidField = `ssid_${ssidIndex}`;
    const passwordField = `password_${ssidIndex}`;

    if (!formData[ssidField]?.trim()) {
      newErrors[ssidField] = 'SSID is required';
      isValid = false;
    }

    if (!formData[passwordField]?.trim()) {
      newErrors[passwordField] = 'Password is required';
      isValid = false;
    } else if (formData[passwordField].length < 8) {
      newErrors[passwordField] = 'Password must be at least 8 characters';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (ssidIndex: number) => {
    if (!validateForm(ssidIndex)) {
      Alert.alert('Error', 'Please correct the errors');
      return;
    }

    setIsLoading(true);
    const currentSSID = wlanDetails.find(wlan => wlan.index === ssidIndex);

    try {
      if (!currentSSID?.cpeId) {
        throw new Error('CPE ID not found');
      }

      await apiService.updateSSID({
        id: currentSSID.cpeId,
        index: ssidIndex,
        ssid: (formData as any)[`ssid_${ssidIndex}`],
        password: (formData as any)[`password_${ssidIndex}`]
      }, 'default');
      
      Alert.alert('Success', 'SSID updated successfully!');
      setExpandedSSID(null);
      fetchSSIDDetails();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update SSID');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && wlanDetails.length === 0) {
    return (
      <SafeAreaView style={[styles.container, {backgroundColor: colors.background}]}>
        <CommonHeader navigation={navigation} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, {color: colors.text}]}>Loading SSID details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, {backgroundColor: colors.background}]}>
      <CommonHeader navigation={navigation} />
      
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <View style={[styles.headerCard, {backgroundColor: colors.card}]}>
            <View style={styles.headerContent}>
              <Text style={[styles.headerTitle, {color: colors.text}]}>Update SSID Settings</Text>
              <Text style={[styles.headerSubtitle, {color: colors.textSecondary}]}>
                Configure your WiFi network settings
              </Text>
            </View>
            <View style={[styles.headerIcon, {backgroundColor: colors.primaryLight}]}>
              <Text style={styles.iconText}>📶</Text>
            </View>
          </View>

          <View style={styles.formContainer}>
            <View style={styles.formHeader}>
              <Text style={[styles.formHeaderText, {color: colors.text}]}>SSID Configuration</Text>
            </View>

            {wlanDetails.map((wlan) => (
              <View key={wlan.index} style={[styles.ssidSection, {backgroundColor: colors.card}]}>
                <TouchableOpacity 
                  style={styles.ssidHeader}
                  onPress={() => setExpandedSSID(expandedSSID === wlan.index ? null : wlan.index)}
                >
                  <View style={styles.ssidTitleContainer}>
                    <View style={[styles.ssidIcon, {backgroundColor: colors.primaryLight}]}>
                      <Text style={styles.ssidIconText}>📶</Text>
                    </View>
                                         <Text style={[styles.ssidName, {color: colors.text}]}>
                       {(formData as any)[`ssid_${wlan.index}`] || 'Network Name'}
                     </Text>
                  </View>
                  <View style={styles.headerRight}>
                    <View style={[styles.activeStatus, {backgroundColor: colors.successLight}]}>
                      <View style={[styles.activeDot, {backgroundColor: colors.success}]} />
                      <Text style={[styles.activeText, {color: colors.success}]}>Active</Text>
                    </View>
                    <Text style={[styles.expandIcon, {color: colors.textSecondary}]}>
                      {expandedSSID === wlan.index ? '▼' : '▶'}
                    </Text>
                  </View>
                </TouchableOpacity>

                {expandedSSID === wlan.index && (
                  <View style={[styles.expandedContent, {borderTopColor: colors.border}]}>
                    <View style={styles.inputWrapper}>
                      <Text style={[styles.inputLabel, {color: colors.text}]}>Network Name</Text>
                      <View style={[styles.inputRow, {backgroundColor: colors.surface, borderColor: colors.border}]}>
                        <Text style={[styles.inputIcon, {color: colors.primary}]}>📡</Text>
                        <TextInput
                          placeholder="Enter network name"
                          value={(formData as any)[`ssid_${wlan.index}`] || ''}
                          onChangeText={(text) => handleInputChange(`ssid_${wlan.index}`, text)}
                          style={[styles.input, {color: colors.text}, (errors as any)[`ssid_${wlan.index}`] && styles.inputError]}
                          placeholderTextColor={colors.textSecondary}
                        />
                      </View>
                      {errors[`ssid_${wlan.index}`] && 
                        <Text style={[styles.errorText, {color: colors.error}]}>{errors[`ssid_${wlan.index}`]}</Text>
                      }
                    </View>

                    <View style={styles.inputWrapper}>
                      <Text style={[styles.inputLabel, {color: colors.text}]}>Password</Text>
                      <View style={[styles.inputRow, {backgroundColor: colors.surface, borderColor: colors.border}]}>
                        <Text style={[styles.inputIcon, {color: colors.primary}]}>🔒</Text>
                        <TextInput
                          placeholder="Enter password"
                          value={(formData as any)[`password_${wlan.index}`]}
                          onChangeText={(text) => handleInputChange(`password_${wlan.index}`, text)}
                          secureTextEntry={!showPassword[wlan.index]}
                          style={[styles.input, {color: colors.text}, (errors as any)[`password_${wlan.index}`] && styles.inputError]}
                          placeholderTextColor={colors.textSecondary}
                        />
                        <TouchableOpacity 
                          style={styles.eyeButton}
                          onPress={() => setShowPassword(prev => ({
                            ...prev,
                            [wlan.index]: !prev[wlan.index]
                          }))}
                        >
                          <Text style={[styles.eyeIcon, {color: colors.textSecondary}]}>
                            {showPassword[wlan.index] ? '👁️' : '👁️‍🗨️'}
                          </Text>
                        </TouchableOpacity>
                      </View>
                      {errors[`password_${wlan.index}`] && 
                        <Text style={[styles.errorText, {color: colors.error}]}>{errors[`password_${wlan.index}`]}</Text>
                      }
                    </View>

                    <TouchableOpacity
                      style={[styles.updateButton, {backgroundColor: colors.primary}]}
                      onPress={() => handleSubmit(wlan.index)}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <ActivityIndicator size="small" color="#ffffff" />
                      ) : (
                        <View style={styles.updateButtonContent}>
                          <Text style={styles.updateButtonIcon}>🔄</Text>
                          <Text style={[styles.updateButtonText, {color: '#ffffff'}]}>Update SSID</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  headerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
  },
  headerIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconText: {
    fontSize: 24,
  },
  formContainer: {
    gap: 16,
  },
  formHeader: {
    marginBottom: 8,
  },
  formHeaderText: {
    fontSize: 18,
    fontWeight: '600',
  },
  ssidSection: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  ssidHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  ssidTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  ssidIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ssidIconText: {
    fontSize: 18,
  },
  ssidName: {
    fontSize: 16,
    fontWeight: '600',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  activeStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  activeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  expandIcon: {
    fontSize: 16,
    fontWeight: '600',
  },
  expandedContent: {
    padding: 16,
    borderTopWidth: 1,
  },
  inputWrapper: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingRight: 50, // Extra padding for the eye button
    height: 48,
    position: 'relative', // For absolute positioned eye button
  },
  inputIcon: {
    fontSize: 16,
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
  },
  inputError: {
    borderColor: 'red',
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  eyeButton: {
    position: 'absolute',
    right: 15,
    top: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  eyeIcon: {
    fontSize: 18,
  },
  updateButton: {
    borderRadius: 12,
    padding: 12,
    alignSelf: 'flex-end',
    minWidth: 140,
  },
  updateButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  updateButtonIcon: {
    fontSize: 16,
  },
  updateButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default UpdateSSIDScreen; 