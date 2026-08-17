import type { CSSProperties } from 'react'
import { Link } from 'react-router-dom'

const linkStyle: CSSProperties = {
  color: '#1d4ed8',
  textDecoration: 'none',
  fontWeight: 600,
  padding: '10px 14px',
  borderRadius: 10,
  background: '#edf4ff',
}

const cardStyle: CSSProperties = {
  background: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: 20,
  padding: 24,
  boxShadow: '0 14px 30px rgba(15, 23, 42, 0.06)',
}

const buttonPrimary: CSSProperties = {
  background: 'linear-gradient(135deg, #2a73d9 0%, #1d4ed8 100%)',
  color: '#fff',
  padding: '12px 20px',
  borderRadius: 12,
  fontWeight: 700,
}

function HomeView() {
  return (
    <main style={{ padding: '32px 16px', fontFamily: 'Arial, sans-serif' }}>
      <header
        style={{
          maxWidth: 1100,
          margin: '0 auto 32px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 16,
          flexWrap: 'wrap',
        }}
      >
        <div>
          <p
            style={{
              margin: 0,
              color: '#2a73d9',
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              fontSize: 12,
            }}
          >
            EC Medical Solution
          </p>
          <h1
            style={{
              margin: '8px 0 0',
              fontSize: 'clamp(2rem, 5vw, 3.5rem)',
              color: '#0f172a',
            }}
          >
            Cuidado médico moderno
          </h1>
        </div>

        <nav style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Link to="/" style={linkStyle}>Inicio</Link>
          <Link to="/date" style={linkStyle}>Agendar</Link>
        </nav>
      </header>

      <section
        style={{
          maxWidth: 1100,
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 24,
        }}
      >
        <article style={cardStyle}>
          <p style={{ margin: 0, color: '#2a73d9', fontWeight: 700 }}>Atención especializada</p>
          <h2 style={{ margin: '12px 0', fontSize: '2rem' }}>Tu salud, en buenas manos</h2>
          <p style={{ margin: 0, color: '#475569', lineHeight: 1.7 }}>
            Agenda consultas, revisa disponibilidad y gestiona tus citas de manera rápida desde una sola pantalla.
          </p>
          <div style={{ marginTop: 22 }}>
            <Link to="/date" style={{ ...buttonPrimary, display: 'inline-block', textDecoration: 'none' }}>
              Agendar cita
            </Link>
          </div>
        </article>

        <article style={cardStyle}>
          <h3 style={{ marginTop: 0 }}>Servicios</h3>
          <ul style={{ margin: 0, paddingLeft: 18, color: '#334155', lineHeight: 2 }}>
            <li>Cardiología</li>
            <li>Consultas generales</li>
            <li>Control de pacientes</li>
            <li>Seguimiento clínico</li>
          </ul>
        </article>
      </section>
    </main>
  )
}

export default HomeView
