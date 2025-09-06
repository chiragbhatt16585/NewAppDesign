import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Dimensions,
  Platform,
} from 'react-native';
import { useTheme } from '../utils/ThemeContext';
import { getThemeColors } from '../utils/themeStyles';
import { VersionInfo } from '../services/versionCheck';

interface UpdateModalProps {
  visible: boolean;
  versionInfo: VersionInfo | null;
  onUpdate: () => void;
  onClose: () => void;
}

const UpdateModal: React.FC<UpdateModalProps> = ({
  visible,
  versionInfo,
  onUpdate,
  onClose,
}) => {
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);

  if (!versionInfo) return null;

  const { latestVersion, updateMessage } = versionInfo;

  const handleUpdate = () => {
    onUpdate();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={undefined}
    >
      <View style={styles.overlay}>
        <View style={[styles.modal, { backgroundColor: colors.card }]}>
          {/* Header */}
          <View style={[styles.header, { backgroundColor: colors.primary }]}>
            <Text style={styles.headerIcon}>🔄</Text>
            <Text style={styles.headerTitle}>
              Update Required
            </Text>
          </View>

          {/* Content */}
          <View style={styles.content}>
            <Text style={[styles.title, { color: colors.text }]}>
              New Version {latestVersion}
            </Text>
            
            <Text style={[styles.message, { color: colors.textSecondary }]}>
              {updateMessage || 
                'A new version of the app is available with improvements and bug fixes. Please update to continue using the app.'
              }
            </Text>

            {/* Features List */}
            <View style={styles.featuresContainer}>
              <Text style={[styles.featuresTitle, { color: colors.text }]}>
                What's New:
              </Text>
              <View style={styles.featuresList}>
                <Text style={[styles.featureItem, { color: colors.textSecondary }]}>
                  • Performance improvements
                </Text>
                <Text style={[styles.featureItem, { color: colors.textSecondary }]}>
                  • Bug fixes and stability updates
                </Text>
                <Text style={[styles.featureItem, { color: colors.textSecondary }]}>
                  • Enhanced user experience
                </Text>
                <Text style={[styles.featureItem, { color: colors.textSecondary }]}>
                  • Security updates
                </Text>
              </View>
            </View>
          </View>

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.updateButton, { backgroundColor: colors.primary }]}
              onPress={handleUpdate}
            >
              <Text style={styles.updateButtonText}>
                Update Now
              </Text>
            </TouchableOpacity>
          </View>

          {/* Platform Info */}
          <View style={styles.platformInfo}>
            <Text style={[styles.platformText, { color: colors.textSecondary }]}>
              {Platform.OS === 'ios' ? 'App Store' : 'Google Play Store'}
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
  },
  header: {
    padding: 20,
    alignItems: 'center',
  },
  headerIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  content: {
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  message: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 20,
  },
  featuresContainer: {
    marginBottom: 8,
  },
  featuresTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  featuresList: {
    paddingLeft: 8,
  },
  featureItem: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4,
  },
  buttonContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingBottom: 20,
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  laterButton: {
    borderWidth: 1,
    backgroundColor: 'transparent',
  },
  updateButton: {
    // backgroundColor set dynamically
  },
  laterButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  updateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  platformInfo: {
    alignItems: 'center',
    paddingBottom: 16,
  },
  platformText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
});

export default UpdateModal;
