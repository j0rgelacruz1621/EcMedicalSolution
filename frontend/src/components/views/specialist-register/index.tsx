import { useState } from 'react'
import { Link } from 'react-router-dom'
import Footer from '../../footer'
import './style.scss'
import logo from '../../../assets/LOGO-HEADER.jpeg'
import { Info, Upload, AlertCircle, CheckCircle } from 'lucide-react'
import { registerDoctor, type DoctorRequestBody } from '../../../services/doctors/doctor-services'

type FormState = {
  fullName: string
  identityCard: string
  mpps: string
  email: string
  password: string
  confirmPassword: string
  specialty: string
  rif: string
  cm: string
  phone: string
  bio: string
  profileFileName: string
  acceptTerms: boolean
}

type FormErrors = Partial<Record<keyof FormState, string>>

const initialForm: FormState = {
  fullName: '',
  identityCard: '',
  mpps: '',
  email: '',
  password: '',
  confirmPassword: '',
  specialty: '',
  rif: '',
  cm: '',
  phone: '',
  bio: '',
  profileFileName: '',
  acceptTerms: false,
}

const specialties = [
  'Cardiología',
  'Dermatología',
  'Endocrinología',
  'Gastroenterología',
  'Neurología',
  'Pediatría',
  'Psiquiatría',
  'Traumatología',
]

