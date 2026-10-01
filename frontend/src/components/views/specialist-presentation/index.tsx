import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom' // 1. Importamos Link
import Header from '../../header'
import './style.scss'
import { Calendar, Activity, UserRound } from 'lucide-react'
import pred from '../../../assets/pred-img.jpeg'
import { getDoctor, type Doctor } from '../../../services/doctors/doctor-services'

const MOCK_DATA = {
  name: "Dra. Josiana Piña Martínez",
  specialty: "ESPECIALISTA EN CARDIOLOGÍA",
  description: "Atención Cardiológica Especializada",
  badge: "ATENCIÓN ESPECIALIZADA",
  longDescription: "Gestione su salud cardiovascular. Solicite su cita médica de forma rápida y sencilla a través de nuestra aplicación web optimizada para su comodidad.",
  bio: "Médico cardiólogo con más de [X] años de experiencia en la prevención, diagnóstico y tratamiento de enfermedades cardiovasculares. Especializado en el cuidado integral del corazón, control de hipertensión arterial, arritmias y evaluación de riesgo cardiovascular preoperatorio.",
  imageUrl: pred
}

function SpecialistPresentation() {
  const { slug } = useParams()
  const [doctor, setDoctor] = useState<Doctor | null>(null)

  useEffect(() => {
    const id = Number(slug)
    if (!id) return
    getDoctor(id).then(setDoctor).catch(() => setDoctor(null))
  }, [slug])

  const displayName = doctor ? `${doctor.firstName} ${doctor.lastName}` : MOCK_DATA.name
  const displaySpecialty = doctor?.specialty ? doctor.specialty.toUpperCase() : MOCK_DATA.specialty
  const displayBio = doctor?.description || MOCK_DATA.bio
  const imageUrl = doctor?.photoUrl || MOCK_DATA.imageUrl

  return (
    <div className="sp-view d-flex flex-column min-vh-100">
      <Header />

      <main className="flex-grow-1 d-flex align-items-center py-5 bg-page">
        <div className="container py-lg-5">
          <div className="row align-items-center gy-5">

            <div className="col-lg-6 text-start">
              <div className="sp-badge-container d-flex align-items-center gap-2 mb-4">
                <div className="sp-badge-icon">
                  <Activity size={18} />
                </div>
                <span className="sp-badge-text">{MOCK_DATA.badge}</span>
              </div>

              <h1 className="sp-title mb-4">
                {MOCK_DATA.description}
              </h1>
              <p className="sp-description mb-5">
                {doctor?.description || MOCK_DATA.longDescription}
              </p>

              {/* 2. Cambiamos <button> por <Link> y añadimos 'to="/date"' */}
              <Link
                to={doctor ? `/date?doctorId=${doctor.id}` : '/date'}
                className="btn sp-cta-btn d-inline-flex align-items-center gap-2 text-decoration-none"
              >
                <Calendar size={20} />
                AGENDAR CITA
              </Link>
            </div>

            <div className="col-lg-6 d-flex justify-content-center justify-content-lg-end">
              <div className="sp-card-wrapper">
                <div className="sp-card-bg"></div>

                <div className="card sp-profile-card border-0 shadow-lg">
                  <div className="card-body text-center p-4 p-md-5">
                    <div className="sp-image-container mx-auto mb-4">
                      {doctor?.photoUrl ? (
                        <img
                          src={imageUrl}
                          alt={`Fotografía de la ${displayName}`}
                          className="img-fluid"
                        />
                      ) : (
                        <div className="sp-image-placeholder"><UserRound size={52} /></div>
                      )}
                    </div>

                    <h2 className="sp-doctor-name mb-1">{displayName}</h2>
                    <p className="sp-doctor-specialty mb-4">{displaySpecialty}</p>

                    <div className="sp-bio-container">
                      <p className="sp-bio-text">
                        {displayBio}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </main>

    </div>
  )
}

export default SpecialistPresentation