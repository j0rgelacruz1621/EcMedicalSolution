import './style.scss';
import { useEffect, useMemo, useState } from 'react';
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
import {
  createRecipe,
  formatIssueDate,
  todayLocalIsoDate,
  updateRecipe,
  type Recipe,
} from '../../../services/recipes/recipe-services';

const MAX_NOTES_LENGTH = 500;

interface PrescriptionFormModalProps {
  isOpen: boolean;
  patientId: number | null;
  patientName: string;
  doctorId?: number;
  // Si se recibe, el modal edita ese récipe (se guarda como nueva versión).
  recipe?: Recipe | null;
  onClose: () => void;
  onSaved: (recipe: Recipe) => void;
}

interface PrescriptionRow {
  name: string;
  presentation: string;
  dose: string;
  frequency: string;
  duration: string;
}

const emptyRow = (): PrescriptionRow => ({ name: '', presentation: '', dose: '', frequency: '', duration: '' });

function rowsFromRecipe(recipe?: Recipe | null): PrescriptionRow[] {
  if (!recipe?.medications.length) return [emptyRow()];
  return recipe.medications.map((medication) => ({
    name: medication.drug_name,
    presentation: medication.presentation ?? '',
    dose: medication.dose ?? '',
    frequency: medication.frequency ?? '',
    duration: medication.duration ?? '',
  }));
}

const isBlankRow = (row: PrescriptionRow) => Object.values(row).every((value) => !value.trim());

const frequencyOptions = ['Cada 4 h', 'Cada 6 h', 'Cada 8 h', 'Cada 12 h', 'Cada 24 h', 'Antes de dormir', 'En caso de dolor'];

const quickRecommendations = [
  { label: 'Dieta baja en sodio', icon: Soup },
  { label: 'Reposo absoluto', icon: Pill },
  { label: 'Hidratación abundante', icon: Droplets },
];

export default function PrescriptionFormModal({
  isOpen,
  patientId,
  patientName,
  doctorId,
  recipe,
  onClose,
  onSaved,
}: PrescriptionFormModalProps) {
  const [rows, setRows] = useState<PrescriptionRow[]>(() => rowsFromRecipe(recipe));
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const isEditing = Boolean(recipe);
  const issueDate = recipe?.issue_date ?? todayLocalIsoDate();
  const dateLabel = useMemo(() => formatIssueDate(issueDate), [issueDate]);

  // Cada apertura parte de un estado limpio (o del récipe a editar).
  useEffect(() => {
    if (!isOpen) return;
    setRows(rowsFromRecipe(recipe));
    setNotes(recipe?.additional_instructions ?? '');
    setError('');
    setSaving(false);
  }, [isOpen, recipe]);

  if (!isOpen) return null;

  const addRow = () => {
    setRows((current) => [...current, emptyRow()]);
  };

  const removeRow = (index: number) => {
    setRows((current) => (current.length === 1 ? current : current.filter((_, rowIndex) => rowIndex !== index)));
  };

  const updateRow = (index: number, field: keyof PrescriptionRow, value: string) => {
    setRows((current) => current.map((row, rowIndex) => (rowIndex === index ? { ...row, [field]: value } : row)));
  };

  const appendQuickNote = (text: string) => {
    setNotes((current) => {
      const trimmed = current.trim();
      const next = trimmed ? `${trimmed}\n${text}` : text;
      return next.length > MAX_NOTES_LENGTH ? current : next;
    });
  };

  const handleSubmit = async () => {
    const filledRows = rows.filter((row) => !isBlankRow(row));

    if (filledRows.length === 0) {
      setError('Agregue al menos un medicamento.');
      return;
    }

    if (filledRows.some((row) => !row.name.trim())) {
      setError('Cada medicamento debe tener el nombre del fármaco.');
      return;
    }

    if (!patientId) {
      setError('No se pudo identificar al paciente.');
      return;
    }

    const medications = filledRows.map((row) => ({
      drug_name: row.name.trim(),
      presentation: row.presentation.trim() || undefined,
      dose: row.dose.trim() || undefined,
      frequency: row.frequency.trim() || undefined,
      duration: row.duration.trim() || undefined,
    }));
    const additionalInstructions = notes.trim() || undefined;

    setSaving(true);
    setError('');

    try {
      const saved = recipe
        ? await updateRecipe(recipe.recipe_id, { medications, additional_instructions: additionalInstructions })
        : await createRecipe({
            patient_id: patientId,
            doctor_id: doctorId,
            issue_date: issueDate,
            medications,
            additional_instructions: additionalInstructions,
          });
      onSaved(saved);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'No se pudo guardar el récipe.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="prescription-form-overlay" onClick={onClose} role="presentation">
      <div className="prescription-form-modal" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true">
        <header className="prescription-form-header">
          <div className="header-text-block">
            <h2>{isEditing ? 'Editar Récipe' : 'Emitir Récipe'}</h2>
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
                  {rows.length > 1 && (
                    <button
                      type="button"
                      className="remove-drug-button"
                      aria-label={`Eliminar medicamento ${index + 1}`}
                      onClick={() => removeRow(index)}
                    >
                      <X size={14} />
                    </button>
                  )}
                  <div className="input-field">
                    <label htmlFor={`med-name-${index}`}>Nombre del fármaco *</label>
                    <input
                      id={`med-name-${index}`}
                      type="text"
                      value={row.name}
                      onChange={(event) => updateRow(index, 'name', event.target.value)}
                      placeholder="Ej: Enalapril"
                      maxLength={150}
                      required
                    />
                  </div>

                  <div className="input-field narrow">
                    <label htmlFor={`med-presentation-${index}`}>Presentación</label>
                    <input
                      id={`med-presentation-${index}`}
                      type="text"
                      value={row.presentation}
                      onChange={(event) => updateRow(index, 'presentation', event.target.value)}
                      maxLength={100}
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
                      maxLength={100}
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
                      maxLength={100}
                      placeholder="Cada 8 h"
                      list="frequency-options"
                    />
                  </div>

                  <div className="input-field narrow">
                    <label htmlFor={`med-duration-${index}`}>Duración</label>
                    <input
                      id={`med-duration-${index}`}
                      type="text"
                      value={row.duration}
                      onChange={(event) => updateRow(index, 'duration', event.target.value)}
                      maxLength={100}
                      placeholder="7 días"
                    />
                  </div>
                </div>
              ))}
            </div>

            <datalist id="frequency-options">
              {frequencyOptions.map((option) => (
                <option key={option} value={option} />
              ))}
            </datalist>

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
              maxLength={MAX_NOTES_LENGTH}
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
              <span className={notes.length >= MAX_NOTES_LENGTH ? 'char-counter limit' : 'char-counter'} aria-live="polite">
                {notes.length}/{MAX_NOTES_LENGTH} caracteres
              </span>
            </div>
          </section>
        </div>

        <footer className="prescription-form-footer">
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <button type="button" className="secondary-button" onClick={onClose} disabled={saving}>
            Cancelar
          </button>
          <button type="button" className="primary-button" onClick={() => void handleSubmit()} disabled={saving}>
            <Printer size={18} />
            {saving ? 'Guardando...' : isEditing ? 'Guardar cambios' : 'Generar Récipe'}
          </button>
        </footer>
      </div>
    </div>
  );
}
