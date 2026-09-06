import { apiClient } from '../api-client';

// Definimos la estructura exacta que pide tu API
export interface DoctorRequestBody {
  licenseNumber: string;
  nationalId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  specialty: string;
  officeId: number;
}

export interface Doctor {
  id: number;
  firstName: string;
  lastName: string;
  specialty?: string | null;
}

export async function getDoctors(): Promise<Doctor[]> {
  const response = await apiClient.get<{ data: Doctor[] }>('/doctors', {
    params: { page: 1, limit: 100 },
  });
  return response.data.data;
}

export const registerDoctor = async (doctorData: DoctorRequestBody) => {
  try {
    const response = await apiClient.post('/doctors', doctorData);
    return response.data;
  } catch (error: any) {
    // Si el backend devuelve un error específico, lo lanzamos
    const message = error.response?.data?.message || 'Error al registrar el especialista';
    throw new Error(message);
  }
};