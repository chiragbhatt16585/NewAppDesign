import React, { useState, useEffect } from 'react';
import {Image, StyleSheet, Text, View, Platform} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getClientConfig } from '../config/client-config';

interface LogoImageProps {
  style?: any;
  width?: number;
  height?: number;
  type?: 'login' | 'header';
}

const LogoImage: React.FC<LogoImageProps> = ({style, width, height, type = 'header'}) => {
  const [imageError, setImageError] = useState(false);
  const [remoteLogoUrl, setRemoteLogoUrl] = useState<string | null>(null);

  // Load dynamic logo URL for log2space-common (from domainname/tmp/upload/logoName)
  useEffect(() => {
    const loadRemoteLogo = async () => {
      try {
        const clientId = getClientConfig().clientId;
        if (clientId === 'log2space-common') {
          const storedUrl = await AsyncStorage.getItem('log2space_dynamic_logo_url');
          if (storedUrl && storedUrl.trim().length > 0 && storedUrl.trim() !== remoteLogoUrl) {
            setRemoteLogoUrl(storedUrl.trim());
          }
        }
      } catch {
        // ignore
      }
    };
    loadRemoteLogo();
  });
  
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

      // For log2space-common, prefer dynamic remote logo from API (domainname/tmp/upload/logoName)
      if (clientId === 'log2space-common' && remoteLogoUrl) {
        return { uri: remoteLogoUrl };
      }

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
        'monarknet:isp_logo.png': require('../../config/monarknet/assets/isp_logo.png'),
        'graceway:isp_logo.png': require('../../config/graceway/assets/isp_logo.png'),
        'log2space-common:isp_logo.png': require('../../config/log2space-common/assets/isp_logo.png'),

        // Legacy / older standalone logo files (if any)
        'microscan_logo.png': require('../assets/microscan_logo.png'),
        'dna_logo.png': require('../assets/dna_logo.png'),
        'isip_logo.png': require('../assets/isip_logo.png'),
      };

      const key = `${clientId}:${logoFileName}`;

      // Prefer exact client-specific match, then plain filename, then default
      let logoSource =
        logoMap[key] ||
        logoMap[logoFileName] ||
        logoMap['default:isp_logo.png'];

      // Skynetwifi: don't require config/skynetwifi assets at build time.
      // Instead, rely on the prepare script copying `config/<client>/assets/isp_logo.png`
      // into `src/assets/isp_logo.png`, then load it from there.
      if (clientId === 'skynetwifi') {
        try {
          return require('../assets/isp_logo.png');
        } catch (_) {
          // Fall back to computed logoSource
        }
      }
      if (clientId === 'srisamarthinfobahn') {
        try {
          return require('../assets/isp_logo.png');
        } catch (_) {
          // Fall back to computed logoSource
        }
      }

      // Fallback: after prepare, assets are copied to src/assets.
      // - Graceway/log2space-common: keep previous behavior.
      // - Skynetwifi: also allow it to load from src/assets if required mapping fails.
      if ((clientId === 'graceway' || clientId === 'log2space-common') && (!logoSource || imageError)) {
        try {
          const assetsLogo = require('../assets/isp_logo.png');
          if (assetsLogo) return assetsLogo;
        } catch (_) {}
      }

      if (clientId === 'skynetwifi' && (!logoSource || imageError)) {
        try {
          const assetsLogo = require('../assets/isp_logo.png');
          if (assetsLogo) return assetsLogo;
        } catch (_) {}
      }
      if (clientId === 'srisamarthinfobahn' && (!logoSource || imageError)) {
        try {
          const assetsLogo = require('../assets/isp_logo.png');
          if (assetsLogo) return assetsLogo;
        } catch (_) {}
      }
      return logoSource;
    } catch (error) {
      //console.warn('[LogoImage] Failed to require logo:', error);
      // Graceway / log2space-common: prepare script copies config assets to src/assets
      try {
        if (clientConfig.clientId === 'graceway' || clientConfig.clientId === 'log2space-common') {
          return require('../assets/isp_logo.png');
        }
      } catch (_) {}
      // Try alternative paths for iOS
      if (Platform.OS === 'ios') {
        try {
          return require('../../ios/ISPApp/isp_logo.png');
        } catch (iosError) {}
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