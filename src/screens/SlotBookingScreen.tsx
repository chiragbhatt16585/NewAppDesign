import React, {useState, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import Feather from 'react-native-vector-icons/Feather';
import {useTranslation} from 'react-i18next';
import LogoImage from '../components/LogoImage';
import {useTheme} from '../utils/ThemeContext';
import {getThemeColors} from '../utils/themeStyles';
import {getClientConfig} from '../config/client-config';

type SlotId = 'morning' | 'afternoon' | 'evening';

const SLOT_IDS: SlotId[] = ['morning', 'afternoon', 'evening'];

interface SlotCardProps {
  slotId: SlotId;
  title: string;
  timeRange: string;
  selected: boolean;
  onSelect: (id: SlotId) => void;
  primaryColor: string;
  colors: ReturnType<typeof getThemeColors>;
}

const SlotCard = ({
  slotId,
  title,
  timeRange,
  selected,
  onSelect,
  primaryColor,
  colors,
}: SlotCardProps) => (
  <TouchableOpacity
    style={[
      styles.slotCard,
      {
        borderColor: primaryColor,
        backgroundColor: selected ? primaryColor : colors.card,
      },
    ]}
    onPress={() => onSelect(slotId)}
    activeOpacity={0.8}
    accessibilityRole="radio"
    accessibilityState={{selected}}>
    <Text style={[styles.slotTitle, {color: selected ? '#FFFFFF' : colors.text}]}>{title}</Text>
    <Text style={[styles.slotTime, {color: selected ? '#FFFFFF' : colors.textSecondary}]}>
      {timeRange}
    </Text>
  </TouchableOpacity>
);

const SlotBookingScreen = ({navigation}: any) => {
  const {isDark} = useTheme();
  const colors = getThemeColors(isDark);
  const {t} = useTranslation();
  const clientConfig = getClientConfig();
  const primaryColor = clientConfig.branding?.primaryColor || colors.primary;

  const [selectedSlot, setSelectedSlot] = useState<SlotId | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const handleSelectSlot = useCallback((slotId: SlotId) => {
    setSelectedSlot(slotId);
  }, []);

  const handleCancel = () => {
    navigation.goBack();
  };

  const handleConfirm = () => {
    if (!selectedSlot) {
      Alert.alert(t('common.error'), t('slotBooking.selectSlotError'));
      return;
    }

    setShowSuccessModal(true);
  };

  const handleDone = () => {
    setShowSuccessModal(false);
    navigation.navigate('Home');
  };

  return (
    <SafeAreaView style={[styles.container, {backgroundColor: '#F5F5F5'}]} edges={['top', 'bottom']}>
      <View style={[styles.header, {borderBottomColor: colors.borderLight}]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
          accessibilityLabel="Go back">
          <Feather name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.logoContainer}>
          <LogoImage type="header" width={160} height={48} />
        </View>
        <View style={styles.backButtonPlaceholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <Text style={[styles.pageTitle, {color: primaryColor}]}>{t('slotBooking.title')}</Text>
        <Text style={[styles.pageSubtitle, {color: colors.textSecondary}]}>
          {t('slotBooking.subtitle')}
        </Text>

        <Text style={[styles.sectionTitle, {color: colors.text}]}>
          {t('slotBooking.selectPreferredSlot')}
        </Text>

        <View style={styles.slotsGrid}>
          {SLOT_IDS.map((slotId, index) => (
            <View
              key={slotId}
              style={[
                styles.slotWrapper,
                index === 2 && styles.slotWrapperLast,
              ]}>
              <SlotCard
                slotId={slotId}
                title={t(`slotBooking.slots.${slotId}.title`)}
                timeRange={t(`slotBooking.slots.${slotId}.time`)}
                selected={selectedSlot === slotId}
                onSelect={handleSelectSlot}
                primaryColor={primaryColor}
                colors={colors}
              />
            </View>
          ))}
        </View>

        <Text style={[styles.noteText, {color: colors.text}]}>
          {t('slotBooking.note')}
        </Text>
      </ScrollView>

      <View style={[styles.footer, {backgroundColor: '#F5F5F5', borderTopColor: colors.borderLight}]}>
        <TouchableOpacity
          style={[styles.cancelButton, {borderColor: primaryColor}]}
          onPress={handleCancel}
          activeOpacity={0.8}>
          <Text style={[styles.cancelButtonText, {color: colors.text}]}>{t('slotBooking.cancel')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.confirmButton,
            {
              backgroundColor: selectedSlot ? primaryColor : `${primaryColor}80`,
            },
          ]}
          onPress={handleConfirm}
          activeOpacity={0.8}
          disabled={!selectedSlot}>
          <Text style={styles.confirmButtonText}>{t('slotBooking.confirmSlot')}</Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={showSuccessModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSuccessModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, {backgroundColor: colors.card}]}>
            <View style={styles.successIconCircle}>
              <Feather name="check" size={36} color="#FFFFFF" />
            </View>
            <Text style={styles.successTitle}>{t('slotBooking.successTitle')}</Text>
            <Text style={[styles.successMessage, {color: colors.textSecondary}]}>
              {t('slotBooking.successMessage')}
            </Text>
            <TouchableOpacity
              style={[styles.doneButton, {backgroundColor: primaryColor}]}
              onPress={handleDone}
              activeOpacity={0.8}>
              <Text style={styles.doneButtonText}>{t('slotBooking.done')}</Text>
            </TouchableOpacity>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    width: 40,
    alignItems: 'flex-start',
  },
  backButtonPlaceholder: {
    width: 40,
  },
  logoContainer: {
    flex: 1,
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
    flexGrow: 1,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 6,
  },
  pageSubtitle: {
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 16,
  },
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  slotWrapper: {
    width: '48%',
    marginBottom: 14,
  },
  slotWrapperLast: {
    width: '48%',
  },
  slotCard: {
    borderWidth: 1.5,
    borderRadius: 10,
    paddingVertical: 18,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 88,
  },
  slotTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
    textAlign: 'center',
  },
  slotTime: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  noteText: {
    fontSize: 12,
    fontStyle: 'italic',
    lineHeight: 18,
    textAlign: 'center',
    marginTop: 'auto',
    paddingHorizontal: 8,
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    gap: 12,
    borderTopWidth: 1,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 1.5,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
  },
  modalCard: {
    width: '100%',
    borderRadius: 16,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  successIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#4CAF50',
    textAlign: 'center',
    marginBottom: 12,
  },
  successMessage: {
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 4,
  },
  doneButton: {
    minWidth: 140,
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
    alignItems: 'center',
  },
  doneButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default SlotBookingScreen;
