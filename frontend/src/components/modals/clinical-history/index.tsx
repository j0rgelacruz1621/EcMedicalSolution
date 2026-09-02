import './style.scss';
import { Activity, CalendarClock, HeartPulse, Plus, X } from 'lucide-react';

interface ClinicalHistoryModalProps {
  isOpen: boolean;
  patientName: string;
  onClose: () => void;
  onAddHistory: () => void;
}

const metrics = [
  {
    label: 'Última PA',
    value: '120/80',
    status: 'Normal',
    icon: HeartPulse,
  },
  {
    label: 'Frecuencia Cardíaca',
    value: '72 bpm',
    status: 'Normal',
    icon: Activity,
  },
  {
    label: 'Último Control',
    value: '14 Oct 2023',
    status: 'Registrado',
    icon: CalendarClock,
  },
];

const timelineEvents = [
  {
    category: 'CONSULTA DE SEGUIMIENTO',
    date: '14 de Oct, 2023',
    title: 'Monitoreo de Hipertensión de Rutina',
    description:
      'Se mantuvo el esquema de control de presión arterial con buena adherencia terapéutica. Se recomienda continuar monitoreo domiciliario y re-evaluación en 30 días.',
  },
  {
    category: 'LABORATORIO DIAGNÓSTICO',
    date: '22 de Ago, 2023',
    title: 'Perfil Lipídico y ECG',
    description:
      'El perfil lipídico mostró leve aumento del colesterol LDL y el ECG no evidenció alteraciones eléctricas significativas. Se continuó tratamiento con ajuste dietético.',
  },
  {
    category: 'DIAGNÓSTICO INICIAL',
    date: '10 de May, 2023',
    title: 'Hipertensión Estadio 1',
    description:
      'Se confirmó diagnóstico de hipertensión arterial leve-moderada. Se indicaron cambios en estilo de vida y tratamiento farmacológico inicial con control periódico.',
  },
];

export default function ClinicalHistoryModal({ isOpen, patientName, onClose, onAddHistory }: ClinicalHistoryModalProps) {
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
              {timelineEvents.map((event) => (
                <article key={event.title} className="timeline-item">
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
