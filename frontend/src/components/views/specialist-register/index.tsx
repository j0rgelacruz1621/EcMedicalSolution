  import { useState } from 'react'
  import { Link } from 'react-router-dom'
  import Footer from '../../footer'
  import './style.scss'
  import logo from '../../../assets/LOGO-HEADER.jpeg'
  import { Info, Upload, AlertCircle, CheckCircle } from 'lucide-react'

  // 1. IMPORTAMOS EL SERVICIO
  import { registerDoctor, type DoctorRequestBody } from '../../../services/doctors/doctor-services'

  type FormState = {
    fullName: string; identityCard: string; mpps: string; email: string;
    specialty: string; rif: string; cm: string;
    phone: string; bio: string;
    profileFileName: string; acceptTerms: boolean;
  }

  type FormErrors = Partial<Record<keyof FormState, string>>

  const initialForm: FormState = {
    fullName: '', identityCard: '', mpps: '', email: '',
    specialty: '', rif: '', cm: '',
    phone: '', bio: '',
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
    
    // 2. NUEVOS ESTADOS PARA EL BACKEND
    const [loading, setLoading] = useState(false)
    const [serverError, setServerError] = useState<string | null>(null)
    const [isSuccess, setIsSuccess] = useState(false)

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
      if (!form.email.trim()) nextErrors.email = 'Este campo es obligatorio.'
      else if (!emailRegex.test(form.email)) nextErrors.email = 'Ingresa un correo válido.'
      
      if (!form.specialty) nextErrors.specialty = 'Seleccione una especialidad.'
      if (!form.acceptTerms) nextErrors.acceptTerms = 'Debes aceptar los términos.'

      return nextErrors
    }

    // 3. FUNCIÓN DE ENVÍO ACTUALIZADA (ASYNC)
    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault()
      const nextErrors = validate()
      setErrors(nextErrors)

      if (Object.keys(nextErrors).length === 0) {
        setLoading(true)
        setServerError(null)
        setIsSuccess(false)

        /**
         * TRANSFORMACIÓN DE DATOS PARA EL BACKEND
         * 1. Separamos el fullName en firstName y lastName.
         * 2. Mapeamos mpps -> licenseNumber y identityCard -> nationalId.
         */
        const nameParts = form.fullName.trim().split(' ')
        const firstName = nameParts[0]
        const lastName = nameParts.slice(1).join(' ') || ' ' // Si no hay apellido, enviamos un espacio

        const body: DoctorRequestBody = {
          licenseNumber: form.mpps,
          nationalId: form.identityCard,
          firstName: firstName,
          lastName: lastName,
          email: form.email,
          phone: form.phone,
          specialty: form.specialty,
          /* 
            IMPORTANTE: officeId se envía como 1 de forma estática (quemada) 
            porque el backend lo requiere obligatoriamente pero aún no 
            tenemos un selector de oficinas en el registro.
          */
          officeId: 1 
        }

        try {
          // Llamada al servicio que creamos
          const response = await registerDoctor(body)
          
          console.log('Respuesta del servidor:', response)
          setIsSuccess(true)
          
          // Limpiamos el formulario después de un registro exitoso
          setForm(initialForm) 
          
          // Opcional: Redirigir al login después de 2 segundos
          // setTimeout(() => navigate('/'), 2000)

        } catch (err: any) {
          // Capturamos el error que viene del backend o de la red
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
                <img src={logo} alt="Logo" className="sr-brand__logo" />
                <span className="sr-brand__text">EC – Medical Control</span>
              </div>
              {/* Se eliminó el Link de Iniciar Sesión */}
            </div>
          </header>

          <main className="sr-page">
            <section className="sr-card">
              <h1 className="sr-title">Registro de Especialistas</h1>
              <p className="sr-subtitle">Completa el formulario para crear tu cuenta profesional.</p>

              {/* 4. ALERTAS DE FEEDBACK */}
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
                  {/* COLUMNA 1 */}
                  <div className="sr-column">
                    <div className="sr-field">
                      <label className="sr-label">Nombres y Apellidos <span>*</span></label>
                      <input 
                        type="text" 
                        disabled={loading}
                        placeholder="Ingrese sus nombres y apellidos"
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
                        disabled={loading}
                        placeholder="Ej: 12345678"
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
                        disabled={loading}
                        placeholder="Número de registro MPPS"
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
                        disabled={loading}
                        placeholder="ejemplo@correo.com"
                        className={errors.email ? 'is-error' : ''}
                        value={form.email}
                        onChange={e => handleChange('email', e.target.value)}
                      />
                      {errors.email && <small className="sr-error">{errors.email}</small>}
                    </div>

                    <div className="sr-field">
                      <label className="sr-label">Fotografía de Perfil Profesional</label>
                      <div className="sr-file-custom">
                        {/* Este es el único botón que el usuario verá */}
                        <label htmlFor="file-up" className={`sr-file-btn ${loading ? 'disabled' : ''}`}>
                          <Upload size={16} /> Seleccionar archivo
                        </label>
                        
                        {/* El input real se oculta con CSS */}
                        <input 
                          id="file-up" 
                          type="file" 
                          disabled={loading}
                          accept="image/*"
                          style={{ display: 'none' }} 
                          onChange={e => handleChange('profileFileName', e.target.files?.[0]?.name || '')}
                        />
                        
                        {/* Texto que indica qué archivo se subió */}
                        <span className="sr-file-status">
                          {form.profileFileName || 'Ningún archivo seleccionado'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* COLUMNA 2 */}
                  <div className="sr-column">
                    <div className="sr-field">
                      <label className="sr-label">Especialidad <span>*</span></label>
                      <select 
                        disabled={loading}
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
                        disabled={loading}
                        placeholder="Ej: J-12345678-0"
                        value={form.rif}
                        onChange={e => handleChange('rif', e.target.value.toUpperCase())}
                      />
                    </div>

                    <div className="sr-field">
                      <label className="sr-label">Número de CM <span>*</span></label>
                      <input 
                        type="text" 
                        disabled={loading}
                        placeholder="Colegio de Médicos"
                        className={errors.cm ? 'is-error' : ''}
                        value={form.cm}
                        onChange={e => handleChange('cm', e.target.value.replace(/\D/g, ''))}
                      />
                      {errors.cm && <small className="sr-error">{errors.cm}</small>}
                    </div>

                    <div className="sr-field">
                      <label className="sr-label">
                        Número de Teléfono <span>*</span>
                        {/* TOOLTIP CORREGIDO */}
                        <span title="Este es el número de contacto directo para que los pacientes puedan comunicarse fácilmente para consultas y citas." className="sr-info-wrapper">
                          <Info size={14} className="sr-info-icon" />
                        </span>
                      </label>
                      <input 
                        type="tel" 
                        disabled={loading}
                        placeholder="Ej: 04121234567"
                        className={errors.phone ? 'is-error' : ''}
                        value={form.phone}
                        onChange={e => handleChange('phone', e.target.value.replace(/\D/g, ''))}
                      />
                      {errors.phone && <small className="sr-error">{errors.phone}</small>}
                    </div>

                    <div className="sr-field">
                      <label className="sr-label">
                        {/* TÍTULO CORREGIDO */}
                        Descripción de Experiencia y Servicios <span>*</span>
                        {/* TOOLTIP CORREGIDO */}
                        <span title="En este campo, puedes incluir un resumen de tu experiencia y los servicios que ofreces. Esto nos permitirá mostrar a tus pacientes esta información en la pantalla de agendamiento de citas." className="sr-info-wrapper">
                          <Info size={14} className="sr-info-icon" />
                        </span>
                      </label>
                      <textarea 
                        disabled={loading}
                        maxLength={250}
                        placeholder="Describa brevemente su trayectoria profesional y servicios..."
                        className={errors.bio ? 'is-error' : ''}
                        value={form.bio}
                        onChange={e => handleChange('bio', e.target.value)}
                        style={{ minHeight: '110px' }}
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
                    className="sr-terms-checkbox" // Añadimos clase para control de estilos
                    disabled={loading}
                    checked={form.acceptTerms}
                    onChange={e => handleChange('acceptTerms', e.target.checked)}
                  />
                  <label htmlFor="terms">
                    {/* LINK ÚNICO CORREGIDO */}
                    Acepto los <a href="#" className="sr-link-unified">términos de servicio y la política de privacidad</a>.
                  </label>
                </div>
                {errors.acceptTerms && <small className="sr-error d-block mb-3">{errors.acceptTerms}</small>}

                {/* 5. BOTÓN CON ESTADO LOADING */}
                <button 
                  type="submit" 
                  className="sr-submit-btn" 
                  disabled={loading}
                >
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