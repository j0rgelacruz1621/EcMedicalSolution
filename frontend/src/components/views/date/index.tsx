import { useMemo, useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import Header from '../../header'
import './style.scss'
import ConfirmDatePreview from '../../modals/confirm-date-preview'
import ConfirmDate from '../../modals/confirm-date'
import { createAppointment, type CreateAppointmentRequest } from '../../../services/appointments/appointment-services'
import { getDoctors } from '../../../services/doctors/doctor-services'
import { getOffices, type Office } from '../../../services/medical-center/medical-center-services'

import {
  User,
  IdCard,
  Fingerprint,
  Cake,
  Phone,
  Hospital,
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  Info
} from 'lucide-react'

const weekDays = ['D', 'L', 'M', 'M', 'J', 'V', 'S']

const formatShortDate = (date: Date | null) => {
  if (!date) return ''
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  return `${day}/${month}/${year}`
}

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

const applyCedulaMask = (value: string) => value.replace(/\D/g, '').slice(0, 11)

const applyPhoneMask = (value: string) => {
  const cleaned = value.replace(/\D/g, '').slice(0, 12)
  if (cleaned.length <= 2) return cleaned ? `+${cleaned}` : ''
  if (cleaned.length <= 5) return `+${cleaned.slice(0, 2)} ${cleaned.slice(2)}`
  if (cleaned.length <= 8) return `+${cleaned.slice(0, 2)} ${cleaned.slice(2, 5)} ${cleaned.slice(5)}`
  return `+${cleaned.slice(0, 2)} ${cleaned.slice(2, 5)} ${cleaned.slice(5, 8)} ${cleaned.slice(8)}`
}

export default function DateView() {
  const navigate = useNavigate()
  const activeRole = localStorage.getItem('user_rol')
  const loggedDoctorId = localStorage.getItem('doctor_id')
  const [searchParams] = useSearchParams()
  const selectedContextDoctorId = activeRole === 'DOCTOR'
    ? loggedDoctorId
    : searchParams.get('doctorId') || sessionStorage.getItem('active_doctor_id')
  const controlPanelPath = selectedContextDoctorId
    ? `/control-panel?doctorId=${selectedContextDoctorId}`
    : '/control-panel'

  const today = useMemo(() => {
    const current = new Date()
    current.setHours(0, 0, 0, 0)
    return current
  }, [])

  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date())
  const [visibleDate, setVisibleDate] = useState<Date>(() => {
    const date = new Date()
    date.setDate(1)
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
  const [consultationType, setConsultationType] = useState('')

  const sanitizeName = (value: string) => value.replace(/[^A-Za-zÀ-ÿ\s]/g, '')
  const sanitizeAge = (value: string) => value.replace(/\D/g, '').slice(0, 2)

  const [offices, setOffices] = useState<Office[]>([])
  const [selectedDoctorId, setSelectedDoctorId] = useState('')
  const [selectedOfficeId, setSelectedOfficeId] = useState('')
  const [catalogError, setCatalogError] = useState('')
  const [submitError, setSubmitError] = useState('')

  const [timeHour, setTimeHour] = useState<string>('10')
  const [timeMinute, setTimeMinute] = useState<string>('00')
  const [timeMeridiem, setTimeMeridiem] = useState<string>('AM')

  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [isFinalOpen, setIsFinalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [finalBooking, setFinalBooking] = useState<any>(null)

  useEffect(() => {
    Promise.all([getDoctors(), getOffices()])
      .then(([loadedDoctors, loadedOffices]) => {
        const availableDoctors = selectedContextDoctorId
          ? loadedDoctors.filter(doctor => String(doctor.id) === selectedContextDoctorId)
          : loadedDoctors
        const defaultDoctorId = selectedContextDoctorId || String(availableDoctors[0]?.id ?? '')
        const selectedDoctor = availableDoctors.find(doctor => String(doctor.id) === defaultDoctorId)

        // Los consultorios se muestran agrupados por el CENTRO MÉDICO del
        // médico seleccionado: se deduce a partir de su oficina asignada
        // (officeId -> medicalCenterId). Sin asignación, se muestran todas.
        const doctorCenterId = selectedDoctor?.officeId
          ? loadedOffices.find(office => office.id === Number(selectedDoctor.officeId))?.medicalCenterId
          : undefined
        const centerOffices = doctorCenterId
          ? loadedOffices.filter(office => office.medicalCenterId === doctorCenterId)
          : loadedOffices
        const sortedOffices = [...centerOffices].sort((a, b) =>
          a.officeNumber.localeCompare(b.officeNumber, 'es', { numeric: true }),
        )

        setOffices(sortedOffices)
        setSelectedDoctorId(defaultDoctorId)
        setSelectedOfficeId(String(sortedOffices[0]?.id ?? ''))
      })
      .catch(() => setCatalogError('No se pudieron cargar médicos y consultorios.'))
  }, [activeRole, loggedDoctorId, selectedContextDoctorId])

  const calendarDays = useMemo(() => getCalendarDays(visibleYear, visibleMonth), [visibleMonth, visibleYear])
  const monthLabel = new Intl.DateTimeFormat('es-ES', {
    month: 'long',
    year: 'numeric'
  }).format(visibleDate).replace(/^./, char => char.toUpperCase())

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitError('')

    if (!firstName.trim() || !lastName.trim()) {
      setSubmitError('Debe completar nombres y apellidos.')
      return
    }

    const cedulaDigits = cedula.replace(/\D/g, '')
    if (!cedulaDigits || cedulaDigits.length < 6 || cedulaDigits.length > 11) {
      setSubmitError('La cédula debe tener entre 6 y 11 dígitos numéricos.')
      return
    }

    if (!age || Number(age) <= 0) {
      setSubmitError('La edad debe ser un valor numérico positivo.')
      return
    }

    if (!phone || phone.length < 12) {
      setSubmitError('El número de teléfono debe tener formato internacional válido.')
      return
    }

    if (!selectedOfficeId) {
      setSubmitError('Debe seleccionar un consultorio.')
      return
    }

    if (!selectedDate || selectedDate < today) {
      setSubmitError('Debe seleccionar una fecha válida.')
      return
    }

    if (!consultationType) {
      setSubmitError('Debe seleccionar un tipo de consulta.')
      return
    }

    if (!selectedDoctorId) {
      setSubmitError('No hay médico disponible para esta solicitud.')
      return
    }

    setIsConfirmOpen(true)
  }

  const handleConfirm = async () => {
    setIsSubmitting(true)
    try {
      const office = offices.find(item => item.id === Number(selectedOfficeId))
      if (!office?.medicalCenterId) throw new Error('El consultorio no tiene centro médico asociado.')

      // El backend exige email y fecha de nacimiento válidos: se derivan
      // del formulario (edad) ya que la vista no los pide directamente
      const birthYear = new Date().getFullYear() - Number(age)
      const nationalIdDigits = cedula.replace(/\D/g, '') || 'paciente'

      let hour = Number(timeHour) % 12
      if (timeMeridiem === 'PM') hour += 12
      const startAt = new Date(selectedDate!.getFullYear(), selectedDate!.getMonth(), selectedDate!.getDate(), hour, Number(timeMinute))
      const endAt = new Date(startAt.getTime() + 30 * 60 * 1000)

      const currentYear = new Date().getFullYear()
      const estimatedYear = currentYear - Number(age)
      const dateOfBirth = `${estimatedYear}-01-01T00:00:00.000Z`

      const appointment = await createAppointment({
        doctorId: Number(selectedDoctorId),
        startAt: startAt.toISOString(),
        endAt: endAt.toISOString(),
        medicalCenterId: office.medicalCenterId,
        officeId: office.id,
        reasonForVisit: consultationType || undefined,
        type: consultationType || undefined,
        patient: {
          nationalId: cedula,
          firstName,
          lastName,
          phone,
          dateOfBirth,
          gender: 'OTRO' as const,
        } as CreateAppointmentRequest['patient']
      })

      setIsSubmitting(false)
      setIsConfirmOpen(false)
      setFinalBooking({
        dateLabel: formatLongDate(selectedDate),
        timeLabel: `${timeHour}:${timeMinute} ${timeMeridiem}`,
        specialty: consultationType,
        location: office.officeNumber,
        appointmentCode: appointment.appointmentCode,
      })
      setIsFinalOpen(true)
    } catch {
      setSubmitError('No se pudo agendar la cita. Revisa la disponibilidad y los datos ingresados.')
      setIsConfirmOpen(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <Header />
      <section className="date-view py-5">
        <div className="container">
          <div className="date-view__header-box">
            <h1 className="date-view__main-title">Agendar Cita Médica</h1>
            <p className="date-view__subtitle">
              Complete el formulario a continuación para programar su consulta <br />de cardiología especializada.
            </p>
          </div>

          <div className="date-view__card">
            <form onSubmit={handleSubmit} className="date-view__form">
              <div className="date-view__fields-grid">
                <div className="date-view__field">
                  <label className="form-label">Nombres</label>
                  <div className="input-group">
                    <span className="input-group-text"><User size={18} strokeWidth={2.2} /></span>
                    <input
                      className="form-control"
                      type="text"
                      placeholder="Ej. Juan Andrés"
                      value={firstName}
                      onChange={e => setFirstName(sanitizeName(e.target.value))}
                    />
                  </div>
                </div>

                <div className="date-view__field">
                  <label className="form-label">Apellidos</label>
                  <div className="input-group">
                    <span className="input-group-text"><IdCard size={18} strokeWidth={2.2} /></span>
                    <input
                      className="form-control"
                      type="text"
                      placeholder="Ej. Pérez García"
                      value={lastName}
                      onChange={e => setLastName(sanitizeName(e.target.value))}
                    />
                  </div>
                </div>

                <div className="date-view__field">
                  <label className="form-label">Cédula de Identidad</label>
                  <div className="input-group">
                    <span className="input-group-text"><Fingerprint size={18} strokeWidth={2.2} /></span>
                    <input
                      className="form-control"
                      type="text"
                      placeholder="15654987"
                      value={cedula}
                      onChange={e => setCedula(applyCedulaMask(e.target.value))}
                    />
                  </div>
                </div>

                <div className="date-view__field">
                  <label className="form-label">Edad</label>
                  <div className="input-group">
                    <span className="input-group-text"><Cake size={18} strokeWidth={2.2} /></span>
                    <input
                      className="form-control"
                      type="text"
                      placeholder="00"
                      value={age}
                      onChange={e => setAge(sanitizeAge(e.target.value))}
                    />
                  </div>
                </div>

                <div className="date-view__field">
                  <label className="form-label">Número de teléfono</label>
                  <div className="input-group">
                    <span className="input-group-text"><Phone size={18} strokeWidth={2.2} /></span>
                    <input
                      className="form-control"
                      type="tel"
                      placeholder="+00 000 000 0000"
                      value={phone}
                      onChange={e => setPhone(applyPhoneMask(e.target.value))}
                    />
                  </div>
                </div>

                <div className="date-view__field">
                  <label className="form-label">Consultorio</label>
                  <div className="input-group">
                    <span className="input-group-text"><Hospital size={18} strokeWidth={2.2} /></span>
                    <select className="form-select" value={selectedOfficeId} onChange={e => setSelectedOfficeId(e.target.value)}>
                      <option value="">Seleccione ubicación</option>
                      {offices.map(office => (
                        <option key={office.id} value={office.id}>
                          {office.officeNumber}{office.medicalCenter?.name ? ` - ${office.medicalCenter.name}` : ''}{office.locationDetails ? ` (${office.locationDetails})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="date-view__date-layout">
                <div className="date-view__calendar-wrap">
                  <label className="form-label">Fecha de la cita</label>
                  <div className="calendar-box">
                    <div className="calendar-box__header">
                      <span>{monthLabel}</span>
                      <div className="calendar-box__nav">
                        <button type="button" onClick={() => setVisibleDate(date => new Date(date.getFullYear(), date.getMonth() - 1, 1))}>
                          <ChevronLeft size={20} strokeWidth={2.2} />
                        </button>
                        <button type="button" onClick={() => setVisibleDate(date => new Date(date.getFullYear(), date.getMonth() + 1, 1))}>
                          <ChevronRight size={20} strokeWidth={2.2} />
                        </button>
                      </div>
                    </div>

                    <div className="calendar-box__grid">
                      {weekDays.map((day, index) => (
                        <span key={`${day}-${index}`} className="calendar-box__weekday">{day}</span>
                      ))}

                      {calendarDays.map((date, index) => {
                        if (!date) return <span key={`empty-${index}`} className="calendar-box__empty" />
                        const isPast = date.getTime() < today.getTime()
                        const isSelected = selectedDate?.getTime() === date.getTime()
                        return (
                          <button
                            key={date.toISOString()}
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

                <div className="date-view__right-side">
                  <div className="date-view__field">
                    <label className="form-label">Fecha seleccionada</label>
                    <div className="input-group">
                      <span className="input-group-text"><CalendarIcon size={18} strokeWidth={2.2} /></span>
                      <input
                        className="form-control"
                        type="text"
                        readOnly
                        value={formatShortDate(selectedDate)}
                      />
                    </div>
                  </div>

                  <div className="date-view__field">
                    <label className="form-label">Seleccionar hora</label>
                    <div className="time-picker-row">
                      <Clock size={18} className="clock-icon" />
                      <select value={timeHour} onChange={e => setTimeHour(e.target.value)}>
                        {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0')).map(hour => (
                          <option key={hour} value={hour}>{hour}</option>
                        ))}
                      </select>
                      <span>:</span>
                      <select value={timeMinute} onChange={e => setTimeMinute(e.target.value)}>
                        {Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0')).map(minute => (
                          <option key={minute} value={minute}>{minute}</option>
                        ))}
                      </select>
                      <select value={timeMeridiem} onChange={e => setTimeMeridiem(e.target.value)}>
                        <option value="AM">a. m.</option>
                        <option value="PM">p. m.</option>
                      </select>
                    </div>
                  </div>

                  <div className="date-view__field">
                    <label className="form-label">Tipo de consulta</label>
                    <div className="input-group">
                      <span className="input-group-text"><Hospital size={18} strokeWidth={2.2} /></span>
                      <select className="form-select" value={consultationType} onChange={e => setConsultationType(e.target.value)}>
                        <option value="">Seleccionar tipo de consulta</option>
                        <option value="De primera">De primera</option>
                        <option value="Control">Control</option>
                      </select>
                    </div>
                  </div>

                  <div className="date-view__info-callout">
                    <div className="date-view__info-icon"><Info size={18} strokeWidth={2.5} /></div>
                    <p>
                      Las citas están sujetas a disponibilidad. Recibirá una confirmación vía SMS en los próximos 15 minutos.
                    </p>
                  </div>

                  {submitError && <div className="date-view__error-message">{submitError}</div>}
                </div>
              </div>

              {catalogError && <div className="date-view__catalog-error">{catalogError}</div>}

              <div className="date-view__footer-actions">
                <button type="button" className="btn-cancel" onClick={() => navigate(controlPanelPath)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-submit">
                  Agendar cita
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>

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
        onFinish={() => {
          setIsFinalOpen(false)
          navigate(controlPanelPath)
        }}
      />
    </>
  )
}