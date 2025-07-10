import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Dimensions,
  Alert,
} from 'react-native';
import { useTheme } from '../utils/ThemeContext';
import { getThemeColors } from '../utils/themeStyles';

const { width } = Dimensions.get('window');
const GRID_SIZE = 3;
const DOT_SIZE = 20;
const LINE_WIDTH = 3;
const SPACING = 40;

interface PatternLockProps {
  visible: boolean;
  onSuccess: (pattern: string) => void;
  onCancel: () => void;
  title?: string;
  isSetup?: boolean;
  confirmPattern?: string;
}

const PatternLock: React.FC<PatternLockProps> = ({
  visible,
  onSuccess,
  onCancel,
  title = 'Draw Pattern',
  isSetup = false,
  confirmPattern = '',
}) => {
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);
  
  const [pattern, setPattern] = useState<string[]>([]);
  const [confirmPatternValue, setConfirmPatternValue] = useState<string[]>([]);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    if (visible) {
      setPattern([]);
      setConfirmPatternValue([]);
      setIsConfirming(false);
      setIsDrawing(false);
    }
  }, [visible]);

  const getDotPosition = (index: number) => {
    const row = Math.floor(index / GRID_SIZE);
    const col = index % GRID_SIZE;
    return {
      x: col * SPACING + SPACING / 2,
      y: row * SPACING + SPACING / 2,
    };
  };

  const getDotIndex = (x: number, y: number) => {
    const col = Math.round((x - SPACING / 2) / SPACING);
    const row = Math.round((y - SPACING / 2) / SPACING);
    
    if (col >= 0 && col < GRID_SIZE && row >= 0 && row < GRID_SIZE) {
      return row * GRID_SIZE + col;
    }
    return -1;
  };

  const handleTouchStart = (x: number, y: number) => {
    const dotIndex = getDotIndex(x, y);
    if (dotIndex !== -1) {
      setIsDrawing(true);
      const currentPattern = isConfirming ? confirmPatternValue : pattern;
      if (!currentPattern.includes(dotIndex.toString())) {
        const newPattern = [...currentPattern, dotIndex.toString()];
        if (isConfirming) {
          setConfirmPatternValue(newPattern);
        } else {
          setPattern(newPattern);
        }
      }
    }
  };

  const handleTouchMove = (x: number, y: number) => {
    if (isDrawing) {
      const dotIndex = getDotIndex(x, y);
      if (dotIndex !== -1) {
        const currentPattern = isConfirming ? confirmPatternValue : pattern;
        if (!currentPattern.includes(dotIndex.toString())) {
          const newPattern = [...currentPattern, dotIndex.toString()];
          if (isConfirming) {
            setConfirmPatternValue(newPattern);
          } else {
            setPattern(newPattern);
          }
        }
      }
    }
  };

  const handleTouchEnd = () => {
    setIsDrawing(false);
    const currentPattern = isConfirming ? confirmPatternValue : pattern;
    
    if (currentPattern.length < 4) {
      Alert.alert('Pattern Too Short', 'Pattern must have at least 4 points.');
      if (isConfirming) {
        setConfirmPatternValue([]);
      } else {
        setPattern([]);
      }
      return;
    }

    if (isSetup && !isConfirming) {
      setIsConfirming(true);
      setConfirmPatternValue([]);
    } else if (isSetup && isConfirming) {
      const patternStr = currentPattern.join(',');
      const originalPatternStr = pattern.join(',');
      
      if (patternStr === originalPatternStr) {
        onSuccess(patternStr);
      } else {
        Alert.alert('Pattern Mismatch', 'Patterns do not match. Please try again.');
        setPattern([]);
        setConfirmPatternValue([]);
        setIsConfirming(false);
      }
    } else {
      const patternStr = currentPattern.join(',');
      if (confirmPattern && patternStr === confirmPattern) {
        onSuccess(patternStr);
      } else if (!confirmPattern) {
        onSuccess(patternStr);
      } else {
        Alert.alert('Incorrect Pattern', 'Please try again.');
        setPattern([]);
      }
    }
  };

  const renderDots = () => {
    const dots = [];
    const currentPattern = isConfirming ? confirmPatternValue : pattern;
    
    for (let i = 0; i < GRID_SIZE * GRID_SIZE; i++) {
      const position = getDotPosition(i);
      const isSelected = currentPattern.includes(i.toString());
      const isConnected = currentPattern.indexOf(i.toString()) !== -1;
      
      dots.push(
        <View
          key={i}
          style={[
            styles.dot,
            {
              left: position.x - DOT_SIZE / 2,
              top: position.y - DOT_SIZE / 2,
              backgroundColor: isSelected ? colors.primary : colors.border,
              borderColor: colors.border,
            },
          ]}>
          {isConnected && (
            <View
              style={[
                styles.dotInner,
                { backgroundColor: colors.primary },
              ]}
            />
          )}
        </View>
      );
    }
    
    return dots;
  };

  const renderLines = () => {
    const currentPattern = isConfirming ? confirmPatternValue : pattern;
    const lines = [];
    
    for (let i = 0; i < currentPattern.length - 1; i++) {
      const fromIndex = parseInt(currentPattern[i]);
      const toIndex = parseInt(currentPattern[i + 1]);
      const fromPos = getDotPosition(fromIndex);
      const toPos = getDotPosition(toIndex);
      
      const angle = Math.atan2(toPos.y - fromPos.y, toPos.x - fromPos.x);
      const length = Math.sqrt(
        Math.pow(toPos.x - fromPos.x, 2) + Math.pow(toPos.y - fromPos.y, 2)
      );
      
      lines.push(
        <View
          key={i}
          style={[
            styles.line,
            {
              left: fromPos.x,
              top: fromPos.y,
              width: length,
              backgroundColor: colors.primary,
              transform: [{ rotate: `${angle}rad` }],
            },
          ]}
        />
      );
    }
    
    return lines;
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}>
      <View style={[styles.container, { backgroundColor: 'rgba(0, 0, 0, 0.5)' }]}>
        <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
          <Text style={[styles.title, { color: colors.text }]}>
            {isSetup && !isConfirming ? 'Set Pattern' : isSetup && isConfirming ? 'Confirm Pattern' : title}
          </Text>
          
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {isSetup && !isConfirming
              ? 'Draw a pattern with at least 4 points'
              : isSetup && isConfirming
              ? 'Confirm your pattern'
              : 'Draw your pattern'}
          </Text>

          <View style={styles.patternContainer}>
            <View style={styles.patternGrid}>
              {renderLines()}
              {renderDots()}
            </View>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, { borderColor: colors.primary }]}
              onPress={onCancel}>
              <Text style={[styles.buttonText, { color: colors.primary }]}>
                Cancel
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.button, { backgroundColor: colors.primary }]}
              onPress={() => {
                const currentPattern = isConfirming ? confirmPatternValue : pattern;
                if (currentPattern.length >= 4) {
                  handleTouchEnd();
                }
              }}>
              <Text style={[styles.buttonText, { color: '#ffffff' }]}>
                Confirm
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: width * 0.9,
    maxWidth: 400,
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 30,
    textAlign: 'center',
  },
  patternContainer: {
    width: GRID_SIZE * SPACING,
    height: GRID_SIZE * SPACING,
    marginBottom: 30,
  },
  patternGrid: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  dot: {
    position: 'absolute',
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dotInner: {
    width: DOT_SIZE / 2,
    height: DOT_SIZE / 2,
    borderRadius: DOT_SIZE / 4,
  },
  line: {
    position: 'absolute',
    height: LINE_WIDTH,
    borderRadius: LINE_WIDTH / 2,
    transformOrigin: 'left center',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 15,
  },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    minWidth: 80,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default PatternLock; 