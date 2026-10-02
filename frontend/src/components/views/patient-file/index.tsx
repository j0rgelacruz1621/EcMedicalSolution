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
import { getPatientById, getPatientVitalsHistory, type Patient, type PatientVitals } from '../../../services/patients/patient-services';
import { getAppointments } from '../../../services/appointments/appointment-services';

function getAge(dateOfBirth: string) {
  const birthDate = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const birthdayHasPassed = today.getMonth() > birthDate.getMonth() ||
    (today.getMonth() === birthDate.getMonth() && today.getDate() >= birthDate.getDate());

  if (!birthdayHasPassed) age -= 1;
  return age;
}

const tabs = ['Información General', 'Historial Clínico', 'Récipes', 'Estudios', 'Paraclínicos', 'RX Tórax', 'Preoperatoria'];

function formatDate(value?: string | null) {
  if (!value) return 'Sin registro';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Sin registro';
  return new Intl.DateTimeFormat('es-ES', { dateStyle: 'medium' }).format(date);
}

function formatTime(value?: string | null) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('es-ES', { timeStyle: 'short' }).format(date);
}

function buildCalendarCells(monthDate: Date) {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7;
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstWeekday; i += 1) cells.push(null);
  for (let day = 1; day <= daysInMonth; day += 1) cells.push(day);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export default function PatientFileView() {
  const { id } = useParams();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isAddHistoryOpen, setIsAddHistoryOpen] = useState(false);
  const [isPrescriptionHistoryOpen, setIsPrescriptionHistoryOpen] = useState(false);
  const [isPrescriptionFormOpen, setIsPrescriptionFormOpen] = useState(false);
  const [isPrescriptionPreviewOpen, setIsPrescriptionPreviewOpen] = useState(false);
  const [isClinicalTimelineOpen, setIsClinicalTimelineOpen] = useState(false);
  const [isClinicalStudiesOpen, setIsClinicalStudiesOpen] = useState(false);
  const [isSupplementaryTestsOpen, setIsSupplementaryTestsOpen] = useState(false);
  const [isNewSupplementaryTestsOpen, setIsNewSupplementaryTestsOpen] = useState(false);
  const [vitalsHistory, setVitalsHistory] = useState<PatientVitals[]>([]);
  const [appointments, setAppointments] = useState<{ date?: string; time?: string; reason?: string }[]>([]);
  const [calendarMonth, setCalendarMonth] = useState(() => new Date());
  const activeDoctorName = sessionStorage.getItem('active_doctor_name') || 'Administración';

  useEffect(() => {
    let active = true;

    async function loadPatient() {
      if (!id) {
        setLoading(false);
        setError('Paciente no encontrado.');
        return;
      }

      setLoading(true);
      setError('');

      try {
        const selectedPatient = await getPatientById(Number(id));
        if (!active) return;

        if (!selectedPatient) {
          setError('No se encontró el paciente seleccionado.');
          setPatient(null);
          return;
        }

        setPatient(selectedPatient);

        const [vitalsResult, appointmentsResult] = await Promise.allSettled([
          getPatientVitalsHistory(Number(id), { limit: 50 }),
          getAppointments({ patientId: Number(id), limit: 100 }),
        ]);

        if (!active) return;

        setVitalsHistory(vitalsResult.status === 'fulfilled' ? (vitalsResult.value.data ?? []) : []);
        setAppointments(
          appointmentsResult.status === 'fulfilled'
            ? (appointmentsResult.value.data ?? [])
                .filter((appointment) => appointment.appointmentDate)
                .map((appointment) => ({
                  date: appointment.appointmentDate,
                  time: appointment.startTime,
                  reason: appointment.reasonForVisit,
                }))
            : [],
        );
      } catch {
        if (active) {
          setError('No se pudo cargar la información del paciente.');
          setPatient(null);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadPatient();

    return () => {
      active = false;
    };
  }, [id]);

  const monthLabel = useMemo(
    () => new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric' }).format(calendarMonth),
    [calendarMonth],
  );
  const patientName = patient ? `${patient.firstName} ${patient.lastName}` : 'Paciente';
  const patientInitials = patient ? `${patient.firstName[0] ?? ''}${patient.lastName[0] ?? ''}`.toUpperCase() : 'P';
  const patientAge = patient ? `${getAge(patient.dateOfBirth)} años` : 'Sin registro';
  const patientDocument = patient?.nationalId ?? 'Sin registro';
  const patientOrigin = patient?.phone?.trim() ? `Tel. ${patient.phone}` : 'Sin registro';
  const patientPa = patient?.latestVitals
    ? `${patient.latestVitals.blood_pressure_systolic ?? '--'}/${patient.latestVitals.blood_pressure_diastolic ?? '--'} mmHg`
    : 'Sin registro';
  const patientFc = patient?.latestVitals
    ? `${patient.latestVitals.heart_rate_bpm ?? '--'} BPM`
    : 'Sin registro';
  const patientWeight = patient?.latestVitals
    ? `${patient.latestVitals.weight_kg ?? '--'} Kg`
    : 'Sin registro';

  const calendarCells = useMemo(() => buildCalendarCells(calendarMonth), [calendarMonth]);

  const selectedDay = useMemo(() => {
    if (!appointments.length) return null;
    const upcoming = [...appointments].sort(
      (a, b) => new Date(a.date ?? 0).getTime() - new Date(b.date ?? 0).getTime(),
    );
    const next = upcoming.find((appointment) => {
      const date = appointment.date ? new Date(appointment.date) : null;
      return date instanceof Date && date.getTime() >= Date.now() - 24 * 60 * 60 * 1000;
    }) ?? upcoming[0];
    const date = next?.date ? new Date(next.date) : null;
    if (!date || Number.isNaN(date.getTime())) return null;
    return {
      day: date.getDate(),
      date: next?.date,
      time: next?.time,
      reason: next?.reason,
    };
  }, [appointments]);

  const patientTimeline = useMemo(() => {
    if (!patient) return [];
    const events = [
      {
        title: 'Registro inicial del paciente',
        date: formatDate(patient.createdAt),
        text: patient.medicalHistoryNotes?.trim()
          ? patient.medicalHistoryNotes
          : 'Paciente registrado sin notas de historia clínica.',
      },
    ];

    if (vitalsHistory.length) {
      const latest = vitalsHistory[0];
      events.push({
        title: 'Signos vitales',
        date: formatDate(latest.measured_at),
        text: `P.A: ${latest.blood_pressure_systolic ?? '--'}/${latest.blood_pressure_diastolic ?? '--'} mmHg \u00b7 F.C: ${latest.heart_rate_bpm ?? '--'} BPM \u00b7 Peso: ${latest.weight_kg ?? '--'} Kg`,
      });
    } else {
      events.push({
        title: 'Signos vitales',
        date: 'Sin registro',
        text: 'Este paciente aún no tiene signos vitales registrados.',
      });
    }

    return events;
  }, [patient, vitalsHistory]);

  const patientMedications = useMemo(() => {
    if (!patient) return [];
    const notes = patient.medicalHistoryNotes?.trim();
    if (!notes) return [];
    return [
      {
        name: 'Ver historia clínica',
        dose: `Actualizado ${formatDate(patient.updatedAt)}`,
        frequency: 'Registrado en notas médicas',
      },
    ];
  }, [patient]);

  const patientAlerts = useMemo(() => {
    if (!patient) return [];
    const notes = patient.medicalHistoryNotes?.trim();
    if (!notes) return ['Sin alergias ni alertas registradas.'];
    return [notes];
  }, [patient]);

  if (loading) {
    return (
      <div className="patient-file-root">
        <LeftSideBar />
        <main className="patient-file-main">
          <div className="patient-file-empty-state">Cargando información del paciente...</div>
        </main>
      </div>
    );
  }

  if (error || !patient) {
    return (
      <div className="patient-file-root">
        <LeftSideBar />
        <main className="patient-file-main">
          <div className="patient-file-empty-state">{error || 'No existe información disponible para este paciente.'}</div>
        </main>
      </div>
    );
  }

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
              <span>{activeDoctorName}</span>
              <div className="avatar-mini"><UserRound size={14} /></div>
            </div>
          </div>
        </header>

        <div className="patient-file-body">
          <section className="patient-overview">
            <div className="patient-header-row">
              <h1 className="patient-name">{patientName}</h1>
            </div>

            <div className="patient-details-grid">
              <div className="detail-item">
                <span className="detail-label">Edad:</span>
                <span className="detail-value">{patientAge}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Cédula:</span>
                <span className="detail-value">{patientDocument}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Procedencia</span>
                <span className="detail-value">{patientOrigin}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">P.A:</span>
                <span className="detail-value">{patientPa}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">F.C:</span>
                <span className="detail-value">{patientFc}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Peso:</span>
                <span className="detail-value">{patientWeight}</span>
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
          </section>

          <aside className="next-appointment-card">
            <div className="appointment-header">
              <h3>PRÓXIMA CITA</h3>
            </div>

            <div className="calendar-panel">
              <div className="calendar-header">
                <button type="button" aria-label="Mes anterior" onClick={() => setCalendarMonth((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1))}><ChevronLeft size={16} /></button>
                <span>{monthLabel}</span>
                <button type="button" aria-label="Mes siguiente" onClick={() => setCalendarMonth((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1))}><ChevronRight size={16} /></button>
              </div>
              <div className="calendar-grid">
                {['Lu','Ma','Mi','Ju','Vi','Sa','Do'].map((d) => (
                  <span key={d} className="weekday-name">{d}</span>
                ))}
                {calendarCells.map((day, index) => {
                  const isSelected = day !== null && day === selectedDay?.day;
                  return (
                    <span key={`${day ?? 'empty'}-${index}`} className={`day-cell ${isSelected ? 'selected' : ''} ${day === null ? 'muted' : ''}`}>
                      {day ?? ''}
                    </span>
                  );
                })}
              </div>
            </div>

            <div className="appointment-detail">
              <div className="appointment-time">
                <Clock3 size={16} />
                <span>{selectedDay ? `${formatDate(selectedDay.date)}${selectedDay.time ? ` - ${formatTime(selectedDay.date)}` : ''}` : 'Sin cita programada'}</span>
              </div>
              <div className="appointment-reason">
                <div className="reason-icon">
                  <Stethoscope size={18} />
                </div>
                <div>
                  <span className="reason-label">Motivo</span>
                  <strong>{selectedDay?.reason?.trim() || 'Sin motivo registrado'}</strong>
                </div>
              </div>
            </div>
          </aside>
        </div>

        <section className="patient-tabs-section">
          <nav className="tabs-bar" aria-label="Pestañas del expediente">
            {tabs.map((tab, index) => (
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
                {patientTimeline.map((event) => (
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
                  {patientMedications.map((medication) => (
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
                  {patientAlerts.map((alert) => (
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
        patientName={patientName}
        patient={patient}
        vitalsHistory={vitalsHistory}
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
        patient={patient}
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
        patientAge={patientAge}
        patientWeight={patientWeight}
        patientDoc={patientDocument}
        emissionDate={new Intl.DateTimeFormat('es-ES', { dateStyle: 'long' }).format(new Date())}
        doctorName={activeDoctorName}
        doctorSpecialty="CARDIÓLOGO CLÍNICO"
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
