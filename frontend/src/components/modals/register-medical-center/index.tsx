import { useMemo, useState, type FormEvent } from 'react';
import {
  Building,
  Building2,
  ChevronDown,
  Info,
  MapPin,
  Plus,
  Save,
  Tag,
  X,
  Phone,
} from 'lucide-react';
import type { MedicalCenterPayload } from '../../../services/medical-center/medical-center-services';
import './style.scss';

type DaySchedule = {
  name: string;
  enabled: boolean;
  start: string;
  end: string;
};

type RegisterMedicalCenterModalProps = {
  saving: boolean;
  error: string;
  onClose: () => void;
  onSave: (payload: MedicalCenterPayload) => Promise<void>;
};

const INITIAL_DAYS: DaySchedule[] = [
  { name: 'Lunes', enabled: true, start: '08:00 AM', end: '01:00 PM' },
  { name: 'Martes', enabled: true, start: '02:00 PM', end: '06:00 PM' },
  { name: 'Miércoles', enabled: true, start: '08:00 AM', end: '01:00 PM' },
  { name: 'Jueves', enabled: true, start: '08:00 AM', end: '01:00 PM' },
  { name: 'Viernes', enabled: true, start: '08:00 AM', end: '01:00 PM' },
  { name: 'Sábado', enabled: false, start: '08:00 AM', end: '01:00 PM' },
  { name: 'Domingo', enabled: false, start: '08:00 AM', end: '01:00 PM' },
];

const TIME_OPTIONS = Array.from({ length: 33 }, (_, index) => {
  const totalMinutes = 6 * 60 + index * 30;
  const hour24 = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const period = hour24 < 12 ? 'AM' : 'PM';
  const hour12 = hour24 % 12 || 12;
  return `${String(hour12).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${period}`;
});

