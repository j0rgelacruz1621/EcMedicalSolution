import { apiClient } from '../api-client';

// Tipos del módulo laboratory del backend (NestJS + Prisma).
export type LaboratoryOrderStatus = 'ACTIVE' | 'EDITED' | 'SIGNED' | 'CANCELLED';

export interface OrderCatalogTest {
  test_id: number;
  category_id: number;
}

export interface OrderCustomTest {
  category_name?: string;
  test_name: string;
}

export interface CreateLaboratoryOrderRequest {
  patient_id: number;
  doctor_id: number;
  medical_center_id?: number;
  appointment_id?: number;
  issue_date: string; // YYYY-MM-DD
  diagnosis?: string;
  additional_notes?: string;
  tests?: OrderCatalogTest[];
  custom_tests?: OrderCustomTest[];
}

export type UpdateLaboratoryOrderRequest = Partial<
  Omit<CreateLaboratoryOrderRequest, 'patient_id' | 'doctor_id' | 'medical_center_id' | 'appointment_id' | 'issue_date'>
>;

export interface LaboratoryOrderTest {
  test_id: number;
  category_id: number;
  category_name: string;
  internal_code: string | null;
  name: string;
  loinc_code: string | null;
}

export interface LaboratoryOrderCustomTest {
  category_name: string | null;
  test_name: string;
}

export interface LaboratoryOrder {
  id: number;
  patient_id: number;
  doctor_id: number;
  medical_center_id: number | null;
  appointment_id: number | null;
  issue_date: string;
  diagnosis: string | null;
  additional_notes: string | null;
  header_image_url: string | null;
  status: LaboratoryOrderStatus;
  tests: LaboratoryOrderTest[];
  custom_tests: LaboratoryOrderCustomTest[];
}

export interface LaboratoryOrderListResponse {
  data: LaboratoryOrder[];
  page: number;
  limit: number;
  total: number;
}

export interface LaboratoryTest {
  test_id: number;
  category_id: number;
  internal_code: string | null;
  name: string;
  loinc_code: string | null;
  is_active: boolean;
}

export interface LaboratoryCategory {
  category_id: number;
  name: string;
  is_active?: boolean;
  tests: LaboratoryTest[];
}

export interface CreateLaboratoryCategoryRequest {
  name: string;
}

export type UpdateLaboratoryCategoryRequest = Partial<CreateLaboratoryCategoryRequest>;

export interface CreateLaboratoryTestRequest {
  category_id: number;
  internal_code?: string;
  name: string;
  loinc_code?: string;
  is_active?: boolean;
}

export type UpdateLaboratoryTestRequest = Partial<CreateLaboratoryTestRequest>;

/** POST /api/v1/laboratory-orders — Emitir una orden de laboratorio. */
export async function createLaboratoryOrder(payload: CreateLaboratoryOrderRequest) {
  const response = await apiClient.post<LaboratoryOrder>('/api/v1/laboratory-orders', payload);
  return response.data;
}

/** GET /api/v1/laboratory-orders/:id — Detalle de una orden de laboratorio. */
export async function getLaboratoryOrder(id: number) {
  const response = await apiClient.get<LaboratoryOrder>(`/api/v1/laboratory-orders/${id}`);
  return response.data;
}

/** GET /api/v1/patients/:patientId/laboratory-orders — Historial de órdenes de un paciente. */
export async function getPatientLaboratoryOrders(
  patientId: number,
  params?: { page?: number; limit?: number },
) {
  const response = await apiClient.get<LaboratoryOrderListResponse>(
    `/api/v1/patients/${patientId}/laboratory-orders`,
    { params },
  );
  return response.data;
}

/** PATCH /api/v1/laboratory-orders/:id — Modificar una orden (pasa a EDITED). */
export async function updateLaboratoryOrder(id: number, payload: UpdateLaboratoryOrderRequest) {
  const response = await apiClient.patch<LaboratoryOrder>(`/api/v1/laboratory-orders/${id}`, payload);
  return response.data;
}

/** PATCH /api/v1/laboratory-orders/:id/sign — Firmar una orden (pasa a SIGNED). */
export async function signLaboratoryOrder(id: number) {
  const response = await apiClient.patch<LaboratoryOrder>(`/api/v1/laboratory-orders/${id}/sign`);
  return response.data;
}

/** PATCH /api/v1/laboratory-orders/:id/cancel — Anular una orden (pasa a CANCELLED). */
export async function cancelLaboratoryOrder(id: number) {
  const response = await apiClient.patch<LaboratoryOrder>(`/api/v1/laboratory-orders/${id}/cancel`);
  return response.data;
}

/** GET /api/v1/laboratory-orders/:id/pdf — Descarga el PDF imprimible de la orden. */
export async function getLaboratoryOrderPdf(id: number) {
  const response = await apiClient.get(`/api/v1/laboratory-orders/${id}/pdf`, {
    responseType: 'blob',
  });
  return response.data as Blob;
}

/** GET /api/v1/laboratory-categories — Catálogo de categorías con sus exámenes. */
export async function getLaboratoryCategories(params?: { include_inactive?: boolean }) {
  const response = await apiClient.get<LaboratoryCategory[]>('/api/v1/laboratory-categories', {
    params,
  });
  return response.data;
}

/** POST /api/v1/laboratory-categories — Crear categoría (solo SA). */
export async function createLaboratoryCategory(payload: CreateLaboratoryCategoryRequest) {
  const response = await apiClient.post<LaboratoryCategory>('/api/v1/laboratory-categories', payload);
  return response.data;
}

/** PATCH /api/v1/laboratory-categories/:id — Modificar/desactivar categoría (solo SA). */
export async function updateLaboratoryCategory(id: number, payload: UpdateLaboratoryCategoryRequest) {
  const response = await apiClient.patch<LaboratoryCategory>(
    `/api/v1/laboratory-categories/${id}`,
    payload,
  );
  return response.data;
}

/** POST /api/v1/laboratory-tests — Crear examen en una categoría (solo SA). */
export async function createLaboratoryTest(payload: CreateLaboratoryTestRequest) {
  const response = await apiClient.post<LaboratoryTest>('/api/v1/laboratory-tests', payload);
  return response.data;
}

/** PATCH /api/v1/laboratory-tests/:id — Modificar/mover/desactivar examen (solo SA). */
export async function updateLaboratoryTest(id: number, payload: UpdateLaboratoryTestRequest) {
  const response = await apiClient.patch<LaboratoryTest>(`/api/v1/laboratory-tests/${id}`, payload);
  return response.data;
}
