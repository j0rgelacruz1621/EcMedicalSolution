import { apiClient } from '../api-client';

export type RecipeStatus = 'ACTIVE' | 'EDITED' | 'CANCELLED';

export interface RecipeMedication {
  drug_name: string;
  presentation?: string | null;
  dose?: string | null;
  frequency?: string | null;
  duration?: string | null;
}

export interface Recipe {
  recipe_id: number;
  patient_id: number;
  doctor_id: number;
  medical_center_id: number | null;
  appointment_id: number | null;
  issue_date: string;
  header_image_url: string | null;
  medications: RecipeMedication[];
  additional_instructions: string | null;
  status: RecipeStatus;
  version_type: 'ORIGINAL' | 'SUPERSEDED';
  supersedes_recipe_id: number | null;
  created_at: string;
  updated_at: string;
  patient: { id: number; full_name: string; national_id: string; age: number | null };
  doctor: { id: number; full_name: string; specialty: string | null };
}

export interface RecipeDocument {
  recipe: Recipe;
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

export interface RecipeListResponse {
  data: Recipe[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface SaveRecipeRequest {
  medications: RecipeMedication[];
  additional_instructions?: string;
}

export interface CreateRecipeRequest extends SaveRecipeRequest {
  patient_id: number;
  doctor_id?: number;
  appointment_id?: number;
  issue_date?: string;
}

function toErrorMessage(error: any, fallback: string) {
  const message = error.response?.data?.message;
  if (Array.isArray(message)) return message.join(' ');
  return message || fallback;
}

export async function createRecipe(payload: CreateRecipeRequest): Promise<Recipe> {
  try {
    const response = await apiClient.post<Recipe>('/api/v1/recipes', payload);
    return response.data;
  } catch (error: any) {
    throw new Error(toErrorMessage(error, 'No se pudo generar el récipe.'));
  }
}

export async function updateRecipe(id: number, payload: SaveRecipeRequest): Promise<Recipe> {
  try {
    const response = await apiClient.put<Recipe>(`/api/v1/recipes/${id}`, payload);
    return response.data;
  } catch (error: any) {
    throw new Error(toErrorMessage(error, 'No se pudo actualizar el récipe.'));
  }
}

export async function getPatientRecipes(
  patientId: number,
  params: { page?: number; limit?: number; include_history?: boolean } = {},
): Promise<RecipeListResponse> {
  const response = await apiClient.get<RecipeListResponse>(`/api/v1/patients/${patientId}/recipes`, {
    params,
  });
  return response.data;
}

export async function getRecipeDocument(id: number): Promise<RecipeDocument> {
  const response = await apiClient.get<RecipeDocument>(`/api/v1/recipes/${id}/document`);
  return response.data;
}

// Fecha local en formato YYYY-MM-DD (evita el desfase de toISOString en UTC).
export function todayLocalIsoDate() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

// Formatea una fecha YYYY-MM-DD sin conversión de zona horaria: "13 de julio de 2026".
export function formatIssueDate(isoDate: string, options: Intl.DateTimeFormatOptions = { dateStyle: 'long' }) {
  const [year, month, day] = isoDate.split('-').map(Number);
  return new Intl.DateTimeFormat('es-ES', options).format(new Date(year, month - 1, day));
}
