import './style.scss';
import { useEffect, useId, useState, type FormEvent } from 'react';
import { FileText, Import, X } from 'lucide-react';
import type { Patient } from '../../../services/patients/patient-services';

const personalHistoryRows = [
  { key: 'hta', label: 'HTA', placeholder: 'Tiempo de evolución / control' },
  { key: 'dm2', label: 'DM2', placeholder: 'Tiempo de evolución / tratamiento' },
  { key: 'drugAllergies', label: 'Alergias a fármacos', placeholder: 'Especifique fármacos' },
  { key: 'neurological', label: 'Enf. neurológica', placeholder: '' },
  { key: 'thyroid', label: 'Enf tiroidea', placeholder: '' },
  { key: 'cardiac', label: 'Enf. cardiaca', placeholder: '' },
  { key: 'pulmonary', label: 'Enf. pulmonar', placeholder: '' },
  { key: 'gastrointestinal', label: 'Enf. gastrointestinal', placeholder: '' },
  { key: 'renal', label: 'Enf. renal', placeholder: '' },
  { key: 'gynecological', label: 'Enf. ginecologica', placeholder: '' },
  { key: 'previousSurgeries', label: 'Intervenciones previas', placeholder: 'Cirugías anteriores y fechas' },
  { key: 'others', label: 'Otros', placeholder: '' },
] as const;

type PersonalHistoryKey = (typeof personalHistoryRows)[number]['key'];

function emptyPersonalHistory() {
  return Object.fromEntries(personalHistoryRows.map((row) => [row.key, ''])) as Record<PersonalHistoryKey, string>;
}

const habitRows = [
  { key: 'smoking', label: 'Tabáquicos' },
  { key: 'chimo', label: 'Chimoicos' },
  { key: 'alcohol', label: 'Enólicos' },
  { key: 'woodStove', label: 'Cocina con leña' },
  { key: 'chagasVector', label: 'Contacto con vector del Chagas' },
] as const;

const habitAnswers = ['NIEGA', 'AFIRMA'] as const;

type HabitKey = (typeof habitRows)[number]['key'];
type HabitAnswer = (typeof habitAnswers)[number];

function defaultHabits() {
  return Object.fromEntries(habitRows.map((row) => [row.key, 'NIEGA'])) as Record<HabitKey, HabitAnswer>;
}

const vitalSignFields = [
  { key: 'firstBloodPressure', label: '1ª PA:', unit: 'MMHG.', ariaLabel: 'Primera presión arterial' },
  { key: 'heartRate', label: 'FC:', unit: 'LPM.', ariaLabel: 'Frecuencia cardíaca' },
  { key: 'respiratoryRate', label: 'FR:', unit: 'RPM.', ariaLabel: 'Frecuencia respiratoria' },
  { key: 'weight', label: 'Peso:', unit: '', ariaLabel: 'Peso' },
  { key: 'height', label: 'Talla:', unit: '', ariaLabel: 'Talla' },
  { key: 'secondBloodPressure', label: '2ª PA:', unit: '', ariaLabel: 'Segunda presión arterial' },
] as const;

// Ritmo (R) / Frecuencia (lpm) / P-R (") / QRS (") / QT (") / Eje (°)
const ecgFields = [
  { key: 'rhythm', prefix: 'R', suffix: '', ariaLabel: 'Ritmo' },
  { key: 'rate', prefix: '', suffix: 'lpm', ariaLabel: 'Frecuencia en lpm' },
  { key: 'prInterval', prefix: '', suffix: '"', ariaLabel: 'Intervalo P-R en segundos' },
  { key: 'qrsComplex', prefix: '', suffix: '"', ariaLabel: 'Complejo QRS en segundos' },
  { key: 'qtInterval', prefix: '', suffix: '"', ariaLabel: 'Intervalo QT en segundos' },
  { key: 'axis', prefix: '', suffix: '°', ariaLabel: 'Eje eléctrico en grados' },
] as const;

type VitalSignKey = (typeof vitalSignFields)[number]['key'];
type EcgKey = (typeof ecgFields)[number]['key'];

