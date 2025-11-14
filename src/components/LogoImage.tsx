import React, { useState } from 'react';
import {Image, StyleSheet, Text, View, Platform} from 'react-native';

interface LogoImageProps {
  style?: any;
  width?: number;
  height?: number;
  type?: 'login' | 'header';
}

const LogoImage: React.FC<LogoImageProps> = ({style, width, height, type = 'header'}) => {
  const [imageError, setImageError] = useState(false);
  
  // Load logo config
  const getLogoConfig = () => {
    try {
      // Force reload the config file
      const config = require('../config/logo-config.json');
      // console.log('=== LOGO CONFIG DEBUG ===');
      // console.log('Loaded config:', JSON.stringify(config, null, 2));
      // console.log('Type:', type);
      // console.log('Config for type:', config[type]);
      return config;
    } catch (error) {
      // console.log('=== LOGO CONFIG ERROR ===');
      // console.log('Error loading config:', error);
      // Fallback defaults
      return {
        login: { width: 200, height: 200 },
        header: { width: 200, height: 200 }
      };
    }
  };

  const logoConfig = getLogoConfig();
  const config = logoConfig[type] || logoConfig.header;
  
  // Use provided dimensions or fall back to config
  let logoWidth = width || config.width;
  let logoHeight = height || config.height;

  // Get image source - try multiple paths for iOS compatibility
  const getImageSource = () => {
    if (imageError) {
      // If image failed to load, return null to show fallback
      return null;
    }
    
    try {
      // Primary path - should work on both platforms
      return require('../assets/isp_logo.png');
    } catch (error) {
      console.warn('[LogoImage] Failed to require primary logo path:', error);
      // Try alternative paths for iOS
      if (Platform.OS === 'ios') {
        try {
          // Try iOS-specific path
          return require('../../ios/ISPApp/isp_logo.png');
        } catch (iosError) {
          console.warn('[LogoImage] Failed to require iOS logo path:', iosError);
        }
      }
      return null;
    }
  };

  const imageSource = getImageSource();

  // console.log('=== LOGO CONFIG ===', { type, configForType: logoConfig[type], fallbackHeader: logoConfig.header });
  // console.log('=== LOGO DIMENSIONS ===', { width: logoWidth, height: logoHeight });

  return (
    <View
      style={[{width: logoWidth, height: logoHeight}, style]}
      onLayout={(e) => {
        const { width: w, height: h } = e.nativeEvent.layout;
        console.log('=== LOGO ONLAYOUT SIZE ===', { width: w, height: h, type });
      }}
    >
      {imageSource ? (
        <Image
          source={imageSource}
          style={{
            width: '100%',
            height: '100%',
            resizeMode: 'contain',
          }}
          onError={(error) => {
            console.error('[LogoImage] Failed to load logo image:', error);
            setImageError(true);
          }}
          onLoad={() => {
            console.log('[LogoImage] Logo image loaded successfully');
            setImageError(false);
          }}
        />
      ) : (
        // Fallback: Show text or placeholder
        <View style={{
          width: '100%',
          height: '100%',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: 'transparent',
        }}>
          <Text style={{ fontSize: 12, color: '#999' }}>Logo</Text>
        </View>
      )}
    </View>
  );
};

export default LogoImage; 