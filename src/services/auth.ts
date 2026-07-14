import api from './api';
import type { ApiResponse, AuthTokens, User } from '@/types';

export const authService = {
  async signup(data: { email: string; password: string; name: string }): Promise<User> {
    const response = await api.post<ApiResponse<User>>('/auth/signup', data);
    return response.data.data;
  },

  async login(data: { email: string; password: string }): Promise<AuthTokens> {
    const response = await api.post<ApiResponse<AuthTokens>>('/auth/login', data);
    return response.data.data;
  },
};
