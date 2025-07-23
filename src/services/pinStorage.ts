import AsyncStorage from '@react-native-async-storage/async-storage';

const PIN_KEY = 'user_pin';

export const pinStorage = {
  async savePin(pin: string) {
    await AsyncStorage.setItem(PIN_KEY, pin);
  },
  async getPin(): Promise<string | null> {
    return await AsyncStorage.getItem(PIN_KEY);
  },
  async clearPin() {
    await AsyncStorage.removeItem(PIN_KEY);
  }
}; 