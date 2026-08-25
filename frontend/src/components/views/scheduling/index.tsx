import { useState } from 'react'
import LeftSideBar from '../../left-sideBar'
import './style.scss'
import { 
  Bell, 
  CircleHelp, 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  Plus,
  Calendar as CalendarIcon
} from 'lucide-react'

// Datos de ejemplo para las citas
const MOCK_APPOINTMENTS = [
  { id: 1, time: '09:00 AM', patient: 'Ricardo Valenzuela', type: 'Control', day: 12, color: 'var(--primary-color)' },
  { id: 2, time: '11:30 AM', patient: 'Marta Díaz', type: 'De primera', day: 12, color: '#21b490' },
  { id: 3, time: '10:00 AM', patient: 'Julio Rivas', type: 'Control', day: 13, color: 'var(--primary-color)' },
  { id: 4, time: '08:30 AM', patient: 'Elena Torres', type: 'Control', day: 14, color: 'var(--primary-color)' },
  { id: 5, time: '04:00 PM', patient: 'Oscar Lozano', type: 'De primera', day: 15, color: '#21b490' },
  { id: 6, time: '12:00 PM', patient: 'Sofia Paredes', type: 'Control', day: 16, color: 'var(--primary-color)' },
];

const weekDays = [
  { label: 'LUN', date: 12 },
  { label: 'MAR', date: 13 },
  { label: 'MIÉ', date: 14 },
  { label: 'JUE', date: 15 },
  { label: 'VIE', date: 16 },
  { label: 'SÁB', date: 17 },
  { label: 'DOM', date: 18 },
];

export default function AgendaView() {
  const [viewMode, setViewMode] = useState('Semana');

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
              <img src="https://via.placeholder.com/32" alt="Perfil" className="avatar" />
              <span>Dra. Josiana Piña</span>
            </div>
          </div>
        </header>

        {/* CONTENIDO PRINCIPAL */}
        <div className="agenda-content">
          
          {/* TÍTULO Y CONTROLES DE VISTA */}
          <section className="agenda-header-actions">
            <div>
              <h1>Agenda</h1>
              <p className="current-date-text">Lunes, 12 de Octubre, 2026</p>
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
                <button><ChevronLeft size={20} /></button>
                <button className="today-btn">Hoy</button>
                <button><ChevronRight size={20} /></button>
              </div>

              <button className="btn-add-appointment">
                <Plus size={18} /> Agendar cita
              </button>
            </div>
          </section>

          <div className="agenda-grid-container">
            {/* PANEL LATERAL IZQUIERDO (Mini cal y filtros) */}
            <aside className="agenda-sidebar-left">
              <div className="mini-calendar-card">
                <div className="mini-cal-header">
                  <span>OCTUBRE 2026</span>
                  <div className="nav">
                    <ChevronLeft size={16} />
                    <ChevronRight size={16} />
                  </div>
                </div>
                <div className="mini-cal-grid">
                  {['L','M','X','J','V','S','D'].map(d => <div key={d} className="day-name">{d}</div>)}
                  {/* Renderizado simplificado de días */}
                  {Array.from({length: 31}, (_, i) => (
                    <div key={i} className={`day-num ${i+1 === 12 ? 'selected' : ''}`}>
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
                    {MOCK_APPOINTMENTS
                      .filter(app => app.day === day.date)
                      .map(app => (
                        <div key={app.id} className="appointment-card" style={{ borderLeftColor: app.color }}>
                          <span className="app-time" style={{ color: app.color }}>{app.time}</span>
                          <span className="app-patient">{app.patient}</span>
                          <span className="app-type">{app.type}</span>
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