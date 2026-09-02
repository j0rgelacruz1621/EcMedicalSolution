import './style.scss';
import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import LeftSideBar from '../../left-sideBar';
import ClinicalHistoryModal from '../../modals/clinical-history';
import NewClinicalHistoryModal from '../../modals/new-clinical-history';
import PrescriptionHistoryModal from '../../modals/Prescription-history';
import PrescriptionFormModal from '../../modals/prescription';
import PrescriptionPreviewModal from '../../modals/prescription-preview';
import ClinicalTimelineModal from '../../modals/clinical-timeline';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  HeartPulse,
  Plus,
  Stethoscope,
  TriangleAlert,
  UserRound,
  Pill,
} from 'lucide-react';

const patientData = {
  1: {
    name: 'Ricardo Mendoza',
    age: '54 años',
    id: '45.234.112-K',
    origin: 'Mérida',
    pa: '132/85 mmHg',
    fc: '72 BPM',
    weight: '84.5 Kg',
    date: '16 Oct 2026',
    time: '14:30 PM - Viernes 16',
    specialty: 'Control Cardiología',
    tabs: ['Información General', 'Historial Clínico', 'Récipes', 'Estudios', 'Paraclínicos', 'RX Tórax', 'Preoperatoria'],
    timeline: [
      { title: 'Seguimiento post-infarto (Estable)', date: '24 Sept, 2023', text: 'Paciente hemodinámicamente estable, sin dolor torácico ni cambios de signos vitales en la consulta. Se mantuvo tratamiento y control ambulatorio.' },
      { title: 'Control de Presión Arterial', date: '10 Ago, 2023', text: 'Presión arterial controlada con mejoría progresiva. Ajuste de medicación posterior a seguimiento domiciliario.' },
      { title: 'Egreso Hospitalario', date: '15 Jul, 2023', text: 'Alta médica tras manejo clínico. Recomendaciones para seguimiento y control de riesgo cardiovascular.' },
    ],
    medications: [
      { name: 'Aspirina', dose: '100mg', frequency: '1 cada 24h' },
      { name: 'Atorvastatina', dose: '40mg', frequency: '1 cada noche' },
      { name: 'Losartán', dose: '50mg', frequency: '1 cada 12h' },
    ],
    alerts: [
      'Alergia conocida a la Penicilina.',
      'Antecedente familiar de muerte por infarto de madre.',
      'Riesgo moderado de hipertensión no controlada.',
    ],
  },
  2: {
    name: 'Elena Gómez',
    age: '62 años',
    id: '32.889.001',
    origin: 'Tovar',
    pa: '128/80 mmHg',
    fc: '74 BPM',
    weight: '71.2 Kg',
    date: '18 Oct 2026',
    time: '09:15 AM - Domingo 18',
    specialty: 'Control Endocrinología',
    tabs: ['Información General', 'Historial Clínico', 'Récipes', 'Estudios', 'Paraclínicos', 'RX Tórax', 'Preoperatoria'],
    timeline: [
      { title: 'Seguimiento endocrino', date: '12 Sept, 2023', text: 'Paciente sin complicaciones, buena adherencia terapéutica y controles de glucosa estables.' },
      { title: 'Control metabólico', date: '03 Ago, 2023', text: 'Se documenta mejoría en los valores de glicemia y tolerancia al tratamiento indicado.' },
      { title: 'Evaluación inicial', date: '15 Jun, 2023', text: 'Se inicia protocolo de seguimiento y se establecen metas de control metabólico.' },
    ],
    medications: [
      { name: 'Metformina', dose: '850mg', frequency: '1 cada 12h' },
      { name: 'Lisinopril', dose: '10mg', frequency: '1 cada 24h' },
    ],
    alerts: [
      'Alergia a sulfas.',
      'Hipertensión familiar en línea materna.',
    ],
  },
};

