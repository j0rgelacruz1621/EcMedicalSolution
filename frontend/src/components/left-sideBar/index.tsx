import './style.scss'
import { Link } from 'react-router-dom'

const navItems = [
  { label: 'Panel de control', to: '/control-panel', icon: '▣', active: true },
  { label: 'Agenda', to: '#', icon: '🗓', active: false },
  { label: 'Pacientes', to: '#', icon: '👥', active: false },
  { label: 'Informes', to: '#', icon: '📄', active: false },
  { label: 'Tareas Pendientes', to: '#', icon: '✅', active: false },
  { label: 'Consultorios', to: '#', icon: '🏥', active: false },
  { label: 'Usuarios', to: '#', icon: '👤', active: false },
  { label: 'Configuración', to: '#', icon: '⚙️', active: false },
]

export default function LeftSideBar() {
  return (
    <aside className="lsb">
      <div className="lsb-top">
        <div className="lsb-user">
          <div className="lsb-avatar">JD</div>
          <div>
            <div className="lsb-name">Dra. Josiana Piña</div>
            <div className="lsb-sub">Cardiología Clínica</div>
          </div>
        </div>

        <nav className="lsb-nav" aria-label="Menú lateral">
          {navItems.map(({ label, to, icon, active }) => (
            <Link key={label} to={to} className={active ? 'active' : ''}>
              <span className="nav-icon" aria-hidden="true">{icon}</span>
              <span>{label}</span>
            </Link>
          ))}
        </nav>
      </div>

      <div className="lsb-actions">
        <button className="lsb-new" type="button">+ Nueva cita</button>
        <button className="lsb-logout" type="button">Cerrar sesión</button>
      </div>
    </aside>
  )
}
