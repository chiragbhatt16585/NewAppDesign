// Client Configuration Types
export interface ClientConfig {
  clientId: string;
  clientName: string;
  api: {
    // Full API base URL including path (existing usage)
    baseURL: string;
    // New: server URL without the `/l2s/api` path, for more flexible usage
    serverURL: string;
    timeout: number;
  };
  branding: {
    logo: string;
    primaryColor: string;
    secondaryColor: string;
    appName: string;
    // Optional: UI tuning per client
    headerPaddingHorizontal?: number; // Horizontal padding inside CommonHeader
    headerLogoMarginRight?: number; // Space after the logo in CommonHeader
    headerBorderColors?: {
      left?: string; // Left border color (empty string to disable)
      top?: string; // Top/upper border color (empty string to disable)
    };
    headerBackgroundImage?: string; // Header background image filename (e.g., 'header_background.png')
    logoDimensions?: {
      login?: {
        width: number;
        height: number;
      };
      header?: {
        width: number;
        height: number;
      };
    };
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
        emails: string[];
        phone?: string;
      };
      l2?: {
        level: string;
        emails: string[];
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
  website?: string;
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
      serverURL: 'mydesk.microscan.co.in',
      timeout: 30000,
    },
    branding: {
      logo: 'isp_logo.png',
      primaryColor: '#FF791F',
      secondaryColor: '#FF791F',
      appName: 'Microscan',
      headerBorderColors: {
        left: '', // Empty string to disable left border
        top: '', // Empty string to disable top border
      },
    },
    features: {
      biometricAuth: false,
      pushNotifications: true,
      fileUpload: true,
      multiLanguage: true,
    },
    contact: {
        gstin: '27AABCM4852A1ZT',
        //whatsappNumber: '+91 9930793707',
        headOffice: {
          title: 'Head Office - Mumbai',
          address: 'A/301-303, Everest Grande, Mahakali Caves Road, Andheri (East), Mumbai – 400 093',
          customerSupport: '+91 22-6969-0000',
          customerSupportHours: 'Mon – Sun | 24x7',
          //corporateLandline: '+91 22-6687-0600',
          corporateHours: 'Mon – Fri | 9:30 a.m. to 6:30 p.m.',
        },
        emails: {
          support: 'customersupport@microscaninternet.com',
        },
        branchOffices: [
          {
            title: 'Branch Office - Pune',
            address: 'A/101, Teerth Technospace, Mumbai-Bengaluru Highway, Baner, Pune, Maharashtra-411045',
            //corporateLandline: '+91 020-6311-1555',
            corporateHours: 'Mon – Fri | 9:30 a.m. to 6:30 p.m.',
          },
        ],
        enterpriseEscalation: {
          title: 'Enterprise Escalation Matrix',
          l1: {
            level: 'L1 - Call Centre - (Call Centre : 24x7)',
            emails: ['customersupport@microscaninternet.com'],
            phone: '+91 22-6969-0000',
          },
          l2: {
            level: 'L2 - Call Centre Operational TL',
            emails: ['aniket.rane@microscaninternet.com'],
          },
          l3: {
            level: 'L3 - Customer Support HOD',
            emails: ['avantika.sidana@microscan.co.in'],
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
    reviewUrl: 'https://play.google.com/store/apps/details?id=in.spacecom.log2space.client.microscan',
    website: 'https://www.microscaninternet.com/',
    versionCheck: {
      enabled: true,
      checkInterval: 24, // Check every 24 hours
      forceUpdateEnabled: true,
      packageName: 'in.spacecom.log2space.client.microscan',
      appStoreId: '1526127574',
    },
  },
  'spacecom-local': {
    clientId: 'spacecom-local',
    clientName: 'Spacecom Local',
    api: {
      baseURL: 'http://103.105.110.250:81/l2s/api',
      serverURL: 'http://103.105.110.250:81',
      timeout: 30000,
    },
    branding: {
      logo: 'isp_logo.png',
      primaryColor: '#1976D2',
      secondaryColor: '#42A5F5',
      appName: 'Spacecom Local',
      headerBackgroundImage: 'header_background.png',
      logoDimensions: {
        header: { width: 200, height: 140 },
        login: { width: 300, height: 200 },
      },
    },
    features: {
      biometricAuth: true,
      pushNotifications: true,
      fileUpload: true,
      multiLanguage: true,
    },
    contact: {
      gstin: '27AABCM4852A1ZT',
      headOffice: {
        title: 'Head Office - Mumbai',
        address: 'A/301-303, Everest Grande, Mahakali Caves Road, Andheri (East), Mumbai – 400 093',
        customerSupport: '+91 22-6969-0000',
        customerSupportHours: 'Mon – Sun | 24x7',
        corporateHours: 'Mon – Fri | 9:30 a.m. to 6:30 p.m.',
      },
      branchOffices: [
        {
          title: 'Branch Office - Pune',
          address: 'A/101, Teerth Technospace, Mumbai-Bengaluru Highway, Baner, Pune, Maharashtra-411045',
          corporateHours: 'Mon – Fri | 9:30 a.m. to 6:30 p.m.',
        },
      ],
      enterpriseEscalation: {
        title: 'Enterprise Escalation Matrix',
        l1: {
          level: 'L1 - Call Centre',
          emails: ['enterprise.support@microscan.co.in'],
          phone: '022-69690001',
        },
        l2: {
          level: 'L2 - Shift lead',
          emails: ['Enoc.Shiftlead@microscan.co.in'],
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
      companyName: 'SPACECOM LOCAL',
      establishedYear: '2010',
      description: 'Spacecom Local is a leading internet service provider committed to delivering high-quality broadband services to residential and business customers.',
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
    reviewUrl: undefined,
    versionCheck: {
      enabled: true,
      checkInterval: 24, // Check every 24 hours
      forceUpdateEnabled: true,
      packageName: 'com.log2space.spacecom.local',
      appStoreId: '1559045355',
    },
    },
  'dna-infotel': {
    clientId: 'dna-infotel',
    clientName: 'DNA Infotel',
    api: {
      baseURL: 'https://crm.dnainfotel.com/l2s/api',
      serverURL: 'https://crm.dnainfotel.com',
      timeout: 30000,
    },
    branding: {
      logo: 'isp_logo.png',
      primaryColor: '#1976D2',
      secondaryColor: '#FF9800',
      appName: 'DNA Infotel',
      headerBackgroundImage: 'header_background.png',
      logoDimensions: {
        header: { width: 200, height: 140 },
        login: { width: 300, height: 200 },
      },
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
        {
          title: 'Branch Office - Vasai (E)',
          address: 'Shop No. A-105, Imperial Splendora, Survey Number - 274 & 275, Madhuban, Vasai East',
        },
        {
          title: 'Branch Office - Navghar, Vasai (W))',
          address: 'Shop No. 6, 7, 8, 9, 10, Darshit Apartment, near St Francis School, Navghar, Vasai West, Vasai-Virar, Maharashtra 401202',
        },
        {
          title: 'Branch Office - Virar (W)',
          address: 'Shop No. 207-211, Gold Crest 369, Opp New Virar College, Virar West',
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
  'spacecom-live': {
    clientId: 'spacecom-live',
    clientName: 'Spacecom Live',
    api: {
      // baseURL: 'https://spacecom.l2s.biz/l2s/api',
      // serverURL: 'https://spacecom.l2s.biz',
      baseURL: 'https://crm.dnainfotel.com/l2s/api',
      serverURL: 'https://crm.dnainfotel.com',
      timeout: 30000,
    },
    branding: {
      logo: 'isp_logo.png',
      primaryColor: '#506eda',
      secondaryColor: '#FF9800',
      appName: 'Spacecom Live',
      headerBackgroundImage: 'header_background.png', // Background image for header
      headerBorderColors: {
        left: '', // Empty string to disable left border
        top: '', // Empty string to disable top border
      },
      logoDimensions: {
        login: {
          width: 300,
          height: 250,
        },
        header: {
          width: 100,
          height: 70,
        },
      },
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
        address: 'Unit No. 1 & 2, Swastik Industrial Estate, 178 CST Road, Santacruz East, Near Shaman Mercedes-Benz, Mumbai 400098',
      },
      branchOffices: [
        
      ],
      emails: {
        inquiries: 'info@spaecom.in',
        sales: 'vaibhav@spacecom.in',
      },
      landline: '+91 91375-93187',
    },
    about: {
      companyName: 'Spacecom Software LLP',
      establishedYear: '2002',
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
  'dna-goa': {
    clientId: 'dna-goa',
    clientName: 'DNA Goa',
    api: {
      baseURL: 'https://crm.dnagoa.com/l2s/api',
      serverURL: 'https://crm.dnagoa.com',
      timeout: 30000,
    },
    branding: {
      logo: 'isp_logo.png',
      primaryColor: '#1976D2',
      secondaryColor: '#FF9800',
      appName: 'DNA Goa',
      headerBackgroundImage: 'header_background.png',
      logoDimensions: {
        header: { width: 200, height: 140 },
        login: { width: 300, height: 200 },
      },
    },
    features: {
      biometricAuth: true,
      pushNotifications: true,
      fileUpload: true,
      multiLanguage: true,
    },
    contact: {
      headOffice: {
        title: 'Head Office - Panjim',
        address: '106, 1st Floor, Gera\'s Imperium, Patto, Patto Center. Panaji, GOA-403001',
      },
      branchOffices: [
        {
          title: 'Branch Office - Ponda',
          address: 'DNA-GOA, Omkar Building, Opp. Sapana Park, Bethora Road, Ponda, GOA-403401',
        },
        {
          title: 'Branch Office - Colva',
          address: '72/2B, Near Colva Police Station, Opp. Amul Icecream Parlour, Colva, Salcete, GOA-403708',
        },
        {
          title: 'Branch Office - Margao',
          address: 'Shop no : 2/915/A, " Belmar " Opp. Fatorda Stadium, Salcete, Goa. 403602',
        },
      ],
      emails: {
        inquiries: 'crm@dnagoa.com',
        sales: 'crm@dnagoa.com',
      },
      landline: '0832-6747575',
    },
    about: {
      companyName: 'DNA GOA',
      establishedYear: '2008',
      description: 'DNA Goa is a leading internet service provider committed to delivering high-quality broadband services to residential and business customers across Goa.',
      specializations: [
        'Hi-Speed Broadband Internet connection',
        'GePON/GPON technology (FTTH - Fibre to the Home)',
        'Leased Line connections for Small, Medium and large scale enterprises'
      ],
      serviceAreas: [
        'Panjim',
        'Ponda',
        'Colva',
        'Goa state'
      ],
      achievements: [
        'Successfully reached to a prominent broadband supplier',
        'Extensive service coverage across multiple regions in Goa',
        'Latest technology implementation'
      ],
    },
    reviewUrl: undefined,
    website: 'https://dnagoa.com/',
    versionCheck: {
      enabled: true,
      checkInterval: 24, // Check every 24 hours
      forceUpdateEnabled: true,
      packageName: 'com.dnagoa',
      appStoreId: '1559045355',
    },
  },
  gatewayftth: {
    clientId: 'gatewayftth',
    clientName: 'Gateway FTTH',
    api: {
      baseURL: 'https://gatewayftth.l2s.biz/l2s/api',
      serverURL: 'https://gatewayftth.l2s.biz',
      timeout: 30000,
    },
    branding: {
      logo: 'isp_logo.png',
      primaryColor: '#1976D2',
      secondaryColor: '#FF9800',
      appName: 'Gateway FTTH',
      headerBackgroundImage: 'header_background.png',
      logoDimensions: {
        header: { width: 150, height: 80 },
        login: { width: 300, height: 200 },
      },
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
        address:
          'Office No 5, 1st Floor, Telecom House. Kamla Raman Nagar. Baiganwadi Govandi. Mumbai-400043.',
      },
      branchOffices: [],
      emails: {
        inquiries: 'info@gatewayftth.com',
        support: 'info@gatewayftth.com',
      },
      landline: '9152184184',
      tollFree: '9320184184',
    },
    about: {
      companyName: 'Gateway FTTH Pvt Ltd.',
      establishedYear: '2025',
      description:
        'Gateway FTTH Pvt Ltd provides high-speed fiber broadband and OTT services for homes and businesses.',
      specializations: [
        'Hi-speed broadband',
        'Fiber to the Home (FTTH)',
        'WiFi plans',
        'OTT bundles',
        'Leased line broadband',
      ],
      serviceAreas: ['Mumbai', 'Maharashtra'],
      achievements: [],
    },
    reviewUrl: undefined,
    website: 'https://gatewayftth.com/',
    versionCheck: {
      enabled: true,
      checkInterval: 24, // Check every 24 hours
      forceUpdateEnabled: true,
      packageName: 'com.spacecom.log2space.gatewayftth',
      appStoreId: undefined,
    },
  },
  netfix: {
    clientId: 'netfix',
    clientName: 'Netfix',
    api: {
      baseURL: 'https://nnpl.l2s.biz/l2s/api',
      serverURL: 'https://nnpl.l2s.biz',
      timeout: 30000,
    },
    branding: {
      logo: 'isp_logo.png',
      primaryColor: '#1976D2',
      secondaryColor: '#FF9800',
      appName: 'Netfix',
      headerBackgroundImage: 'header_background.png',
      logoDimensions: {
        header: { width: 200, height: 140 },
        login: { width: 300, height: 200 },
      },
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
        address: 'Unit No-1, Kamala Power House, Kamala Mills Compound, Senapati Bapat Marg, Lower Parel-400 013',
        customerSupport: '02266669090',
        corporateLandline: '02266669090',
      },
      branchOffices: [],
      emails: {
        inquiries: 'info@netfixnetworks.in',
        support: 'info@netfixnetworks.in',
      },
      landline: '02266669090',
      tollFree: undefined,
    },
    about: {
      companyName: 'NETFIX NETWORKS (OPC) PVT LTD',
      establishedYear: '2023',
      description: 'Netfix is an internet service provider offering corporate leased line and FTTH broadband services.',
      specializations: [
        'Point to Point & Multi point bandwidth solutions',
        'Internet Leased Lines',
        'Bulk Internet Bandwidth',
        'FTTH Broadband',
      ],
      serviceAreas: [
        'Mumbai',
        'Maharashtra',
      ],
      achievements: [
        '120+ Kms of owned fiber network across Mumbai',
        '24x7 dedicated NOC',
      ],
    },
    reviewUrl: undefined,
    website: 'https://netfix.org.in/',
    versionCheck: {
      enabled: false, // Enable when backend end_user_app_version3 has androidBetaAppVersion: 3 for Netfix
      checkInterval: 24,
      forceUpdateEnabled: true,
      packageName: 'in.spacecom.log2space.client.netfix',
      appStoreId: undefined,
    },
  },
  'inshansa-dnagoa': {
    clientId: 'inshansa-dnagoa',
    clientName: 'Inshansa',
    api: {
      baseURL: 'https://inshansa.dnabroadband.com/l2s/api',
      serverURL: 'https://inshansa.dnabroadband.com',
      timeout: 30000,
    },
    branding: {
      logo: 'isp_logo.png',
      primaryColor: '#1976D2',
      secondaryColor: '#FF9800',
      appName: 'Inshansa',
      headerBackgroundImage: 'header_background.png',
      logoDimensions: {
        header: {
          width: 200,
          height: 140,
        },
        login: {
          width: 300,
          height: 200,
        },
      },
    },
    features: {
      biometricAuth: true,
      pushNotifications: true,
      fileUpload: true,
      multiLanguage: true,
    },
    contact: {
      headOffice: {
        title: 'Head Office - Panjim',
        address: '106, 1st Floor, Gera\'s Imperium, Patto, Patto Center. Panaji, GOA-403001',
      },
      branchOffices: [
        {
          title: 'Branch Office - Ponda',
          address: 'DNA-GOA, Omkar Building, Opp. Sapana Park, Bethora Road, Ponda, GOA-403401',
        },
        {
          title: 'Branch Office - Colva',
          address: '72/2B, Near Colva Police Station, Opp. Amul Icecream Parlour, Colva, Salcete, GOA-403708',
        },
        {
          title: 'Branch Office - Margao',
          address: 'Shop no : 2/915/A, " Belmar " Opp. Fatorda Stadium, Salcete, Goa. 403602',
        },
        {
          title: 'Branch Office - Varunapuri',
          address: 'Shop No. 6 Nau Sena Bajar / Shopping Complex Varunapuri',
        },
      ],
      emails: {
        inquiries: 'crm@dnagoa.com',
        sales: 'crm@dnagoa.com',
      },
      landline: '0832-6747575',
    },
    about: {
      companyName: 'DNA GOA',
      establishedYear: '2008',
      description: 'DNA Goa is a leading internet service provider committed to delivering high-quality broadband services to residential and business customers across Goa.',
      specializations: [
        'Hi-Speed Broadband Internet connection',
        'GePON/GPON technology (FTTH - Fibre to the Home)',
        'Leased Line connections for Small, Medium and large scale enterprises'
      ],
      serviceAreas: [
        'Panjim',
        'Ponda',
        'Colva',
        'Goa state'
      ],
      achievements: [
        'Successfully reached to a prominent broadband supplier',
        'Extensive service coverage across multiple regions in Goa',
        'Latest technology implementation'
      ],
    },
    reviewUrl: undefined,
    website: 'https://dnagoa.com/',
    versionCheck: {
      enabled: true,
      checkInterval: 24, // Check every 24 hours
      forceUpdateEnabled: true,
      packageName: 'com.spacecom.log2space.inshansa',
      appStoreId: '1559045355',
    },
  },
  successbroadband: {
    clientId: 'successbroadband',
    clientName: 'Success Broadband',
    api: {
      baseURL: 'https://successbroadband.l2s.biz/l2s/api',
      serverURL: 'https://successbroadband.l2s.biz',
      timeout: 30000,
    },
    branding: {
      logo: 'isp_logo.png',
      primaryColor: '#1976D2',
      secondaryColor: '#FF9800',
      appName: 'Success Broadband',
      headerBackgroundImage: 'header_background.png',
      logoDimensions: {
        header: {
          width: 250,
          height: 175,
        },
        login: {
          width: 400,
          height: 267,
        },
      },
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
        address: '236, Second Floor, Royal Bussiness Hub (RBH), Hajira Highway, Amroli, Surat-394107',
        customerSupport: '7567530047',
        customerSupportHours: 'Mon-Sun 9:00 AM - 9:00 PM',
      },
      branchOffices: [],
      emails: {
        inquiries: 'sucessbroadband2020@gmail.com',
        sales: 'sucessbroadband2020@gmail.com',
        support: 'sucessbroadband2020@gmail.com',
      },
      whatsappNumber: '7567530047',
      landline: '7567530047',
    },
    about: {
      companyName: 'Success Broadband',
      establishedYear: '2020',
      description: 'Success Broadband provides reliable high-speed broadband services for homes and businesses.',
      specializations: [
        'High-speed broadband internet',
        'Fiber optic connectivity',
        'Business internet solutions',
        'Customer-focused support',
      ],
      serviceAreas: [
        'Surat',
        'Gujarat',
      ],
      achievements: [
        'Trusted local broadband provider',
        'Expanding high-speed fiber network',
      ],
    },
    reviewUrl: undefined,
    website: 'https://successbroadband.in',
    versionCheck: {
      enabled: true,
      checkInterval: 24,
      forceUpdateEnabled: true,
      packageName: 'com.spacecom.log2space.successbroadband',
      appStoreId: '1559045355',
    },
  },
  'one-sevenstar': {
    clientId: 'one-sevenstar',
    clientName: 'One Seven Star',
    api: {
      baseURL: 'one.7stardigitalnetwork.com/l2s/api',
      serverURL: 'one.7stardigitalnetwork.com',
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
          emails: ['l1@one-sevenstar.com'],
          phone: '+91-111-2222224',
        },
        l2: {
          level: 'Level 2',
          emails: ['l2@one-sevenstar.com'],
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
      serverURL: 'https://admin.logonbroadband.com',
      timeout: 30000,
    },
    branding: {
      logo: 'isp_logo.png',
      primaryColor: '#1976D2',
      secondaryColor: '#42A5F5',
      appName: 'Logon Broadband',
      // Enable header background image similar to other branded clients
      headerBackgroundImage: 'header_background.png',
      // Optional: adjust logo size if needed later using logoDimensions
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
      serverURL: 'https://linkway.l2s.biz',
      timeout: 30000,
    },
    branding: {
      logo: 'isp_logo.png',
      // Match Spacecom Live primary and secondary colors
      primaryColor: '#506eda',
      secondaryColor: '#FF9800',
      appName: 'Linkway',
      headerPaddingHorizontal: 12, // Tighter padding for Linkway
      headerLogoMarginRight: 2, // Reduced space after logo
      // Use custom header background image for Linkway (new image you added)
      headerBackgroundImage: 'header_background.png',
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
  'netplanet': {
    clientId: 'netplanet',
    clientName: 'Net Planet',
    api: {
      baseURL: 'https://netplanet.l2s.biz/l2s/api',
      serverURL: 'https://netplanet.l2s.biz',
      timeout: 30000,
    },
    branding: {
      logo: 'isp_logo.png',
      primaryColor: '#1976D2',
      secondaryColor: '#42A5F5',
      appName: 'Net Planet',
    },
    features: {
      biometricAuth: true,
      pushNotifications: true,
      fileUpload: true,
      multiLanguage: true,
    },
    contact: {
      whatsappNumber: '9404824139',
      headOffice: {
        title: 'Head Office',
        address: 'HASHAMJI PREMJI SHOPPING COMPLEX, STATION ROAD, AMALNER, Dist: Jalgaon, Maharashtra - 425401',
        customerSupport: '9404824139',
        customerSupportHours: 'Mon-Fri 9:00 AM - 6:00 PM',
      },
      branchOffices: [],
      emails: {
        inquiries: 'netplanetservices@gmail.com',
        sales: 'netplanetservices@gmail.com',
        support: 'netplanetservices@gmail.com',
      },
    },
    about: {
      companyName: 'Net Planet',
      establishedYear: '2024',
      description: 'Net Planet is an internet service provider committed to delivering high-quality broadband services.',
      specializations: [
        'High-speed broadband internet',
        'Fiber optic technology',
        'Business internet solutions',
        '24/7 customer support'
      ],
      serviceAreas: [
        'Amalner',
        'Jalgaon District',
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
      packageName: 'com.spacecom.log2space.netplanet',
      appStoreId: '1234567890',
    },
  },
  'metanet': {
    clientId: 'metanet',
    clientName: 'Metanet',
    api: {
      baseURL: 'https://metanet.l2s.biz/l2s/api',
      serverURL: 'https://metanet.l2s.biz',
      timeout: 30000,
    },
    branding: {
      logo: 'isp_logo.png',
      primaryColor: '#1976D2',
      secondaryColor: '#42A5F5',
      appName: 'Metanet',
    },
    features: {
      biometricAuth: true,
      pushNotifications: true,
      fileUpload: true,
      multiLanguage: true,
    },
    contact: {
      whatsappNumber: '9987124412',
      headOffice: {
        title: 'Head Office',
        address: 'Shop No 2, Shyamkunj Soc., Gopal Nagar, Lane No.1 Dombivali (E) - 421201',
        customerSupport: '9987124412',
        customerSupportHours: 'Mon-Fri 9:00 AM - 6:00 PM',
      },
      branchOffices: [],
      emails: {
        inquiries: 'metanet.isp@gmail.com',
        sales: 'metanet.isp@gmail.com',
        support: 'metanet.isp@gmail.com',
      },
      landline: '9987124412',
    },
    about: {
      companyName: 'Metanet Broadband Services',
      establishedYear: '2024',
      description: 'Metanet Broadband Services is an internet service provider committed to delivering high-quality broadband services.',
      specializations: [
        'High-speed broadband internet',
        'Fiber optic technology',
        'Business internet solutions',
        '24/7 customer support'
      ],
      serviceAreas: [
        'Dombivali East',
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
      packageName: 'com.spacecom.log2space.metanet',
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

  // If we have a nested entry for this client, return it
  if (strings[client]) {
    return strings[client];
  }

  // Fallback 1: legacy flat shape (single object with appName/companyName, etc.)
  if (strings.appName || strings.companyName) {
    return strings;
  }

  // Fallback 2: default to microscan entry if present
  if (strings.microscan) {
    return strings.microscan;
  }

  // Final fallback: return entire object to avoid undefined
  return strings;
};

// Export default configuration
export default getClientConfig; 