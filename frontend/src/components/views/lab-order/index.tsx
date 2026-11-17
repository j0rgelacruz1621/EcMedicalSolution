import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Bell, CircleHelp, Save, Search, Trash2 } from 'lucide-react'
import LeftSideBar from '../../left-sideBar'
import { getPatients, type Patient } from '../../../services/patients/patient-services'
import { getDoctor, type Doctor } from '../../../services/doctors/doctor-services'
import {
  createLaboratoryOrder,
  getLaboratoryCategories,
  type LaboratoryCategory,
  type LaboratoryOrder,
} from '../../../services/laboratory/laboratory-services'
import './style.scss'

// Respaldo por si el catálogo del backend aún no tiene categorías creadas:
// el usuario puede seguir ordenando exámenes como "personalizados" (custom_tests).
const fallbackAreas = [
  { name: 'HEMATOLOGÍA' },
  { name: 'COAGULACIÓN' },
  { name: 'QUÍMICA' },
  { name: 'SEROLOGÍA' },
  { name: 'HORMONALES' },
  { name: 'ORINA Y HECES' },
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
  const [categories, setCategories] = useState<LaboratoryCategory[]>([])
  const [selectedArea, setSelectedArea] = useState<string>(fallbackAreas[0].name)
  const [selectedExams, setSelectedExams] = useState<string[]>([])
  const [indication, setIndication] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [feedback, setFeedback] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null)

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

    getLaboratoryCategories()
      .then(result => {
        if (!active) return
        setCategories(result)
        if (result.length) setSelectedArea(result[0].name)
      })
      .catch(() => undefined)

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

  // Con catálogo: exámenes reales del backend (se guardan como tests del catálogo).
  // Sin catálogo: área de respaldo, los marcados van como custom_tests.
  const area = useMemo(() => {
    const category = categories.find(item => item.name === selectedArea)
    if (category) {
      return {
        name: category.name,
        hasCatalog: true,
        exams: category.tests.map(test => ({
          label: test.name,
          catalog: { test_id: test.test_id, category_id: test.category_id },
        })),
      }
    }
    return { name: selectedArea, hasCatalog: false, exams: [] as { label: string; catalog?: { test_id: number; category_id: number } }[] }
  }, [categories, selectedArea])

  const toggleExam = (exam: string) => {
    setSelectedExams(current =>
      current.includes(exam) ? current.filter(item => item !== exam) : [...current, exam],
    )
  }

  const changeArea = (name: string) => {
    setSelectedArea(name)
    const nextExams = name === selectedArea ? area.exams.map(item => item.label) : []
    const allowed = new Set(nextExams.length ? nextExams : [])
    setSelectedExams(current => current.filter(exam => allowed.has(exam)))
  }

  const selectedPatient = patients.find(patient => patient.id === patientId) ?? null
  const canSave = Boolean(selectedPatient) && selectedExams.length > 0 && doctorId > 0 && !isSaving

  async function handleSave() {
    if (!canSave || !selectedPatient) return
    setFeedback(null)
    setIsSaving(true)
    try {
      const today = new Date().toISOString().slice(0, 10)
      const catalogTests = selectedExams
        .map(exam => area.exams.find(item => item.label === exam)?.catalog)
        .filter((item): item is { test_id: number; category_id: number } => Boolean(item))
      const customTests = area.hasCatalog
        ? []
        : selectedExams.map(exam => ({ category_name: area.name, test_name: exam }))

      const order = await createLaboratoryOrder({
        patient_id: selectedPatient.id,
        doctor_id: doctorId,
        issue_date: today,
        diagnosis: indication.trim() || undefined,
        ...(catalogTests.length ? { tests: catalogTests } : {}),
        ...(customTests.length ? { custom_tests: customTests } : {}),
      })
      setFeedback({
        kind: 'ok',
        text: `Orden #${order.id} guardada (${order.status}).`,
      })
      setSelectedExams([])
      setIndication('')
    } catch (error) {
      const message =
        error instanceof Error && error.message
          ? error.message
          : 'No se pudo guardar la orden.'
      setFeedback({ kind: 'error', text: message })
    } finally {
      setIsSaving(false)
    }
  }

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
                {(categories.length
                  ? categories.map(item => item.name)
                  : fallbackAreas.map(item => item.name)
                ).map(name => (
                  <button
                    key={name}
                    type="button"
                    className={name === selectedArea ? 'selected' : ''}
                    onClick={() => changeArea(name)}
                  >
                    {name}
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

              <h3 className="lo-panel-title">
                {area.hasCatalog
                  ? `Exámenes de ${area.name.toLowerCase()}`
                  : `${area.name} — sin catálogo del backend (se ordenan como exámenes personalizados)`}
              </h3>
              <div className="lo-exams">
                {area.exams.length === 0 ? (
                  <p className="lo-empty">
                    {area.hasCatalog
                      ? 'No hay exámenes activos en esta categoría.'
                      : 'No hay catálogo cargado. Agregue exámenes desde el panel de administración (SA).'}
                  </p>
                ) : (
                  area.exams.map(exam => (
                    <label
                      key={exam.label}
                      className={`lo-exam${selectedExams.includes(exam.label) ? ' checked' : ''}`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedExams.includes(exam.label)}
                        onChange={() => toggleExam(exam.label)}
                      />
                      <span>{exam.label}</span>
                    </label>
                  ))
                )}
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

              {feedback && (
                <p className={`lo-feedback${feedback.kind === 'error' ? ' lo-feedback--error' : ''}`} role="alert">
                  {feedback.text}
                </p>
              )}

              <div className="lo-actions">
                <button type="button" className="lo-btn lo-btn--ghost" onClick={() => navigate(`/reports${contextQuery}`)}>
                  Volver
                </button>
                <button
                  type="button"
                  className="lo-btn lo-btn--primary"
                  disabled={!canSave}
                  onClick={handleSave}
                >
                  <Save size={16} /> {isSaving ? 'Guardando…' : 'Guardar orden'}
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}