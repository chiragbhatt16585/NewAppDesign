import AsyncStorage from '@react-native-async-storage/async-storage';
import sessionManager from '../../src/services/sessionManager';

// API Configuration
export const domainUrl = "crm.dnainfotel.com";
export const domain = `https://${domainUrl}`;
const url = `${domain}/l2s/api`;
export const ispName = 'DNA Infotel';

const method = 'POST';
const fixedHeaders = {
  'cache-control': 'no-cache',
  'referer': 'L2S-System/User-App-Requests'
};

const headers = (Authentication: string) => (new Headers({ Authentication, ...fixedHeaders }));

const timeout = 6000;
const networkErrorMsg = 'Please check your internet connection and try again.';
const Loggable = true;

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
}

export interface LoginResponse {
  token: string;
  user: {
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

// Plan class based on old app structure
export class Plan {
  id: string;
  name: string;
  amt: number;
  FinalAmount: number;
  CGSTAmount: number;
  SGSTAmount: number;
  UTGSTAmount: number;
  downloadSpeed: string;
  uploadSpeed: string;
  days: number;
  limit: string;
  content_providers?: any[];
  fup_details?: any;
  tbq_details?: any;
  index: number;
  isExpanded?: boolean;

  constructor(planObj: any, index: number) {
    this.id = planObj.id || `plan_${index}`;
    this.name = planObj.planname || planObj.name || 'Unknown Plan';
    this.amt = parseFloat(planObj.base_price) || 0;
    this.FinalAmount = parseFloat(planObj.user_mrp) || 0;
    this.CGSTAmount = parseFloat(planObj.cgst_value) || 0;
    this.SGSTAmount = parseFloat(planObj.sgst_value) || 0;
    this.UTGSTAmount = parseFloat(planObj.utgst_value) || 0;
    this.downloadSpeed = planObj.download_speed_mb || '0 Mbps';
    this.uploadSpeed = planObj.upload_speed_mb || '0 Mbps';
    this.days = parseInt(planObj.validity) || 30;
    this.limit = planObj.data_xfer || 'Unlimited';
    this.content_providers = planObj.content_providers ? (typeof planObj.content_providers === 'string' ? [] : planObj.content_providers) : [];
    this.fup_details = planObj.plan_fup && planObj.plan_fup.length > 0 ? planObj.plan_fup[0] : null;
    this.tbq_details = planObj.plan_tbq && planObj.plan_tbq.length > 0 ? planObj.plan_tbq[0] : null;
    this.index = index;
  }

  isfupBriefDetailsAvailable() {
    return {
      result: this.fup_details && this.fup_details.limit && this.fup_details.download_speed
    };
  }

  fupBriefDetails() {
    if (this.isfupBriefDetailsAvailable().result) {
      return {
        limit: this.fup_details.limit,
        downloadSpeed: this.fup_details.download_speed,
        uploadSpeed: this.fup_details.upload_speed
      };
    }
    return null;
  }

  isTBQPlan() {
    return this.tbq_details && this.tbq_details.days && this.tbq_details.start && this.tbq_details.stop;
  }

  tbqBriefDetails() {
    if (this.isTBQPlan()) {
      return {
        days: this.tbq_details.days,
        start: this.tbq_details.start,
        stop: this.tbq_details.stop,
        downloadSpeed: this.tbq_details.download_speed,
        uploadSpeed: this.tbq_details.upload_speed
      };
    }
    return null;
  }
}

// Utility function to convert object to FormData
const toFormData = (data: any): FormData => {
  const formData = new FormData();
  Object.keys(data).forEach(key => {
    if (data[key] !== undefined && data[key] !== null) {
      formData.append(key, data[key]);
    }
  });
  return formData;
};

// Network error detection
const isNetworkError = (error: any): boolean => {
  return error.name === 'TypeError' || error.message.includes('Network request failed');
};

// Token expiration detection
const isTokenExpiredError = (error: any): boolean => {
  const errorMessage = error.message?.toLowerCase() || '';
  return errorMessage.includes('token expired') || 
         errorMessage.includes('unauthorized') || 
         errorMessage.includes('invalid token') ||
         errorMessage.includes('authentication failed') ||
         errorMessage.includes('invalid username or password') ||
         errorMessage.includes('please check your internet connection') ||
         errorMessage.includes('network request failed');
};

// API Service Class
class ApiService {
  private isRegeneratingToken = false;
  private tokenRegenerationPromise: Promise<string | false> | null = null;

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
      const res = await fetch(`https://${domainUrl}/tmp/isp_details.json`, options);
      const data = await res.json();
      return data.data[0];
    } catch (e: any) {
      const msg = isNetworkError(e) ? networkErrorMsg : e.message;
      throw new Error(msg);
    }
  }

