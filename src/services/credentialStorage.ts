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

      const response = await fetch('https://crm.dnainfotel.com/l2s/api/selfcareL2sUserLogin', options);
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