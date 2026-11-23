import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { CalendarDays, FileText, Plus, ScanLine, Trash2, UploadCloud, UserRound, X } from 'lucide-react';
import './style.scss';

export interface ChestXrayRecord {
  id: number;
  date: string;
  findings: string;
  files: { name: string; size: number }[];
}

interface NewChestXrayModalProps {
  patientName: string;
  onClose: () => void;
  onSave: (record: Omit<ChestXrayRecord, 'id'>) => void;
}

const initialFindings =
  'INDICE CARDIOTORACICO ≤ 0.5. SILUETA CARDIOMEDIASTINICA NORMAL. ANGULOS CARDIOFRÉNICOS Y COSTODIAFRAGMÁTICOS LIBRES';

function formatFileSize(size: number) {
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export default function NewChestXrayModal({ patientName, onClose, onSave }: NewChestXrayModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [findings, setFindings] = useState(initialFindings);
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState('');
  const today = new Date();
  const formattedDate = new Intl.DateTimeFormat('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(today);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleFileSelection = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files ?? []);
    setFiles((current) => [...current, ...selectedFiles]);
    event.target.value = '';
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!findings.trim() && files.length === 0) {
      setError('Ingrese los hallazgos o adjunte al menos un archivo.');
      return;
    }

    onSave({
      date: today.toISOString(),
      findings: findings.trim(),
      files: files.map(({ name, size }) => ({ name, size })),
    });
  };

  return (
    <div className="new-chest-xray-overlay" onClick={onClose} role="presentation">
      <form
        className="new-chest-xray-modal"
        onClick={(event) => event.stopPropagation()}
        onSubmit={handleSubmit}
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-chest-xray-title"
      >
        <header className="new-chest-xray-header">
          <div className="chest-xray-title-wrap">
            <span className="chest-xray-icon" aria-hidden="true"><ScanLine size={21} /></span>
            <div>
              <h2 id="new-chest-xray-title">RX Tórax</h2>
              <div className="chest-xray-context">
                <span><UserRound size={14} />{patientName}</span>
                <span><CalendarDays size={14} />{formattedDate}</span>
              </div>
            </div>
          </div>
          <button type="button" className="chest-xray-close" aria-label="Cerrar RX Tórax" onClick={onClose}>
            <X size={21} />
          </button>
        </header>

        <div className="new-chest-xray-body">
          <section className="chest-xray-findings">
            <label htmlFor="chest-xray-findings">Hallazgos de Radiografía de Tórax</label>
            <textarea
              id="chest-xray-findings"
              rows={3}
              value={findings}
              onChange={(event) => setFindings(event.target.value)}
              placeholder="Describa los hallazgos de la radiografía..."
            />
          </section>

          <section className="chest-xray-files" aria-labelledby="chest-xray-files-title">
            <h3 id="chest-xray-files-title">
              Adjuntar Archivos (Placa / Informe PDF)
              <UploadCloud size={17} aria-hidden="true" />
            </h3>
            <input
              ref={fileInputRef}
              className="chest-xray-file-input"
              type="file"
              accept="image/*,.pdf,application/pdf"
              multiple
              onChange={handleFileSelection}
              aria-label="Seleccionar archivos de radiografía"
            />
            <button type="button" className="chest-xray-select-files" onClick={() => fileInputRef.current?.click()}>
              <Plus size={16} />
              Seleccionar archivos
            </button>

            {files.length > 0 && (
              <ul className="chest-xray-file-list">
                {files.map((file, index) => (
                  <li className="chest-xray-file-card" key={`${file.name}-${file.lastModified}-${index}`}>
                    <FileText size={19} aria-hidden="true" />
                    <span className="chest-xray-file-info">
                      <strong>{file.name}</strong>
                      <small>{formatFileSize(file.size)} • Listo para subir</small>
                    </span>
                    <button
                      type="button"
                      className="chest-xray-remove-file"
                      aria-label={`Eliminar archivo ${file.name}`}
                      onClick={() => setFiles((current) => current.filter((_, fileIndex) => fileIndex !== index))}
                    >
                      <Trash2 size={17} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {error && <p className="chest-xray-error" role="alert">{error}</p>}
          </section>
        </div>

        <footer className="new-chest-xray-footer">
          <button type="button" className="chest-xray-cancel" onClick={onClose}>Cancelar</button>
          <button type="submit" className="chest-xray-save">Guardar</button>
        </footer>
      </form>
    </div>
  );
}
