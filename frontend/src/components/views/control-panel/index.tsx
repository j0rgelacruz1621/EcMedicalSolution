import { useMemo, useState } from 'react'
import LeftSideBar from '../../left-sideBar'
import './style.scss'
import { Bell, CircleHelp, ChevronLeft, ChevronRight, Plus } from 'lucide-react'

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

export default function ControlPanel() {
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

  const monthLabel = new Intl.DateTimeFormat('es-ES', {
    month: 'long',
    year: 'numeric'
  }).format(visibleDate)

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
                <span>Dra. Josiana Piña</span>
              </div>
            </div>
        </header>

        <section className="cp-kpis">
          <div className="kpi">
            <div className="kpi-label">Total de pacientes</div>
            <div className="kpi-value empty-value" aria-label="Sin valor" />
          </div>
          <div className="kpi">
            <div className="kpi-label">Citas hoy</div>
            <div className="kpi-value empty-value" aria-label="Sin valor" />
          </div>
          <div className="kpi">
            <div className="kpi-label">Tareas pendientes</div>
            <div className="kpi-value empty-value" aria-label="Sin valor" />
          </div>
          <div className="kpi">
            <div className="kpi-label">Informes por revisar</div>
            <div className="kpi-value empty-value" aria-label="Sin valor" />
          </div>
        </section>

        <section className="cp-content">
          <div className="cp-left">
            <div className="panel upcoming">
              <div className="panel-title">
                <span>Tareas pendientes</span>
                <button className="add" type="button" aria-label="Agregar tarea"><Plus size={18} /></button>
              </div>

              <ul className="up-list">
                <li className="list-row empty-row">
                  <span className="avatar placeholder-avatar" />
                  <span className="placeholder-line placeholder-name" />
                  <span className="placeholder-line placeholder-time" />
                  <span className="placeholder-pill" />
                </li>
                <li className="list-row empty-row">
                  <span className="avatar placeholder-avatar" />
                  <span className="placeholder-line placeholder-name" />
                  <span className="placeholder-line placeholder-time" />
                  <span className="placeholder-pill" />
                </li>
                <li className="list-row empty-row">
                  <span className="avatar placeholder-avatar" />
                  <span className="placeholder-line placeholder-name" />
                  <span className="placeholder-line placeholder-time" />
                  <span className="placeholder-pill" />
                </li>
                <li className="list-row empty-row">
                  <span className="avatar placeholder-avatar" />
                  <span className="placeholder-line placeholder-name" />
                  <span className="placeholder-line placeholder-time" />
                  <span className="placeholder-pill" />
                </li>
              </ul>
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
              <div className="panel-title">
                <span>Tareas pendientes</span>
                <button className="add" type="button" aria-label="Agregar tarea">+</button>
              </div>

              <ul className="tasks-list">
                <li>
                  <input type="checkbox" aria-label="Tarea pendiente" />
                  <div className="task-placeholder">
                    <span className="placeholder-line task-title" />
                    <span className="placeholder-line task-sub" />
                  </div>
                </li>
                <li>
                  <input type="checkbox" aria-label="Tarea pendiente" />
                  <div className="task-placeholder">
                    <span className="placeholder-line task-title" />
                    <span className="placeholder-line task-sub" />
                  </div>
                </li>
                <li>
                  <input type="checkbox" aria-label="Tarea pendiente" />
                  <div className="task-placeholder">
                    <span className="placeholder-line task-title" />
                    <span className="placeholder-line task-sub" />
                  </div>
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
