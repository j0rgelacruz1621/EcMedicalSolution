import CheckCircleOutlineOutlinedIcon from '@mui/icons-material/CheckCircleOutlineOutlined';
import './style.scss';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onViewFile: () => void;
  patientName: string;
}

export default function ConfirmNewPatientModal({ isOpen, onClose, onViewFile, patientName }: Props) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="confirm-modal-container">
        <div className="success-icon-wrapper">
          <div className="icon-circle-bg">
            <CheckCircleOutlineOutlinedIcon style={{ fontSize: 56 }} />
          </div>
        </div>

        <div className="confirm-content">
          <h1>¡Paciente agregado con éxito!</h1>
          <p>
            Los datos de <strong>{patientName}</strong> han sido guardados correctamente.
          </p>
        </div>

        <footer className="confirm-actions">
          <button className="btn-secondary" onClick={onClose}>
            Cerrar
          </button>
          <button className="btn-primary" onClick={onViewFile}>
            Ver ficha del paciente
          </button>
        </footer>
      </div>
    </div>
  );
}