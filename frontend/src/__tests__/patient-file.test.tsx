import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, cleanup } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import PatientFileView from '../components/views/patient-file'
import type { Patient } from '../services/patients/patient-services'

// Mock del servicio: evita axios/red
vi.mock('../services/patients/patient-services', () => ({
  getPatient: vi.fn(),
}))
vi.mock('../services/appointments/appointment-services', () => ({
  getNextAppointmentForPatient: vi.fn(),
}))

import { getPatient } from '../services/patients/patient-services'
import { getNextAppointmentForPatient } from '../services/appointments/appointment-services'
const mockGetPatient = vi.mocked(getPatient)
const mockGetNextAppointment = vi.mocked(getNextAppointmentForPatient)

vi.mock('../../components/left-sideBar', () => ({ default: () => <aside data-testid="sidebar" /> }))

const mockPatient = (overrides: Partial<Patient> = {}): Patient => ({
  id: 25,
  nationalId: '1234567890',
  firstName: 'Ricardo',
  lastName: 'Mendoza',
  email: 'ricardo@test.com',
  phone: '04141234567',
  age: 54,
  origin: 'Mérida',
  address: null,
  gender: 'MASCULINO',
  medicalHistoryNotes: 'Paciente hipertenso en control.',
  isActive: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-09-10T00:00:00.000Z',
  latestVitals: {
    blood_pressure_systolic: 132,
    blood_pressure_diastolic: 85,
    heart_rate_bpm: 72,
    weight_kg: 84.5,
    measured_at: '2026-09-10T00:00:00.000Z',
  },
  ...overrides,
})

function renderView(id = '25') {
  return render(
    <MemoryRouter initialEntries={[`/patients/${id}`]}>
      <Routes>
        <Route path="/patients/:id" element={<PatientFileView />} />
      </Routes>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  mockGetPatient.mockReset()
  mockGetNextAppointment.mockReset()
  mockGetNextAppointment.mockResolvedValue(null)
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('PatientFileView — datos requeridos del paciente', () => {
  it('muestra el indicador de carga mientras llega la respuesta', () => {
    mockGetPatient.mockReturnValue(new Promise(() => {}))
    renderView()
    expect(screen.getByText(/cargando paciente/i)).toBeInTheDocument()
    expect(screen.queryByText('Ricardo Mendoza')).not.toBeInTheDocument()
  })

  it('muestra el nombre completo del paciente traído de la BD', async () => {
    mockGetPatient.mockResolvedValue(mockPatient())
    renderView()
    await waitFor(() => expect(screen.getByText('Ricardo Mendoza')).toBeInTheDocument())
    expect(mockGetPatient).toHaveBeenCalledWith(25)
  })

  it('muestra edad, cédula y procedencia reales', async () => {
    mockGetPatient.mockResolvedValue(mockPatient())
    renderView()
    await waitFor(() => expect(screen.getByText('54 años')).toBeInTheDocument())
    expect(screen.getByText('1234567890')).toBeInTheDocument()
    expect(screen.getByText('Mérida')).toBeInTheDocument()
  })

  it('muestra los signos vitales reales (PA, FC, peso)', async () => {
    mockGetPatient.mockResolvedValue(mockPatient())
    renderView()
    await waitFor(() => expect(screen.getByText('132/85 mmHg')).toBeInTheDocument())
    expect(screen.getByText('72 BPM')).toBeInTheDocument()
    expect(screen.getByText('84.5 Kg')).toBeInTheDocument()
  })

  it('muestra guiones cuando el paciente no tiene vitales registradas', async () => {
    mockGetPatient.mockResolvedValue(mockPatient({ latestVitals: null }))
    renderView()
    await waitFor(() => expect(screen.getByText('Ricardo Mendoza')).toBeInTheDocument())
    expect(screen.getAllByText('—').length).toBeGreaterThanOrEqual(3)
  })

  it('muestra la nota clínica real en la línea de tiempo', async () => {
    mockGetPatient.mockResolvedValue(mockPatient())
    renderView()
    await waitFor(() =>
      expect(screen.getAllByText('Paciente hipertenso en control.').length).toBeGreaterThanOrEqual(1),
    )
    expect(screen.getByText('Nota clínica')).toBeInTheDocument()
  })

  it('muestra el mensaje "sin registros" cuando no hay nota clínica', async () => {
    mockGetPatient.mockResolvedValue(mockPatient({ medicalHistoryNotes: null }))
    renderView()
    await waitFor(() =>
      expect(screen.getByText(/sin registros de evolución/i)).toBeInTheDocument(),
    )
  })

  it('muestra mensaje de error cuando la petición falla y NO se queda en blanco', async () => {
    mockGetPatient.mockRejectedValue(new Error('network down'))
    renderView()
    await waitFor(() =>
      expect(screen.getByText(/no se pudo cargar la información/i)).toBeInTheDocument(),
    )
  })

  it('muestra el mensaje de error para un id inexistente (404)', async () => {
    mockGetPatient.mockRejectedValue({ response: { status: 404 } })
    renderView('999')
    await waitFor(() =>
      expect(screen.getByText(/no se pudo cargar la información/i)).toBeInTheDocument(),
    )
  })

  it('no crashea mientras patient es null (regresión del pantallazo en blanco)', () => {
    // Estado de carga: patient = null. Antes del fix, la sección de tabs
    // leía patient.medicalHistoryNotes y desmontaba toda la app.
    mockGetPatient.mockReturnValue(new Promise(() => {}))
    renderView()
    // Si el componente crashea, esta aserción falla y el test rojo.
    expect(document.body.textContent).not.toBe('')
  })

  it('usa las iniciales del nombre real en el avatar', async () => {
    mockGetPatient.mockResolvedValue(mockPatient())
    renderView()
    await waitFor(() => expect(screen.getByText('RM')).toBeInTheDocument())
  })
})
