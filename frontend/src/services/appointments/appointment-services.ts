import { apiClient } from '../api-client';
import type { PatientGender } from '../patients/patient-services';

export interface CreateAppointmentRequest {
  doctorId: number;
  startAt: string;
  endAt: string;
  medicalCenterId: number;
  officeId: number;
  reasonForVisit?: string;
  patient: {
    nationalId: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    dateOfBirth: string;
    gender: PatientGender;
  };
}

export interface Appointment {
  id: number;
  appointmentCode?: string;
  appointmentDate?: string;
  startTime?: string;
  endTime?: string;
  status?: string;
  patient?: { id?: number; nationalId?: string; firstName?: string; lastName?: string };
}

export interface AppointmentListResponse {
  data: Appointment[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export async function createAppointment(payload: CreateAppointmentRequest) {
  const response = await apiClient.post<Appointment>('/appointments', payload);
  return response.data;
}

export async function getAppointments(params: Record<string, string | number | undefined> = {}) {
  const { doctorId, medicalCenterId, patientId, appointmentDate, startDate, endDate, ...pagination } = params;
  const response = await apiClient.get<AppointmentListResponse>('/appointments', {
    params: {
      ...pagination,
      ...(doctorId !== undefined ? { doctor_id: doctorId } : {}),
      ...(medicalCenterId !== undefined ? { medical_center_id: medicalCenterId } : {}),
      ...(patientId !== undefined ? { patient_id: patientId } : {}),
      ...(appointmentDate !== undefined ? { appointment_date: appointmentDate } : {}),
      ...(startDate !== undefined ? { start_date: startDate } : {}),
      ...(endDate !== undefined ? { end_date: endDate } : {}),
    },
  });
  return response.data;
}
