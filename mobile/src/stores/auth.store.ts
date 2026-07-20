import { create } from 'zustand';
import { tokenStorage } from '../utils/token-storage';
import { authApi } from '../api/modules/auth.api';
import type { AuthUser, CurrentUserResponse } from '../types/api.types';

interface AuthState {
  // State
  user: AuthUser | null;
  profile: CurrentUserResponse['profile'] | null;
  capabilities: CurrentUserResponse['capabilities'];
  isAuthenticated: boolean;
  isLoading: boolean;
  isHydrated: boolean;

  // Actions
  login: (identifier: string, password: string) => Promise<void>;
  register: (
    phoneNumber: string,
    password: string,
    firstName?: string,
    lastName?: string,
  ) => Promise<void>;
  logout: () => Promise<void>;
  refreshMe: () => Promise<void>;
  hydrate: () => Promise<void>;
  setUser: (user: AuthUser) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  capabilities: [],
  isAuthenticated: false,
  isLoading: false,
  isHydrated: false,

  hydrate: async () => {
    const isAuth = await tokenStorage.isAuthenticated();
    if (isAuth) {
      try {
        const me = await authApi.getMe();
        set({
          user: {
            id: me.id,
            phoneNumber: me.phoneNumber,
            email: me.email,
            roles: me.roles,
            isPhoneVerified: me.isPhoneVerified,
            isEmailVerified: me.isEmailVerified,
          },
          profile: me.profile,
          capabilities: me.capabilities,
          isAuthenticated: true,
        });
      } catch {
        await tokenStorage.clearTokens();
      }
    }
    set({ isHydrated: true });
  },

  login: async (identifier, password) => {
    set({ isLoading: true });
    try {
      const response = await authApi.login({ identifier, password });
      await tokenStorage.setTokens(response.accessToken, response.refreshToken);
      await tokenStorage.setUserId(response.user.id);
      set({
        user: response.user,
        isAuthenticated: true,
        isLoading: false,
      });
      // Fetch full profile in background
      void get().refreshMe();
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  register: async (phoneNumber, password, firstName, lastName) => {
    set({ isLoading: true });
    try {
      const response = await authApi.register({
        phoneNumber,
        password,
        firstName,
        lastName,
      });
      await tokenStorage.setTokens(response.accessToken, response.refreshToken);
      await tokenStorage.setUserId(response.user.id);
      set({
        user: response.user,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: async () => {
    try {
      await authApi.logout();
    } catch {
      // Ignore API errors on logout
    }
    await tokenStorage.clearTokens();
    set({
      user: null,
      profile: null,
      capabilities: [],
      isAuthenticated: false,
    });
  },

  refreshMe: async () => {
    try {
      const me = await authApi.getMe();
      set({
        user: {
          id: me.id,
          phoneNumber: me.phoneNumber,
          email: me.email,
          roles: me.roles,
          isPhoneVerified: me.isPhoneVerified,
          isEmailVerified: me.isEmailVerified,
        },
        profile: me.profile,
        capabilities: me.capabilities,
      });
    } catch {
      // Silently fail if network error
    }
  },

  setUser: (user) => set({ user }),
}));

// ─── Selectors ────────────────────────────────────────────────────────────

export const useIsAuthenticated = () => useAuthStore((s) => s.isAuthenticated);
export const useCurrentUser = () => useAuthStore((s) => s.user);
export const useUserProfile = () => useAuthStore((s) => s.profile);
export const useCapabilities = () => useAuthStore((s) => s.capabilities);
export const useIsAdmin = () =>
  useAuthStore((s) => s.user?.roles.includes('ADMIN') ?? false);
export const useIsDealer = () =>
  useAuthStore((s) =>
    s.user?.roles.some((r) => ['DEALER', 'ADMIN'].includes(r)) ?? false,
  );
export const useHasCapability = (type: string) =>
  useAuthStore((s) =>
    s.capabilities.some((c) => c.type === type && c.status === 'ACTIVE'),
  );
