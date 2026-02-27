import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import {getClientConfig} from '../config/client-config';

const LeftBorderLine = () => {
  // Get left border color from config
  // - If headerBorderColors is not present at all → no border
  // - If headerBorderColors.left is undefined → no border
  // - If headerBorderColors.left is empty string '' → no border (transparent)
  // - If headerBorderColors.left has a color → use that color
  const clientConfig = getClientConfig();
  const headerBorderColors = clientConfig.branding.headerBorderColors;
  const leftBorderColor = headerBorderColors?.left;
  const leftBorderBgColor = leftBorderColor ? leftBorderColor : 'transparent';
  const leftBorderWidth = leftBorderColor ? (Platform.OS === 'ios' ? 4 : 5) : 0;

  return (
    <View
      style={[
        styles.leftBorderLine,
        {
          backgroundColor: leftBorderBgColor,
          width: leftBorderWidth,
        },
      ]}
    />
  );
};

const styles = StyleSheet.create({
  leftBorderLine: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    // Keep the line above card shadows and other content
    zIndex: 100,
    elevation: 16,
  },
});

export default LeftBorderLine;


