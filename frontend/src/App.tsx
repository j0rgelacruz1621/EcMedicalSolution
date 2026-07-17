import './App.css'

function App() {
  return (
    <main className="landing-shell">
      <header className="topbar">
        <a className="brand" href="#inicio" aria-label="EC - Medical Control">
          <span className="brand-text">EC - Medical Control</span>
        </a>

        <nav className="main-nav" aria-label="Navegacion principal">
          <a className="is-active" href="#servicios">
            Servicios
          </a>
          <a href="#pacientes">Pacientes</a>
          <a href="#sobre-mi">Sobre Mi</a>
          <a href="#contacto">Contacto</a>
        </nav>

        <div className="topbar-actions">
          <a className="login-link" href="#acceso">
            Acceder
          </a>
          <a className="primary-chip" href="#agendar">
            Agendar cita
          </a>
        </div>
      </header>

      <section className="hero-layout">
        <article className="hero-copy" id="servicios">
          <div className="eyebrow-row">
            <span className="eyebrow-badge" aria-hidden="true"></span>
            <p className="eyebrow">Atencion especializada</p>
          </div>

          <h1>Atencion Cardiologica Especializada</h1>

          <p className="hero-summary">
            Gestione su salud cardiovascular. Solicite su cita medica de forma
            rapida y sencilla a traves de nuestra aplicacion web optimizada.
          </p>

          <div className="hero-actions">
            <a className="primary-button" href="#agendar">
              <span aria-hidden="true">+</span>
              {' '}
              Agendar cita
            </a>
            <a className="secondary-button" href="#sobre-mi">
              Saber mas
            </a>
          </div>

          <div className="metrics-row" aria-label="Metricas destacadas">
            <article>
              <strong>15+</strong>
              <span>Anos de experiencia</span>
            </article>
            <article>
              <strong>5k+</strong>
              <span>Pacientes atendidos</span>
            </article>
          </div>
        </article>

        <aside className="login-panel" id="acceso">
          <div className="shield-icon" aria-hidden="true">
            <span></span>
          </div>

          <p className="panel-title">Panel de Administracion</p>
          <p className="panel-subtitle">
            Inicia sesion en el panel de administracion
          </p>

          <form className="login-form">
            <label htmlFor="username">Usuario</label>
            <div className="field-wrap">
              <span className="field-icon" aria-hidden="true">
                @
              </span>
              <input id="username" type="text" placeholder="ej. admin_01" />
            </div>

            <label htmlFor="password">Contrasena</label>
            <div className="field-wrap">
              <span className="field-icon" aria-hidden="true">
                #
              </span>
              <input id="password" type="password" value="12345678" readOnly />
              <button className="ghost-icon" type="button" aria-label="Mostrar contrasena">
                o
              </button>
            </div>

            <div className="field-meta">
              <label className="remember-row">
                <input type="checkbox" />
                <span>Recordarme</span>
              </label>
              <a href="#recuperar">Olvido su contrasena?</a>
            </div>

            <button className="submit-button" type="submit">
              Acceder al sistema
              {' '}
              <span aria-hidden="true">{'->'}</span>
            </button>
          </form>

          <div className="support-card">
            <span className="support-icon" aria-hidden="true">
              i
            </span>
            <p>
              Este acceso es exclusivo para personal autorizado. Si tiene
              problemas de acceso, contacte al soporte tecnico de sistemas.
            </p>
          </div>
        </aside>
      </section>
    </main>
  )
}

export default App
