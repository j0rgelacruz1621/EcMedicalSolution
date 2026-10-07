import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import LeftSideBar from '../../left-sideBar'
import DashboardHeader from '../../dashboard-header'
import './style.scss'
import {
  CircleHelp,
  ChevronLeft,
  ChevronRight,
  FileText,
  Plus,
  Link2,
  Check
} from 'lucide-react'
import { getDoctor, type Doctor } from '../../../services/doctors/doctor-services'
import { getAppointments, type Appointment } from '../../../services/appointments/appointment-services'
import { getDoctorTasks, createDoctorTask, updateTaskStatus, type Task } from '../../../services/tasks/task-services'
import GroupOutlinedIcon from '@mui/icons-material/GroupOutlined';
import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined';
import PendingActionsOutlinedIcon from '@mui/icons-material/PendingActionsOutlined';
import NotificationsNoneOutlinedIcon from '@mui/icons-material/NotificationsNoneOutlined';

const weekDays = ['L', 'M', 'M', 'J', 'V', 'S', 'D']

const getCalendarDays = (year: number, month: number) => {
  const firstDayIndex = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  return Array.from({ length: 42 }, (_, index) => {
    const dayNumber = index - firstDayIndex + 1
    if (dayNumber < 1 || dayNumber > daysInMonth) return null

    const date = new Date(year, month, dayNumber)
    date.setHours(0, 0, 0, 0)
    return date
  })
}

const getInitialsFromName = (name?: string | null) => {
  if (!name) return 'JD'

  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return 'JD'

  return `${parts[0][0] || ''}${parts[1]?.[0] || ''}`.toUpperCase()
}

