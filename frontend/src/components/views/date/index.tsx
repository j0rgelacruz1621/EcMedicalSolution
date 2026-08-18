import { useMemo, useState, useEffect, useRef } from 'react'
import Header from '../../header'
import Footer from '../../footer'
import './style.scss'
import ConfirmDatePreview from '../../modals/confirm-date-preview'
import ConfirmDate from '../../modals/confirm-date'

// --- FUNCIONES AUXILIARES ---
const weekDays = ['D', 'L', 'M', 'M', 'J', 'V', 'S']

const formatLongDate = (date: Date | null) => {
  if (!date) return ''
  return new Intl.DateTimeFormat('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(date)
}

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

// Datos de ejemplo
const consultories = [
  { id: 'c1', name: 'Cardiología - Consultorio A', orderOfArrival: false, schedule: ['08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM'] },
  { id: 'c2', name: 'Triaje - Orden de llegada', orderOfArrival: true, schedule: [] },
]

const exampleBooked: Record<string, string[]> = {
  'c1_2026-10-16': ['10:00 AM'],
}

export default function DateView() {
  const today = useMemo(() => {
    const current = new Date()
    current.setHours(0, 0, 0, 0)
    return current
  }, [])

  // ESTADOS PRINCIPALES
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date(2026, 9, 16))
  const [visibleDate, setVisibleDate] = useState<Date>(() => {
    const date = new Date(2026, 9, 1)
    date.setHours(0, 0, 0, 0)
    return date
  })

  const visibleMonth = visibleDate.getMonth()
  const visibleYear = visibleDate.getFullYear()
  
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [cedula, setCedula] = useState('')
  const [age, setAge] = useState('')
  const [phone, setPhone] = useState('')

  const sanitizeName = (value: string) => value.replace(/[^A-Za-zÀ-ÿ\s]/g, '')
  const sanitizeCedula = (value: string) => value.replace(/[^0-9-]/g, '')
  const sanitizeAge = (value: string) => value.replace(/\D/g, '')
  const sanitizePhone = (value: string) => value.replace(/[^0-9+()\s-]/g, '')
  
  const [selectedConsultory, setSelectedConsultory] = useState<string | null>(consultories[0].id)
  
  // Partes del selector de hora
  const [timeHour, setTimeHour] = useState<string>('10')
  const [timeMinute, setTimeMinute] = useState<string>('00')
  const [timeMeridiem, setTimeMeridiem] = useState<string>('AM')

  // MODALES
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [isFinalOpen, setIsFinalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [finalBooking, setFinalBooking] = useState<any>(null)

  const calendarRef = useRef<HTMLDivElement | null>(null)

  const calendarDays = useMemo(() => getCalendarDays(visibleYear, visibleMonth), [visibleMonth, visibleYear])
  const monthLabel = new Intl.DateTimeFormat('es-ES', {
    month: 'long',
    year: 'numeric'
  }).format(visibleDate).replace(/^./, char => char.toUpperCase())

  // Lógica para filtrar horarios disponibles según el consultorio
  useEffect(() => {
    if (!selectedConsultory || !selectedDate) return

    const consultory = consultories.find(c => c.id === selectedConsultory)
    if (!consultory || consultory.orderOfArrival) {
      return
    }

    const y = selectedDate.getFullYear()
    const m = String(selectedDate.getMonth() + 1).padStart(2, '0')
    const d = String(selectedDate.getDate()).padStart(2, '0')
    const dateKey = `${consultory.id}_${y}-${m}-${d}`
    const booked = exampleBooked[dateKey] || []

    void booked
  }, [selectedConsultory, selectedDate])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!firstName || !lastName || !selectedDate) return alert('Complete los campos obligatorios')
    setIsConfirmOpen(true)
  }

  const handleConfirm = () => {
    setIsSubmitting(true)
    setTimeout(() => {
      setIsSubmitting(false)
      setIsConfirmOpen(false)
      const consultory = consultories.find(c => c.id === selectedConsultory)
      setFinalBooking({
        dateLabel: formatLongDate(selectedDate),
        timeLabel: `${timeHour}:${timeMinute} ${timeMeridiem}`,
        specialty: 'Cardiología Intervencionista',
        location: consultory ? consultory.name : 'Consultorio Médico'
      })
      setIsFinalOpen(true)
    }, 1000)
  }

  return (
    <>
      <Header />
      <section className="date-view py-5">
        <div className="container">
          <div className="text-center mb-4 w-100"> 
            <h1 className="date-view__main-title display-5 fw-bold">
              Agendar Cita Médica
            </h1>
            <p className="date-view__subtitle">
              Completa el formulario a continuación para programar tu consulta de cardiología especializada.
            </p>
          </div>

          <div className="date-view__card shadow-lg">
            <form onSubmit={handleSubmit}>
              {/* FILA 1: NOMBRES Y APELLIDOS */}
              <div className="row g-4 mb-4">
                <div className="col-md-6">
                  <label className="form-label">Nombres</label>
                  <div className="input-group">
                    <span className="input-group-text">👤</span>
                    <input
                      className="form-control"
                      type="text"
                      placeholder="Ej. Juan Andrés"
                      value={firstName}
                      onChange={e => setFirstName(sanitizeName(e.target.value))}
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <label className="form-label">Apellidos</label>
                  <div className="input-group">
                    <span className="input-group-text">🪪</span>
                    <input
                      className="form-control"
                      type="text"
                      placeholder="Ej. Pérez García"
                      value={lastName}
                      onChange={e => setLastName(sanitizeName(e.target.value))}
                    />
                  </div>
                </div>

                {/* FILA 2: CÉDULA Y EDAD */}
                <div className="col-md-6">
                  <label className="form-label">Cédula de Identidad</label>
                  <div className="input-group">
                    <span className="input-group-text">☝️</span>
                    <input
                      className="form-control"
                      type="text"
                      placeholder="000-0000000-0"
                      value={cedula}
                      onChange={e => setCedula(sanitizeCedula(e.target.value))}
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <label className="form-label">Edad</label>
                  <div className="input-group">
                    <span className="input-group-text">🎂</span>
                    <input
                      className="form-control"
                      type="text"
                      placeholder="00"
                      value={age}
                      onChange={e => setAge(sanitizeAge(e.target.value))}
                    />
                  </div>
                </div>

                {/* FILA 3: TELÉFONO Y CONSULTORIO */}
                <div className="col-md-6">
                  <label className="form-label">Número de teléfono</label>
                  <div className="input-group">
                    <span className="input-group-text">📞</span>
                    <input
                      className="form-control"
                      type="tel"
                      placeholder="+00 000 000 0000"
                      value={phone}
                      onChange={e => setPhone(sanitizePhone(e.target.value))}
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <label className="form-label">Consultorio</label>
                  <div className="input-group">
                    <span className="input-group-text">🏥</span>
                    <select className="form-select" value={selectedConsultory ?? ''} onChange={e => setSelectedConsultory(e.target.value)}>
                      <option value="">Seleccione ubicación</option>
                      {consultories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* SECCIÓN CALENDARIO Y DETALLES */}
              <div className="row g-5 pt-4 border-top">
                <div className="col-lg-6">
                  <label className="form-label mb-3">Fecha de la cita</label>
                  <div className="calendar-box" ref={calendarRef}>
                    <div className="calendar-box__header">
                      <span>{monthLabel}</span>
                      <div className="d-flex gap-3">
                        <button
                          type="button"
                          className="border-0 bg-transparent"
                          onClick={() => setVisibleDate(date => new Date(date.getFullYear(), date.getMonth() - 1, 1))}
                        >
                          ‹
                        </button>
                        <button
                          type="button"
                          className="border-0 bg-transparent"
                          onClick={() => setVisibleDate(date => new Date(date.getFullYear(), date.getMonth() + 1, 1))}
                        >
                          ›
                        </button>
                      </div>
                    </div>
                    <div className="calendar-box__grid">
                      {weekDays.map((d, i) => <span key={i} className="calendar-box__weekday">{d}</span>)}
                      {calendarDays.map((date, i) => {
                        if (!date) return <span key={i} />
                        const isPast = date.getTime() < today.getTime()
                        const isSelected = selectedDate?.getTime() === date.getTime()
                        return (
                          <button
                            key={i}
                            type="button"
                            className={`calendar-box__day ${isSelected ? 'is-selected' : ''} ${isPast ? 'is-disabled' : ''}`}
                            disabled={isPast}
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
                </div>

                <div className="col-lg-6">
                  <label className="form-label">Fecha seleccionada</label>
                  <div className="input-group mb-4">
                    <span className="input-group-text">📅</span>
                    <input className="form-control" type="text" readOnly value={formatLongDate(selectedDate)} />
                  </div>

                  {!consultories.find(c => c.id === selectedConsultory)?.orderOfArrival && (
                    <>
                      <label className="form-label">Seleccionar hora</label>
                      <div className="time-picker-row">
                        <span className="clock-icon">🕒</span>
                        <select value={timeHour} onChange={e => setTimeHour(e.target.value)}>
                          {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0')).map(h => <option key={h} value={h}>{h}</option>)}
                        </select>
                        <span>:</span>
                        <select value={timeMinute} onChange={e => setTimeMinute(e.target.value)}>
                          {Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0')).map(m => (
                            <option key={m} value={m}>
                              {m}
                            </option>
                          ))}
                        </select>

                        <select value={timeMeridiem} onChange={e => setTimeMeridiem(e.target.value)}>
                          <option value="AM">a. m.</option>
                          <option value="PM">p. m.</option>
                        </select>
                        <span className="ms-auto clock-icon">🕒</span>
                      </div>
                    </>
                  )}

                  <div className="alert alert-light border mt-4 d-flex align-items-start gap-2">
                    <span className="text-primary">ℹ️</span>
                    <p className="m-0">Las citas están sujetas a disponibilidad. Recibirá una confirmación vía SMS en los próximos 15 minutos.</p>
                  </div>
                </div>
              </div>

              {/* BOTONES 50/50 */}
              <div className="date-view__footer-actions">
                <button type="button" className="btn-cancel" onClick={() => window.location.href = '/'}>Cancelar</button>
                <button type="submit" className="btn-submit">Agendar cita</button>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* MODALES */}
      <ConfirmDatePreview
        isOpen={isConfirmOpen}
        dateText={formatLongDate(selectedDate)}
        timeText={`${timeHour}:${timeMinute} ${timeMeridiem}`}
        loading={isSubmitting}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirm}
        onChangeDate={() => setIsConfirmOpen(false)}
        onChangeTime={() => setIsConfirmOpen(false)}
      />
      <ConfirmDate
        isOpen={isFinalOpen}
        booking={finalBooking}
        onClose={() => setIsFinalOpen(false)}
        onFinish={() => { setIsFinalOpen(false); window.location.href = '/'; }}
      />
      <Footer />
    </>
  )
}