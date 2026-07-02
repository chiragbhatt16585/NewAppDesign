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
import { formatTicketCreatedDisplay, normalizeTicketNo } from '../utils/ticketDisplay';

interface TicketCreatedSuccessModalProps {
  visible: boolean;
  ticketNo?: string | null;
  dateCreated?: string | null;
  onClose: () => void;
  onViewTickets: () => void;
}

const SUCCESS_GREEN = '#1F9D55';

const TicketCreatedSuccessModal: React.FC<TicketCreatedSuccessModalProps> = ({
  visible,
  ticketNo,
  dateCreated,
  onClose,
  onViewTickets,
}) => {
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);
  const displayTicketNo = normalizeTicketNo(ticketNo);
  const displayDate = formatTicketCreatedDisplay(dateCreated);

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

          <View style={styles.iconCircle}>
            <MaterialIcons name="check" size={34} color="#fff" />
          </View>

          <Text style={styles.title}>Your ticket has been raised</Text>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.detailsBlock}>
            <Text style={[styles.detailLine, { color: colors.textSecondary }]}>
              Ticket Id:{' '}
              <Text style={[styles.detailValue, { color: colors.text }]}>
                {displayTicketNo}
              </Text>
            </Text>
            <Text style={[styles.detailLine, { color: colors.textSecondary }]}>
              Created:{' '}
              <Text style={[styles.detailValue, { color: colors.text }]}>
                {displayDate}
              </Text>
            </Text>
          </View>

          <Pressable
            style={[styles.actionButton, { backgroundColor: colors.primary }]}
            onPress={onViewTickets}
          >
            <Text style={styles.actionButtonText}>View my tickets</Text>
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
    backgroundColor: SUCCESS_GREEN,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: SUCCESS_GREEN,
    textAlign: 'center',
    marginBottom: 18,
  },
  divider: {
    width: '100%',
    height: 1,
    marginBottom: 18,
  },
  detailsBlock: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 22,
    gap: 8,
  },
  detailLine: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  detailValue: {
    fontWeight: '700',
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

export default TicketCreatedSuccessModal;
