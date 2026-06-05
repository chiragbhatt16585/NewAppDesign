import { ImageSourcePropType } from 'react-native';
import { TroubleshootingImageMap } from '../types/troubleshooting';

/**
 * Maps JSON `images` keys to bundled assets.
 * React Native requires static require() — add new keys here when you add PNGs.
 * Source: Self Diagnosis - Microscan Recharge & Support (Downloads)
 */
export const troubleshootingImageMap: TroubleshootingImageMap = {
  'router-lights': require('../assets/troubleshooting/router-lights.png'),
  'power-setup': require('../assets/troubleshooting/power-setup.png'),
  'wan-lights': require('../assets/troubleshooting/wan-lights.png'),
  'restart-router-30secs': require('../assets/troubleshooting/restart-router-30secs.png'),
  'restart-router-2mins': require('../assets/troubleshooting/restart-router-2mins.png'),
  'check-cables': require('../assets/troubleshooting/check-cables.png'),
  'slow-connected-devices': require('../assets/troubleshooting/slow-connected-devices.png'),
  'disconnect-connect': require('../assets/troubleshooting/disconnect-connect.png'),
  'website-try-browser': require('../assets/troubleshooting/website-try-browser.png'),
  'website-clear-data': require('../assets/troubleshooting/website-clear-data.png'),
  'website-incognito': require('../assets/troubleshooting/website-incognito.png'),
  'website-mobile-internet': require('../assets/troubleshooting/website-mobile-internet.png'),
  'website-final-step': require('../assets/troubleshooting/website-final-step.png'),
};

export function resolveTroubleshootingImages(
  imageKeys?: string[],
): ImageSourcePropType[] {
  if (!imageKeys?.length) return [];
  return imageKeys
    .map(key => troubleshootingImageMap[key])
    .filter(Boolean) as ImageSourcePropType[];
}
