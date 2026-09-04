import './style.scss';
import { CalendarDays, ClipboardList, Printer, Stethoscope, UserRound, X } from 'lucide-react';

interface PrescriptionPreviewModalProps {
  isOpen: boolean;
  patientName: string;
  patientAge: string;
  patientWeight: string;
  patientDoc: string;
  emissionDate: string;
  onClose: () => void;
}

const prescribedItems = [
  {
    name: 'Enalapril',
    concentration: '10mg',
    note: 'Tabletas (VO)',
    posology: '1 tableta cada 12 horas',
    duration: 'Durante 30 días',
  },
  {
    name: 'Aspirina',
    concentration: '100mg',
    note: 'Protectora gástrica recomendada',
    posology: '1 tableta diaria',
    duration: 'Después del almuerzo',
  },
];

const additionalNotes = [
  'Mantener dieta baja en sodio y controlar la ingesta de líquidos.',
  'Evitar esfuerzo físico intenso durante los próximos 7 días.',
  'Revisar presión arterial dos veces al día y mantener hidratación adecuada.',
];

export default function PrescriptionPreviewModal({
  isOpen,
  patientName,
  patientAge,
  patientWeight,
  patientDoc,
  emissionDate,
  onClose,
}: PrescriptionPreviewModalProps) {
  if (!isOpen) return null;

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
            <button type="button" className="print-button" onClick={() => window.print()}>
              <Printer size={18} />
              Imprimir Receta
            </button>
            <button type="button" className="close-button" aria-label="Cerrar vista previa" onClick={onClose}>
              <X size={20} />
            </button>
          </div>
        </header>

        <div className="prescription-document">
          <div className="doctor-membrete">
              <span className="brand-ornament" aria-hidden="true">&lt;&lt;&lt;</span>
              <div className="brand-copy">
                <strong>Dra. Josiana Piña Martínez</strong>
                <span>CARDIÓLOGO CLÍNICO</span>
                <small>MPPS 107.17 • CM 7.778 • RIF V-19643464-6</small>
            </div>
              <span className="brand-ornament" aria-hidden="true">&gt;&gt;&gt;</span>
          </div>

          <section className="patient-data-panel">
            <div className="info-field">
              <span>PACIENTE</span>
              <strong>{patientName}</strong>
            </div>
            <div className="info-field">
              <span>FECHA</span>
              <strong>{emissionDate}</strong>
            </div>
            <div className="info-field">
              <span>EDAD</span>
              <strong>{patientAge}</strong>
            </div>
            <div className="info-field">
              <span>PESO</span>
              <strong>{patientWeight}</strong>
            </div>
            <div className="info-field">
              <span>ID / CI</span>
              <strong>{patientDoc}</strong>
            </div>
          </section>

          <section className="prescription-body">
            <div className="rp-title">Rp.</div>

            <div className="medicine-table">
              <div className="table-header">
                <span>MEDICAMENTO Y CONCENTRACIÓN</span>
                <span>POSOLOGÍA Y DURACIÓN</span>
              </div>

              {prescribedItems.map((item) => (
                <div key={item.name} className="table-row">
                  <div className="medicine-description">
                    <strong>{item.name} {item.concentration}</strong>
                    <small>{item.note}</small>
                  </div>
                  <div className="medicine-posology">
                    <span>{item.posology}</span>
                    <em>{item.duration}</em>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="notes-panel">
            <div className="notes-header">
              <ClipboardList size={16} />
              <span>INDICACIONES ADICIONALES</span>
            </div>
            <p>{additionalNotes.join(' ')}</p>
          </section>

          <div className="document-footer">
            <div className="signature-block">
              <span className="signature-line" />
              <small>FIRMA Y SELLO</small>
            </div>

            <div className="specialist-contact">
              <div className="contact-item">
                <UserRound size={14} />
                <span>@drajosianapina</span>
              </div>
              <div className="contact-item">
                <Stethoscope size={14} />
                <span>+58 412-1234567</span>
              </div>
              <div className="contact-item">
                <CalendarDays size={14} />
                <span>Consultorio: C.C. La California</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
