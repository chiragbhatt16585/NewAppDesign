import AsyncStorage from '@react-native-async-storage/async-storage';
import param from 'jquery-param';
import sessionManager from '../../src/services/sessionManager';
import { getClientConfig } from '../config/client-config';

// Dynamic API configuration based on client
const getApiConfig = () => {
  try {
    const clientConfig = getClientConfig();
    const baseURL = clientConfig.api.baseURL;
    
    // Extract domain and protocol from baseURL
    let domainUrl: string;
    let protocol: string = 'https://';
    
    if (baseURL.startsWith('https://')) {
      domainUrl = baseURL.replace('https://', '').replace('/l2s/api', '');
      protocol = 'https://';
    } else if (baseURL.startsWith('http://')) {
      domainUrl = baseURL.replace('http://', '').replace('/l2s/api', '');
      protocol = 'http://';
    } else {
      domainUrl = baseURL.replace('/l2s/api', '');
      protocol = 'https://'; // Default to https
    }
    
    return {
      domainUrl: domainUrl,
      protocol: protocol,
      ispName: clientConfig.clientName
    };
  } catch (error) {
    console.error('Error getting client config, falling back to dna-infotel:', error);
    return {
      domainUrl: "crm.dnainfotel.com",
      protocol: 'https://',
      ispName: 'DNA Infotel'
    };
  }
};

// Get API config dynamically (not cached at module load)
const getApiConfigDynamic = () => {
  const apiConfig = getApiConfig();
  console.log('=== API CONFIG LOADED ===');
  console.log('Client Config:', getClientConfig().clientId);
  console.log('API Domain:', apiConfig.domainUrl);
  console.log('API URL:', `${apiConfig.protocol}${apiConfig.domainUrl}/l2s/api`);
  console.log('=== END API CONFIG ===');
  return apiConfig;
};

// For backward compatibility, keep static exports but make them dynamic
let cachedApiConfig = getApiConfigDynamic();
export const getDomainUrl = () => {
  cachedApiConfig = getApiConfigDynamic();
  return cachedApiConfig.domainUrl;
};
export const getDomain = () => {
  cachedApiConfig = getApiConfigDynamic();
  return `${cachedApiConfig.protocol}${cachedApiConfig.domainUrl}`;
};
export const getApiUrl = () => {
  cachedApiConfig = getApiConfigDynamic();
  return `${cachedApiConfig.protocol}${cachedApiConfig.domainUrl}/l2s/api`;
};
export const getIspName = () => {
  cachedApiConfig = getApiConfigDynamic();
  return cachedApiConfig.ispName;
};

// Legacy exports for backward compatibility (will use cached config)
export const domainUrl = cachedApiConfig.domainUrl;
export const domain = `${cachedApiConfig.protocol}${cachedApiConfig.domainUrl}`;
const url = `${cachedApiConfig.protocol}${cachedApiConfig.domainUrl}/l2s/api`;
export const ispName = cachedApiConfig.ispName;

// Get KYC document URL dynamically (uses current config so log2space-common custom domain works)
export const getKycDocumentUrl = (filename: string): string => {
  return `${getDomain()}/kyc_docs/${filename}`;
};

const method = 'POST';
const fixedHeaders = {
  'cache-control': 'no-cache',
  'referer': 'L2S-System/User-App-Requests'
};

const headers = (Authentication: string) => (new Headers({ Authentication, ...fixedHeaders }));

const timeout = 15000;
const networkErrorMsg = 'Please check your internet connection and try again.';
const Loggable = true;

/** Fetch with AbortController timeout (RN fetch ignores a `timeout` option on its own). */
const fetchWithTimeout = async (
  url: string,
  options: RequestInit & { timeout?: number } = {},
): Promise<Response> => {
  const { timeout: timeoutMs = timeout, ...fetchOptions } = options;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...fetchOptions, signal: controller.signal });
  } catch (e: any) {
    if (e?.name === 'AbortError') {
      throw new TypeError('Network request failed');
    }
    throw e;
  } finally {
    clearTimeout(timer);
  }
};

// Response Types
export interface ApiResponse<T = any> {
  status: 'ok' | 'error';
  message: string;
  data?: T;
  code?: number;
}

export interface LoginRequest {
  username: string;
  password: string;
  otp?: string;
  resend_otp?: string;
  phone_no?: string;
  user_type?: string;
  login_from?: string;
  request_source?: string;
  request_app?: string;
  auth_type?: string;
}

export interface LoginResponse {
  token: string;
  username?: string;
  consent_required?: boolean;
  user?: {
    id: string;
    username: string;
    name: string;
    email?: string;
    phone?: string;
    role: string;
  };
}

export interface AuthTypeResponse {
  auth_type: 'password' | 'otp' | 'both';
  message?: string;
}

export interface UserProfile {
  id: string;
  username: string;
  name: string;
  email?: string;
  phone?: string;
  role: string;
  accountDetails?: {
    accountNumber: string;
    planName: string;
    planExpiry: string;
    balance: number;
    status: string;
  };
}

export interface Ticket {
  id: string;
  ticketNo: string;
  title: string;
  remarks: string;
  status: string;
  priority: string;
  dateCreated: string;
  dateClosed?: string;
  index?: number;
}

// Utility function to convert object to FormData
const toFormData = (data: any): FormData => {
  const formData = new FormData();
  console.log('=== TO FORM DATA DEBUG ===');
  console.log('Input data object:', data);
  
  Object.keys(data).forEach(key => {
    if (data[key] !== undefined && data[key] !== null) {
      // Handle file uploads from react-native-image-picker
      if (key.includes('_file') && data[key] && typeof data[key] === 'object' && data[key].uri) {
        const file = data[key];
        const fileType = file.type || 'image/jpeg';
        const fileName = file.fileName || file.name || `document.${fileType.split('/')[1] || 'jpg'}`;
        
        // console.log('=== FILE UPLOAD DEBUG ===');
        // console.log('File key:', key);
        // console.log('File object:', file);
        // console.log('File type:', fileType);
        // console.log('File name:', fileName);
        // console.log('========================');
        
        formData.append(key, {
          uri: file.uri,
          type: fileType,
          name: fileName,
        } as any);
      } else {
        //console.log(`Adding to FormData - ${key}:`, data[key]);
        formData.append(key, data[key]);
      }
    } else {
      // Skip undefined/null values silently - this is expected behavior
      // Only log in debug mode for troubleshooting
      if (__DEV__ && key !== 'phone_no') {
        // Don't log phone_no skipping as it's always undefined for password login
        console.log(`Skipping ${key} - value is undefined or null:`, data[key]);
      }
    }
  });
  
  // console.log('=== FINAL FORM DATA CONTENTS ===');
  // // Log what's actually in the FormData
  // console.log('FormData created with keys:', Object.keys(data).filter(key => data[key] !== undefined && data[key] !== null));
  // console.log('=== END FORM DATA DEBUG ===');
  
  return formData;
};

// Network error detection
const isNetworkError = (error: any): boolean => {
  const message = (error?.message || '').toLowerCase();
  return (
    error?.name === 'TypeError' ||
    error?.name === 'AbortError' ||
    message.includes('network request failed') ||
    message.includes('please check your internet connection')
  );
};

const isTokenExpiredMessage = (message?: string): boolean => {
  const m = (message || '').toLowerCase();
  return (
    m.includes('token expired') ||
    m.includes('invalid token') ||
    m === 'unauthorized' ||
    m.includes('session expired')
  );
};

// Only true auth/token failures — not network or generic login errors
const isTokenExpiredError = (error: any): boolean => {
  if (isNetworkError(error)) {
    return false;
  }
  const errorMessage = (error?.message || '').toLowerCase();
  return isTokenExpiredMessage(errorMessage);
};

// API Service Class
class ApiService {
  private isRegeneratingToken = false;
  private tokenRegenerationPromise: Promise<string | false> | null = null;
  private authUserInFlight: Promise<any> | null = null;
  private authUserCache: { data: any; ts: number; username?: string } | null = null;
  private readonly AUTHUSER_TTL_MS = 60 * 1000;
  
  // CRITICAL: Clear authUser cache when user changes
  clearAuthUserCache(): void {
    console.log('[API] 🚨 Clearing authUser cache');
    this.authUserCache = null;
    this.authUserInFlight = null;
  }

  abortController() {
    const abortController = new AbortController();
    return abortController;
  }

  async adminDetails() {
    const options = {
      method,
      headers: new Headers({ ...fixedHeaders }),
      timeout
    };
    
    try {
      const res = await fetch(`${getDomain()}/tmp/isp_details.json`, options);
      const data = await res.json();
      return data.data[0];
    } catch (e: any) {
      const msg = isNetworkError(e) ? networkErrorMsg : e.message;
      throw new Error(msg);
    }
  }

  // Keep method name aligned with backend/client usage ("getAdminDetials" typo intentional).
  async getAdminDetials(franchiseename: string, _realm: string = 'default') {
    return this.makeAuthenticatedRequest(async (token: string) => {
      const username = await sessionManager.getUsername();
      if (!username) {
        throw new Error('No username found in session');
      }

      const data = {
        username: username.toLowerCase().trim(),
        admin_login_id: franchiseename,
        action: 'settings',
        request_source: 'app',
        request_app: 'user_app',
      };

      const options = {
        method,
        headers: new Headers({ Authentication: token, ...fixedHeaders }),
        body: toFormData(data),
        timeout,
      };

      try {
        const res = await fetch(`${getApiUrl()}/selfcareGetAdminDetails`, options);
        const response = await res.json();
        if (__DEV__) {
          try {
            console.log(
              '[getAdminDetials] Full API response:',
              JSON.stringify(response, null, 2)
            );
          } catch {
            console.log('[getAdminDetials] Full API response (raw):', response);
          }
        }

        if (response.status !== 'ok' && response.code !== 200) {
          throw new Error('Admin details not found. Please try again.');
        }

        const payload = response.data;
        if (Array.isArray(payload)) {
          return payload[0] || null;
        }
        return payload || null;
      } catch (e: any) {
        if (isNetworkError(e)) {
          throw new Error(networkErrorMsg);
        } else {
          throw new Error(e.message || 'Failed to fetch admin details');
        }
      }
    });
  }

  async sendProfileUpdateOTP(params: {
    username: string;
    loginId: string;
    adminLoginId: string;
    otpSentOn: string;
  }) {
    return this.makeAuthenticatedRequest(async (token: string) => {
      const data = {
        username: params.username,
        login_id: params.loginId,
        admin_login_id: params.adminLoginId,
        login_type: 'user',
        otp_type: 'update_profile_details',
        otp_sent_option: 'sms',
        otp_sent_on: params.otpSentOn,
        user_application: 'end_user',
        request_source: 'app',
        request_app: 'user_app',
      };

      const options = {
        method,
        headers: new Headers({ Authentication: token, ...fixedHeaders }),
        body: toFormData(data),
        timeout,
      };

      try {
        const res = await fetch(`${getApiUrl()}/selfcareSendOTP`, options);
        const response = await res.json();

        if (__DEV__) {
          try {
            console.log(
              '[sendProfileUpdateOTP] Full API response:',
              JSON.stringify(response, null, 2)
            );
          } catch {
            console.log('[sendProfileUpdateOTP] Full API response (raw):', response);
          }
        }

        if (response.status !== 'ok' && response.code !== 200) {
          throw new Error(response.message || 'Failed to send OTP');
        }
        return response;
      } catch (e: any) {
        if (isNetworkError(e)) {
          throw new Error(networkErrorMsg);
        }
        throw new Error(e.message || 'Failed to send OTP');
      }
    });
  }

  async updateUserProfileDetails(params: {
    username: string;
    adminLoginId: string;
    otp?: string;
    primaryEmail: string;
    firstName: string;
    middleName?: string;
    lastName?: string;
    primaryMobile: string;
    birthDate?: string;
  }) {
    return this.makeAuthenticatedRequest(async (token: string) => {
      const data = {
        username: params.username,
        admin_login_id: params.adminLoginId,
        otp: params.otp || '',
        otp_type: 'update_profile_details',
        primary_email: params.primaryEmail,
        first_name: params.firstName,
        middle_name: params.middleName || '',
        last_name: params.lastName || '',
        primary_mobile: params.primaryMobile,
        birth_date: params.birthDate || '',
        user_application: 'end_user',
        request_source: 'app',
        request_app: 'user_app',
      };

      if (__DEV__) {
        try {
          console.log(
            '[updateUserProfileDetails] Request payload:',
            JSON.stringify(data, null, 2)
          );
        } catch {
          console.log('[updateUserProfileDetails] Request payload (raw):', data);
        }
      }

      const options = {
        method,
        headers: new Headers({ Authentication: token, ...fixedHeaders }),
        body: toFormData(data),
        timeout,
      };

      try {
        const res = await fetch(`${getApiUrl()}/selfcareUpdateUserProfileDetails`, options);
        const response = await res.json();

        if (__DEV__) {
          try {
            console.log(
              '[updateUserProfileDetails] Full API response:',
              JSON.stringify(response, null, 2)
            );
          } catch {
            console.log('[updateUserProfileDetails] Full API response (raw):', response);
          }
        }

        if (response.status !== 'ok' && response.code !== 200) {
          throw new Error(response.message || 'Failed to update profile details');
        }
        return response;
      } catch (e: any) {
        if (isNetworkError(e)) {
          throw new Error(networkErrorMsg);
        }
        throw new Error(e.message || 'Failed to update profile details');
      }
    });
  }

