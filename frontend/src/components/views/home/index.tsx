import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Header from '../../header'
import Footer from '../../footer'
import './style.scss'

function HomeView() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(false)
  const [error, setError] = useState('')

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

  const navigate = useNavigate()

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
                  <div className="home-view__login-icon mx-auto mb-3">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                      <path d="M12 2L4 5v6c0 5 3.6 9.7 8 11 4.4-1.3 8-6 8-11V5l-8-3z" stroke="#12315a" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M9.5 12.5l1.8 1.8L14.5 11" stroke="#12315a" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>

                  <h3 className="fw-bold mb-4 text-primary text-center">Inicia sesión en el panel de administración</h3>

                  <form className="row g-3" onSubmit={handleSubmit} noValidate>
                    {/* Bloque Usuario */}
                    <div className="col-12">
                      <label htmlFor="username" className="form-label fw-semibold">Usuario</label>
                      <div className="input-group">
                        <span className="input-group-text bg-white">👤</span>
                        <input id="username" className="form-control" aria-label="Usuario" placeholder="ej. admin_01" value={username} onChange={e => setUsername(e.target.value)} />
                      </div>
                    </div>

                    {/* Bloque Contraseña */}
                    <div className="col-12">
                      <label htmlFor="password" className="form-label fw-semibold">Contraseña</label>
                      <div className="input-group">
                        <span className="input-group-text bg-white">🔒</span>
                        <input 
                            id="password" 
                            className="form-control" 
                            type={showPassword ? 'text' : 'password'} 
                            value={password} 
                            onChange={e => setPassword(e.target.value)} 
                        />
                        <button type="button" className="btn btn-outline-secondary" onClick={() => setShowPassword(s => !s)}>
                          {showPassword ? '🙈' : '👁️'}
                        </button>
                      </div>
                    </div>

                    {/* Bloque Opciones - Envuelto en col-12 para alineación perfecta */}
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

                    {error && <div className="col-12"><div className="alert alert-danger mb-0" role="alert">{error}</div></div>}

                    <div className="col-12 mt-2">
                      <button className="btn btn-primary w-100 btn-lg fw-bold home-view__submit" type="submit">
                        Acceder al sistema ➜
                      </button>
                    </div>
                  </form>

                  <div className="d-flex align-items-start gap-3 mt-4 home-view__info">
                    <div className="fs-5">ℹ️</div>
                    <div className="text-secondary small">Este acceso es exclusivo para personal autorizado. Si tienes problemas de acceso, contacta al soporte técnico del sistema.</div>
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
