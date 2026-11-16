import { CalendarDays, FileText, Plus, ScanLine, UserRound, X } from 'lucide-react';
import type { ChestXrayRecord } from '../new-chest-xray';
import './style.scss';

interface ChestXrayHistoryModalProps {
  isOpen: boolean;
  patientName: string;
  records: ChestXrayRecord[];
  onClose: () => void;
  onAdd: () => void;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('es-ES', { dateStyle: 'long' }).format(new Date(value));
}

export default function ChestXrayHistoryModal({
  isOpen,
  patientName,
  records,
  onClose,
  onAdd,
}: ChestXrayHistoryModalProps) {
  if (!isOpen) return null;

  return (
    <div className="chest-xray-history-overlay" onClick={onClose} role="presentation">
      <section
        className="chest-xray-history-modal"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="chest-xray-history-title"
      >
        <header className="chest-xray-history-header">
          <div className="chest-xray-history-heading">
            <span className="chest-xray-history-icon" aria-hidden="true"><ScanLine size={20} /></span>
            <div>
              <h2 id="chest-xray-history-title">Historial de RX Tórax</h2>
              <p><UserRound size={14} />Paciente: <strong>{patientName}</strong></p>
            </div>
          </div>
          <button type="button" className="chest-xray-history-close" aria-label="Cerrar historial de RX Tórax" onClick={onClose}>
            <X size={20} />
          </button>
        </header>

        <div className="chest-xray-history-body">
          {records.length === 0 ? (
            <p className="chest-xray-history-empty">No hay registros de RX Tórax para este paciente.</p>
          ) : (
            <ul className="chest-xray-history-list">
              {records.map((record) => (
                <li className="chest-xray-history-record" key={record.id}>
                  <div className="chest-xray-history-record-heading">
                    <strong>Radiografía de Tórax</strong>
                    <span><CalendarDays size={14} />{formatDate(record.date)}</span>
                  </div>
                  <p>{record.findings || 'Sin hallazgos escritos.'}</p>
                  {record.files.length > 0 && (
                    <ul className="chest-xray-history-files">
                      {record.files.map((file) => (
                        <li key={`${file.name}-${file.size}`}>
                          <FileText size={14} />
                          <span>{file.name}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        <footer className="chest-xray-history-footer">
          <button type="button" onClick={onAdd}><Plus size={17} />Agregar RX Tórax</button>
        </footer>
      </section>
    </div>
  );
}
