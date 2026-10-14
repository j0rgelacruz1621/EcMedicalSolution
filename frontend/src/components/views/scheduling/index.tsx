import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import LeftSideBar from '../../left-sideBar'
import DashboardHeader from '../../dashboard-header'
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
  const todayKey = toDayKey(new Date().toISOString());
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

  /** Filas de semanas del mes actual (para la vista "Mes"). */
  const monthWeeks = useMemo(() => {
    const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const offset = (firstDay.getDay() || 7) - 1; // lunes = 0
    const cells: Array<{ key: string; date: number; inMonth: boolean; label: string; weekday: string }> = [];
    for (let i = 0; i < offset; i++) cells.push({ key: `blank-${i}`, date: 0, inMonth: false, label: '', weekday: '' });
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), d);
      cells.push({
        key: `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
        date: d,
        inMonth: true,
        label: d.toString(),
        weekday: date.toLocaleDateString('es-ES', { weekday: 'short' }).replace('.', '').toUpperCase(),
      });
    }
    const weeks: typeof cells[] = [];
    for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
    return weeks;
  }, [currentDate, daysInMonth]);

  /** Desplazamiento de la navegación < Hoy > según la vista activa. */
  const navStep = viewMode === 'Día' ? 1 : viewMode === 'Mes' ? 30 : 7;

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
        <DashboardHeader title="Agenda">
          <button className="dashboard-header__icon" aria-label="Notificaciones"><Bell size={22} /></button>
          <button className="dashboard-header__icon" aria-label="Ayuda"><CircleHelp size={22} /></button>
          <div className="dashboard-header__user">
            <div className="dashboard-header__user-text"><span>{activeDoctorName}</span></div>
            <span className="dashboard-header__avatar">{activeDoctorInitials}</span>
          </div>
        </DashboardHeader>

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
                <button onClick={() => setCurrentDate(date => new Date(date.getFullYear(), date.getMonth(), date.getDate() - navStep))}><ChevronLeft size={20} /></button>
                <button className="today-btn" onClick={() => setCurrentDate(new Date())}>Hoy</button>
                <button onClick={() => setCurrentDate(date => new Date(date.getFullYear(), date.getMonth(), date.getDate() + navStep))}><ChevronRight size={20} /></button>
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

            {/* GRILLA SEGÚN VISTA ACTIVA */}
            {viewMode === 'Mes' ? (
              <main className="month-grid">
                <div className="grid-header">
                  {['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM'].map(d => (
                    <div key={d} className="grid-col-header"><span className="day-label">{d}</span></div>
                  ))}
                </div>
                <div className="month-body">
                  {monthWeeks.map((week, weekIndex) => (
                    <div key={weekIndex} className="month-row">
                      {week.map(cell => (
                        <div
                          key={cell.key}
                          className={`month-cell ${cell.inMonth ? '' : 'blank'} ${cell.key === todayKey ? 'today' : ''}`}
                        >
                          {cell.inMonth && <span className="month-day-num">{cell.date}</span>}
                          {cell.inMonth && appointments
                            .filter(app => toDayKey(app.appointmentDate) === cell.key)
                            .map(app => {
                              const isFirstTime = formatAppointmentType(app).toLowerCase() === 'de primera';
                              const typeColor = isFirstTime ? 'rgb(0 107 95)' : 'var(--primary-color)';
                              return (
                                <div key={app.id} className="appointment-card compact" style={{ borderLeftColor: typeColor }}>
                                  <span className="app-time" style={{ color: typeColor }}>{formatAppointmentTime(app.startTime)}</span>
                                  <span className="app-patient">{formatAppointmentPatientName(app)}</span>
                                </div>
                              );
                            })}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </main>
            ) : (
            <main className="weekly-grid">
              <div className="grid-header">
                {(viewMode === 'Día'
                  ? weekDays.filter(day => day.key === toDayKey(currentDate.toISOString()))
                  : weekDays
                ).map(day => (
                  <div key={day.key} className={`grid-col-header ${day.key === todayKey ? 'active' : ''}`}>
                    <span className="day-label">{day.label}</span>
                    <span className="day-number">{day.date}</span>
                  </div>
                ))}
              </div>

              <div className="grid-body">
                {(viewMode === 'Día'
                  ? weekDays.filter(day => day.key === toDayKey(currentDate.toISOString()))
                  : weekDays
                ).map(day => (
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
            )}
          </div>
        </div>
      </div>
    </div>
  )
}