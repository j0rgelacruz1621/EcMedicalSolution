import axios from 'axios';

const API_URL = 'https://api.smartmedicalcontrol.us/doctors';

// Definimos la estructura exacta que pide tu API
export interface DoctorRequestBody {
  licenseNumber: string;
  nationalId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  specialty: string;
  officeId: number;
}

export const registerDoctor = async (doctorData: DoctorRequestBody) => {
  try {
    const response = await axios.post(API_URL, doctorData, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  } catch (error: any) {
    // Si el backend devuelve un error específico, lo lanzamos
    const message = error.response?.data?.message || 'Error al registrar el especialista';
    throw new Error(message);
  }
};