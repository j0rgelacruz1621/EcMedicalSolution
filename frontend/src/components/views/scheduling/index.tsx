import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import LeftSideBar from '../../left-sideBar'
import './style.scss'
import { getAppointments, type Appointment } from '../../../services/appointments/appointment-services'
import { getDoctor, type Doctor } from '../../../services/doctors/doctor-services'
import {
  Bell,
  CircleHelp,
  Search,
  ChevronLeft,
  ChevronRight,
  Plus,
} from 'lucide-react'

export default function AgendaView() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const role = localStorage.getItem('user_rol');
  const doctorId = role === 'DOCTOR' ? Number(localStorage.getItem('doctor_id')) : Number(searchParams.get('doctorId') || sessionStorage.getItem('active_doctor_id')) || undefined;
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [viewMode, setViewMode] = useState('Semana');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
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
      return { label: date.toLocaleDateString('es-ES', { weekday: 'short' }).replace('.', '').toUpperCase(), date: date.getDate() }
    })
  }, [currentDate]);
  const monthLabel = currentDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }).toUpperCase()
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate()

  useEffect(() => {
    if (doctorId) getDoctor(doctorId).then(setDoctor).catch(() => setDoctor(null));
    getAppointments({ limit: 100, doctorId })
      .then((result) => setAppointments(result.data))
      .catch(() => setError('No se pudieron cargar las citas.'))
      .finally(() => setLoading(false));
  }, [doctorId]);

  return (
    <div className="agenda-root">
      <LeftSideBar />
      
      <div className="agenda-main">
        {/* HEADER SUPERIOR */}
        <header className="agenda-top-header">
          <div className="search-bar">
            <Search size={18} className="search-icon" />
            <input type="text" placeholder="Buscar pacientes o citas..." />
          </div>
          
          <div className="header-right">
            <button className="icon-btn"><Bell size={20} /></button>
            <button className="icon-btn"><CircleHelp size={20} /></button>
            <div className="user-profile">
              <div className="avatar" aria-label="Perfil">JD</div>
              <span>{doctor ? `${doctor.firstName} ${doctor.lastName}` : 'Administración'}</span>
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
                  <div key={day.label} className={`grid-col-header ${day.date === 12 ? 'active' : ''}`}>
                    <span className="day-label">{day.label}</span>
                    <span className="day-number">{day.date}</span>
                  </div>
                ))}
              </div>

              <div className="grid-body">
                {weekDays.map(day => (
                  <div key={day.label} className="grid-column">
                    {appointments
                      .filter(app => new Date(app.appointmentDate ?? '').getDate() === day.date)
                      .map(app => (
                        <div key={app.id} className="appointment-card" style={{ borderLeftColor: 'var(--primary-color)' }}>
                          <span className="app-time" style={{ color: 'var(--primary-color)' }}>{app.startTime ?? '--:--'}</span>
                          <span className="app-patient">{app.patient?.firstName} {app.patient?.lastName}</span>
                          <span className="app-type">{app.status ?? 'SCHEDULED'}</span>
                        </div>
                      ))}
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