export default function PatientFileView() {
  const { id } = useParams();
  const patient = patientData[Number(id) as keyof typeof patientData] ?? patientData[1];
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isAddHistoryOpen, setIsAddHistoryOpen] = useState(false);
  const [isPrescriptionHistoryOpen, setIsPrescriptionHistoryOpen] = useState(false);
  const [isPrescriptionFormOpen, setIsPrescriptionFormOpen] = useState(false);
  const [isPrescriptionPreviewOpen, setIsPrescriptionPreviewOpen] = useState(false);
  const [isClinicalTimelineOpen, setIsClinicalTimelineOpen] = useState(false);

  const monthLabel = useMemo(() => 'Octubre 2026', []);

  return (
    <div className="patient-file-root">
      <LeftSideBar />

      <main className="patient-file-main">
        <header className="patient-file-header">
          <div className="header-left">
            <div className="header-pill">Ficha clínica</div>
          </div>
          <div className="header-actions">
            <button className="action-icon-button" type="button" aria-label="Notificaciones">
              <CalendarDays size={18} />
            </button>
            <div className="doctor-badge">
              <span>Dra. Josiana Piña</span>
              <div className="avatar-mini"><UserRound size={14} /></div>
            </div>
          </div>
        </header>

        <div className="patient-file-body">
          <section className="patient-overview">
            <div className="patient-header-row">
              <div className="patient-identity">
                <div className="patient-avatar">RM</div>
                <div>
                  <p className="eyebrow">Paciente</p>
                  <h1>{patient.name}</h1>
                </div>
              </div>

              <div className="header-actions-row">
                <button className="primary-action" type="button">
                  <Plus size={18} />
                  Nueva Cita
                </button>
                <button className="secondary-action" type="button">Editar</button>
                <button className="secondary-action" type="button">Informe</button>
              </div>
            </div>

            <div className="patient-meta-grid">
              <div className="meta-item">
                <span className="meta-label">Edad</span>
                <strong>{patient.age}</strong>
              </div>
              <div className="meta-item">
                <span className="meta-label">Cédula</span>
                <strong>{patient.id}</strong>
              </div>
              <div className="meta-item">
                <span className="meta-label">Procedencia</span>
                <strong>{patient.origin}</strong>
              </div>
            </div>

            <div className="vital-signs-row">
              <div className="vital-card">
                <span className="vital-label">P.A</span>
                <strong>{patient.pa}</strong>
              </div>
              <div className="vital-card">
                <span className="vital-label">F.C</span>
                <strong>{patient.fc}</strong>
              </div>
              <div className="vital-card">
                <span className="vital-label">Peso</span>
                <strong>{patient.weight}</strong>
              </div>
            </div>
          </section>

          <aside className="next-appointment-card">
            <div className="appointment-header">
              <h3>PRÓXIMA CITA</h3>
            </div>

            <div className="calendar-panel">
              <div className="calendar-header">
                <button type="button" aria-label="Mes anterior"><ChevronLeft size={16} /></button>
                <span>{monthLabel}</span>
                <button type="button" aria-label="Mes siguiente"><ChevronRight size={16} /></button>
              </div>
              <div className="calendar-grid">
                {['Do','Lu','Ma','Mi','Ju','Vi','Sa'].map((d) => (
                  <span key={d} className="weekday-name">{d}</span>
                ))}
                {Array.from({ length: 35 }, (_, index) => {
                  const day = index - 1;
                  const isSelected = day === 16;
                  const isEmpty = day < 1 || day > 30;
                  return (
                    <span key={index} className={`day-cell ${isSelected ? 'selected' : ''} ${isEmpty ? 'muted' : ''}`}>
                      {!isEmpty ? day : ''}
                    </span>
                  );
                })}
              </div>
            </div>

            <div className="appointment-detail">
              <div className="appointment-time">
                <Clock3 size={16} />
                <span>{patient.time}</span>
              </div>
              <div className="appointment-reason">
                <div className="reason-icon">
                  <Stethoscope size={18} />
                </div>
                <div>
                  <span className="reason-label">Motivo</span>
                  <strong>{patient.specialty}</strong>
                </div>
              </div>
            </div>
          </aside>
        </div>

        <section className="patient-tabs-section">
          <nav className="tabs-bar" aria-label="Pestañas del expediente">
            {patient.tabs.map((tab, index) => (
              <button
                key={tab}
                type="button"
                className={index === 0 ? 'tab active' : 'tab'}
                onClick={() => {
                  if (tab === 'Historial Clínico') {
                    setIsHistoryOpen(true);
                  }

                  if (tab === 'Récipes') {
                    setIsPrescriptionHistoryOpen(true);
                  }

                  if (tab === 'Estudios') {
                    setIsClinicalTimelineOpen(true);
                  }
                }}
              >
                {tab}
              </button>
            ))}
          </nav>

          <div className="medical-content">
            <div className="timeline-panel panel-card">
              <div className="panel-header">
                <div className="panel-title-wrap">
                  <HeartPulse size={18} />
                  <h3>Línea de Tiempo de Evolución</h3>
                </div>
              </div>

              <div className="timeline-list">
                {patient.timeline.map((event) => (
                  <div key={event.title} className="timeline-item">
                    <div className="timeline-dot" />
                    <div className="timeline-body">
                      <h4>{event.title}</h4>
                      <span>{event.date}</span>
                      <p>{event.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="stack-column">
              <div className="panel-card medication-panel">
                <div className="panel-header">
                  <div className="panel-title-wrap">
                    <Pill size={18} />
                    <h3>Medicamentos Actuales</h3>
                  </div>
                </div>

                <ul className="medicine-list">
                  {patient.medications.map((medication) => (
                    <li key={medication.name} className="medicine-item">
                      <div className="medicine-name">
                        <span>{medication.name}</span>
                        <small>{medication.dose}</small>
                      </div>
                      <div className="medicine-frequency">{medication.frequency}</div>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="panel-card alert-panel">
                <div className="panel-header">
                  <div className="panel-title-wrap warning-title">
                    <TriangleAlert size={18} />
                    <h3>Alergias y Alertas</h3>
                  </div>
                </div>

                <ul className="alert-list">
                  {patient.alerts.map((alert) => (
                    <li key={alert}>{alert}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>
      </main>

      <ClinicalHistoryModal
        isOpen={isHistoryOpen}
        patientName={patient.name}
        onClose={() => setIsHistoryOpen(false)}
        onAddHistory={() => {
          setIsHistoryOpen(false);
          setIsAddHistoryOpen(true);
        }}
      />

      <NewClinicalHistoryModal
        isOpen={isAddHistoryOpen}
        patientName={patient.name}
        onClose={() => setIsAddHistoryOpen(false)}
      />

      <PrescriptionHistoryModal
        isOpen={isPrescriptionHistoryOpen}
        patientName={patient.name}
        onClose={() => setIsPrescriptionHistoryOpen(false)}
        onAddPrescription={() => {
          setIsPrescriptionHistoryOpen(false);
          setIsPrescriptionFormOpen(true);
        }}
      />

      <PrescriptionFormModal
        isOpen={isPrescriptionFormOpen}
        patientName={patient.name}
        onClose={() => setIsPrescriptionFormOpen(false)}
        onGenerate={() => setIsPrescriptionPreviewOpen(true)}
      />

      <PrescriptionPreviewModal
        isOpen={isPrescriptionPreviewOpen}
        patientName={patient.name}
        patientAge={patient.age}
        patientWeight={patient.weight}
        patientDoc={patient.id}
        emissionDate="13 de Julio de 2026"
        onClose={() => setIsPrescriptionPreviewOpen(false)}
      />

      <ClinicalTimelineModal
        isOpen={isClinicalTimelineOpen}
        patientName={patient.name}
        onClose={() => setIsClinicalTimelineOpen(false)}
      />
    </div>
  );
}
