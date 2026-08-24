import { Link } from 'react-router-dom'
import './style.scss'

export default function Footer() {
  return (
    <footer className="site-footer animate__animated animate__fadeInUp">
      <div className="site-footer__inner">
        <div className="site-footer__left">EC – Medical Control</div>
        <div className="site-footer__center">© 2026 EC – Medical Control</div>
        <div className="site-footer__right">
          <Link to="/privacy">Privacidad</Link>
          <Link to="/terms">Términos de Uso</Link>
          <Link to="/location">Ubicación</Link>
          <Link to="/contact">Contacto</Link>
        </div>
      </div>
    </footer>
  )
}
