import AsyncStorage from '@react-native-async-storage/async-storage';

// Simple credential storage using AsyncStorage
export const credentialStorage = {
  // Save credentials (username and password)
  async saveCredentials(username: string, password: string): Promise<boolean> {
    try {
      await AsyncStorage.setItem('stored_username', username);
      await AsyncStorage.setItem('stored_password', password);
      console.log('Credentials saved to AsyncStorage');
      return true;
    } catch (error) {
      console.error('Error saving credentials:', error);
      return false;
    }
  },

  // Get credentials
  async getCredentials(): Promise<{ username: string; password: string } | null> {
    try {
      const username = await AsyncStorage.getItem('stored_username');
      const password = await AsyncStorage.getItem('stored_password');
      
      if (username && password) {
        return { username, password };
      }
      return null;
    } catch (error) {
      console.error('Error getting credentials:', error);
      return null;
    }
  },

  // Delete credentials
  async deleteCredentials(): Promise<boolean> {
    try {
      await AsyncStorage.removeItem('stored_username');
      await AsyncStorage.removeItem('stored_password');
      console.log('Credentials deleted from AsyncStorage');
      return true;
    } catch (error) {
      console.error('Error deleting credentials:', error);
      return false;
    }
  },

  // Regenerate token using stored password
  async regenerateToken(): Promise<string | false> {
    const credentials = await this.getCredentials();
    if (!credentials) {
      console.log('No credentials found in AsyncStorage');
      return false;
    }

    try {
      const { username, password } = credentials;
      
      // Get current client configuration to determine API endpoint
      const clientConfig = await this.getCurrentClientConfig();
      const apiUrl = clientConfig.apiUrl;
      
      const data = {
        username: username.toLowerCase().trim(),
        password: password,
        login_from: 'app',
        request_source: 'app',
        request_app: 'user_app'
      };

      const options = {
        method: 'POST',
        body: this.toFormData(data),
        headers: new Headers({
          'cache-control': 'no-cache',
          'referer': 'L2S-System/User-App-Requests'
        }),
        timeout: 6000
      };

      const response = await fetch(`${apiUrl}/l2s/api/selfcareL2sUserLogin`, options);
      const result = await response.json();

      if (result.status === 'ok' && result.data && result.data.token) {
        console.log('Token regenerated successfully using stored password');
        return result.data.token;
      } else {
        console.log('Token regeneration failed:', result.message);
        return false;
      }
    } catch (error) {
      console.error('Error regenerating token:', error);
      return false;
    }
  },

  // Get current client configuration
  async getCurrentClientConfig(): Promise<{ apiUrl: string }> {
    try {
      // Try to get the stored API URL first
      const storedApiUrl = await AsyncStorage.getItem('current_api_url');
      
      if (storedApiUrl) {
        return { apiUrl: storedApiUrl };
      }
      
      // Fallback to client detection
      const currentClient = await AsyncStorage.getItem('current_client');
      
      // Client configurations
      const clientConfigs: Record<string, { apiUrl: string }> = {
        'microscan': { apiUrl: 'https://mydesk.microscan.co.in' },
        'dna-infotel': { apiUrl: 'https://crm.dnainfotel.com' },
        'one-sevenstar': { apiUrl: 'https://one.7stardigitalnetwork.com' }
      };
      
      if (currentClient && clientConfigs[currentClient]) {
        return clientConfigs[currentClient];
      }
      
      // Default to DNA Infotel if no client is specified
      return { apiUrl: 'https://crm.dnainfotel.com' };
    } catch (error) {
      console.error('Error getting client config:', error);
      // Fallback to DNA Infotel
      return { apiUrl: 'https://crm.dnainfotel.com' };
    }
  },

  // Utility function to convert object to FormData
  toFormData(data: any): FormData {
    const formData = new FormData();
    Object.keys(data).forEach(key => {
      if (data[key] !== undefined && data[key] !== null) {
        formData.append(key, data[key]);
      }
    });
    return formData;
  }
};

export default credentialStorage; 