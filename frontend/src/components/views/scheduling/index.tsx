import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import LeftSideBar from '../../left-sideBar'
import './style.scss'
import { getAppointments, type Appointment } from '../../../services/appointments/appointment-services'
import { getDoctor, type Doctor } from '../../../services/doctors/doctor-services'
import {
  Bell,
  CircleHelp,
  ChevronLeft,
  ChevronRight,
  Plus,
} from 'lucide-react'

const formatAppointmentTime = (value?: string) => {
  if (!value) return '--:--';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

const formatAppointmentType = (appointment: Appointment) => {
  if (appointment.reasonForVisit) return appointment.reasonForVisit;
  if (appointment.status) return appointment.status;
  return 'SCHEDULED';
};

/** Nombre a mostrar: paciente registrado o datos del guest (cita sin paciente). */
const formatAppointmentPatientName = (appointment: Appointment) => {
  const p = appointment.patient;
  if (p?.firstName || p?.lastName) return `${p.firstName ?? ''} ${p.lastName ?? ''}`.trim();
  const g = appointment as Appointment & { guestFirstName?: string; guestLastName?: string };
  if (g.guestFirstName || g.guestLastName) return `${g.guestFirstName ?? ''} ${g.guestLastName ?? ''}`.trim();
  return 'Pendiente de registro';
};

/** Clave de fecha local YYYY-MM-DD para comparar días sin problemas de zona horaria. */
const toDayKey = (value?: string | null) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

export default function AgendaView() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const role = localStorage.getItem('user_rol');
  const doctorId = role === 'DOCTOR' ? Number(localStorage.getItem('doctor_id')) : Number(searchParams.get('doctorId') || sessionStorage.getItem('active_doctor_id')) || undefined;
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [viewMode, setViewMode] = useState('Semana');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const activeDoctorName = doctor ? `${doctor.firstName} ${doctor.lastName}` : sessionStorage.getItem('active_doctor_name') || 'Administración';
  const activeDoctorInitials = doctor ? `${doctor.firstName[0] || ''}${doctor.lastName[0] || ''}`.toUpperCase() : (sessionStorage.getItem('active_doctor_name') || 'JD').split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]).join('').toUpperCase() || 'JD';
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const weekDays = useMemo(() => {
    const monday = new Date(currentDate)
    const day = monday.getDay() || 7
    monday.setDate(monday.getDate() - day + 1)
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(monday)
      date.setDate(monday.getDate() + index)
      return {
        label: date.toLocaleDateString('es-ES', { weekday: 'short' }).replace('.', '').toUpperCase(),
        date: date.getDate(),
        key: toDayKey(date.toISOString()),
      }
    })
  }, [currentDate]);
  const monthLabel = currentDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }).toUpperCase()
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate()

  useEffect(() => {
    if (doctorId) {
      getDoctor(doctorId)
        .then((doctorResult) => {
          setDoctor(doctorResult);
          sessionStorage.setItem('active_doctor_name', `${doctorResult.firstName} ${doctorResult.lastName}`);
        })
        .catch(() => setDoctor(null));
    }
    getAppointments({ limit: 100, doctorId })
      .then((result) => setAppointments(result.data))
      .catch(() => setError('No se pudieron cargar las citas.'))
      .finally(() => setLoading(false));
  }, [doctorId]);

  return (
    <div className="agenda-root">
      <LeftSideBar />

      <div className="agenda-main">
        <header className="cp-header">
          <h1>Agenda</h1>
          <div className="cp-header-right">
            <button className="icon" aria-label="Notificaciones"><Bell size={18} /></button>
            <button className="icon" aria-label="Ayuda"><CircleHelp size={18} /></button>
            <div className="cp-user">
              <span>{activeDoctorName}</span>
              <span className="cp-user-badge">{activeDoctorInitials}</span>
            </div>
          </div>
        </header>

        {/* CONTENIDO PRINCIPAL */}
        <div className="agenda-content">

          {/* TÍTULO Y CONTROLES DE VISTA */}
          <section className="agenda-header-actions">
            <div>
              <h1>Agenda</h1>
              <p className="current-date-text">{currentDate.toLocaleDateString('es-ES', { dateStyle: 'full' })}</p>
            </div>

            <div className="actions-right">
              <div className="view-selector">
                {['Día', 'Semana', 'Mes'].map(mode => (
                  <button
                    key={mode}
                    className={viewMode === mode ? 'active' : ''}
                    onClick={() => setViewMode(mode)}
                  >
                    {mode}
                  </button>
                ))}
              </div>

              <div className="date-nav">
                <button onClick={() => setCurrentDate(date => new Date(date.getFullYear(), date.getMonth(), date.getDate() - 7))}><ChevronLeft size={20} /></button>
                <button className="today-btn" onClick={() => setCurrentDate(new Date())}>Hoy</button>
                <button onClick={() => setCurrentDate(date => new Date(date.getFullYear(), date.getMonth(), date.getDate() + 7))}><ChevronRight size={20} /></button>
              </div>

              <button className="btn-add-appointment" type="button" onClick={() => navigate(doctorId ? `/date?doctorId=${doctorId}` : '/date')}>
                <Plus size={18} /> Agendar cita
              </button>
            </div>
          </section>

          {error && <div className="alert alert-danger">{error}</div>}
          {loading && <div className="alert alert-info">Cargando citas...</div>}
          <div className="agenda-grid-container">
            {/* PANEL LATERAL IZQUIERDO (Mini cal y filtros) */}
            <aside className="agenda-sidebar-left">
              <div className="mini-calendar-card">
                <div className="mini-cal-header">
                  <span>{monthLabel}</span>
                  <div className="nav">
                    <ChevronLeft size={16} />
                    <ChevronRight size={16} />
                  </div>
                </div>
                <div className="mini-cal-grid">
                  {['L','M','X','J','V','S','D'].map(d => <div key={d} className="day-name">{d}</div>)}
                  {/* Renderizado simplificado de días */}
                  {Array.from({length: daysInMonth}, (_, i) => (
                    <div key={i} className={`day-num ${i + 1 === currentDate.getDate() ? 'selected' : ''}`}>
                      {i + 1}
                    </div>
                  ))}
                </div>
              </div>

              <div className="filters-card">
                <h3>Filtrar por tipo</h3>
                <label className="filter-item">
                  <input type="checkbox" defaultChecked />
                  <span className="checkbox-custom vinotinto"></span>
                  Control
                </label>
                <label className="filter-item">
                  <input type="checkbox" defaultChecked />
                  <span className="checkbox-custom green"></span>
                  De primera
                </label>
              </div>
            </aside>

            {/* GRILLA SEMANAL */}
            <main className="weekly-grid">
              <div className="grid-header">
                {weekDays.map(day => (
                  <div key={day.key} className={`grid-col-header ${day.key === toDayKey(new Date().toISOString()) ? 'active' : ''}`}>
                    <span className="day-label">{day.label}</span>
                    <span className="day-number">{day.date}</span>
                  </div>
                ))}
              </div>

              <div className="grid-body">
                {weekDays.map(day => (
                  <div key={day.key} className="grid-column">
                    {appointments
                      .filter(app => toDayKey(app.appointmentDate) === day.key)
                      .map(app => {
                        const isFirstTime = formatAppointmentType(app).toLowerCase() === 'de primera';
                        const typeColor = isFirstTime ? 'rgb(0 107 95)' : 'var(--primary-color)';
                        return (
                          <div key={app.id} className="appointment-card" style={{ borderLeftColor: typeColor }}>
                            <span className="app-time" style={{ color: typeColor }}>{formatAppointmentTime(app.startTime)}</span>
                            <span className="app-patient">{formatAppointmentPatientName(app)}</span>
                            <span className="app-type">{formatAppointmentType(app)}</span>
                          </div>
                        );
                      })}
                  </div>
                ))}
              </div>
            </main>
          </div>
        </div>
      </div>
    </div>
  )
}