import axios from 'axios';

const API_URL = 'https://api.smartmedicalcontrol.us/auth/login';

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
        console.log({
        credentials
        })
    const response = await axios.post<LoginResponse>(API_URL, credentials, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error: any) {
    const message = error.response?.data?.message || 'Error al iniciar sesión';
    throw new Error(message);
  }
};