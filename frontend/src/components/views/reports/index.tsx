import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Bell, CircleHelp, ClipboardList, Microscope } from 'lucide-react'
import LeftSideBar from '../../left-sideBar'
import DashboardHeader from '../../dashboard-header'
import { getDoctor, type Doctor } from '../../../services/doctors/doctor-services'
import './style.scss'

const getInitialsFromName = (name?: string | null) => {
  if (!name) return 'JD'

  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return 'JD'

  return `${parts[0][0] || ''}${parts[1]?.[0] || ''}`.toUpperCase()
}

export default function ReportsView() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const role = localStorage.getItem('user_rol')
  const doctorId = Number(
    role === 'DOCTOR'
      ? localStorage.getItem('doctor_id')
      : searchParams.get('doctorId') || sessionStorage.getItem('active_doctor_id') || 0,
  )
  const contextQuery = doctorId ? `?doctorId=${doctorId}` : ''

  const [doctor, setDoctor] = useState<Doctor | null>(null)
  const activeDoctorName = doctor
    ? `${doctor.firstName} ${doctor.lastName}`
    : sessionStorage.getItem('active_doctor_name') || 'Administración'
  const doctorInitials = doctor
    ? `${doctor.firstName[0] || ''}${doctor.lastName[0] || ''}`.toUpperCase()
    : getInitialsFromName(sessionStorage.getItem('active_doctor_name'))

  useEffect(() => {
    if (!doctorId) return

    let active = true

    getDoctor(doctorId)
      .then(doctorResult => {
        if (!active) return
        setDoctor(doctorResult)
        sessionStorage.setItem('active_doctor_name', `${doctorResult.firstName} ${doctorResult.lastName}`)
      })
      .catch(() => {
        if (active) setDoctor(null)
      })

    return () => {
      active = false
    }
  }, [doctorId])

  return (
    <div className="rp-root">
      <LeftSideBar />

      <main className="rp-main">
        <DashboardHeader title="Informes">
            <button className="dashboard-header__icon" aria-label="Notificaciones">
              <Bell size={24} />
            </button>
            <button className="dashboard-header__icon" aria-label="Ayuda">
              <CircleHelp size={22} />
            </button>
            <div className="dashboard-header__user">
              <div className="dashboard-header__user-text">
                <span>{activeDoctorName}</span>
                <small>{doctor?.specialty || 'Cardiología Clínica'}</small>
              </div>
              {doctor?.photoUrl ? (
                <img className="dashboard-header__avatar dashboard-header__avatar--photo" src={doctor.photoUrl} alt="Foto de perfil" />
              ) : (
                <span className="dashboard-header__avatar">{doctorInitials}</span>
              )}
            </div>
        </DashboardHeader>

        <section className="rp-content">
          <div className="rp-content-header">
            <h2>Generar Informes</h2>
            <p>Estadísticas y análisis de actividad clínica mensual.</p>
          </div>

          <div className="rp-grid">
            <button
              type="button"
              className="rp-card"
              onClick={() => navigate(`/reports/medical-certificate${contextQuery}`)}
            >
              <span className="rp-card-icon"><ClipboardList size={48} /></span>
              <span className="rp-card-label">Informe de Reposo o Constancia</span>
            </button>

            <button
              type="button"
              className="rp-card"
              onClick={() => navigate(`/reports/lab-order${contextQuery}`)}
            >
              <span className="rp-card-icon"><Microscope size={48} /></span>
              <span className="rp-card-label">Orden de Exámenes de laboratorio</span>
            </button>
          </div>
        </section>
      </main>
    </div>
  )
}