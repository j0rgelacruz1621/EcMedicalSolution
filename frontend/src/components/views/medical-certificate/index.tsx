import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Bell, CircleHelp, Printer, Save, Search } from 'lucide-react'
import LeftSideBar from '../../left-sideBar'
import { getPatients, type Patient } from '../../../services/patients/patient-services'
import { getDoctor, type Doctor } from '../../../services/doctors/doctor-services'
import {
  createMedicalReport,
  getMedicalReportDocument,
  type MedicalReportDocument,
} from '../../../services/medical-reports/medical-report-services'
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

  const [patientId, setPatientId] = useState<number | null>(
    searchParams.get('patient_id') ? Number(searchParams.get('patient_id')) : null,
  )
  const [documentType, setDocumentType] = useState(documentTypes[0])
  const [restDays, setRestDays] = useState('3')
  const [startDate, setStartDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [reason, setReason] = useState('')
  const [observations, setObservations] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [savedReport, setSavedReport] = useState<Awaited<ReturnType<typeof createMedicalReport>> | null>(null)
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

  const canSave = Boolean(selectedPatient) && reason.trim().length > 0 && doctorId > 0 && !isSaving

  function buildPayload() {
    const isRest = documentType === 'Informe de reposo médico'
    const content = [
      reason.trim(),
      observations.trim() ? `Observaciones: ${observations.trim()}` : '',
    ].filter(Boolean).join('\n')
    const days = isRest && restDays ? Math.max(1, Math.round(Number(restDays))) : undefined
    return {
      patient_id: selectedPatient!.id,
      doctor_id: doctorId,
      type: isRest ? ('REPOSO_MEDICO' as const) : ('CONSTANCIA_ASISTENCIA' as const),
      title: documentType,
      content,
      issue_date: new Date().toISOString().slice(0, 10),
      ...(isRest && days
        ? { rest_start_date: startDate, rest_days: days }
        : {}),
      diagnosis: reason.trim() || undefined,
    }
  }

  async function handleSave() {
    if (!canSave || !selectedPatient) return
    setFeedback(null)
    setIsSaving(true)
    try {
      const report = await createMedicalReport(buildPayload())
      setSavedReport(report)
      setFeedback({ kind: 'ok', text: `Informe #${report.id} guardado (${report.status}).` })
    } catch (saveError) {
      setFeedback({
        kind: 'error',
        text: saveError instanceof Error && saveError.message
          ? saveError.message
          : 'No se pudo guardar el informe.',
      })
    } finally {
      setIsSaving(false)
    }
  }

  async function handlePrint() {
    if (!savedReport) return
    try {
      const document = await getMedicalReportDocument(savedReport.id)
      openPrintWindow(document)
    } catch (printError) {
      setFeedback({
        kind: 'error',
        text: printError instanceof Error && printError.message
          ? printError.message
          : 'No se pudo generar el documento.',
      })
    }
  }

  function openPrintWindow(document: MedicalReportDocument) {
    const report = document.medical_report
    const phoneList = document.footer.phones.join(' · ')
    const win = window.open('', '_blank', 'width=800,height=1000')
    if (!win) {
      setFeedback({ kind: 'error', text: 'El navegador bloqueó la ventana de impresión.' })
      return
    }
    win.document.write(`<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"/>
      <title>${report.title} — ${report.issue_date}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 48px; color: #222; }
        .header { display: flex; gap: 16px; align-items: center; margin-bottom: 32px; }
        .header img { max-height: 90px; }
        .doctor { font-weight: bold; }
        h1 { font-size: 20px; border-bottom: 2px solid #222; padding-bottom: 8px; }
        .row { margin: 10px 0; }
        .label { font-weight: bold; }
        .content { white-space: pre-wrap; margin: 20px 0; line-height: 1.5; }
        footer { margin-top: 48px; font-size: 12px; color: #555; }
        .signature { margin-top: 60px; border-top: 1px solid #222; width: 280px; padding-top: 6px; }
        @media print { button { display: none; } }
      </style></head><body>
      <div class="header">
        ${document.header.image_url ? `<img src="${document.header.image_url}" alt="membrete"/>` : ''}
        <div>
          <div class="doctor">${document.header.doctor_name}</div>
          <div>${document.header.specialty ?? ''}</div>
          <div>${document.header.medical_center_name ?? ''}</div>
        </div>
      </div>
      <h1>${report.title}</h1>
      <div class="row"><span class="label">Paciente:</span> ${selectedPatient?.firstName ?? ''} ${selectedPatient?.lastName ?? ''} (CI ${selectedPatient?.nationalId ?? ''})</div>
      <div class="row"><span class="label">Fecha de emisión:</span> ${report.issue_date}</div>
      ${report.rest_start_date ? `<div class="row"><span class="label">Reposo:</span> desde ${report.rest_start_date}${report.rest_end_date ? ` hasta ${report.rest_end_date}` : ''}${report.rest_days ? ` (${report.rest_days} día${report.rest_days > 1 ? 's' : ''})` : ''}</div>` : ''}
      ${report.diagnosis ? `<div class="row"><span class="label">Diagnóstico:</span> ${report.diagnosis}</div>` : ''}
      <div class="content">${report.content}</div>
      <div class="signature">${document.header.doctor_name}<br/>${document.footer.license_number}${document.footer.cm_number ? ` — C.M. ${document.footer.cm_number}` : ''}</div>
      <footer>${document.footer.address ?? ''} · Tel: ${phoneList} · ${document.footer.email}</footer>
      <button onclick="window.print()">Imprimir / Guardar PDF</button>
    </body></html>`)
    win.document.close()
  }

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

            {feedback && (
              <p className={`mc-feedback${feedback.kind === 'error' ? ' mc-feedback--error' : ''}`} role="alert">
                {feedback.text}
              </p>
            )}

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
              <button
                type="button"
                className="mc-btn mc-btn--outline"
                disabled={!savedReport}
                onClick={handlePrint}
              >
                <Printer size={16} /> Imprimir
              </button>
              <button
                type="button"
                className="mc-btn mc-btn--primary"
                disabled={!canSave}
                onClick={handleSave}
              >
                <Save size={16} /> {isSaving ? 'Guardando…' : 'Guardar informe'}
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}