const PHYSICAL_EXAM_TEMPLATE =
  'ADECUADA COLORACIÓN DE PIEL Y MUCOSAS, TOLERA EL DECUBITO SUPINO, PULSO VENOSO YUGULAR NO INGURGITADO, SIN SOPLOS CAROTIDEOS. TÓRAX SIMÉTRICO, NORMOEXPANSIBLE, MURMULLO VESICULAR AUDIBLE EN AMBOS CAMPOS PULMONARES, SIN AGREGADOS. RUIDOS CARDIACOS RÍTMICOS, SIN SOPLOS, SIN FROTE PERICARDICO, SIN S3 NI S4. ABDOMEN: BLANDO, SIN VISCEROMEGALIAS, NO DOLOROSO A LA PALPACIÓN. EXTREMIDADES: SIMÉTRICAS, SIN EDEMA. PULSOS DISTALES DE ADECUADA AMPLITUD. NEUROLÓGICO: VIGIL, ORIENTADO EN TIEMPO, ESPACIO Y PERSONA, SIN FOCALIDAD NEUROLÓGICA.';

const CHEST_XRAY_TEMPLATE =
  'INDICE CARDIOTORACICO ≤ 0.5. SILUETA CARDIOMEDIASTINICA NORMAL. ANGULOS CARDIOFRÉNICOS Y COSTODIAFRAGMÁTICOS LIBRES';

function emptyRecord<K extends string>(keys: readonly { key: K }[]) {
  return Object.fromEntries(keys.map((item) => [item.key, ''])) as Record<K, string>;
}

const surgicalRiskLevels = [
  { value: 'BAJO', label: 'BAJO (<1%)' },
  { value: 'INTERMEDIO', label: 'INTERMEDIO (<5%)' },
  { value: 'ALTO', label: 'ALTO (>5%)' },
] as const;

type SurgicalRisk = (typeof surgicalRiskLevels)[number]['value'];

// Filas tal como el formulario en papel: los criterios largos de ALTO ocupan dos filas.
const surgicalRiskRows: [string, string, string][] = [
  ['- PROCEDIMIENTOS ENDOSCÓPICOS', '- ENDARTERECTOMIA CARÓTIDA', '- CX MAYOR DE EMERGENCIA'],
  ['- PROCEDIMIENTOS SUPERFICIALES', '- CABEZA Y CUELLO', 'PARTICULARMENTE EN ANCIANOS'],
  ['- CX DE CATARATAS', '- CX INTRATORACICA', '- CX AORTICA Y GRANDES VASOS'],
  ['- CX DE MAMA', '- CX ABDOMINO - PÉLVICO', '- CX VASCULAR PERIFÉRICO'],
  ['', '- CX ORTOPÉDICA', '- PROCEDIMIENTOS CX PROLONGADOS QUE'],
  ['', '- CX PROSTATA', 'AMERITEN GRAN INTERCAMBIO DE FLUIDOS Y/O TRANSFUSION'],
];

export interface PreoperativeEvaluationForm {
  date: string;
  firstName: string;
  lastName: string;
  age: string;
  nationalId: string;
  address: string;
  intervention: string;
  personalHistory: Record<PersonalHistoryKey, string>;
  currentMedication: string;
  motherHistory: string;
  fatherHistory: string;
  habits: Record<HabitKey, HabitAnswer>;
  vitalSigns: Record<VitalSignKey, string>;
  physicalExam: string;
  ecg: Record<EcgKey, string>;
  ecgTracing: string;
  chestXray: string;
  surgicalRisk: SurgicalRisk | '';
}

type TextField = Exclude<keyof PreoperativeEvaluationForm, 'personalHistory' | 'habits' | 'vitalSigns' | 'ecg' | 'surgicalRisk'>;

interface PreoperativeEvaluationModalProps {
  isOpen: boolean;
  patient: Patient | null;
  onClose: () => void;
  onSave: (evaluation: PreoperativeEvaluationForm) => void;
}

const PRINT_CLASS = 'printing-preoperative-evaluation';

function todayIsoDate() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

