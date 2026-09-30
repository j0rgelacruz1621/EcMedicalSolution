import './style.scss'
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import LeftSideBar from '../../left-sideBar'
import NewPatientModal from '../../modals/new-patient';
import ConfirmNewPatientModal from '../../modals/confirm-new-patient';
import CheckCircleOutlineOutlinedIcon from '@mui/icons-material/CheckCircleOutlineOutlined';
import PersonAddAlt1OutlinedIcon from '@mui/icons-material/PersonAddAlt1Outlined';
import EventOutlinedIcon from '@mui/icons-material/EventOutlined';


import {
  Plus, Bell, CircleHelp,
  ChevronLeft,
  ChevronRight, Eye, PencilLine,
  MapPin,
  UsersRound, UserRoundPlus, AlertCircle
} from 'lucide-react'
import { getPatients, type Patient } from '../../../services/patients/patient-services';
import { getAppointments, type Appointment } from '../../../services/appointments/appointment-services';
import { getOffices, type Office } from '../../../services/medical-center/medical-center-services';

function formatDate(value?: string) {
  if (!value) return 'Sin registro';
  return new Intl.DateTimeFormat('es-ES', { dateStyle: 'medium' }).format(new Date(value));
}

function getInitials(patient: Patient) {
  return `${patient.firstName[0] ?? ''}${patient.lastName[0] ?? ''}`.toUpperCase();
}

