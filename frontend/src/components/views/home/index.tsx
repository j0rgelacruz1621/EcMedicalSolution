import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Header from '../../header'
import Footer from '../../footer'
import './style.scss'
import { User, Lock, Eye, EyeOff, Info, ShieldCheck, ArrowRight } from 'lucide-react'

// 1. IMPORTAMOS EL SERVICIO
import { loginUser } from '../../../services/auth/auth-service'

function HomeView() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false) // Estado para el botón
  const navigate = useNavigate()

  // 2. FUNCIÓN DE ENVÍO ACTUALIZADA
  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')

    if (!username.trim() || !password) {
      setError('Por favor completa usuario y contraseña.')
      return
    }

    setLoading(true)

    try {
      // Llamamos a la API con los nombres de campos que pide el backend (user_name)
      const data = await loginUser({ 
        user_name: username, 
        password: password 
      })

      // 3. LA VALIDACIÓN DEL IF QUE SOLICITASTE
      if (data.access_token && data.user === true) {
        
        // Guardamos el token para futuras peticiones (opcional pero recomendado)
        localStorage.setItem('token', data.access_token)
        localStorage.setItem('user_rol', data.rol)

        // Dejamos pasar a la siguiente vista
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
    <main className="home-view">
      <Header />
      <div className="container py-5">
        <section className="home-view__hero row align-items-center justify-content-center">
          <div className="col-12 col-xl-10 text-center">
            {/* ... resto del contenido ... */}
            
            <div className="d-flex justify-content-center">
              <div className="card border-0 shadow-lg home-view__login-card">
                <div className="card-body p-4 p-md-5">
                  <div className="home-view__login-icon mx-auto mb-3">
                    <ShieldCheck size={32} color="#12315a" strokeWidth={1.5} />
                  </div>

                  <h3 className="fw-bold mb-4 text-primary text-center">
                    Inicia sesión en el panel de administración
                  </h3>

                  <form className="row g-3" onSubmit={handleSubmit} noValidate>
                    <div className="col-12">
                      <label htmlFor="username" className="form-label fw-semibold">Usuario</label>
                      <div className="input-group">
                        <span className="input-group-text bg-white">
                          <User size={18} strokeWidth={2.5} />
                        </span>
                        <input 
                          id="username" 
                          className="form-control" 
                          disabled={loading} // Desactivar si carga
                          placeholder="ej. admin_01" 
                          value={username} 
                          onChange={e => setUsername(e.target.value)} 
                        />
                      </div>
                    </div>

                    <div className="col-12">
                      <label htmlFor="password" className="form-label fw-semibold">Contraseña</label>
                      <div className="input-group">
                        <span className="input-group-text bg-white">
                          <Lock size={18} strokeWidth={2.5} />
                        </span>
                        <input 
                            id="password" 
                            disabled={loading} // Desactivar si carga
                            className="form-control" 
                            type={showPassword ? 'text' : 'password'} 
                            value={password} 
                            onChange={e => setPassword(e.target.value)} 
                        />
                        <button 
                          type="button" 
                          className="btn btn-outline-secondary border-start-0" 
                          onClick={() => setShowPassword(s => !s)}
                        >
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>

                    {/* ... check y error ... */}
                    {error && (
                      <div className="col-12">
                        <div className="alert alert-danger mb-0 py-2 d-flex align-items-center gap-2">
                          <Info size={16} /> {error}
                        </div>
                      </div>
                    )}

                    <div className="col-12 mt-2">
                      <button 
                        className="btn btn-primary w-100 btn-lg fw-bold home-view__submit d-flex align-items-center justify-content-center gap-2" 
                        type="submit"
                        disabled={loading} // Desactivar el botón mientras carga
                      >
                        {loading ? 'Validando...' : 'Acceder al sistema'} <ArrowRight size={20} />
                      </button>
                    </div>
                  </form>
                  
                  {/* Link al Registro (Para que el usuario pueda ir a registrarse) */}
                  <div className="mt-4 text-center">
                    <span className="text-secondary small">¿No tienes cuenta? </span>
                    <Link to="/specialist-register" className="small fw-bold">Regístrate como Especialista</Link>
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