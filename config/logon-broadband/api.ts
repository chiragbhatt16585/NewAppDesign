import AsyncStorage from '@react-native-async-storage/async-storage';
import sessionManager from '../../src/services/sessionManager';

export const domainUrl = "";
export const domain = `https://${domainUrl}`;
const url = `${domain}/l2s/api`;
export const ispName = 'Logon Broadband';

const method = 'POST';
const fixedHeaders = {
  'cache-control': 'no-cache',
  'referer': 'L2S-System/User-App-Requests'
};

const headers = (Authentication: string) => (new Headers({ Authentication, ...fixedHeaders }));

const timeout = 6000;
const networkErrorMsg = 'Please check your internet connection and try again.';
const Loggable = true;

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

const toFormData = (data: any): FormData => {
  const formData = new FormData();
  Object.keys(data).forEach(key => {
    if (data[key] !== undefined && data[key] !== null) {
      formData.append(key, data[key]);
    }
  });
  return formData;
};

class ApiService {
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

    const options = {
      method,
      body: toFormData(data),
      headers: new Headers({ ...fixedHeaders }),
      timeout
    } as any;

    const res = await fetch(`${url}/selfcareL2sUserLogin`, options);
    const response = await res.json();
    if (response.status !== 'ok' && response.code !== 200) {
      throw new Error(response.message);
    }
    return response.data;
  }
}

export const apiService = new ApiService();


