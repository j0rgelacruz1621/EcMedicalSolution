import { useState } from 'react'
import type { FormEvent } from 'react'
import {
  Activity,
  AlertCircle,
  BriefcaseMedical,
  ClipboardList,
  FileText,
  HeartPulse,
  Pill,
  Save,
  Stethoscope,
  UsersRound,
  X,
} from 'lucide-react'
import { updatePatient } from '../../../services/patients/patient-services'
import './style.scss'

interface NewClinicalHistoryModalProps {
  isOpen: boolean
  patientName: string
  patientId: number
  existingNotes?: string | null
  onClose: () => void
  onSaved: (result: Awaited<ReturnType<typeof updatePatient>>) => void
}

const personalHistory = [
  { key: 'hypertension', label: 'HTA' },
  { key: 'diabetes', label: 'DM2' },
  { key: 'allergies', label: 'Alergias a fármacos' },
  { key: 'neurological', label: 'Enf. neurológica' },
  { key: 'heartDisease', label: 'Enf. cardíaca' },
  { key: 'pulmonary', label: 'Enf. pulmonar' },
]

const familyHistory = [
  { key: 'father', label: 'Padre', placeholder: 'Antecedentes paternos...' },
  { key: 'mother', label: 'Madre', placeholder: 'Antecedentes maternos...' },
]

const habits = [
  { key: 'tobacco', label: 'Tabáquicos' },
  { key: 'chemicals', label: 'Químicos' },
  { key: 'alcohol', label: 'Enólicos' },
  { key: 'woodSmoke', label: 'Cocina con leña' },
  { key: 'chagas', label: 'Contacto con vector del Chagas' },
]

const ecgMeasurements = [
  { key: 'pr', label: 'PR' },
  { key: 'qrs', label: 'QRS' },
  { key: 'qt', label: 'QT' },
  { key: 'qtc', label: 'QTc' },
  { key: 'axis', label: 'Eje' },
]

function formatCurrentDate(): string {
  return new Intl.DateTimeFormat('es', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date())
}

function readField(data: FormData, name: string): string {
  return data.get(name)?.toString().trim() ?? ''
}

function readDecimal(data: FormData, name: string): number | undefined {
  const value = readField(data, name)
  if (!value) return undefined
  const parsed = Number(value.replace(',', '.'))
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`Revisa el valor de ${name === 'weightKg' ? 'peso' : 'frecuencia cardíaca'}.`)
  }
  return parsed
}

function addSection(lines: string[], title: string, entries: string[]) {
  const filledEntries = entries.filter(Boolean)
  if (filledEntries.length) lines.push(`${title}:\n${filledEntries.join('\n')}`)
}

