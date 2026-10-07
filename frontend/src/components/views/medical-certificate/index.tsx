import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Bell, CircleHelp, Printer, Save, Search } from 'lucide-react'
import LeftSideBar from '../../left-sideBar'
import { getPatients, type Patient } from '../../../services/patients/patient-services'
import { getDoctor, type Doctor } from '../../../services/doctors/doctor-services'
import './style.scss'

const documentTypes = [
  'Informe de reposo médico',
  'Constancia médica',
]

export default function MedicalCertificateView() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const role = localStorage.getItem('user_rol')
  const doctorId = Number(
    role === 'DOCTOR'
      ? localStorage.getItem('doctor_id')
      : searchParams.get('doctorId') || sessionStorage.getItem('active_doctor_id') || 0,
  )
  const contextQuery = doctorId ? `?doctorId=${doctorId}` : ''

  const [doctor, setDoctor] = useState<Doctor | null>(null)
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  const [patientId, setPatientId] = useState<number | null>(null)
  const [documentType, setDocumentType] = useState(documentTypes[0])
  const [restDays, setRestDays] = useState('3')
  const [startDate, setStartDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [reason, setReason] = useState('')
  const [observations, setObservations] = useState('')

  const activeDoctorName = doctor
    ? `${doctor.firstName} ${doctor.lastName}`
    : sessionStorage.getItem('active_doctor_name') || 'Administración'

  useEffect(() => {
    let active = true

    getPatients({ page: 1, limit: 100 })
      .then(result => {
        if (active) setPatients(result.data)
      })
      .catch(() => {
        if (active) setError('No se pudo cargar el listado de pacientes.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    if (doctorId) {
      getDoctor(doctorId)
        .then(doctorResult => {
          if (!active) return
          setDoctor(doctorResult)
          sessionStorage.setItem('active_doctor_name', `${doctorResult.firstName} ${doctorResult.lastName}`)
        })
        .catch(() => undefined)
    }

    return () => {
      active = false
    }
  }, [doctorId])

  const filteredPatients = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return patients
    return patients.filter(
      patient =>
        `${patient.firstName} ${patient.lastName}`.toLowerCase().includes(term) ||
        patient.nationalId.toLowerCase().includes(term),
    )
  }, [patients, search])

  const selectedPatient = patients.find(patient => patient.id === patientId) ?? null

  const canSave = Boolean(selectedPatient) && reason.trim().length > 0

  return (
    <div className="mc-root">
      <LeftSideBar />

      <main className="mc-main">
        <header className="mc-header">
          <h1>Informes</h1>
          <div className="mc-header-right">
            <button className="mc-icon" aria-label="Notificaciones">
              <Bell size={24} />
            </button>
            <button className="mc-icon" aria-label="Ayuda">
              <CircleHelp size={24} />
            </button>
            <div className="mc-user">
              <span>{activeDoctorName}</span>
            </div>
          </div>
        </header>

        <section className="mc-content">
          <div className="mc-content-header">
            <h2>Informe de Reposo o Constancia</h2>
            <p>Seleccione el paciente y complete los datos para emitir el documento.</p>
          </div>

          <div className="mc-card">
            <div className="mc-fields">
              <label className="mc-field">
                <span>Paciente</span>
                <div className="mc-search">
                  <Search size={18} />
                  <input
                    value={search}
                    onChange={event => setSearch(event.target.value)}
                    placeholder={loading ? 'Cargando pacientes...' : 'Buscar por nombre o cédula'}
                    disabled={loading}
                  />
                </div>
              </label>

              <label className="mc-field">
                <span>Paciente seleccionado</span>
                <select
                  value={patientId ?? ''}
                  onChange={event => setPatientId(event.target.value ? Number(event.target.value) : null)}
                >
                  <option value="">Seleccione un paciente</option>
                  {filteredPatients.map(patient => (
                    <option key={patient.id} value={patient.id}>
                      {patient.firstName} {patient.lastName} · {patient.nationalId}
                    </option>
                  ))}
                </select>
              </label>

              <label className="mc-field">
                <span>Tipo de documento</span>
                <select value={documentType} onChange={event => setDocumentType(event.target.value)}>
                  {documentTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </label>

              <label className="mc-field">
                <span>Días de reposo</span>
                <input
                  type="number"
                  min={1}
                  value={restDays}
                  onChange={event => setRestDays(event.target.value)}
                />
              </label>

              <label className="mc-field">
                <span>Fecha de inicio</span>
                <input type="date" value={startDate} onChange={event => setStartDate(event.target.value)} />
              </label>

              <label className="mc-field mc-field--full">
                <span>Motivo</span>
                <textarea
                  value={reason}
                  onChange={event => setReason(event.target.value)}
                  placeholder="Motivo de la incapacidad o constancia..."
                  rows={3}
                />
              </label>

              <label className="mc-field mc-field--full">
                <span>Observaciones</span>
                <textarea
                  value={observations}
                  onChange={event => setObservations(event.target.value)}
                  placeholder="Observaciones adicionales (opcional)"
                  rows={3}
                />
              </label>
            </div>

            {error && <p className="mc-error">{error}</p>}

            {selectedPatient && (
              <div className="mc-summary">
                <strong>{selectedPatient.firstName} {selectedPatient.lastName}</strong>
                <span>Cédula: {selectedPatient.nationalId}</span>
                <span>Edad: {selectedPatient.age} años</span>
              </div>
            )}

            <div className="mc-actions">
              <button type="button" className="mc-btn mc-btn--ghost" onClick={() => navigate(`/reports${contextQuery}`)}>
                Volver
              </button>
              <button type="button" className="mc-btn mc-btn--outline" disabled={!canSave}>
                <Printer size={16} /> Imprimir
              </button>
              <button type="button" className="mc-btn mc-btn--primary" disabled={!canSave}>
                <Save size={16} /> Guardar informe
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}