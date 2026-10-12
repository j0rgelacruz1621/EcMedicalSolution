import './style.scss';
import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, Eye, Filter, Pencil, Plus, Pill, Stethoscope, X } from 'lucide-react';
import { formatIssueDate, getPatientRecipes, type Recipe } from '../../../services/recipes/recipe-services';

interface PrescriptionHistoryModalProps {
  isOpen: boolean;
  patientId: number | null;
  patientName: string;
  // Cambia cuando se guarda un récipe para volver a consultar el historial.
  refreshKey?: number;
  onClose: () => void;
  onAddPrescription: () => void;
  onViewRecipe: (recipeId: number) => void;
  onEditRecipe: (recipe: Recipe) => void;
}

function describeMedication(medication: Recipe['medications'][number]) {
  return [medication.dose, medication.frequency, medication.duration].filter(Boolean).join(' · ');
}

export default function PrescriptionHistoryModal({
  isOpen,
  patientId,
  patientName,
  refreshKey,
  onClose,
  onAddPrescription,
  onViewRecipe,
  onEditRecipe,
}: PrescriptionHistoryModalProps) {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [year, setYear] = useState('');

  useEffect(() => {
    if (!isOpen || !patientId) return;
    let active = true;

    setLoading(true);
    setError('');

    getPatientRecipes(patientId, { limit: 100 })
      .then((result) => {
        if (active) setRecipes(result.data ?? []);
      })
      .catch(() => {
        if (active) {
          setRecipes([]);
          setError('No se pudo cargar el historial de récipes.');
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [isOpen, patientId, refreshKey]);

  const years = useMemo(
    () => Array.from(new Set(recipes.map((recipe) => recipe.issue_date.slice(0, 4)))),
    [recipes],
  );

  const visibleRecipes = useMemo(
    () => (year ? recipes.filter((recipe) => recipe.issue_date.startsWith(year)) : recipes),
    [recipes, year],
  );

  // Los "medicamentos actuales" son los del récipe vigente más reciente.
  const latestRecipe = recipes.find((recipe) => recipe.status === 'ACTIVE');

  if (!isOpen) return null;

  return (
    <div className="prescription-history-overlay" onClick={onClose} role="presentation">
      <div className="prescription-history-modal" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true">
        <header className="prescription-history-header">
          <div className="header-title-wrap">
            <div className="header-icon">
              <Pill size={20} />
            </div>
            <div>
              <h2>Historial de Récipes</h2>
              <p>Paciente: {patientName}</p>
            </div>
          </div>

          <button type="button" className="close-button" aria-label="Cerrar historial de recetas" onClick={onClose}>
            <X size={20} />
          </button>
        </header>

        <div className="prescription-history-body">
          {loading && <p className="empty-message">Cargando récipes...</p>}
          {error && <p className="empty-message">{error}</p>}

          <section className="medications-section">
            <h3>MEDICAMENTOS ACTUALES</h3>
            <div className="current-medications-grid">
              {!loading && !latestRecipe && <p className="empty-message">Sin medicamentos registrados.</p>}
              {latestRecipe?.medications.map((medication, index) => (
                <div key={`${medication.drug_name}-${index}`} className="medication-card">
                  <div className="medication-icon">
                    <Pill size={16} />
                  </div>
                  <div className="medication-copy">
                    <strong>
                      {medication.drug_name} {medication.presentation ?? ''}
                    </strong>
                    <span>{describeMedication(medication)}</span>
                    <small>
                      <CalendarDays size={13} />
                      Desde {formatIssueDate(latestRecipe.issue_date, { dateStyle: 'medium' })}
                    </small>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="previous-prescriptions-section">
            <div className="section-header-row">
              <h3>RÉCIPES ANTERIORES</h3>
              <label className="filter-button">
                <Filter size={16} />
                <select value={year} onChange={(event) => setYear(event.target.value)} aria-label="Filtrar por año">
                  <option value="">Todos los años</option>
                  {years.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="prescription-list">
              {!loading && visibleRecipes.length === 0 && <p className="empty-message">Sin recetas anteriores registradas.</p>}
              {visibleRecipes.map((recipe) => {
                const [day, ...monthYear] = formatIssueDate(recipe.issue_date, {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })
                  .replace('.', '')
                  .toUpperCase()
                  .split(' ')
                  .filter((part) => part !== 'DE');

                return (
                  <article key={recipe.recipe_id} className="prescription-item">
                    <div className="date-block">
                      <span className="day">{day}</span>
                      <span className="month-year">{monthYear.join(' ')}</span>
                    </div>

                    <div className="prescription-detail">
                      <h4>{recipe.medications.map((medication) => medication.drug_name).join(', ')}</h4>
                      <p>
                        <Stethoscope size={13} /> {recipe.doctor.full_name}
                        {recipe.supersedes_recipe_id ? ' · Editado' : ''}
                      </p>
                      <ul className="recipe-medication-breakdown">
                        {recipe.medications.map((medication, index) => (
                          <li key={`${medication.drug_name}-${index}`}>
                            <strong>
                              {medication.drug_name} {medication.presentation ?? ''}
                            </strong>{' '}
                            {describeMedication(medication)}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="prescription-actions">
                      <button type="button" className="detail-button" onClick={() => onViewRecipe(recipe.recipe_id)}>
                        <Eye size={15} />
                        Ver Detalle
                      </button>
                      {recipe.status === 'ACTIVE' && (
                        <button type="button" className="detail-button" onClick={() => onEditRecipe(recipe)}>
                          <Pencil size={15} />
                          Editar
                        </button>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        </div>

        <footer className="prescription-history-footer">
          <button type="button" className="primary-add-button" onClick={onAddPrescription}>
            <Plus size={18} />
            Agregar récipe
          </button>
        </footer>
      </div>
    </div>
  );
}
