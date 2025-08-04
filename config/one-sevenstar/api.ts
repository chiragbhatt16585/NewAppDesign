import AsyncStorage from '@react-native-async-storage/async-storage';
import sessionManager from '../../src/services/sessionManager';
import { credentialStorage } from '../../src/services/credentialStorage';

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

// Token expired error detection
const isTokenExpiredError = (error: any): boolean => {
  return error.message?.includes('token expired') || 
         error.message?.includes('unauthorized') || 
         error.message?.includes('401');
};

class ApiService {
  private isRegeneratingToken = false;
  private tokenRegenerationPromise: Promise<string | false> | null = null;

  abortController() {
    return new AbortController();
  }

  async adminDetails() {
    const session = await sessionManager.getCurrentSession();
    if (!session?.token) throw new Error('No user session found');
    const Authentication = session.token;
    const data = {
      username: session.username,
      combo_code: 'fetch_admin_details',
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
          throw new Error('Could not fetch admin details. Please try again.');
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

  async checkAuthTokenValidity() {
    const session = await sessionManager.getCurrentSession();
    if (!session?.token) throw new Error('No user session found');
    const Authentication = session.token;
    const data = {
      username: session.username,
      combo_code: 'check_auth_token_validity',
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
          throw new Error('Token validation failed. Please login again.');
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

  async checkDomainName(domain: string) {
    const data = {
      combo_code: 'check_domain_name',
      column: 'domain_name',
      value: domain,
      request_source: 'app',
      request_app: 'user_app',
    };
    const options = {
      method,
      body: toFormData(data),
      headers: headers(''),
      timeout
    };
    return fetch(`${url}/selfcareDropdown`, options).then(res => {
      setTimeout(() => null, 0);
      return res.json().then(res => {
        setTimeout(() => null, 0);
        if (res.status != 'ok' && res.code != 200) {
          throw new Error('Could not verify domain name. Please try again.');
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

  async regenerateToken() {
    if (this.isRegeneratingToken) {
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
    try {
      const session = await sessionManager.getCurrentSession();
      if (!session?.username) {
        throw new Error('No credentials available for token regeneration');
      }

      // Get stored credentials for token regeneration
      const credentials = await credentialStorage.getCredentials();
      if (!credentials?.password) {
        throw new Error('No stored password available for token regeneration');
      }

      const data = {
        username: session.username,
        password: credentials.password,
        request_source: 'app',
        request_app: 'user_app',
      };

      const options = {
        method,
        body: toFormData(data),
        headers: headers(''),
        timeout
      };

      const response = await fetch(`${url}/selfcareLogin`, options);
      const result = await response.json();

      if (result.status === 'ok' && result.data?.token) {
        await sessionManager.updateToken(result.data.token);
        return result.data.token;
      } else {
        throw new Error('Token regeneration failed');
      }
    } catch (error) {
      console.error('Token regeneration error:', error);
      return false;
    }
  }

  async handleTokenUpdate() {
    const session = await sessionManager.getCurrentSession();
    if (!session?.token) throw new Error('No user session found');
    
    const newToken = await this.regenerateToken();
    if (newToken) {
      await sessionManager.updateToken(newToken);
      return newToken;
    }
    throw new Error('Failed to update token');
  }

  async makeAuthenticatedRequest<T>(
    requestFn: (token: string) => Promise<T>,
    maxRetries: number = 1
  ): Promise<T> {
    const session = await sessionManager.getCurrentSession();
    if (!session?.token) throw new Error('No user session found');

    let lastError: Error;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await requestFn(session.token);
      } catch (error: any) {
        lastError = error;
        
        if (isTokenExpiredError(error) && attempt < maxRetries) {
          console.log('Token expired, attempting regeneration...');
          const newToken = await this.regenerateToken();
          if (newToken) {
            await sessionManager.updateToken(newToken);
            continue;
          }
        }
        
        if (attempt === maxRetries) {
          throw lastError;
        }
      }
    }
    
    throw lastError!;
  }

  async checkAuthType(username: string): Promise<AuthTypeResponse> {
    const data = {
      username: username,
      combo_code: 'check_auth_type',
      column: '',
      value: '',
      request_source: 'app',
      request_app: 'user_app',
    };
    const options = {
      method,
      body: toFormData(data),
      headers: headers(''),
      timeout
    };
    return fetch(`${url}/selfcareDropdown`, options).then(res => {
      setTimeout(() => null, 0);
      return res.json().then(res => {
        setTimeout(() => null, 0);
        if (res.status != 'ok' && res.code != 200) {
          throw new Error('Could not check authentication type. Please try again.');
        } else {
          return {
            auth_type: res.data?.auth_type || 'password',
            message: res.message
          };
        }
      });
    }).catch(e => {
      let msg = (
        isNetworkError(e) ? networkErrorMsg : e.message
      );
      throw new Error(msg);
    });
  }

  async authenticate(username: string, password: string, otp: string = '', resend_otp: string = 'none', phone_no?: string): Promise<LoginResponse> {
    const data = {
      username: username,
      password: password,
      otp: otp,
      resend_otp: resend_otp,
      phone_no: phone_no,
      request_source: 'app',
      request_app: 'user_app',
    };
    const options = {
      method,
      body: toFormData(data),
      headers: headers(''),
      timeout
    };
    return fetch(`${url}/selfcareLogin`, options).then(res => {
      setTimeout(() => null, 0);
      return res.json().then(res => {
        setTimeout(() => null, 0);
        if (res.status != 'ok' && res.code != 200) {
          throw new Error(res.message || 'Authentication failed. Please try again.');
        } else {
          return {
            token: res.data.token,
            user: {
              id: res.data.user_id,
              username: res.data.username,
              name: res.data.name,
              email: res.data.email,
              phone: res.data.phone,
              role: res.data.role
            }
          };
        }
      });
    }).catch(e => {
      let msg = (
        isNetworkError(e) ? networkErrorMsg : e.message
      );
      throw new Error(msg);
    });
  }

  async authUser(user_id: string, Authentication: string) {
    const data = {
      user_id: user_id,
      combo_code: 'fetch_user_details',
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
          throw new Error('Could not fetch user details. Please try again.');
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

  async logout() {
    await sessionManager.clearSession();
    return { success: true };
  }

  async isAuthenticated(): Promise<boolean> {
    const session = await sessionManager.getCurrentSession();
    return !!(session?.token);
  }

  async getUserData(): Promise<any | null> {
    const session = await sessionManager.getCurrentSession();
    return session;
  }

  async testApiConnection() {
    const data = {
      combo_code: 'test_connection',
      column: '',
      value: '',
      request_source: 'app',
      request_app: 'user_app',
    };
    const options = {
      method,
      body: toFormData(data),
      headers: headers(''),
      timeout
    };
    return fetch(`${url}/selfcareDropdown`, options).then(res => {
      setTimeout(() => null, 0);
      return res.json().then(res => {
        setTimeout(() => null, 0);
        if (res.status != 'ok' && res.code != 200) {
          throw new Error('API connection test failed.');
        } else {
          return { success: true, message: 'API connection successful' };
        }
      });
    }).catch(e => {
      let msg = (
        isNetworkError(e) ? networkErrorMsg : e.message
      );
      throw new Error(msg);
    });
  }

  async userLedger(username: string, realm: string) {
    return this.makeAuthenticatedRequest(async (token: string) => {
      const session = await sessionManager.getCurrentSession();
      if (!session?.username) throw new Error('No user session found');
      const Authentication = token;
      const data = {
        username: session.username,
        combo_code: 'fetch_user_ledger',
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
            throw new Error('Could not fetch user ledger. Please try again.');
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
    });
  }

  async downloadInvoicePDF(id: string, invoiceNo: string) {
    return this.makeAuthenticatedRequest(async (token: string) => {
      const session = await sessionManager.getCurrentSession();
      if (!session?.username) throw new Error('No user session found');
      const Authentication = token;
      const data = {
        username: session.username,
        combo_code: 'download_invoice_pdf',
        column: 'id',
        value: id,
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
            throw new Error('Could not download invoice PDF. Please try again.');
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
    });
  }

  async downloadReceiptPDF(id: string, receiptNo: string) {
    return this.makeAuthenticatedRequest(async (token: string) => {
      const session = await sessionManager.getCurrentSession();
      if (!session?.username) throw new Error('No user session found');
      const Authentication = token;
      const data = {
        username: session.username,
        combo_code: 'download_receipt_pdf',
        column: 'id',
        value: id,
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
            throw new Error('Could not download receipt PDF. Please try again.');
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
    });
  }

  private async getCredentials(realm: string) {
    const session = await sessionManager.getCurrentSession();
    if (!session?.username) {
      throw new Error('No credentials available');
    }
    
    const credentials = await credentialStorage.getCredentials();
    if (!credentials?.password) {
      throw new Error('No stored password available');
    }
    
    return {
      username: session.username,
      password: credentials.password
    };
  }

  private formatDate(dateString: string, format: string): string {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return format
      .replace('YYYY', String(year))
      .replace('MM', month)
      .replace('DD', day)
      .replace('HH', hours)
      .replace('mm', minutes)
      .replace('ss', seconds);
  }

  async lastTenSessions(username: string, accountStatus: string, realm: string) {
    return this.makeAuthenticatedRequest(async (token: string) => {
      const session = await sessionManager.getCurrentSession();
      if (!session?.username) throw new Error('No user session found');
      const Authentication = token;
      const data = {
        username: session.username,
        combo_code: 'fetch_last_ten_sessions',
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
            throw new Error('Could not fetch session history. Please try again.');
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
    });
  }

  async lastTenComplaints(realm: string = 'default') {
    return this.makeAuthenticatedRequest(async (token: string) => {
      const session = await sessionManager.getCurrentSession();
      if (!session?.username) throw new Error('No user session found');
      const Authentication = token;
      const data = {
        username: session.username,
        combo_code: 'fetch_last_ten_complaints',
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
            throw new Error('Could not fetch complaint history. Please try again.');
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
    });
  }

  async getComplaintProblems(realm: string) {
    return this.makeAuthenticatedRequest(async (token: string) => {
      const session = await sessionManager.getCurrentSession();
      if (!session?.username) throw new Error('No user session found');
      const Authentication = token;
      const data = {
        username: session.username,
        combo_code: 'fetch_complaint_problems',
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
            throw new Error('Could not fetch complaint problems. Please try again.');
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
    });
  }

  async submitComplaint(username: string, problem: any, customMsg: string, realm: string) {
    return this.makeAuthenticatedRequest(async (token: string) => {
      const session = await sessionManager.getCurrentSession();
      if (!session?.username) throw new Error('No user session found');
      const Authentication = token;
      const data = {
        username: session.username,
        combo_code: 'submit_complaint',
        column: '',
        value: '',
        problem_id: problem.id,
        problem_title: problem.title,
        custom_message: customMsg,
        request_source: 'app',
        request_app: 'user_app',
      };
      const options = {
        method,
        body: toFormData(data),
        headers: headers(Authentication),
        timeout
      };
      return fetch(`${url}/selfcareSubmitComplaint`, options).then(res => {
        setTimeout(() => null, 0);
        return res.json().then(res => {
          setTimeout(() => null, 0);
          if (res.status != 'ok' && res.code != 200) {
            throw new Error(res.message || 'Could not submit complaint. Please try again.');
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
    });
  }

  async viewUserKyc(username: string, realm: string) {
    return this.makeAuthenticatedRequest(async (token: string) => {
      const session = await sessionManager.getCurrentSession();
      if (!session?.username) throw new Error('No user session found');
      const Authentication = token;
      const data = {
        username: session.username,
        combo_code: 'fetch_user_kyc',
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
            throw new Error('Could not fetch KYC details. Please try again.');
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
    });
  }

  async planList(adminname: string, username: string, currentplan: string, isShowAllPlan: boolean, is_dashboard: boolean, realm: string): Promise<any[]> {
    return this.makeAuthenticatedRequest(async (token: string) => {
      const session = await sessionManager.getCurrentSession();
      if (!session?.username) throw new Error('No user session found');
      const Authentication = token;
      const data = {
        username: session.username,
        combo_code: 'fetch_plan_list',
        column: '',
        value: '',
        current_plan: currentplan,
        show_all_plans: isShowAllPlan ? '1' : '0',
        is_dashboard: is_dashboard ? '1' : '0',
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
            throw new Error('Could not fetch plan list. Please try again.');
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
    });
  }

  async userPaymentDues(username: string, realm: string) {
    return this.makeAuthenticatedRequest(async (token: string) => {
      const session = await sessionManager.getCurrentSession();
      if (!session?.username) throw new Error('No user session found');
      const Authentication = token;
      const data = {
        username: session.username,
        combo_code: 'fetch_user_payment_dues',
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
            throw new Error('Could not fetch payment dues. Please try again.');
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
    });
  }

  async getAdminTaxInfo(adminname: string, realm: string) {
    return this.makeAuthenticatedRequest(async (token: string) => {
      const session = await sessionManager.getCurrentSession();
      if (!session?.username) throw new Error('No user session found');
      const Authentication = token;
      const data = {
        username: session.username,
        combo_code: 'fetch_admin_tax_info',
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
            throw new Error('Could not fetch tax information. Please try again.');
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
    });
  }

  async paymentGatewayOptions(adminname: string, realm: string) {
    return this.makeAuthenticatedRequest(async (token: string) => {
      const session = await sessionManager.getCurrentSession();
      if (!session?.username) throw new Error('No user session found');
      const Authentication = token;
      const data = {
        username: session.username,
        combo_code: 'fetch_payment_gateway_options',
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
            throw new Error('Could not fetch payment gateway options. Please try again.');
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
    });
  }

  async addDeviceDetails(fcm_token: string, mac_addr: string, hostname: string, device_info: any, realm: string) {
    return this.makeAuthenticatedRequest(async (token: string) => {
      const session = await sessionManager.getCurrentSession();
      if (!session?.username) throw new Error('No user session found');
      const Authentication = token;
      const data = {
        username: session.username,
        combo_code: 'add_device_details',
        column: '',
        value: '',
        fcm_token: fcm_token,
        mac_address: mac_addr,
        hostname: hostname,
        device_info: JSON.stringify(device_info),
        request_source: 'app',
        request_app: 'user_app',
      };
      const options = {
        method,
        body: toFormData(data),
        headers: headers(Authentication),
        timeout
      };
      return fetch(`${url}/selfcareAddDeviceDetails`, options).then(res => {
        setTimeout(() => null, 0);
        return res.json().then(res => {
          setTimeout(() => null, 0);
          if (res.status != 'ok' && res.code != 200) {
            throw new Error('Could not add device details. Please try again.');
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
    });
  }

  async bannerDisplay(realm: string) {
    return this.makeAuthenticatedRequest(async (token: string) => {
      const session = await sessionManager.getCurrentSession();
      if (!session?.username) throw new Error('No user session found');
      const Authentication = token;
      const data = {
        username: session.username,
        combo_code: 'fetch_banner_display',
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
            throw new Error('Could not fetch banner display. Please try again.');
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
    });
  }

  async usageRecords(username: string, accountStatus: string, fromDate: Date, toDate: Date = new Date(), realm: string) {
    // Use makeAuthenticatedRequest to ensure token auto-regeneration
    return this.makeAuthenticatedRequest(async (token: string) => {
      const session = await sessionManager.getCurrentSession();
      if (!session?.username) throw new Error('No user session found');
      const Authentication = token;
      
      const formatDate = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };

      const data = {
        username: session.username,
        combo_code: 'fetch_usage_records',
        column: '',
        value: '',
        from_date: formatDate(fromDate),
        to_date: formatDate(toDate),
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
            throw new Error('Could not fetch usage records. Please try again.');
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
    });
  }

  async getAllBuildings(realm: string) {
    return this.makeAuthenticatedRequest(async (token: string) => {
      const session = await sessionManager.getCurrentSession();
      if (!session?.username) throw new Error('No user session found');
      const Authentication = token;
      const data = {
        username: session.username,
        combo_code: 'fetch_all_buildings',
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
            throw new Error('Could not fetch buildings. Please try again.');
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
    });
  }

  async getAllCities(realm: string) {
    return this.makeAuthenticatedRequest(async (token: string) => {
      const session = await sessionManager.getCurrentSession();
      if (!session?.username) throw new Error('No user session found');
      const Authentication = token;
      const data = {
        username: session.username,
        combo_code: 'fetch_all_cities',
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
            throw new Error('Could not fetch cities. Please try again.');
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
    });
  }

  async getAllSalesPersons(realm: string) {
    return this.makeAuthenticatedRequest(async (token: string) => {
      const session = await sessionManager.getCurrentSession();
      if (!session?.username) throw new Error('No user session found');
      const Authentication = token;
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
    });
  }

  async addNewInquiry(username: string, formData: any, realm: string) {
    return this.makeAuthenticatedRequest(async (token: string) => {
      const session = await sessionManager.getCurrentSession();
      if (!session?.token) throw new Error('No user session found');
      const Authentication = token;
      const data = {
        username: username,
        user_login_id: username,
        first_name: formData.firstName,
        middle_name: formData.middleName,
        last_name: formData.lastName,
        mobile: formData.mobileNumber,
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
    });
  }
}

// Export singleton instance
export const apiService = new ApiService(); 