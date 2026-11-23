import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import {
  Building2,
  Bell,
  CircleHelp,
  Clock3,
  MapPin,
  Pencil,
  Phone,
  Plus,
  Search,
  Stethoscope,
  Trash2,
  X,
} from 'lucide-react';
import LeftSideBar from '../../left-sideBar';
import DashboardHeader from '../../dashboard-header';
import RegisterMedicalCenterModal from '../../modals/register-medical-center';
import MedicalCenterCreatedModal from '../../modals/medical-center-created';
import {
  createMedicalCenter,
  deactivateMedicalCenter,
  getMedicalCenters,
  updateMedicalCenter,
  type MedicalCenter,
  type MedicalCenterPayload,
} from '../../../services/medical-center/medical-center-services';
import './style.scss';

type StatusFilter = 'ALL' | 'ACTIVE' | 'INACTIVE';

type CreatedCenterSummary = {
  name: string;
  address: string;
  schedule: string;
};

const EMPTY_FORM: MedicalCenterPayload = {
  name: '',
  address: '',
  phone: '',
  schedule: '',
  isActive: true,
};

function normalized(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es');
}

function getCity(address?: string | null) {
  if (!address?.trim()) return '';
  const segments = address.split(',').map((part) => part.trim()).filter(Boolean);
  const last = segments.at(-1) ?? '';
  return last.replace(/^(edo\.?|estado)\s*/i, '').replace(/\.$/, '').trim();
}

function scheduleForToday(schedule?: string | null) {
  if (!schedule?.trim()) return null;

  const dayNames = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
  const todayIndex = (new Date().getDay() + 6) % 7;
  const todayName = dayNames[todayIndex];
  const parts = schedule.split(/[\n/;]+/).map((part) => normalized(part.trim())).filter(Boolean);
  const matchingPart = parts.find((part) => {
    if (part.includes(todayName)) return true;

    const range = part.match(/(lunes|martes|miercoles|jueves|viernes|sabado|domingo)\s+(?:a|al|-|–)\s+(lunes|martes|miercoles|jueves|viernes|sabado|domingo)/);
    if (!range) return false;
    const start = dayNames.indexOf(range[1]);
    const end = dayNames.indexOf(range[2]);
    return start <= end
      ? todayIndex >= start && todayIndex <= end
      : todayIndex >= start || todayIndex <= end;
  });

  if (!matchingPart) return null;
  if (matchingPart.includes('manana')) return 'Mañana';
  if (matchingPart.includes('tarde')) return 'Tarde';
  if (matchingPart.includes('noche')) return 'Noche';

  const time = matchingPart.match(/(\d{1,2})(?::\d{2})?\s*(am|pm)/);
  if (time) {
    const hour = Number(time[1]) % 12 + (time[2] === 'pm' ? 12 : 0);
    return hour < 12 ? 'Mañana' : hour < 19 ? 'Tarde' : 'Noche';
  }

  return 'Horario configurado';
}

function formatRegisteredDate(value?: string | null) {
  if (!value) return 'Fecha no disponible';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Fecha no disponible';
  return new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }).format(date);
}

function getErrorMessage(error: unknown, fallback: string) {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const response = error.response;
    if (typeof response === 'object' && response !== null && 'data' in response) {
      const data = response.data;
      if (typeof data === 'object' && data !== null && 'message' in data && typeof data.message === 'string') {
        return data.message;
      }
    }
  }
  return fallback;
}

