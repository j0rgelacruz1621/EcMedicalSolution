import { apiClient } from '../api-client'

export interface MedicalCenter {
  id: number
  name: string
  address?: string | null
  phone?: string | null
  offices?: Office[]
}

export interface Office {
  id: number
  medicalCenterId?: number
  officeNumber: string
  locationDetails?: string | null
  medicalCenter?: MedicalCenter
}

export async function getMedicalCenters() {
  const response = await apiClient.get<MedicalCenter[]>('/medical-centers')
  return response.data
}

export async function getOffices() {
  const response = await apiClient.get<Office[]>('/medical-centers/offices')
  return response.data
}

export async function createMedicalCenter(payload: { name: string; address?: string; phone?: string }) {
  const response = await apiClient.post<MedicalCenter>('/medical-centers', payload)
  return response.data
}

export async function createOffice(payload: { medicalCenterId: number; officeNumber: string; locationDetails?: string }) {
  const response = await apiClient.post<Office>('/medical-centers/offices', payload)
  return response.data
}
