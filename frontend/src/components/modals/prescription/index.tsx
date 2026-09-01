import './style.scss';
import { useMemo, useState } from 'react';
import {
  CalendarDays,
  Droplets,
  Pill,
  Plus,
  Printer,
  Soup,
  UserRound,
  X,
} from 'lucide-react';

interface PrescriptionFormModalProps {
  isOpen: boolean;
  patientName: string;
  onClose: () => void;
  onGenerate: () => void;
}

interface PrescriptionRow {
  name: string;
  presentation: string;
  dose: string;
  frequency: string;
  duration: string;
}

const initialRows: PrescriptionRow[] = [
  { name: '', presentation: '', dose: '', frequency: '', duration: '' },
];

const quickRecommendations = [
  { label: 'Dieta baja en sodio', icon: Soup },
  { label: 'Reposo absoluto', icon: Pill },
  { label: 'Hidratación abundante', icon: Droplets },
];

export default function PrescriptionFormModal({ isOpen, patientName, onClose, onGenerate }: PrescriptionFormModalProps) {
  const [rows, setRows] = useState<PrescriptionRow[]>(initialRows);
  const [notes, setNotes] = useState('');

  const dateLabel = useMemo(() => '13 de Julio de 2026', []);

  if (!isOpen) return null;

  const addRow = () => {
    setRows((current) => [...current, { name: '', presentation: '', dose: '', frequency: '', duration: '' }]);
  };

  const updateRow = (index: number, field: keyof PrescriptionRow, value: string) => {
    setRows((current) => current.map((row, rowIndex) => (rowIndex === index ? { ...row, [field]: value } : row)));
  };

  const appendQuickNote = (text: string) => {
    setNotes((current) => {
      const trimmed = current.trim();
      if (!trimmed) return text;
      return `${trimmed}\n${text}`;
    });
  };

  return (
    <div className="prescription-form-overlay" onClick={onClose} role="presentation">
      <div className="prescription-form-modal" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true">
        <header className="prescription-form-header">
          <div className="header-text-block">
            <h2>Emitir Récipe</h2>
            <div className="context-badges">
              <span className="context-badge">
                <UserRound size={14} />
                {patientName}
              </span>
              <span className="context-badge">
                <CalendarDays size={14} />
                {dateLabel}
              </span>
            </div>
          </div>

          <button type="button" className="close-button" aria-label="Cerrar formulario de prescripción" onClick={onClose}>
            <X size={20} />
          </button>
        </header>

        <div className="prescription-form-body">
          <section className="prescription-drugs-section">
            <div className="drug-list">
              {rows.map((row, index) => (
                <div key={`drug-row-${index}`} className="drug-row">
                  <div className="input-field">
                    <label htmlFor={`med-name-${index}`}>Nombre del fármaco</label>
                    <input
                      id={`med-name-${index}`}
                      type="text"
                      value={row.name}
                      onChange={(event) => updateRow(index, 'name', event.target.value)}
                      placeholder="Ej: Enalapril"
                    />
                  </div>

                  <div className="input-field narrow">
                    <label htmlFor={`med-presentation-${index}`}>Presentación</label>
                    <input
                      id={`med-presentation-${index}`}
                      type="text"
                      value={row.presentation}
                      onChange={(event) => updateRow(index, 'presentation', event.target.value)}
                      placeholder="mg / ml"
                    />
                  </div>

                  <div className="input-field narrow">
                    <label htmlFor={`med-dose-${index}`}>Dosis</label>
                    <input
                      id={`med-dose-${index}`}
                      type="text"
                      value={row.dose}
                      onChange={(event) => updateRow(index, 'dose', event.target.value)}
                      placeholder="Cant."
                    />
                  </div>

                  <div className="input-field">
                    <label htmlFor={`med-frequency-${index}`}>Frecuencia</label>
                    <input
                      id={`med-frequency-${index}`}
                      type="text"
                      value={row.frequency}
                      onChange={(event) => updateRow(index, 'frequency', event.target.value)}
                      placeholder="Cada 8 h"
                    />
                  </div>

                  <div className="input-field narrow">
                    <label htmlFor={`med-duration-${index}`}>Duración</label>
                    <input
                      id={`med-duration-${index}`}
                      type="text"
                      value={row.duration}
                      onChange={(event) => updateRow(index, 'duration', event.target.value)}
                      placeholder="7 días"
                    />
                  </div>
                </div>
              ))}
            </div>

            <button type="button" className="add-drug-button" onClick={addRow}>
              <Plus size={16} />
              Añadir otro medicamento
            </button>
          </section>

          <section className="prescription-notes-section">
            <label className="notes-label" htmlFor="additional-indications">
              Indicaciones adicionales
            </label>
            <textarea
              id="additional-indications"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              maxLength={500}
              rows={6}
              placeholder="Escriba recomendaciones de dieta, reposo u otras observaciones clínicas..."
            />
            <div className="notes-footer">
              <div className="fast-actions">
                {quickRecommendations.map(({ label, icon: Icon }) => (
                  <button key={label} type="button" className="quick-chip" onClick={() => appendQuickNote(label)}>
                    <Icon size={14} />
                    {label}
                  </button>
                ))}
              </div>
              <span className="char-counter">Máx. 500 caracteres</span>
            </div>
          </section>
        </div>

        <footer className="prescription-form-footer">
          <button type="button" className="secondary-button" onClick={onClose}>
            Cancelar
          </button>
          <button type="button" className="primary-button" onClick={() => {
            onClose();
            onGenerate();
          }}>
            <Printer size={18} />
            Generar Récipe
          </button>
        </footer>
      </div>
    </div>
  );
}