export default function SpecialistRegister() {
  const [form, setForm] = useState<FormState>(initialForm)
  const [errors, setErrors] = useState<FormErrors>({})
  const [loading, setLoading] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [isSuccess, setIsSuccess] = useState(false)

  const handleChange = (field: keyof FormState, value: string | boolean) => {
    setForm(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const validate = () => {
    const nextErrors: FormErrors = {}
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    if (!form.fullName.trim()) nextErrors.fullName = 'Este campo es obligatorio.'
    if (!form.identityCard.trim()) nextErrors.identityCard = 'Este campo es obligatorio.'
    if (!form.mpps.trim()) nextErrors.mpps = 'Este campo es obligatorio.'
    if (!form.email.trim()) nextErrors.email = 'Este campo es obligatorio.'
    else if (!emailRegex.test(form.email)) nextErrors.email = 'Ingresa un correo válido.'

    if (!form.password.trim()) nextErrors.password = 'Este campo es obligatorio.'
    if (!form.confirmPassword.trim()) nextErrors.confirmPassword = 'Este campo es obligatorio.'
    else if (form.password !== form.confirmPassword) nextErrors.confirmPassword = 'Las contraseñas no coinciden.'

    if (!form.specialty) nextErrors.specialty = 'Seleccione una especialidad.'
    if (!form.cm.trim()) nextErrors.cm = 'Este campo es obligatorio.'
    if (!form.phone.trim()) nextErrors.phone = 'Este campo es obligatorio.'
    if (!form.bio.trim()) nextErrors.bio = 'Este campo es obligatorio.'
    else if (form.bio.trim().length > 250) nextErrors.bio = 'Máximo 250 caracteres.'
    if (!form.acceptTerms) nextErrors.acceptTerms = 'Debes aceptar los términos.'

    return nextErrors
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const nextErrors = validate()
    setErrors(nextErrors)

    if (Object.keys(nextErrors).length === 0) {
      setLoading(true)
      setServerError(null)
      setIsSuccess(false)

      const nameParts = form.fullName.trim().split(/\s+/)
      const firstName = nameParts[0] || ''
      const lastName = nameParts.slice(1).join(' ') || ' '

      const body: DoctorRequestBody = {
        licenseNumber: form.mpps,
        nationalId: form.identityCard,
        firstName,
        lastName,
        email: form.email,
        phone: form.phone,
        specialty: form.specialty,
        officeId: 1,
      }

      try {
        const response = await registerDoctor(body)
        console.log('Respuesta del servidor:', response)
        setIsSuccess(true)
        setForm(initialForm)
      } catch (err: any) {
        const message = err.response?.data?.message || 'Error de conexión con el servidor. Inténtalo más tarde.'
        setServerError(message)
      } finally {
        setLoading(false)
      }
    }
  }

  return (
    <div className="theme-blue">
      <div className="sr-wrapper">
        <header className="sr-header">
          <div className="sr-header__inner">
            <div className="sr-brand">
              <img src={logo} alt="Logo EC Medical Control" className="sr-brand__logo" />
              <span className="sr-brand__text">EC – Medical Control</span>
            </div>
            <Link to="/" className="sr-login-link">
              Iniciar Sesión
            </Link>
          </div>
        </header>

        <main className="sr-page">
          <section className="sr-card">
            <h1 className="sr-title">Registro de Especialistas</h1>
            <p className="sr-subtitle">Completa el formulario para crear tu cuenta profesional en EC – Medical Control.</p>

            {serverError && (
              <div className="sr-backend-error">
                <AlertCircle size={18} /> {serverError}
              </div>
            )}

            {isSuccess && (
              <div className="sr-backend-success">
                <CheckCircle size={18} /> ¡Registro exitoso! Ya puedes iniciar sesión.
              </div>
            )}

            <form className="sr-form" onSubmit={handleSubmit} noValidate>
              <div className="sr-grid">
                <div className="sr-column">
                  <div className="sr-field">
                    <label className="sr-label" htmlFor="fullName">
                      Nombres y Apellidos <span className="sr-required">*</span>
                    </label>
                    <input
                      id="fullName"
                      type="text"
                      disabled={loading}
                      placeholder="Ingrese sus nombres y apellidos"
                      className={errors.fullName ? 'is-error' : ''}
                      value={form.fullName}
                      onChange={e => handleChange('fullName', e.target.value.replace(/[^A-Za-zÁÉÍÓÚáéíóúñÑ\s]/g, ''))}
                      aria-required="true"
                      aria-invalid={Boolean(errors.fullName)}
                    />
                    {errors.fullName && <small className="sr-error">{errors.fullName}</small>}
                  </div>

                  <div className="sr-field">
                    <label className="sr-label" htmlFor="identityCard">
                      Cédula de Identidad <span className="sr-required">*</span>
                    </label>
                    <input
                      id="identityCard"
                      type="text"
                      disabled={loading}
                      placeholder="Ej: 12345678"
                      className={errors.identityCard ? 'is-error' : ''}
                      value={form.identityCard}
                      onChange={e => handleChange('identityCard', e.target.value.replace(/\D/g, ''))}
                      aria-required="true"
                      aria-invalid={Boolean(errors.identityCard)}
                    />
                    {errors.identityCard && <small className="sr-error">{errors.identityCard}</small>}
                  </div>

                  <div className="sr-field">
                    <label className="sr-label" htmlFor="mpps">
                      Número de MPPS <span className="sr-required">*</span>
                    </label>
                    <input
                      id="mpps"
                      type="text"
                      disabled={loading}
                      placeholder="Número de registro MPPS"
                      className={errors.mpps ? 'is-error' : ''}
                      value={form.mpps}
                      onChange={e => handleChange('mpps', e.target.value.replace(/\D/g, ''))}
                      aria-required="true"
                      aria-invalid={Boolean(errors.mpps)}
                    />
                    {errors.mpps && <small className="sr-error">{errors.mpps}</small>}
                  </div>

                  <div className="sr-field">
                    <label className="sr-label" htmlFor="email">
                      Correo Electrónico <span className="sr-required">*</span>
                    </label>
                    <input
                      id="email"
                      type="email"
                      disabled={loading}
                      placeholder="ejemplo@correo.com"
                      className={errors.email ? 'is-error' : ''}
                      value={form.email}
                      onChange={e => handleChange('email', e.target.value)}
                      aria-required="true"
                      aria-invalid={Boolean(errors.email)}
                    />
                    {errors.email && <small className="sr-error">{errors.email}</small>}
                  </div>

                  <div className="sr-field">
                    <label className="sr-label" htmlFor="password">
                      Contraseña <span className="sr-required">*</span>
                    </label>
                    <input
                      id="password"
                      type="password"
                      disabled={loading}
                      placeholder="Ingrese su contraseña"
                      className={errors.password ? 'is-error' : ''}
                      value={form.password}
                      onChange={e => handleChange('password', e.target.value)}
                      aria-required="true"
                      aria-invalid={Boolean(errors.password)}
                    />
                    {errors.password && <small className="sr-error">{errors.password}</small>}
                  </div>

                  <div className="sr-field">
                    <label className="sr-label">Fotografía de Perfil Profesional</label>
                    <div className="sr-file-custom">
                      <label htmlFor="file-up" className={`sr-file-btn ${loading ? 'disabled' : ''}`}>
                        <Upload size={16} /> Seleccionar archivo
                      </label>
                        
                      <input
                        id="file-up"
                        type="file"
                        disabled={loading}
                        accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                        onChange={e => handleChange('profileFileName', e.target.files?.[0]?.name || '')}
                        aria-label="Seleccionar fotografía de perfil profesional"
                        style={{ display: 'none' }}
                      />

                      <span className="sr-file-status">
                        {form.profileFileName || 'Ningún archivo seleccionado'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="sr-column">
                  <div className="sr-field">
                    <label className="sr-label" htmlFor="specialty">
                      Especialidad <span className="sr-required">*</span>
                    </label>
                    <select
                      id="specialty"
                      disabled={loading}
                      className={errors.specialty ? 'is-error' : ''}
                      value={form.specialty}
                      onChange={e => handleChange('specialty', e.target.value)}
                      aria-required="true"
                      aria-invalid={Boolean(errors.specialty)}
                    >
                      <option value="">Seleccione una especialidad</option>
                      {specialties.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                    {errors.specialty && <small className="sr-error">{errors.specialty}</small>}
                  </div>

                  <div className="sr-field">
                    <label className="sr-label" htmlFor="rif">
                      RIF
                    </label>
                    <input
                      id="rif"
                      type="text"
                      disabled={loading}
                      placeholder="Ej: J-12345678-0"
                      value={form.rif}
                      onChange={e => handleChange('rif', e.target.value.toUpperCase())}
                    />
                  </div>

                  <div className="sr-field">
                    <label className="sr-label" htmlFor="cm">
                      Número de CM <span className="sr-required">*</span>
                    </label>
                    <input
                      id="cm"
                      type="text"
                      disabled={loading}
                      placeholder="Colegio de Médicos"
                      className={errors.cm ? 'is-error' : ''}
                      value={form.cm}
                      onChange={e => handleChange('cm', e.target.value.replace(/\D/g, ''))}
                      aria-required="true"
                      aria-invalid={Boolean(errors.cm)}
                    />
                    {errors.cm && <small className="sr-error">{errors.cm}</small>}
                  </div>

                  <div className="sr-field">
                    <label className="sr-label" htmlFor="phone">
                      Número de Teléfono <span className="sr-required">*</span>
                      <span
                        className="sr-info-wrapper"
                        title="Este es el número de contacto directo para que los pacientes puedan comunicarse fácilmente para consultas y citas."
                        aria-label="Más información sobre el número de teléfono"
                      >
                        <Info size={14} className="sr-info-icon" />
                      </span>
                    </label>
                    <input
                      id="phone"
                      type="tel"
                      disabled={loading}
                      placeholder="Ej: 04121234567"
                      className={errors.phone ? 'is-error' : ''}
                      value={form.phone}
                      onChange={e => handleChange('phone', e.target.value.replace(/\D/g, ''))}
                      aria-required="true"
                      aria-invalid={Boolean(errors.phone)}
                    />
                    {errors.phone && <small className="sr-error">{errors.phone}</small>}
                  </div>

                  <div className="sr-field">
                    <label className="sr-label" htmlFor="confirmPassword">
                      Confirmar Contraseña <span className="sr-required">*</span>
                    </label>
                    <input
                      id="confirmPassword"
                      type="password"
                      disabled={loading}
                      placeholder="Repita la contraseña"
                      className={errors.confirmPassword ? 'is-error' : ''}
                      value={form.confirmPassword}
                      onChange={e => handleChange('confirmPassword', e.target.value)}
                      aria-required="true"
                      aria-invalid={Boolean(errors.confirmPassword)}
                    />
                    {errors.confirmPassword && <small className="sr-error">{errors.confirmPassword}</small>}
                  </div>

                  <div className="sr-field sr-field--textarea">
                    <label className="sr-label" htmlFor="bio">
                      Descripción de Experiencia y Servicios <span className="sr-required">*</span>
                      <span
                        className="sr-info-wrapper"
                        title="En este campo, puedes describir tu trayectoria profesional y los servicios que ofreces para que los pacientes conozcan tu perfil."
                        aria-label="Más información sobre la descripción profesional"
                      >
                        <Info size={14} className="sr-info-icon" />
                      </span>
                    </label>
                    <textarea
                      id="bio"
                      disabled={loading}
                      maxLength={250}
                      placeholder="Máximo 250 caracteres"
                      className={errors.bio ? 'is-error' : ''}
                      value={form.bio}
                      onChange={e => handleChange('bio', e.target.value.slice(0, 250))}
                      aria-required="true"
                      aria-invalid={Boolean(errors.bio)}
                    />
                    <div className="sr-bio-footer">
                      <small>{form.bio.length}/250</small>
                    </div>
                    {errors.bio && <small className="sr-error">{errors.bio}</small>}
                  </div>
                </div>
              </div>

              <div className="sr-terms">
                <input
                  type="checkbox"
                  id="terms"
                  className="sr-terms-checkbox"
                  disabled={loading}
                  checked={form.acceptTerms}
                  onChange={e => handleChange('acceptTerms', e.target.checked)}
                  aria-required="true"
                />
                <label htmlFor="terms">
                  Acepto los <a href="#" className="sr-link-unified">términos de servicio y la política de privacidad</a>.
                </label>
              </div>
              {errors.acceptTerms && <small className="sr-error sr-error--inline">{errors.acceptTerms}</small>}

              <button type="submit" className="sr-submit-btn" disabled={loading}>
                {loading ? 'Registrando...' : 'Registrarse'}
              </button>
            </form>
          </section>
        </main>

        <Footer />
      </div>
    </div>
  )
}
