import { apiClient } from '../api-client'

export interface UserAccount {
  id: number
  created_at: string
  user_name: string
  rol: string | null
  application: string | null
}

export async function getUserAccounts() {
  const response = await apiClient.get<UserAccount[]>('/users/registered')
  return response.data
}

export async function createUserAccount(payload: {
  user_name: string
  password: string
  rol: 'SA' | 'DOCTOR'
  application: string
  doctor_id?: number
}) {
  const response = await apiClient.post<UserAccount>('/users', payload)
  return response.data
}