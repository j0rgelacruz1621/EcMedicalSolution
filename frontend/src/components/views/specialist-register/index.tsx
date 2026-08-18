import { useState } from 'react'
import { Link } from 'react-router-dom'
import Footer from '../../footer'
import './style.scss'
import logo from '../../../assets/LOGO-HEADER.jpeg'

type FormState = {
  fullName: string
  identityCard: string
  mpps: string
  email: string
  password: string
  specialty: string
  rif: string
  cm: string
  phone: string
  confirmPassword: string
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
  specialty: '',
  rif: '',
  cm: '',
  phone: '',
  confirmPassword: '',
  bio: '',
  profileFileName: '',
  acceptTerms: false
}

const specialties = [
  'Seleccione una especialidad',
  'Cardiología',
  'Dermatología',
  'Endocrinología',
  'Gastroenterología',
  'Neurología',
  'Pediatría',
  'Psiquiatría',
  'Traumatología'
]

const validateEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
const sanitizeLetters = (value: string) => value.replace(/[^A-Za-zÁÉÍÓÚáéíóúÜüÑñ' -]/g, '')
const sanitizeNumbers = (value: string) => value.replace(/\D/g, '')
const sanitizeRif = (value: string) => value.replace(/[^A-Za-z0-9-]/g, '').toUpperCase()

export default function SpecialistRegister() {
  const [form, setForm] = useState<FormState>(initialForm)
  const [errors, setErrors] = useState<FormErrors>({})

  const handleChange = (field: keyof FormState, value: string | boolean) => {
    setForm(prev => ({ ...prev, [field]: value }))
    setErrors(prev => ({ ...prev, [field]: '' }))
  }

  const validate = () => {
    const nextErrors: FormErrors = {}

    const requiredFields: Array<keyof FormState> = [
      'fullName',
      'identityCard',
      'mpps',
      'email',
      'password',
      'specialty',
      'cm',
      'phone',
      'confirmPassword',
      'bio'
    ]

    requiredFields.forEach(field => {
      const value = form[field]
      if (typeof value === 'string' && !value.trim()) {
        nextErrors[field] = 'Este campo es obligatorio.'
      }
    })

    if (form.email && !validateEmail(form.email)) {
      nextErrors.email = 'Ingresa un correo válido.'
    }

    if (form.identityCard && !/^\d+$/.test(form.identityCard)) {
      nextErrors.identityCard = 'Este campo solo acepta números.'
    }

    if (form.mpps && !/^\d+$/.test(form.mpps)) {
      nextErrors.mpps = 'Este campo solo acepta números.'
    }

    if (form.cm && !/^\d+$/.test(form.cm)) {
      nextErrors.cm = 'Este campo solo acepta números.'
    }

    if (form.phone && !/^\d+$/.test(form.phone)) {
      nextErrors.phone = 'Este campo solo acepta números.'
    }

    if (form.password && form.confirmPassword && form.password !== form.confirmPassword) {
      nextErrors.confirmPassword = 'Las contraseñas no coinciden.'
    }

    if (form.bio && form.bio.length > 250) {
      nextErrors.bio = 'Máximo 250 caracteres.'
    }

    if (!form.acceptTerms) {
      nextErrors.acceptTerms = 'Debes aceptar los términos.'
    }

    return nextErrors
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const nextErrors = validate()
    setErrors(nextErrors)

    if (Object.keys(nextErrors).length === 0) {
      console.log('Formulario válido', form)
    }
  }

  return (
    <>
      <header className="sr-header">
        <div className="sr-header__inner">
          <div className="sr-brand" aria-label="EC Medical Control">
            <img src={logo} alt="EC Medical Control" className="sr-brand__logo" />
            <span className="sr-brand__text">EC – Medical Control</span>
          </div>

          <Link to="/" className="sr-login-link">
            Iniciar Sesión
          </Link>
        </div>
      </header>

      <main className="sr-page fade show">
        <section className="sr-card" aria-label="Formulario de registro de especialistas">
          <h1 className="sr-title">Registro de Especialistas</h1>
          <p className="sr-subtitle">Completa el formulario para crear tu cuenta profesional en EC – Medical Control.</p>

          <form className="sr-form" onSubmit={handleSubmit} noValidate>
            <div className="sr-grid">
              <div className="sr-field">
                <label htmlFor="fullName" className="sr-label">
                  Nombres y Apellidos <span aria-hidden="true">*</span>
                </label>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  value={form.fullName}
                  onChange={e => handleChange('fullName', sanitizeLetters(e.target.value))}
                  aria-invalid={Boolean(errors.fullName)}
                  aria-required="true"
                  className={errors.fullName ? 'is-error' : ''}
                />
                {errors.fullName && <small className="sr-error">{errors.fullName}</small>}
              </div>

              <div className="sr-field">
                <label htmlFor="specialty" className="sr-label">
                  Especialidad <span aria-hidden="true">*</span>
                </label>
                <select
                  id="specialty"
                  name="specialty"
                  value={form.specialty}
                  onChange={e => handleChange('specialty', e.target.value)}
                  aria-invalid={Boolean(errors.specialty)}
                  aria-required="true"
                  className={errors.specialty ? 'is-error' : ''}
                >
                  {specialties.map(option => (
                    <option key={option} value={option === 'Seleccione una especialidad' ? '' : option}>
                      {option}
                    </option>
                  ))}
                </select>
                {errors.specialty && <small className="sr-error">{errors.specialty}</small>}
              </div>

              <div className="sr-field">
                <label htmlFor="identityCard" className="sr-label">
                  Cédula de Identidad <span aria-hidden="true">*</span>
                </label>
                <input
                  id="identityCard"
                  name="identityCard"
                  type="text"
                  value={form.identityCard}
                  onChange={e => handleChange('identityCard', sanitizeNumbers(e.target.value))}
                  aria-invalid={Boolean(errors.identityCard)}
                  aria-required="true"
                  className={errors.identityCard ? 'is-error' : ''}
                />
                {errors.identityCard && <small className="sr-error">{errors.identityCard}</small>}
              </div>

              <div className="sr-field">
                <label htmlFor="rif" className="sr-label">RIF</label>
                <input
                  id="rif"
                  name="rif"
                  type="text"
                  value={form.rif}
                  onChange={e => handleChange('rif', sanitizeRif(e.target.value))}
                />
              </div>

              <div className="sr-field">
                <label htmlFor="mpps" className="sr-label">
                  Número de MPPS <span aria-hidden="true">*</span>
                </label>
                <input
                  id="mpps"
                  name="mpps"
                  type="text"
                  value={form.mpps}
                  onChange={e => handleChange('mpps', sanitizeNumbers(e.target.value))}
                  aria-invalid={Boolean(errors.mpps)}
                  aria-required="true"
                  className={errors.mpps ? 'is-error' : ''}
                />
                {errors.mpps && <small className="sr-error">{errors.mpps}</small>}
              </div>

              <div className="sr-field">
                <label htmlFor="cm" className="sr-label">
                  Número de CM <span aria-hidden="true">*</span>
                </label>
                <input
                  id="cm"
                  name="cm"
                  type="text"
                  value={form.cm}
                  onChange={e => handleChange('cm', sanitizeNumbers(e.target.value))}
                  aria-invalid={Boolean(errors.cm)}
                  aria-required="true"
                  className={errors.cm ? 'is-error' : ''}
                />
                {errors.cm && <small className="sr-error">{errors.cm}</small>}
              </div>

              <div className="sr-field">
                <label htmlFor="email" className="sr-label">
                  Correo Electrónico <span aria-hidden="true">*</span>
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={e => handleChange('email', e.target.value)}
                  aria-invalid={Boolean(errors.email)}
                  aria-required="true"
                  className={errors.email ? 'is-error' : ''}
                />
                {errors.email && <small className="sr-error">{errors.email}</small>}
              </div>

              <div className="sr-field">
                <label htmlFor="phone" className="sr-label">
                  Número de Teléfono <span aria-hidden="true">*</span>
                  <span className="sr-tooltip" title="Se usará para contacto con pacientes y coordinación de citas." aria-label="Información del teléfono">
                    i
                  </span>
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={form.phone}
                  onChange={e => handleChange('phone', sanitizeNumbers(e.target.value))}
                  aria-invalid={Boolean(errors.phone)}
                  aria-required="true"
                  className={errors.phone ? 'is-error' : ''}
                />
                {errors.phone && <small className="sr-error">{errors.phone}</small>}
              </div>

              <div className="sr-field">
                <label htmlFor="password" className="sr-label">
                  Contraseña <span aria-hidden="true">*</span>
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={e => handleChange('password', e.target.value)}
                  aria-invalid={Boolean(errors.password)}
                  aria-required="true"
                  className={errors.password ? 'is-error' : ''}
                />
                {errors.password && <small className="sr-error">{errors.password}</small>}
              </div>

              <div className="sr-field">
                <label htmlFor="confirmPassword" className="sr-label">
                  Confirmar Contraseña <span aria-hidden="true">*</span>
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={form.confirmPassword}
                  onChange={e => handleChange('confirmPassword', e.target.value)}
                  aria-invalid={Boolean(errors.confirmPassword)}
                  aria-required="true"
                  className={errors.confirmPassword ? 'is-error' : ''}
                />
                {errors.confirmPassword && <small className="sr-error">{errors.confirmPassword}</small>}
              </div>

              <div className="sr-field sr-field--wide">
                <label htmlFor="profileFile" className="sr-label">
                  Fotografía de Perfil Profesional
                </label>
                <div className="sr-file-wrap">
                  <label htmlFor="profileFile" className="sr-file-button">
                    Seleccionar archivo
                  </label>
                  <input
                    id="profileFile"
                    type="file"
                    accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                    onChange={e => {
                      const file = e.target.files?.[0]
                      handleChange('profileFileName', file ? file.name : '')
                    }}
                  />
                  <span className="sr-file-name">{form.profileFileName || 'Ningún archivo seleccionado'}</span>
                </div>
              </div>

              <div className="sr-field sr-field--wide">
                <label htmlFor="bio" className="sr-label">
                  Descripción de Experiencia y Servicios <span aria-hidden="true">*</span>
                  <span className="sr-tooltip" title="Cuenta brevemente tus áreas de especialidad, experiencia y servicios ofrecidos." aria-label="Información de la descripción">
                    i
                  </span>
                </label>
                <textarea
                  id="bio"
                  name="bio"
                  value={form.bio}
                  maxLength={250}
                  placeholder="Máximo 250 caracteres"
                  onChange={e => handleChange('bio', e.target.value)}
                  aria-invalid={Boolean(errors.bio)}
                  aria-required="true"
                  className={errors.bio ? 'is-error' : ''}
                />
                <div className="sr-help-row">
                  <small className="sr-counter">{form.bio.length}/250</small>
                  {errors.bio && <small className="sr-error">{errors.bio}</small>}
                </div>
              </div>
            </div>

            <label className="sr-checkbox-wrap">
              <input
                type="checkbox"
                checked={form.acceptTerms}
                onChange={e => handleChange('acceptTerms', e.target.checked)}
                aria-invalid={Boolean(errors.acceptTerms)}
                aria-required="true"
              />
              <span>
                Acepto los <a href="#terms">términos de servicio</a> y la <a href="#privacy">política de privacidad</a>.
              </span>
            </label>
            {errors.acceptTerms && <small className="sr-error sr-error--checkbox">{errors.acceptTerms}</small>}

            <button type="submit" className="sr-submit" aria-label="Registrarse">
              Registrarse
            </button>
          </form>
        </section>
      </main>
      <div className="sr-footer fade show">
        <Footer />
      </div>
    </>
  )
}
