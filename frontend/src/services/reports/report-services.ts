import { apiClient } from '../api-client';

// Tipos del módulo reports del backend (NestJS + Prisma).
export type ReportStatus = 'DRAFT' | 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED';

export interface Report {
  id: number;
  patient_id: number;
  doctor_id: number;
  appointment_id: number | null;
  title: string;
  content: string | null;
  file_url: string | null;
  status: ReportStatus | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface ReportListResponse {
  data: Report[];
  page: number;
  limit: number;
  total: number;
}

export interface CreateReportRequest {
  patient_id: number;
  doctor_id: number;
  appointment_id?: number;
  title: string;
  content?: string;
}

export interface QueryReportsParams {
  patient_id?: number;
  doctor_id?: number;
  status?: ReportStatus;
  page?: number;
  limit?: number;
}

/** POST /api/v1/reports — Crear un informe (reporte). */
export async function createReport(payload: CreateReportRequest) {
  const response = await apiClient.post<Report>('/api/v1/reports', payload);
  return response.data;
}

/** GET /api/v1/reports — Listar informes con filtros y paginación. */
export async function getReports(params?: QueryReportsParams) {
  const response = await apiClient.get<ReportListResponse>('/api/v1/reports', { params });
  return response.data;
}

/** GET /api/v1/reports/:id — Detalle de un informe. */
export async function getReport(id: number) {
  const response = await apiClient.get<Report>(`/api/v1/reports/${id}`);
  return response.data;
}

/** PATCH /api/v1/reports/:id/status — Cambiar el estado de un informe. */
export async function updateReportStatus(id: number, status: ReportStatus) {
  const response = await apiClient.patch<Report>(`/api/v1/reports/${id}/status`, { status });
  return response.data;
}

/** POST /api/v1/reports/:id/attachment — Adjuntar un archivo al informe. */
export async function attachReportFile(id: number, fileUrl: string) {
  const response = await apiClient.post<Report>(`/api/v1/reports/${id}/attachment`, {
    file_url: fileUrl,
  });
  return response.data;
}

/** GET /api/v1/doctors/:doctorId/reports/pending-count — Informes pendientes de un médico. */
export async function getDoctorPendingReportsCount(doctorId: number) {
  const response = await apiClient.get<{ doctorId: number; pendingCount: number }>(
    `/api/v1/doctors/${doctorId}/reports/pending-count`,
  );
  return response.data;
}
