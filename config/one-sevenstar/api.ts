import AsyncStorage from '@react-native-async-storage/async-storage';
import sessionManager from '../../src/services/sessionManager';

// API Configuration
export const domainUrl = "one.7stardigitalnetwork.com";
export const domain = `https://${domainUrl}`;
const url = `${domain}/l2s/api`;
export const ispName = 'One Seven Star';

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
      }
      return false;
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
          console.log('No token available, redirecting to login');
          await sessionManager.clearSession();
          throw new Error('Authentication required. Please login again.');
        }

        // Update activity time on every API call
        await sessionManager.updateActivityTime();

        return await requestFn(token);
      } catch (error: any) {
        lastError = error;
        
        // Check if it's a token expiration error
        if (isTokenExpiredError(error) && attempt < maxRetries) {
          console.log('Token expired, attempting to regenerate...');
          
          try {
            const newToken = await this.regenerateToken();
            if (newToken) {
              await sessionManager.updateToken(newToken);
              console.log('Token regenerated successfully, retrying request...');
              continue; // Retry the request with new token
            } else {
              console.log('Failed to regenerate token, clearing session');
              await sessionManager.clearSession();
              throw new Error('Authentication failed. Please login again.');
            }
          } catch (regenerationError) {
            console.error('Token regeneration failed:', regenerationError);
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
    const data = {
      username: username.toLowerCase().trim(),
      check_auth_type: 'yes',
      request_source: 'app',
      request_app: 'user_app'
    };

    const options = {
      method,
      headers: new Headers({ ...fixedHeaders }),
      body: toFormData(data),
      timeout
    };

    try {
      const res = await fetch(`${url}/selfcareL2sUserLogin`, options);
      const response = await res.json();
      
      if (response.status === 'ok') {
        return {
          auth_type: response.data.auth_type || 'password',
          message: response.message
        };
      } else {
        throw new Error(response.message || 'Failed to check auth type');
      }
    } catch (e: any) {
      if (isNetworkError(e)) {
        throw new Error(networkErrorMsg);
      } else {
        throw new Error(e.message);
      }
    }
  }

  async authenticate(username: string, password: string, otp: string = '', resend_otp: string = 'none', phone_no?: string): Promise<LoginResponse> {
    const data: LoginRequest = {
      username: username.toLowerCase().trim(),
      password,
      otp,
      resend_otp,
      phone_no,
      login_from: 'app',
      request_source: 'app',
      request_app: 'user_app'
    };

    const options = {
      method,
      headers: new Headers({ ...fixedHeaders }),
      body: toFormData(data),
      timeout
    };

    try {
      const res = await fetch(`${url}/selfcareL2sUserLogin`, options);
      const response = await res.json();
      
      if (response.status === 'ok') {
        return {
          token: response.data.token,
          user: {
            id: response.data.user_id || username,
            username: username,
            name: response.data.name || username,
            email: response.data.email,
            phone: response.data.phone || phone_no,
            role: response.data.role || 'user'
          }
        };
      } else {
        throw new Error(response.message || 'Authentication failed');
      }
    } catch (e: any) {
      if (isNetworkError(e)) {
        throw new Error(networkErrorMsg);
      } else {
        throw new Error(e.message);
      }
    }
  }

  async authUser(user_id: string, Authentication: string) {
    return this.makeAuthenticatedRequest(async (token: string) => {
      const data = {
        user_id,
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
          return response.data;
        } else {
          throw new Error(response.message || 'Failed to authenticate user');
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

  async logout() {
    try {
      await sessionManager.logout();
      console.log('Logout successful');
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  async isAuthenticated(): Promise<boolean> {
    return await sessionManager.isLoggedIn();
  }

  async getUserData(): Promise<any | null> {
    const session = await sessionManager.getCurrentSession();
    return session ? { username: session.username, token: session.token } : null;
  }

  async testApiConnection() {
    try {
      const adminDetails = await this.adminDetails();
      return adminDetails;
    } catch (error) {
      console.error('API connection test failed:', error);
      throw error;
    }
  }

  async userLedger(username: string, realm: string) {
    return this.makeAuthenticatedRequest(async (token: string) => {
      const data = {
        username: username.toLowerCase().trim(),
        fetch_user_ledger: 'yes',
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
          const resArr: any[] = [];
          
          // Add receipts
          if (response.data.user_receipt) {
            resArr.push(
              response.data.user_receipt.map((data: any, index: number) => {
                return {
                  index,
                  no: data.receipt_prefix + data.receipt_no,
                  amt: data.payment_amount,
                  content: data.payment_particulars,
                  view: data.remarks,
                  dateString: this.formatDate(data.payment_date, 'DD-MMM,YY HH:mm'),
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
            resArr.push(
              response.data.user_invoice.map((data: any, index: number) => {
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
            resArr.push(
              response.data.user_profoma_invoice.map((data: any, index: number) => {
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
      return dateString;
    } catch (error) {
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
}

// Export singleton instance
export const apiService = new ApiService(); 