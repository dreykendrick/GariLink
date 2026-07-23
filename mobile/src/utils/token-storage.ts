import * as SecureStore from 'expo-secure-store';

const KEYS = {
  ACCESS_TOKEN: 'gl_access_token',
  REFRESH_TOKEN: 'gl_refresh_token',
  USER_ID: 'gl_user_id',
} as const;

export const tokenStorage = {
  async getAccessToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(KEYS.ACCESS_TOKEN);
    } catch (e) {
      console.error('Error reading access token:', e);
      return null;
    }
  },

  async getRefreshToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(KEYS.REFRESH_TOKEN);
    } catch (e) {
      console.error('Error reading refresh token:', e);
      return null;
    }
  },

  async setTokens(accessToken: string, refreshToken: string): Promise<void> {
    try {
      await Promise.all([
        SecureStore.setItemAsync(KEYS.ACCESS_TOKEN, accessToken),
        SecureStore.setItemAsync(KEYS.REFRESH_TOKEN, refreshToken),
      ]);
    } catch (e) {
      console.error('Error setting tokens:', e);
    }
  },

  async setUserId(userId: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(KEYS.USER_ID, userId);
    } catch (e) {
      console.error('Error setting user ID:', e);
    }
  },

  async getUserId(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(KEYS.USER_ID);
    } catch (e) {
      console.error('Error reading user ID:', e);
      return null;
    }
  },

  async clearTokens(): Promise<void> {
    try {
      await Promise.all([
        SecureStore.deleteItemAsync(KEYS.ACCESS_TOKEN),
        SecureStore.deleteItemAsync(KEYS.REFRESH_TOKEN),
        SecureStore.deleteItemAsync(KEYS.USER_ID),
      ]);
    } catch (e) {
      console.error('Error clearing tokens:', e);
    }
  },

  async isAuthenticated(): Promise<boolean> {
    try {
      const token = await SecureStore.getItemAsync(KEYS.ACCESS_TOKEN);
      return token !== null;
    } catch (e) {
      console.error('Error checking authentication:', e);
      return false;
    }
  },
};
