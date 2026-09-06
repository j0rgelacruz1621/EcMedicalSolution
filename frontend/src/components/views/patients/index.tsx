import './style.scss'
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LeftSideBar from '../../left-sideBar'
import NewPatientModal from '../../modals/new-patient';
import ConfirmNewPatientModal from '../../modals/confirm-new-patient';

import {
  Plus, Bell, CircleHelp, User,
  ChevronLeft,
  ChevronRight, Edit, Eye,
  Calendar as CalIcon, MapPin
} from 'lucide-react'
import { getPatients, type Patient } from '../../../services/patients/patient-services';

function getAge(dateOfBirth: string) {
  const birthDate = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const birthdayHasPassed = today.getMonth() > birthDate.getMonth() ||
    (today.getMonth() === birthDate.getMonth() && today.getDate() >= birthDate.getDate());

  if (!birthdayHasPassed) age -= 1;
  return age;
}

function formatDate(value?: string) {
  if (!value) return 'Sin registro';
  return new Intl.DateTimeFormat('es-ES', { dateStyle: 'medium' }).format(new Date(value));
}

function getInitials(patient: Patient) {
  return `${patient.firstName[0] ?? ''}${patient.lastName[0] ?? ''}`.toUpperCase();
}

export default function PatientsView() {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [lastAddedName, setLastAddedName] = useState('');
  const [lastAddedId, setLastAddedId] = useState<number | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [totalPatients, setTotalPatients] = useState(0);
  const [page, setPage] = useState(1);
  const [nameFilter, setNameFilter] = useState('');
  const [nationalIdFilter, setNationalIdFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    async function loadPatients() {
      setLoading(true);
      setError('');

      try {
        const result = await getPatients({
          page,
          limit: 10,
          firstName: nameFilter || undefined,
          nationalId: nationalIdFilter || undefined,
        });

        if (active) {
          setPatients(result.data);
          setTotalPatients(result.total);
        }
      } catch {
        if (active) setError('No se pudo cargar el listado de pacientes.');
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadPatients();
    return () => { active = false; };
  }, [nameFilter, nationalIdFilter, page]);

  const handlePatientCreated = (patient: Patient) => {
    setLastAddedName(`${patient.firstName} ${patient.lastName}`);
    setLastAddedId(patient.id);
    setPatients((current) => [patient, ...current]);
    setTotalPatients((current) => current + 1);
    setShowModal(false);
    setShowConfirmModal(true);
  };

  const handleViewPatientFile = () => {
    setShowConfirmModal(false);
    navigate(lastAddedId ? `/patients/${lastAddedId}` : '/patients/1');
  };

  return (
    <div className="patients-root">
      <LeftSideBar />

      <main className="patients-main">
        <header className="patients-top-header">
          <h2 className="page-title">Pacientes</h2>
          <div className="header-right">
            <button className="icon-btn"><Bell size={20} /></button>
            <button className="icon-btn"><CircleHelp size={20} /></button>
            <div className="user-info">
              <span>Dra. Josiana Piña</span>
              <div className="mini-avatar"><User size={16}/></div>
            </div>
          </div>
        </header>

        <section className="patients-content">
          <div className="content-header">
            <div>
              <h1>Listado de Pacientes</h1>
              <p>Gestione y supervise la salud cardiovascular...</p>
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
                    <td>{getAge(p.dateOfBirth)}</td>
                    <td>{formatDate(p.latestVitals?.measured_at)}</td>
                    <td>-</td>
                    <td>
                      <div className="action-btns">
                        <button title="Ver historia" onClick={() => navigate(`/patients/${p.id}`)}><Eye size={16} /></button>
                        <button title="Editar"><Edit size={16} /></button>
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
            <div className="kpi-card dark">
              <div className="kpi-icon-box"><Plus size={20} /></div>
              <div className="kpi-data">
                <span className="kpi-value">{totalPatients}</span>
                <span className="kpi-label">Pacientes registrados</span>
              </div>
            </div>

            <div className="kpi-card outline">
              <div className="kpi-icon-box green"><MapPin size={20} /></div>
              <div className="kpi-data">
                <span className="kpi-value">942</span>
                <span className="kpi-label">Pacientes Mérida</span>
              </div>
            </div>

            <div className="kpi-card outline">
              <div className="kpi-icon-box orange"><MapPin size={20} /></div>
              <div className="kpi-data">
                <span className="kpi-value">15</span>
                <span className="kpi-label">Pacientes Tovar</span>
              </div>
            </div>

            <div className="kpi-card outline">
              <div className="kpi-icon-box vinotinto"><CalIcon size={20} /></div>
              <div className="kpi-data">
                <span className="kpi-value">42</span>
                <span className="kpi-label">Citas esta semana</span>
              </div>
            </div>
          </div>
        </section>
      </main>

      <NewPatientModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={handlePatientCreated}
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