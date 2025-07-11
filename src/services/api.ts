import AsyncStorage from '@react-native-async-storage/async-storage';
import sessionManager from './sessionManager';

// API Configuration
export const domainUrl = "mydesk.microscan.co.in";
export const domain = `https://${domainUrl}`;
const url = `${domain}/l2s/api`;
export const ispName = 'Microscan';

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

// API Service Class
class ApiService {
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

  async authUser(user_id: string, Authentication: string) {
    const data = {
      username: user_id.toLowerCase().trim(),
      fetch_company_details: 'yes',
      request_source: 'app',
      request_app: 'user_app' 
    };

    const options = {
      method,
      headers: new Headers({ Authentication: Authentication || '', ...fixedHeaders }),
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

  // Test API connection
  async testApiConnection() {
    try {
      console.log('Testing API connection...');
      const adminDetails = await this.adminDetails();
      console.log('Admin details:', adminDetails);
      return true;
    } catch (error) {
      console.error('API connection test failed:', error);
      return false;
    }
  }

  async userLedger(username: string, realm: string) {
    console.log('=== API SERVICE: userLedger called with ===', { username, realm });
    
    const { Authentication } = await this.getCredentials(realm);
    console.log('=== API SERVICE: Got authentication token ===', !!Authentication);
    
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

    console.log('=== API SERVICE: Request data ===', data);

    const options = {
      method,
      headers: headers(Authentication),
      body: toFormData(data),
      timeout
    };

    console.log('=== API SERVICE: Making API call to ===', `${url}/selfcareGetUserInformation`);

    try {
      const res = await fetch(`${url}/selfcareGetUserInformation`, options);
      console.log('=== API SERVICE: Response status ===', res.status);
      
      const response = await res.json();
      console.log('=== API SERVICE: Raw API response ===', response);
      
      if (response.status !== 'ok' && response.code !== 200) {
        console.log('=== API SERVICE: API returned error ===', response);
        throw new Error(response.message);
      } else {
        console.log('=== API SERVICE: Processing successful response ===');
        const resArr: any = [];
        
        // Add proforma invoices
        resArr.proforma_payment = response.data.user_profoma_invoice || [];
        
        // Add receipts (payments)
        if (response.data.user_receipt) {
          console.log('=== API SERVICE: Processing receipts ===', response.data.user_receipt);
          resArr.push(
            response.data.user_receipt.map((data: any, index: number) => {
              console.log('=== API SERVICE: Receipt date ===', data.receipt_date);
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
          console.log('=== API SERVICE: Processing invoices ===', response.data.user_invoice);
          resArr.push(
            response.data.user_invoice.map((data: any, index: number) => {
              console.log('=== API SERVICE: Invoice date ===', data.invoice_date);
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
          console.log('=== API SERVICE: Processing proforma invoices ===', response.data.user_profoma_invoice);
          resArr.push(
            response.data.user_profoma_invoice.map((data: any, index: number) => {
              console.log('=== API SERVICE: Proforma invoice date ===', data.invoice_date);
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
        
        console.log('=== API SERVICE: Final processed data ===', resArr);
        return resArr;
      }
    } catch (e: any) {
      console.error('=== API SERVICE: Error in userLedger ===', e);
      const msg = isNetworkError(e) ? networkErrorMsg : e.message;
      throw new Error(msg);
    }
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
    console.log('=== API SERVICE: Formatting date ===', { dateString, format });
    
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
      console.log('=== API SERVICE: Could not parse date, returning original ===', dateString);
      return dateString;
    } catch (error) {
      console.error('=== API SERVICE: Error formatting date ===', error);
      return dateString;
    }
  }

  // Additional methods can be added here following the same pattern
  // For example: planList, userPaymentDues, submitComplaint, etc.
}

// Export singleton instance
export const apiService = new ApiService(); 