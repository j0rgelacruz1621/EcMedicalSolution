import { Link } from 'react-router-dom'
import './style.scss'
import logo from '../../assets/LOGO-HEADER.jpeg'

export default function Header() {
  return (
    <header className="site-header animate__animated animate__fadeInDown">
      <div className="site-header__inner">
        <div className="site-header__left">
          <div className="site-header__logo" aria-hidden>
            <img src={logo} alt="EC – Medical Control" className="site-header__logo-img" />
          </div>
          <div className="site-header__brand">EC – Medical Control</div>
        </div>

        <nav className="site-header__nav" aria-label="Main navigation">
          <Link to="/services">Servicios</Link>
          <Link to="/plans">Planes</Link>
          <Link to="/contact">Contacto</Link>
        </nav>
      </div>
    </header>
  )
}
