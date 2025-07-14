// Client Configuration Types
export interface ClientConfig {
  clientId: string;
  clientName: string;
  api: {
    baseURL: string;
    timeout: number;
  };
  branding: {
    logo: string;
    primaryColor: string;
    secondaryColor: string;
    appName: string;
  };
  features: {
    biometricAuth: boolean;
    pushNotifications: boolean;
    fileUpload: boolean;
    multiLanguage: boolean;
  };
}

// Client configurations
const clientConfigs: Record<string, ClientConfig> = {
  microscan: {
    clientId: 'microscan',
    clientName: 'Microscan',
    api: {
      baseURL: 'mydesk.microscan.co.in/l2s/api',
      timeout: 30000,
    },
    branding: {
      logo: 'microscan_logo.png',
      primaryColor: '#2196F3',
      secondaryColor: '#FFC107',
      appName: 'Microscan',
    },
    features: {
      biometricAuth: true,
      pushNotifications: true,
      fileUpload: true,
      multiLanguage: true,
    },
  },
  'dna-infotel': {
    clientId: 'dna-infotel',
    clientName: 'DNA Infotel',
    api: {
      baseURL: 'https://crm.dnainfotel.com/l2s/api',
      timeout: 30000,
    },
    branding: {
      logo: 'dna_logo.png',
      primaryColor: '#4CAF50',
      secondaryColor: '#FF9800',
      appName: 'DNA Infotel',
    },
    features: {
      biometricAuth: true,
      pushNotifications: true,
      fileUpload: true,
      multiLanguage: true,
    },
  },
  'one-sevenstar': {
    clientId: 'one-sevenstar',
    clientName: 'One Seven Star',
    api: {
      baseURL: 'one.7stardigitalnetwork.com/l2s/api',
      timeout: 30000,
    },
    branding: {
      logo: 'isp_logo.png',
      primaryColor: '#1976D2',
      secondaryColor: '#FF5722',
      appName: 'One Seven Star',
    },
    features: {
      biometricAuth: true,
      pushNotifications: true,
      fileUpload: true,
      multiLanguage: true,
    },
  },
};

// Get current client configuration
export const getClientConfig = (): ClientConfig => {
  // You can determine the current client in several ways:
  // 1. From environment variable
  // 2. From build-time configuration
  // 3. From runtime detection
  
  // For now, let's use a simple approach - you can enhance this
  const currentClient = process.env.CLIENT_ID || 'dna-infotel';
  
  console.log('=== CLIENT CONFIG DEBUG ===');
  console.log('Current client:', currentClient);
  console.log('Environment CLIENT_ID:', process.env.CLIENT_ID);
  
  const config = clientConfigs[currentClient];
  if (!config) {
    throw new Error(`Unknown client: ${currentClient}`);
  }
  
  console.log('Selected config:', {
    clientId: config.clientId,
    clientName: config.clientName,
    apiBaseURL: config.api.baseURL
  });
  console.log('=== END CLIENT CONFIG DEBUG ===');
  
  return config;
};

// Get configuration for a specific client
export const getClientConfigById = (clientId: string): ClientConfig => {
  const config = clientConfigs[clientId];
  if (!config) {
    throw new Error(`Unknown client: ${clientId}`);
  }
  return config;
};

// Get all available clients
export const getAvailableClients = (): string[] => {
  return Object.keys(clientConfigs);
};

// Validate client configuration
export const validateClientConfig = (config: ClientConfig): boolean => {
  return !!(
    config.clientId &&
    config.clientName &&
    config.api?.baseURL &&
    config.branding?.appName
  );
};

// Get client-specific strings
export const getClientStrings = (clientId?: string) => {
  const client = clientId || getClientConfig().clientId;
  const strings = require('./client-strings.json');
  return strings[client] || strings.microscan;
};

// Export default configuration
export default getClientConfig; 