export default function ConsultingRoomsView() {
  const [centers, setCenters] = useState<MedicalCenter[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isNewCenterModalOpen, setIsNewCenterModalOpen] = useState(false);
  const [createdCenter, setCreatedCenter] = useState<CreatedCenterSummary | null>(null);
  const [editingCenter, setEditingCenter] = useState<MedicalCenter | null>(null);
  const [form, setForm] = useState<MedicalCenterPayload>(EMPTY_FORM);

  const activeDoctorName = sessionStorage.getItem('active_doctor_name') || 'Administración';
  const activeCenterCount = centers.filter((center) => center.isActive !== false).length;

  const loadCenters = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setCenters(await getMedicalCenters(true));
    } catch (caught) {
      setError(getErrorMessage(caught, 'No se pudieron cargar los consultorios.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCenters();
  }, [loadCenters]);

  const activeCenters = useMemo(
    () => centers.filter((center) => center.isActive !== false),
    [centers],
  );

  const coveredCities = useMemo(
    () => [...new Set(activeCenters.map((center) => getCity(center.address)).filter(Boolean))],
    [activeCenters],
  );

  const activeShift = useMemo(() => {
    for (const center of activeCenters) {
      const shift = scheduleForToday(center.schedule);
      if (shift) return `${center.name} • ${shift}`;
    }
    return 'Sin jornada configurada hoy';
  }, [activeCenters]);

  const visibleCenters = useMemo(() => {
    const query = normalized(search.trim());
    return centers.filter((center) => {
      const isActive = center.isActive !== false;
      if (statusFilter === 'ACTIVE' && !isActive) return false;
      if (statusFilter === 'INACTIVE' && isActive) return false;
      if (!query) return true;
      const officeDetails = (center.offices ?? [])
        .map((office) => `${office.officeNumber} ${office.locationDetails ?? ''}`)
        .join(' ');
      return normalized(`${center.name} ${center.address ?? ''} ${center.phone ?? ''} ${center.schedule ?? ''} ${officeDetails}`)
        .includes(query);
    });
  }, [centers, search, statusFilter]);

  const openCreateForm = () => {
    setCreatedCenter(null);
    setEditingCenter(null);
    setForm(EMPTY_FORM);
    setError('');
    setMessage('');
    setIsNewCenterModalOpen(true);
  };

  const openEditForm = (center: MedicalCenter) => {
    setEditingCenter(center);
    setForm({
      name: center.name,
      address: center.address ?? '',
      phone: center.phone ?? '',
      schedule: center.schedule ?? '',
      isActive: center.isActive !== false,
    });
    setError('');
    setMessage('');
    setIsFormOpen(true);
  };

  const updateForm = (field: keyof MedicalCenterPayload, value: string | boolean) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleCreateCenter = async (payload: MedicalCenterPayload) => {
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const created = await createMedicalCenter(payload);
      setIsNewCenterModalOpen(false);
      setCreatedCenter({
        name: created.name || payload.name,
        address: payload.address || created.address || '',
        schedule: payload.schedule || created.schedule || '',
      });
      void loadCenters();
    } catch (caught) {
      setError(getErrorMessage(caught, 'No se pudo guardar el consultorio.'));
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');
    const payload = {
      name: form.name?.trim() ?? '',
      address: form.address?.trim() || undefined,
      phone: form.phone?.trim() || undefined,
      schedule: form.schedule?.trim() || undefined,
      isActive: form.isActive,
    };

    try {
      if (!editingCenter) return;
      await updateMedicalCenter(editingCenter.id, payload);
      setMessage('Consultorio actualizado correctamente.');
      setIsFormOpen(false);
      await loadCenters();
    } catch (caught) {
      setError(getErrorMessage(caught, 'No se pudo guardar el consultorio.'));
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async (center: MedicalCenter) => {
    if (!window.confirm(`¿Desea eliminar "${center.name}"? El consultorio quedará inactivo y podrá consultarlo usando el filtro de estado.`)) return;
    setError('');
    setMessage('');
    try {
      await deactivateMedicalCenter(center.id);
      setMessage('Consultorio desactivado correctamente.');
      await loadCenters();
    } catch (caught) {
      setError(getErrorMessage(caught, 'No se pudo desactivar el consultorio.'));
    }
  };

  return (
    <div className="consulting-rooms-root">
      <LeftSideBar />
      <main className="consulting-rooms-main">
        <DashboardHeader
          title="Consultorios"
          centerContent={
            <span className="consulting-rooms-active-badge">
              {activeCenterCount} {activeCenterCount === 1 ? 'Activo' : 'Activos'}
            </span>
          }
        >
          <button type="button" className="consulting-rooms-header-icon" aria-label="Notificaciones">
            <Bell size={16} />
          </button>
          <button type="button" className="consulting-rooms-header-icon" aria-label="Ayuda">
            <CircleHelp size={16} />
          </button>
          <div className="consulting-rooms-header-user">
            <span>{activeDoctorName}</span>
            <small>{localStorage.getItem('user_rol') === 'SA' ? 'Administración' : 'Consultorios médicos'}</small>
          </div>
          <span className="consulting-rooms-avatar"><Stethoscope size={16} /></span>
        </DashboardHeader>

        <div className="consulting-rooms-content">
          <section className="consulting-rooms-intro">
            <div>
              <h2>Sedes y Espacios de Atención Médica</h2>
              <p>Administre sus centros clínicos, ubicaciones y horarios de consulta para sus pacientes.</p>
            </div>
            <button type="button" className="consulting-rooms-primary-button" onClick={openCreateForm}>
              <Plus size={17} />
              Registrar Consultorio
            </button>
          </section>

          {message && <p className="consulting-rooms-message" role="status">{message}</p>}
          {error && <p className="consulting-rooms-error" role="alert">{error}</p>}

          <section className="consulting-rooms-kpis" aria-label="Resumen de consultorios">
            <article className="consulting-rooms-kpi">
              <span className="consulting-rooms-kpi-icon kpi-red"><Building2 size={20} /></span>
              <div><small>TOTAL CONSULTORIOS</small><strong>{centers.length}</strong></div>
            </article>
            <article className="consulting-rooms-kpi">
              <span className="consulting-rooms-kpi-icon kpi-green"><Clock3 size={20} /></span>
              <div><small>JORNADA ACTIVA HOY</small><strong>{activeShift}</strong></div>
            </article>
            <article className="consulting-rooms-kpi">
              <span className="consulting-rooms-kpi-icon kpi-blue"><MapPin size={20} /></span>
              <div><small>CIUDADES CON COBERTURA</small><strong>{coveredCities.length ? coveredCities.join(' y ') : 'Sin cobertura registrada'}</strong></div>
            </article>
          </section>

          <section className="consulting-rooms-toolbar" aria-label="Buscar y filtrar consultorios">
            <label className="consulting-rooms-search">
              <Search size={16} />
              <span className="visually-hidden">Buscar consultorio o ubicación</span>
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar consultorio o ubicación..."
              />
            </label>
            <label className="consulting-rooms-status-filter">
              <span>Filtrar por:</span>
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}>
                <option value="ALL">Todos los consultorios</option>
                <option value="ACTIVE">Activos</option>
                <option value="INACTIVE">Inactivos</option>
              </select>
            </label>
          </section>

          {loading ? (
            <p className="consulting-rooms-empty">Cargando consultorios...</p>
          ) : visibleCenters.length === 0 ? (
            <p className="consulting-rooms-empty">
              {centers.length ? 'No hay consultorios que coincidan con la búsqueda y el filtro.' : 'Aún no hay consultorios registrados.'}
            </p>
          ) : (
            <section className="consulting-rooms-grid" aria-label="Consultorios registrados">
              {visibleCenters.map((center) => {
                const city = getCity(center.address);
                const offices = center.offices ?? [];
                return (
                  <article className="consulting-room-card" key={center.id}>
                    <div className="consulting-room-card-body">
                      <div className="consulting-room-title">
                        <span className="consulting-room-icon"><Building2 size={18} /></span>
                        <div>
                          <h3>{center.name}</h3>
                          <span className={`consulting-room-badge${center.isActive === false ? ' inactive' : ''}`}>
                            {center.isActive === false ? 'Inactivo' : city ? `Sede ${city}` : 'Sede médica'}
                          </span>
                        </div>
                      </div>
                      <div className="consulting-room-info">
                        <div className="consulting-room-info-row">
                          <MapPin size={15} />
                          <div><strong>Ubicación:</strong><p>{center.address || 'Dirección no registrada'}</p>
                            {offices.map((office) => (
                              <p className="consulting-room-office" key={office.id}>
                                Consultorio {office.officeNumber}{office.locationDetails ? `, ${office.locationDetails}` : ''}
                              </p>
                            ))}
                          </div>
                        </div>
                        <div className="consulting-room-info-row">
                          <Clock3 size={15} />
                          <div><strong>Horario de atención:</strong><p className="consulting-room-schedule">{center.schedule || 'Horario no registrado'}</p></div>
                        </div>
                        <div className="consulting-room-info-row phone-row">
                          <Phone size={15} />
                          <span>Recepción: {center.phone || 'Teléfono no registrado'}</span>
                        </div>
                      </div>
                    </div>
                    <footer className="consulting-room-card-footer">
                      <small>Registrado: {formatRegisteredDate(center.createdAt)}</small>
                      <div>
                        <button type="button" onClick={() => openEditForm(center)}><Pencil size={14} />Editar</button>
                        {center.isActive !== false && (
                          <button type="button" className="delete-action" onClick={() => void handleDeactivate(center)}>
                            <Trash2 size={14} />Eliminar
                          </button>
                        )}
                      </div>
                    </footer>
                  </article>
                );
              })}
            </section>
          )}
        </div>
      </main>

      {isFormOpen && (
        <div className="consulting-room-form-overlay" onClick={() => setIsFormOpen(false)} role="presentation">
          <form
            className="consulting-room-form"
            onClick={(event) => event.stopPropagation()}
            onSubmit={(event) => void handleSave(event)}
            role="dialog"
            aria-modal="true"
            aria-labelledby="consulting-room-form-title"
          >
            <header>
              <h2 id="consulting-room-form-title">{editingCenter ? 'Editar Consultorio' : 'Registrar Consultorio'}</h2>
              <button type="button" aria-label="Cerrar formulario" onClick={() => setIsFormOpen(false)}><X size={20} /></button>
            </header>
            <label>Nombre del centro médico<input required minLength={2} maxLength={150} value={form.name} onChange={(event) => updateForm('name', event.target.value)} /></label>
            <label>Ubicación / dirección<textarea rows={2} value={form.address} onChange={(event) => updateForm('address', event.target.value)} /></label>
            <label>Teléfono de recepción<input type="tel" maxLength={20} value={form.phone} onChange={(event) => updateForm('phone', event.target.value)} /></label>
            <label>Horario y turnos de atención<textarea rows={4} value={form.schedule} onChange={(event) => updateForm('schedule', event.target.value)} placeholder={'Ej. Lunes a Miércoles: 8:00 AM – 1:00 PM\nViernes: 9:00 AM – 12:00 PM'} /></label>
            {editingCenter && (
              <label className="consulting-room-active-toggle">
                <input type="checkbox" checked={form.isActive !== false} onChange={(event) => updateForm('isActive', event.target.checked)} />
                Consultorio activo
              </label>
            )}
            {error && <p className="consulting-rooms-error" role="alert">{error}</p>}
            <footer>
              <button type="button" className="form-cancel" onClick={() => setIsFormOpen(false)}>Cancelar</button>
              <button type="submit" className="consulting-rooms-primary-button" disabled={saving}>
                {saving ? 'Guardando...' : editingCenter ? 'Guardar cambios' : 'Registrar consultorio'}
              </button>
            </footer>
          </form>
        </div>
      )}
      {isNewCenterModalOpen && (
        <RegisterMedicalCenterModal
          saving={saving}
          error={error}
          onClose={() => setIsNewCenterModalOpen(false)}
          onSave={handleCreateCenter}
        />
      )}
      {createdCenter && (
        <MedicalCenterCreatedModal
          {...createdCenter}
          onClose={() => setCreatedCenter(null)}
          onRegisterAnother={openCreateForm}
        />
      )}
    </div>
  );
}
