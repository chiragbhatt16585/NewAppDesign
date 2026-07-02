import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '../utils/ThemeContext';
import { getThemeColors } from '../utils/themeStyles';

interface ActiveTicketModalProps {
  visible: boolean;
  onClose: () => void;
  onAction: () => void;
  title?: string;
  message?: string;
  actionLabel?: string;
}

const ActiveTicketModal: React.FC<ActiveTicketModalProps> = ({
  visible,
  onClose,
  onAction,
  title = 'Unable to Raise Ticket',
  message = '',
  actionLabel = 'OK',
}) => {
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);
  const displayMessage = message?.trim();

  if (!visible) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityLabel="Close"
          >
            <MaterialIcons name="close" size={22} color={colors.textSecondary} />
          </TouchableOpacity>

          <View style={[styles.iconCircle, { backgroundColor: colors.primary }]}>
            <MaterialIcons name="priority-high" size={34} color="#fff" />
          </View>

          <Text style={[styles.title, { color: colors.primary }]}>{title}</Text>

          {displayMessage ? (
            <Text style={[styles.message, { color: colors.textSecondary }]}>
              {displayMessage}
            </Text>
          ) : null}

          <Pressable
            style={[styles.actionButton, { backgroundColor: colors.primary }]}
            onPress={onAction}
          >
            <Text style={styles.actionButtonText}>{actionLabel}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 16,
    paddingTop: 28,
    paddingBottom: 24,
    paddingHorizontal: 24,
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
  },
  closeButton: {
    position: 'absolute',
    top: 14,
    right: 14,
    zIndex: 1,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
  },
  message: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 22,
    paddingHorizontal: 4,
  },
  actionButton: {
    minWidth: 200,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default ActiveTicketModal;