export default function RegisterMedicalCenterModal({
  saving,
  error,
  onClose,
  onSave,
}: RegisterMedicalCenterModalProps) {
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [officeDetails, setOfficeDetails] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [siteType, setSiteType] = useState('Sede Principal');
  const [days, setDays] = useState(INITIAL_DAYS);

  const activeDays = useMemo(() => days.filter((day) => day.enabled).length, [days]);
  const schedule = useMemo(
    () => days
      .filter((day) => day.enabled)
      .map((day) => `${day.name}: ${day.start} - ${day.end}`)
      .join('\n'),
    [days],
  );

  const updateDay = (index: number, patch: Partial<DaySchedule>) => {
    setDays((current) => current.map((day, dayIndex) => (
      dayIndex === index ? { ...day, ...patch } : day
    )));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const addressParts = [address.trim(), officeDetails.trim(), city.trim()].filter(Boolean);
    await onSave({
      name: name.trim(),
      address: addressParts.join(', '),
      phone: phone.trim() || undefined,
      schedule,
    });
  };

  return (
    <div
      className="register-center-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !saving) onClose();
      }}
    >
      <form
        className="register-center-modal"
        onSubmit={(event) => void handleSubmit(event)}
        role="dialog"
        aria-modal="true"
        aria-labelledby="register-center-title"
      >
        <header className="register-center-header">
          <span className="register-center-header-icon"><Building2 size={21} /></span>
          <div className="register-center-heading">
            <h2 id="register-center-title">Registrar Nuevo Consultorio</h2>
            <p>Ingrese los detalles del centro clínico, ubicación y horarios de atención</p>
          </div>
          <button type="button" className="register-center-close" aria-label="Cerrar modal" onClick={onClose} disabled={saving}>
            <X size={20} />
          </button>
        </header>

        <div className="register-center-content">
          <section className="register-center-basic">
            <label htmlFor="register-center-name">Nombre del Consultorio / Centro Médico <em>*</em></label>
            <div className="register-center-input-wrap">
              <Plus size={17} />
              <input
                id="register-center-name"
                required
                minLength={2}
                maxLength={150}
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Ej. Centro Médico Albarregas, Policlínica Mérida..."
                autoFocus
              />
            </div>
          </section>

          <section className="register-center-section">
            <div className="register-center-section-heading">
              <h3>DATOS DE UBICACIÓN</h3>
              <span>Sede clínica física</span>
            </div>
            <div className="register-center-location-grid">
              <label>
                <span className="register-center-field-label">Ciudad / Municipio <em>*</em></span>
                <span className="register-center-input-wrap">
                  <Building2 size={17} />
                  <input required value={city} onChange={(event) => setCity(event.target.value)} placeholder="Ej. Mérida, Tovar, El Vigía..." />
                </span>
              </label>
              <label>
                <span className="register-center-field-label">Piso / Consultorio / Módulo</span>
                <span className="register-center-input-wrap">
                  <Building size={17} />
                  <input value={officeDetails} onChange={(event) => setOfficeDetails(event.target.value)} placeholder="Ej. Torre B, Piso 3, Consultorio 304" />
                </span>
              </label>
              <label className="register-center-address-field">
                <span className="register-center-field-label">Dirección Detallada <em>*</em></span>
                <span className="register-center-input-wrap">
                  <MapPin size={17} />
                  <input required value={address} onChange={(event) => setAddress(event.target.value)} placeholder="Ej. Av. Las Américas, frente al C.C. Plaza Mayor, Sector El Campito..." />
                </span>
              </label>
            </div>
          </section>

          <section className="register-center-section register-center-schedule-section">
            <div className="register-center-section-heading">
              <h3>HORARIOS Y JORNADA DE CONSULTA</h3>
              <span>Días y horas disponibles</span>
            </div>
            <div className="register-center-days-heading">
              <span>Configuración de días y turnos de atención</span>
              <strong>{activeDays} {activeDays === 1 ? 'día activo' : 'días activos'}</strong>
            </div>
            <div className="register-center-days">
              {days.map((day, index) => (
                <div className={`register-center-day${day.enabled ? ' is-enabled' : ''}`} key={day.name}>
                  <label className="register-center-day-toggle">
                    <input
                      type="checkbox"
                      checked={day.enabled}
                      onChange={(event) => updateDay(index, { enabled: event.target.checked })}
                    />
                    <span>{day.name}</span>
                  </label>
                  {day.enabled ? (
                    <div className="register-center-time-fields">
                      <span className="register-center-time-select">
                        <select aria-label={`Hora de inicio ${day.name}`} value={day.start} onChange={(event) => updateDay(index, { start: event.target.value })}>
                          {TIME_OPTIONS.map((time) => <option key={time}>{time}</option>)}
                        </select>
                        <ChevronDown size={15} aria-hidden="true" />
                      </span>
                      <span className="register-center-time-separator">a</span>
                      <span className="register-center-time-select">
                        <select aria-label={`Hora de fin ${day.name}`} value={day.end} onChange={(event) => updateDay(index, { end: event.target.value })}>
                          {TIME_OPTIONS.map((time) => <option key={time}>{time}</option>)}
                        </select>
                        <ChevronDown size={15} aria-hidden="true" />
                      </span>
                    </div>
                  ) : (
                    <span className="register-center-no-hours">Sin horario asignado (No disponible)</span>
                  )}
                </div>
              ))}
            </div>
            <p className="register-center-info-note">
              <Info size={15} />
              Los horarios configurados definirán la disponibilidad en la agenda de turnos y citas.
            </p>
          </section>

          <section className="register-center-section register-center-contact-section">
            <div className="register-center-section-heading">
              <h3>CONTACTO DE RECEPCIÓN</h3>
              <span>Para coordinación con pacientes</span>
            </div>
            <div className="register-center-contact-grid">
              <label>
                Teléfono de Recepción / Centralita
                <span className="register-center-input-wrap">
                  <Phone size={17} />
                  <input
                    type="tel"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={20}
                    value={phone}
                    onChange={(event) => setPhone(event.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="Ej. 02742631288"
                  />
                </span>
              </label>
              <label>
                Etiqueta de Sede (Identificador)
                <span className="register-center-input-wrap register-center-select-wrap">
                  <Tag size={17} />
                  <select value={siteType} onChange={(event) => setSiteType(event.target.value)}>
                    <option>Sede Principal</option>
                    <option>Sede Centro</option>
                    <option>Sede Norte</option>
                    <option>Sede Sur</option>
                    <option>Sede Tovar</option>
                  </select>
                  <ChevronDown size={15} aria-hidden="true" />
                </span>
              </label>
            </div>
          </section>
          {error && <p className="register-center-error" role="alert">{error}</p>}
        </div>

        <footer className="register-center-footer">
          <button type="button" className="register-center-cancel" onClick={onClose} disabled={saving}>Cancelar</button>
          <button type="submit" className="register-center-save" disabled={saving}>
            <Save size={16} />
            {saving ? 'Guardando...' : 'Guardar Consultorio'}
          </button>
        </footer>
      </form>
    </div>
  );
}
