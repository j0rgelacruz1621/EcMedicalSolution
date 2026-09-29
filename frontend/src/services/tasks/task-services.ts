import { apiClient } from '../api-client';

export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH';

export interface Task {
  id: number;
  doctor_id?: number;
  doctorId?: number;
  title: string;
  description?: string | null;
  priority?: TaskPriority | null;
  status?: TaskStatus | null;
  due_date?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface TaskSummary {
  byStatus?: { status: TaskStatus | null; count: number }[];
  urgentPending?: number;
  total?: number;
}

export interface CreateTaskRequest {
  title: string;
  description?: string;
  priority?: TaskPriority;
  due_date?: string;
}

export async function getDoctorTasks(
  doctorId: number,
  params?: { status?: TaskStatus; page?: number; limit?: number; sortBy?: 'due_date' | 'priority'; order?: 'asc' | 'desc' },
) {
  const response = await apiClient.get(`/api/v1/doctors/${doctorId}/tasks`, { params });
  return response.data as { data: Task[]; total: number; page: number; limit: number; totalPages: number };
}

export async function getDoctorTaskSummary(doctorId: number) {
  const response = await apiClient.get(`/api/v1/doctors/${doctorId}/tasks/summary`);
  return response.data as TaskSummary;
}

export async function createDoctorTask(doctorId: number, payload: CreateTaskRequest) {
  const response = await apiClient.post<Task>(`/api/v1/doctors/${doctorId}/tasks`, payload);
  return response.data;
}

export async function updateTaskStatus(taskId: number, status: TaskStatus) {
  const response = await apiClient.patch<Task>(`/api/v1/tasks/${taskId}/status`, { status });
  return response.data;
}

export async function deleteTask(taskId: number) {
  const response = await apiClient.delete(`/api/v1/tasks/${taskId}`);
  return response.data;
}
