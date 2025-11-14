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
  about: {
    companyName: string;
    establishedYear: string;
    description: string;
    specializations: string[];
    serviceAreas: string[];
    achievements: string[];
  };
  reviewUrl?: string;
  versionCheck?: {
    enabled: boolean;
    checkInterval: number; // in hours
    forceUpdateEnabled: boolean;
    appStoreId?: string; // for iOS
    packageName?: string; // for Android
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
      primaryColor: '#FF791F',
      secondaryColor: '#FFA64D',
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
      about: {
        companyName: 'MICROSCAN',
        establishedYear: '2010',
        description: 'Microscan is a leading internet service provider committed to delivering high-quality broadband services to residential and business customers.',
        specializations: [
          'High-speed broadband internet',
          'Fiber optic technology',
          'Business internet solutions',
          '24/7 customer support'
        ],
        serviceAreas: [
          'Mumbai Metropolitan Region',
          'Pune and surrounding areas',
          'Maharashtra state'
        ],
        achievements: [
          'Trusted by thousands of customers',
          'Award-winning customer service',
          'Continuous network expansion'
        ],
      },
      reviewUrl: 'https://play.google.com/store/apps/details?id=com.h8.dnasubscriber',
      versionCheck: {
        enabled: true,
        checkInterval: 24, // Check every 24 hours
        forceUpdateEnabled: true,
        packageName: 'com.h8.dnasubscriber',
        appStoreId: '1559045355',
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
        primaryColor: '#1976D2',
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
      about: {
        companyName: 'DNA INFOTEL PVT LTD',
        establishedYear: '2008',
        description: 'A brand Established in the year 2008, in association with M/s Digital Network Associates PVT LTD also known as "DNA". We have our services operating extensively from Vasai to Virar Region includes Highway and coastal region.',
        specializations: [
          'Hi-Speed Broadband Internet connection',
          'GePON/GPON technology (FTTH - Fibre to the Home)',
          'Leased Line connections for Small, Medium and large scale enterprises'
        ],
        serviceAreas: [
          'Vasai to Virar Region',
          'Highway region',
          'Coastal region'
        ],
        achievements: [
          'Successfully reached to a prominent broadband supplier',
          'Extensive service coverage across multiple regions',
          'Latest technology implementation'
        ],
      },
      reviewUrl: 'https://g.page/r/CSrSiBGUlFE_EB0/review',
      versionCheck: {
        enabled: true,
        checkInterval: 24, // Check every 24 hours
        forceUpdateEnabled: true,
        packageName: 'com.h8.dnasubscriber',
        appStoreId: '1559045355',
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
    about: {
      companyName: 'ONE SEVEN STAR',
      establishedYear: '2015',
      description: 'One Seven Star is a dynamic internet service provider focused on delivering reliable and fast internet connectivity to homes and businesses.',
      specializations: [
        'High-speed internet services',
        'Fiber optic networks',
        'Business internet solutions',
        'Customer-focused service'
      ],
      serviceAreas: [
        'Multiple cities across India',
        'Urban and rural areas',
        'Business districts'
      ],
      achievements: [
        'Growing customer base',
        'Innovative service offerings',
        'Reliable network infrastructure'
      ],
    },
    reviewUrl: 'https://play.google.com/store/apps/details?id=com.h8.dnasubscriber',
    versionCheck: {
      enabled: true,
      checkInterval: 24, // Check every 24 hours
      forceUpdateEnabled: true,
      packageName: 'com.h8.dnasubscriber',
      appStoreId: '123456789',
    },
  },
  'logon-broadband': {
    clientId: 'logon-broadband',
    clientName: 'Logon Broadband',
    api: {
      baseURL: 'https://admin.logonbroadband.com/l2s/api',
      timeout: 30000,
    },
    branding: {
      logo: 'isp_logo.png',
      primaryColor: '#1976D2',
      secondaryColor: '#42A5F5',
      appName: 'Logon Broadband',
    },
    features: {
      biometricAuth: true,
      pushNotifications: true,
      fileUpload: true,
      multiLanguage: true,
    },
    contact: {
      whatsappNumber: '+91 7208065651',
      landline: '+91 22 50508000',
      headOffice: {
        title: 'Head Office',
        address: '003, Logon Broadband, Laxman Nagar, Kurar Village, Malad East, Mumbai, Maharashtra',
      },
      branchOffices: [],
    },
    about: {
      companyName: 'Logon Broadband',
      establishedYear: '2024',
      description: 'Logon Broadband is an internet service provider.',
      specializations: [
        'Broadband internet services',
        'Fiber connectivity',
      ],
      serviceAreas: [],
      achievements: [],
    },
    reviewUrl: undefined,
    versionCheck: {
      enabled: true,
      checkInterval: 24,
      forceUpdateEnabled: true,
      packageName: 'com.spacecom.log2space.logonbrodband',
      appStoreId: '1234567890',
    },
  },
  'linkway': {
    clientId: 'linkway',
    clientName: 'Linkway',
    api: {
      baseURL: 'https://linkway.l2s.biz/l2s/api',
      timeout: 30000,
    },
    branding: {
      logo: 'isp_logo.png',
      primaryColor: '#1976D2',
      secondaryColor: '#42A5F5',
      appName: 'Linkway',
    },
    features: {
      biometricAuth: true,
      pushNotifications: true,
      fileUpload: true,
      multiLanguage: true,
    },
    contact: {
      whatsappNumber: '9970695360',
      headOffice: {
        title: 'Head Office',
        address: 'OFFICE NO.15, Karan- A, Majithia Park, Achole Rd, Nalasopara East, Maharashtra 401209',
        customerSupport: '9970695360',
        customerSupportHours: 'Mon-Fri 9:00 AM - 6:00 PM',
      },
      branchOffices: [],
      emails: {
        inquiries: 'linkwaybrodband@gmail.com',
        sales: 'linkwaybrodband@gmail.com',
        support: 'linkwaybrodband@gmail.com',
      },
    },
    about: {
      companyName: 'Linkway',
      establishedYear: '2024',
      description: 'Linkway is an internet service provider committed to delivering high-quality broadband services.',
      specializations: [
        'High-speed broadband internet',
        'Fiber optic technology',
        'Business internet solutions',
        '24/7 customer support'
      ],
      serviceAreas: [
        'Nalasopara East',
        'Maharashtra',
        'Surrounding areas'
      ],
      achievements: [
        'Reliable internet services',
        'Customer-focused approach',
        'Modern technology implementation'
      ],
    },
    reviewUrl: undefined,
    versionCheck: {
      enabled: true,
      checkInterval: 24,
      forceUpdateEnabled: true,
      packageName: 'com.spacecom.log2space.linkway',
      appStoreId: '1234567890',
    },
  },
};

// Get current client configuration
export const getClientConfig = (): ClientConfig => {
  // Read current client from configuration file
  let currentClient = 'dna-infotel'; // fallback
  
  try {
    const currentClientConfig = require('./current-client.json');
    currentClient = currentClientConfig.clientId;
  } catch (error) {
    // If file doesn't exist or can't be read, use fallback
    console.warn('Could not read current-client.json, using fallback:', currentClient);
  }
  
  const config = clientConfigs[currentClient];
  if (!config) {
    throw new Error(`Unknown client: ${currentClient}`);
  }
  
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