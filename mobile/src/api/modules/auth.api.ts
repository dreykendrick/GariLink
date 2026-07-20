import { api } from '../client';
import type { AuthResponse, CurrentUserResponse, UserProfile } from '../../types/api.types';

export interface RegisterInput {
  phoneNumber: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export interface LoginInput {
  identifier: string;
  password: string;
  deviceId?: string;
  deviceName?: string;
}

export interface OtpRequestInput {
  phoneNumber: string;
  purpose: string;
}

export interface OtpVerifyInput {
  phoneNumber: string;
  purpose: string;
  code: string;
}

export const authApi = {
  register: (data: RegisterInput) =>
    api.post<AuthResponse>('/auth/register', data),

  login: (data: LoginInput) =>
    api.post<AuthResponse>('/auth/login', data),

  logout: () =>
    api.post<void>('/auth/logout'),

  refresh: (refreshToken: string) =>
    api.post<AuthResponse>('/auth/refresh', { refreshToken }),

  requestOtp: (data: OtpRequestInput) =>
    api.post<{ message: string }>('/auth/otp/request', data),

  verifyOtp: (data: OtpVerifyInput) =>
    api.post<{ verified: boolean }>('/auth/otp/verify', data),

  forgotPassword: (phoneNumber: string) =>
    api.post<{ message: string }>('/auth/password/forgot', { phoneNumber }),

  resetPassword: (data: {
    phoneNumber: string;
    otpCode: string;
    newPassword: string;
  }) => api.post<{ message: string }>('/auth/password/reset', data),

  getMe: () =>
    api.get<CurrentUserResponse>('/me'),

  updateProfile: (data: Partial<UserProfile>) =>
    api.post<UserProfile>('/profile', data),
};
