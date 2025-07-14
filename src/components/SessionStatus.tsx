import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import sessionManager from '../services/sessionManager';
import sessionMonitor from '../services/sessionMonitor';

interface SessionStatusProps {
  onSessionExpired?: () => void;
  onInactivityLogout?: () => void;
}

const SessionStatus: React.FC<SessionStatusProps> = ({ onSessionExpired, onInactivityLogout }) => {
  const [sessionInfo, setSessionInfo] = useState<{
    isExpiringSoon: boolean;
    hoursRemaining: number;
  } | null>(null);
  
  const [inactivityInfo, setInactivityInfo] = useState<{
    daysSinceLastActivity: number;
    daysUntilLogout: number;
    isInactive: boolean;
  } | null>(null);

  useEffect(() => {
    checkSessionStatus();
    const interval = setInterval(checkSessionStatus, 5 * 60 * 1000); // Check every 5 minutes
    return () => clearInterval(interval);
  }, []);

  const checkSessionStatus = async () => {
    try {
      // Track user activity when component is active
      await sessionMonitor.trackUserActivity();
      
      const sessionInfo = await sessionManager.getSessionExpiryInfo();
      setSessionInfo(sessionInfo);
      
      const inactivityStatus = await sessionMonitor.getInactivityStatus();
      setInactivityInfo(inactivityStatus);
      
      // If session has expired, notify parent component
      if (sessionInfo.hoursRemaining <= 0 && onSessionExpired) {
        onSessionExpired();
      }

      // If user is inactive, notify parent component
      if (inactivityStatus.isInactive && onInactivityLogout) {
        onInactivityLogout();
      }
    } catch (error) {
      console.error('Error checking session status:', error);
    }
  };

  // Don't show anything if both session and inactivity are fine
  if ((!sessionInfo || sessionInfo.hoursRemaining > 24) && 
      (!inactivityInfo || inactivityInfo.daysUntilLogout > 1)) {
    return null;
  }

  const getStatusColor = () => {
    // Priority: Inactivity > Session expiry
    if (inactivityInfo?.isInactive) return '#ff0000'; // Red for inactive
    if (inactivityInfo && inactivityInfo.daysUntilLogout <= 1) return '#ff4444'; // Red for 1 day left
    if (inactivityInfo && inactivityInfo.daysUntilLogout <= 3) return '#ff8800'; // Orange for 3 days left
    
    if (sessionInfo?.hoursRemaining && sessionInfo.hoursRemaining <= 1) return '#ff4444';
    if (sessionInfo?.hoursRemaining && sessionInfo.hoursRemaining <= 6) return '#ff8800';
    return '#ffaa00';
  };

  const getStatusText = () => {
    if (inactivityInfo?.isInactive) {
      return 'You have been logged out due to inactivity';
    }
    
    if (inactivityInfo && inactivityInfo.daysUntilLogout <= 1) {
      return `You will be logged out in ${inactivityInfo.daysUntilLogout} day due to inactivity`;
    }
    
    if (inactivityInfo && inactivityInfo.daysUntilLogout <= 3) {
      return `You will be logged out in ${inactivityInfo.daysUntilLogout} days due to inactivity`;
    }
    
    if (sessionInfo?.hoursRemaining && sessionInfo.hoursRemaining <= 1) {
      return `Session expires in less than 1 hour`;
    }
    
    return `Session expires in ${sessionInfo?.hoursRemaining || 0} hours`;
  };

  const handleContinueUsing = async () => {
    await sessionMonitor.trackUserActivity();
    checkSessionStatus();
  };

  return (
    <View style={[styles.container, { backgroundColor: getStatusColor() }]}>
      <Text style={styles.text}>{getStatusText()}</Text>
      <View style={styles.buttonContainer}>
        {inactivityInfo && inactivityInfo.daysUntilLogout <= 3 && !inactivityInfo.isInactive && (
          <TouchableOpacity onPress={handleContinueUsing} style={styles.actionButton}>
            <Text style={styles.actionButtonText}>Continue Using</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity onPress={checkSessionStatus} style={styles.refreshButton}>
          <Text style={styles.refreshText}>Refresh</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 8,
  },
  text: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    marginRight: 8,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  refreshButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 4,
  },
  refreshText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
});

export default SessionStatus; 