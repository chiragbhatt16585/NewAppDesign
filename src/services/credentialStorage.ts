import AsyncStorage from '@react-native-async-storage/async-storage';

const USERNAME_KEY = 'stored_username';
const PASSWORD_KEY = 'stored_password';

export const credentialStorage = {
  async saveCredentials(username: string, password: string) {
    await AsyncStorage.setItem(USERNAME_KEY, username);
    await AsyncStorage.setItem(PASSWORD_KEY, password);
  },
  async getCredentials(): Promise<{ username: string; password: string } | null> {
    const username = await AsyncStorage.getItem(USERNAME_KEY);
    const password = await AsyncStorage.getItem(PASSWORD_KEY);
    if (username && password) {
      return { username, password };
    }
    return null;
  },
  async clearCredentials() {
    await AsyncStorage.removeItem(USERNAME_KEY);
    await AsyncStorage.removeItem(PASSWORD_KEY);
  },
}; 