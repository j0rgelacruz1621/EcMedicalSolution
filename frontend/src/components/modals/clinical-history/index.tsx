import './style.scss';
import { Activity, CalendarClock, HeartPulse, Plus, X } from 'lucide-react';

import { useMemo } from 'react';
import type { Patient, PatientVitals } from '../../../services/patients/patient-services';

interface ClinicalHistoryModalProps {
  isOpen: boolean;
  patientName: string;
  patient?: Patient | null;
  vitalsHistory?: PatientVitals[];
  onClose: () => void;
  onAddHistory: () => void;
}

function formatDate(value?: string | null) {
  if (!value) return 'Sin registro';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Sin registro';
  return new Intl.DateTimeFormat('es-ES', { dateStyle: 'medium' }).format(date);
}

function formatLongDate(value?: string | null) {
  if (!value) return 'Sin registro';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Sin registro';
  return new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
    .format(date)
    .replace('.', '');
}

function bloodPressureStatus(value: number | null) {
  if (value === null) return 'Sin registro';
  if (value < 120) return 'Normal';
  if (value < 130) return 'Borderline';
  return 'Elevada';
}

function heartRateStatus(value: number | null) {
  if (value === null) return 'Sin registro';
  if (value < 60) return 'Baja';
  if (value <= 100) return 'Normal';
  return 'Alta';
}

export default function ClinicalHistoryModal({
  isOpen,
  patientName,
  patient,
  vitalsHistory = [],
  onClose,
  onAddHistory,
}: ClinicalHistoryModalProps) {
  const latestVitals = vitalsHistory[0] ?? patient?.latestVitals ?? null;

  const metrics = useMemo(
    () => [
      {
        label: 'Última PA',
        value: latestVitals
          ? `${latestVitals.blood_pressure_systolic ?? '--'}/${latestVitals.blood_pressure_diastolic ?? '--'} mmHg`
          : 'Sin registro',
        status: bloodPressureStatus(latestVitals?.blood_pressure_systolic ?? null),
        icon: HeartPulse,
      },
      {
        label: 'Frecuencia Cardíaca',
        value: latestVitals?.heart_rate_bpm != null ? `${latestVitals.heart_rate_bpm} bpm` : 'Sin registro',
        status: heartRateStatus(latestVitals?.heart_rate_bpm ?? null),
        icon: Activity,
      },
      {
        label: 'Último Control',
        value: formatDate(latestVitals?.measured_at),
        status: latestVitals ? 'Registrado' : 'Sin registro',
        icon: CalendarClock,
      },
    ],
    [latestVitals],
  );

  const timeline = useMemo(() => {
    const events: { category: string; date: string; title: string; description: string }[] = [];

    if (patient?.medicalHistoryNotes?.trim()) {
      events.push({
        category: 'HISTORIA CLÍNICA',
        date: formatLongDate(patient.updatedAt),
        title: 'Notas de historia clínica',
        description: patient.medicalHistoryNotes,
      });
    }

    vitalsHistory.forEach((vitals, index) => {
      events.push({
        category: index === 0 ? 'ÚLTIMA MEDICIÓN' : 'SEGUIMIENTO DE SIGNOS VITALES',
        date: formatLongDate(vitals.measured_at),
        title: `Registro de signos vitales #${vitalsHistory.length - index}`,
        description: `Presión arterial: ${vitals.blood_pressure_systolic ?? '--'}/${vitals.blood_pressure_diastolic ?? '--'} mmHg. Frecuencia cardíaca: ${vitals.heart_rate_bpm ?? '--'} bpm. Peso: ${vitals.weight_kg ?? '--'} kg.`,
      });
    });

    if (!events.length) {
      events.push({
        category: 'SIN REGISTROS',
        date: 'Sin registro',
        title: 'Sin historial clínico',
        description: 'Este paciente aún no tiene registros clínicos ni signos vitales registrados.',
      });
    }

    return events;
  }, [patient, vitalsHistory]);

  if (!isOpen) return null;

  return (
    <div className="clinical-history-overlay" onClick={onClose} role="presentation">
      <div className="clinical-history-modal" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true">
        <header className="clinical-history-header">
          <div>
            <h2>{patientName}</h2>
            <p>Historial Clínico Histórico</p>
          </div>

          <button type="button" className="close-button" aria-label="Cerrar historial clínico" onClick={onClose}>
            <X size={20} />
          </button>
        </header>

        <div className="clinical-history-body">
          <div className="metrics-grid">
            {metrics.map(({ label, value, status, icon: Icon }) => (
              <div className="metric-card" key={label}>
                <div className="metric-icon-wrap">
                  <Icon size={18} />
                </div>
                <div className="metric-copy">
                  <span className="metric-label">{label}</span>
                  <strong>{value}</strong>
                  <small>{status}</small>
                </div>
              </div>
            ))}
          </div>

          <div className="timeline-section">
            <div className="timeline-header">
              <div className="timeline-title-wrap">
                <HeartPulse size={18} />
                <h3>Evolución médica</h3>
              </div>
            </div>

            <div className="timeline-list">
              {timeline.map((event) => (
                <article key={`${event.category}-${event.date}-${event.title}`} className="timeline-item">
                  <div className="timeline-marker" aria-hidden="true" />
                  <div className="timeline-content">
                    <div className="timeline-row">
                      <span className="event-category">{event.category}</span>
                      <span className="event-date">{event.date}</span>
                    </div>
                    <h4>{event.title}</h4>
                    <p>{event.description}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>

        <footer className="clinical-history-footer">
          <button type="button" className="primary-history-button" onClick={onAddHistory}>
            <Plus size={18} />
            Agregar historial
          </button>
        </footer>
      </div>
    </div>
  );
}
