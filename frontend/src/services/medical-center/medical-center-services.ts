import { apiClient } from '../api-client'

export interface MedicalCenter {
  id: number
  name: string
  address?: string | null
  phone?: string | null
  schedule?: string | null
  isActive?: boolean | null
  createdAt?: string | null
  offices?: Office[]
}

export interface Office {
  id: number
  medicalCenterId?: number
  officeNumber: string
  locationDetails?: string | null
  medicalCenter?: MedicalCenter
}

export async function getMedicalCenters(includeInactive = false) {
  const response = await apiClient.get<MedicalCenter[]>('/medical-centers', {
    params: includeInactive ? { includeInactive: true } : undefined,
  })
  return response.data
}

export async function getOffices() {
  const response = await apiClient.get<Office[]>('/medical-centers/offices')
  return response.data
}

export type MedicalCenterPayload = {
  name: string
  address?: string
  phone?: string
  schedule?: string
  isActive?: boolean
}

export async function createMedicalCenter(payload: MedicalCenterPayload) {
  const response = await apiClient.post<MedicalCenter>('/medical-centers', payload)
  return response.data
}

export async function updateMedicalCenter(id: number, payload: Partial<MedicalCenterPayload>) {
  const response = await apiClient.patch<MedicalCenter>(`/medical-centers/${id}`, payload)
  return response.data
}

export async function deactivateMedicalCenter(id: number) {
  const response = await apiClient.delete<MedicalCenter>(`/medical-centers/${id}`)
  return response.data
}

export async function createOffice(payload: { medicalCenterId: number; officeNumber: string; locationDetails?: string }) {
  const response = await apiClient.post<Office>('/medical-centers/offices', payload)
  return response.data
}
