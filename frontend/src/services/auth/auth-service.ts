import { apiClient } from '../api-client';

export interface LoginRequest {
  user_name: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  user: boolean;
  rol: string;
  doctorId?: number;
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
export interface SessionResponse {
  active: boolean
  user: {
    id: number
    user_name: string
    rol: string | null
    application: string | null
    doctorId?: number
  }
}

/** GET /auth/session — Valida la sesión activa y devuelve el usuario con su rol. */
export const getSession = async (): Promise<SessionResponse> => {
  const response = await apiClient.get<SessionResponse>('/auth/session');
  return response.data;
};
