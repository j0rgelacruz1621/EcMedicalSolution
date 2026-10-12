import './style.scss';
import { useEffect, useState } from 'react';
import { ClipboardList, Mail, MapPin, Phone, Printer, X } from 'lucide-react';
import {
  formatIssueDate,
  getRecipeDocument,
  type RecipeDocument,
} from '../../../services/recipes/recipe-services';

interface PrescriptionPreviewModalProps {
  isOpen: boolean;
  recipeId: number | null;
  patientWeight?: string;
  onClose: () => void;
}

export default function PrescriptionPreviewModal({ isOpen, recipeId, patientWeight, onClose }: PrescriptionPreviewModalProps) {
  const [recipeDocument, setRecipeDocument] = useState<RecipeDocument | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen || !recipeId) return;
    let active = true;

    setLoading(true);
    setError('');
    setRecipeDocument(null);

    getRecipeDocument(recipeId)
      .then((result) => {
        if (active) setRecipeDocument(result);
      })
      .catch(() => {
        if (active) setError('No se pudo cargar el documento del récipe.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [isOpen, recipeId]);

  if (!isOpen) return null;

  // Al imprimir solo sale el récipe (ver @media print en style.scss).
  const handlePrint = () => {
    document.body.classList.add('printing-recipe');
    window.print();
    document.body.classList.remove('printing-recipe');
  };

  const recipe = recipeDocument?.recipe;

  return (
    <div className="prescription-preview-overlay" onClick={onClose} role="presentation">
      <div className="prescription-preview-modal" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true">
        <header className="prescription-preview-header">
          <div>
            <p className="preview-eyebrow">Emisión de Récipe</p>
            <h2>Emisión de Récipe</h2>
            <span className="preview-subtitle">Vista previa del documento imprimible</span>
          </div>

          <div className="header-actions">
            <button type="button" className="print-button" onClick={handlePrint} disabled={!recipeDocument}>
              <Printer size={18} />
              Imprimir Receta
            </button>
            <button type="button" className="close-button" aria-label="Cerrar vista previa" onClick={onClose}>
              <X size={20} />
            </button>
          </div>
        </header>

        {loading && <p className="preview-status">Cargando documento...</p>}
        {error && <p className="preview-status error">{error}</p>}

        {recipeDocument && recipe && (
          <div className="prescription-document printable-recipe">
            {recipeDocument.header.image_url ? (
              <img className="recipe-letterhead" src={recipeDocument.header.image_url} alt="Membrete del consultorio" />
            ) : (
              <div className="doctor-membrete">
                <span className="brand-ornament" aria-hidden="true">&lt;&lt;&lt;</span>
                <div className="brand-copy">
                  <strong>{recipeDocument.header.doctor_name}</strong>
                  <span>{recipeDocument.header.specialty || 'ESPECIALISTA'}</span>
                  {recipeDocument.header.medical_center_name && <small>{recipeDocument.header.medical_center_name}</small>}
                </div>
                <span className="brand-ornament" aria-hidden="true">&gt;&gt;&gt;</span>
              </div>
            )}

            <section className="patient-data-panel">
              <div className="info-field">
                <span>PACIENTE</span>
                <strong>{recipe.patient.full_name}</strong>
              </div>
              <div className="info-field">
                <span>FECHA</span>
                <strong>{formatIssueDate(recipe.issue_date)}</strong>
              </div>
              <div className="info-field">
                <span>EDAD</span>
                <strong>{recipe.patient.age != null ? `${recipe.patient.age} años` : 'Sin registro'}</strong>
              </div>
              <div className="info-field">
                <span>PESO</span>
                <strong>{patientWeight || 'Sin registro'}</strong>
              </div>
              <div className="info-field">
                <span>ID / CI</span>
                <strong>{recipe.patient.national_id}</strong>
              </div>
            </section>

            <section className="prescription-body">
              <div className="rp-title">Rp.</div>

              <table className="recipe-medications-table">
                <thead>
                  <tr>
                    <th>Fármaco</th>
                    <th>Presentación</th>
                    <th>Dosis</th>
                    <th>Frecuencia</th>
                    <th>Duración</th>
                  </tr>
                </thead>
                <tbody>
                  {recipe.medications.map((medication, index) => (
                    <tr key={`${medication.drug_name}-${index}`}>
                      <td>
                        <strong>{medication.drug_name}</strong>
                      </td>
                      <td>{medication.presentation || '—'}</td>
                      <td>{medication.dose || '—'}</td>
                      <td>{medication.frequency || '—'}</td>
                      <td>{medication.duration || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>

            {recipe.additional_instructions && (
              <section className="notes-panel">
                <div className="notes-header">
                  <ClipboardList size={16} />
                  <span>INDICACIONES ADICIONALES</span>
                </div>
                <p className="multiline">{recipe.additional_instructions}</p>
              </section>
            )}

            <div className="document-footer">
              <div className="signature-block">
                <span className="signature-line" />
                <small>FIRMA Y SELLO</small>
                <small>{recipeDocument.header.doctor_name}</small>
              </div>

              <div className="specialist-contact">
                <div className="contact-item">
                  <span>
                    Reg. médico {recipeDocument.footer.license_number}
                    {recipeDocument.footer.cm_number ? ` · C.M. ${recipeDocument.footer.cm_number}` : ''}
                  </span>
                </div>
                {recipeDocument.footer.address && (
                  <div className="contact-item">
                    <MapPin size={14} />
                    <span>{recipeDocument.footer.address}</span>
                  </div>
                )}
                {recipeDocument.footer.phones.length > 0 && (
                  <div className="contact-item">
                    <Phone size={14} />
                    <span>{recipeDocument.footer.phones.join(' / ')}</span>
                  </div>
                )}
                <div className="contact-item">
                  <Mail size={14} />
                  <span>{recipeDocument.footer.email}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
