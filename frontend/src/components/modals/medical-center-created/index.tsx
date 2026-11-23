import {
  Building2,
  Check,
  Clock3,
  Info,
  MapPin,
  Plus,
  X,
} from 'lucide-react';
import './style.scss';

type MedicalCenterCreatedModalProps = {
  name: string;
  address: string;
  schedule: string;
  onClose: () => void;
  onRegisterAnother: () => void;
};

const DAY_NAMES = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
const DAY_ABBREVIATIONS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

function normalize(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es');
}

function formatDayRanges(days: number[]) {
  const sortedDays = [...new Set(days)].sort((first, second) => first - second);
  const ranges: number[][] = [];

  sortedDays.forEach((day) => {
    const lastRange = ranges[ranges.length - 1];
    if (lastRange && lastRange[lastRange.length - 1] === day - 1) {
      lastRange.push(day);
    } else {
      ranges.push([day]);
    }
  });

  return ranges.map((range) => (
    range.length > 1
      ? `${DAY_ABBREVIATIONS[range[0]]} a ${DAY_ABBREVIATIONS[range[range.length - 1]]}`
      : DAY_ABBREVIATIONS[range[0]]
  )).join(', ');
}

function getShiftSummary(schedule: string) {
  const entries = schedule.split(/\n|;/).map((entry) => {
    const match = entry.trim().match(/^([^:]+):\s*(\d{1,2})(?::\d{2})?\s*(AM|PM)\s*-/i);
    if (!match) return null;

    return {
      day: DAY_NAMES.indexOf(normalize(match[1].trim())),
      hour: Number(match[2]) % 12 + (match[3].toUpperCase() === 'PM' ? 12 : 0),
    };
  }).filter((entry): entry is { day: number; hour: number } => entry !== null && entry.day >= 0);

  if (!entries.length) return 'Sin jornada configurada';

  const shifts = new Set(entries.map(({ hour }) => (
    hour < 12 ? 'Mañanas' : hour < 19 ? 'Tardes' : 'Noches'
  )));
  const shiftLabel = [...shifts].join(' y ');
  const dayLabel = formatDayRanges(entries.map(({ day }) => day));
  return `${dayLabel} • ${shiftLabel}`;
}

export default function MedicalCenterCreatedModal({
  name,
  address,
  schedule,
  onClose,
  onRegisterAnother,
}: MedicalCenterCreatedModalProps) {
  const shiftSummary = getShiftSummary(schedule);

  return (
    <div
      className="medical-center-created-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className="medical-center-created-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="medical-center-created-title"
      >
        <button
          type="button"
          className="medical-center-created-close"
          aria-label="Cerrar confirmación"
          onClick={onClose}
        >
          <X size={19} />
        </button>

        <div className="medical-center-created-success-icon" aria-hidden="true">
          <span><Check size={29} strokeWidth={3} /></span>
          <i><Building2 size={15} /></i>
        </div>

        <h2 id="medical-center-created-title">¡Consultorio Registrado!</h2>
        <p className="medical-center-created-description">
          El centro médico y sus horarios de consulta han sido guardados y activados exitosamente en su panel.
        </p>

        <article className="medical-center-created-summary">
          <div className="medical-center-created-summary-main">
            <span className="medical-center-created-building"><Building2 size={19} /></span>
            <div className="medical-center-created-summary-copy">
              <span className="medical-center-created-label">SEDE REGISTRADA</span>
              <h3 title={name}>{name}</h3>
              <p className="medical-center-created-location" title={address}>
                <MapPin size={14} />
                <span>{address || 'Ubicación no registrada'}</span>
              </p>
            </div>
          </div>
          <div className="medical-center-created-shift">
            <Clock3 size={15} />
            <span>Jornada asignada:</span>
            <strong>{shiftSummary}</strong>
          </div>
        </article>

        <div className="medical-center-created-actions">
          <button type="button" className="medical-center-created-primary" onClick={onClose}>
            <Building2 size={16} />
            Ir a Consultorios
          </button>
          <button type="button" className="medical-center-created-secondary" onClick={onRegisterAnother}>
            <Plus size={16} />
            Registrar Otro
          </button>
        </div>

        <p className="medical-center-created-note">
          <Info size={14} />
          Se reflejará de inmediato en la asignación de citas
        </p>
      </section>
    </div>
  );
}
