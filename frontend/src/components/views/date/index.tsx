import { useMemo, useState } from 'react'
import './style.scss'

const weekDays = ['D', 'L', 'M', 'M', 'J', 'V', 'S']

const formatDate = (date: Date) => {
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()

  return `${day}/${month}/${year}`
}

const getCalendarDays = (year: number, month: number) => {
  const firstDayIndex = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  return Array.from({ length: 42 }, (_, index) => {
    const dayNumber = index - firstDayIndex + 1

    if (dayNumber < 1 || dayNumber > daysInMonth) {
      return null
    }

    const date = new Date(year, month, dayNumber)
    date.setHours(0, 0, 0, 0)
    return date
  })
}

function DateView() {
  const today = useMemo(() => {
    const current = new Date()
    current.setHours(0, 0, 0, 0)
    return current
  }, [])

  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [visibleMonth, setVisibleMonth] = useState(today.getMonth())
  const [visibleYear, setVisibleYear] = useState(today.getFullYear())
  const [patientName, setPatientName] = useState('')
  const [phone, setPhone] = useState('')

  const calendarDays = useMemo(
    () => getCalendarDays(visibleYear, visibleMonth),
    [visibleMonth, visibleYear],
  )

  const monthLabel = useMemo(
    () =>
      new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric' }).format(
        new Date(visibleYear, visibleMonth, 1),
      ),
    [visibleMonth, visibleYear],
  )

  const selectedDateText = selectedDate ? formatDate(selectedDate) : ''

  const handleSelectDay = (date: Date | null) => {
    if (!date) {
      return
    }

    if (date.getTime() < today.getTime()) {
      return
    }

    setSelectedDate(date)
    setVisibleMonth(date.getMonth())
    setVisibleYear(date.getFullYear())
  }

  const changeMonth = (delta: number) => {
    setVisibleMonth((currentMonth) => {
      const nextMonth = currentMonth + delta

      if (nextMonth < 0) {
        setVisibleYear((currentYear) => currentYear - 1)
        return 11
      }

      if (nextMonth > 11) {
        setVisibleYear((currentYear) => currentYear + 1)
        return 0
      }

      return nextMonth
    })
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!patientName.trim()) {
      alert('Debe ingresar el nombre del paciente')
      return
    }

    if (!selectedDate) {
      alert('Debe seleccionar una fecha para la cita')
      return
    }

    alert(`Cita agendada para ${patientName} el ${selectedDateText}`)
  }

  return (
    <section className="date-view">
      <div className="date-view__card">
        <header className="date-view__header">
          <div>
            <p className="date-view__eyebrow">Reservar cita</p>
            <h2 className="date-view__title">Agenda médica</h2>
          </div>
          <button type="button" className="date-view__button date-view__button--ghost">
            Ver horario
          </button>
        </header>

        <form className="date-view__form" onSubmit={handleSubmit}>
          <div className="date-view__fields">
            <label className="date-view__field">
              <span>Nombre del paciente</span>
              <input
                type="text"
                value={patientName}
                placeholder="Ej. Ana García"
                onChange={(event) => setPatientName(event.target.value)}
              />
            </label>

            <label className="date-view__field">
              <span>Teléfono</span>
              <input
                type="tel"
                value={phone}
                placeholder="+58 412 123 4567"
                onChange={(event) => setPhone(event.target.value)}
              />
            </label>

            <label className="date-view__field date-view__field--full">
              <span>Fecha seleccionada</span>
              <input type="text" value={selectedDateText} readOnly placeholder="Seleccione una fecha" />
            </label>
          </div>

          <div className="date-view__calendar-wrap">
            <div className="date-view__calendar-header">
              <button type="button" className="date-view__nav" onClick={() => changeMonth(-1)}>
                ‹
              </button>

              <strong>{monthLabel}</strong>

              <button type="button" className="date-view__nav" onClick={() => changeMonth(1)}>
                ›
              </button>
            </div>

            <div className="date-view__calendar-grid">
              {weekDays.map((day, index) => (
                <span key={`${day}-${index}`} className="date-view__weekday">
                  {day}
                </span>
              ))}

              {calendarDays.map((date, index) => {
                if (!date) {
                  return <span key={`empty-${index}`} className="date-view__empty" />
                }

                const isPast = date.getTime() < today.getTime()
                const isSelected = selectedDate?.getTime() === date.getTime()

                return (
                  <button
                    key={date.toISOString()}
                    type="button"
                    className={`date-view__day ${isSelected ? 'is-selected' : ''} ${isPast ? 'is-disabled' : ''}`}
                    onClick={() => handleSelectDay(date)}
                    disabled={isPast}
                  >
                    {date.getDate()}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="date-view__actions">
            <button type="button" className="date-view__button date-view__button--secondary">
              Cancelar
            </button>
            <button type="submit" className="date-view__button date-view__button--primary">
              Confirmar cita
            </button>
          </div>
        </form>
      </div>
    </section>
  )
}

export default DateView
