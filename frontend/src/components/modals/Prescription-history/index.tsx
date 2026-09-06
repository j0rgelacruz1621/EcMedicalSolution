import './style.scss';
import { CalendarDays, Eye, Filter, Plus, Pill, X } from 'lucide-react';

interface PrescriptionHistoryModalProps {
  isOpen: boolean;
  patientName: string;
  onClose: () => void;
  onAddPrescription: () => void;
}

const currentMedications = [
  {
    name: 'Enalapril',
    dose: '20mg',
    posology: '1 tableta cada 24 horas',
    started: '12 Oct 2023',
  },
  {
    name: 'Aspirina',
    dose: '100mg',
    posology: '1 tableta cada 24 horas',
    started: '08 Sep 2023',
  },
  {
    name: 'Atorvastatina',
    dose: '40mg',
    posology: '1 tableta cada noche',
    started: '02 Aug 2023',
  },
  {
    name: 'Losartán',
    dose: '50mg',
    posology: '1 tableta cada 12 horas',
    started: '14 Jul 2023',
  },
];

const previousPrescriptions = [
  {
    date: '15 SEP 2023',
    medications: 'Enalapril 20mg + Atenolol 50mg',
    description: 'Ajuste de dosis por control de PA.',
  },
  {
    date: '22 JUN 2023',
    medications: 'Aspirina 100mg + Simvastatina 20mg',
    description: 'Tratamiento para prevención secundaria.',
  },
  {
    date: '10 MAR 2023',
    medications: 'Losartán 50mg',
    description: 'Revisión por hipertensión y control de edema.',
  },
];

export default function PrescriptionHistoryModal({ isOpen, patientName, onClose, onAddPrescription }: PrescriptionHistoryModalProps) {
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
              {currentMedications.map((medication) => (
                <div key={medication.name} className="medication-card">
                  <div className="medication-icon">
                    <Pill size={16} />
                  </div>
                  <div className="medication-copy">
                    <strong>{medication.name} {medication.dose}</strong>
                    <span>{medication.posology}</span>
                    <small>
                      <CalendarDays size={13} />
                      Iniciado: {medication.started}
                    </small>
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
