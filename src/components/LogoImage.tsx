import React from 'react';
import {Image, StyleSheet, Text, View} from 'react-native';

interface LogoImageProps {
  style?: any;
  width?: number;
  height?: number;
  type?: 'login' | 'header';
}

const LogoImage: React.FC<LogoImageProps> = ({style, width, height, type = 'header'}) => {
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
        login: { width: 120, height: 40 },
        header: { width: 80, height: 25 }
      };
    }
  };

  const logoConfig = getLogoConfig();
  const config = logoConfig[type] || logoConfig.header;
  
  // Use provided dimensions or fall back to config
  let logoWidth = width || config.width;
  let logoHeight = height || config.height;

  // console.log('=== LOGO DIMENSIONS ===');
  // console.log('Final width:', logoWidth);
  // console.log('Final height:', logoHeight);

  return (
    <View style={[{width: logoWidth, height: logoHeight}, style]}>
      <Image
        source={require('../assets/isp_logo.png')}
        style={{
          width: '100%',
          height: '100%',
          resizeMode: 'contain',
        }}
        onError={() => {
          console.log('Failed to load logo image');
        }}
      />
    </View>
  );
};

export default LogoImage; 