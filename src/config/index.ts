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
    website: 'https://www.microscaninternet.com/',
    poweredBy: 'Spacecom Software LLP',
    poweredByWebsite: 'https://spacecom.in',
    bundleId: 'in.spacecom.log2space.client.microscan',
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
  'dna-goa': {
    name: 'DNA Goa',
    companyName: 'DNA Goa',
    apiUrl: 'https://crm.dnagoa.com',
    supportEmail: 'sales@dnagoa.com',
    website: 'https://dnagoa.com/',
    poweredBy: 'Spacecom Software LLP',
    poweredByWebsite: 'https://spacecom.in',
    bundleId: 'com.spacecom.log2space.dnagoa',
  },
  graceway: {
    name: 'Graceway',
    companyName: 'Graceway Infrastructure & Services Pvt. Ltd.',
    apiUrl: 'https://graceway.l2s.biz',
    supportEmail: 'info@graceway.co.in',
    website: 'https://www.graceway.co.in/',
    poweredBy: 'Spacecom Software LLP',
    poweredByWebsite: 'https://spacecom.in',
    bundleId: 'com.spacecom.log2space.graceway',
  },
  'log2space-common': {
    name: 'Log2space',
    companyName: 'Log2space',
    apiUrl: 'https://log2space-common.l2s.biz',
    supportEmail: 'support@log2space.in',
    website: 'https://spacecom.in',
    poweredBy: 'Spacecom Software LLP',
    poweredByWebsite: 'https://spacecom.in',
    bundleId: 'in.spacecom.log2space.user',
  },
  netfix: {
    name: 'Netfix',
    companyName: 'NETFIX NETWORKS (OPC) PVT LTD',
    apiUrl: 'https://nnpl.l2s.biz',
    supportEmail: 'info@netfixnetworks.in',
    website: 'https://netfix.org.in/',
    poweredBy: 'Spacecom Software LLP',
    poweredByWebsite: 'https://spacecom.in',
    bundleId: 'in.spacecom.log2space.client.netfix',
  },
  'inshansa-dnagoa': {
    name: 'Inshansa',
    companyName: 'Inshansa',
    apiUrl: 'https://inshansa.dnabroadband.com',
    supportEmail: 'crm@dnagoa.com',
    website: 'https://dnagoa.com/',
    poweredBy: 'Spacecom Software LLP',
    poweredByWebsite: 'https://spacecom.in',
    bundleId: 'com.spacecom.log2space.inshansa',
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
  netplanet: {
    name: 'Net Planet',
    companyName: 'Net Planet',
    apiUrl: 'https://netplanet.l2s.biz/l2s/api',
    supportEmail: 'netplanetservices@gmail.com',
    website: '', // No website for Net Planet
    poweredBy: 'Spacecom Software LLP',
    poweredByWebsite: 'https://spacecom.in',
    bundleId: 'com.spacecom.log2space.netplanet',
  },
  'spacecom-local': {
    name: 'Spacecom Local',
    companyName: 'Spacecom Local',
    apiUrl: 'http://103.105.110.250:81',
    supportEmail: 'support@spacecom.in',
    website: 'https://spacecom.in',
    poweredBy: 'Spacecom Software LLP',
    poweredByWebsite: 'https://spacecom.in',
    bundleId: 'com.log2space.spacecom.local',
  },
  'threesa-infoway': {
    name: 'Threesa Infoway',
    companyName: 'Threesa Private Limited',
    apiUrl: 'https://login.threesainfoway.net',
    supportEmail: 'info@threesainfoway.net',
    website: 'https://threesainfoway.net/',
    poweredBy: 'Spacecom Software LLP',
    poweredByWebsite: 'https://spacecom.in',
    bundleId: 'in.spacecom.log2space.client.threesa',
  },
  'spacecom-live': {
    name: 'Spacecom Live',
    companyName: 'Spacecom Software LLP',
    apiUrl: 'https://newbalaji.l2s.biz',
    supportEmail: 'info@spacecom.in',
    website: 'https://spacecom.in',
    poweredBy: 'Spacecom Software LLP',
    poweredByWebsite: 'https://spacecom.in',
    bundleId: 'com.spacecom.log2space.spacecomlive',
  },
  'logon-broadband': {
    name: 'Logon Broadband',
    companyName: 'Logon Broadband',
    apiUrl: 'https://admin.logonbroadband.com',
    supportEmail: 'support@logonbroadband.com',
    website: 'https://logonbroadband.com',
    poweredBy: 'Spacecom Software LLP',
    poweredByWebsite: 'https://spacecom.in',
    bundleId: 'com.spacecom.log2space.logonbrodband',
  },
  successbroadband: {
    name: 'Success Broadband',
    companyName: 'Success Broadband',
    apiUrl: 'https://successbroadband.l2s.biz',
    supportEmail: 'sucessbroadband2020@gmail.com',
    website: 'https://successbroadband.in',
    poweredBy: 'Spacecom Software LLP',
    poweredByWebsite: 'https://spacecom.in',
    bundleId: 'com.spacecom.log2space.successbroadband',
  },
  skynetwifi: {
    name: 'Skynetwifi',
    companyName: 'Skynetwifi',
    apiUrl: 'https://skynetwifi.l2s.biz',
    supportEmail: 'helloskynetwifi@gmail.com',
    website: 'https://skynetwifi.in/',
    poweredBy: 'Spacecom Software LLP',
    poweredByWebsite: 'https://spacecom.in',
    bundleId: 'com.spacecom.log2space.skynetwifi',
  },
  metanet: {
    name: 'Metanet',
    companyName: 'Metanet Broadband Services',
    apiUrl: 'https://metanet.l2s.biz',
    supportEmail: 'metanet.isp@gmail.com',
    website: '', // Hidden for now
    poweredBy: 'Spacecom Software LLP',
    poweredByWebsite: 'https://spacecom.in',
    bundleId: 'com.spacecom.log2space.metanet',
  },
  comcast: {
    name: 'Comcast',
    companyName: 'Comcast Broadband Services',
    apiUrl: 'https://comcast.l2s.biz',
    supportEmail: 'support@comcastnetworks.in',
    website: 'https://www.comcastnetworks.in',
    poweredBy: 'Spacecom Software LLP',
    poweredByWebsite: 'https://spacecom.in',
    bundleId: 'in.spacecom.log2space.client.comcastBroadband',
  },
  monarknet: {
    name: 'Monark Broadband',
    companyName: 'Monark Broadband Pvt Ltd',
    apiUrl: 'https://monarknet.l2s.biz',
    supportEmail: 'info@monarkbroadband.in',
    website: 'https://monarknet.l2s.biz',
    poweredBy: 'Spacecom Software LLP',
    poweredByWebsite: 'https://spacecom.in',
    bundleId: 'in.spacecom.log2space.client.monarkuser',
  },
  funnet: {
    name: 'Funnet',
    companyName: 'Delix Net Solutions Pvt Ltd',
    apiUrl: 'https://funnet.l2s.biz',
    supportEmail: 'accounts@delix.in',
    website: 'https://funnet.l2s.biz',
    poweredBy: 'Spacecom Software LLP',
    poweredByWebsite: 'https://spacecom.in',
    bundleId: 'com.spacecom.log2space.funnet',
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
  try {
    // First, try to get website from the new client-config.ts
    const clientConfig = getClientConfig();
    if (clientConfig.website) {
      return clientConfig.website;
    }
  } catch (e) {
    // Fall through to old config if new config fails
  }
  
  // Fallback to old hardcoded configs
  const id = getCurrentClient();
  const cfg = clientConfigs[id] || CLIENT_CONFIG;
  return cfg.website;
};
export const getPoweredBy = (): string => CLIENT_CONFIG.poweredBy;
export const getPoweredByWebsite = (): string => CLIENT_CONFIG.poweredByWebsite; 