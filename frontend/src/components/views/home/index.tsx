import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Header from '../../header'
import Footer from '../../footer'
import './style.scss'
// Importamos los iconos necesarios
import { 
  User, 
  Lock, 
  Eye, 
  EyeOff, 
  Info, 
  ShieldCheck, 
  ArrowRight 
} from 'lucide-react'

function HomeView() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    if (!username.trim() || !password) {
      setError('Por favor completa usuario y contraseña.')
      return
    }
    if (username === 'admin' && password === '1234') {
      navigate('/control-panel')
      return
    }

    setError('Credenciales incorrectas. Por favor verifica tus datos.')
  }

  return (
    <main className="home-view">
      <Header />
      <div className="container py-5">
        <section className="home-view__hero row align-items-center justify-content-center">
          <div className="col-12 col-xl-10 text-center">
            <div className="mb-4">
              <h1 className="display-5 fw-bold mb-3 home-view__title">
                <span className="d-block text-primary">Bienvenido, Médico Especialista</span>
                <span className="d-block text-dark">Gestiona tu práctica con precisión</span>
              </h1>
              <p className="home-view__hero-desc mx-auto text-secondary">
                Medical Control es el sistema integral diseñado exclusivamente para médicos especialistas, que ofrece herramientas, historias clínicas y gestión de pacientes desde una interfaz unificada y segura.
              </p>
            </div>

            <div className="d-flex justify-content-center gap-4 mb-4 home-view__decor-lines">
              <div className="rounded-pill"></div>
              <div className="rounded-pill"></div>
            </div>

            <div className="d-flex justify-content-center">
              <div className="card border-0 shadow-lg home-view__login-card" role="region" aria-label="Login panel">
                <div className="card-body p-4 p-md-5">
                  
                  {/* Icono de Escudo Profesional */}
                  <div className="home-view__login-icon mx-auto mb-3">
                    <ShieldCheck size={32} color="#12315a" strokeWidth={1.5} />
                  </div>

                  <h3 className="fw-bold mb-4 text-primary text-center">
                    Inicia sesión en el panel de administración
                  </h3>

                  <form className="row g-3" onSubmit={handleSubmit} noValidate>
                    
                    {/* Bloque Usuario con Icono Lucide */}
                    <div className="col-12">
                      <label htmlFor="username" className="form-label fw-semibold">Usuario</label>
                      <div className="input-group">
                        <span className="input-group-text bg-white">
                          <User size={18} strokeWidth={2.5} />
                        </span>
                        <input 
                          id="username" 
                          className="form-control" 
                          aria-label="Usuario" 
                          placeholder="ej. admin_01" 
                          value={username} 
                          onChange={e => setUsername(e.target.value)} 
                        />
                      </div>
                    </div>

                    {/* Bloque Contraseña con Iconos Lucide */}
                    <div className="col-12">
                      <label htmlFor="password" className="form-label fw-semibold">Contraseña</label>
                      <div className="input-group">
                        <span className="input-group-text bg-white">
                          <Lock size={18} strokeWidth={2.5} />
                        </span>
                        <input 
                            id="password" 
                            className="form-control" 
                            type={showPassword ? 'text' : 'password'} 
                            value={password} 
                            onChange={e => setPassword(e.target.value)} 
                        />
                        <button 
                          type="button" 
                          className="btn btn-outline-secondary border-start-0" 
                          onClick={() => setShowPassword(s => !s)}
                          style={{ borderColor: '#dee2e6' }}
                        >
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>

                    <div className="col-12">
                      <div className="home-view__options">
                        <div className="form-check">
                          <input 
                            className="form-check-input" 
                            type="checkbox" 
                            checked={remember} 
                            onChange={e => setRemember(e.target.checked)} 
                            id="rememberMe" 
                          />
                          <label className="form-check-label" htmlFor="rememberMe">Recordarme</label>
                        </div>
                        <Link to="/forgot" className="home-view__link">¿Olvidó su contraseña?</Link>
                      </div>
                    </div>

                    {error && (
                      <div className="col-12">
                        <div className="alert alert-danger mb-0 py-2 d-flex align-items-center gap-2" role="alert">
                          <Info size={16} /> {error}
                        </div>
                      </div>
                    )}

                    <div className="col-12 mt-2">
                      <button className="btn btn-primary w-100 btn-lg fw-bold home-view__submit d-flex align-items-center justify-content-center gap-2" type="submit">
                        Acceder al sistema <ArrowRight size={20} />
                      </button>
                    </div>
                  </form>

                  {/* Sección Informativa con Icono de Info */}
                  <div className="d-flex align-items-start gap-3 mt-4 home-view__info">
                    <div className="text-primary">
                      <Info size={20} />
                    </div>
                    <div className="text-secondary small">
                      Este acceso es exclusivo para personal autorizado. Si tienes problemas de acceso, contacta al soporte técnico del sistema.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
      <Footer />
    </main>
  )
}

export default HomeView