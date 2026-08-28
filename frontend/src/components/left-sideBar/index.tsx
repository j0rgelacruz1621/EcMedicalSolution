import './style.scss'
import { NavLink } from 'react-router-dom' // Usamos NavLink para estado activo automático
import { 
  LayoutDashboard, Calendar, Users, FileText, 
  CheckSquare, Settings, Plus, LogOut 
} from 'lucide-react'

const navItems = [
  { label: 'Panel de control', to: '/control-panel', icon: <LayoutDashboard size={18} /> },
  { label: 'Agenda', to: '/agenda', icon: <Calendar size={18} /> },
  { label: 'Pacientes', to: '/patients', icon: <Users size={18} /> },
  { label: 'Informes', to: '/reports', icon: <FileText size={18} /> },
  { label: 'Tareas Pendientes', to: '/pending-tasks', icon: <CheckSquare size={18} /> },
  { label: 'Settings', to: '/settings', icon: <Settings size={18} /> },
]

export default function LeftSideBar() {
  return (
    <aside className="lsb">
      <div className="lsb-top">
        <div className="lsb-user">
          <div className="lsb-avatar">JD</div>
          <div>
            <div className="lsb-name">Dra. Josiana Piña</div>
            <div className="lsb-sub">Cardiólogo Clínico</div>
          </div>
        </div>

        <nav className="lsb-nav">
          {navItems.map(({ label, to, icon }) => (
          <NavLink 
            key={label} 
            to={to} 
            // La propiedad 'end' evita que se marquen varios si las rutas son similares
            end 
            className={({ isActive }) => isActive ? 'active' : ''}
          >
            <span className="nav-icon">{icon}</span>
            <span>{label}</span>
          </NavLink>
          ))}
        </nav>
      </div>

      <div className="lsb-actions">
        <button className="lsb-new" type="button"><Plus size={18} /> Nueva cita</button>
        <button className="lsb-logout" type="button"><LogOut size={18} /> Cerrar sesión</button>
      </div>
    </aside>
  )
}