// El estado vive en un componente interno para que el formulario se reinicie
// cada vez que se abre el modal.
function EvaluationForm({ patient, onClose, onSave }: Omit<PreoperativeEvaluationModalProps, 'isOpen'>) {
  const fieldId = useId();
  const [form, setForm] = useState<PreoperativeEvaluationForm>({
    date: todayIsoDate(),
    firstName: patient?.firstName ?? '',
    lastName: patient?.lastName ?? '',
    age: patient?.age != null ? `${patient.age} años` : '',
    nationalId: patient?.nationalId ?? '',
    address: patient?.address ?? '',
    intervention: '',
    personalHistory: emptyPersonalHistory(),
    currentMedication: '',
    motherHistory: '',
    fatherHistory: '',
    habits: defaultHabits(),
    vitalSigns: emptyRecord(vitalSignFields),
    physicalExam: PHYSICAL_EXAM_TEMPLATE,
    ecg: emptyRecord(ecgFields),
    ecgTracing: '',
    chestXray: CHEST_XRAY_TEMPLATE,
    surgicalRisk: '',
  });

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const updateField = (field: TextField, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const updatePersonalHistory = (key: PersonalHistoryKey, value: string) => {
    setForm((current) => ({ ...current, personalHistory: { ...current.personalHistory, [key]: value } }));
  };

  const updateHabit = (key: HabitKey, value: HabitAnswer) => {
    setForm((current) => ({ ...current, habits: { ...current.habits, [key]: value } }));
  };

  const updateVitalSign = (key: VitalSignKey, value: string) => {
    setForm((current) => ({ ...current, vitalSigns: { ...current.vitalSigns, [key]: value } }));
  };

  const updateEcg = (key: EcgKey, value: string) => {
    setForm((current) => ({ ...current, ecg: { ...current.ecg, [key]: value } }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    // La clase limita los estilos de impresión a este modal.
    document.body.classList.add(PRINT_CLASS);
    window.print();
    document.body.classList.remove(PRINT_CLASS);

    onSave({ ...form, intervention: form.intervention.trim() });
  };

  return (
    <div className="preoperative-evaluation-overlay" role="presentation">
      <form
        className="preoperative-evaluation-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${fieldId}-title`}
        onSubmit={handleSubmit}
      >
        <header className="evaluation-header">
          <div className="evaluation-title">
            <span className="evaluation-title-icon" aria-hidden="true">
              <FileText size={20} />
            </span>
            <h2 id={`${fieldId}-title`}>Valoración Preoperatoria</h2>
          </div>
          <button
            type="button"
            className="evaluation-close-button"
            aria-label="Cerrar valoración preoperatoria"
            onClick={onClose}
          >
            <X size={22} />
          </button>
        </header>

        <div className="evaluation-body">
          <div className="evaluation-date-row">
            <div className="evaluation-date-box">
              <label htmlFor={`${fieldId}-date`}>Fecha:</label>
              <input
                id={`${fieldId}-date`}
                type="date"
                required
                value={form.date}
                onChange={(event) => updateField('date', event.target.value)}
              />
            </div>
          </div>

          <section className="evaluation-section" aria-labelledby={`${fieldId}-patient`}>
            <h3 id={`${fieldId}-patient`} className="evaluation-section-title">Datos del paciente</h3>

            <div className="evaluation-fields">
              <div className="evaluation-field">
                <label htmlFor={`${fieldId}-first-name`}>Nombres</label>
                <input
                  id={`${fieldId}-first-name`}
                  type="text"
                  value={form.firstName}
                  onChange={(event) => updateField('firstName', event.target.value)}
                />
              </div>
              <div className="evaluation-field">
                <label htmlFor={`${fieldId}-last-name`}>Apellidos</label>
                <input
                  id={`${fieldId}-last-name`}
                  type="text"
                  value={form.lastName}
                  onChange={(event) => updateField('lastName', event.target.value)}
                />
              </div>
              <div className="evaluation-field">
                <label htmlFor={`${fieldId}-age`}>Edad</label>
                <input
                  id={`${fieldId}-age`}
                  type="text"
                  value={form.age}
                  onChange={(event) => updateField('age', event.target.value)}
                />
              </div>
              <div className="evaluation-field">
                <label htmlFor={`${fieldId}-national-id`}>C.I.</label>
                <input
                  id={`${fieldId}-national-id`}
                  type="text"
                  value={form.nationalId}
                  onChange={(event) => updateField('nationalId', event.target.value)}
                />
              </div>
              <div className="evaluation-field evaluation-field-wide">
                <label htmlFor={`${fieldId}-address`}>Dirección</label>
                <input
                  id={`${fieldId}-address`}
                  type="text"
                  placeholder="Dirección domiciliaria"
                  value={form.address}
                  onChange={(event) => updateField('address', event.target.value)}
                />
              </div>
            </div>
          </section>

          <section className="evaluation-section evaluation-intervention">
            <label htmlFor={`${fieldId}-intervention`}>Intervención:</label>
            <input
              id={`${fieldId}-intervention`}
              type="text"
              required
              placeholder="Tipo de intervención quirúrgica planificada"
              value={form.intervention}
              onChange={(event) => updateField('intervention', event.target.value)}
            />
          </section>

          <section className="evaluation-section" aria-labelledby={`${fieldId}-history`}>
            <h3 id={`${fieldId}-history`} className="evaluation-section-title evaluation-section-title-tight">
              Antecedentes personales
            </h3>

            <div className="evaluation-history-table">
              {personalHistoryRows.map((row) => (
                <div key={row.key} className="evaluation-history-row">
                  <label htmlFor={`${fieldId}-history-${row.key}`}>{row.label}</label>
                  <div className="evaluation-history-cell">
                    <input
                      id={`${fieldId}-history-${row.key}`}
                      type="text"
                      placeholder={row.placeholder || undefined}
                      value={form.personalHistory[row.key]}
                      onChange={(event) => updatePersonalHistory(row.key, event.target.value)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="evaluation-section">
            <h3 className="evaluation-section-title evaluation-section-title-tight">
              <label htmlFor={`${fieldId}-medication`}>Medicación actual</label>
            </h3>
            <textarea
              id={`${fieldId}-medication`}
              className="evaluation-medication"
              rows={2}
              placeholder="Detallar medicamentos y dosis actuales..."
              value={form.currentMedication}
              onChange={(event) => updateField('currentMedication', event.target.value)}
            />

            <div className="evaluation-columns">
              <div>
                <h3 className="evaluation-section-title evaluation-subsection-title">Antecedentes familiares</h3>
                <div className="evaluation-family-row">
                  <label htmlFor={`${fieldId}-mother`}>Madre:</label>
                  <input
                    id={`${fieldId}-mother`}
                    type="text"
                    value={form.motherHistory}
                    onChange={(event) => updateField('motherHistory', event.target.value)}
                  />
                </div>
                <div className="evaluation-family-row">
                  <label htmlFor={`${fieldId}-father`}>Padre:</label>
                  <input
                    id={`${fieldId}-father`}
                    type="text"
                    value={form.fatherHistory}
                    onChange={(event) => updateField('fatherHistory', event.target.value)}
                  />
                </div>
              </div>

              <div>
                <h3 className="evaluation-section-title evaluation-subsection-title">Hábitos psicobiológicos</h3>
                <div className="evaluation-habits">
                  {habitRows.map((row) => (
                    <div
                      key={row.key}
                      className="evaluation-habit-row"
                      role="radiogroup"
                      aria-labelledby={`${fieldId}-habit-${row.key}`}
                    >
                      <span id={`${fieldId}-habit-${row.key}`} className="evaluation-habit-label">{row.label}:</span>
                      <div className="evaluation-habit-options">
                        {habitAnswers.map((answer) => (
                          <label key={answer}>
                            <input
                              type="radio"
                              name={`${fieldId}-habit-${row.key}`}
                              value={answer}
                              checked={form.habits[row.key] === answer}
                              onChange={() => updateHabit(row.key, answer)}
                            />
                            {answer}
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="evaluation-section evaluation-exam" aria-labelledby={`${fieldId}-exam`}>
            <h3 id={`${fieldId}-exam`} className="evaluation-section-title evaluation-section-title-tight">
              Examen físico
            </h3>

            <div className="evaluation-vitals">
              {vitalSignFields.map((field) => (
                <div key={field.key} className="evaluation-vital">
                  <label htmlFor={`${fieldId}-vital-${field.key}`}>{field.label}</label>
                  <input
                    id={`${fieldId}-vital-${field.key}`}
                    type="text"
                    aria-label={field.ariaLabel}
                    value={form.vitalSigns[field.key]}
                    onChange={(event) => updateVitalSign(field.key, event.target.value)}
                  />
                  {field.unit && <span className="evaluation-unit">{field.unit}</span>}
                </div>
              ))}
            </div>

            <textarea
              className="evaluation-report evaluation-exam-description"
              rows={4}
              aria-label="Descripción del examen físico"
              value={form.physicalExam}
              onChange={(event) => updateField('physicalExam', event.target.value)}
            />
          </section>

          <section className="evaluation-section evaluation-ecg" aria-labelledby={`${fieldId}-ecg`}>
            <div className="evaluation-ecg-values">
              <h3 id={`${fieldId}-ecg`} className="evaluation-ecg-title">ECG ingreso:</h3>
              {ecgFields.map((field, index) => (
                <span key={field.key} className="evaluation-ecg-item">
                  {field.prefix && <span className="evaluation-ecg-mark">{field.prefix}</span>}
                  <input
                    type="text"
                    aria-label={field.ariaLabel}
                    value={form.ecg[field.key]}
                    onChange={(event) => updateEcg(field.key, event.target.value)}
                  />
                  {field.suffix && <span className="evaluation-ecg-mark">{field.suffix}</span>}
                  {index < ecgFields.length - 1 && <span className="evaluation-ecg-mark">/</span>}
                </span>
              ))}
            </div>

            <div className="evaluation-inline-field">
              <label htmlFor={`${fieldId}-tracing`}>Trazo:</label>
              <input
                id={`${fieldId}-tracing`}
                type="text"
                placeholder="Descripción del trazado electrocardiógrafo"
                value={form.ecgTracing}
                onChange={(event) => updateField('ecgTracing', event.target.value)}
              />
            </div>

            <div className="evaluation-xray">
              <label htmlFor={`${fieldId}-xray`}>Radiografia de tórax:</label>
              <textarea
                id={`${fieldId}-xray`}
                className="evaluation-report evaluation-xray-description"
                rows={2}
                value={form.chestXray}
                onChange={(event) => updateField('chestXray', event.target.value)}
              />
            </div>
          </section>

          <section className="evaluation-section evaluation-risk" aria-labelledby={`${fieldId}-risk`}>
            <div className="evaluation-risk-scroll">
              <table className="evaluation-risk-table">
                <thead>
                  <tr>
                    <th id={`${fieldId}-risk`} colSpan={3} className="evaluation-risk-title">
                      Riesgo del procedimiento quirúrgico
                    </th>
                  </tr>
                  <tr>
                    {surgicalRiskLevels.map((level) => (
                      <th key={level.value} className="evaluation-risk-level">
                        <label>
                          <input
                            type="radio"
                            name={`${fieldId}-surgical-risk`}
                            value={level.value}
                            checked={form.surgicalRisk === level.value}
                            onChange={() => setForm((current) => ({ ...current, surgicalRisk: level.value }))}
                          />
                          {level.label}
                        </label>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {surgicalRiskRows.map((row, rowIndex) => (
                    <tr key={rowIndex}>
                      {row.map((criterion, columnIndex) => (
                        <td key={columnIndex}>{criterion}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <footer className="evaluation-footer">
          <button type="button" className="evaluation-cancel-button" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" className="evaluation-save-button">
            <Import size={16} aria-hidden="true" />
            Guardar e Imprimir
          </button>
        </footer>
      </form>
    </div>
  );
}

export default function PreoperativeEvaluationModal({ isOpen, ...props }: PreoperativeEvaluationModalProps) {
  if (!isOpen) return null;

  return <EvaluationForm {...props} />;
}
