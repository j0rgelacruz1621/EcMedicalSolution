import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Header from '../../header'
import Footer from '../../footer'
import './style.scss'
import { User, Lock, Eye, EyeOff, Info, ShieldCheck, ArrowRight } from 'lucide-react'

// IMPORTAMOS EL SERVICIO
import { loginUser } from '../../../services/auth/auth-service'

function HomeView() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    if (!username.trim() || !password) {
      setError('Por favor completa usuario y contraseña.')
      return
    }
    setLoading(true)

    try {
      const data = await loginUser({ user_name: username, password: password })
      if (data.access_token && data.user === true && data.rol === 'SA') {
        localStorage.setItem('token', data.access_token)
        localStorage.setItem('user_rol', data.rol)
        navigate('/control-panel')
      } else {
        setError('El usuario no tiene permisos de acceso.')
      }
    } catch (err: any) {
      setError('Credenciales incorrectas o problema de conexión.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="theme-blue">
      <div className="home-view d-flex flex-column min-vh-100 bg-white">
        <Header />
        
        <main className="flex-grow-1 d-flex align-items-center py-5">
          <div className="container-fluid px-lg-5"> {/* Usamos container-fluid para más espacio lateral */}
            <div className="row align-items-center justify-content-center">
              
              {/* SECCIÓN IZQUIERDA: Texto más largo y extendido */}
              <div className="col-lg-7 ps-lg-5 mb-5 mb-lg-0 text-start">
                <h1 className="fw-bold mb-3" style={{ color: 'var(--primary-color)', fontSize: '3.2rem', lineHeight: '1.2' }}>
                  Bienvenido, Médico Especialista
                </h1>
                <h2 className="h2 fw-bold text-dark mb-4" style={{ fontSize: '1.8rem', letterSpacing: '-0.5px' }}>
                  Gestiona tu práctica con precisión
                </h2>
                {/* Quitamos el maxWidth para que el párrafo se alargue horizontalmente */}
                <p className="text-secondary" style={{ fontSize: '1.15rem', lineHeight: '1.7', maxWidth: '90%' }}>
                  Medical Control: la plataforma integral que simplifica la gestión de tu consultorio. 
                  Administra historias clínicas, agenda y pacientes desde una sola interfaz segura 
                  y diseñada para médicos especialistas.
                </p>
              </div>

              {/* SECCIÓN DERECHA: Card proporcional */}
              <div className="col-lg-5 d-flex justify-content-center">
                <div className="card border-0 shadow-lg" 
                    style={{ 
                      width: '100%', 
                      maxWidth: '500px', 
                      borderRadius: '28px',
                      padding: '10px'
                    }}>
                  <div className="card-body p-4 p-md-5">
                    
                    <div className="text-center mb-4">
                      <div className="mx-auto mb-3 d-flex align-items-center justify-content-center" 
                          style={{ width: '60px', height: '60px', backgroundColor: '#f0f4ff', borderRadius: '15px' }}>
                        <ShieldCheck size={30} color="var(--primary-color)" strokeWidth={1.5} />
                      </div>
                      <h4 className="fw-bold mb-0" style={{ color: 'var(--primary-color)' }}>
                        Inicia sesión en el panel de administración
                      </h4>
                    </div>

                    <form className="row g-3" onSubmit={handleSubmit} noValidate>
                      <div className="col-12">
                        <label className="form-label small fw-semibold text-muted mb-1">Usuario</label>
                        <div className="input-group">
                          <span className="input-group-text bg-light border-end-0 border-0">
                            <User size={18} className="text-muted" />
                          </span>
                          <input 
                            type="text"
                            className="form-control bg-light border-0 py-2" 
                            disabled={loading}
                            placeholder="ej. admin_01" 
                            value={username} 
                            onChange={e => setUsername(e.target.value)} 
                          />
                        </div>
                      </div>

                      <div className="col-12">
                        <label className="form-label small fw-semibold text-muted mb-1">Contraseña</label>
                        <div className="input-group">
                          <span className="input-group-text bg-light border-end-0 border-0">
                            <Lock size={18} className="text-muted" />
                          </span>
                          <input 
                              disabled={loading}
                              className="form-control bg-light border-0 py-2" 
                              type={showPassword ? 'text' : 'password'} 
                              placeholder="••••••••"
                              value={password} 
                              onChange={e => setPassword(e.target.value)} 
                          />
                          <button 
                            type="button" 
                            className="btn bg-light border-0 text-muted" 
                            onClick={() => setShowPassword(s => !s)}
                          >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </div>
                      </div>

                      <div className="col-12 d-flex justify-content-between align-items-center mt-3">
                          <div className="form-check d-flex align-items-center gap-2 m-0 p-0">
                              <input 
                                  className="form-check-input ms-0" 
                                  type="checkbox" 
                                  style={{ width: '18px', height: '18px' }}
                                  id="remember" 
                                  checked={remember}
                                  onChange={(e) => setRemember(e.target.checked)}
                              />
                              <label className="form-check-label small text-muted" htmlFor="remember">
                                  Recordarme
                              </label>
                          </div>
                          <Link to="/forgot-password" className="text-decoration-none small fw-bold">
                              ¿Olvidó su contraseña?
                          </Link>
                      </div>

                      {error && (
                        <div className="col-12">
                          <div className="alert alert-danger mb-0 py-2 d-flex align-items-center gap-2 small border-0">
                            <Info size={14} /> {error}
                          </div>
                        </div>
                      )}

                      <div className="col-12 mt-4">
                        <button 
                          className="btn btn-primary w-100 py-3 fw-bold d-flex align-items-center justify-content-center gap-2" 
                          type="submit"
                          disabled={loading}
                          style={{ backgroundColor: 'var(--primary-color)', border: 'none', borderRadius: '12px' }}
                        >
                          {loading ? 'Validando...' : 'Acceder al sistema'} 
                          {!loading && <ArrowRight size={20} />}
                        </button>
                      </div>
                    </form>

                    <div className="mt-4 p-3 rounded-3 d-flex gap-3" style={{ backgroundColor: '#f8f9fa' }}>
                      <Info size={18} color="var(--primary-color)" className="mt-1" />
                      <p className="mb-0 text-muted" style={{ fontSize: '0.75rem', lineHeight: '1.4' }}>
                          Este acceso es exclusivo para personal autorizado. Si tienes problemas de acceso, contacta al soporte técnico del sistema.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </main>

        <Footer />
      </div>
    </div>

  )
}

export default HomeView