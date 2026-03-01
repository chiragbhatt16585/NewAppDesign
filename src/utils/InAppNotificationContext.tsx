import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import {Animated, Easing, StyleSheet, Text, TouchableOpacity, View} from 'react-native';

type NotificationType = 'info' | 'success' | 'warning' | 'error';

export interface InAppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  autoHide?: boolean;
  durationMs?: number;
}

interface InAppNotificationContextValue {
  notification: InAppNotification | null;
  showNotification: (partial: Omit<InAppNotification, 'id'>) => void;
  hideNotification: () => void;
}

const InAppNotificationContext = createContext<InAppNotificationContextValue | undefined>(
  undefined,
);

export const useInAppNotification = () => {
  const ctx = useContext(InAppNotificationContext);
  if (!ctx) {
    throw new Error('useInAppNotification must be used within InAppNotificationProvider');
  }
  return ctx;
};

export const InAppNotificationProvider: React.FC<{children: React.ReactNode}> = ({
  children,
}) => {
  const [notification, setNotification] = useState<InAppNotification | null>(null);
  const [visible, setVisible] = useState(false);
  const translateY = useState(new Animated.Value(-100))[0];

  const hideNotification = useCallback(() => {
    if (!visible) {
      setNotification(null);
      return;
    }
    Animated.timing(translateY, {
      toValue: -100,
      duration: 200,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      setVisible(false);
      setNotification(null);
    });
  }, [translateY, visible]);

  const showNotification = useCallback(
    (partial: Omit<InAppNotification, 'id'>) => {
      const id = `${Date.now()}`;
      const next: InAppNotification = {
        id,
        type: partial.type ?? 'info',
        title: partial.title,
        message: partial.message,
        autoHide: partial.autoHide ?? true,
        durationMs: partial.durationMs ?? 4000,
      };
      setNotification(next);
      setVisible(true);
      translateY.setValue(-100);
      Animated.timing(translateY, {
        toValue: 0,
        duration: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();

      if (next.autoHide) {
        const duration = next.durationMs ?? 4000;
        setTimeout(() => {
          hideNotification();
        }, duration);
      }
    },
    [hideNotification, translateY],
  );

  const value: InAppNotificationContextValue = {
    notification,
    showNotification,
    hideNotification,
  };

  const backgroundColor =
    notification?.type === 'success'
      ? '#16a34a'
      : notification?.type === 'error'
      ? '#dc2626'
      : notification?.type === 'warning'
      ? '#f97316'
      : '#2563eb';

  return (
    <InAppNotificationContext.Provider value={value}>
      {children}
      {notification && (
        <Animated.View
          style={[
            styles.container,
            {
              transform: [{translateY}],
              backgroundColor,
            },
          ]}>
          <View style={styles.content}>
            <Text style={styles.title}>{notification.title}</Text>
            {notification.message ? (
              <Text style={styles.message}>{notification.message}</Text>
            ) : null}
          </View>
          <TouchableOpacity onPress={hideNotification} style={styles.closeButton}>
            <Text style={styles.closeText}>×</Text>
          </TouchableOpacity>
        </Animated.View>
      )}
    </InAppNotificationContext.Provider>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 40,
    left: 16,
    right: 16,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
    zIndex: 999,
  },
  content: {
    flex: 1,
  },
  title: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  message: {
    color: '#f9fafb',
    fontSize: 12,
    marginTop: 2,
  },
  closeButton: {
    marginLeft: 12,
    paddingHorizontal: 4,
  },
  closeText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
});

