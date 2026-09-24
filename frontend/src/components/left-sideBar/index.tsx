import './style.scss'
import { useEffect, useState } from 'react'
import { NavLink, useNavigate, useSearchParams } from 'react-router-dom'
import { 
  LayoutDashboard, Calendar, Users, FileText, 
  CheckSquare, Settings, Plus, LogOut, Building2, UserRoundCog 
} from 'lucide-react'
import { getDoctor, type Doctor } from '../../services/doctors/doctor-services'

const navItems = [
  { label: 'Panel de Control', to: '/control-panel', icon: <LayoutDashboard size={18} /> },
  { label: 'Agenda', to: '/agenda', icon: <Calendar size={18} /> },
  { label: 'Pacientes', to: '/patients', icon: <Users size={18} /> },
  { label: 'Informes', to: '/reports', icon: <FileText size={18} /> },
  { label: 'Tareas pendientes', to: '/pending-tasks', icon: <CheckSquare size={18} /> },
  { label: 'Consultorios', to: '/consultorios', icon: <Building2 size={18} /> },
  { label: 'Usuarios', to: '/users', icon: <UserRoundCog size={18} /> },
  { label: 'Configuración', to: '/settings', icon: <Settings size={18} /> },
]

export default function LeftSideBar() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const role = localStorage.getItem('user_rol')
  const doctorId = Number(role === 'DOCTOR' ? localStorage.getItem('doctor_id') : searchParams.get('doctorId') || sessionStorage.getItem('active_doctor_id'))
  const [doctor, setDoctor] = useState<Doctor | null>(null)
  const contextQuery = doctorId ? `?doctorId=${doctorId}` : ''
  const doctorTitle = doctor?.gender === 'MASCULINO' ? 'Dr.' : 'Dra.'
  const sidebarUserName = doctor ? `${doctorTitle} ${doctor.firstName} ${doctor.lastName}` : sessionStorage.getItem('active_doctor_name') || 'Administración'

  useEffect(() => {
    if (doctorId) {
      getDoctor(doctorId)
        .then((doctorResult) => {
          setDoctor(doctorResult)
          sessionStorage.setItem('active_doctor_name', `${doctorResult.firstName} ${doctorResult.lastName}`)
        })
        .catch(() => setDoctor(null))
    }
  }, [doctorId])

  function handleLogout() {
    localStorage.removeItem('token')
    localStorage.removeItem('user_rol')
    localStorage.removeItem('doctor_id')
    sessionStorage.removeItem('active_doctor_id')
    navigate('/', { replace: true })
  }

  return (
    <aside className="lsb">
      <div className="lsb-top">
        <div className="lsb-user">
          <div className="lsb-user-text">
            <strong>{sidebarUserName}</strong>
            <span>{doctor?.specialty || 'Cardiología Clínica'}</span>
          </div>
        </div>

        <nav className="lsb-nav">
          {navItems.map(({ label, to, icon }) => (
            <NavLink 
            key={label} 
            to={`${to}${contextQuery}`} 
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
        <button className="lsb-new" type="button" onClick={() => navigate(`/date${contextQuery}`)}><Plus size={18} /> Nueva cita</button>
        <button className="lsb-logout" type="button" onClick={handleLogout}><LogOut size={18} /> Cerrar sesión</button>
      </div>
    </aside>
  )
}