  async checkAuthTokenValidity() {
    console.log('=== CHECK AUTH TOKEN VALIDITY DEBUG ===');
    try {
      const token = await sessionManager.getToken();
      console.log('Token from session manager:', token ? 'exists' : 'missing');
      
      if (!token) {
        console.log('No token found, returning false');
        return false;
      }

      const data = {
        username: await sessionManager.getUsername(),
        request_source: 'app',
        request_app: 'user_app'
      };
      console.log('Username for validation:', data.username);

      const options = {
        method,
        headers: new Headers({ Authentication: token, ...fixedHeaders }),
        body: toFormData(data),
        timeout
      };

      console.log('Making token validation request...');
      const res = await fetch(`${getApiUrl()}/selfcareCheckTokenValidity`, options);
      const response = await res.json();
      console.log('=== AFTER LOGIN API RESPONSE (RAW) ===');
      try {
        console.log(JSON.stringify(response, null, 2));
      } catch {
        console.log(response);
      }
      console.log('=== END AFTER LOGIN API RESPONSE (RAW) ===');
      console.log('Token validation response:', response);
      
      if (response.status === 'ok' && response.code === 200) {
        console.log('Token is valid');
        return true;
      } else {
        console.log('Token validation failed:', response.message);
        return false;
      }
    } catch (e: any) {
      console.error('Token validation error:', e);
      return false;
    }
  }

  async checkDomainName(domain: string) {
    const option = {
      method,
      headers: new Headers({ ...fixedHeaders }),
      timeout
    };

    try {
      const res = await fetch(`${getApiUrl()}/selfcareL2sUserLogin`, option);
      const response = await res.json();
      
      if (response.program === "L2S Login") {
        await AsyncStorage.setItem('domainName', domain);
        return true;
      } else {
        return false;
      }
    } catch (e: any) {
      const msg = isNetworkError(e) ? networkErrorMsg : e.message;
      throw new Error(msg);
    }
  }

  async regenerateToken() {
    // Prevent multiple simultaneous token regeneration attempts
    if (this.isRegeneratingToken && this.tokenRegenerationPromise) {
      return this.tokenRegenerationPromise;
    }

    this.isRegeneratingToken = true;
    this.tokenRegenerationPromise = this.performTokenRegeneration();

    try {
      const result = await this.tokenRegenerationPromise;
      return result;
    } finally {
      this.isRegeneratingToken = false;
      this.tokenRegenerationPromise = null;
    }
  }

  private async performTokenRegeneration() {
    // Use stored credentials via sessionManager (empty-password login does not work)
    return sessionManager.regenerateToken();
  }

  async handleTokenUpdate() {
    console.log('=== HANDLE TOKEN UPDATE DEBUG ===');
    const isValid = await this.checkAuthTokenValidity();
    console.log('Token validity check result:', isValid);

    if (isValid) {
      console.log('Token is valid, returning true');
      return true;
    } else {
      console.log('Token is invalid, attempting regeneration...');
      const newToken = await this.regenerateToken();
      console.log('Token regeneration result:', newToken ? 'success' : 'failed');
      if (newToken) {
        await sessionManager.updateToken(newToken);
        console.log('Token updated in session manager');
        return true;
      } else {
        console.log('Token regeneration failed, preserving session for manual logout');
        // Do not clear session automatically; let user decide to logout
        return false;
      }
    }
  }

