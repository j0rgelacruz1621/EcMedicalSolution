import { apiClient } from '../api-client';

export interface MedicalCenter {
  id: number;
  name: string;
  offices: Office[];
}

export interface Office {
  id: number;
  medicalCenterId?: number;
  officeNumber: string;
  locationDetails?: string | null;
  medicalCenter?: MedicalCenter;
}

export async function getMedicalCenters() {
  const response = await apiClient.get<MedicalCenter[]>('/medical-centers');
  return response.data;
}

export async function getOffices() {
  const response = await apiClient.get<Office[]>('/medical-centers/offices');
  return response.data;
}
