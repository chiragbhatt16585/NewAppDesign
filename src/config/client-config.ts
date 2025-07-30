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
  contact: {
    gstin?: string;
    whatsappNumber?: string;
    headOffice: {
      title: string;
      address: string;
      customerSupport?: string;
      customerSupportHours?: string;
      corporateLandline?: string;
      corporateHours?: string;
    };
    branchOffices: Array<{
      title: string;
      address: string;
      corporateLandline?: string;
      corporateHours?: string;
    }>;
    enterpriseEscalation?: {
      title: string;
      l1?: {
        level: string;
        email: string;
        phone?: string;
      };
      l2?: {
        level: string;
        email: string;
      };
      l3?: {
        level: string;
        emails: string[];
      };
    };
    emails?: {
      inquiries?: string;
      sales?: string;
      support?: string;
    };
    tollFree?: string;
    landline?: string;
  };
  reviewUrl?: string;
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
        contact: {
        gstin: '27AABCM4852A1ZT',
        whatsappNumber: '+91 9930793707',
        headOffice: {
          title: 'Head Office - Mumbai',
          address: 'A/301-303, Everest Grande, Mahakali Caves Road, Andheri (East), Mumbai – 400 093',
          customerSupport: '+91 22-6969-0000',
          customerSupportHours: 'Mon – Sun | 24x7',
          corporateLandline: '+91 22-6687-0600',
          corporateHours: 'Mon – Fri | 9:30 a.m. to 6:30 p.m.',
        },
        branchOffices: [
          {
            title: 'Branch Office - Pune',
            address: 'A/101, Teerth Technospace, Mumbai-Bengaluru Highway, Baner, Pune, Maharashtra-411045',
            corporateLandline: '+91 020-6311-1555',
            corporateHours: 'Mon – Fri | 9:30 a.m. to 6:30 p.m.',
          },
        ],
        enterpriseEscalation: {
          title: 'Enterprise Escalation Matrix',
          l1: {
            level: 'L1 - Call Centre',
            email: 'enterprise.support@microscan.co.in',
            phone: '022-69690001',
          },
          l2: {
            level: 'L2 - Shift lead',
            email: 'Enoc.Shiftlead@microscan.co.in',
          },
          l3: {
            level: 'L3 - Rohan Nakhawa / Santosh / Niwant',
            emails: [
              'rohan.nakhawa@microscan.co.in',
              'santosh@microscan.co.in',
              'rakshikar@microscan.co.in'
            ],
          },
        },
      },
      reviewUrl: 'https://play.google.com/store/apps/details?id=com.h8.dnasubscriber',
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
      contact: {
        headOffice: {
          title: 'Head Office',
          address: '2nd  Floor, Icchapurti Sai Building, Near Saibaba Temple, Gaothan Road, Virar – West, Palghar- 401303',
        },
        branchOffices: [
          {
            title: 'Branch Office - Nallasopara (E)',
            address: 'Ground Floor, Sai Kiran Building, Tulinj Rd, near Utsav Hotel, Nalasopara East, Maharashtra 401209',
          },
          {
            title: 'Branch Office - Nallasopara (W)',
            address: 'Shop No.8, Neelganga Apartment, Sriprastha Complex, Opp to Jyoti Bungalow, Shanti Park, Nallasopara (West) - 401203',
          },
          {
            title: 'Branch Office - Virar (W)',
            address: 'Shop No.2, Ground Floor, Vishnu Sanmale, Umbergothan, Post - Agashi, Virar (West), Dist : Palghar - 401301',
          },
        ],
        emails: {
          inquiries: 'crm@dnainfotel.com',
          sales: 'sales@dnainfotel.com',
        },
        tollFree: '1800-313-6345',
        landline: '0250-6635100',
      },
      reviewUrl: 'https://g.page/r/CSrSiBGUlFE_EB0/review',
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
    contact: {
      gstin: '29AAFCM000000002',
      whatsappNumber: '+919876543212',
      headOffice: {
        title: 'Head Office',
        address: '123 Main St, City, Country',
        customerSupport: 'support@one-sevenstar.com',
        customerSupportHours: 'Mon-Fri 9:00 AM - 6:00 PM',
        corporateLandline: '+91-123-4567892',
        corporateHours: 'Mon-Fri 9:00 AM - 6:00 PM',
      },
      branchOffices: [
        {
          title: 'Branch 1',
          address: '456 Oak Ave, City, Country',
          corporateLandline: '+91-987-6543212',
          corporateHours: 'Mon-Fri 9:00 AM - 6:00 PM',
        },
        {
          title: 'Branch 2',
          address: '789 Pine Ln, City, Country',
          corporateLandline: '+91-112-3456781',
          corporateHours: 'Mon-Fri 9:00 AM - 6:00 PM',
        },
      ],
      enterpriseEscalation: {
        title: 'Enterprise Escalation',
        l1: {
          level: 'Level 1',
          email: 'l1@one-sevenstar.com',
          phone: '+91-111-2222224',
        },
        l2: {
          level: 'Level 2',
          email: 'l2@one-sevenstar.com',
        },
        l3: {
          level: 'Level 3',
          emails: ['l3@one-sevenstar.com'],
        },
      },
      emails: {
        inquiries: 'inquiries@one-sevenstar.com',
        sales: 'sales@one-sevenstar.com',
        support: 'support@one-sevenstar.com',
      },
      tollFree: '+91-800-123-4569',
      landline: '+91-123-4567892',
    },
    reviewUrl: 'https://play.google.com/store/apps/details?id=com.h8.dnasubscriber',
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
  
  // console.log('=== CLIENT CONFIG DEBUG ===');
  // console.log('Current client:', currentClient);
  // console.log('Environment CLIENT_ID:', process.env.CLIENT_ID);
  
  const config = clientConfigs[currentClient];
  if (!config) {
    throw new Error(`Unknown client: ${currentClient}`);
  }
  
  // console.log('Selected config:', {
  //   clientId: config.clientId,
  //   clientName: config.clientName,
  //   apiBaseURL: config.api.baseURL
  // });
  // console.log('=== END CLIENT CONFIG DEBUG ===');
  
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