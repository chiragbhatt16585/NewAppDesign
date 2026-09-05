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
    cleverTap?: boolean;
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
      customerSupport?: string;
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
      biometricAuth: true,
      pushNotifications: true,
      fileUpload: true,
      multiLanguage: true,
      cleverTap: true,
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
          title: 'Escalation Matrix',
          l1: {
            level: 'L1 - Call Centre - (Call Centre : 24x7)',
            emails: ['customersupport@microscaninternet.com'],
            phone: '+91 22-6969-0000',
          },
          l2: {
            level: 'L2 - Call Centre Operational TL',
            emails: ['devika.nikharange@microscaninternet.com'],
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
  'microscan-dptest': {
    clientId: 'microscan-dptest',
    clientName: 'Microscan',
    api: {
      baseURL: 'dptest.microscan.co.in/l2s/api',
      serverURL: 'dptest.microscan.co.in',
      timeout: 30000,
    },
    branding: {
      logo: 'isp_logo.png',
      primaryColor: '#FF791F',
      secondaryColor: '#FF791F',
      appName: 'Microscan',
      headerBorderColors: {
        left: '',
        top: '',
      },
    },
    features: {
      biometricAuth: true,
      pushNotifications: true,
      fileUpload: true,
      multiLanguage: true,
      cleverTap: true,
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
        emails: {
          support: 'customersupport@microscaninternet.com',
        },
        branchOffices: [
          {
            title: 'Branch Office - Pune',
            address: 'A/101, Teerth Technospace, Mumbai-Bengaluru Highway, Baner, Pune, Maharashtra-411045',
            corporateHours: 'Mon – Fri | 9:30 a.m. to 6:30 p.m.',
          },
        ],
        enterpriseEscalation: {
          title: 'Escalation Matrix',
          l1: {
            level: 'L1 - Call Centre - (Call Centre : 24x7)',
            emails: ['customersupport@microscaninternet.com'],
            phone: '+91 22-6969-0000',
          },
          l2: {
            level: 'L2 - Call Centre Operational TL',
            emails: ['devika.nikharange@microscaninternet.com'],
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
      checkInterval: 24,
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
        title: 'Escalation Matrix',
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
  'threesa-infoway': {
    clientId: 'threesa-infoway',
    clientName: 'Threesa Infoway',
    api: {
      baseURL: 'https://login.threesainfoway.net/l2s/api',
      serverURL: 'https://login.threesainfoway.net',
      timeout: 30000,
    },
    branding: {
      logo: 'isp_logo.png',
      primaryColor: '#1976D2',
      secondaryColor: '#42A5F5',
      appName: 'Threesa Infoway',
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
        address: 'Devcorpora A-503 Cadbury, Junction khopat Thane west - 400601',
        customerSupport: '022-68383838',
      },
      branchOffices: [],
      emails: {
        inquiries: 'info@threesainfoway.net',
        sales: 'info@threesainfoway.net',
        support: 'info@threesainfoway.net',
      },
      landline: '022-68383838',
      whatsappNumber: '9768634000',
    },
    about: {
      companyName: 'Threesa Private Limited',
      establishedYear: '',
      description:
        'Threesa Infoway provides high-speed internet services for home and office users.',
      specializations: [
        'High-speed broadband internet',
        'Fiber internet services',
        'Home and business internet plans',
        '24/7 technical support',
      ],
      serviceAreas: ['Thane', 'Navi Mumbai', 'Mumbai Region'],
      achievements: [],
    },
    reviewUrl: undefined,
    website: 'https://threesainfoway.net/',
    versionCheck: {
      enabled: true,
      checkInterval: 24,
      forceUpdateEnabled: true,
      packageName: 'com.spacecom.log2space.threesa',
      // https://apps.apple.com/us/app/threesa-infoway-end-user-app/id6786651690
      appStoreId: '6786651690',
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
        // Head office is in Virar — local landline for this location card
        customerSupport: '0250-6635100',
      },
      branchOffices: [
        {
          title: 'Branch Office - Nallasopara (E)',
          address: 'Ground Floor, Sai Kiran Building, Tulinj Rd, near Utsav Hotel, Nalasopara East, Maharashtra 401209',
          customerSupport: '0250-6635100',
        },
        {
          title: 'Branch Office - Nallasopara (W)',
          address: 'Shop No.8, Neelganga Apartment, Sriprastha Complex, Opp to Jyoti Bungalow, Shanti Park, Nallasopara (West) - 401203',
          customerSupport: '0250-6635100',
        },
        {
          title: 'Branch Office - Virar (W)',
          address: 'Shop No.2, Ground Floor, Vishnu Sanmale, Umbergothan, Post - Agashi, Virar (West), Dist : Palghar - 401301',
          customerSupport: '0250-6635100',
        },
        {
          title: 'Branch Office - Vasai (E)',
          address: 'Shop No. A-105, Imperial Splendora, Survey Number - 274 & 275, Madhuban, Vasai East',
          customerSupport: '0250-6635235',
        },
        {
          title: 'Branch Office - Navghar, Vasai (W)',
          address: 'Shop No. 6, 7, 8, 9, 10, Darshit Apartment, near St Francis School, Navghar, Vasai West, Vasai-Virar, Maharashtra 401202',
          customerSupport: '0250-6635235',
        },
        {
          title: 'Branch Office - Virar (W)',
          address: 'Shop No. 207-211, Gold Crest 369, Opp New Virar College, Virar West',
          customerSupport: '0250-6635100',
        },
      ],
      emails: {
        inquiries: 'crm@dnainfotel.com',
        sales: 'sales@dnainfotel.com',
      },
      tollFree: '1800-313-6345',
      // Shown with location labels on Contact Us
      landline: 'Virar / Nallasopara: 0250-6635100 | Vasai: 0250-6635235',
    },
    about: {
      companyName: 'DNA INFOTEL PVT LTD',
      establishedYear: '2010',
      description:
        'Since 2010, DNA INFOTEL PVT LTD has had one clear mission: to keep Vasai and Virar connected at the speed of life. In association with the renowned M/s Digital Network Associates Pvt. Ltd (DNA), we bring world-class internet directly to your doorstep.\n\nWhether you are streaming in 4K, gaming, or running a home office, our next-generation GePON/GPON Fiber technology ensures you never face a lag. We are proud to serve the diverse landscape of our region, from the bustling highways to the serene coastal areas.',
      specializations: [
        'Next-generation GePON/GPON Fiber (FTTH)',
        'High-speed broadband for streaming, gaming & home office',
        'World-class internet in association with Digital Network Associates (DNA)',
      ],
      serviceAreas: [
        'Vasai',
        'Virar',
        'Highway region',
        'Coastal region',
      ],
      achievements: [
        'Serving Vasai–Virar since 2010',
        'Lag-free GePON/GPON Fiber connectivity',
        'Coverage across highways and coastal areas',
      ],
    },
    reviewUrl: 'https://g.page/r/CSrSiBGUlFE_EB0/review',
    versionCheck: {
      enabled: true,
      checkInterval: 24, // Check every 24 hours
      forceUpdateEnabled: true,
      packageName: 'com.spacecom.log2space.dnainfotel',
      appStoreId: '1559045355',
    },
  },
  'spacecom-live': {
    clientId: 'spacecom-live',
    clientName: 'Log2space',
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
      appName: 'Log2space',
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
      companyName: 'Log2space',
      establishedYear: '2002',
      description: 'Log2space provides internet and related services powered by the Spacecom platform.',
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
      packageName: 'com.spacecom.log2space.dnagoa',
      // iOS: DNA Goa Customer Service App
      // https://apps.apple.com/us/app/dna-goa-customer-service-app/id6761742948
      appStoreId: '6761742948',
    },
  },
  graceway: {
    clientId: 'graceway',
    clientName: 'Graceway',
    api: {
      baseURL: 'https://graceway.l2s.biz/l2s/api',
      serverURL: 'https://graceway.l2s.biz',
      timeout: 30000,
    },
    branding: {
      logo: 'isp_logo.png',
      primaryColor: '#1976D2',
      secondaryColor: '#FF9800',
      appName: 'Graceway',
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
      gstin: '27AAHCG1218J1ZO',
      headOffice: {
        title: 'Registered Office',
        address: 'Sector-21, LCB-12, near Amrita Vidyalaya, Yamuna Nagar, Nigdi, Pune, Maharashtra 411044',
      },
      branchOffices: [],
      emails: {
        inquiries: 'info@graceway.co.in',
        sales: 'info@graceway.co.in',
      },
      landline: '020 27661661',
    },
    about: {
      companyName: 'Graceway Infrastructure & Services Pvt. Ltd.',
      establishedYear: '2017',
      description: 'Graceway is one of Pune\'s leading and trusted Internet Service Providers (ISPs). GISPL operates on the Class \'B\' license for ISP provided by the Department of Telecommunications (DOT) in Maharashtra & Goa. Graceway provides Internet Leased-Line Solution, Fiber Broadband for Home & SOHO along with other Telecom Solutions.',
      specializations: [
        'Hi-Speed Broadband Internet connection',
        'Fiber Broadband for Home & SOHO',
        'Internet Leased-Line Solution',
        'Enterprise Solutions',
      ],
      serviceAreas: ['Pune District', 'Maharashtra', 'Goa'],
      achievements: [],
    },
    reviewUrl: undefined,
    website: 'https://www.graceway.co.in/',
    versionCheck: {
      enabled: true,
      checkInterval: 24,
      forceUpdateEnabled: true,
      packageName: 'com.spacecom.log2space.graceway',
      appStoreId: undefined,
    },
  },
  'log2space-common': {
    clientId: 'log2space-common',
    clientName: 'Log2space',
    api: {
      baseURL: 'https://log2space-common.l2s.biz/l2s/api',
      serverURL: 'https://log2space-common.l2s.biz',
      timeout: 30000,
    },
    branding: {
      logo: 'isp_logo.png',
      primaryColor: '#1976D2',
      secondaryColor: '#FF9800',
      appName: 'Log2space',
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
        title: 'Registered Office',
        address: 'Update address in client-config',
      },
      branchOffices: [],
      emails: {
        inquiries: 'support@log2space.in',
        sales: 'support@log2space.in',
      },
      landline: '',
    },
    about: {
      companyName: 'Log2space',
      establishedYear: '',
      description: 'Log2space – placeholder. Update in client-config.',
      specializations: [],
      serviceAreas: [],
      achievements: [],
    },
    reviewUrl: undefined,
    website: 'https://spacecom.in',
    versionCheck: {
      enabled: false, // No version check for log2space-common (dynamic domain)
      checkInterval: 24,
      forceUpdateEnabled: false,
      packageName: 'in.spacecom.log2space.user',
      appStoreId: undefined,
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
  skynetwifi: {
    clientId: 'skynetwifi',
    clientName: 'Skynetwifi',
    api: {
      baseURL: 'https://skynetwifi.l2s.biz/l2s/api',
      serverURL: 'https://skynetwifi.l2s.biz',
      timeout: 30000,
    },
    branding: {
      logo: 'header_logo.png',
      primaryColor: '#1976D2',
      secondaryColor: '#FF9800',
      appName: 'Skynetwifi',
      headerBackgroundImage: 'header_background.png',
      logoDimensions: {
        // Slightly smaller header logo for better spacing in the header
        header: { width: 140, height: 70 },
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
          'E/59, Pioneer Heritage 2, Off S V Road, Santacruz West - 400054',
        customerSupport: '9152665454',
      },
      branchOffices: [],
      emails: {
        inquiries: 'helloskynetwifi@gmail.com',
        sales: 'helloskynetwifi@gmail.com',
        support: 'helloskynetwifi@gmail.com',
      },
      whatsappNumber: '9152665454',
      landline: '9152665454',
    },
    about: {
      companyName: 'Skynetwifi',
      establishedYear: '',
      description:
        'Skynetwifi provides high-speed internet connectivity and related services.',
      specializations: [
        'High-speed broadband internet',
        'Fiber broadband',
        'Home and business internet solutions',
      ],
      serviceAreas: ['Mumbai'],
      achievements: [],
    },
    reviewUrl: undefined,
    website: 'https://skynetwifi.in/',
    versionCheck: {
      enabled: true,
      checkInterval: 24,
      forceUpdateEnabled: true,
      packageName: 'com.spacecom.log2space.skynetwifi',
      // https://apps.apple.com/us/app/skynet-wi-fi-end-user-app/id6762499378
      appStoreId: '6762499378',
    },
  },
  hdmbroadband: {
    clientId: 'hdmbroadband',
    clientName: 'HDM Broadband',
    api: {
      baseURL: 'https://login.hdmbroadband.com/l2s/api',
      serverURL: 'https://login.hdmbroadband.com',
      timeout: 30000,
    },
    branding: {
      logo: 'header_logo.png',
      primaryColor: '#1976D2',
      secondaryColor: '#FF9800',
      appName: 'HDM Broadband',
      headerBackgroundImage: 'header_background.png',
      logoDimensions: {
        header: { width: 140, height: 70 },
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
          'Shop no 10 Gurukrupa chs, Badlapur Gaon, Badlapur, Thane, Maharashtra 421503',
        customerSupport: '7588200006',
      },
      branchOffices: [],
      emails: {
        inquiries: 'info@hdmbroadband.com',
        sales: 'info@hdmbroadband.com',
        support: 'info@hdmbroadband.com',
      },
      landline: '7588200006',
    },
    about: {
      companyName: 'HDM BROADBAND PVT LTD',
      establishedYear: '',
      description:
        'HDM Broadband provides high-speed internet connectivity and related services in Badlapur and surrounding areas.',
      specializations: [
        'Experience amazing internet with us at amazing price',
        'No ISP in Badlapur can match our price and quality',
        'High-speed broadband for home and business',
      ],
      serviceAreas: ['Badlapur', 'Thane', 'Maharashtra'],
      achievements: [],
    },
    reviewUrl: undefined,
    website: 'https://www.hdmbroadband.com/',
    versionCheck: {
      enabled: true,
      checkInterval: 24,
      forceUpdateEnabled: true,
      packageName: 'in.spacecom.log2space.client.hdmBroadband',
      appStoreId: undefined,
    },
  },
  srisamarthinfobahn: {
    clientId: 'srisamarthinfobahn',
    clientName: 'Srisamarthinfobahn',
    api: {
      baseURL: 'https://admin.srisamarthinfobahn.com/l2s/api',
      serverURL: 'https://admin.srisamarthinfobahn.com',
      timeout: 30000,
    },
    branding: {
      logo: 'isp_logo.png',
      primaryColor: '#1976D2',
      secondaryColor: '#FF9800',
      appName: 'Srisamarthinfobahn',
      headerBackgroundImage: 'header_background.png',
      logoDimensions: {
        header: { width: 140, height: 70 },
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
        address: '107, Ghudekaar Griha, S. K. Bole Road, Dadar (W) - 400028',
      },
      branchOffices: [],
      emails: {
        inquiries: 'support@ssib.co.in',
        sales: 'support@ssib.co.in',
        support: 'support@ssib.co.in',
      },
      whatsappNumber: '9022138569',
      landline: '8655023380',
    },
    about: {
      companyName: 'Sri Samarth Infobhan Pvt. Ltd',
      establishedYear: '',
      description:
        'Sri Samarth Infobhan Pvt. Ltd provides internet connectivity and related services.',
      specializations: [
        'High-speed broadband internet',
        'Fiber broadband',
        'Home and business internet solutions',
      ],
      serviceAreas: ['Mumbai'],
      achievements: [],
    },
    reviewUrl: undefined,
    website: 'https://admin.srisamarthinfobahn.com/',
    versionCheck: {
      enabled: true,
      checkInterval: 24,
      forceUpdateEnabled: true,
      packageName: 'com.spacecom.log2space.srisamarthinfobahn',
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
      headerBackgroundImage: 'header_background.png',
      logoDimensions: {
        // Larger logo sizes for desktop-style/header and login views
        header: {
          width: 150,
          height: 80,
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
      gstin: '29AAFCM000000002',
      headOffice: {
        title: 'Registered Office',
        address: '304/305 Tulsi Com Pre Co-op So, Harshvardhan Chamber, Oshiwara, Jogeshwari West, Mumbai, Maharashtra, India, 400102',
        customerSupport: '022249447777',
        customerSupportHours: 'Mon-Fri 9:00 AM - 6:00 PM',
        corporateHours: 'Mon-Fri 9:00 AM - 6:00 PM',
      },
      branchOffices: [],
      enterpriseEscalation: {
        title: 'Enterprise Escalation',
        l1: {
          level: 'Level 1',
          emails: ['info@one7star.com'],
        },
        l2: {
          level: 'Level 2',
          emails: ['info@one7star.com'],
        },
        l3: {
          level: 'Level 3',
          emails: ['info@one7star.com'],
        },
      },
      emails: {
        inquiries: 'info@one7star.com',
        sales: 'info@one7star.com',
        support: 'info@one7star.com',
      },
    },
    about: {
      companyName: 'ONE7STAR',
      establishedYear: '2015',
      description: 'ONE7STAR is a strategic alliance between ONEOTT iNTERTAINMENT Ltd. (OIL), India\'s 4th largest private Internet Service Provider, and 7Star Group, a prominent regional ISP. We are committed to transforming the digital landscape by providing reliable, high-speed internet services across Maharashtra and beyond.',
      specializations: [
        'High-speed broadband internet',
        '24 OTT Apps, 300+ Live TV Channels',
        'Fiber optic networks',
        'Business internet solutions'
      ],
      serviceAreas: [
        'Mumbai',
        'Maharashtra and beyond'
      ],
      achievements: [
        'Ranked on Netflix ISP Index',
        'Ultra fast speed up to 1 Gbps',
        'Strategic alliance of ONEOTT and 7Star Group'
      ],
    },
    website: 'https://www.one7star.com/',
    reviewUrl: 'https://play.google.com/store/apps/details?id=com.h8.dnasubscriber',
    versionCheck: {
      enabled: true,
      checkInterval: 24, // Check every 24 hours
      forceUpdateEnabled: true,
      packageName: 'com.spacecom.log2space.onesevenstar',
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
      headerBackgroundImage: 'header_background.png',
      logoDimensions: {
        // Match One Seven Star header/login logo sizing
        header: {
          width: 150,
          height: 80,
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
  comcast: {
    clientId: 'comcast',
    clientName: 'Comcast',
    api: {
      baseURL: 'https://comcast.l2s.biz/l2s/api',
      serverURL: 'https://comcast.l2s.biz',
      timeout: 30000,
    },
    branding: {
      logo: 'isp_logo.png',
      primaryColor: '#1976D2',
      secondaryColor: '#42A5F5',
      appName: 'Comcast',
      headerBackgroundImage: 'header_background.png',
      logoDimensions: {
        header: {width: 200, height: 140},
        login: {width: 300, height: 200},
      },
    },
    features: {
      biometricAuth: true,
      pushNotifications: true,
      fileUpload: true,
      multiLanguage: true,
    },
    contact: {
      whatsappNumber: '7798886379',
      headOffice: {
        title: 'Head Office',
        address:
          'Shop No 106, Yash Plaza 1st Floor, MG Road, Pen, Raigad - 402107',
        customerSupport: '7798886379',
      },
      branchOffices: [],
      emails: {
        inquiries: 'support@comcastnetworks.in',
        sales: 'support@comcastnetworks.in',
        support: 'support@comcastnetworks.in',
      },
      landline: '7798886379',
    },
    about: {
      companyName: 'Comcast Broadband Services',
      establishedYear: '',
      description:
        'Comcast Broadband Services provides broadband internet services.',
      specializations: [
        'High-speed broadband internet',
        'Fiber internet services',
        'Home and business internet plans',
      ],
      serviceAreas: ['Pen', 'Raigad', 'Maharashtra'],
      achievements: [],
    },
    reviewUrl: undefined,
    website: 'https://www.comcastnetworks.in',
    versionCheck: {
      enabled: true,
      checkInterval: 24,
      forceUpdateEnabled: true,
      packageName: 'in.spacecom.log2space.client.comcastBroadband',
      appStoreId: undefined,
    },
  },
  monarknet: {
    clientId: 'monarknet',
    clientName: 'Monark Broadband',
    api: {
      baseURL: 'https://monarknet.l2s.biz/l2s/api',
      serverURL: 'https://monarknet.l2s.biz',
      timeout: 30000,
    },
    branding: {
      logo: 'isp_logo.png',
      primaryColor: '#1976D2',
      secondaryColor: '#42A5F5',
      appName: 'Monark Broadband',
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
      // whatsappNumber: '9224587510',
      headOffice: {
        title: 'Monark Broadband Pvt Ltd - 4 Bunglow',
        address:
          'Shop No. 15, Nandkrupa Shopping Centre, 4 Bungalow, Main Market, Behind Anjali Book Centre, Andheri West, Mumbai - 400058',
        customerSupport: '9224587510, 9224587513',
        customerSupportHours: 'Monday - Saturday | 10:00 AM to 8:30 PM, Sunday | 10:00 AM to 2:00 PM',
      },
      branchOffices: [
        {
          title: 'Monark Broadband Pvt Ltd - Navrang',
          address:
            'Mona Shopping Centre, Shop No. 23, Ground Floor, Near Navrang Cinema, Andheri West, Mumbai - 400058',
          customerSupport: '9819555262, 9819944114',
        },
      ],
      emails: {
        inquiries: 'monarkbroadband@gmail.com',
        sales: 'monarkbroadband@gmail.com',
        support: 'monarkbroadband@gmail.com',
      },
      landline: '9224587513',
    },
    about: {
      companyName: 'Monark Broadband Pvt Ltd',
      establishedYear: '',
      description:
        'Monark Broadband Pvt Ltd provides high-speed internet connectivity and related services.',
      specializations: [
        'High-speed broadband internet',
        'Fiber broadband',
        'Home and business internet solutions',
      ],
      serviceAreas: ['Mumbai', 'Maharashtra'],
      achievements: [],
    },
    reviewUrl: undefined,
    website: 'https://monarknet.l2s.biz',
    versionCheck: {
      enabled: true,
      checkInterval: 24,
      forceUpdateEnabled: true,
      packageName: 'in.spacecom.log2space.client.monarkuser',
      appStoreId: undefined,
    },
  },
  funnet: {
    clientId: 'funnet',
    clientName: 'Funnet',
    api: {
      baseURL: 'https://funnet.l2s.biz/l2s/api',
      serverURL: 'https://funnet.l2s.biz',
      timeout: 30000,
    },
    branding: {
      logo: 'isp_logo.png',
      primaryColor: '#1976D2',
      secondaryColor: '#42A5F5',
      appName: 'Funnet',
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
      whatsappNumber: '7028856763',
      headOffice: {
        title: 'DNSPL',
        address:
          'Shop no 5 Bhima Mhatre Chs, Manpada Road, Opp K.D. Agarwall Hall, Dombivli East',
        customerSupport: '8976017880, 8425895774',
      },
      branchOffices: [],
      emails: {
        inquiries: 'support@delix.in',
        sales: 'L2support@delix.in',
        support: 'support@delix.in, L2support@delix.in',
      },
      landline: '8976017880, 8425895774',
    },
    about: {
      companyName: 'DNSPL',
      establishedYear: '',
      description:
        'DNSPL provides high-speed internet connectivity and related services.',
      specializations: [
        'High-speed broadband internet',
        'Fiber broadband',
        'Home and business internet solutions',
      ],
      serviceAreas: ['Dombivli', 'Dombivli East', 'Maharashtra'],
      achievements: [],
    },
    reviewUrl: undefined,
    website: 'https://funnet.l2s.biz',
    versionCheck: {
      enabled: true,
      checkInterval: 24,
      forceUpdateEnabled: true,
      packageName: 'com.spacecom.log2space.funnet',
      appStoreId: undefined,
    },
  },
  wnet: {
    clientId: 'wnet',
    clientName: 'Wnet',
    api: {
      baseURL: 'https://wnet.l2s.biz/l2s/api',
      serverURL: 'https://wnet.l2s.biz',
      timeout: 30000,
    },
    branding: {
      logo: 'isp_logo.png',
      primaryColor: '#1976D2',
      secondaryColor: '#42A5F5',
      appName: 'Wnet',
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
        title: 'Wnet',
        address:
          'C-13, Satyam Shopping Center, M.G Road, Ghatkopar (East)',
      },
      branchOffices: [],
      emails: {
        inquiries: 'info@wnet.net.in',
        sales: 'info@wnet.net.in',
        support: 'info@wnet.net.in',
      },
    },
    about: {
      companyName: 'Wnet',
      establishedYear: '',
      description:
        'Wnet provides high-speed internet connectivity and related services.',
      specializations: [
        'High-speed broadband internet',
        'Fiber broadband',
        'Home and business internet solutions',
      ],
      serviceAreas: ['Ghatkopar', 'Mumbai', 'Maharashtra'],
      achievements: [],
    },
    reviewUrl: undefined,
    website: 'https://wnet.net.in',
    versionCheck: {
      enabled: true,
      checkInterval: 24,
      forceUpdateEnabled: true,
      packageName: 'in.spacecom.log2space.client.wnet',
      appStoreId: undefined,
    },
  },
  indophone: {
    clientId: 'indophone',
    clientName: 'Indophone',
    api: {
      baseURL: 'https://indophonenetworks.l2s.biz/l2s/api',
      serverURL: 'https://indophonenetworks.l2s.biz',
      timeout: 30000,
    },
    branding: {
      logo: 'isp_logo.png',
      primaryColor: '#1976D2',
      secondaryColor: '#42A5F5',
      appName: 'Indophone',
      headerBackgroundImage: 'header_background.png',
      logoDimensions: {
        header: { width: 150, height: 47 },
        login: { width: 300, height: 94 },
      },
    },
    features: {
      biometricAuth: true,
      pushNotifications: true,
      fileUpload: true,
      multiLanguage: true,
    },
    contact: {
      whatsappNumber: '9999862747',
      headOffice: {
        title: 'Head Office',
        address:
          '2nd Floor, Plot No. 06, Kh. No. 18/2s/f, Extn 3 Nangloi - 110041',
        customerSupport: '9999862747',
      },
      branchOffices: [],
      emails: {
        inquiries: 'indophonenetworks@gmail.com',
        sales: 'indophonenetworks@gmail.com',
        support: 'indophonenetworks@gmail.com',
      },
      landline: '9999862747',
    },
    about: {
      companyName: 'Indophone Networks OPC Private Limited',
      establishedYear: '',
      description:
        'Indophone Networks OPC Private Limited provides high-speed internet connectivity and related services.',
      specializations: [
        'High-speed broadband internet',
        'Fiber broadband',
        'Home and business internet solutions',
      ],
      serviceAreas: ['Nangloi', 'Delhi', 'NCR'],
      achievements: [],
    },
    reviewUrl: undefined,
    website: 'https://indophonenetworks.l2s.biz',
    versionCheck: {
      enabled: true,
      checkInterval: 24,
      forceUpdateEnabled: true,
      packageName: 'com.spacecom.log2space.indophonenetworks',
      appStoreId: undefined,
    },
  },
  'sprioc-web': {
    clientId: 'sprioc-web',
    clientName: 'Sprioc',
    api: {
      baseURL: 'https://sprioc.l2s.biz/l2s/api',
      serverURL: 'https://sprioc.l2s.biz',
      timeout: 30000,
    },
    branding: {
      logo: 'isp_logo.png',
      primaryColor: '#1976D2',
      secondaryColor: '#42A5F5',
      appName: 'Sprioc',
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
      whatsappNumber: '8806828882',
      headOffice: {
        title: 'Head Office',
        address:
          'Ground Floor, Shop No. 02, Omkar Darshan, Masoli, Dahanu - 401602',
        customerSupport: '8806828882',
      },
      branchOffices: [],
      emails: {
        inquiries: 'spriocweb@gmail.com',
        sales: 'spriocweb@gmail.com',
        support: 'spriocweb@gmail.com',
      },
      landline: '8806828882',
    },
    about: {
      companyName: 'SPRIOC WEB PVT LTD',
      establishedYear: '',
      description:
        'SPRIOC WEB PVT LTD provides high-speed internet connectivity and related services.',
      specializations: [
        'High-speed broadband internet',
        'Fiber broadband',
        'Home and business internet solutions',
        '24/7 technical support',
      ],
      serviceAreas: ['Dahanu', 'Masoli', 'Maharashtra'],
      achievements: [],
    },
    reviewUrl: undefined,
    website: 'https://sprioc.l2s.biz',
    versionCheck: {
      enabled: true,
      checkInterval: 24,
      forceUpdateEnabled: true,
      packageName: 'com.spacecom.log2space.sprioc',
      appStoreId: undefined,
    },
  },
  'asw-service': {
    clientId: 'asw-service',
    clientName: 'ASW Service',
    api: {
      baseURL: 'https://asws.l2s.biz/l2s/api',
      serverURL: 'https://asws.l2s.biz',
      timeout: 30000,
    },
    branding: {
      logo: 'isp_logo.png',
      primaryColor: '#1976D2',
      secondaryColor: '#42A5F5',
      appName: 'ASW Service',
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
      whatsappNumber: '9096385751',
      headOffice: {
        title: 'Head Office',
        address: 'Shop no.2 omkar darshan, masoli, Dahanu - 401601',
        customerSupport: '9096385751',
      },
      branchOffices: [],
      emails: {
        inquiries: 'asw@gmail.com',
        sales: 'asw@gmail.com',
        support: 'asw@gmail.com',
      },
      landline: '9096385751',
    },
    about: {
      companyName: 'ASW Service',
      establishedYear: '',
      description:
        'ASW Service provides high-speed internet connectivity and related services.',
      specializations: [
        'High-speed broadband internet',
        'Fiber broadband',
        'Home and business internet solutions',
        '24/7 technical support',
      ],
      serviceAreas: ['Dahanu', 'Masoli', 'Maharashtra'],
      achievements: [],
    },
    reviewUrl: undefined,
    website: 'https://asws.l2s.biz',
    versionCheck: {
      enabled: true,
      checkInterval: 24,
      forceUpdateEnabled: true,
      packageName: 'com.spacecom.log2space.aswservice',
      appStoreId: undefined,
    },
  },
  cityzone: {
    clientId: 'cityzone',
    clientName: 'Cityzone',
    api: {
      baseURL: 'https://cityzone.l2s.biz/l2s/api',
      serverURL: 'https://cityzone.l2s.biz',
      timeout: 30000,
    },
    branding: {
      logo: 'isp_logo.png',
      primaryColor: '#1976D2',
      secondaryColor: '#42A5F5',
      appName: 'Cityzone',
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
      whatsappNumber: '9146002255',
      headOffice: {
        title: 'Cityzone Infonet Pvt. Ltd',
        address:
          'Shop No.01, Sai Kunj Building, Opp Waliv Lake, Waliv Village, Tal. Vasai (E) - 401208',
        customerSupport: '9146002288, 9146002220, 9146002229, 9146002255',
      },
      branchOffices: [],
      emails: {
        inquiries: 'support@cityzoneinfonet.net',
        sales: 'support@cityzoneinfonet.net',
        support: 'support@cityzoneinfonet.net',
      },
      landline: '9146002288',
    },
    about: {
      companyName: 'Cityzone Infonet Pvt. Ltd',
      establishedYear: '',
      description:
        'Cityzone Infonet Pvt. Ltd provides high-speed internet connectivity and related services.',
      specializations: [
        'High-speed broadband internet',
        'Fiber broadband',
        'Home and business internet solutions',
      ],
      serviceAreas: ['Vasai', 'Maharashtra'],
      achievements: [],
    },
    reviewUrl: undefined,
    website: 'https://cityzone.l2s.biz',
    versionCheck: {
      enabled: true,
      checkInterval: 24,
      forceUpdateEnabled: true,
      packageName: 'in.spacecom.log2space.client.cityzone',
      appStoreId: undefined,
    },
  },
  networksolutions: {
    clientId: 'networksolutions',
    clientName: 'Network Solutions',
    api: {
      baseURL: 'https://networksolutions.l2s.biz/l2s/api',
      serverURL: 'https://networksolutions.l2s.biz',
      timeout: 30000,
    },
    branding: {
      logo: 'isp_logo.png',
      primaryColor: '#1976D2',
      secondaryColor: '#42A5F5',
      appName: 'Network Solutions',
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
      whatsappNumber: '6356883838',
      headOffice: {
        title: 'Network Solution and Services',
        address:
          'Manchha Empire Shop 106, Mashal Chowk, Daman - Kunta Rd, near Federal Bank, Nani Daman, Daman, Dadra and Nagar Haveli and Daman and Diu 396210',
        customerSupport: '063568 83838',
      },
      branchOffices: [],
      emails: {
        inquiries: 'networksolutionandservices@gmail.com',
        sales: 'networksolutionandservices@gmail.com',
        support: 'networksolutionandservices@gmail.com',
      },
      landline: '6356883838',
    },
    about: {
      companyName: 'Network Solution and Services',
      establishedYear: '',
      description:
        'Network Solution and Services provides high-speed internet connectivity and related services.',
      specializations: [
        'High-speed broadband internet',
        'Fiber broadband',
        'Home and business internet solutions',
      ],
      serviceAreas: ['Daman', 'Dadra and Nagar Haveli and Daman and Diu'],
      achievements: [],
    },
    reviewUrl: undefined,
    website: 'https://networksolutions.l2s.biz',
    versionCheck: {
      enabled: true,
      checkInterval: 24,
      forceUpdateEnabled: true,
      packageName: 'com.spacecom.log2space.networksolutions',
      appStoreId: undefined,
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

  // log2space-common: use user-entered domain when set
  if (currentClient === 'log2space-common') {
    try {
      const { getCustomApi } = require('./customApiStorage');
      const custom = getCustomApi();
      if (custom) {
        const baseURL = `${custom.protocol}${custom.domain}/l2s/api`;
        const serverURL = `${custom.protocol}${custom.domain}`;
        return { ...config, api: { ...config.api, baseURL, serverURL } };
      }
    } catch (_) {}
  }
  
  return config;
};

export const isMicroscanClient = (clientId?: string): boolean => {
  let id = clientId;
  if (!id) {
    try {
      id = require('./current-client.json').clientId;
    } catch {
      id = 'microscan';
    }
  }
  return id === 'microscan' || id === 'microscan-dptest';
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