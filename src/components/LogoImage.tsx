import React, { useState } from 'react';
import {Image, StyleSheet, Text, View, Platform} from 'react-native';
import { getClientConfig } from '../config/client-config';

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

  // Get image source - dynamically load based on client config
  const getImageSource = () => {
    if (imageError) {
      // If image failed to load, return null to show fallback
      return null;
    }
    
    try {
      // Get logo filename from client config
      const clientConfig = getClientConfig();
      const logoFileName = clientConfig.branding.logo || 'isp_logo.png';
      
      console.log('[LogoImage] Loading logo for client:', clientConfig.clientName, 'logo file:', logoFileName);
      
      // Map logo filename to require statement
      // Since require() needs static paths, we need to handle common logo names
      const logoMap: Record<string, any> = {
        'isp_logo.png': require('../assets/isp_logo.png'),
        'microscan_logo.png': require('../assets/microscan_logo.png'),
        'dna_logo.png': require('../assets/dna_logo.png'),
        'isip_logo.png': require('../assets/isip_logo.png'),
      };
      
      // Try to get the logo from the map, fallback to isp_logo.png
      const logoSource = logoMap[logoFileName] || logoMap['isp_logo.png'];
      
      console.log('[LogoImage] Logo source resolved for:', logoFileName);
      
      return logoSource;
    } catch (error) {
      console.warn('[LogoImage] Failed to require logo:', error);
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