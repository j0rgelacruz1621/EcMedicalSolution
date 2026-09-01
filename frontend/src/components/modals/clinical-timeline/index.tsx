import './style.scss';
import {
  Activity,
  Clock3,
  Eye,
  FlaskConical,
  Plus,
  Stethoscope,
  UserRound,
  X,
} from 'lucide-react';

interface ClinicalTimelineModalProps {
  isOpen: boolean;
  patientName: string;
  onClose: () => void;
}

const recentStudy = {
  title: 'Ecocardiograma TT',
  date: 'Realizado el 14 de Octubre, 2026',
  metrics: [
    { label: 'Fracción de Eyección', value: '62%', status: 'Normal', tone: 'success' },
    { label: 'Diámetro VI', value: '52 mm', status: '', tone: 'neutral' },
    { label: 'Válvula Aórtica', value: 'Trivalva', status: '', tone: 'neutral' },
  ],
};

const historyItems = [
  {
    icon: Clock3,
    title: 'Holter de Ritmo - 24h',
    date: '05 de Septiembre, 2026',
    author: 'Dr. Carlos Ruiz',
    summary: 'Ritmo sinusal mantenido. Escasa extrasistolia aislada sin relevancia clínica significativa.',
    badge: null,
  },
  {
    icon: Activity,
    title: 'MAPA - Presión Arterial',
    date: '22 de Agosto, 2026',
    author: 'Centro Cardiovascular',
    summary: 'Promedio: 142/92 mmHg',
    badge: 'Requiere ajuste',
  },
  {
    icon: FlaskConical,
    title: 'Perfil Lipídico Completo',
    date: '10 de Julio, 2026',
    author: 'Laboratorio Central',
    summary: 'LDL: 110 mg/dL • HDL: 45 mg/dL • TRIG: 155 mg/dL',
    badge: null,
  },
];

export default function ClinicalTimelineModal({ isOpen, patientName, onClose }: ClinicalTimelineModalProps) {
  if (!isOpen) return null;

  return (
    <div className="clinical-timeline-overlay" onClick={onClose} role="presentation">
      <div className="clinical-timeline-modal" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true">
        <header className="clinical-timeline-header">
          <div className="header-title-wrap">
            <div className="header-icon-box">
              <Stethoscope size={18} />
            </div>
            <div>
              <h2>Historial de Estudios</h2>
              <p>
                <UserRound size={14} />
                Paciente: {patientName}
              </p>
            </div>
          </div>

          <button type="button" className="close-button" aria-label="Cerrar historial de estudios" onClick={onClose}>
            <X size={20} />
          </button>
        </header>

        <div className="clinical-timeline-body">
          <section className="recent-study-section">
            <h3>ESTUDIOS RECIENTES</h3>

            <article className="recent-study-card">
              <div className="study-main-row">
                <div className="study-identity">
                  <div className="study-icon-box">
                    <Activity size={20} />
                  </div>
                  <div>
                    <h4>{recentStudy.title}</h4>
                    <span>{recentStudy.date}</span>
                  </div>
                </div>

                <button type="button" className="results-button">
                  <Eye size={16} />
                  Ver Resultados
                </button>
              </div>

              <div className="study-metrics-grid">
                {recentStudy.metrics.map((metric) => (
                  <div key={metric.label} className="metric-chip">
                    <span>{metric.label}</span>
                    <strong>{metric.value}</strong>
                    {metric.status ? <small className={metric.tone}>{metric.status}</small> : null}
                  </div>
                ))}
              </div>
            </article>
          </section>

          <section className="history-section">
            <h3>REGISTRO HISTÓRICO</h3>

            <div className="timeline-list">
              {historyItems.map(({ icon: Icon, title, date, author, summary, badge }) => (
                <article key={title} className="timeline-item">
                  <div className="timeline-node">
                    <Icon size={15} />
                  </div>

                  <div className="timeline-content">
                    <div className="timeline-header-row">
                      <div>
                        <h4>{title}</h4>
                        <span>{date} • {author}</span>
                      </div>

                      <button type="button" className="details-link">
                        Ver detalles &gt;
                      </button>
                    </div>

                    <div className="timeline-summary-row">
                      <p>{summary}</p>
                      {badge ? <span className="alert-badge">{badge}</span> : null}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>

        <footer className="clinical-timeline-footer">
          <button type="button" className="primary-add-button">
            <Plus size={18} />
            Agregar estudios
          </button>
        </footer>
      </div>
    </div>
  );
}
