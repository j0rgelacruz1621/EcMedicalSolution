import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Bell, CircleHelp, Save, Search, Trash2 } from 'lucide-react'
import LeftSideBar from '../../left-sideBar'
import { getPatients, type Patient } from '../../../services/patients/patient-services'
import { getDoctor, type Doctor } from '../../../services/doctors/doctor-services'
import './style.scss'

const laboratoryAreas = [
  { name: 'HEMATOLOGÍA', exams: ['Hematología completa', 'Contaje de plaquetas', 'Hb. y Hto', 'Grupo sanguíneo y Factor RH', 'VSG'] },
  { name: 'COAGULACIÓN', exams: ['Tiempo de protrombina (TP)', 'Tiempo parcial de tromboplastina (TPT)', 'INR', 'Fibrinógeno'] },
  { name: 'QUÍMICA', exams: ['Glicemia', 'Creatinina', 'Perfil lipídico', 'Hemoglobina glicosilada (HbA1c)', 'Ácido úrico', 'Transaminasas'] },
  { name: 'SEROLOGÍA', exams: ['VDRL', 'HIV', 'Hepatitis B', 'Hepatitis C'] },
  { name: 'HORMONALES', exams: ['TSH', 'T4 libre', 'Cortisol', 'Estradiol'] },
  { name: 'ORINA Y HECES', exams: ['Uroanálisis', 'Examen de heces', 'Sangre oculta en heces'] },
]

export default function LabOrderView() {
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
  const [search, setSearch] = useState('')

  const [patientId, setPatientId] = useState<number | null>(null)
  const [selectedArea, setSelectedArea] = useState(laboratoryAreas[0].name)
  const [selectedExams, setSelectedExams] = useState<string[]>([])
  const [indication, setIndication] = useState('')

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
        if (active) setPatients([])
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

  const area = laboratoryAreas.find(item => item.name === selectedArea) ?? laboratoryAreas[0]

  const toggleExam = (exam: string) => {
    setSelectedExams(current =>
      current.includes(exam) ? current.filter(item => item !== exam) : [...current, exam],
    )
  }

  const changeArea = (name: string) => {
    setSelectedArea(name)
    const nextArea = laboratoryAreas.find(item => item.name === name)
    const allowed = new Set(nextArea?.exams ?? [])
    setSelectedExams(current => current.filter(exam => allowed.has(exam)))
  }

  const selectedPatient = patients.find(patient => patient.id === patientId) ?? null
  const canSave = Boolean(selectedPatient) && selectedExams.length > 0

  return (
    <div className="lo-root">
      <LeftSideBar />

      <main className="lo-main">
        <header className="lo-header">
          <h1>Informes</h1>
          <div className="lo-header-right">
            <button className="lo-icon" aria-label="Notificaciones">
              <Bell size={24} />
            </button>
            <button className="lo-icon" aria-label="Ayuda">
              <CircleHelp size={24} />
            </button>
            <div className="lo-user">
              <span>{activeDoctorName}</span>
            </div>
          </div>
        </header>

        <section className="lo-content">
          <div className="lo-content-header">
            <h2>Orden de Exámenes de laboratorio</h2>
            <p>Seleccione al paciente y los exámenes que desea ordenar.</p>
          </div>

          <div className="lo-grid">
            <aside className="lo-areas" aria-label="Áreas del laboratorio clínico">
              <h3>ÁREAS</h3>
              <nav>
                {laboratoryAreas.map(item => (
                  <button
                    key={item.name}
                    type="button"
                    className={item.name === selectedArea ? 'selected' : ''}
                    onClick={() => changeArea(item.name)}
                  >
                    {item.name}
                  </button>
                ))}
              </nav>
            </aside>

            <div className="lo-panel">
              <label className="lo-field">
                <span>Paciente</span>
                <div className="lo-search">
                  <Search size={18} />
                  <input
                    value={search}
                    onChange={event => setSearch(event.target.value)}
                    placeholder={loading ? 'Cargando pacientes...' : 'Buscar por nombre o cédula'}
                    disabled={loading}
                  />
                </div>
              </label>

              <label className="lo-field">
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

              <h3 className="lo-panel-title">Exámenes de {area.name.toLowerCase()}</h3>
              <div className="lo-exams">
                {area.exams.map(exam => (
                  <label key={exam} className={`lo-exam${selectedExams.includes(exam) ? ' checked' : ''}`}>
                    <input
                      type="checkbox"
                      checked={selectedExams.includes(exam)}
                      onChange={() => toggleExam(exam)}
                    />
                    <span>{exam}</span>
                  </label>
                ))}
              </div>

              <label className="lo-field">
                <span>Indicación clínica</span>
                <textarea
                  rows={3}
                  value={indication}
                  onChange={event => setIndication(event.target.value)}
                  placeholder="Motivo clínico de la orden..."
                />
              </label>

              {selectedExams.length > 0 && (
                <div className="lo-selected">
                  <strong>Exámenes seleccionados ({selectedExams.length})</strong>
                  <ul>
                    {selectedExams.map(exam => (
                      <li key={exam}>
                        <span>{exam}</span>
                        <button type="button" onClick={() => toggleExam(exam)} aria-label={`Quitar ${exam}`}>
                          <Trash2 size={15} />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="lo-actions">
                <button type="button" className="lo-btn lo-btn--ghost" onClick={() => navigate(`/reports${contextQuery}`)}>
                  Volver
                </button>
                <button type="button" className="lo-btn lo-btn--primary" disabled={!canSave}>
                  <Save size={16} /> Guardar orden
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}