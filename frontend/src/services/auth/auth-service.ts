import { apiClient } from '../api-client';

export interface LoginRequest {
  user_name: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  user: boolean;
  rol: string;
}

export const loginUser = async (credentials: LoginRequest): Promise<LoginResponse> => {
  try {
    const response = await apiClient.post<LoginResponse>('/auth/login', credentials);
    return response.data;
  } catch (error: any) {
    const message = error.response?.data?.message || 'Error al iniciar sesión';
    throw new Error(message);
  }
};