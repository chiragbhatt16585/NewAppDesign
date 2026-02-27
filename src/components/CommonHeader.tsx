import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ImageSourcePropType,
} from 'react-native';
import {useTheme} from '../utils/ThemeContext';
import {getThemeColors} from '../utils/themeStyles';
import {getClientConfig} from '../config/client-config';
import LogoImage from './LogoImage';

interface CommonHeaderProps {
  navigation: any;
  title?: string;
  showBackButton?: boolean;
  rightComponent?: React.ReactNode;
  onBackPress?: () => void;
  logoPosition?: 'left' | 'center';
}

const CommonHeader = ({
  navigation,
  title,
  showBackButton = true,
  rightComponent,
  onBackPress,
  logoPosition = 'center',
}: CommonHeaderProps) => {
  const {isDark} = useTheme();
  const colors = getThemeColors(isDark);
  const clientConfig = getClientConfig();
  const branding = clientConfig.branding;

  const handleBackPress = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      navigation.goBack();
    }
  };

  // Get top border color from config
  // - If headerBorderColors is not present at all → no border
  // - If headerBorderColors.top is undefined → no border
  // - If headerBorderColors.top is empty string '' → no border (transparent)
  // - If headerBorderColors.top has a color → use that color
  const headerBorderColors = branding.headerBorderColors;
  const topBorderColor = headerBorderColors?.top;
  const borderBottomColor = topBorderColor ? topBorderColor : 'transparent';
  const borderBottomWidth = topBorderColor ? 2 : 0;

  // Get header background image
  const getHeaderBackgroundImage = (): ImageSourcePropType | null => {
    const headerBgImage = branding.headerBackgroundImage;
    if (!headerBgImage) return null;

    const clientId = clientConfig.clientId;
    
    // Map client-specific background images
    // Only include mappings for clients that actually have header_background.png files
    // Add more entries here as you add header background images for other clients
    const backgroundImageMap: Record<string, ImageSourcePropType> = {
      'spacecom-live:header_background.png': require('../../config/spacecom-live/assets/header_background.png'),
      'linkway:header_background.png': require('../../config/linkway/assets/header_background.png'),
      'inshansa-dnagoa:header_background.png': require('../../config/inshansa-dnagoa/assets/header_background.png'),
      'successbroadband:header_background.png': require('../../config/successbroadband/assets/header_background.png'),
      'logon-broadband:header_background.png': require('../../config/logon-broadband/assets/header_background.png'),
      'dna-goa:header_background.png': require('../../config/dna-goa/assets/header_background.png'),
      'dna-infotel:header_background.png': require('../../config/dna-infotel/assets/header_background.png'),
      'netfix:header_background.png': require('../../config/netfix/assets/header_background.png'),
      'gatewayftth:header_background.png': require('../../config/gatewayftth/assets/header_background.png'),
      // 'logon-broadband:header_background.png': require('../../config/logon-broadband/assets/header_background.png'),
      // 'one-sevenstar:header_background.png': require('../../config/one-sevenstar/assets/header_background.png'),
      // 'netplanet:header_background.png': require('../../config/netplanet/assets/header_background.png'),
      // 'metanet:header_background.png': require('../../config/metanet/assets/header_background.png'),
    };

    const key = `${clientId}:${headerBgImage}`;
    return backgroundImageMap[key] || null;
  };

  const headerBackgroundImage = getHeaderBackgroundImage();
  
  // Clients that should use full-width header background image behavior
  const isHeaderBgClient =
    !!headerBackgroundImage &&
    (clientConfig.clientId === 'spacecom-live' ||
      clientConfig.clientId === 'linkway' ||
      clientConfig.clientId === 'inshansa-dnagoa' ||
      clientConfig.clientId === 'successbroadband' ||
      clientConfig.clientId === 'logon-broadband' ||
      clientConfig.clientId === 'dna-goa' ||
      clientConfig.clientId === 'dna-infotel' ||
      clientConfig.clientId === 'netfix' ||
      clientConfig.clientId === 'gatewayftth');

  // When there is no header background image, always show logo on the left.
  // When background image is active, respect the explicit logoPosition prop.
  const isLogoLeft = isHeaderBgClient ? logoPosition === 'left' : true;

  // Specific flag for Linkway header background behavior
  const isLinkwayHeaderBgClient =
    !!headerBackgroundImage && clientConfig.clientId === 'linkway';

  // Specific flag for Inshansa header background behavior (same as Linkway - centered logo)
  const isInshansaHeaderBgClient =
    !!headerBackgroundImage && clientConfig.clientId === 'inshansa-dnagoa';
  
  // Specific flag for Success Broadband header background behavior (same as Inshansa - centered logo)
  const isSuccessBroadbandHeaderBgClient =
    !!headerBackgroundImage && clientConfig.clientId === 'successbroadband';
  
  // Specific flag for Logon Broadband header background behavior (centered logo, moved upward)
  const isLogonBroadbandHeaderBgClient =
    !!headerBackgroundImage && clientConfig.clientId === 'logon-broadband';

  // dna-goa, dna-infotel, netfix, gatewayftth: grey header background, centered logo (same style as Inshansa)
  const isDnaGoaOrInfotelHeaderBgClient =
    !!headerBackgroundImage &&
    (clientConfig.clientId === 'dna-goa' ||
      clientConfig.clientId === 'dna-infotel' ||
      clientConfig.clientId === 'netfix' ||
      clientConfig.clientId === 'gatewayftth');

  // Hide logo only for spacecom-live when using header background image.
  // For linkway and inshansa-dnagoa, keep the logo visible (centered) over the background.
  const shouldHideLogo =
    !!headerBackgroundImage && clientConfig.clientId === 'spacecom-live';

  return (
    <View style={[
      styles.header,
      {
        backgroundColor: isHeaderBgClient ? 'transparent' : colors.surface,
        borderBottomColor,
        borderBottomWidth,
        // Header horizontal padding is configurable per client via branding.headerPaddingHorizontal
        paddingHorizontal: isHeaderBgClient
          ? 0
          : (branding.headerPaddingHorizontal ?? 12),
      },
    ]}>
      {/* Background Image - Let it determine header height, full width - only when header background is active */}
      {isHeaderBgClient && headerBackgroundImage && (
        <Image
          source={headerBackgroundImage}
          // Allow Linkway to have a slightly taller header background than others
          style={[
            styles.headerBackgroundImage,
            isLinkwayHeaderBgClient && styles.headerBackgroundImageLinkway,
          ]}
          resizeMode="cover"
        />
      )}
      {/* Content overlay - above background image */}
      <View style={[styles.headerContent, {
        position: isHeaderBgClient ? 'absolute' : 'relative',
        paddingHorizontal: 12, // Always have padding for content
      }]}>
        {/* Left section: Back button and logo (if logo is on left) */}
        <View style={[styles.headerLeft, {flex: isLogoLeft ? 1 : 0}]}>
          {showBackButton && (
            <TouchableOpacity
              style={[
                styles.backButton,
                {
                  backgroundColor: isHeaderBgClient
                    ? 'rgba(0,0,0,0.4)'
                    : colors.background,
                },
              ]}
              onPress={handleBackPress}>
              <Text
                style={[
                  styles.backButtonText,
                  {color: isHeaderBgClient ? '#FFFFFF' : colors.text},
                ]}>
                ‹
              </Text>
            </TouchableOpacity>
          )}
          {isLogoLeft && !shouldHideLogo && (
            <View
              style={[
                styles.logoContainer,
                // Logo right margin is configurable per client via branding.headerLogoMarginRight
                branding.headerLogoMarginRight !== undefined && {
                  marginRight: branding.headerLogoMarginRight,
                },
              ]}>
              <LogoImage type="header" />
            </View>
          )}
        </View>
        
        {/* Center section: Logo (if centered) or Title */}
        {isLogoLeft ? (
          title ? (
            <View style={styles.headerCenter}>
              <Text
                style={[
                  styles.headerTitle,
                  {color: isHeaderBgClient ? '#FFFFFF' : colors.text},
                ]}>
                {title}
              </Text>
            </View>
          ) : (
            <View style={styles.headerCenter} />
          )
        ) : (
          <View
            style={[
              styles.headerCenter,
              (isLinkwayHeaderBgClient || isInshansaHeaderBgClient || isSuccessBroadbandHeaderBgClient || isDnaGoaOrInfotelHeaderBgClient) && styles.headerCenterLinkway,
              isLogonBroadbandHeaderBgClient && styles.headerCenterLogonBroadband,
            ]}>
            {!shouldHideLogo && <LogoImage type="header" />}
          </View>
        )}
        
        {/* Right section: Custom component or placeholder */}
        {rightComponent ? (
          rightComponent
        ) : (
          <View style={styles.placeholder} />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12, // Default padding, will be overridden when background image is present
    paddingTop: 0,
    paddingBottom: 0,
    // Default: no bottom border; enabled only when configured via headerBorderColors.top
    borderBottomWidth: 0,
    overflow: 'hidden', // Ensure background image doesn't overflow
    position: 'relative',
    // Let the background image determine the height naturally
  },
  headerBackgroundImage: {
    width: '100%',
    height: undefined,
    aspectRatio: 3.6, // Default: shorter header (wider aspect ratio = shorter height)
    maxHeight: 180, // Default maximum height
    zIndex: 0, // Behind all content
    alignSelf: 'stretch', // Ensure it stretches to full width
  },
  // Linkway-specific: make header background a bit taller
  headerBackgroundImageLinkway: {
    // Slightly shorter than before to reduce overall header height
    aspectRatio: 3.4,
    maxHeight: 190,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingVertical: 12,
    zIndex: 1, // Above background image
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  backButtonText: {
    fontSize: 24,
  },
  logoContainer: {
    marginRight: 8,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Fine-tune vertical logo placement when using header background for Linkway
  headerCenterLinkway: {
    marginTop: -16, // Move logo a bit more upwards to reduce extra space below
  },
  // Fine-tune vertical logo placement when using header background for Logon Broadband
  headerCenterLogonBroadband: {
    marginTop: -20, // Move logo upward in the header
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 40,
  },
});

export default CommonHeader; 