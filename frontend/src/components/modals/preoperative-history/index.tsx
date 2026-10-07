import './style.scss';
import { useEffect } from 'react';
import { ChevronRight, Plus, X } from 'lucide-react';

export interface PreoperativeEvaluation {
  id: number;
  date: string;
  intervention: string;
}

interface PreoperativeHistoryModalProps {
  isOpen: boolean;
  patientName: string;
  patientDoc: string;
  onClose: () => void;
  onAddEvaluation: () => void;
  onViewDetail?: (evaluation: PreoperativeEvaluation) => void;
}

const evaluations: PreoperativeEvaluation[] = [
  { id: 4, date: '2026-10-16', intervention: 'Cirugía urológica y ginecológica mayor' },
  { id: 3, date: '2025-05-12', intervention: 'Cirugía intraperitoneal e intratorácica' },
  { id: 2, date: '2024-11-08', intervention: 'Cirugía ortopédica mayor' },
  { id: 1, date: '2024-02-15', intervention: 'Cirugía vascular mayor' },
];

function formatDate(isoDate: string) {
  const [year, month, day] = isoDate.split('-');
  return `${day}/${month}/${year}`;
}

export default function PreoperativeHistoryModal({
  isOpen,
  patientName,
  patientDoc,
  onClose,
  onAddEvaluation,
  onViewDetail,
}: PreoperativeHistoryModalProps) {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sortedEvaluations = [...evaluations].sort((a, b) => b.date.localeCompare(a.date));
  const total = sortedEvaluations.length;

  return (
    <div className="preoperative-history-overlay" onClick={onClose} role="presentation">
      <div
        className="preoperative-history-modal"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="preoperative-history-title"
      >
        <header className="preoperative-history-header">
          <div className="title-row">
            <h2 id="preoperative-history-title">Historial de Valoraciones Preoperatorias</h2>
            <button
              type="button"
              className="close-button"
              aria-label="Cerrar historial de valoraciones preoperatorias"
              onClick={onClose}
            >
              <X size={24} />
            </button>
          </div>

          <div className="patient-context">
            <svg className="context-icon" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 5.9c1.16 0 2.1.94 2.1 2.1s-.94 2.1-2.1 2.1S9.9 9.16 9.9 8s.94-2.1 2.1-2.1m0 9c2.97 0 6.1 1.46 6.1 2.1v1.1H5.9V17c0-.64 3.13-2.1 6.1-2.1M12 4C9.79 4 8 5.79 8 8s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm0 9c-2.67 0-8 1.34-8 4v3h16v-3c0-2.66-5.33-4-8-4z" />
            </svg>
            <span>
              <strong>Paciente:</strong> {patientName}
            </span>
            <span className="context-divider" aria-hidden="true" />
            <span>
              <strong>Cédula:</strong> {patientDoc}
            </span>
          </div>
        </header>

        <div className="preoperative-history-body">
          <p className="records-count">
            Mostrando {total} {total === 1 ? 'evaluación registrada' : 'evaluaciones registradas'}
          </p>

          {total === 0 ? (
            <p className="empty-state">Este paciente aún no tiene valoraciones preoperatorias.</p>
          ) : (
            <ul className="evaluation-list">
              {sortedEvaluations.map((evaluation) => (
                <li key={evaluation.id} className="evaluation-card">
                  <div className="evaluation-field evaluation-date">
                    <span className="field-label">Fecha</span>
                    <strong>{formatDate(evaluation.date)}</strong>
                  </div>

                  <span className="field-divider" aria-hidden="true" />

                  <div className="evaluation-field evaluation-intervention">
                    <span className="field-label">Intervención</span>
                    <span className="field-value">{evaluation.intervention}</span>
                  </div>

                  <button
                    type="button"
                    className="detail-link"
                    aria-label={`Ver detalle de la valoración del ${formatDate(evaluation.date)}`}
                    onClick={() => onViewDetail?.(evaluation)}
                  >
                    Ver detalle
                    <ChevronRight size={16} strokeWidth={2} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <footer className="preoperative-history-footer">
          <button type="button" className="secondary-button" onClick={onClose}>
            Cancelar
          </button>
          <button type="button" className="primary-button" onClick={onAddEvaluation}>
            <Plus size={17} strokeWidth={2.5} />
            Agregar valoración
          </button>
        </footer>
      </div>
    </div>
  );
}
