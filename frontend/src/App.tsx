import { useMemo, useState, type ChangeEvent, type FormEvent } from 'react'
import './App.css'

const consultorios = [
  { value: '', label: 'Seleccione ubicación' },
  { value: 'consultorio-a', label: 'Consultorio A – Clínica Central' },
  { value: 'consultorio-b', label: 'Consultorio B – Centro Cardio' },
  { value: 'consultorio-c', label: 'Consultorio C – Unidad Hospitalaria' },
]

const weekDays = ['D', 'L', 'M', 'M', 'J', 'V', 'S']

const formatCedula = (value: string) => {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  const part1 = digits.slice(0, 3)
  const part2 = digits.slice(3, 10)
  const part3 = digits.slice(10, 11)
  return [part1, part2, part3].filter(Boolean).join('-')
}

const formatPhone = (value: string) => {
  const digits = value.replace(/\D/g, '').slice(0, 12)
  const country = digits.slice(0, 2)
  const area = digits.slice(2, 5)
  const block1 = digits.slice(5, 8)
  const block2 = digits.slice(8, 12)
  const parts = []

  if (country) {
    parts.push(`+${country}`)
  }
  if (area) {
    parts.push(area)
  }
  if (block1) {
    parts.push(block1)
  }
  if (block2) {
    parts.push(block2)
  }

  return parts.join(' ')
}

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

