import { Platform } from 'react-native';

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
  // This would be determined by the bundle ID or build configuration
  // For now, we'll use a simple approach
  return 'microscan'; // Default to microscan
};

// Client configurations
const clientConfigs: Record<string, ClientConfig> = {
  microscan: {
    name: 'Microscan ISP App',
    companyName: 'Microscan Internet Private Limited',
    apiUrl: 'https://mydesk.microscan.co.in',
    supportEmail: 'support@microscan.in',
    website: 'https://microscan.in',
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
};

// Export current client configuration
export const CLIENT_CONFIG: ClientConfig = clientConfigs[getCurrentClient()] || clientConfigs.microscan;

// Helper functions
export const getClientName = (): string => CLIENT_CONFIG.name;
export const getCompanyName = (): string => CLIENT_CONFIG.companyName;
export const getApiUrl = (): string => CLIENT_CONFIG.apiUrl;
export const getSupportEmail = (): string => CLIENT_CONFIG.supportEmail;
export const getWebsite = (): string => CLIENT_CONFIG.website;
export const getPoweredBy = (): string => CLIENT_CONFIG.poweredBy;
export const getPoweredByWebsite = (): string => CLIENT_CONFIG.poweredByWebsite; 