export default function PatientsView() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const role = localStorage.getItem('user_rol');
  const doctorId = role === 'DOCTOR' ? Number(localStorage.getItem('doctor_id')) : Number(searchParams.get('doctorId') || sessionStorage.getItem('active_doctor_id')) || undefined;
  const controlPanelPath = doctorId ? `/control-panel?doctorId=${doctorId}` : '/control-panel';
  const [showModal, setShowModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [lastAddedName, setLastAddedName] = useState('');
  const [lastAddedId, setLastAddedId] = useState<number | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [totalPatients, setTotalPatients] = useState(0);
  const [page, setPage] = useState(1);
  const activeDoctorName = sessionStorage.getItem('active_doctor_name') || 'Administración';
  const activeDoctorInitials = (sessionStorage.getItem('active_doctor_name') || 'JD').split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]).join('').toUpperCase() || 'JD';
  const [nameFilter, setNameFilter] = useState('');
  const [nationalIdFilter, setNationalIdFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({
    newThisMonth: 0,
    appointmentsThisWeek: 0,
    totalPatients: 0,
  });
  const [doctorOffices, setDoctorOffices] = useState<Office[]>([]);
  const [officePatientCounts, setOfficePatientCounts] = useState<Record<number, number>>({});

  useEffect(() => {
    let active = true;

    if (doctorId) {
      import('../../../services/doctors/doctor-services').then(({ getDoctor }) => {
        getDoctor(doctorId)
          .then((doctorResult) => {
            sessionStorage.setItem('active_doctor_name', `${doctorResult.firstName} ${doctorResult.lastName}`)
          })
          .catch(() => undefined)
      })
    }

    async function loadPatients() {
      setLoading(true);
      setError('');

      try {
        const [result, appointmentsResult] = await Promise.all([
          getPatients({
            page,
            limit: 10,
            firstName: nameFilter || undefined,
            nationalId: nationalIdFilter || undefined,
            doctorId,
          }),
          getAppointments({ doctorId, limit: 200 }),
        ]);

        if (!active) return;

        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const currentWeekStart = new Date(now);
        currentWeekStart.setDate(now.getDate() - ((now.getDay() + 6) % 7));
        currentWeekStart.setHours(0, 0, 0, 0);

        const newThisMonth = result.data.filter(patient => {
          if (!patient.createdAt) return false;
          return new Date(patient.createdAt) >= monthStart;
        }).length;

        const appointmentsThisWeek = appointmentsResult.data.filter(appointment => {
          if (!appointment.appointmentDate) return new Date(appointment.appointmentDate) >= currentWeekStart;
          return new Date(appointment.appointmentDate) >= currentWeekStart;
        }).length;

        setPatients(result.data);
        setTotalPatients(result.total);
        setStats({
          newThisMonth,
          appointmentsThisWeek,
          totalPatients: result.total,
        });
      } catch {
        if (active) setError('No se pudo cargar el listado de pacientes.');
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadPatients();
    return () => { active = false; };
  }, [nameFilter, nationalIdFilter, page, doctorId]);

  // Consultorios del centro médico del doctor + pacientes por consultorio
  useEffect(() => {
    let active = true;
    if (!doctorId) return;

    Promise.all([
      import('../../../services/doctors/doctor-services').then(({ getDoctor }) => getDoctor(doctorId)),
      getOffices(),
    ])
      .then(([doctorResult, allOffices]) => {
        if (!active) return;
        const doctorOffice = doctorResult.officeId
          ? allOffices.find(office => office.id === Number(doctorResult.officeId))
          : undefined;
        const centerOffices = doctorOffice?.medicalCenterId
          ? allOffices.filter(office => office.medicalCenterId === doctorOffice.medicalCenterId)
          : allOffices;
        setDoctorOffices(centerOffices);
      })
      .catch(() => {
        if (active) setDoctorOffices([]);
      });

    return () => { active = false; };
  }, [doctorId]);

  useEffect(() => {
    if (!doctorId || doctorOffices.length === 0) return;
    let active = true;

    getAppointments({ doctorId, limit: 200 })
      .then(appointmentsResult => {
        if (!active) return;
        const counts: Record<number, number> = {};
        doctorOffices.forEach(office => {
          counts[office.id] = new Set(
            appointmentsResult.data
              .filter(appointment => appointment.officeId === office.id && appointment.patient?.nationalId)
              .map(appointment => appointment.patient!.nationalId),
          ).size;
        });
        setOfficePatientCounts(counts);
      })
      .catch(() => {
        if (active) setOfficePatientCounts({});
      });

    return () => { active = false; };
  }, [doctorId, doctorOffices]);

  const handlePatientCreated = (patient: Patient) => {
    setLastAddedName(`${patient.firstName} ${patient.lastName}`);
    setLastAddedId(patient.id);
    setPatients((current) => [patient, ...current]);
    setTotalPatients((current) => current + 1);
    setShowModal(false);
    setShowConfirmModal(false);
    navigate(controlPanelPath);
  };

  const handleViewPatientFile = () => {
    setShowConfirmModal(false);
    navigate(lastAddedId ? `/patients/${lastAddedId}` : '/patients/1');
  };

  const cardMetrics = useMemo(() => [
    {
      key: 'newThisMonth',
      label: 'Nuevos este mes',
      value: stats.newThisMonth,
      dark: true,
      icon: PersonAddAlt1OutlinedIcon,
    },
    // Una tarjeta por cada consultorio del centro médico del doctor
    ...doctorOffices.map((office, index) => ({
      key: `office-${office.id}`,
      label: `Pacientes ${office.officeNumber}${office.medicalCenter?.name && office.medicalCenter.name !== office.officeNumber ? ` · ${office.medicalCenter.name}` : ''}`,
      value: officePatientCounts[office.id] ?? 0,
      dark: false,
      icon: CheckCircleOutlineOutlinedIcon,
      color: index === 0 ? 'success !important' : undefined,
    })),
    {
      key: 'appointmentsThisWeek',
      label: 'Citas esta semana',
      value: stats.appointmentsThisWeek,
      dark: false,
      icon: EventOutlinedIcon,
    },
  ], [stats, doctorOffices, officePatientCounts]);

  return (
    <div className="patients-root">
      <LeftSideBar />

      <main className="patients-main">
        <header className="cp-header">
          <h1>Pacientes</h1>
          <div className="cp-header-right">
            <button className="icon" aria-label="Notificaciones"><Bell size={18} /></button>
            <button className="icon" aria-label="Ayuda"><CircleHelp size={18} /></button>
            <div className="cp-user">
              <span>{activeDoctorName}</span>
              <span className="cp-user-badge">{activeDoctorInitials}</span>
            </div>
          </div>
        </header>

        <section className="patients-content">
          <div className="content-header">
            <div className="content-header__text">
              <h1>Listado de Pacientes</h1>
              <p>Gestione y supervise la salud cardiovascular de sus pacientes</p>
            </div>

            <button
                className="btn-new-patient"
                onClick={() => setShowModal(true)}
            >
                <Plus size={18} /> Nuevo Paciente
            </button>
          </div>

          <div className="filters-bar">
            <div className="filter-group">
              <label>Filtrar por:</label>
              <select className="form-select-custom">
                <option>Procedencia</option>
              </select>
              <input type="text" placeholder="Nombre del paciente" className="input-custom" value={nameFilter} onChange={(event) => { setPage(1); setNameFilter(event.target.value); }} />
              <input type="text" placeholder="Cédula" className="input-custom" value={nationalIdFilter} onChange={(event) => { setPage(1); setNationalIdFilter(event.target.value); }} />
            </div>
          </div>

          <div className="table-container shadow-sm">
            <table className="patients-table">
              <thead>
                <tr>
                  <th>Nombre Completo</th>
                  <th>Cédula</th>
                  <th>Edad</th>
                  <th>Última Visita</th>
                  <th>Procedencia</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loading && <tr><td colSpan={6}>Cargando pacientes...</td></tr>}
                {!loading && error && <tr><td colSpan={6}>{error}</td></tr>}
                {!loading && !error && patients.length === 0 && <tr><td colSpan={6}>No hay pacientes registrados.</td></tr>}
                {!loading && !error && patients.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <div className="patient-info">
                        <div className={`avatar-circle bg-light-${(p.id % 5) + 1}`}>{getInitials(p)}</div>
                        <div>
                          <div className="p-name">{p.firstName} {p.lastName}</div>
                          <div className="p-email">{p.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>{p.nationalId}</td>
                    <td>{p.age}</td>
                    <td>{formatDate(p.latestVitals?.measured_at)}</td>
                    <td>-</td>
                    <td>
                      <div className="action-btns">
                        <button type="button" title="Ver historia" onClick={() => navigate(`/patients/${p.id}`)} aria-label="Ver historia del paciente">
                          <Eye size={16} />
                        </button>
                        <button type="button" title="Editar paciente" aria-label="Editar paciente">
                          <PencilLine size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="table-footer">
              <span>Mostrando {patients.length} de {totalPatients} pacientes</span>
              <div className="pagination">
                <button className="page-nav" disabled={page === 1} onClick={() => setPage((current) => current - 1)}><ChevronLeft size={18}/></button>
                <span className="page-num active">{page}</span>
                <button className="page-nav" disabled={patients.length === 0 || patients.length + (page - 1) * 10 >= totalPatients} onClick={() => setPage((current) => current + 1)}><ChevronRight size={18}/></button>
              </div>
            </div>
          </div>

          <div className="kpi-grid">
            {cardMetrics.map(({ key, label, value, dark, icon: Icon, color }) => (
              <div key={key} className={`kpi-card ${dark ? 'dark' : 'outline'}${color ? ` kpi-card--${color.replace(' !important', '')}` : ''}`}>
                <div className="kpi-content">
                  <div className={`kpi-icon-box ${dark ? 'dark' : ''}${color ? ` ${color.replace(' !important', '')}` : ''}`}>
                    {Icon ? <Icon size={24} style={color ? { color: '#2e7d32', fontSize: 24 } : undefined} /> : null}
                  </div>
                  <div className="kpi-data">
                    <span className="kpi-value">{value}</span>
                  </div>
                </div>
                <span className="kpi-label">{label}</span>
              </div>
            ))}
          </div>
        </section>
      </main>

      <NewPatientModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={handlePatientCreated}
        doctorId={doctorId}
      />

      <ConfirmNewPatientModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onViewFile={handleViewPatientFile}
        patientName={lastAddedName || 'Paciente'}
      />
    </div>
  )
}