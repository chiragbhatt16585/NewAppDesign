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
  const [sourceIndex, setSourceIndex] = useState(0);
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

  // Build ordered logo sources (client config → prepared src/assets → default)
  const getLogoSources = (): any[] => {
    const sources: any[] = [];
    try {
      const logoFileName = clientConfig.branding.logo || 'isp_logo.png';
      const clientId = clientConfig.clientId;

      if (clientId === 'log2space-common' && remoteLogoUrl) {
        sources.push({ uri: remoteLogoUrl });
      }

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
        'threesa-infoway:isp_logo.png': require('../../config/threesa-infoway/assets/isp_logo.png'),
        'one-sevenstar:isp_logo.png': require('../../config/one-sevenstar/assets/isp_logo.png'),
        'logon-broadband:isp_logo.png': require('../../config/logon-broadband/assets/isp_logo.png'),
        'linkway:isp_logo.png': require('../../config/linkway/assets/isp_logo.png'),
        'netplanet:isp_logo.png': require('../../config/netplanet/assets/isp_logo.png'),
        'netfix:isp_logo.png': require('../../config/netfix/assets/isp_logo.png'),
        'gatewayftth:isp_logo.png': require('../../config/gatewayftth/assets/isp_logo.png'),
        'metanet:isp_logo.png': require('../../config/metanet/assets/isp_logo.png'),
        'comcast:isp_logo.png': require('../../config/comcast/assets/isp_logo.png'),
        'monarknet:isp_logo.png': require('../../config/monarknet/assets/isp_logo.png'),
        'funnet:isp_logo.png': require('../../config/funnet/assets/isp_logo.png'),
        'indophone:isp_logo.png': require('../../config/indophone/assets/isp_logo.png'),
        'graceway:isp_logo.png': require('../../config/graceway/assets/isp_logo.png'),
        'log2space-common:isp_logo.png': require('../../config/log2space-common/assets/isp_logo.png'),
        // Skynet Wi‑Fi: client assets use `header_logo.png` for the main mark (login + header).
        // Map branding `logo` (isp_logo.png) to that file so updates in config/ show without relying on prepare → src/assets.
        'skynetwifi:isp_logo.png': require('../../config/skynetwifi/assets/header_logo.png'),
        'srisamarthinfobahn:isp_logo.png': require('../../config/srisamarthinfobahn/assets/isp_logo.png'),

        // Legacy / older standalone logo files (if any)
        'microscan_logo.png': require('../assets/microscan_logo.png'),
        'dna_logo.png': require('../assets/dna_logo.png'),
        'isip_logo.png': require('../assets/isip_logo.png'),
      };

      const key = `${clientId}:${logoFileName}`;
      const orderedKeys = [key, logoFileName, 'default:isp_logo.png'];
      orderedKeys.forEach(mapKey => {
        if (logoMap[mapKey] && !sources.includes(logoMap[mapKey])) {
          sources.push(logoMap[mapKey]);
        }
      });

      // prepare:<client> copies isp_logo.png into src/assets — reliable fallback for new clients
      try {
        const preparedLogo = require('../assets/isp_logo.png');
        if (preparedLogo && !sources.includes(preparedLogo)) {
          sources.push(preparedLogo);
        }
      } catch (_) {}

      if (Platform.OS === 'ios') {
        try {
          const iosLogo = require('../../ios/ISPApp/isp_logo.png');
          if (iosLogo && !sources.includes(iosLogo)) {
            sources.push(iosLogo);
          }
        } catch (_) {}
      }
    } catch (_) {
      try {
        sources.push(require('../assets/isp_logo.png'));
      } catch (_) {}
    }
    return sources;
  };

  const logoSources = getLogoSources();
  const imageSource = logoSources[sourceIndex] ?? null;

  // Reset source index when client or remote logo changes
  useEffect(() => {
    setSourceIndex(0);
  }, [clientConfig.clientId, remoteLogoUrl]);

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
          onError={() => {
            if (sourceIndex < logoSources.length - 1) {
              setSourceIndex(prev => prev + 1);
            }
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