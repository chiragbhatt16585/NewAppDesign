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

  // Get client config for logo dimensions
  const clientConfig = getClientConfig();
  const clientLogoDimensions = clientConfig.branding.logoDimensions;
  
  // Try to get dimensions from client config first, then logo-config.json, then fallback
  const logoConfig = getLogoConfig();
  const logoConfigDimensions = logoConfig[type] || logoConfig.header;
  
  // Priority: provided props > client config > logo-config.json > defaults
  let logoWidth = width;
  let logoHeight = height;
  
  if (!logoWidth || !logoHeight) {
    // Try client config dimensions first
    if (clientLogoDimensions) {
      const clientDims = clientLogoDimensions[type] || clientLogoDimensions.header;
      if (clientDims) {
        logoWidth = logoWidth || clientDims.width;
        logoHeight = logoHeight || clientDims.height;
      }
    }
    
    // Fall back to logo-config.json if client config doesn't have it
    if (!logoWidth || !logoHeight) {
      logoWidth = logoWidth || logoConfigDimensions.width;
      logoHeight = logoHeight || logoConfigDimensions.height;
    }
    
    // Final fallback defaults
    logoWidth = logoWidth || 200;
    logoHeight = logoHeight || 200;
  }

  // Get image source - dynamically load based on client config
  const getImageSource = () => {
    if (imageError) {
      // If image failed to load, return null to show fallback
      return null;
    }
    
    try {
      // Get logo filename and client id from client config (reuse already loaded config)
      const logoFileName = clientConfig.branding.logo || 'isp_logo.png';
      const clientId = clientConfig.clientId;

      // Since require() needs static paths, we explicitly map
      // each client + logo combination to its asset file.
      // NOTE: If you add a new client's custom logo, add an entry here.
      const logoMap: Record<string, any> = {
        // Default / fallback generic logo (Spacecom-style)
        'default:isp_logo.png': require('../../config/spacecom-live/assets/isp_logo.png'),

        // Client-specific isp_logo variants (note: config directory is at project root)
        'spacecom-live:isp_logo.png': require('../../config/spacecom-live/assets/isp_logo.png'),
        'microscan:isp_logo.png': require('../../config/microscan/assets/isp_logo.png'),
        'dna-infotel:isp_logo.png': require('../../config/dna-infotel/assets/isp_logo.png'),
        'dna-goa:isp_logo.png': require('../../config/dna-goa/assets/isp_logo.png'),
        'inshansa-dnagoa:isp_logo.png': require('../../config/inshansa-dnagoa/assets/isp_logo.png'),
        'successbroadband:isp_logo.png': require('../../config/successbroadband/assets/isp_logo.png'),
        'spacecom-local:isp_logo.png': require('../../config/spacecom-local/assets/isp_logo.png'),
        'one-sevenstar:isp_logo.png': require('../../config/one-sevenstar/assets/isp_logo.png'),
        'logon-broadband:isp_logo.png': require('../../config/logon-broadband/assets/isp_logo.png'),
        'linkway:isp_logo.png': require('../../config/linkway/assets/isp_logo.png'),
        'netplanet:isp_logo.png': require('../../config/netplanet/assets/isp_logo.png'),
        'netfix:isp_logo.png': require('../../config/netfix/assets/isp_logo.png'),
        'gatewayftth:isp_logo.png': require('../../config/gatewayftth/assets/isp_logo.png'),
        'metanet:isp_logo.png': require('../../config/metanet/assets/isp_logo.png'),

        // Legacy / older standalone logo files (if any)
        'microscan_logo.png': require('../assets/microscan_logo.png'),
        'dna_logo.png': require('../assets/dna_logo.png'),
        'isip_logo.png': require('../assets/isip_logo.png'),
      };

      const key = `${clientId}:${logoFileName}`;

      // Prefer exact client-specific match, then plain filename, then default
      const logoSource =
        logoMap[key] ||
        logoMap[logoFileName] ||
        logoMap['default:isp_logo.png'];

      return logoSource;
    } catch (error) {
      //console.warn('[LogoImage] Failed to require logo:', error);
      // Try alternative paths for iOS
      if (Platform.OS === 'ios') {
        try {
          // Try iOS-specific path
          return require('../../ios/ISPApp/isp_logo.png');
        } catch (iosError) {
          //console.warn('[LogoImage] Failed to require iOS logo path:', iosError);
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
        //console.log('=== LOGO ONLAYOUT SIZE ===', { width: w, height: h, type });
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
            //console.error('[LogoImage] Failed to load logo image:', error);
            setImageError(true);
          }}
          onLoad={() => {
            //console.log('[LogoImage] Logo image loaded successfully');
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