export default function ControlPanel() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const role = localStorage.getItem('user_rol')
  const selectedDoctorFromUrl = searchParams.get('doctorId')
  if (role === 'SA' && selectedDoctorFromUrl) {
    sessionStorage.setItem('active_doctor_id', selectedDoctorFromUrl)
  }
  const doctorId = Number(
    role === 'DOCTOR'
      ? localStorage.getItem('doctor_id')
      : selectedDoctorFromUrl || sessionStorage.getItem('active_doctor_id') || 0,
  )
  const [doctor, setDoctor] = useState<Doctor | null>(null)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [copied, setCopied] = useState(false)
  const bookingLink = doctor ? `${window.location.origin}/specialist/${String(doctor.id)}` : ''

  const handleCopyLink = () => {
    navigator.clipboard?.writeText(bookingLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  const [tasksLoading, setTasksLoading] = useState(false)
  const [showTaskInput, setShowTaskInput] = useState(false)
  const doctorTitle = doctor?.gender === 'MASCULINO' ? 'Dr.' : doctor?.gender === 'FEMENINO' ? 'Dra.' : ''
  const activeDoctorName = doctor
    ? `${doctor.firstName} ${doctor.lastName}`
    : sessionStorage.getItem('active_doctor_name') || 'Administración'
  const doctorInitials = doctor ? `${doctor.firstName[0] || ''}${doctor.lastName[0] || ''}`.toUpperCase() : getInitialsFromName(sessionStorage.getItem('active_doctor_name'))
  const patients = Array.from(
    new Map(
      appointments
        .filter(appointment => appointment.patient)
        .map(appointment => [
          appointment.patient?.id || appointment.patient?.nationalId || `${appointment.patient?.firstName}-${appointment.patient?.lastName}`,
          appointment.patient,
        ]),
    ).values(),
  )
    const today = new Date().toISOString().slice(0, 10)
    const todayAppointments = appointments.filter(appointment => appointment.appointmentDate?.slice(0, 10) === today)
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    const date = new Date()
    date.setHours(0, 0, 0, 0)
    return date
  })

  const [visibleDate, setVisibleDate] = useState<Date>(() => {
    const date = new Date()
    date.setDate(1)
    date.setHours(0, 0, 0, 0)
    return date
  })

  const visibleMonth = visibleDate.getMonth()
  const visibleYear = visibleDate.getFullYear()

  const calendarDays = useMemo(
    () => getCalendarDays(visibleYear, visibleMonth),
    [visibleMonth, visibleYear]
  )

  useEffect(() => {
    if (!doctorId) return

    Promise.all([getDoctor(doctorId), getAppointments({ doctorId, limit: 100 })])
      .then(([doctorResult, appointmentResult]) => {
        setDoctor(doctorResult)
        sessionStorage.setItem('active_doctor_name', `${doctorResult.firstName} ${doctorResult.lastName}`)
        setAppointments(appointmentResult.data)
      })
      .catch(() => {
        setDoctor(null)
      })
  }, [doctorId])

  useEffect(() => {
    if (!doctorId) return
    setTasksLoading(true)
    getDoctorTasks(doctorId, { limit: 6 })
      .then(result => setTasks(result.data))
      .catch(() => setTasks([]))
      .finally(() => setTasksLoading(false))
  }, [doctorId])

  const handleCreateTask = async () => {
    const title = newTaskTitle.trim()
    if (!title || !doctorId) return
    try {
      const created = await createDoctorTask(doctorId, { title })
      setTasks(prev => [created, ...prev].slice(0, 6))
      setNewTaskTitle('')
      setShowTaskInput(false)
    } catch {
      /* noop */
    }
  }

  const handleToggleTask = async (task: Task) => {
    const nextStatus = task.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED'
    setTasks(prev => prev.map(item => item.id === task.id ? { ...item, status: nextStatus } : item))
    try {
      await updateTaskStatus(task.id, nextStatus)
    } catch {
      setTasks(prev => prev.map(item => item.id === task.id ? { ...item, status: task.status } : item))
    }
  }

  const monthLabel = new Intl.DateTimeFormat('es-ES', {
    month: 'long',
    year: 'numeric'
  }).format(visibleDate)

  const formatAppointmentTypeLabel = (appointment: Appointment) => {
    const value = appointment.type || appointment.reasonForVisit || appointment.status || 'Consulta'
    return value.toUpperCase()
  }

  const isControlType = (appointment: Appointment) =>
    (appointment.type || '').toLowerCase() === 'control'

  const getPatientName = (appointment: Appointment) => {
    const p = appointment.patient;
    if (p?.firstName || p?.lastName) return `${p.firstName ?? ''} ${p.lastName ?? ''}`.trim();
    if (appointment.guestFirstName || appointment.guestLastName)
      return `${appointment.guestFirstName ?? ''} ${appointment.guestLastName ?? ''}`.trim();
    return '';
  };
  const getPatientInitials = (appointment: Appointment) => {
    const name = getPatientName(appointment);
    const parts = name.split(' ').filter(Boolean);
    const initials = `${parts[0]?.[0] ?? ''}${parts[1]?.[0] ?? parts[0]?.[1] ?? ''}`.toUpperCase();
    return initials || '—';
  }

  const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

  const chartData = useMemo(() => {
    const now = new Date()
    const months: { key: string; label: string; year: number; month: number; control: number; firstTime: number }[] = []
    for (let i = 3; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      months.push({
        key: `${d.getFullYear()}-${d.getMonth()}`,
        label: monthNames[d.getMonth()],
        year: d.getFullYear(),
        month: d.getMonth(),
        control: 0,
        firstTime: 0,
      })
    }
    const byKey = new Map(months.map(m => [m.key, m]))
    appointments.forEach(appointment => {
      const raw = appointment.appointmentDate
      if (!raw) return
      const date = new Date(raw)
      if (Number.isNaN(date.getTime())) return
      const entry = byKey.get(`${date.getFullYear()}-${date.getMonth()}`)
      if (!entry) return
      const type = (appointment.type || appointment.reasonForVisit || '').toLowerCase()
      if (type === 'control') entry.control += 1
      else if (type === 'de primera' || type === 'first_time') entry.firstTime += 1
    })
    return months
  }, [appointments])

  const chartMax = Math.max(1, ...chartData.map(m => Math.max(m.control, m.firstTime)))
  // La barra más alta ocupa 85% para dejar siempre sitio al número encima
  const barHeight = (value: number) =>
    value === 0 ? 3 : Math.max(3, Math.round((value / chartMax) * 85))

  return (
    <div className="cp-root">
      <LeftSideBar />
      <div className="cp-main">
        <DashboardHeader
          title="Panel de Control"
          centerContent={doctor && (
            <button
              type="button"
              className="cp-referral-pill"
              onClick={handleCopyLink}
              title={bookingLink}
            >
              {copied ? <Check size={14} /> : <Link2 size={14} />}
              <span className="cp-referral-pill-url">{copied ? 'Enlace copiado' : bookingLink.replace(/^https?:\/\//, '')}</span>
            </button>
          )}
        >
          <button className="dashboard-header__icon" aria-label="Notificaciones"><NotificationsNoneOutlinedIcon style={{ fontSize: 24 }} /></button>
          <button className="dashboard-header__icon" aria-label="Ayuda"><CircleHelp size={22} /></button>
          <div className="dashboard-header__user">
            <div className="dashboard-header__user-text">
              <span>{doctor ? `${doctorTitle} ${doctor.firstName} ${doctor.lastName}` : activeDoctorName}</span>
            </div>
            {doctor?.photoUrl
              ? <img className="dashboard-header__avatar dashboard-header__avatar--photo" src={doctor.photoUrl} alt="Foto de perfil" />
              : <span className="dashboard-header__avatar">{doctorInitials}</span>}
          </div>
        </DashboardHeader>

        <section className="cp-kpis">
          <div className="kpi kpi-total">
            <div className="kpi-icon"><GroupOutlinedIcon sx={{ fontSize: 24 }} /></div>
            <div className="kpi-label">Total de pacientes</div>
            {doctor ? <div className="kpi-value">{patients.length}</div> : <div className="kpi-value empty-value" aria-label="Sin valor" />}
          </div>
          <div className="kpi kpi-date">
            <div className="kpi-icon"><CalendarTodayOutlinedIcon sx={{ fontSize: 24 }} /></div>
            <div className="kpi-label">Citas hoy</div>
            {doctor ? <div className="kpi-value">{todayAppointments.length}</div> : <div className="kpi-value empty-value" aria-label="Sin valor" />}
          </div>
          <div className="kpi kpi-tasks">
            <div className="kpi-icon"><PendingActionsOutlinedIcon sx={{ fontSize: 24 }} /></div>
            <div className="kpi-label">Tareas pendientes</div>
            {doctor ? (
              <div className="kpi-value">{tasks.filter(task => task.status !== 'COMPLETED').length}</div>
            ) : (
              <div className="kpi-value empty-value" aria-label="Sin valor" />
            )}
          </div>
          <div className="kpi kpi-reports">
            <div className="kpi-icon"><FileText size={20} /></div>
            <div className="kpi-label">Informes por revisar</div>
            <div className="kpi-value empty-value" aria-label="Sin valor" />
          </div>
        </section>

        <section className="cp-content">
          <div className="cp-left">
            <div className="panel upcoming">
              <div className="panel-title">
                <span>Próximas citas</span>
                <a href="#" className="panel-link">Ver agenda completa</a>
              </div>

              {doctor ? (
                <div className="upcoming-table">
                  <div className="upcoming-head">
                    <span>Paciente</span>
                    <span>Hora</span>
                    <span>Tipo de consulta</span>
                  </div>

                  {appointments.slice(0, 4).map(appointment => {
                    const rawStartTime = appointment.startTime ? new Date(appointment.startTime) : null;
                    const formattedTime = rawStartTime && !Number.isNaN(rawStartTime.getTime())
                      ? rawStartTime.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: true })
                      : appointment.startTime || '--:--';

                    return (
                      <div className="upcoming-row" key={appointment.id}>
                        <div className="patient-cell">
                          <span className="avatar patient-avatar">{getPatientInitials(appointment)}</span>
                          <span className="appointment-name">{getPatientName(appointment) || 'Pendiente de registro'}</span>
                        </div>
                        <span className="appointment-time">{formattedTime}</span>
                        <span className={`appointment-type${isControlType(appointment) ? ' appointment-type--control' : ''}`}>{formatAppointmentTypeLabel(appointment)}</span>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="upcoming-table">
                  <div className="upcoming-head">
                    <span>Paciente</span>
                    <span>Hora</span>
                    <span>Tipo de consulta</span>
                  </div>

                  {[1, 2, 3, 4].map(item => (
                    <div className="upcoming-row empty-row" key={item}>
                      <div className="patient-cell">
                        <span className="avatar placeholder-avatar" />
                        <span className="placeholder-line placeholder-name" />
                      </div>
                      <span className="placeholder-line placeholder-time" />
                      <span className="placeholder-pill" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="panel chart">
              <div className="panel-title chart-title-row">
                <span>Consultas por Tipo y Mes</span>
                <div className="chart-legend">
                  <span className="chart-legend-item"><i className="dot dot-control" />Control</span>
                  <span className="chart-legend-item"><i className="dot dot-first" />De primera</span>
                </div>
              </div>
              <div className="chart-area" aria-label="Consultas por tipo y mes">
                {chartData.map(month => (
                  <div className="chart-group" key={month.key}>
                    <div className="chart-bars">
                      <div className="chart-col">
                        <em className="chart-value chart-value--control">{month.control}</em>
                        <span
                          className="bar bar-control"
                          style={{ height: `${barHeight(month.control)}%` }}
                        />
                      </div>
                      <div className="chart-col">
                        <em className="chart-value chart-value--first">{month.firstTime}</em>
                        <span
                          className="bar bar-first"
                          style={{ height: `${barHeight(month.firstTime)}%` }}
                        />
                      </div>
                    </div>
                    <small className="chart-month">{month.label}</small>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <aside className="cp-right">
            <div className="panel tasks">
              <div className="panel-title tasks-header">
                <span>Tareas pendientes</span>
                <button
                  type="button"
                  className="tasks-add"
                  aria-label="Agregar tarea"
                  onClick={() => setShowTaskInput(value => !value)}
                >
                  <Plus size={16} />
                </button>
              </div>

              <ul className={`tasks-list${tasks.length === 0 ? ' tasks-list--placeholder' : ''}`}>
                {tasks.length === 0 && (
                  <>
                    <li className="task-item task-item--primary">
                      <div className="task-copy task-copy--placeholder">
                        <span className="placeholder-line task-title" />
                        <span className="placeholder-line task-sub" />
                      </div>
                      <input type="checkbox" aria-label="Tarea pendiente" />
                    </li>
                    <li className="task-item task-item--success">
                      <div className="task-copy task-copy--placeholder">
                        <span className="placeholder-line task-title" />
                        <span className="placeholder-line task-sub" />
                      </div>
                      <input type="checkbox" aria-label="Tarea pendiente" />
                    </li>
                    <li className="task-item task-item--danger">
                      <div className="task-copy task-copy--placeholder">
                        <span className="placeholder-line task-title" />
                        <span className="placeholder-line task-sub" />
                      </div>
                      <input type="checkbox" aria-label="Tarea pendiente" />
                    </li>
                  </>
                )}
                {tasks.map(task => (
                  <li
                    key={task.id}
                    className={`task-item ${task.priority === 'HIGH' ? 'task-item--danger' : task.priority === 'LOW' ? 'task-item--success' : 'task-item--primary'}`}
                  >
                    <div className="task-copy">
                      <p style={task.status === 'COMPLETED' ? { textDecoration: 'line-through', opacity: 0.55 } : undefined}>{task.title}</p>
                      {task.description ? (
                        <small>{task.description}</small>
                      ) : (
                        <small>Pendiente</small>
                      )}
                    </div>
                    <input
                      type="checkbox"
                      aria-label={`Completar ${task.title}`}
                      checked={task.status === 'COMPLETED'}
                      onChange={() => handleToggleTask(task)}
                    />
                  </li>
                ))}
              </ul>

              {showTaskInput && (
                <input
                  className="outline"
                  placeholder="Nueva tarea... (Enter para guardar)"
                  value={newTaskTitle}
                  onChange={e => setNewTaskTitle(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleCreateTask()
                    if (e.key === 'Escape') { setShowTaskInput(false); setNewTaskTitle('') }
                  }}
                  autoFocus
                />
              )}

              <button type="button" className="outline" onClick={() => navigate('/pending-tasks')}>Ver historial de tareas</button>
            </div>

            <div className="panel mini-cal">
              <div className="panel-title">
                <span>{monthLabel}</span>
                  <div className="mini-cal-nav">
                    <button
                      type="button"
                      onClick={() => setVisibleDate(date => new Date(date.getFullYear(), date.getMonth() - 1, 1))}
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setVisibleDate(date => new Date(date.getFullYear(), date.getMonth() + 1, 1))}
                    >
                      <ChevronRight size={20} />
                    </button>
                  </div>
              </div>

              <div className="mini-cal-grid">
                {weekDays.map((day, index) => (
                  <div key={`${day}-${index}`} className="day-label">{day}</div>
                ))}

                {calendarDays.map((date, index) => {
                  if (!date) {
                    return <div key={`empty-${index}`} className="date-cell empty-cell" aria-hidden="true" />
                  }

                  const isSelected = selectedDate.getTime() === date.getTime()
                  const isCurrentMonth = date.getMonth() === visibleMonth

                  return (
                    <button
                      key={date.toISOString()}
                      type="button"
                      className={`date-cell ${isCurrentMonth ? '' : 'muted'} ${isSelected ? 'active' : ''}`}
                      onClick={() => {
                        setSelectedDate(date)
                        setVisibleDate(new Date(date.getFullYear(), date.getMonth(), 1))
                      }}
                    >
                      {date.getDate()}
                    </button>
                  )
                })}
              </div>
            </div>
          </aside>
        </section>
      </div>
    </div>
  )
}
