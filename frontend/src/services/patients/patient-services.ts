import { apiClient } from '../api-client';

export type PatientGender = 'MASCULINO' | 'FEMENINO' | 'OTRO';

export interface PatientVitals {
  blood_pressure_systolic: number | null;
  blood_pressure_diastolic: number | null;
  heart_rate_bpm: number | null;
  weight_kg: number | null;
  measured_at: string;
}

export interface Patient {
  id: number;
  nationalId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: PatientGender;
  medicalHistoryNotes: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  latestVitals?: PatientVitals | null;
}

export interface PatientListResponse {
  data: Patient[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface CreatePatientRequest {
  nationalId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: PatientGender;
  vitals: {
    bloodPressure?: string;
    heartRateBpm?: number;
    weightKg?: number;
  };
}

export async function getPatients(params: {
  page?: number;
  limit?: number;
  firstName?: string;
  nationalId?: string;
  doctorId?: number;
} = {}): Promise<PatientListResponse> {
  const response = await apiClient.get<PatientListResponse>('/api/v1/patients', {
    params,
  });

  return response.data;
}

export async function createPatient(payload: CreatePatientRequest): Promise<{
  patient: Patient;
  vitals: PatientVitals | null;
}> {
  const response = await apiClient.post('/api/v1/patients', payload);
  return response.data;
}
