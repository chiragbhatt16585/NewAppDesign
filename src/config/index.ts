import { Platform } from 'react-native';
import { getClientConfig } from './client-config';

// Client configuration interface
export interface ClientConfig {
  name: string;
  companyName: string;
  apiUrl: string;
  supportEmail: string;
  website: string;
  poweredBy: string;
  poweredByWebsite: string;
  bundleId: string;
}

// Detect current client based on bundle ID
const getCurrentClient = (): string => {
  try {
    const cfg = getClientConfig();
    return cfg.clientId;
  } catch (e) {
    try {
      const raw = require('./current-client.json');
      return raw?.clientId || 'microscan';
    } catch {
      return 'microscan';
    }
  }
};

// Client configurations
const clientConfigs: Record<string, ClientConfig> = {
  microscan: {
    name: 'Microscan',
    companyName: 'Microscan Internet Private Limited',
    apiUrl: 'https://mydesk.microscan.co.in',
    supportEmail: 'support@microscan.in',
    website: 'https://www.microscan.co.in/',
    poweredBy: 'Spacecom Software LLP',
    poweredByWebsite: 'https://spacecom.in',
    bundleId: 'com.microscan.app',
  },
  'dna-infotel': {
    name: 'DNA Infotel App',
    companyName: 'DNA Infotel Private Limited',
    apiUrl: 'https://crm.dnainfotel.com',
    supportEmail: 'support@dnainfotel.com',
    website: 'https://dnainfotel.com',
    poweredBy: 'Spacecom Software LLP',
    poweredByWebsite: 'https://spacecom.in',
    bundleId: 'com.h8.dnasubscriber',
  },
  'one-sevenstar': {
    name: 'One Seven Star',
    companyName: 'Seven Star Balaji Broadband Pvt Ltd',
    apiUrl: 'https://one.7stardigitalnetwork.com',
    supportEmail: 'info@one7star.com',
    website: 'https://one.7stardigitalnetwork.com',
    poweredBy: 'Spacecom Software LLP',
    poweredByWebsite: 'https://spacecom.in',
    bundleId: 'com.spacecom.log2space.onesevenstar',
  },
  linkway: {
    name: 'Linkway',
    companyName: 'Linkway Internet Private Limited',
    apiUrl: 'https://linkway.l2s.biz',
    supportEmail: 'linkwaybrodband@gmail.com',
    website: 'https://www.linkway.co.in/',
    poweredBy: 'Spacecom Software LLP',
    poweredByWebsite: 'https://spacecom.in',
    bundleId: 'com.spacecom.log2space.linkway',
  },
};

// Export current client configuration
export const CLIENT_CONFIG: ClientConfig = clientConfigs[getCurrentClient()] || clientConfigs.microscan;

// Helper functions
export const getClientName = (): string => CLIENT_CONFIG.name;
export const getCompanyName = (): string => CLIENT_CONFIG.companyName;
export const getApiUrl = (): string => CLIENT_CONFIG.apiUrl;
export const getSupportEmail = (): string => CLIENT_CONFIG.supportEmail;
export const getWebsite = (): string => {
  const id = getCurrentClient();
  const cfg = clientConfigs[id] || CLIENT_CONFIG;
  return cfg.website;
};
export const getPoweredBy = (): string => CLIENT_CONFIG.poweredBy;
export const getPoweredByWebsite = (): string => CLIENT_CONFIG.poweredByWebsite; 