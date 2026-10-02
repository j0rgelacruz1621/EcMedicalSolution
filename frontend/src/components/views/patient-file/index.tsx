import './style.scss';
import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import LeftSideBar from '../../left-sideBar';
import ClinicalHistoryModal from '../../modals/clinical-history';
import NewClinicalHistoryModal from '../../modals/new-clinical-history';
import PrescriptionHistoryModal from '../../modals/Prescription-history';
import PrescriptionFormModal from '../../modals/prescription';
import PrescriptionPreviewModal from '../../modals/prescription-preview';
import ClinicalTimelineModal from '../../modals/clinical-timeline';
import ClinicalStudiesModal from '../../modals/Clinica-trials';
import SupplementaryTestsModal from '../../modals/Supplementary-tests';
import NewSupplementaryTests from '../new-Supplementary-tests';
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
import { getPatient, type Patient } from '../../../services/patients/patient-services';
import { getNextAppointmentForPatient, type Appointment } from '../../../services/appointments/appointment-services';

const TABS = [
  'Información General',
  'Historial Clínico',
  'Récipes',
  'Estudios',
  'Paraclínicos',
  'RX Tórax',
  'Preoperatoria',
];

function initials(fullName: string): string {
  return fullName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

function formatVitals(patient: Patient | null) {
  const v = patient?.latestVitals;
  return {
    pa: v?.blood_pressure_systolic && v?.blood_pressure_diastolic
      ? `${v.blood_pressure_systolic}/${v.blood_pressure_diastolic} mmHg`
      : '—',
    fc: v?.heart_rate_bpm != null ? `${v.heart_rate_bpm} BPM` : '—',
    weight: v?.weight_kg != null ? `${v.weight_kg} Kg` : '—',
  };
}

export default function PatientFileView() {
  const { id } = useParams();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [headerDoctor, setHeaderDoctor] = useState<{ name: string; photoUrl?: string | null } | null>(null);
  const [isAddHistoryOpen, setIsAddHistoryOpen] = useState(false);
  const [isPrescriptionHistoryOpen, setIsPrescriptionHistoryOpen] = useState(false);
  const [isPrescriptionFormOpen, setIsPrescriptionFormOpen] = useState(false);
  const [isPrescriptionPreviewOpen, setIsPrescriptionPreviewOpen] = useState(false);
  const [isClinicalTimelineOpen, setIsClinicalTimelineOpen] = useState(false);
  const [isClinicalStudiesOpen, setIsClinicalStudiesOpen] = useState(false);
  const [isSupplementaryTestsOpen, setIsSupplementaryTestsOpen] = useState(false);
  const [isNewSupplementaryTestsOpen, setIsNewSupplementaryTestsOpen] = useState(false);
  const [nextAppointment, setNextAppointment] = useState<Appointment | null>(null);
  const [calendarMonth, setCalendarMonth] = useState(() => new Date());

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    getPatient(Number(id))
      .then((data) => {
        setPatient(data);
        return getNextAppointmentForPatient({ id: data.id, nationalId: data.nationalId }).then(setNextAppointment);
      })
      .catch(() => setError('No se pudo cargar la información del paciente.'))
      .finally(() => setLoading(false));
  }, [id]);

  // El calendario muestra el mes de la próxima cita; navegable con las flechas.
  useEffect(() => {
    if (nextAppointment?.appointmentDate) {
      setCalendarMonth(new Date(nextAppointment.appointmentDate + 'T00:00:00'));
    }
  }, [nextAppointment]);

  const calendarYear = calendarMonth.getFullYear();
  const calendarMonthIndex = calendarMonth.getMonth();
  const monthLabel = useMemo(
    () =>
      calendarMonth.toLocaleDateString('es-VE', { month: 'long', year: 'numeric' }).replace(/^\w/, (c) => c.toUpperCase()),
    [calendarMonth],
  );
  const appointmentDay = nextAppointment?.appointmentDate
    ? new Date(nextAppointment.appointmentDate + 'T00:00:00').getDate()
    : null;
  const daysInMonth = new Date(calendarYear, calendarMonthIndex + 1, 0).getDate();
  const firstWeekday = new Date(calendarYear, calendarMonthIndex, 1).getDay(); // 0 = domingo
  const appointmentTime = nextAppointment?.startTime
    ? nextAppointment.startTime.slice(0, 5)
    : null;

  const vitals = formatVitals(patient);
  const patientName = patient ? `${patient.firstName} ${patient.lastName}` : '';

  useEffect(() => {
    const doctorId = Number(localStorage.getItem('doctor_id') || sessionStorage.getItem('active_doctor_id'));
    if (!doctorId) return;
    import('../../../services/doctors/doctor-services').then(({ getDoctor }) => {
      getDoctor(doctorId)
        .then((doc) => {
          const title = (doc as { gender?: string }).gender === 'Male' ? 'Dr.' : 'Dra.';
          setHeaderDoctor({ name: `${title} ${doc.firstName} ${doc.lastName}`, photoUrl: doc.photoUrl });
        })
        .catch(() => undefined);
    });
  }, []);

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
              <span>{headerDoctor?.name ?? 'Dra. Josiana Piña'}</span>
              {headerDoctor?.photoUrl
                ? <img className="avatar-mini" src={headerDoctor.photoUrl} alt="Foto del doctor" />
                : <div className="avatar-mini"><UserRound size={14} /></div>}
            </div>
          </div>
        </header>

        <div className="patient-file-body">
          {loading && <p className="patient-loading">Cargando paciente…</p>}
          {error && <p className="patient-error">{error}</p>}
          {!loading && !error && patient && (
          <>
          <section className="patient-overview">
            <div className="patient-header-row">
              <div className="patient-identity">
                <div className="patient-avatar">{initials(patientName) || '—'}</div>
                <div>
                  <p className="eyebrow">Paciente</p>
                  <h1>{patientName}</h1>
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
                <strong>{patient.age} años</strong>
              </div>
              <div className="meta-item">
                <span className="meta-label">Cédula</span>
                <strong>{patient.nationalId}</strong>
              </div>
              <div className="meta-item">
                <span className="meta-label">Procedencia</span>
                <strong>{patient.origin ?? '—'}</strong>
              </div>
            </div>

            <div className="vital-signs-row">
              <div className="vital-card">
                <span className="vital-label">P.A</span>
                <strong>{vitals.pa}</strong>
              </div>
              <div className="vital-card">
                <span className="vital-label">F.C</span>
                <strong>{vitals.fc}</strong>
              </div>
              <div className="vital-card">
                <span className="vital-label">Peso</span>
                <strong>{vitals.weight}</strong>
              </div>
            </div>
          </section>

          <aside className="next-appointment-card">
            <div className="appointment-header">
              <h3>PRÓXIMA CITA</h3>
            </div>

            <div className="calendar-panel">
              <div className="calendar-header">
                <button type="button" aria-label="Mes anterior" onClick={() => setCalendarMonth(new Date(calendarYear, calendarMonthIndex - 1, 1))}><ChevronLeft size={16} /></button>
                <span>{monthLabel}</span>
                <button type="button" aria-label="Mes siguiente" onClick={() => setCalendarMonth(new Date(calendarYear, calendarMonthIndex + 1, 1))}><ChevronRight size={16} /></button>
              </div>
              <div className="calendar-grid">
                {['Do','Lu','Ma','Mi','Ju','Vi','Sa'].map((d) => (
                  <span key={d} className="weekday-name">{d}</span>
                ))}
                {Array.from({ length: 35 }, (_, index) => {
                  const day = index - firstWeekday;
                  const isSelected = appointmentDay !== null && day === appointmentDay;
                  const isEmpty = day < 1 || day > daysInMonth;
                  return (
                    <span key={index} className={`day-cell ${isSelected ? 'selected' : ''} ${isEmpty ? 'muted' : ''}`}>
                      {!isEmpty && day >= 1 && day <= daysInMonth ? day : ''}
                    </span>
                  );
                })}
              </div>
            </div>

            <div className="appointment-detail">
            <div className="appointment-time">
              <Clock3 size={16} />
              <span>
                {nextAppointment?.appointmentDate
                  ? `${appointmentTime ?? ''} — ${new Date(nextAppointment.appointmentDate + 'T00:00:00').toLocaleDateString('es-VE', { weekday: 'long', day: 'numeric', month: 'long' })}`
                  : 'Sin próximas citas programadas'}
              </span>
            </div>
              <div className="appointment-reason">
                <div className="reason-icon">
                  <Stethoscope size={18} />
                </div>
                <div>
                  <span className="reason-label">Motivo</span>
                  <strong>{patient.medicalHistoryNotes || 'Control general'}</strong>
                </div>
              </div>
            </div>
          </aside>
          </>
          )}
        </div>

        {patient && (
        <section className="patient-tabs-section">
          <nav className="tabs-bar" aria-label="Pestañas del expediente">
            {TABS.map((tab, index) => (
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

                  if (tab === 'Paraclínicos') {
                    setIsSupplementaryTestsOpen(true);
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
                {patient.medicalHistoryNotes ? (
                  <div className="timeline-item">
                    <div className="timeline-dot" />
                    <div className="timeline-body">
                      <h4>Nota clínica</h4>
                      <span>{new Date(patient.updatedAt).toLocaleDateString('es-VE')}</span>
                      <p>{patient.medicalHistoryNotes}</p>
                    </div>
                  </div>
                ) : (
                  <p className="timeline-empty">Sin registros de evolución todavía.</p>
                )}
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
                  <li className="medicine-item medicine-empty">Sin medicamentos registrados.</li>
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
                  {patient.medicalHistoryNotes
                    ? null
                    : <li>Sin alertas registradas.</li>}
                </ul>
              </div>
            </div>
          </div>
        </section>
        )}
      </main>

      <ClinicalHistoryModal
        isOpen={isHistoryOpen}
        patientName={patientName}
        onClose={() => setIsHistoryOpen(false)}
        onAddHistory={() => {
          setIsHistoryOpen(false);
          setIsAddHistoryOpen(true);
        }}
      />

      <NewClinicalHistoryModal
        isOpen={isAddHistoryOpen}
        patientName={patientName}
        onClose={() => setIsAddHistoryOpen(false)}
      />

      <PrescriptionHistoryModal
        isOpen={isPrescriptionHistoryOpen}
        patientName={patientName}
        onClose={() => setIsPrescriptionHistoryOpen(false)}
        onAddPrescription={() => {
          setIsPrescriptionHistoryOpen(false);
          setIsPrescriptionFormOpen(true);
        }}
      />

      <PrescriptionFormModal
        isOpen={isPrescriptionFormOpen}
        patientName={patientName}
        onClose={() => setIsPrescriptionFormOpen(false)}
        onGenerate={() => setIsPrescriptionPreviewOpen(true)}
      />

      <PrescriptionPreviewModal
        isOpen={isPrescriptionPreviewOpen}
        patientName={patientName}
        patientAge={patient ? `${patient.age} años` : ""}
        patientWeight={vitals.weight}
        patientDoc={patient?.nationalId ?? ""}
        emissionDate="13 de Julio de 2026"
        onClose={() => setIsPrescriptionPreviewOpen(false)}
      />

      <ClinicalTimelineModal
        isOpen={isClinicalTimelineOpen}
        patientName={patientName}
        onClose={() => setIsClinicalTimelineOpen(false)}
        onAddStudy={() => {
          setIsClinicalTimelineOpen(false);
          setIsClinicalStudiesOpen(true);
        }}
      />

      <ClinicalStudiesModal
        isOpen={isClinicalStudiesOpen}
        patientName={patientName}
        onClose={() => setIsClinicalStudiesOpen(false)}
      />

      <SupplementaryTestsModal
        isOpen={isSupplementaryTestsOpen}
        patientName={patientName}
        onClose={() => setIsSupplementaryTestsOpen(false)}
        onAddTest={() => {
          setIsSupplementaryTestsOpen(false);
          setIsNewSupplementaryTestsOpen(true);
        }}
      />

      {isNewSupplementaryTestsOpen && <NewSupplementaryTests patientName={patientName} onClose={() => setIsNewSupplementaryTestsOpen(false)} />}
    </div>
  );
}