  // Enhanced API call wrapper with automatic token regeneration
  async makeAuthenticatedRequest<T>(
    requestFn: (token: string) => Promise<T>,
    maxRetries: number = 1
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        console.log(`[API] Attempt ${attempt + 1}/${maxRetries + 1} - Getting token...`);
        const token = await sessionManager.getToken();
        
        if (!token) {
          console.log('[API] No token available, attempting token regeneration...');
          
          // Try to regenerate token before giving up
          const regeneratedToken = await sessionManager.regenerateToken();
          if (regeneratedToken) {
            console.log('[API] Token regenerated successfully, retrying request...');
            await sessionManager.updateActivityTime();
            return await requestFn(regeneratedToken);
          } else {
            console.log('[API] Token regeneration failed, preserving session for manual logout');
            throw new Error('Authentication failed. Please try again.');
          }
        }

        console.log(`[API] Using existing token for attempt ${attempt + 1}`);
        // Update activity time on every API call
        await sessionManager.updateActivityTime();

        return await requestFn(token);
      } catch (error: any) {
        lastError = error;
        console.log(`[API] Attempt ${attempt + 1} failed:`, error.message || error);

        if (isNetworkError(error)) {
          throw new Error(networkErrorMsg);
        }
        
        // Check if it's a token expiration error
        if (isTokenExpiredError(error) && attempt < maxRetries) {
          console.log('[API] Token expired, attempting regeneration...');
          
          // Try to regenerate token
          const regeneratedToken = await sessionManager.regenerateToken();
          if (regeneratedToken) {
            console.log('[API] Token regenerated successfully, retrying request...');
            continue; // Retry with new token
          } else {
            console.log('[API] Token regeneration failed, preserving session for manual logout');
            throw new Error('Authentication failed. Please try again.');
          }
        } else {
          // Not a token error or max retries reached
          console.log('[API] Not a token error or max retries reached, throwing error');
          throw error;
        }
      }
    }

    console.log('[API] All attempts failed');
    throw lastError || new Error('Request failed after retries');
  }

  async checkAuthType(username: string): Promise<AuthTypeResponse> {
    const options = {
      method,
      headers: new Headers({ ...fixedHeaders }),
      timeout
    };
    
    try {
      // Use the main authentication endpoint to check auth type
      const data = {
        username: username.toLowerCase().trim(),
        password: '', // Empty password to check auth type
        otp: '',
        resend_otp: 'no',
        phone_no: username.toLowerCase().trim(),
        login_from: 'app',
        request_source: 'app',
        request_app: 'user_app'
      };
      
      const formData = toFormData(data);
      
      if (Loggable) {
        console.log('=== CHECK AUTH TYPE REQUEST ===');
        console.log('URL:', `${url}/selfcareL2sUserLogin`);
        console.log('Data:', data);
      }

      const res = await fetch(`${getApiUrl()}/selfcareL2sUserLogin`, {
        ...options,
        body: formData,
      });
      
      const response = await res.json();
      
      if (Loggable) {
        console.log('=== CHECK AUTH TYPE RESPONSE ===');
        console.log('Response:', response);
      }
      
      if (response.status === 'ok' && response.data) {
        // Determine auth type based on response
        if (response.data.auth_type) {
          return { auth_type: response.data.auth_type };
        } else if (response.message && response.message.includes('OTP')) {
          return { auth_type: 'otp' };
        } else {
          return { auth_type: 'password' };
        }
      } else if (response.status === 'error') {
        if (response.message && response.message.includes('Token Expired')) {
          // Handle token expired - this shouldn't happen for auth type check
          throw new Error('Authentication service unavailable. Please try again.');
        } else {
          throw new Error(response.message || 'Failed to check authentication type');
        }
      } else {
        // Default to password if we can't determine
        return { auth_type: 'password' };
      }
    } catch (e: any) {
      const msg = isNetworkError(e) ? networkErrorMsg : e.message;
      throw new Error(msg);
    }
  }

  // Fetch dynamic menu settings
  async getMenuSettings(): Promise<any> {
    return this.makeAuthenticatedRequest(async (token) => {
      let username = await sessionManager.getUsername();
      if (!username) {
        const session = await sessionManager.getCurrentSession();
        username = session?.username || '';
      }
      if (!username) {
        //console.log('[API] /selfcareMenuSettings missing username');
        throw new Error('No username available for menu request');
      }
      const data = {
        username,
        request_source: 'app',
        request_app: 'user_app'
      };

      const options = {
        method,
        headers: new Headers({ Authentication: token || '', ...fixedHeaders }),
        body: toFormData(data),
        timeout
      } as any;

      const menuSettingsUrl = `${getApiUrl()}/selfcareMenuSettings`;
      console.log('[API] Menu settings endpoint:', menuSettingsUrl);
      console.log('[API] Menu settings request:', { method, username, request_source: data.request_source, request_app: data.request_app });
      const res = await fetchWithTimeout(menuSettingsUrl, options);
      const response = await res.json();
      // console.log('[API] POST /selfcareMenuSettings response', {
      //   status: response?.status,
      //   code: response?.code,
      //   message: response?.message,
      //   keys: response ? Object.keys(response) : []
      // });

      // Throw on error so makeAuthenticatedRequest can retry (e.g. token expired)
      if (response?.status !== 'ok' && response?.code !== 200) {
        const apiMessage = response?.message || '';
        if (isTokenExpiredMessage(apiMessage)) {
          throw new Error('Token Expired');
        }
        throw new Error(apiMessage || 'Failed to fetch menu settings');
      }
      return response?.data ?? response;
    });
  }

  /** Fetch CRM runtime config (e.g. user_self_diagnosis for Fix Your Internet flows). */
  async fetchCrmRuntimeConfigs(configName: string): Promise<any> {
    return this.makeAuthenticatedRequest(async (token) => {
      const username = await sessionManager.getUsername();
      if (!username) {
        throw new Error('No username found in session');
      }

      const data = {
        config_name: configName,
        username: username.toLowerCase().trim(),
        request_source: 'app',
        request_app: 'user_app',
      };

      const options = {
        method,
        headers: new Headers({ Authentication: token, ...fixedHeaders }),
        body: toFormData(data),
        timeout,
      } as any;

      const url = `${getApiUrl()}/selfcareFetchCrmRuntimeConfigs`;
      const res = await fetchWithTimeout(url, options);
      const response = await res.json();

      if (response?.status !== 'ok' && response?.code !== 200) {
        const apiMessage = response?.message || '';
        if (isTokenExpiredMessage(apiMessage)) {
          throw new Error('Token Expired');
        }
        throw new Error(apiMessage || 'Failed to fetch CRM runtime config');
      }

      return response?.data ?? response;
    });
  }

  /** Check customer onboarding flow after login (debug / routing). */
  async checkCustomerOnboardingFlow(username?: string): Promise<any> {
    return this.makeAuthenticatedRequest(async (token) => {
      let resolvedUsername = username?.trim() || '';
      if (!resolvedUsername) {
        resolvedUsername = (await sessionManager.getUsername()) || '';
      }
      if (!resolvedUsername) {
        const session = await sessionManager.getCurrentSession();
        resolvedUsername = session?.username || '';
      }
      if (!resolvedUsername) {
        throw new Error('No username available for onboarding flow check');
      }

      const normalizedUsername = resolvedUsername.toLowerCase().trim();
      const data = {
        username: normalizedUsername,
        request_source: 'app',
        request_app: 'user_app',
        action: 'check'
      };

      const options = {
        method,
        headers: new Headers({ Authentication: token || '', ...fixedHeaders }),
        body: toFormData(data),
        timeout,
      } as any;

      console.log('[API] POST /selfcareCheckCustomerOnboardingFlow start', {
        username: normalizedUsername,
        hasToken: !!token,
      });

      const res = await fetchWithTimeout(
        `${getApiUrl()}/selfcareCheckCustomerOnboardingFlow`,
        options,
      );
      const rawResponseText = await res.text();
      const contentType =
        (res.headers && (res.headers as any).get && (res.headers as any).get('content-type')) ||
        'unknown';
      let response: any;
      try {
        response = rawResponseText ? JSON.parse(rawResponseText) : {};
      } catch (parseError) {
        console.log('=== selfcareCheckCustomerOnboardingFlow PARSE ERROR ===');
        console.log('[OnboardingFlow] HTTP status:', res.status);
        console.log('[OnboardingFlow] Content-Type:', contentType);
        console.log(
          '[OnboardingFlow] Raw body (first 500 chars):',
          rawResponseText ? rawResponseText.slice(0, 500) : '<empty response body>',
        );
        console.log('=== END selfcareCheckCustomerOnboardingFlow PARSE ERROR ===');
        // Keep login flow resilient: this endpoint is informational/non-blocking.
        return null;
      }

      console.log('=== selfcareCheckCustomerOnboardingFlow RESPONSE ===');
      try {
        console.log(JSON.stringify(response, null, 2));
      } catch {
        console.log(response);
      }
      console.log('[OnboardingFlow] HTTP status:', res.status);
      console.log('[OnboardingFlow] Content-Type:', contentType);
      console.log('=== END selfcareCheckCustomerOnboardingFlow RESPONSE ===');

      if (response?.status !== 'ok' && response?.code !== 200) {
        console.log('[OnboardingFlow] Non-success response, skipping routing update:', {
          status: response?.status,
          code: response?.code,
          message: response?.message,
          httpStatus: res.status,
        });
        // Keep login flow resilient: this endpoint is informational/non-blocking.
        return null;
      }

      return response?.data ?? response;
    });
  }

  // Realm-based variant using credential flow (mirrors bannerDisplay)
  async menuSettings(realm: string) {
    try {
      const { Authentication } = await this.getCredentials(realm);
      // Ensure username is included
      let username = await sessionManager.getUsername();
      if (!username) {
        const session = await sessionManager.getCurrentSession();
        username = session?.username || '';
      }
      if (!username) {
        console.warn('[API] menuSettings: username missing');
        throw new Error('Username missing for menu settings');
      }
      const data = {
        username,
        request_source: 'app',
        request_app: 'user_app'
      };

      const options = {
        method,
        headers: headers(Authentication),
        body: toFormData(data),
        timeout
      } as any;

      //console.log('[API] POST /selfcareMenuSettings start (realm variant)', { hasToken: !!Authentication, username });
      const res = await fetch(`${getApiUrl()}/selfcareMenuSettings`, options);
      const response = await res.json();
      //console.log('[API] POST /selfcareMenuSettings response (realm variant)', {
      //  status: response?.status,
      //  code: response?.code,
      //  message: response?.message,
      //});
      if (response.status != 'ok' && response.code != 200) {
        throw new Error(response.message || 'Failed to fetch menu settings');
      } else {
        return response.data ?? [];
      }
    } catch (e: any) {
      const msg = isNetworkError(e) ? networkErrorMsg : e.message;
      console.warn('[API] menuSettings failed', msg);
      throw new Error(msg);
    }
  }

  async authenticate(username: string, password: string, otp: string = '', resend_otp: string = 'none', phone_no?: string, auth_type?: 'password' | 'otp'): Promise<LoginResponse> {
    // Get dynamic API URL based on current client config
    const currentApiUrl = getApiUrl();
    const clientConfig = getClientConfig();
    
    const data: LoginRequest = {
      username: username.toLowerCase().trim(),
      password: password,
      otp: otp,
      resend_otp,
      phone_no,
      user_type: 'user',
      login_from: 'app',
      request_source: 'app',
      request_app: 'user_app',
      auth_type: auth_type
    };

    // console.log('Using client for login:', clientConfig.clientId);
    // console.log('API Request Data:', data);
    // console.log('API URL:', `${currentApiUrl}/selfcareL2sUserLogin`);

    const options = {
      method,
      body: toFormData(data),
      headers: new Headers({ ...fixedHeaders }),
      timeout
    };

    try {
      // console.log('=== LOGIN API REQUEST ===');
      // console.log('Making API request...');
      // console.log('Full URL:', `${currentApiUrl}/selfcareL2sUserLogin`);
      // console.log('Request Data:', JSON.stringify(data, null, 2));
      
      const res = await fetchWithTimeout(`${currentApiUrl}/selfcareL2sUserLogin`, options);
      // console.log('Response status:', res.status);
      // console.log('Response statusText:', res.statusText);
      // console.log('Response headers:', JSON.stringify(Object.fromEntries(res.headers.entries()), null, 2));
      
      const response = await res.json();
      // console.log('=== LOGIN API RESPONSE ===');
      // console.log('Full Response:', JSON.stringify(response, null, 2));
      // console.log('Response status:', response.status);
      // console.log('Response code:', response.code);
      // console.log('Response message:', response.message);
      // console.log('Response data:', response.data);
      // if (response.data) {
      //   console.log('Response data.token:', response.data?.token ? 'Token present' : 'Token missing');
      //   console.log('Response data keys:', response.data ? Object.keys(response.data) : 'No data');
      // }
      // console.log('=== END LOGIN API RESPONSE ===');
      
      if (response.status !== 'ok' && response.code !== 200) {
        console.error('API Error:', response.message);
        throw new Error(response.message || 'Login failed');
      } else {
        console.log('=== AFTER LOGIN API RESPONSE (DATA RETURNED) ===');
        try {
          console.log(JSON.stringify(response.data, null, 2));
        } catch {
          console.log(response.data);
        }
        console.log('=== END AFTER LOGIN API RESPONSE (DATA RETURNED) ===');
        return response.data;
      }
    } catch (e: any) {
      console.error('=== LOGIN API REQUEST ERROR ===');
      console.error('Error type:', e.constructor.name);
      console.error('Error message:', e.message);
      console.error('Error stack:', e.stack);
      if (e.response) {
        console.error('Error response:', e.response);
      }
      console.error('=== END LOGIN API REQUEST ERROR ===');
      const msg = isNetworkError(e) ? networkErrorMsg : e.message;
      throw new Error(msg);
    }
  }

  /**
   * Verify OTP without sending auth_type/login_from/resend_otp.
   * Required params: username, otp, request_source, request_app.
   */
  async verifyOtp(username: string, otp: string): Promise<LoginResponse> {
    const normalizedUsername = username.toLowerCase().trim();
    const data = {
      username: normalizedUsername,
      otp: otp,
      phone_no: normalizedUsername, // same as username for OTP login
      request_source: 'app',
      request_app: 'user_app',
    };

    // console.log('API OTP Verify Data:', data);
    // console.log('API URL:', `${url}/selfcareL2sUserLogin`);

    const options = {
      method,
      body: toFormData(data),
      headers: new Headers({ ...fixedHeaders }),
      timeout
    };

    try {
      const res = await fetch(`${getApiUrl()}/selfcareL2sUserLogin`, options);
      const response = await res.json();
      console.log('=== AFTER OTP LOGIN API RESPONSE (RAW) ===');
      try {
        console.log(JSON.stringify(response, null, 2));
      } catch {
        console.log(response);
      }
      console.log('=== END AFTER OTP LOGIN API RESPONSE (RAW) ===');

      if (response.status !== 'ok' && response.code !== 200) {
        throw new Error(response.message || 'OTP verification failed');
      }

      return response.data;
    } catch (e: any) {
      const msg = isNetworkError(e) ? networkErrorMsg : e.message;
      throw new Error(msg);
    }
  }

  async authUser(user_id: string) {
    const normalizedUsername = user_id.toLowerCase().trim();
    
    // CRITICAL: Check if cached data is for a different user
    // If username doesn't match, clear cache and fetch fresh data
    if (this.authUserCache && this.authUserCache.username !== normalizedUsername) {
      //console.log('[API] 🚨 Cached data is for different user! Clearing cache.');
      //console.log('[API] Cached username:', this.authUserCache.username, 'Requested:', normalizedUsername);
      this.clearAuthUserCache();
    }
    
    // TTL cache check - only use cache if username matches
    if (this.authUserCache && 
        this.authUserCache.username === normalizedUsername &&
        Date.now() - this.authUserCache.ts < this.AUTHUSER_TTL_MS) {
      // console.log('[API] ✅ Using cached data for user:', normalizedUsername);
      return this.authUserCache.data
    }
    
    // in-flight dedupe
    if (this.authUserInFlight) {
      return this.authUserInFlight
    }
    
    this.authUserInFlight = this.makeAuthenticatedRequest(async (token: string) => {
      const data = {
        username: normalizedUsername,
        fetch_company_details: 'yes',
        fetch_sales_details: 'yes',
        request_source: 'app',
        request_app: 'user_app'
      };

      const options = {
        method,
        headers: new Headers({ Authentication: token, ...fixedHeaders }),
        body: toFormData(data),
        timeout
      };

      try {
        //console.log('[API] Fetching fresh data for user:', normalizedUsername);
        const res = await fetchWithTimeout(`${getApiUrl()}/selfcareHelpdesk`, options);
        const response = await res.json();
        if (response.status !== 'ok' && response.code !== 200) {
          const apiMessage = response?.message || '';
          if (isTokenExpiredMessage(apiMessage)) {
            throw new Error('Token Expired');
          }
          throw new Error(apiMessage || 'Failed to load account data');
        } else {
          // CRITICAL: Store username with cached data to verify on next request
          this.authUserCache = { 
            data: response.data, 
            ts: Date.now(),
            username: normalizedUsername
          };
          //console.log('[API] ✅ Cached fresh data for user:', normalizedUsername);
          return response.data;
        }
      } catch (e: any) {
        const msg = isNetworkError(e) ? networkErrorMsg : e.message;
        throw new Error(msg);
      } finally {
        this.authUserInFlight = null
      }
    })

    return this.authUserInFlight
  }

  async logout() {
    try {
      await sessionManager.clearSession();
      return { success: true, message: 'Logged out successfully' };
    } catch (error) {
      console.error('Logout error:', error);
      return { success: false, message: 'Logout failed' };
    }
  }

  async isAuthenticated(): Promise<boolean> {
    try {
      const isLoggedIn = await sessionManager.isLoggedIn();
      return isLoggedIn;
    } catch (error) {
      console.error('Error checking authentication:', error);
      return false;
    }
  }

  async getUserData(): Promise<any | null> {
    try {
      const session = await sessionManager.getCurrentSession();
      return session;
    } catch (error) {
      console.error('Error getting user data:', error);
      return null;
    }
  }

  async testApiConnection() {
    try {
      const res = await fetch(`${getApiUrl()}/selfcareL2sUserLogin`, {
        method,
        headers: new Headers({ ...fixedHeaders })
      });
      return res.ok;
    } catch (error) {
      console.error('API connection test failed:', error);
      return false;
    }
  }

  async userLedger(username: string, realm: string) {
    return this.makeAuthenticatedRequest(async (token: string) => {
      // console.log('=== API SERVICE: userLedger called with ===', { username, realm });
      
      // console.log('=== API SERVICE: Got authentication token ===', !!token);
      
      const data = {
        username: username,
        get_user_invoice: true,
        get_user_receipt: true,
        get_proforma_invoice: true,
        get_user_opening_balance: true,
        get_user_payment_dues: true,
        request_source: 'app',
        request_app: 'user_app' 
      };

      // console.log('=== API SERVICE: Request data ===', data);

      const options = {
        method,
        headers: headers(token),
        body: toFormData(data),
        timeout
      };

      // console.log('=== API SERVICE: Making API call to ===', `${url}/selfcareGetUserInformation`);

      try {
        const res = await fetch(`${getApiUrl()}/selfcareGetUserInformation`, options);
        // console.log('=== API SERVICE: Response status ===', res.status);
        
        const response = await res.json();
        // console.log('=== API SERVICE: Raw API response ===', response);
        
        if (response.status !== 'ok' && response.code !== 200) {
          // console.log('=== API SERVICE: API returned error ===', response);
          throw new Error(response.message);
        } else {
          // console.log('=== API SERVICE: Processing successful response ===');
          const resArr: any = [];
          
          // Add proforma invoices
          resArr.proforma_payment = response.data.user_profoma_invoice || [];
          
          // Add receipts (payments)
          if (response.data.user_receipt) {
            // console.log('=== API SERVICE: Processing receipts ===', response.data.user_receipt);
            resArr.push(
              response.data.user_receipt.map((data: any, index: number) => {
                // console.log('=== API SERVICE: Receipt date ===', data.receipt_date);
                return {
                  index,
                  no: data.receipt_prefix + data.receipt_no,
                  amt: data.amount,
                  content: data.payment_method,
                  view: data.remarks,
                  dateString: this.formatDate(data.receipt_date, 'DD-MMM,YY HH:mm'),
                  id: data.id,
                  type: 'receipt'
                };
              })
            );
          } else {
            resArr.push([]);
          }
          
          // Add invoices
          if (response.data.user_invoice) {
            // console.log('=== API SERVICE: Processing invoices ===', response.data.user_invoice);
            resArr.push(
              response.data.user_invoice.map((data: any, index: number) => {
                // console.log('=== API SERVICE: Invoice date ===', data.invoice_date);
                return {
                  index,
                  no: data.invoice_prefix + data.invoice_no,
                  amt: data.sale_amount,
                  content: data.invoice_particulars,
                  view: data.remarks,
                  dateString: this.formatDate(data.invoice_date, 'DD-MMM,YY HH:mm'),
                  id: data.id,
                  type: 'invoice'
                };
              })
            );
          } else {
            resArr.push([]);
          }
          
          // Add proforma invoices
          if (response.data.user_profoma_invoice) {
            // console.log('=== API SERVICE: Processing proforma invoices ===', response.data.user_profoma_invoice);
            resArr.push(
              response.data.user_profoma_invoice.map((data: any, index: number) => {
                // console.log('=== API SERVICE: Proforma invoice date ===', data.invoice_date);
                return {
                  index,
                  no: data.proforma_ref_no,
                  amt: data.sale_amount,
                  content: data.invoice_particulars,
                  view: data.remarks,
                  dateString: this.formatDate(data.invoice_date, 'DD-MMM,YY HH:mm'),
                  id: data.id,
                  type: 'proforma'
                };
              })
            );
          } else {
            resArr.push([]);
          }
          
          // Add summary data
          resArr.push({
            openingBalance: response.data.user_opening_balance?.[0] ? Math.round(response.data.user_opening_balance[0].opening_balance) : 0,
            billAmount: Math.round(response.data.user_invoice_total || 0),
            paidAmount: Math.round(response.data.user_receipt_total || 0),
            proforma_invoice: Math.round(response.data.user_profoma_invoice_total || 0),
            balance: Math.round(response.data.user_payment_dues || 0)
          });
          
          // console.log('=== API SERVICE: Final processed data ===', resArr);
          return resArr;
        }
      } catch (e: any) {
        console.error('=== API SERVICE: Error in userLedger ===', e);
        const msg = isNetworkError(e) ? networkErrorMsg : e.message;
        throw new Error(msg);
      }
    });
  }

  // Enhanced download PDF with automatic token regeneration
  async downloadInvoicePDF(id: string, invoiceNo: string) {
    return this.makeAuthenticatedRequest(async (token: string) => {
      const data = {
        id: id,
        invoice_no: invoiceNo,
        request_source: 'app',
        request_app: 'user_app'
      };

      const options = {
        method,
        headers: new Headers({ Authentication: token, ...fixedHeaders }),
        body: toFormData(data)
      };

      const res = await fetch(`${getApiUrl()}/selfcareGenerateInvoicePDF`, options);
      
      if (!res.ok) {
        const errorResponse = await res.json();
        throw new Error(errorResponse.message || 'Failed to generate PDF');
      }
      
      return res;
    });
  }

  async downloadReceiptPDF(id: string, receiptNo: string) {
    return this.makeAuthenticatedRequest(async (token: string) => {
      const data = {
        id: id,
        receipt_no: receiptNo,
        request_source: 'app',
        request_app: 'user_app'
      };

      const options = {
        method,
        headers: new Headers({ Authentication: token, ...fixedHeaders }),
        body: toFormData(data)
      };

      const res = await fetch(`${getApiUrl()}/selfcareGenerateReceiptPDF`, options);
      
      if (!res.ok) {
        const errorResponse = await res.json();
        throw new Error(errorResponse.message || 'Failed to generate PDF');
      }
      
      return res;
    });
  }

  private async getCredentials(realm: string) {
    // This would need to be implemented based on your authentication system
    // For now, we'll use the session token
    const token = await sessionManager.getToken();
    if (!token) {
      throw new Error('No authentication token available');
    }
    return { Authentication: token };
  }

  private formatDate(dateString: string, format: string): string {
    // console.log('=== API SERVICE: Formatting date ===', { dateString, format });
    
    try {
      // Handle the specific format 'DD-MMM,YY HH:mm' (e.g., "12-May,26 01:05")
      if (format === 'DD-MMM,YY HH:mm') {
        // If the date is already in the expected format, return it as-is
        if (dateString.match(/^\d{1,2}-[A-Za-z]{3},\d{2}\s+\d{1,2}:\d{2}$/)) {
          return dateString;
        }
        
        // Handle "DD-MM-YYYY HH:mm" format (e.g., "25-04-2025 10:56")
        if (dateString.match(/^\d{1,2}-\d{2}-\d{4}\s+\d{1,2}:\d{2}$/)) {
          const parts = dateString.split(' ');
          const datePart = parts[0]; // "25-04-2025"
          const timePart = parts[1] || ''; // "10:56"
          
          const [day, month, year] = datePart.split('-');
          const monthNum = parseInt(month, 10) - 1; // Month is 0-indexed
          const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          const monthAbbr = monthNames[monthNum];
          const year2Digit = year.slice(-2);
          
          return `${day}-${monthAbbr},${year2Digit} ${timePart}`;
        }
        
        // Parse the date string manually if it's in a different format
        const parts = dateString.split(' ');
        if (parts.length >= 2) {
          const datePart = parts[0]; // Could be "12-May,26" or "2026-05-12" or "12/05/2026"
          const timePart = parts[1] || ''; // "01:05" or empty
          
          // Try to parse as ISO date or standard date format
          let date: Date;
          if (datePart.includes('-') && datePart.match(/^\d{4}-\d{2}-\d{2}/)) {
            // ISO format: "2026-05-12"
            date = new Date(dateString);
          } else if (datePart.includes('/')) {
            // Format like "12/05/2026"
            const [day, month, year] = datePart.split('/');
            date = new Date(`${year}-${month}-${day} ${timePart}`);
          } else {
            // Try standard Date parsing
            date = new Date(dateString);
          }
          
          if (!isNaN(date.getTime())) {
            // Format to "DD-MMM,YY HH:mm" (e.g., "12-May,26 01:05")
            const day = date.getDate().toString();
            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const month = monthNames[date.getMonth()];
            const year = date.getFullYear().toString().slice(-2);
            const hours = date.getHours().toString().padStart(2, '0');
            const minutes = date.getMinutes().toString().padStart(2, '0');
            
            return `${day}-${month},${year} ${hours}:${minutes}`;
          }
        }
      }
      
      // Fallback: try to parse as regular date and format to expected format
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) {
        // Format to "DD-MMM,YY HH:mm" (e.g., "12-May,26 01:05")
        const day = date.getDate().toString();
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const month = monthNames[date.getMonth()];
        const year = date.getFullYear().toString().slice(-2);
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        
        return `${day}-${month},${year} ${hours}:${minutes}`;
      }
      
      // If all else fails, return the original string
      // console.log('=== API SERVICE: Could not parse date, returning original ===', dateString);
      return dateString;
    } catch (error) {
      // console.error('=== API SERVICE: Error formatting date ===', error);
      return dateString;
    }
  }

  // Additional methods can be added here following the same pattern
  // For example: planList, userPaymentDues, submitComplaint, etc.

  async lastTenSessions(username: string, accountStatus: string, realm: string) {
    return this.makeAuthenticatedRequest(async (token: string) => {
      const data = {
        username: username.toLowerCase().trim(),
        account_status: accountStatus,
        last_ten_session: 'yes',
        request_source: 'app',
        request_app: 'user_app' 
      };

      const options = {
        method,
        headers: new Headers({ Authentication: token, ...fixedHeaders }),
        body: toFormData(data),
        timeout
      };

      try {
        const res = await fetch(`${getApiUrl()}/selfcareUsageDetails`, options);
        console.log('Response status:', res.status);
        
        const response = await res.json();
        console.log('=== SESSIONS API RESPONSE ===');
        console.log('Status:', response.status, 'Code:', response.code);
        console.log('Sessions found:', response.data?.length || 0);
        
        if (response.status === 'ok' && response.data) {
          if (Array.isArray(response.data)) {
            console.log('✅ Processing', response.data.length, 'sessions');
            
            const units = ['download', 'upload', 'total_upload_download'];
            const processedSessions = response.data.map((s: any, index: number) => {
              var result = s.login_time.split(" ");
              
              var session: any = {
                index: index + 1,
                ipAddress: s.framed_ip_address,
                loginTime: result[1],
                loginDate: result[0],
                loginTs: s.login_time,
                logoutTs: s.logout_time,
                sessionTime: s.online_time
              }
              
              units.forEach(unit => {
                const originalValue = s[unit];
                session[unit] = originalValue.length > 9 ? (
                  `${Math.round(Number(originalValue) / 10000000) / 100} GB`
                ) : (
                    `${Math.round(Number(originalValue) / 10000) / 100} MB`
                  );
              });
              
              return session;
            });
            
            console.log('✅ Sessions processed successfully');
            return processedSessions;
          } else {
            console.log('❌ No sessions array in response');
            console.log('Response data type:', typeof response.data);
            console.log('Response data:', response.data);
            return [];
          }
        } else if (response.status === 'error') {
          console.log('❌ API error:', response.message);
          throw new Error(response.message || 'Failed to fetch sessions');
        } else {
          console.log('❌ Unexpected response format');
          console.log('Response:', response);
          return [];
        }
      } catch (error: any) {
        console.error('Error fetching sessions:', error);
        throw new Error(error.message || 'Failed to fetch sessions');
      }
    });
  }

  async lastTenComplaints(realm: string = 'default') {
    return this.makeAuthenticatedRequest(async (token: string) => {
      // Get username from session manager
      const username = await sessionManager.getUsername();
      if (!username) {
        throw new Error('No username found in session');
      }

      const data = {
        username: username.toLowerCase().trim(),
        last_ten_tickets: 'yes',
        request_source: 'app',
        request_app: 'user_app'
      };

      const options = {
        method,
        headers: new Headers({ Authentication: token, ...fixedHeaders }),
        body: toFormData(data),
        timeout
      };

      try {
        const res = await fetch(`${getApiUrl()}/selfcareCrmViewTickets`, options);
        const response = await res.json();
        
        if (response.status === 'ok' && response.code !== 200) {
          if (response.message === "No Content" || response.message === "No Complaints Found.") {
            return [];
          } else {
            throw new Error(response.message);
          }
        } else {
          return response.data.map((ticketObj: any, index: number) => ({
            id: ticketObj.id || `ticket_${index}`,
            ticketNo: ticketObj.ticket_no || `TKT${index}`,
            title: ticketObj.category_name || 'No Title',
            remarks: ticketObj.remarks || 'No Remarks',
            status: ticketObj.current_ticket_status || 'Open',
            priority: ticketObj.ticket_prio || 'Medium',
            dateCreated: ticketObj.ticket_created_date || 'N/A',
            dateClosed: ticketObj.ticket_closed_date,
            index
          }));
        }
      } catch (e: any) {
        if (isNetworkError(e)) {
          throw new Error(networkErrorMsg);
        } else {
          throw new Error(e.message);
        }
      }
    });
  }

  async getComplaintProblems(realm: string) {
    return this.makeAuthenticatedRequest(async (token: string) => {
      const username = await sessionManager.getUsername();
      if (!username) {
        throw new Error('No username found in session');
      }

      const data = {
        username: username.toLowerCase().trim(),
        combo_code: 'fetch_parent_complaints',
        column: 'selfcare_display',
        value: 'yes',
        request_source: 'app',
        request_app: 'user_app'
      };

      const options = {
        method,
        headers: new Headers({ Authentication: token, ...fixedHeaders }),
        body: toFormData(data),
        timeout
      };

      try {
        const res = await fetch(`${getApiUrl()}/selfcareDropdown`, options);
        const response = await res.json();
        
        if (response.status !== 'ok' && response.code !== 200) {
          throw new Error('Could not find complaint options. Please try again.');
        } else {
          return response.data;
        }
      } catch (e: any) {
        if (isNetworkError(e)) {
          throw new Error(networkErrorMsg);
        } else {
          throw new Error(e.message || 'Failed to fetch complaint problems');
        }
      }
    });
  }

  async getFaqList(complaintId: string) {
    return this.makeAuthenticatedRequest(async (token: string) => {
      const username = await sessionManager.getUsername();
      if (!username) {
        throw new Error('No username found in session');
      }

      const data = {
        crm_csi_id: complaintId,
        username: username.toLowerCase().trim(),
        request_source: 'app',
        request_app: 'user_app'
      };

      const options = {
        method,
        headers: new Headers({ Authentication: token, ...fixedHeaders }),
        body: toFormData(data),
        timeout
      };

      try {
        const res = await fetch(`${getApiUrl()}/selfcareComplaintWiseFAQ`, options);
        const response = await res.json();

        if ((response.status !== 'ok' && response.code !== 200) || response.code === 999) {
          throw new Error(response.message || 'Failed to fetch FAQs');
        }

        return response.data || [];
      } catch (e: any) {
        if (isNetworkError(e)) {
          throw new Error(networkErrorMsg);
        } else {
          throw new Error(e.message || 'Failed to fetch FAQs');
        }
      }
    });
  }

  async getSubComplaintList(parentComplaintId: string) {
    return this.makeAuthenticatedRequest(async (token: string) => {
      const username = await sessionManager.getUsername();
      if (!username) {
        throw new Error('No username found in session');
      }

      const data = {
        combo_code: 'fetch_parent_complaints',
        column: 'parent_id',
        value: parentComplaintId,
        'extraparams[selfcare_display]': 'yes',
        username: username.toLowerCase().trim(),
        request_source: 'app',
        request_app: 'user_app'
      };

      const options = {
        method,
        headers: new Headers({ Authentication: token, ...fixedHeaders }),
        body: toFormData(data),
        timeout
      };

      try {
        const res = await fetch(`${getApiUrl()}/selfcareDropdown`, options);
        const response = await res.json();

        if ((response.status !== 'ok' && response.code !== 200) || response.code === 999) {
          throw new Error(response.message || 'Failed to fetch sub complaints');
        }

        return response.data || [];
      } catch (e: any) {
        if (isNetworkError(e)) {
          throw new Error(networkErrorMsg);
        } else {
          throw new Error(e.message || 'Failed to fetch sub complaints');
        }
      }
    });
  }

  async submitComplaint(username: string, problem: any, customMsg: string, realm: string) {
    return this.makeAuthenticatedRequest(async (token: string) => {
      const data: any = {
        username,
        problem_id: problem.value,
        call_type: 'complaint',
        current_ticket_status: 'open',
        ticket_source: 'selfcare',
        ticket_prio: 'medium',
        request_source: 'app',
        request_app: 'user_app'
      };

      if (customMsg && customMsg !== '') {
        data.remarks = customMsg;
      }

      const options = {
        method,
        headers: new Headers({ Authentication: token, ...fixedHeaders }),
        body: toFormData(data),
        timeout
      };

      try {
        const res = await fetch(`${getApiUrl()}/selfcareCreateTicket`, options);
        const response = await res.json();
        
        if (response.status !== 'ok' && response.code !== 200) {
          let msg = 'You have already open complaint. So you can not create new complaint.';
          let error = response.message === msg ?
            'Sorry, we cannot accept a new complaint while an open ticket exists' :
            response.message;
          throw new Error(error);
        } else {
          return { success: true, message: response.message || 'Ticket created successfully' };
        }
      } catch (e: any) {
        if (isNetworkError(e)) {
          throw new Error(networkErrorMsg);
        } else {
          throw new Error(e.message || 'Failed to create ticket');
        }
      }
    });
  }

  async viewUserKyc(username: string, realm: string) {
    return this.makeAuthenticatedRequest(async (token: string) => {
      const data = {
        username: username.toLowerCase().trim(),
        request_source: 'app',
        request_app: 'user_app' 
      };

      const options = {
        method,
        headers: new Headers({ Authentication: token, ...fixedHeaders }),
        body: toFormData(data),
        timeout
      };

      try {
        const res = await fetch(`${getApiUrl()}/selfcareViewUserKyc`, options);
        const response = await res.json();
        
        if (response.status !== 'ok' && response.code !== 200) {
          console.error('viewUserKyc error:', response);
          throw new Error('Invalid username or password');
        } else {
          return response.data;
        }
      } catch (e: any) {
        if (isNetworkError(e)) {
          throw new Error(networkErrorMsg);
        } else {
          throw new Error(e.message || 'Failed to fetch KYC data');
        }
      }
    });
  }

  async planList(adminname: string, username: string, currentplan: string, isShowAllPlan: boolean, is_dashboard: boolean, realm: string): Promise<any[]> {
    return this.makeAuthenticatedRequest(async (token: string) => {
      const data: any = {
        admin_login_id: adminname,
        username: username.toLowerCase().trim(),
        planname: currentplan,
        is_dashboard: is_dashboard ? is_dashboard : false,
        online_renewal: 'yes',
        request_source: 'app',
        request_app: 'user_app'
      };

      if (isShowAllPlan) {
        data.online_renewal_plan_list = 'yes';
      }

      // console.log('=== API SERVICE: Plan list data ===', data);
      // console.log('=== API SERVICE: Making request to ===', `${url}/selfcareGetPlanAmount`);
      // console.log('=== API SERVICE: Token available ===', !!token);

      const options = {
        method,
        headers: new Headers({ Authentication: token, ...fixedHeaders }),
        body: toFormData(data),
        timeout
      };

      try {
        const res = await fetch(`${getApiUrl()}/selfcareGetPlanAmount`, options);
        console.log('=== API SERVICE: Response status ===', res.status);
        const response = await res.json();
        console.log('=== API SERVICE: Response body ===', response);

        //Alert.alert('Plan list response:', JSON.stringify(response));
        
        if (response.status !== 'ok' && response.code !== 200) {
          //console.log('=== API SERVICE: Error response ===', response);
          throw new Error('Plan list not found. Please try again.');
        } else if (response.status === 'ok' && response.code !== 200) {
          //console.log('=== API SERVICE: Empty response ===');
          return [];
        } else {
          //console.log('=== API SERVICE: Mapping response data ===', response.data);
          if (response.data?.[0]) {
            // console.log('=== API SERVICE: Raw plan data sample ===');
            // console.log('planname:', response.data[0].planname);
            // console.log('description:', response.data[0].description);
            // console.log('download_speed_mb:', response.data[0].download_speed_mb);
            // console.log('amount:', response.data[0].amount);
            // console.log('validity:', response.data[0].validity);
            // console.log('data_xfer:', response.data[0].data_xfer);
            // console.log('ott_plan:', response.data[0].ott_plan);
            // console.log('voice_plan:', response.data[0].voice_plan);
            // console.log('iptv:', response.data[0].iptv);
            // console.log('fup_flag:', response.data[0].fup_flag);
            // console.log('content_providers count:', response.data[0].content_providers?.length || 0);
          }
        const mappedPlans = response.data.map((planObj: any, index: number) => ({
        id: planObj.id || index.toString(),
        name: planObj.planname || planObj.name || '',
        description: planObj.description || '',
        downloadSpeed: planObj.download_speed_mb || planObj.download || '',
        uploadSpeed: planObj.upload_speed_mb || planObj.upload || '',
        days: parseInt(planObj.validity) || parseInt(planObj.days) || 30,
        FinalAmount: parseFloat(planObj.amount) || parseFloat(planObj.FinalAmount) || 0,
        // Set user_base_price as MRP for display; keep amt as base amount for breakdown
        user_mrp: (planObj.user_base_price !== undefined ? parseFloat(planObj.user_base_price) : NaN) ||
                  (planObj.base_price !== undefined ? parseFloat(planObj.base_price) : NaN) || undefined,
        mrp: (planObj.user_base_price !== undefined ? parseFloat(planObj.user_base_price) : NaN) ||
             (planObj.base_price !== undefined ? parseFloat(planObj.base_price) : NaN) || undefined,
        amt: parseFloat(planObj.user_base_price) || parseFloat(planObj.amt) || 0,
        CGSTAmount: parseFloat(planObj.cgst_value) || parseFloat(planObj.CGSTAmount) || 0,
        SGSTAmount: parseFloat(planObj.sgst_value) || parseFloat(planObj.SGSTAmount) || 0,
        limit: planObj.data_xfer || 'Unlimited',
        content_providers: planObj.content_providers || [],
        ott_plan: planObj.ott_plan || 'no',
        voice_plan: planObj.voice_plan || 'no',
        iptv: planObj.iptv || 'no',
        fup_flag: planObj.fup_flag || 'no',
        isExpanded: false
      }));
          // console.log('=== API SERVICE: Mapped plans ===', mappedPlans);
          // if (mappedPlans?.[0]) {
          //   console.log('=== API SERVICE: Mapped plan sample ===');
          //   console.log('Mapped Name:', mappedPlans[0].name);
          //   console.log('Mapped Description:', mappedPlans[0].description);
          //   console.log('Mapped Speed:', mappedPlans[0].downloadSpeed);
          //   console.log('Mapped Price:', mappedPlans[0].FinalAmount);
          //   console.log('Mapped Validity:', mappedPlans[0].days);
          //   console.log('Mapped Data Limit:', mappedPlans[0].limit);
          //   console.log('Mapped OTT Plan:', mappedPlans[0].ott_plan);
          //   console.log('Mapped Voice Plan:', mappedPlans[0].voice_plan);
          //   console.log('Mapped IPTV:', mappedPlans[0].iptv);
          //   console.log('Mapped FUP Flag:', mappedPlans[0].fup_flag);
          //   console.log('Mapped OTT Count:', mappedPlans[0].content_providers?.length || 0);
          // }
          return mappedPlans;
        }
      } catch (e: any) {
        if (isNetworkError(e)) {
          throw new Error(networkErrorMsg);
        } else {
          throw new Error(e.message || 'Failed to fetch plan list');
        }
      }
    });
  }

  async userPaymentDues(username: string, realm: string) {
    return this.makeAuthenticatedRequest(async (token: string) => {
      const data = {
        username: username.toLowerCase().trim(),
        request_source: 'app',
        request_app: 'user_app'
      };

      const options = {
        method,
        headers: new Headers({ Authentication: token, ...fixedHeaders }),
        body: toFormData(data),
        timeout
      };

      try {
        const res = await fetch(`${getApiUrl()}/selfcareGetUserPaymentDues`, options);
        const response = await res.json();
        
        console.log('=== Payment dues API response ===', response);
        
        if (response.status !== 'ok' && response.code !== 200) {
          return '0'; // Return '0' instead of throwing error, as per old implementation
        } else {
          return response.data;
        }
      } catch (e: any) {
        if (isNetworkError(e)) {
          throw new Error(networkErrorMsg);
        } else {
          throw new Error(e.message || 'Failed to fetch payment dues');
        }
      }
    });
  }

  async getAdminTaxInfo(adminname: string, realm: string) {
    return this.makeAuthenticatedRequest(async (token: string) => {
      const username = await sessionManager.getUsername();
      if (!username) {
        throw new Error('No username found in session');
      }

      const data = {
        username: username.toLowerCase().trim(),
        admin_login_id: adminname,
        action: 'settings,tax_info',
        request_source: 'app',
        request_app: 'user_app'
      };

      const options = {
        method,
        headers: new Headers({ Authentication: token, ...fixedHeaders }),
        body: toFormData(data),
        timeout
      };

      try {
        const res = await fetch(`${getApiUrl()}/selfcareGetAdminDetails`, options);
        const response = await res.json();
        
        //console.log('=== Tax info API response ===', response);
        
        if (response.status !== 'ok' && response.code !== 200) {
          throw new Error('Tax info not found. Please try again.');
        } else {
          return response.data;
        }
      } catch (e: any) {
        if (isNetworkError(e)) {
          throw new Error(networkErrorMsg);
        } else {
          throw new Error(e.message || 'Failed to fetch admin tax info');
        }
      }
    });
  }

  async paymentGatewayOptions(adminname: string, realm: string) {
    return this.makeAuthenticatedRequest(async (token: string) => {
      const username = await sessionManager.getUsername();
      if (!username) {
        throw new Error('No username found in session');
      }

      const data = {
        username: username.toLowerCase().trim(),
        admin_login_id: adminname,
        gw_for: 'end_user',
        tp_gateway_type: 'online_payment',
        user_application: 'user_app',
        request_source: 'app',
        request_app: 'user_app'
      };
      //console.log('Payment Gateway API data:', data);

      const options = {
        method,
        headers: new Headers({ Authentication: token, ...fixedHeaders }),
        body: toFormData(data),
        timeout
      };

      try {
        const res = await fetch(`${getApiUrl()}/selfcareAdminWisePaymentGateway`, options);
        const response = await res.json();
        console.log('Payment Gateway API response:', response);
        if (response.status !== 'ok' && response.code !== 200) {
          throw new Error(response.message || 'Could not fetch payment methods. Please try again in some time.');
        } else {
          console.log('Payment Gateway API data:', response.data);
          return response.data;
        }
      } catch (e: any) {
        if (isNetworkError(e)) {
          throw new Error(networkErrorMsg);
        } else {
          throw new Error(e.message || 'Failed to fetch payment gateway options');
        }
      }
    });
  }

  async paymentRequestDetails(
    {
      amount,
      adminname,
      username,
      planname,
      selectedPGType,
      payActionType,
      proforma_invoice,
      refund_amount,
      old_pin_serial,
      campaign_code,
      coupon_amount,
      isp_policy_discount,
      originalAmount
    }: {
      amount: number,
      adminname: string,
      username: string,
      planname?: string,
      selectedPGType: any[],
      payActionType: string,
      proforma_invoice?: string,
      refund_amount?: number,
      old_pin_serial?: string,
      campaign_code?: string | null,
      coupon_amount?: number,
      /** Rupee amount for ISP policy / complimentary discount, or legacy 'yes' | 'no'. */
      isp_policy_discount?: number | string,
      originalAmount?: number
    },
    realm: string
  ) {
    return this.makeAuthenticatedRequest(async (token: string) => {
      const data: any = {
        amount,
        admin_login_id: adminname,
        username,
        tp_gateway_admin_setting_id: selectedPGType && selectedPGType[0].value,
        gw_for: 'end_user',
        payment_purpose: payActionType,
        request_source: 'app',
        request_app: 'user_app'
      };
      if (refund_amount !== undefined) data.refund_amount = refund_amount;
      if (old_pin_serial !== undefined) data.old_pin_serial = old_pin_serial;
      if (proforma_invoice) data.proforma_invoice = proforma_invoice;
      if (planname !== undefined) data.planname = planname;
      if (campaign_code) data.campaign_code = campaign_code;
      if (coupon_amount !== undefined) data.coupon_amount = coupon_amount;
      if (isp_policy_discount !== undefined && isp_policy_discount !== null) {
        data.isp_policy_discount = isp_policy_discount;
      }
      if (originalAmount !== undefined) data.originalAmount = originalAmount;
      
      // Add comprehensive logging
      console.log('=== API PAYMENT REQUEST DEBUG ===');
      console.log('Function parameters received:', {
        amount,
        adminname,
        username,
        planname,
        selectedPGType,
        payActionType,
        campaign_code,
        coupon_amount,
        isp_policy_discount,
        originalAmount
      });
      console.log('Final data object being sent to backend:', data);
      console.log('Realm:', realm);
      console.log('API URL:', `${url}/selfcareMerchantPaymentRequest`);
      console.log('=== END API DEBUG ===');
      
      const options = {
        method,
        headers: new Headers({ Authentication: token, ...fixedHeaders }),
        body: toFormData(data),
        timeout
      };
      
      console.log('=== FINAL REQUEST OPTIONS ===');
      console.log('Method:', method);
      console.log('Headers:', { Authentication: token ? 'exists' : 'missing', ...fixedHeaders });
      console.log('Body (FormData):', 'FormData object created above');
      console.log('Timeout:', timeout);
      console.log('=== END REQUEST OPTIONS ===');
      
      try {
        const res = await fetch(`${getApiUrl()}/selfcareMerchantPaymentRequest`, options);
        const response = await res.json();
        console.log('=== PAYMENT REQUEST API RAW RESPONSE ===');
        console.log(response);
        console.log('=== END PAYMENT REQUEST API RAW RESPONSE ===');
        if (response.status !== 'ok' && response.code !== 200) {
          console.log('=== PAYMENT REQUEST API ERROR RESPONSE ===');
          console.log('status:', response.status);
          console.log('code:', response.code);
          console.log('message:', response.message);
          console.log('=== END PAYMENT REQUEST API ERROR RESPONSE ===');
          throw new Error(response.message);
        }
        return response;
      } catch (e: any) {
        console.log('=== PAYMENT REQUEST API EXCEPTION ===');
        console.log(e);
        console.log('=== END PAYMENT REQUEST API EXCEPTION ===');
        const msg = isNetworkError(e) ? networkErrorMsg : e.message;
        throw new Error(msg);
      }
    });
  }

  async activatePaymentGatewayResponse(
    gatewayId: string,
    merchantTxnRef: string,
    gatewayResponse: any,
    realm: string
  ) { 
    return this.makeAuthenticatedRequest(async (token: string) => {
      const username = await sessionManager.getUsername();
      if (!username) {
        throw new Error('No user session found');
      }

      const payload: Record<string, any> = {
        username: username.toLowerCase().trim(),
        mer_txn_ref: merchantTxnRef,
        tp_gw_id: gatewayId,
        gw_response_json: typeof gatewayResponse === 'string'
          ? gatewayResponse
          : JSON.stringify(gatewayResponse),
        is_verify: false,
        request_source: 'app',
        request_app: 'user_app',
      };

      const encodedBody = param(payload);

      const options = {
        method,
        headers: new Headers({
          Authentication: token,
          ...fixedHeaders,
          'Content-Type': 'application/x-www-form-urlencoded',
        }),
        body: encodedBody,
        timeout,
      };

      try {
        console.log('=== ACTIVATE PAYMENT REQUEST ===');
        console.log('Payload:', payload);
        const res = await fetch(`${getApiUrl()}/selfcareAdminPaymentResponse`, options);
        const response = await res.json();
        console.log('Activate payment response:', response);
        if (response.status !== 'ok' && response.code !== 200) {
          throw new Error(response.message || 'Failed to record payment response');
        }
        return response;
      } catch (e: any) {
        console.error('Activate payment error:', e);
        const msg = isNetworkError(e) ? networkErrorMsg : e.message;
        throw new Error(msg);
      }
    });
  }

  async addDeviceDetails(fcm_token: string, mac_addr: string, hostname: string, device_info: any, realm: string) {
    return this.makeAuthenticatedRequest(async (token: string) => {
      //alert('addDeviceDetails');
      const username = await sessionManager.getUsername();
      if (!username) {
        throw new Error('No username found in session');
      }
      // eslint-disable-next-line no-console
      console.log('[API] addDeviceDetails request', {
        username: username.toLowerCase().trim(),
        realm,
        hostname,
        mac_addr,
        tokenPreview: fcm_token?.slice(0, 10) + '...',
      });
      const data = {
        username: username.toLowerCase().trim(),
        fcm_token,
        mac_addr,
        hostname,
        device_info: JSON.stringify(device_info),
        token_for: 'end_user_app',
        token_owner: 'end_user',
        request_source: 'app',
        request_app: 'user_app'
      };
      const options = {
        method,
        headers: new Headers({ Authentication: token, ...fixedHeaders }),
        body: toFormData(data),
        timeout
      };
      try {
        // eslint-disable-next-line no-console
        //console.log('[API] POST /selfcareAddDeviceInfo start')
        const res = await fetch(`${getApiUrl()}/selfcareAddDeviceInfo`, options);
        const response = await res.json();
        // eslint-disable-next-line no-console
        console.log('[API] POST /selfcareAddDeviceInfo response', {
          status: response?.status,
          code: response?.code,
          message: response?.message,
          dataKeys: response?.data ? Object.keys(response.data) : null,
        });
        // eslint-disable-next-line no-console
        console.log('[API] POST /selfcareAddDeviceInfo full response', response);
        if (response.status !== 'ok' && response.code !== 200) {
          throw new Error('Invalid username or password');
        } else {
          return response;
        }
      } catch (e: any) {
        let msg = isNetworkError(e) ? networkErrorMsg : e.message;
        // eslint-disable-next-line no-console
        console.warn('[API] addDeviceDetails failed', msg)
        throw new Error(msg);
      }
    });
  }

  async bannerDisplay(realm: string) {
    try {
      const { Authentication } = await this.getCredentials(realm);
      const session = await sessionManager.getCurrentSession();
      const data = {
        username: session?.username || '',
        l2s_module: 'user_app',
        request_source: 'app',
        request_app: 'user_app'
      };
      
      const options = {
        method,
        headers: headers(Authentication),
        body: toFormData(data),
        timeout
      };
      
      //console.log('[API] bannerDisplay request payload:', data);

      return fetch(`${getApiUrl()}/selfcareDisplayBanner`, options).then(async res => {
        const json = await res.json();
        //console.log('[API] bannerDisplay response:', json);

        if (json.status !== 'ok' && json.code !== 200) {
          throw new Error(json.message);
        } else {
          return json.data || [];
        }
      }).catch(e => {
        let msg = (
          isNetworkError(e) ? networkErrorMsg : e.message
        );
        throw new Error(msg);
      });
    } catch (error: any) {
      console.error('Banner display error:', error);
      throw error;
    }
  }

  async usageRecords(username: string, accountStatus: string, fromDate: Date, toDate: Date = new Date(), realm: string) {
    // Use makeAuthenticatedRequest to ensure token auto-regeneration
    return this.makeAuthenticatedRequest(async (token: string) => {
      // Format dates to YYYY-MM-DD
      const formatDate = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };
      const data = {
        username,
        start_date: formatDate(fromDate),
        end_date: formatDate(toDate),
        request_source: 'app',
        request_app: 'user_app'
      };
      console.log('Usage records data:', data);
      const options = {
        method,
        headers: headers(token),
        body: toFormData(data),
        timeout
      };
      return fetch(`${getApiUrl()}/selfcareUsageSummary`, options).then(res => {
        setTimeout(() => null, 0);
        return res.json().then(res => {
          setTimeout(() => null, 0);
          if (res.status != 'ok' && res.code != 200) {
            throw new Error(res.message);
          } else {
            if (res.message == "No Content") {
              let download = 0;
              let upload = 0;
              let hrsUsed = 0;
              return { download, upload, hrsUsed };
            } else {
              if (res.data[0].total_download == null) {
                return null;
              } else {
                let data = res.data[0];
                let download = Math.round(Number(data.total_download) / (1024 * 1024 * 1024) * 100) / 100;
                let upload = Math.round(Number(data.total_upload) / (1024 * 1024 * 1024) * 100) / 100;
                let hrsUsed = Number(data.online_time.split(':')[0]);
                return { download, upload, hrsUsed };
              }
            }
          }
        });
      }).catch(e => {
        let msg = (
          isNetworkError(e) ? networkErrorMsg : e.message
        );
        throw new Error(msg);
      });
    });
  }

  async getAllBuildings(realm: string) {
    const session = await sessionManager.getCurrentSession();
    if (!session?.username) throw new Error('No user session found');
    const Authentication = session.token;
    const data = {
      username: session.username,
      combo_code: 'all_buildings',
      column: '',
      value: '',
      request_source: 'app',
      request_app: 'user_app',
    };
    const options = {
      method,
      body: toFormData(data),
      headers: headers(Authentication),
      timeout
    };
    return fetch(`${getApiUrl()}/selfcareDropdown`, options).then(res => {
      setTimeout(() => null, 0);
      return res.json().then(res => {
        setTimeout(() => null, 0);
        if (res.status != 'ok' && res.code != 200) {
          throw new Error('Could not find Buildings. Please try again.');
        } else {
          return res.data;
        }
      });
    }).catch(e => {
      let msg = (
        isNetworkError(e) ? networkErrorMsg : e.message
      );
      throw new Error(msg);
    });
  }

  async getAllCities(realm: string) {
    const session = await sessionManager.getCurrentSession();
    if (!session?.username) throw new Error('No user session found');
    const Authentication = session.token;
    const data = {
      username: session.username,
      combo_code: 'distinct_city',
      column: '',
      value: '',
      request_source: 'app',
      request_app: 'user_app',
    };
    const options = {
      method,
      body: toFormData(data),
      headers: headers(Authentication),
      timeout
    };
    return fetch(`${getApiUrl()}/selfcareDropdown`, options).then(res => {
      setTimeout(() => null, 0);
      return res.json().then(res => {
        setTimeout(() => null, 0);
        if (res.status != 'ok' && res.code != 200) {
          throw new Error('Could not find City. Please try again.');
        } else {
          return res.data;
        }
      });
    }).catch(e => {
      let msg = (
        isNetworkError(e) ? networkErrorMsg : e.message
      );
      throw new Error(msg);
    });
  }

  async getAllSalesPersons(realm: string) {
    const session = await sessionManager.getCurrentSession();
    if (!session?.username) throw new Error('No user session found');
    const Authentication = session.token;
    const data = {
      username: session.username,
      combo_code: 'fetch_sales_executive',
      column: '',
      value: '',
      request_source: 'app',
      request_app: 'user_app',
    };
    const options = {
      method,
      body: toFormData(data),
      headers: headers(Authentication),
      timeout
    };
    return fetch(`${getApiUrl()}/selfcareDropdown`, options).then(res => {
      setTimeout(() => null, 0);
      return res.json().then(res => {
        setTimeout(() => null, 0);
        if (res.status != 'ok' && res.code != 200) {
          throw new Error('Could not find Sales Person. Please try again.');
        } else {
          return res.data;
        }
      });
    }).catch(e => {
      let msg = (
        isNetworkError(e) ? networkErrorMsg : e.message
      );
      throw new Error(msg);
    });
  }

  async addNewInquiry(username: string, formData: any, realm: string) {
    const session = await sessionManager.getCurrentSession();
    if (!session?.token) throw new Error('No user session found');
    const Authentication = session.token;
    const data: Record<string, string> = {
      username: username,
      user_login_id: username,
      first_name: formData.firstName ?? '',
      middle_name: formData.middleName ?? '',
      last_name: formData.lastName ?? '',
      mobile: formData.mobileNumber ?? '',
      email: formData.email ?? '',
      address_line1: formData.address1 ?? '',
      address_line2: formData.address2 ?? '',
      building_id: formData.building_id ?? '',
      building_name: formData.building_name ?? '',
      area_name: formData.area ?? '',
      location_name: formData.location ?? '',
      pin_code: formData.pincode ?? '',
      city_id: formData.city ?? '',
      remarks: formData.remarks ?? '',
      customer_type: 'broadband',
      nationality: 'indian',
      lead_source: 'customer_referral/friends',
      request_source: 'app',
      request_app: 'user_app',
    };
    if (formData.salesPerson) {
      data.sales_executive = String(formData.salesPerson);
    }
    const options = {
      method,
      headers: headers(Authentication),
      body: toFormData(data),
      timeout
    };
    return fetch(`${getApiUrl()}/selfcareAddNewInquiry`, options).then(res => {
      setTimeout(() => null, 0);
      return res.json().then(res => {
        setTimeout(() => null, 0);
        if (res.status != 'ok' && res.code != 200) {
          if (res.message == 'Lead Created Successfully...') {
            throw new Error('Inquiry Created Successfully.');
          }
          //throw new Error('OTP not generated.');
        } else {
          return res;
        }
      });
    }).catch((e) => {
      let msg = (
        isNetworkError(e) ? networkErrorMsg : e.message
      );
      throw new Error(msg);
    });
  }

  async getPaymentStatus(username: string, merTxnId: string, realm: string) {
    return this.makeAuthenticatedRequest(async (token: string) => {
      const data = {
        username: username.toLowerCase().trim(),
        mer_txn_ref: merTxnId,
        gw_for: 'end_user',
        request_source: 'app',
        request_app: 'user_app'
      };

      const options = {
        method,
        headers: new Headers({ Authentication: token, ...fixedHeaders }),
        body: toFormData(data),
        timeout
      };

      try {
        // console.log('=== PAYMENT STATUS CHECK ===');
        // console.log('Username:', username);
        // console.log('Merchant Txn Ref:', merTxnId);
        // console.log('Realm:', realm);
        
        const res = await fetch(`${getApiUrl()}/selfcareGetTransactionDetails`, options);
        const response = await res.json();
        
        //console.log('Payment status API response:', response);
        
        if (response.status !== 'ok' && response.code !== 200) {
          console.log('Payment status API error:', response.message);
          throw new Error(response.message || 'Failed to get payment status');
        } else {
          const txnStatus = response.data[0]?.txn_status;
          console.log('Transaction status:', txnStatus);
          // Return the full response object for better processing
          return response;
        }
      } catch (e: any) {
        console.error('Payment status check error:', e);
        const msg = isNetworkError(e) ? networkErrorMsg : e.message;
        throw new Error(msg);
      }
    });
  }

  async verifyPaymentStatus(username: string, merTxnId: string, realm: string) {
    return this.makeAuthenticatedRequest(async (token: string) => {
      const data = {
        username: username.toLowerCase().trim(),
        mer_txn_ref: merTxnId,
        gw_for: 'end_user',
        request_source: 'app',
        request_app: 'user_app'
      };

      const options = {
        method,
        headers: new Headers({ Authentication: token, ...fixedHeaders }),
        body: toFormData(data),
        timeout
      };

      try {
        console.log('=== VERIFY PAYMENT STATUS ===');
        console.log('Username:', username);
        console.log('Merchant Txn Ref:', merTxnId);
        console.log('Realm:', realm);
        
        const res = await fetch(`${getApiUrl()}/selfcareGetTransactionDetails`, options);
        const response = await res.json();
        
        console.log('Verify payment status API response:', response);
        
        if (response.status !== 'ok' && response.code !== 200) {
          console.log('Verify payment status API error:', response.message);
          throw new Error(response.message || 'Failed to verify payment status');
        } else {
          const txnStatus = response.data[0]?.txn_status;
          console.log('Verified transaction status:', txnStatus);
          return txnStatus;
        }
      } catch (e: any) {
        console.error('Verify payment status error:', e);
        const msg = isNetworkError(e) ? networkErrorMsg : e.message;
        throw new Error(msg);
      }
    });
  }

  async getCPESSIDDetails(realm: string) {
    return this.makeAuthenticatedRequest(async (token: string) => {
      const username = await sessionManager.getUsername();
      if (!username) {
        throw new Error('No username available');
      }
      
      const data = {
        username,
        request_source: 'app',
        request_app: 'user_app'
      };

      const options = {
        method,
        headers: new Headers({ Authentication: token, ...fixedHeaders }),
        body: toFormData(data),
        timeout
      };

      try {
        console.log('=== GET CPE SSID DETAILS ===');
        console.log('Username:', username);
        console.log('Realm:', realm);
        
        const res = await fetch(`${getApiUrl()}/selfcareGetCPESSIDDetails`, options);
        const response = await res.json();
        
        console.log('Get CPE SSID details API response:', response);
        
        if (response.status !== 'ok' && response.code !== 200) {
          console.log('Get CPE SSID details API error:', response.message);
          throw new Error('Could not find SSID details. Please try again.');
        } else {
          console.log('SSID details retrieved successfully');
          return response.data;
        }
      } catch (e: any) {
        console.error('Get CPE SSID details error:', e);
        const msg = isNetworkError(e) ? networkErrorMsg : e.message;
        throw new Error(msg);
      }
    });
  }

  async updateSSID(data: {
    id: string;
    index: number;
    ssid: string;
    password: string;
  }, realm: string) {
    return this.makeAuthenticatedRequest(async (token: string) => {
      const username = await sessionManager.getUsername();
      if (!username) {
        throw new Error('No username available');
      }
      
      const requestData = {
        username,
        id: data.id,
        index: data.index,
        ssid: data.ssid,
        password: data.password,
        status: 'enabled',
        request_source: 'app',
        request_app: 'user_app'
      };

      const options = {
        method,
        headers: new Headers({ Authentication: token, ...fixedHeaders }),
        body: toFormData(requestData),
        timeout
      };

      try {
        console.log('=== UPDATE SSID ===');
        console.log('Username:', username);
        console.log('SSID Index:', data.index);
        console.log('SSID Name:', data.ssid);
        console.log('Realm:', realm);
        
        const res = await fetch(`${getApiUrl()}/selfcareUpdateSSID`, options);
        const response = await res.json();
        
        console.log('Update SSID API response:', response);
        
        if (response.status !== 'ok' && response.code !== 200) {
          console.log('Update SSID API error:', response.message);
          throw new Error(response.message || 'Failed to update SSID');
        } else {
          console.log('SSID updated successfully');
          return response.data;
        }
      } catch (e: any) {
        console.error('Update SSID error:', e);
        const msg = isNetworkError(e) ? networkErrorMsg : e.message;
        throw new Error(msg);
      }
    });
  }

  async getCouponCode(realm: string) {
    return this.makeAuthenticatedRequest(async (token: string) => {
      const username = await sessionManager.getUsername();
      if (!username) {
        throw new Error('No username available');
      }
      
      const requestData = {
        username,
        request_source: 'app',
        request_app: 'user_app'
      };

      const options = {
        method,
        headers: new Headers({ Authentication: token, ...fixedHeaders }),
        body: toFormData(requestData),
        timeout
      };

      try {
        console.log('=== GET COUPON CODE ===');
        console.log('Username:', username);
        console.log('Realm:', realm);
        
        const res = await fetch(`${getApiUrl()}/selfcareGetCouponCode`, options);
        const response = await res.json();
        
        console.log('Get coupon code API response:', response);
        
        if (response.status !== 'ok' && response.code !== 200) {
          console.log('Get coupon code API error:', response.message);
          throw new Error('No coupon found.');
        } else {
          console.log('Coupon codes retrieved successfully');
          
          const plan_wise = response.data['plan_wise'] !== undefined ? response.data.plan_wise.map((obj: any, index: number) => ({ ...obj, index, source: 'plan_wise' })) : null;
          const demographics_wise = response.data['demographics_wise'] !== undefined ? response.data.demographics_wise.map((obj: any, index: number) => ({ ...obj, index, source: 'demographics_wise' })) : null;
          const user_wise = response.data['user_wise'] !== undefined ? response.data.user_wise.map((obj: any, index: number) => ({ ...obj, index, source: 'user_wise' })) : null;
          
          console.log('Plan-wise coupons:', plan_wise?.length || 0);
          console.log('Demographics-wise coupons:', demographics_wise?.length || 0);
          console.log('User-wise coupons:', user_wise?.length || 0);
          
          var result: any[] = [];
          if(plan_wise!=null && plan_wise.length>0) {
            result = plan_wise.concat(demographics_wise || [], user_wise || []);
          } else if (demographics_wise!=null && demographics_wise.length > 0) {
            result = demographics_wise.concat(user_wise || [])
          } else if (user_wise!=null && user_wise.length > 0) {
            result = user_wise;
          }
          
          // Remove null values
          result = result.filter((vl) => {
            return vl!=null;
          })
          
          // Deduplicate coupons based on unique identifier (id or discount_coupon_json)
          const seenCoupons = new Set();
          const originalCount = result.length;
          result = result.filter((coupon) => {
            // Create a unique key for each coupon
            const uniqueKey = coupon.id || coupon.discount_coupon_json || JSON.stringify(coupon);
            
            if (seenCoupons.has(uniqueKey)) {
              return false; // Remove duplicate
            } else {
              seenCoupons.add(uniqueKey);
              return true; // Keep first occurrence
            }
          });
          
          const duplicateCount = originalCount - result.length;
          if (duplicateCount > 0) {
            console.log(`Removed ${duplicateCount} duplicate coupons`);
          }
          
          console.log('Processed coupon codes:', result);
          return result;
        }
      } catch (e: any) {
        console.error('Get coupon code error:', e);
        const msg = isNetworkError(e) ? networkErrorMsg : e.message;
        throw new Error(msg);
      }
    });
  }

  async getComplimentaryDiscountValue(
    data: {
      username: string;
      planname: string;
      admin_login_id: string;
      request_source?: string;
      request_app?: string;
    },
    realm: string,
  ) {
    return this.makeAuthenticatedRequest(async (token: string) => {
      const requestData = {
        username: data.username,
        planname: data.planname,
        admin_login_id: data.admin_login_id,
        request_source: data.request_source || 'app',
        request_app: data.request_app || 'user_app',
      };

      const options = {
        method,
        headers: new Headers({Authentication: token, ...fixedHeaders}),
        body: toFormData(requestData),
        timeout,
      };

      try {
        console.log('=== GET COMPLIMENTARY DISCOUNT VALUE ===');
        console.log('Realm:', realm);
        console.log('Request Data:', requestData);

        const res = await fetch(
          `${getApiUrl()}/selfcareGetComplimentaryDiscountValue`,
          options,
        );
        const response = await res.json();

        console.log(
          'selfcareGetComplimentaryDiscountValue API response:',
          response,
        );
        return response;
      } catch (e: any) {
        console.error('Get complimentary discount value error:', e);
        const msg = isNetworkError(e) ? networkErrorMsg : e.message;
        throw new Error(msg);
      }
    });
  }

  async lastTenNotification(realm: string) {
    return this.makeAuthenticatedRequest(async (token: string) => {
      const username = await sessionManager.getUsername();
      if (!username) {
        throw new Error('No username available');
      }

      const requestData = {
        username,
        request_source: 'app',
        request_app: 'user_app',
      };

      const options = {
        method,
        headers: new Headers({Authentication: token, ...fixedHeaders}),
        body: toFormData(requestData),
        timeout,
      };

      try {
        if (__DEV__) {
          console.log('=== lastTenNotification REQUEST ===', {
            realm,
            username,
            url: `${getApiUrl()}/selfcareGetLastTenNotification`,
            requestData,
          });
        }

        const res = await fetch(`${getApiUrl()}/selfcareFetchPushNotification`, options);
        const response = await res.json();

        if (__DEV__) {
          console.log('=== lastTenNotification RAW RESPONSE ===', response);
        }

        if (response.success === false && response.error === true) {
          throw new Error(response.message || 'Failed to load notifications');
        }

        let list = Array.isArray(response.data) ? response.data : [];

        if (__DEV__) {
          console.log('=== lastTenNotification RAW LIST ===', {
            count: list.length,
            first: list[0] || null,
          });
        }

        // Keep only latest 10 notifications (API may send more)
        list = list.slice(0, 10);

        // Normalize to the shape used by NotificationsScreen
        return list.map((notificationObj: any) => {
          return {
            id: String(
              notificationObj.id ??
                notificationObj.notificationNo ??
                '',
            ),
            alert_event: notificationObj.alert_event ?? '',
            msg_content: notificationObj.msg_content ?? '',
            notification_seen_at:
              notificationObj.notification_seen_at ?? null,
            entry_date:
              notificationObj.entry_date ??
              notificationObj.sendDate ??
              '',
            alert_type:
              notificationObj.alert_type ??
              notificationObj.alertType ??
              '',
          };
        });
      } catch (e: any) {
        const msg = isNetworkError(e) ? networkErrorMsg : e.message;
        throw new Error(msg);
      }
    });
  }

  async updateNotificationStatusToSeen(notificationIds: string[], realm: string) {
    return this.makeAuthenticatedRequest(async (token: string) => {
      const username = await sessionManager.getUsername();
      if (!username) {
        throw new Error('No username available');
      }

      const idParam = notificationIds.join(',');
      const requestData = {
        username,
        id: idParam,
      };

      const options = {
        method,
        headers: new Headers({Authentication: token, ...fixedHeaders}),
        body: toFormData(requestData),
        timeout,
      };

      try {
        if (__DEV__) {
          console.log('=== updateNotificationStatusToSeen REQUEST ===', {
            realm,
            username,
            url: `${getApiUrl()}/selfcareUpdatePushNotificationSeen`,
            ids: notificationIds,
          });
        }

        const res = await fetch(`${getApiUrl()}/selfcareUpdatePushNotificationSeen`, options);
        const response = await res.json();

        if (__DEV__) {
          console.log('=== updateNotificationStatusToSeen RESPONSE ===', response);
        }

        if (
          (response.status !== 'ok' && response.code !== 200) ||
          (response.status === 'ok' && response.code !== 200)
        ) {
          if (response.message === 'No Content') {
            return [];
          }
          throw new Error(response.message || 'Failed to update notifications');
        }

        return response;
      } catch (e: any) {
        const msg = isNetworkError(e) ? networkErrorMsg : e.message;
        throw new Error(msg);
      }
    });
  }

  async Staticdropdown(dataObj: any, realm: string) {
    return this.makeAuthenticatedRequest(async (token: string) => {
      const username = await sessionManager.getUsername();
      if (!username) {
        throw new Error('No username available');
      }

      const data = {
        data: dataObj,
        request_source: 'app',
        username: username,
        request_app: 'user_app'
      };

      // Convert to URL-encoded format like the old param function
      const formData = new URLSearchParams();
      formData.append('data', JSON.stringify(dataObj));
      formData.append('request_source', 'app');
      formData.append('username', username);
      formData.append('request_app', 'user_app');

      // console.log('=== STATICDROPDOWN API SERVICE REQUEST ===');
      // console.log('URL:', `${url}/selfcareStaticdropdown`);
      // console.log('Method:', method);
      // console.log('Data Object Received:', JSON.stringify(dataObj, null, 2));
      // console.log('Username:', username);
      // console.log('Form Data String:', formData.toString());
      // console.log('Token Available:', token ? 'Yes' : 'No');
      // console.log('=== END API SERVICE REQUEST ===');

      const options = {
        method,
        headers: new Headers({ Authentication: token, 'Content-Type': 'application/x-www-form-urlencoded' }),
        body: formData.toString(),
        timeout
      };

      try {
        const res = await fetch(`${getApiUrl()}/selfcareStaticdropdown`, options);
        console.log('=== STATICDROPDOWN API SERVICE RESPONSE ===');
        console.log('Response Status:', res.status);
        console.log('Response Status Text:', res.statusText);
        console.log('Response Headers:', JSON.stringify(Object.fromEntries(res.headers.entries()), null, 2));
        
        // Get raw response text first
        const rawResponseText = await res.text();
        console.log('=== RAW RESPONSE TEXT ===');
        console.log('Raw Response (as string):', rawResponseText);
        console.log('Raw Response Length:', rawResponseText.length);
        console.log('Raw Response Type:', typeof rawResponseText);
        console.log('=== END RAW RESPONSE ===');
        
        // Now parse as JSON
        let response;
        try {
          response = JSON.parse(rawResponseText);
          console.log('=== PARSED JSON RESPONSE ===');
          console.log('Response JSON:', JSON.stringify(response, null, 2));
          console.log('Response Status:', response.status);
          console.log('Response Code:', response.code);
          console.log('Response Message:', response.message);
          console.log('Response Data:', JSON.stringify(response.data, null, 2));
          console.log('Response Data Type:', typeof response.data);
          console.log('Response Data Keys:', response.data ? Object.keys(response.data) : 'No data');
          if (response.data) {
            console.log('Response Data is Array:', Array.isArray(response.data));
            console.log('Response Data is Object:', typeof response.data === 'object');
          }
          console.log('=== END PARSED JSON ===');
        } catch (parseError) {
          console.error('=== JSON PARSE ERROR ===');
          console.error('Parse Error:', parseError);
          console.error('Failed to parse response as JSON');
          console.error('Raw text that failed to parse:', rawResponseText);
          console.error('=== END PARSE ERROR ===');
          throw new Error('Failed to parse API response as JSON');
        }
        
        console.log('=== END API SERVICE RESPONSE ===');
        
        if (response.status != 'ok' && response.code != 200) {
          console.error('=== STATICDROPDOWN API ERROR ===');
          console.error('Error Status:', response.status);
          console.error('Error Code:', response.code);
          console.error('Error Message:', response.message);
          console.error('=== END API ERROR ===');
          throw new Error(response.message || 'Invalid username or password');
        } else {
          return response.data;
        }
      } catch (e: any) {
        console.error('=== STATICDROPDOWN FETCH ERROR ===');
        console.error('Error:', e);
        console.error('Error Message:', e.message);
        console.error('Error Stack:', e.stack);
        console.error('=== END FETCH ERROR ===');
        const msg = isNetworkError(e) ? networkErrorMsg : e.message;
        throw new Error(msg);
      }
    });
  }

  async updateKycDetails(username: string, documentName: string, documentId: string, document: any, docType: string, realm: string, ekycData: any = null) {
    return this.makeAuthenticatedRequest(async (token: string) => {
      const data: any = {
        username: username,
        request_source: 'app',
        request_app: 'user_app'
      };

      // Set document type specific fields based on old app structure
      switch (docType) {
        case 'address_proof':
          data.address_proof_docid = documentId;
          data.address_proof_name = documentName;
          data.address_proof_file = document;
          break;
        case 'id_proof':
          data.id_proof_docid = documentId;
          data.id_proof_name = documentName;
          data.id_proof_file = document;
          break;
        case 'caf':
          data.caf_docid = documentId;
          data.caf_name = documentName;
          data.caf_file = document;
          break;
        case 'user_photo':
          data.user_photo = document;
          break;
        case 'gst_certificate':
          data.gst_number = documentId;
          data.gst_certificate = document;
          break;
        case 'user_sign':
          data.user_sign_docid = documentId;
          data.user_sign_name = documentName;
          data.user_sign_file = document;
          break;
        case 'other':
          data.other_docid = documentId;
          data.other_name = documentName;
          data.other_file = document;
          break;
        default:
          throw new Error(`Unsupported document type: ${docType}`);
      }

      // Add E-KYC specific data if provided
      if (ekycData) {
        data.is_aadhar_verified = ekycData.is_aadhar_verified || 'true';
        data.is_without_otp_ekyc_data_verified = ekycData.is_without_otp_ekyc_data_verified || '';
        
        // Set E-KYC table ID based on document type
        switch (docType) {
          case 'address_proof':
            data.address_proof_ekyc_table_id = ekycData.address_proof_ekyc_table_id || '';
            break;
          case 'id_proof':
            data.id_proof_ekyc_table_id = ekycData.id_proof_ekyc_table_id || '';
            break;
          case 'caf':
            data.caf_ekyc_table_id = ekycData.caf_ekyc_table_id || '';
            break;
          case 'user_photo':
            data.user_photo_ekyc_table_id = ekycData.user_photo_ekyc_table_id || '';
            break;
          case 'gst_certificate':
            data.gst_certificate_ekyc_table_id = ekycData.gst_certificate_ekyc_table_id || '';
            break;
          case 'user_sign':
            data.user_sign_ekyc_table_id = ekycData.user_sign_ekyc_table_id || '';
            break;
          case 'other':
            data.other_ekyc_table_id = ekycData.other_ekyc_table_id || '';
            break;
        }
      }

      const options = {
        method,
        headers: new Headers({ 
          Authentication: token, 
          // Remove Content-Type for file uploads - React Native will set it automatically
          'cache-control': 'no-cache',
          'referer': 'https://crm.dnainfotel.com/'
        }),
        body: toFormData(data),
        timeout
      };
      console.log('=== UPDATE KYC DETAILS ===');
      console.log('Request Data:', data); 
      console.log('========================================');

      try {
        console.log(`=== UPDATE KYC ${docType.toUpperCase()} REQUEST ===`);
        console.log('Request Data:', JSON.stringify(data, null, 2));
        console.log('========================================');

        const res = await fetch(`${getApiUrl()}/selfcareUpdateKycDetails`, options);
        const response = await res.json();
        
        console.log(`=== UPDATE KYC ${docType.toUpperCase()} RESPONSE ===`);
        console.log('Response:', JSON.stringify(response, null, 2));
        console.log('==========================================');
        
        if (response.status !== 'ok' && response.code !== 200) {
          throw new Error(response.message || 'Failed to update KYC details');
        } else {
          return response;
        }
      } catch (e: any) {
        console.error(`=== UPDATE KYC ${docType.toUpperCase()} ERROR ===`);
        console.error('Error:', e);
        console.error('Error Message:', e.message);
        console.error('=======================================');
        const msg = isNetworkError(e) ? networkErrorMsg : e.message;
        throw new Error(msg);
      }
    });
  }

  // Keep the old methods for backward compatibility
  async updateKycDetailsAddressProof(username: string, documentName: string, documentId: string, document: any, realm: string, ekycData: any = null) {
    return this.updateKycDetails(username, documentName, documentId, document, 'address_proof', realm, ekycData);
  }

  async updateKycDetailsIDProof(username: string, documentName: string, documentId: string, document: any, realm: string, ekycData: any = null) {
    return this.updateKycDetails(username, documentName, documentId, document, 'id_proof', realm, ekycData);
  }

  async selfcareAadhaarVerificationOTP(data: any, realm: string) {
    return this.makeAuthenticatedRequest(async (token: string) => {
      const username = await sessionManager.getUsername();
      if (!username) {
        throw new Error('No username available');
      }

      const requestData = {
        username,
        aadhar_no: data.aadhar_no,
        request_source: 'app',
        request_app: 'user_app'
      };

      const options = {
        method,
        headers: new Headers({ Authentication: token, ...fixedHeaders }),
        body: toFormData(requestData),
        timeout
      };

      try {
        const res = await fetch(`${getApiUrl()}/selfcareAadhaarVerificationOTP`, options);
        const response = await res.json();
        
        if (response.status !== 'ok' && response.code !== 200) {
          throw new Error(response.message || 'Failed to generate OTP');
        } else {
          return response;
        }
      } catch (e: any) {
        const msg = isNetworkError(e) ? networkErrorMsg : e.message;
        throw new Error(msg);
      }
    });
  }

  async selfcareSubmitAadhaarOTP(data: any, realm: string) {
    return this.makeAuthenticatedRequest(async (token: string) => {
      const username = await sessionManager.getUsername();
      if (!username) {
        throw new Error('No username available');
      }

      const requestData = {
        username,
        aadhar_no: data.aadhar_no,
        otp: data.otp,
        mahareferid: data.mahareferid,
        client_refid: data.client_refid,
        request_source: 'app',
        request_app: 'user_app'
      };

      const options = {
        method,
        headers: new Headers({ Authentication: token, ...fixedHeaders }),
        body: toFormData(requestData),
        timeout
      };

      try {
        const res = await fetch(`${getApiUrl()}/selfcareSubmitAadhaarOTP`, options);
        const response = await res.json();
        
        if (response.status !== 'ok' && response.code !== 200) {
          throw new Error(response.message || 'Failed to verify OTP');
        } else {
          return response;
        }
      } catch (e: any) {
        const msg = isNetworkError(e) ? networkErrorMsg : e.message;
        throw new Error(msg);
      }
    });
  }

  async selfcareSubmiteKYCData(data: any, realm: string) {
    return this.makeAuthenticatedRequest(async (token: string) => {
      const username = await sessionManager.getUsername();
      if (!username) {
        throw new Error('No username available');
      }

      const requestData = {
        username: username,
        kyc_id: data.kyc_id,
        ekyc_api_status: data.ekyc_api_status,
        ref_data: data.ref_data,
        ekyc_json: data.ekyc_json,
        doc_type: data.doc_type || 'address_proof',
        doc_name: data.doc_name || '',
        ekyc_status: 'verified',
        request_source: 'app',
        request_app: 'user_app'
      };

      const options = {
        method,
        headers: new Headers({ Authentication: token, ...fixedHeaders }),
        body: toFormData(requestData),
        timeout
      };

      try {
        const res = await fetch(`${getApiUrl()}/selfcareSubmiteKYCData`, options);
        const response = await res.json();
        
        if (response.status !== 'ok' && response.code !== 200) {
          throw new Error(response.message || 'Failed to submit KYC data');
        } else {
          return response;
        }
      } catch (e: any) {
        const msg = isNetworkError(e) ? networkErrorMsg : e.message;
        throw new Error(msg);
      }
    });
  }

  /**
   * Check app version information
   */
}

// Export singleton instance
export const apiService = new ApiService(); 