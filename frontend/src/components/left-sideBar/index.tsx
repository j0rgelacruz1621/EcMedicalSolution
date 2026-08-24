import './style.scss'
import { Link } from 'react-router-dom'
// Importamos los iconos
import { 
  LayoutDashboard, 
  Calendar, 
  Users, 
  FileText, 
  CheckSquare, 
  Hospital, 
  UserCog, 
  Settings, 
  Plus, 
  LogOut 
} from 'lucide-react'

const navItems = [
  { label: 'Panel de control', to: '/control-panel', icon: <LayoutDashboard size={18} />, active: true },
  { label: 'Agenda', to: '#', icon: <Calendar size={18} />, active: false },
  { label: 'Pacientes', to: '#', icon: <Users size={18} />, active: false },
  { label: 'Informes', to: '#', icon: <FileText size={18} />, active: false },
  { label: 'Tareas Pendientes', to: '#', icon: <CheckSquare size={18} />, active: false },
  { label: 'Consultorios', to: '#', icon: <Hospital size={18} />, active: false },
  { label: 'Usuarios', to: '#', icon: <UserCog size={18} />, active: false },
  { label: 'Configuración', to: '#', icon: <Settings size={18} />, active: false },
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
        <button className="lsb-new" type="button">
          <Plus size={18} /> Nueva cita
        </button>
        <button className="lsb-logout" type="button">
          <LogOut size={18} /> Cerrar sesión
        </button>
      </div>
    </aside>
  )
}
