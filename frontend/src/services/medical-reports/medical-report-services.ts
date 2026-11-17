import { apiClient } from '../api-client';

// Tipos del módulo medical-reports del backend (NestJS + Prisma).
export type MedicalReportType = 'REPOSO_MEDICO' | 'CONSTANCIA_ASISTENCIA' | 'INFORME_MEDICO';
export type MedicalReportStatus = 'ACTIVE' | 'EDITED' | 'SIGNED' | 'CANCELLED';

export interface MedicalReport {
  id: number;
  patient_id: number;
  doctor_id: number;
  medical_center_id: number | null;
  appointment_id: number | null;
  type: MedicalReportType;
  title: string;
  description: string | null;
  content: string;
  issue_date: string;
  rest_start_date: string | null;
  rest_end_date: string | null;
  rest_days: number | null;
  diagnosis_code: string | null;
  diagnosis: string | null;
  status: MedicalReportStatus;
}

export interface MedicalReportDocument {
  medical_report: MedicalReport;
  header: {
    image_url: string | null;
    doctor_name: string;
    specialty: string | null;
    medical_center_name: string | null;
  };
  footer: {
    address: string | null;
    phones: string[];
    email: string;
    license_number: string;
    cm_number: string | null;
  };
}

export interface CreateMedicalReportRequest {
  patient_id: number;
  doctor_id: number;
  medical_center_id?: number;
  appointment_id?: number;
  type?: MedicalReportType;
  title: string;
  description?: string;
  content: string;
  issue_date: string; // YYYY-MM-DD
  rest_start_date?: string;
  rest_end_date?: string;
  rest_days?: number;
  diagnosis_code?: string;
  diagnosis?: string;
}

export type UpdateMedicalReportRequest = Partial<
  Omit<CreateMedicalReportRequest, 'patient_id' | 'doctor_id'>
>;

export interface MedicalReportListResponse {
  data: MedicalReport[];
  page: number;
  limit: number;
}

/** POST /api/v1/medical-reports — Emitir un informe de reposo o constancia médica. */
export async function createMedicalReport(payload: CreateMedicalReportRequest) {
  const response = await apiClient.post<MedicalReport>('/api/v1/medical-reports', payload);
  return response.data;
}

/** GET /api/v1/medical-reports/:id — Detalle de un informe médico. */
export async function getMedicalReport(id: number) {
  const response = await apiClient.get<MedicalReport>(`/api/v1/medical-reports/${id}`);
  return response.data;
}

/** GET /api/v1/patients/:patientId/medical-reports — Informes de un paciente (paginado). */
export async function getPatientMedicalReports(
  patientId: number,
  params?: { startDate?: string; endDate?: string; type?: MedicalReportType; page?: number; limit?: number },
) {
  const response = await apiClient.get<MedicalReportListResponse>(
    `/api/v1/patients/${patientId}/medical-reports`,
    { params },
  );
  return response.data;
}

/** PATCH /api/v1/medical-reports/:id — Modificar un informe (pasa a EDITED). */
export async function updateMedicalReport(id: number, payload: UpdateMedicalReportRequest) {
  const response = await apiClient.patch<MedicalReport>(`/api/v1/medical-reports/${id}`, payload);
  return response.data;
}

/** PATCH /api/v1/medical-reports/:id/sign — Firmar un informe (pasa a SIGNED). */
export async function signMedicalReport(id: number) {
  const response = await apiClient.patch<MedicalReport>(`/api/v1/medical-reports/${id}/sign`);
  return response.data;
}

/** PATCH /api/v1/medical-reports/:id/cancel — Anular un informe (pasa a CANCELLED). */
export async function cancelMedicalReport(id: number) {
  const response = await apiClient.patch<MedicalReport>(`/api/v1/medical-reports/${id}/cancel`);
  return response.data;
}

/** GET /api/v1/medical-reports/:id/document — Documento imprimible del informe. */
export async function getMedicalReportDocument(id: number) {
  const response = await apiClient.get<MedicalReportDocument>(`/api/v1/medical-reports/${id}/document`);
  return response.data;
}
