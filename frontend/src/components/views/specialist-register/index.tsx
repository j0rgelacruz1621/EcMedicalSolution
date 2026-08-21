import { useState } from 'react'
import { Link } from 'react-router-dom'
import Footer from '../../footer'
import './style.scss'
import logo from '../../../assets/LOGO-HEADER.jpeg'
// Importamos iconos profesionales
import { Info, Upload, CheckCircle, AlertCircle } from 'lucide-react'

type FormState = {
  fullName: string; identityCard: string; mpps: string; email: string;
  password: string; specialty: string; rif: string; cm: string;
  phone: string; confirmPassword: string; bio: string;
  profileFileName: string; acceptTerms: boolean;
}

type FormErrors = Partial<Record<keyof FormState, string>>

const initialForm: FormState = {
  fullName: '', identityCard: '', mpps: '', email: '',
  password: '', specialty: '', rif: '', cm: '',
  phone: '', confirmPassword: '', bio: '',
  profileFileName: '', acceptTerms: false
}

const specialties = [
  'Cardiología', 'Dermatología', 'Endocrinología', 
  'Gastroenterología', 'Neurología', 'Pediatría', 
  'Psiquiatría', 'Traumatología'
]

export default function SpecialistRegister() {
  const [form, setForm] = useState<FormState>(initialForm)
  const [errors, setErrors] = useState<FormErrors>({})

  const handleChange = (field: keyof FormState, value: string | boolean) => {
    setForm(prev => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }))
  }

  const validate = () => {
    const nextErrors: FormErrors = {}
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    if (!form.fullName.trim()) nextErrors.fullName = 'Este campo es obligatorio.'
    if (!form.identityCard.trim()) nextErrors.identityCard = 'Este campo es obligatorio.'
    if (!form.mpps.trim()) nextErrors.mpps = 'Este campo es obligatorio.'
    if (!form.cm.trim()) nextErrors.cm = 'Este campo es obligatorio.'
    if (!form.phone.trim()) nextErrors.phone = 'Este campo es obligatorio.'
    if (!form.bio.trim()) nextErrors.bio = 'Este campo es obligatorio.'
    
    if (form.email && !emailRegex.test(form.email)) nextErrors.email = 'Ingresa un correo válido.'
    if (!form.email.trim()) nextErrors.email = 'Este campo es obligatorio.'

    if (form.password.length < 6) nextErrors.password = 'Mínimo 6 caracteres.'
    if (form.password !== form.confirmPassword) nextErrors.confirmPassword = 'Las contraseñas no coinciden.'
    
    if (!form.specialty) nextErrors.specialty = 'Seleccione una especialidad.'
    if (!form.acceptTerms) nextErrors.acceptTerms = 'Debes aceptar los términos.'

    return nextErrors
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const nextErrors = validate()
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length === 0) console.log('Registro exitoso', form)
  }

  return (
    <div className="sr-wrapper">
      <header className="sr-header">
        <div className="sr-header__inner">
          <div className="sr-brand">
            <img src={logo} alt="Logo" className="sr-brand__logo" />
            <span className="sr-brand__text">EC – Medical Control</span>
          </div>
          <Link to="/" className="sr-login-link">Iniciar Sesión</Link>
        </div>
      </header>

      <main className="sr-page">
        <section className="sr-card">
          <h1 className="sr-title">Registro de Especialistas</h1>
          <p className="sr-subtitle">Completa el formulario para crear tu cuenta profesional en EC – Medical Control.</p>

          <form className="sr-form" onSubmit={handleSubmit} noValidate>
            <div className="sr-grid">
              {/* COLUMNA 1 */}
              <div className="sr-column">
                <div className="sr-field">
                  <label className="sr-label">Nombres y Apellidos <span>*</span></label>
                  <input 
                    type="text" 
                    className={errors.fullName ? 'is-error' : ''}
                    value={form.fullName}
                    onChange={e => handleChange('fullName', e.target.value.replace(/[^A-Za-z\s]/g, ''))}
                  />
                  {errors.fullName && <small className="sr-error">{errors.fullName}</small>}
                </div>

                <div className="sr-field">
                  <label className="sr-label">Cédula de Identidad <span>*</span></label>
                  <input 
                    type="text" 
                    className={errors.identityCard ? 'is-error' : ''}
                    value={form.identityCard}
                    onChange={e => handleChange('identityCard', e.target.value.replace(/\D/g, ''))}
                  />
                  {errors.identityCard && <small className="sr-error">{errors.identityCard}</small>}
                </div>

                <div className="sr-field">
                  <label className="sr-label">Número de MPPS <span>*</span></label>
                  <input 
                    type="text" 
                    className={errors.mpps ? 'is-error' : ''}
                    value={form.mpps}
                    onChange={e => handleChange('mpps', e.target.value.replace(/\D/g, ''))}
                  />
                  {errors.mpps && <small className="sr-error">{errors.mpps}</small>}
                </div>

                <div className="sr-field">
                  <label className="sr-label">Correo Electrónico <span>*</span></label>
                  <input 
                    type="email" 
                    className={errors.email ? 'is-error' : ''}
                    value={form.email}
                    onChange={e => handleChange('email', e.target.value)}
                  />
                  {errors.email && <small className="sr-error">{errors.email}</small>}
                </div>

                <div className="sr-field">
                  <label className="sr-label">Contraseña <span>*</span></label>
                  <input 
                    type="password" 
                    className={errors.password ? 'is-error' : ''}
                    value={form.password}
                    onChange={e => handleChange('password', e.target.value)}
                  />
                  {errors.password && <small className="sr-error">{errors.password}</small>}
                </div>

                <div className="sr-field">
                  <label className="sr-label">Fotografía de Perfil Profesional</label>
                  <div className="sr-file-custom">
                    <label htmlFor="file-up" className="sr-file-btn">
                      <Upload size={16} /> Seleccionar archivo
                    </label>
                    <input 
                      id="file-up" 
                      type="file" 
                      accept="image/*"
                      onChange={e => handleChange('profileFileName', e.target.files?.[0]?.name || '')}
                    />
                    <span className="sr-file-status">{form.profileFileName || 'Ningún archivo seleccionado'}</span>
                  </div>
                </div>
              </div>

              {/* COLUMNA 2 */}
              <div className="sr-column">
                <div className="sr-field">
                  <label className="sr-label">Especialidad <span>*</span></label>
                  <select 
                    className={errors.specialty ? 'is-error' : ''}
                    value={form.specialty}
                    onChange={e => handleChange('specialty', e.target.value)}
                  >
                    <option value="">Seleccione una especialidad</option>
                    {specialties.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  {errors.specialty && <small className="sr-error">{errors.specialty}</small>}
                </div>

                <div className="sr-field">
                  <label className="sr-label">RIF</label>
                  <input 
                    type="text" 
                    value={form.rif}
                    onChange={e => handleChange('rif', e.target.value.toUpperCase())}
                  />
                </div>

                <div className="sr-field">
                  <label className="sr-label">Número de CM <span>*</span></label>
                  <input 
                    type="text" 
                    className={errors.cm ? 'is-error' : ''}
                    value={form.cm}
                    onChange={e => handleChange('cm', e.target.value.replace(/\D/g, ''))}
                  />
                  {errors.cm && <small className="sr-error">{errors.cm}</small>}
                </div>

                <div className="sr-field">
                  <label className="sr-label">
                    Número de Teléfono <span>*</span>
                    {/* Envolvemos en un span para evitar el error de TypeScript */}
                    <span title="Uso para contacto con pacientes" className="sr-info-wrapper">
                      <Info size={14} className="sr-info-icon" />
                    </span>
                  </label>
                  <input 
                    type="tel" 
                    className={errors.phone ? 'is-error' : ''}
                    value={form.phone}
                    onChange={e => handleChange('phone', e.target.value.replace(/\D/g, ''))}
                  />
                  {errors.phone && <small className="sr-error">{errors.phone}</small>}
                </div>

                <div className="sr-field">
                  <label className="sr-label">Confirmar Contraseña <span>*</span></label>
                  <input 
                    type="password" 
                    className={errors.confirmPassword ? 'is-error' : ''}
                    value={form.confirmPassword}
                    onChange={e => handleChange('confirmPassword', e.target.value)}
                  />
                  {errors.confirmPassword && <small className="sr-error">{errors.confirmPassword}</small>}
                </div>

                <div className="sr-field">
                  <label className="sr-label">
                    Descripción de Experiencia <span>*</span>
                    {/* Envolvemos en un span para evitar el error de TypeScript */}
                    <span title="Máximo 250 caracteres" className="sr-info-wrapper">
                      <Info size={14} className="sr-info-icon" />
                    </span>
                  </label>
                  <textarea 
                    maxLength={250}
                    placeholder="Máximo 250 caracteres"
                    className={errors.bio ? 'is-error' : ''}
                    value={form.bio}
                    onChange={e => handleChange('bio', e.target.value)}
                  />
                  <div className="sr-bio-footer">
                    <small>{form.bio.length}/250</small>
                    {errors.bio && <small className="sr-error">{errors.bio}</small>}
                  </div>
                </div>
              </div>
            </div>

            <div className="sr-terms">
              <input 
                type="checkbox" 
                id="terms" 
                checked={form.acceptTerms}
                onChange={e => handleChange('acceptTerms', e.target.checked)}
              />
              <label htmlFor="terms">
                Acepto los <a href="#">términos de servicio</a> y la <a href="#">política de privacidad</a>.
              </label>
            </div>
            {errors.acceptTerms && <small className="sr-error d-block mb-3">{errors.acceptTerms}</small>}

            <button type="submit" className="sr-submit-btn">Registrarse</button>
          </form>
        </section>
      </main>
      <Footer />
    </div>
  )
}