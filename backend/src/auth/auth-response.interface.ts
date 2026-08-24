export interface AuthResponse {
  access_token: string;
  user: true;
  rol: string | null;
}

export interface SessionResponse {
  active: true;
  user: {
    id: number;
    user_name: string;
    rol: string | null;
    application: string | null;
    doctorId?: number;
  };
}