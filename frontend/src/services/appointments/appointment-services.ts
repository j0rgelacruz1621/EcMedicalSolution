import { apiClient } from '../api-client';
import type { Patient, PatientGender } from '../patients/patient-services';

export interface CreateAppointmentRequest {
  doctorId: number;
  startAt: string;
  endAt: string;
  medicalCenterId: number;
  officeId: number;
  reasonForVisit?: string;
  type?: string;
  patient: {
    nationalId: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    age: number;
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
  reasonForVisit?: string;
  type?: string;
  officeId?: number;
  medicalCenterId?: number;
  patient?: { id?: number; nationalId?: string; firstName?: string; lastName?: string } | null;
  guestFirstName?: string;
  guestLastName?: string;
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

/** Devuelve la próxima cita futura (o la última registrada si no hay) del paciente, sea registrado o invitado (guest). */
export async function getNextAppointmentForPatient(
  patient: Pick<Patient, 'id' | 'nationalId'>,
): Promise<Appointment | null> {
  const response = await getAppointments({ patientId: patient.id, limit: 50 });
  const guestResponse = await getAppointments({ guestNationalId: patient.nationalId, limit: 50 });
  const today = new Date().toISOString().slice(0, 10);
  const candidates = [...response.data, ...guestResponse.data]
    .filter((a) => a.status !== 'CANCELLED');
  const upcoming = candidates
    .filter((a) => (a.appointmentDate ?? '') >= today)
    .sort((a, b) =>
      (a.appointmentDate ?? '').localeCompare(b.appointmentDate ?? '') ||
      (a.startTime ?? '').localeCompare(b.startTime ?? ''),
    );
  if (upcoming.length) return upcoming[0];
  const last = candidates
    .sort((a, b) =>
      (b.appointmentDate ?? '').localeCompare(a.appointmentDate ?? '') ||
      (b.startTime ?? '').localeCompare(a.startTime ?? ''),
    );
  return last[0] ?? null;
}