function App() {
  const today = useMemo(() => {
    const current = new Date()
    current.setHours(0, 0, 0, 0)
    return current
  }, [])

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [loginErrors, setLoginErrors] = useState<{ username?: string; password?: string; form?: string }>({})

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [identity, setIdentity] = useState('')
  const [age, setAge] = useState('')
  const [phone, setPhone] = useState('')
  const [consultorio, setConsultorio] = useState('')
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [visibleMonth, setVisibleMonth] = useState(today.getMonth())
  const [visibleYear, setVisibleYear] = useState(today.getFullYear())
  const [appointmentErrors, setAppointmentErrors] = useState<Record<string, string>>({})
  const [submissionMessage, setSubmissionMessage] = useState('')

  const calendarDays = useMemo(
    () => getCalendarDays(visibleYear, visibleMonth),
    [visibleMonth, visibleYear],
  )

  const selectedDateText = selectedDate ? formatDate(selectedDate) : ''

  const handleIdentityChange = (event: ChangeEvent<HTMLInputElement>) => {
    setIdentity(formatCedula(event.target.value))
  }

  const handlePhoneChange = (event: ChangeEvent<HTMLInputElement>) => {
    setPhone(formatPhone(event.target.value))
  }

  const handleAgeChange = (event: ChangeEvent<HTMLInputElement>) => {
    const digits = event.target.value.replace(/\D/g, '').slice(0, 3)
    setAge(digits)
  }

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
    setAppointmentErrors((current: Record<string, string>) => ({ ...current, date: '' }))
  }

  const changeMonth = (delta: number) => {
    setVisibleMonth((currentMonth: number) => {
      const nextMonth = currentMonth + delta
      if (nextMonth < 0) {
        setVisibleYear((currentYear: number) => currentYear - 1)
        return 11
      }
      if (nextMonth > 11) {
        setVisibleYear((currentYear: number) => currentYear + 1)
        return 0
      }
      return nextMonth
    })
  }

  const validateLogin = () => {
    const nextErrors: Record<string, string> = {}

    if (!username.trim()) {
      nextErrors.username = 'El usuario es obligatorio.'
    }
    if (!password) {
      nextErrors.password = 'La contraseña es obligatoria.'
    }

    return nextErrors
  }

  const validate = () => {
    const nextErrors: Record<string, string> = {}

    if (!firstName.trim()) {
      nextErrors.firstName = 'Los nombres son obligatorios.'
    }
    if (!lastName.trim()) {
      nextErrors.lastName = 'Los apellidos son obligatorios.'
    }
    if (!identity.trim() || identity.replace(/\D/g, '').length !== 11) {
      nextErrors.identity = 'Ingrese una cédula válida con el formato 000-0000000-0.'
    }
    const ageValue = Number(age)
    if (!age || Number.isNaN(ageValue) || ageValue <= 0) {
      nextErrors.age = 'Ingrese una edad válida.'
    }
    if (!phone.trim() || phone.replace(/\D/g, '').length < 10) {
      nextErrors.phone = 'Ingrese un número de teléfono válido.'
    }
    if (!consultorio) {
      nextErrors.consultorio = 'Seleccione un consultorio.'
    }
    if (!selectedDate) {
      nextErrors.date = 'Seleccione la fecha de la cita.'
    }

    return nextErrors
  }

  const handleLoginSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const nextErrors = validateLogin()

    if (Object.keys(nextErrors).length > 0) {
      setLoginErrors(nextErrors)
      return
    }

    if (username.trim() !== 'admin_01' || password !== '12345678') {
      setLoginErrors({ form: 'Usuario o contraseña incorrectos.' })
      return
    }

    setLoginErrors({})
    window.alert('Inicio de sesión exitoso. Bienvenido al panel de administración.')
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmissionMessage('')
    const nextErrors = validate()

    if (Object.keys(nextErrors).length > 0) {
      setAppointmentErrors(nextErrors)
      return
    }

    setAppointmentErrors({})
    setSubmissionMessage(
      'Solicitud enviada. Recibirá una confirmación vía SMS en los próximos 15 minutos.',
    )
  }

  const handleCancel = () => {
    setFirstName('')
    setLastName('')
    setIdentity('')
    setAge('')
    setPhone('')
    setConsultorio('')
    setSelectedDate(null)
    setVisibleMonth(today.getMonth())
    setVisibleYear(today.getFullYear())
    setAppointmentErrors({})
    setSubmissionMessage('')
  }

  const [activePage, setActivePage] = useState<'landing' | 'booking'>('landing')

  const monthLabel = useMemo(() => {
    return new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric' }).format(
      new Date(visibleYear, visibleMonth, 1),
    )
  }, [visibleMonth, visibleYear])

  const showBookingPage = () => {
    setActivePage('booking')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const showLandingPage = () => {
    setActivePage('landing')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <main className="landing-shell">
      <header className="topbar">
        <a className="brand" href="#inicio" aria-label="EC - Medical Control">
          <span className="brand-mark">EC</span>
          <span className="brand-text">EC - Medical Control</span>
        </a>

        <nav className="main-nav" aria-label="Navegación principal">
          <button type="button" className="nav-link" onClick={showLandingPage}>
            Servicios
          </button>
          <button type="button" className="nav-link" onClick={showLandingPage}>
            Pacientes
          </button>
          <button type="button" className="nav-link" onClick={showLandingPage}>
            Sobre mí
          </button>
          <button type="button" className="nav-link" onClick={showLandingPage}>
            Contacto
          </button>
        </nav>

        <div className="topbar-actions">
          <button type="button" className="login-link" onClick={showLandingPage}>
            Acceder
          </button>
          <button type="button" className="primary-chip" onClick={showBookingPage}>
            Agendar cita
          </button>
        </div>
      </header>

      {activePage === 'landing' ? (
        <section className="page-grid">
          <article className="hero-copy">
            <div className="eyebrow-row">
              <span className="eyebrow-badge" aria-hidden="true">
                ❤️
              </span>
              <p className="eyebrow">Atención especializada</p>
            </div>

            <h1>Atención Cardiológica Especializada</h1>

            <p className="hero-summary">
              Gestione su salud cardiovascular. Solicite su cita médica de forma rápida y
              sencilla a través de nuestra aplicación web optimizada.
            </p>

            <div className="hero-actions">
              <button type="button" className="primary-button" onClick={showBookingPage}>
                <span aria-hidden="true">📅</span>
                Agendar cita
              </button>
              <button type="button" className="secondary-button" onClick={showLandingPage}>
                Saber más
              </button>
            </div>

            <div className="metrics-row" aria-label="Métricas destacadas">
              <article>
                <strong>15+</strong>
                <span>Años de experiencia</span>
              </article>
              <article>
                <strong>5k+</strong>
                <span>Pacientes atendidos</span>
              </article>
            </div>
          </article>

          <aside className="login-panel" id="acceso">
            <div className="shield-icon" aria-hidden="true">
              <span>🛡️</span>
            </div>

            <p className="panel-title">Panel de Administración</p>
            <p className="panel-subtitle">Inicia sesión en el panel de administración</p>

            <form className="login-form" onSubmit={handleLoginSubmit} noValidate>
              <label htmlFor="username">Usuario</label>
              <div className={`field-wrap ${loginErrors.username ? 'field-error' : ''}`}>
                <span className="field-icon" aria-hidden="true">
                  👤
                </span>
                <input
                  id="username"
                  type="text"
                  placeholder="ej. admin_01"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  aria-invalid={Boolean(loginErrors.username)}
                  aria-describedby={loginErrors.username ? 'username-error' : undefined}
                />
              </div>
              {loginErrors.username && (
                <p className="field-message" id="username-error">
                  {loginErrors.username}
                </p>
              )}

              <label htmlFor="password">Contraseña</label>
              <div className={`field-wrap ${loginErrors.password ? 'field-error' : ''}`}>
                <span className="field-icon" aria-hidden="true">
                  🔒
                </span>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Contraseña"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  aria-invalid={Boolean(loginErrors.password)}
                  aria-describedby={loginErrors.password ? 'password-error' : undefined}
                />
                <button
                  className="ghost-icon"
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
              {loginErrors.password && (
                <p className="field-message" id="password-error">
                  {loginErrors.password}
                </p>
              )}

              <div className="field-meta">
                <label className="remember-row">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(event) => setRememberMe(event.target.checked)}
                  />
                  <span>Recordarme</span>
                </label>
                <button type="button" className="link-button" onClick={showLandingPage}>
                  ¿Olvidó su contraseña?
                </button>
              </div>

              {loginErrors.form && <p className="field-message field-message--form">{loginErrors.form}</p>}

              <button className="submit-button" type="submit">
                Acceder al sistema <span aria-hidden="true">→</span>
              </button>
            </form>

            <div className="support-card">
              <span className="support-icon" aria-hidden="true">
                i
              </span>
              <p>
                Este acceso es exclusivo para personal autorizado. Si tiene problemas de acceso,
                contacte al soporte técnico de sistemas.
              </p>
            </div>
          </aside>
        </section>
      ) : (
        <section className="booking-shell">
          <div className="booking-card">
            <div className="booking-header">
              <h1>Agendar Cita Médica</h1>
              <p>
                Complete el formulario a continuación para programar su consulta de cardiología
                especializada.
              </p>
            </div>

            <form className="booking-form" onSubmit={handleSubmit} noValidate>
              <div className="form-grid">
                <div>
                  <label htmlFor="firstName">Nombres</label>
                  <div className={`field-wrap ${appointmentErrors.firstName ? 'field-error' : ''}`}>
                    <span className="field-icon" aria-hidden="true">
                      👤
                    </span>
                    <input
                      id="firstName"
                      type="text"
                      placeholder="Ej. Juan Andrés"
                      value={firstName}
                      onChange={(event) => setFirstName(event.target.value)}
                      aria-invalid={Boolean(appointmentErrors.firstName)}
                      aria-describedby={appointmentErrors.firstName ? 'firstName-error' : undefined}
                    />
                  </div>
                  {appointmentErrors.firstName && (
                    <p className="field-message" id="firstName-error">
                      {appointmentErrors.firstName}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="lastName">Apellidos</label>
                  <div className={`field-wrap ${appointmentErrors.lastName ? 'field-error' : ''}`}>
                    <span className="field-icon" aria-hidden="true">
                      🆔
                    </span>
                    <input
                      id="lastName"
                      type="text"
                      placeholder="Ej. Pérez García"
                      value={lastName}
                      onChange={(event) => setLastName(event.target.value)}
                      aria-invalid={Boolean(appointmentErrors.lastName)}
                      aria-describedby={appointmentErrors.lastName ? 'lastName-error' : undefined}
                    />
                  </div>
                  {appointmentErrors.lastName && (
                    <p className="field-message" id="lastName-error">
                      {appointmentErrors.lastName}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="identity">Cédula de Identidad</label>
                  <div className={`field-wrap ${appointmentErrors.identity ? 'field-error' : ''}`}>
                    <span className="field-icon" aria-hidden="true">
                      🦶
                    </span>
                    <input
                      id="identity"
                      type="text"
                      placeholder="000-0000000-0"
                      value={identity}
                      onChange={handleIdentityChange}
                      maxLength={13}
                      inputMode="numeric"
                      aria-invalid={Boolean(appointmentErrors.identity)}
                      aria-describedby={appointmentErrors.identity ? 'identity-error' : undefined}
                    />
                  </div>
                  {appointmentErrors.identity && (
                    <p className="field-message" id="identity-error">
                      {appointmentErrors.identity}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="age">Edad</label>
                  <div className={`field-wrap ${appointmentErrors.age ? 'field-error' : ''}`}>
                    <span className="field-icon" aria-hidden="true">
                      🎂
                    </span>
                    <input
                      id="age"
                      type="text"
                      placeholder="00"
                      value={age}
                      onChange={handleAgeChange}
                      inputMode="numeric"
                      maxLength={3}
                      aria-invalid={Boolean(appointmentErrors.age)}
                      aria-describedby={appointmentErrors.age ? 'age-error' : undefined}
                    />
                  </div>
                  {appointmentErrors.age && (
                    <p className="field-message" id="age-error">
                      {appointmentErrors.age}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="phone">Número de teléfono</label>
                  <div className={`field-wrap ${appointmentErrors.phone ? 'field-error' : ''}`}>
                    <span className="field-icon" aria-hidden="true">
                      📞
                    </span>
                    <input
                      id="phone"
                      type="text"
                      placeholder="+00 000 000 0000"
                      value={phone}
                      onChange={handlePhoneChange}
                      inputMode="tel"
                      aria-invalid={Boolean(appointmentErrors.phone)}
                      aria-describedby={appointmentErrors.phone ? 'phone-error' : undefined}
                    />
                  </div>
                  {appointmentErrors.phone && (
                    <p className="field-message" id="phone-error">
                      {appointmentErrors.phone}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="consultorio">Consultorio</label>
                  <div className={`field-wrap ${appointmentErrors.consultorio ? 'field-error' : ''}`}>
                    <span className="field-icon" aria-hidden="true">
                      🏥
                    </span>
                    <select
                      id="consultorio"
                      value={consultorio}
                      onChange={(event) => setConsultorio(event.target.value)}
                      aria-invalid={Boolean(appointmentErrors.consultorio)}
                      aria-describedby={appointmentErrors.consultorio ? 'consultorio-error' : undefined}
                    >
                      {consultorios.map((option) => (
                        <option key={option.value} value={option.value} disabled={option.value === ''}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  {appointmentErrors.consultorio && (
                    <p className="field-message" id="consultorio-error">
                      {appointmentErrors.consultorio}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="date">Fecha de la cita</label>
                  <div className={`field-wrap date-field-wrap ${appointmentErrors.date ? 'field-error' : ''}`}>
                    <input
                      id="date"
                      type="text"
                      placeholder="DD/MM/AAAA"
                      value={selectedDateText}
                      readOnly
                      aria-invalid={Boolean(appointmentErrors.date)}
                      aria-describedby={appointmentErrors.date ? 'date-error' : undefined}
                    />
                    <span className="date-input-icon" aria-hidden="true">
                      📅
                    </span>
                  </div>
                  {appointmentErrors.date && (
                    <p className="field-message" id="date-error">
                      {appointmentErrors.date}
                    </p>
                  )}
                </div>
              </div>

              <div className="booking-layout">
                <div className="calendar-shell">
                  <div className="calendar-header">
                    <button type="button" className="calendar-nav" onClick={() => changeMonth(-1)}>
                      ‹
                    </button>
                    <strong>{monthLabel}</strong>
                    <button type="button" className="calendar-nav" onClick={() => changeMonth(1)}>
                      ›
                    </button>
                  </div>

                  <div className="calendar-grid">
                    {weekDays.map((day) => (
                      <span key={day} className="calendar-weekday">
                        {day}
                      </span>
                    ))}

                    {calendarDays.map((date, index) => {
                      if (!date) {
                        return <span key={index} className="calendar-empty" />
                      }

                      const isPast = date.getTime() < today.getTime()
                      const isSelected = selectedDate?.getTime() === date.getTime()

                      return (
                        <button
                          key={date.toISOString()}
                          type="button"
                          className={`calendar-day ${isSelected ? 'selected' : ''} ${isPast ? 'disabled' : ''}`}
                          onClick={() => handleSelectDay(date)}
                          disabled={isPast}
                        >
                          {date.getDate()}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div className="booking-sidebar">
                  <div className="callout-card" role="status">
                    <span className="support-icon" aria-hidden="true">
                      ℹ️
                    </span>
                    <p>
                      Las citas están sujetas a disponibilidad. Recibirá una confirmación vía SMS en
                      los próximos 15 minutos.
                    </p>
                  </div>

                  {submissionMessage && <p className="form-success">{submissionMessage}</p>}

                  <div className="button-row">
                    <button type="button" className="button-outline" onClick={handleCancel}>
                      Cancelar
                    </button>
                    <button type="submit" className="submit-button">
                      Agendar cita
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </section>
      )}

      <footer className="site-footer">
        <p>© 2026 EC – Medical Control.</p>
        <div className="footer-links">
          <a href="#privacidad">Privacidad</a>
          <a href="#terminos">Términos de Uso</a>
          <a href="#ubicacion">Ubicación</a>
          <a href="#contacto">Contacto</a>
        </div>
      </footer>
    </main>
  )
}

export default App
