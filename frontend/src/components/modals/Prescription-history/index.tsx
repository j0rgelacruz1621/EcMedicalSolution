import './style.scss';
import { useMemo } from 'react';
import { CalendarDays, Eye, Filter, Plus, Pill, X } from 'lucide-react';
import type { Patient } from '../../../services/patients/patient-services';

interface PrescriptionHistoryModalProps {
  isOpen: boolean;
  patientName: string;
  patient?: Patient | null;
  onClose: () => void;
  onAddPrescription: () => void;
}

export default function PrescriptionHistoryModal({ isOpen, patientName, patient, onClose, onAddPrescription }: PrescriptionHistoryModalProps) {
  const medications = useMemo(() => {
    const notes = patient?.medicalHistoryNotes?.trim();
    if (!notes) return [];
    return [
      {
        name: 'Historia clínica registrada',
        dose: patient?.updatedAt
          ? `Actualizada ${new Intl.DateTimeFormat('es-ES', { dateStyle: 'medium' }).format(new Date(patient.updatedAt))}`
          : '',
        posology: notes,
        started: '',
      },
    ];
  }, [patient]);

  const previousPrescriptions = useMemo(() => {
    const notes = patient?.medicalHistoryNotes?.trim();
    if (!notes) return [];
    return [
      {
        date: patient?.createdAt
          ? new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
              .format(new Date(patient.createdAt))
              .replace('.', '')
              .toUpperCase()
          : 'SIN FECHA',
        medications: 'Registro de historia clínica',
        description: notes,
      },
    ];
  }, [patient]);

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
          <section className="medications-section">
            <h3>MEDICAMENTOS ACTUALES</h3>
            <div className="current-medications-grid">
              {medications.length === 0 && <p className="empty-message">Sin medicamentos registrados.</p>}
              {medications.map((medication) => (
                <div key={medication.name} className="medication-card">
                  <div className="medication-icon">
                    <Pill size={16} />
                  </div>
                  <div className="medication-copy">
                    <strong>{medication.name} {medication.dose}</strong>
                    <span>{medication.posology}</span>
                    {medication.started && (
                      <small>
                        <CalendarDays size={13} />
                        {medication.started}
                      </small>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="previous-prescriptions-section">
            <div className="section-header-row">
              <h3>RÉCIPES ANTERIORES</h3>
              <button type="button" className="filter-button">
                <Filter size={16} />
                Filtrar por año
              </button>
            </div>

            <div className="prescription-list">
              {previousPrescriptions.length === 0 && <p className="empty-message">Sin recetas anteriores registradas.</p>}
              {previousPrescriptions.map((item) => (
                <article key={item.date} className="prescription-item">
                  <div className="date-block">
                    <span className="day">{item.date.split(' ')[0]}</span>
                    <span className="month-year">{item.date.split(' ').slice(1).join(' ')}</span>
                  </div>

                  <div className="prescription-detail">
                    <h4>{item.medications}</h4>
                    <p>{item.description}</p>
                  </div>

                  <button type="button" className="detail-button">
                    <Eye size={15} />
                    Ver Detalle
                  </button>
                </article>
              ))}
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
