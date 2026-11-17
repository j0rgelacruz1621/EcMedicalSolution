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
export interface UpdateUserAccountRequest {
  user_name?: string
  password?: string
  rol?: string | null
  application?: string | null
}

/** GET /users/:id — Detalle de una cuenta de usuario. */
export async function getUserAccount(id: number) {
  const response = await apiClient.get<UserAccount>(`/users/${id}`)
  return response.data
}

/** PATCH /users/:id — Modificar una cuenta de usuario. */
export async function updateUserAccount(id: number, payload: UpdateUserAccountRequest) {
  const response = await apiClient.patch<UserAccount>(`/users/${id}`, payload)
  return response.data
}

/** DELETE /users/:id — Eliminar una cuenta de usuario. */
export async function deleteUserAccount(id: number) {
  const response = await apiClient.delete<UserAccount>(`/users/${id}`)
  return response.data
}
