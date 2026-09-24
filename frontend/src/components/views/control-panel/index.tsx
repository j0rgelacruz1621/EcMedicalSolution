import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import LeftSideBar from '../../left-sideBar'
import './style.scss'
import {
  Bell,
  CalendarDays,
  CircleHelp,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  FileText,
  Plus,
  Users,
} from 'lucide-react'
import { getDoctor, type Doctor } from '../../../services/doctors/doctor-services'
import { getAppointments, type Appointment } from '../../../services/appointments/appointment-services'

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

  const monthLabel = new Intl.DateTimeFormat('es-ES', {
    month: 'long',
    year: 'numeric'
  }).format(visibleDate)

  const formatAppointmentTypeLabel = (appointment: Appointment) => {
    const value = appointment.reasonForVisit || appointment.status || 'Consulta'
    return value.toUpperCase()
  }

  const getPatientInitials = (appointment: Appointment) => {
    const firstName = appointment.patient?.firstName || ''
    const lastName = appointment.patient?.lastName || ''
    const initials = `${firstName[0] || ''}${lastName[0] || ''}`.toUpperCase()
    return initials || 'AM'
  }

  return (
    <div className="cp-root">
      <LeftSideBar />
      <div className="cp-main">
        <header className="cp-header">
          <h1>Panel de Control</h1>
            <div className="cp-header-right">
              <button className="icon" aria-label="Notificaciones"><Bell size={18} /></button>
              <button className="icon" aria-label="Ayuda"><CircleHelp size={18} /></button>
              <div className="cp-user">
                <span>{doctor ? `${doctorTitle} ${doctor.firstName} ${doctor.lastName}` : activeDoctorName}</span>
                <span className="cp-user-badge">{doctorInitials}</span>
              </div>
            </div>
        </header>

        <section className="cp-kpis">
          <div className="kpi kpi-total">
            <div className="kpi-icon"><Users size={20} /></div>
            <div className="kpi-label">Total de pacientes</div>
            {doctor ? <div className="kpi-value">{patients.length}</div> : <div className="kpi-value empty-value" aria-label="Sin valor" />}
          </div>
          <div className="kpi kpi-date">
            <div className="kpi-icon"><CalendarDays size={20} /></div>
            <div className="kpi-label">Citas hoy</div>
            {doctor ? <div className="kpi-value">{todayAppointments.length}</div> : <div className="kpi-value empty-value" aria-label="Sin valor" />}
          </div>
          <div className="kpi kpi-tasks">
            <div className="kpi-icon"><ClipboardList size={20} /></div>
            <div className="kpi-label">Tareas pendientes</div>
            <div className="kpi-value empty-value" aria-label="Sin valor" />
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
                          <span className="appointment-name">{appointment.patient?.firstName || 'Paciente'} {appointment.patient?.lastName || ''}</span>
                        </div>
                        <span className="appointment-time">{formattedTime}</span>
                        <span className="appointment-type">{formatAppointmentTypeLabel(appointment)}</span>
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
              <div className="panel-title">
                <span>Consultas por tipo y mes</span>
              </div>
              <div className="chart-placeholder" aria-label="Espacio para gráfica">
                <div className="chart-bar"><span style={{ height: '30%' }} /><small /></div>
                <div className="chart-bar"><span style={{ height: '42%' }} /><small /></div>
                <div className="chart-bar"><span style={{ height: '58%' }} /><small /></div>
                <div className="chart-bar"><span style={{ height: '36%' }} /><small /></div>
                <div className="chart-bar"><span style={{ height: '48%' }} /><small /></div>
                <div className="chart-bar"><span style={{ height: '62%' }} /><small /></div>
              </div>
            </div>
          </div>

          <aside className="cp-right">
            <div className="panel tasks">
              <div className="panel-title tasks-header">
                <span>Tareas pendientes</span>
                <button type="button" className="tasks-add" aria-label="Agregar tarea">
                  <Plus size={16} />
                </button>
              </div>

              <ul className="tasks-list tasks-list--placeholder">
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
              </ul>

              <button type="button" className="outline">Ver historial de tareas</button>
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