export default function NewClinicalHistoryModal({
  isOpen,
  patientName,
  patientId,
  existingNotes,
  onClose,
  onSaved,
}: NewClinicalHistoryModalProps) {
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const currentDate = formatCurrentDate()

  if (!isOpen) return null

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')

    try {
      const data = new FormData(event.currentTarget)
      const bloodPressure = readField(data, 'bloodPressure')
      if (bloodPressure && !/^\d{2,3}\s*\/\s*\d{2,3}$/.test(bloodPressure)) {
        throw new Error('Ingresa la presión arterial en formato sistólica/diastólica.')
      }
      const heartRate = readDecimal(data, 'heartRateBpm')
      if (heartRate !== undefined && (!Number.isInteger(heartRate) || heartRate < 20 || heartRate > 250)) {
        throw new Error('La frecuencia cardíaca debe ser un número entero válido.')
      }
      const weight = readDecimal(data, 'weightKg')
      if (weight !== undefined && weight > 500) {
        throw new Error('El peso no puede superar los 500 kg.')
      }

      const lines: string[] = []
      addSection(lines, 'Motivo de consulta', [readField(data, 'reason')])
      addSection(
        lines,
        'Antecedentes personales',
        personalHistory.map(({ key, label }) => {
          const value = readField(data, `personal_${key}`)
          return value ? `${label}: ${value}` : ''
        }).concat(readField(data, 'personal_otherDetails')),
      )
      addSection(lines, 'Antecedentes familiares', familyHistory.map(({ key, label }) => {
        const value = readField(data, `family_${key}`)
        return value ? `${label}: ${value}` : ''
      }))
      addSection(lines, 'Tratamiento actual', [readField(data, 'treatment')])
      addSection(
        lines,
        'Hábitos psicobiológicos',
        habits.map(({ key, label }) => {
          const value = readField(data, `habit_${key}`)
          return value ? `${label}: ${value}` : ''
        }).concat(readField(data, 'habits_details')),
      )
      addSection(lines, 'Frecuencia respiratoria', [readField(data, 'respiratoryRate')])
      addSection(lines, 'Talla (m)', [readField(data, 'heightM')])
      addSection(lines, 'Hallazgos detallados', [readField(data, 'findings')])
      addSection(
        lines,
        'Electrocardiograma',
        [
          readField(data, 'ecg_rate') ? `Frecuencia: ${readField(data, 'ecg_rate')} lpm` : '',
          ...ecgMeasurements.map(({ key, label }) => {
            const value = readField(data, `ecg_${key}`)
            return value ? `${label}: ${value}` : ''
          }),
          readField(data, 'ecg_trace') ? `Trazo: ${readField(data, 'ecg_trace')}` : '',
          readField(data, 'ecg_notes'),
        ],
      )
      addSection(lines, 'Diagnósticos', [readField(data, 'diagnoses')])
      addSection(lines, 'Comentario / Plan', [readField(data, 'plan')])

      const payload: Parameters<typeof updatePatient>[1] = {}
      if (lines.length) {
        const datedNote = `Historial clínico — ${currentDate}\n${lines.join('\n\n')}`
        payload.medicalHistoryNotes = existingNotes?.trim()
          ? `${existingNotes.trim()}\n\n${datedNote}`
          : datedNote
      }

      const vitals: NonNullable<typeof payload.vitals> = {}
      if (bloodPressure) vitals.bloodPressure = bloodPressure.replace(/\s/g, '')
      if (heartRate !== undefined) vitals.heartRateBpm = heartRate
      if (weight !== undefined) vitals.weightKg = weight
      if (Object.keys(vitals).length) payload.vitals = vitals

      if (!Object.keys(payload).length) {
        throw new Error('Completa al menos un campo antes de guardar.')
      }

      setIsSaving(true)
      const result = await updatePatient(patientId, payload)
      onSaved(result)
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'No se pudo guardar el historial.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="clinical-history-overlay" role="presentation">
      <section
        className="clinical-history-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="clinical-history-title"
      >
        <header className="clinical-history-header">
          <div>
            <h2 id="clinical-history-title">Agregar al Historial Clínico</h2>
            <p>Paciente: {patientName} <span aria-hidden="true">•</span> Fecha: {currentDate}</p>
          </div>
          <button
            className="clinical-history-close"
            type="button"
            aria-label="Cerrar"
            onClick={onClose}
            disabled={isSaving}
          >
            <X size={20} />
          </button>
        </header>

        <form className="clinical-history-form" onSubmit={handleSubmit}>
          <div className="clinical-history-body">
            <div className="history-top-grid">
              <section className="history-section">
                <div className="history-top-column">
                  <div className="history-top-block">
                    <h3><Stethoscope aria-hidden="true" /> Motivo de consulta</h3>
                    <textarea name="reason" rows={4} placeholder="Escriba los síntomas principales o razón de la visita..." />
                  </div>
                  <div className="history-top-block personal-history-section">
                    <h3><ClipboardList aria-hidden="true" /> Antecedentes personales</h3>
                    <div className="personal-history-scroll">
                      <div className="radio-matrix">
                        {personalHistory.map(({ key, label }) => (
                          <div className="history-choice-row" key={key}>
                            <span className="history-choice-label">{label}</span>
                            <label><input type="radio" name={`personal_${key}`} value="Niega" /> Niega</label>
                            <label><input type="radio" name={`personal_${key}`} value="Afirma" /> Afirma</label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </section>
              <div className="history-top-column">
                <section className="history-top-block family-history-section">
                  <h3><UsersRound aria-hidden="true" /> Antecedentes familiares</h3>
                  {familyHistory.map(({ key, label, placeholder }) => (
                    <label className="family-history-field" key={key}>
                      <span><UsersRound aria-hidden="true" /> {label}</span>
                      <textarea name={`family_${key}`} rows={3} placeholder={placeholder} />
                    </label>
                  ))}
                </section>
                <section className="history-top-block">
                  <h3 className="accent-heading"><Pill aria-hidden="true" /> Tratamiento actual</h3>
                  <textarea name="treatment" rows={3} placeholder="Describa el tratamiento actual del paciente..." />
                </section>
              </div>
            </div>

            <section className="history-section habits-section">
              <h3><BriefcaseMedical aria-hidden="true" /> Hábitos psicobiológicos</h3>
              <div className="habit-options">
                {habits.map(({ key, label }) => (
                  <label className="habit-option" key={key}>
                    <input type="checkbox" name={`habit_${key}`} value="Refiere" />
                    <span>{label}</span>
                  </label>
                ))}
              </div>
              <input name="habits_details" type="text" placeholder="Otros hábitos relevantes..." />
            </section>

            <section className="history-section vitals-section">
              <h3><Activity aria-hidden="true" /> Examen físico: signos vitales</h3>
              <div className="vitals-grid">
                <label>P.A. (mmHg)<input name="bloodPressure" placeholder=" " inputMode="numeric" /></label>
                <label>F.C. (lpm)<input name="heartRateBpm" type="number" min="20" max="250" placeholder=" " /></label>
                <label>F.R. (rpm)<input name="respiratoryRate" type="number" min="1" placeholder=" " /></label>
                <label>Peso (kg)<input name="weightKg" type="number" min="0.1" step="0.1" placeholder=" " /></label>
                <label>Talla (m)<input name="heightM" type="number" min="0.1" step="0.01" placeholder=" " /></label>
              </div>
            </section>

            <section className="history-section findings-section">
              <h3><FileText aria-hidden="true" /> Hallazgos detallados</h3>
              <textarea name="findings" rows={7} placeholder="Escriba los hallazgos de la consulta..." />
            </section>

            <section className="history-section ecg-section">
              <h3><Activity aria-hidden="true" /> Electrocardiograma</h3>
              <div className="ecg-upload-placeholder" aria-disabled="true">
                <FileText aria-hidden="true" />
                <strong>Adjuntar trazo de ECG o imagen de hallazgos</strong>
                <span>La carga de archivos no está habilitada</span>
              </div>
              <textarea name="ecg_notes" rows={3} placeholder="Observaciones del EKG y descripción de hallazgos relevantes..." />
              <div className="ecg-entry">
                <h4><HeartPulse aria-hidden="true" /> ECG ingreso</h4>
                <div className="ecg-entry-row">
                  <span>R /</span>
                  <input name="ecg_rate" type="number" min="1" max="300" aria-label="Frecuencia cardíaca ECG" inputMode="numeric" />
                  <span>lpm</span>
                  {ecgMeasurements.map(({ key, label }) => (
                    <span className="ecg-entry-measurement" key={key}>
                      <span aria-hidden="true">/</span>
                      <input name={`ecg_${key}`} aria-label={label} inputMode="decimal" />
                    </span>
                  ))}
                  <span>°</span>
                </div>
                <label className="ecg-trace-field">Trazo:
                  <select name="ecg_trace" defaultValue="">
                    <option value="">Seleccionar</option>
                    <option value="Normal">Normal</option>
                    <option value="Anormal">Anormal</option>
                  </select>
                </label>
              </div>
            </section>

            <section className="history-section final-clinical-section">
              <label className="final-clinical-field"><h3><ClipboardList aria-hidden="true" /> Diagnósticos:</h3>
                <textarea name="diagnoses" rows={4} placeholder="Ingrese los diagnósticos del paciente..." />
              </label>
              <label className="final-clinical-field"><h3><BriefcaseMedical aria-hidden="true" /> Comentario / Plan y tratamiento:</h3>
                <textarea name="plan" rows={4} placeholder="Describa el plan de tratamiento y comentarios adicionales..." />
              </label>
            </section>

            {error && <p className="clinical-history-error" role="alert"><AlertCircle aria-hidden="true" />{error}</p>}
          </div>

          <footer className="clinical-history-footer">
            <button className="clinical-history-cancel" type="button" onClick={onClose} disabled={isSaving}>
              Cancelar
            </button>
            <button className="clinical-history-save" type="submit" disabled={isSaving}>
              <Save size={18} aria-hidden="true" /> {isSaving ? 'Guardando…' : 'Guardar información'}
            </button>
          </footer>
        </form>
      </section>
    </div>
  )
}