  async checkAuthTokenValidity() {
    const token = await sessionManager.getToken();
    if (!token) return false;

    const username = await sessionManager.getUsername();
    if (!username) return false;

    const data = {
      username: username.toLowerCase().trim(),
      fetch_company_details: 'yes',
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
      const res = await fetch(`${url}/selfcareHelpdesk`, options);
      const response = await res.json();
      
      if (response.status === 'ok') {
        return true;
      } else if (response.status === 'error') {
        return false;
      }
      return false;
    } catch (error) {
      console.error('Token validity check error:', error);
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
      const res = await fetch(`${url}/selfcareL2sUserLogin`, option);
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
    const session = await sessionManager.getCurrentSession();
    if (!session) return false;

    const { username } = session;
    if (!username) return false;

    const data = {
      username: username.toLowerCase().trim(),
      password: '', // We don't store password in session manager for security
      login_from: 'app',
      request_source: 'app',
      request_app: 'user_app'
    };

    const options = {
      method,
      body: toFormData(data),
      headers: new Headers({ ...fixedHeaders }),
      timeout
    };

    try {
      const res = await fetch(`${url}/selfcareL2sUserLogin`, options);
      const response = await res.json();
      
      if (response.status === 'ok') {
        return response.data.token;
      } else if (response.status === 'error') {
        return false;
      }
      return false;
    } catch (error) {
      console.error('Token regeneration error:', error);
      return false;
    }
  }

  async handleTokenUpdate() {
    const isValid = await this.checkAuthTokenValidity();

    if (isValid) {
      return true;
    } else {
      const newToken = await this.regenerateToken();
      if (newToken) {
        await sessionManager.updateToken(newToken);
        return true;
      } else {
        await sessionManager.clearSession();
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
        const token = await sessionManager.getToken();
        if (!token) {
          await sessionManager.clearSession();
          console.error('[ApiService] No token found, user will be logged out.');
          throw new Error('Authentication required. Please login again.');
        }

        // Update activity time on every API call
        await sessionManager.updateActivityTime();

        return await requestFn(token);
      } catch (error: any) {
        lastError = error;
        
        // Check if it's a token expiration error
        if (isTokenExpiredError(error) && attempt < maxRetries) {
          console.warn('[ApiService] Token expired, attempting to regenerate...');
          
          try {
            const newToken = await this.regenerateToken();
            if (newToken) {
              await sessionManager.updateToken(newToken);
              console.log('[ApiService] Token regenerated successfully, retrying request...');
              continue; // Retry the request with new token
            } else {
              console.error('[ApiService] Failed to regenerate token, user will be logged out.');
              await sessionManager.clearSession();
              throw new Error('Authentication failed. Please login again.');
            }
          } catch (regenerationError) {
            console.error('[ApiService] Token regeneration failed:', regenerationError);
            await sessionManager.clearSession();
            throw new Error('Authentication failed. Please login again.');
          }
        } else {
          // Not a token error or max retries reached
          throw error;
        }
      }
    }

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

      const res = await fetch(`${url}/selfcareL2sUserLogin`, {
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

  async authenticate(username: string, password: string, otp: string = '', resend_otp: string = 'none', phone_no?: string): Promise<LoginResponse> {
    const data: LoginRequest = {
      username: username.toLowerCase().trim(),
      password: password,
      otp: otp,
      resend_otp,
      phone_no,
      user_type: 'user',
      login_from: 'app',
      request_source: 'app',
      request_app: 'user_app'
    };

    console.log('API Request Data:', data);
    console.log('API URL:', `${url}/selfcareL2sUserLogin`);

    const options = {
      method,
      body: toFormData(data),
      headers: new Headers({ ...fixedHeaders }),
      timeout
    };

    try {
      console.log('Making API request...');
      const res = await fetch(`${url}/selfcareL2sUserLogin`, options);
      console.log('Response status:', res.status);
      
      const response = await res.json();
      console.log('API Response:', response);
      
      if (response.status !== 'ok' && response.code !== 200) {
        console.error('API Error:', response.message);
        throw new Error(response.message);
      } else {
        console.log('API Success:', response.data);
        return response.data;
      }
    } catch (e: any) {
      console.error('API Request Error:', e);
      const msg = isNetworkError(e) ? networkErrorMsg : e.message;
      throw new Error(msg);
    }
  }

  async authUser(user_id: string) {
    return this.makeAuthenticatedRequest(async (token: string) => {
      const data = {
        username: user_id.toLowerCase().trim(),
        fetch_company_details: 'yes',
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
        const res = await fetch(`${url}/selfcareHelpdesk`, options);
        const response = await res.json();
        
        if (response.status !== 'ok' && response.code !== 200) {
          throw new Error('Invalid username or password');
        } else {
          return response.data;
        }
      } catch (e: any) {
        const msg = isNetworkError(e) ? networkErrorMsg : e.message;
        throw new Error(msg);
      }
    });
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
      const res = await fetch(`${url}/selfcareL2sUserLogin`, {
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
        const res = await fetch(`${url}/selfcareGetUserInformation`, options);
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

      const res = await fetch(`${url}/selfcareGenerateInvoicePDF`, options);
      
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

      const res = await fetch(`${url}/selfcareGenerateReceiptPDF`, options);
      
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
      // Handle the specific format 'DD-MMM,YY HH:mm' (e.g., "15-Jul,24 14:30")
      if (format === 'DD-MMM,YY HH:mm') {
        // Parse the date string manually
        const parts = dateString.split(' ');
        if (parts.length >= 2) {
          const datePart = parts[0]; // "15-Jul,24"
          const timePart = parts[1]; // "14:30"
          
          const dateComponents = datePart.split('-');
          if (dateComponents.length >= 2) {
            const day = dateComponents[0]; // "15"
            const monthYear = dateComponents[1]; // "Jul,24"
            
            const monthYearParts = monthYear.split(',');
            if (monthYearParts.length >= 2) {
              const month = monthYearParts[0]; // "Jul"
              const year = monthYearParts[1]; // "24"
              
              // Convert to full year
              const fullYear = year.length === 2 ? `20${year}` : year;
              
              // Create a proper date string
              const properDateString = `${day} ${month} ${fullYear}`;
              const date = new Date(properDateString);
              
              if (!isNaN(date.getTime())) {
                return date.toLocaleDateString('en-GB', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric'
                });
              }
            }
          }
        }
      }
      
      // Fallback: try to parse as regular date
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        });
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
        const res = await fetch(`${url}/selfcareUsageDetails`, options);
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
        const res = await fetch(`${url}/selfcareCrmViewTickets`, options);
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
        const res = await fetch(`${url}/selfcareDropdown`, options);
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
        const res = await fetch(`${url}/selfcareCreateTicket`, options);
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
        const res = await fetch(`${url}/selfcareViewUserKyc`, options);
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

  async planList(adminname: string, username: string, currentplan: string, isShowAllPlan: boolean, is_dashboard: boolean, realm: string): Promise<Plan[]> {
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

      console.log('=== API SERVICE: Plan list data ===', data);

      const options = {
        method,
        headers: new Headers({ Authentication: token, ...fixedHeaders }),
        body: toFormData(data),
        timeout
      };

      try {
        const res = await fetch(`${url}/selfcareGetPlanAmount`, options);
        const response = await res.json();

        //Alert.alert('Plan list response:', JSON.stringify(response));
        
        if (response.status !== 'ok' && response.code !== 200) {
          throw new Error('Plan list not found. Please try again.');
        } else if (response.status === 'ok' && response.code !== 200) {
          return [];
        } else {
          return response.data.map((planObj: any, index: number) => new Plan(planObj, index));
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
        const res = await fetch(`${url}/selfcareGetUserPaymentDues`, options);
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
        const res = await fetch(`${url}/selfcareGetAdminDetails`, options);
        const response = await res.json();
        
        console.log('=== Tax info API response ===', response);
        
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
      const data = {
        admin_login_id: adminname,
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
        const res = await fetch(`${url}/selfcarePaymentGatewayOptions`, options);
        const response = await res.json();
        
        if (response.status !== 'ok' && response.code !== 200) {
          throw new Error(response.message || 'Failed to fetch payment gateway options');
        } else {
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

  async addDeviceDetails(fcm_token: string, mac_addr: string, hostname: string, device_info: any, realm: string) {
    return this.makeAuthenticatedRequest(async (token: string) => {
      const username = await sessionManager.getUsername();
      if (!username) {
        throw new Error('No username found in session');
      }
      const data = {
        username: username.toLowerCase().trim(),
        fcm_token,
        mac_addr,
        hostname,
        device_info: JSON.stringify(device_info),
        token_for: 'end_user_app',
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
        const res = await fetch(`${url}/selfcareAddDeviceInfo`, options);
        const response = await res.json();
        if (response.status !== 'ok' && response.code !== 200) {
          throw new Error('Invalid username or password');
        } else {
          return response;
        }
      } catch (e: any) {
        let msg = isNetworkError(e) ? networkErrorMsg : e.message;
        throw new Error(msg);
      }
    });
  }

  async bannerDisplay(realm: string) {
    try {
      const { Authentication } = await this.getCredentials(realm);
      const data = {
        request_source: 'app',
        request_app: 'user_app'
      };
      
      const options = {
        method,
        headers: headers(Authentication),
        body: toFormData(data),
        timeout
      };
      
      return fetch(`${url}/bannerDisplay`, options).then(res => {
        setTimeout(() => null, 0);
        return res.json().then(res => {
          setTimeout(() => null, 0);
          if (res.status != 'ok' && res.code != 200) {
            throw new Error(res.message);
          } else {
            return res.data || [];
          }
        });
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
      return fetch(`${url}/selfcareUsageSummary`, options).then(res => {
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
    return fetch(`${url}/selfcareDropdown`, options).then(res => {
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
    return fetch(`${url}/selfcareDropdown`, options).then(res => {
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
    return fetch(`${url}/selfcareDropdown`, options).then(res => {
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
    const data = {
      username: username,
      user_login_id: username,
      first_name: formData.firstName,
      middle_name: formData.middleName,
      last_name: formData.lastName,
      mobile: formData.mobileNumber,
      alt_mobile: formData.alternateMobile,
      email: formData.email,
      address_line1: formData.address1,
      address_line2: formData.address2,
      building_id: formData.building_id,
      building_name: formData.building_name,
      area_name: formData.area,
      location_name: formData.location,
      pin_code: formData.pincode,
      city_id: formData.city,
      remarks: formData.remarks,
      customer_type: 'broadband',
      nationality: 'indian',
      lead_source: 'customer_referral/friends',
      request_source: 'app',
      request_app: 'user_app',
    };
    const options = {
      method,
      headers: headers(Authentication),
      body: toFormData(data),
      timeout
    };
    return fetch(`${url}/selfcareAddNewInquiry`, options).then(res => {
      setTimeout(() => null, 0);
      return res.json().then(res => {
        setTimeout(() => null, 0);
        if (res.status != 'ok' && res.code != 200) {
          if (res.message == 'Lead Created Successfully...') {
            throw new Error('Inquiry Created Successfully.');
          }
          throw new Error('OTP not generated.');
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
}

// Export singleton instance
export const apiService = new ApiService(); 