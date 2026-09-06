import { useEffect, useState, type FormEvent } from 'react'
import {
  Building2,
  CheckCircle2,
  ChevronRight,
  LogOut,
  Plus,
  ShieldCheck,
  Stethoscope,
  Users,
  UserPlus,
} from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { getDoctors, registerDoctor, updateDoctor, type Doctor } from '../../../services/doctors/doctor-services'
import {
  createMedicalCenter,
  createOffice,
  getMedicalCenters,
  getOffices,
  type MedicalCenter,
  type Office,
} from '../../../services/medical-center/medical-center-services'
import './style.scss'
import { createUserAccount, getUserAccounts, type UserAccount } from '../../../services/users/user-services'

type Section = 'specialists' | 'centers' | 'accounts'

const emptyDoctor = {
  licenseNumber: '', nationalId: '', firstName: '', lastName: '', email: '', phone: '', specialty: '', officeId: '',
}

export default function AdminPanel() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [section, setSection] = useState<Section>('specialists')
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null)
  const [centers, setCenters] = useState<MedicalCenter[]>([])
  const [offices, setOffices] = useState<Office[]>([])
  const [accounts, setAccounts] = useState<UserAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [doctor, setDoctor] = useState(emptyDoctor)
  const [center, setCenter] = useState({ name: '', address: '', phone: '' })
  const [office, setOffice] = useState({ medicalCenterId: '', officeNumber: '', locationDetails: '' })
  const [saving, setSaving] = useState(false)
  const [account, setAccount] = useState({ user_name: '', password: '', rol: 'DOCTOR' as 'SA' | 'DOCTOR', application: 'medicalControl', doctor_id: '' })

  async function loadData() {
    setLoading(true)
    setError('')
    try {
      const [doctorResult, centerResult, officeResult, accountResult] = await Promise.all([
        getDoctors(), getMedicalCenters(), getOffices(), getUserAccounts(),
      ])
      setDoctors(doctorResult)
      setCenters(centerResult)
      setOffices(officeResult)
      setAccounts(accountResult)
    } catch {
      setError('No se pudieron cargar los datos administrativos.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void loadData() }, [])

  useEffect(() => {
    const editId = Number(searchParams.get('edit'))
    const doctorToEdit = doctors.find(item => item.id === editId)
    if (doctorToEdit) {
      setEditingDoctor({ ...doctorToEdit })
    }
  }, [doctors, searchParams])

  function updateNewDoctor(field: keyof typeof emptyDoctor, value: string) {
    setDoctor((current) => ({ ...current, [field]: value }))
  }

  async function submitDoctor(event: FormEvent) {
    event.preventDefault()
    setSaving(true); setError(''); setMessage('')
    try {
      await registerDoctor({ ...doctor, officeId: doctor.officeId ? Number(doctor.officeId) : undefined })
      setDoctor(emptyDoctor)
      setMessage('Especialista registrado correctamente.')
      await loadData()
    } catch (caught: any) {
      setError(caught?.message || 'No se pudo registrar el especialista.')
    } finally { setSaving(false) }
  }

  async function submitCenter(event: FormEvent) {
    event.preventDefault()
    setSaving(true); setError(''); setMessage('')
    try {
      await createMedicalCenter(center)
      setCenter({ name: '', address: '', phone: '' })
      setMessage('Medical center registrado correctamente.')
      await loadData()
    } catch (caught: any) {
      setError(caught?.response?.data?.message || 'No se pudo registrar el medical center.')
    } finally { setSaving(false) }
  }

  async function submitDoctorEdit(event: FormEvent) {
    event.preventDefault()
    if (!editingDoctor) return
    setSaving(true); setError(''); setMessage('')
    try {
      const updated = await updateDoctor(editingDoctor.id, {
        licenseNumber: editingDoctor.licenseNumber,
        nationalId: editingDoctor.nationalId,
        firstName: editingDoctor.firstName,
        lastName: editingDoctor.lastName,
        email: editingDoctor.email,
        phone: editingDoctor.phone || undefined,
        specialty: editingDoctor.specialty || undefined,
        officeId: editingDoctor.officeId ?? null,
      })
      setEditingDoctor(updated)
      setMessage('Información del especialista actualizada correctamente.')
      await loadData()
    } catch (caught: any) {
      setError(caught?.response?.data?.message || 'No se pudo actualizar el especialista.')
    } finally { setSaving(false) }
  }

  async function submitOffice(event: FormEvent) {
    event.preventDefault()
    setSaving(true); setError(''); setMessage('')
    try {
      await createOffice({ ...office, medicalCenterId: Number(office.medicalCenterId) })
      setOffice({ medicalCenterId: '', officeNumber: '', locationDetails: '' })
      setMessage('Consultorio registrado correctamente.')
      await loadData()
    } catch (caught: any) {
      setError(caught?.response?.data?.message || 'No se pudo registrar el consultorio.')
    } finally { setSaving(false) }
  }

  async function submitAccount(event: FormEvent) {
    event.preventDefault()
    setSaving(true); setError(''); setMessage('')
    try {
      await createUserAccount({
        ...account,
        doctor_id: account.rol === 'DOCTOR' ? Number(account.doctor_id) : undefined,
      })
      setAccount({ user_name: '', password: '', rol: 'DOCTOR', application: 'medicalControl', doctor_id: '' })
      setMessage('Cuenta de acceso creada correctamente.')
      await loadData()
    } catch (caught: any) {
      setError(caught?.response?.data?.message || 'No se pudo crear la cuenta de acceso.')
    } finally { setSaving(false) }
  }

  function logout() {
    localStorage.removeItem('token')
    localStorage.removeItem('user_rol')
    localStorage.removeItem('doctor_id')
    sessionStorage.removeItem('active_doctor_id')
    navigate('/')
  }

  return (
    <div className="admin-shell theme-blue">
      <aside className="admin-sidebar">
        <div className="admin-brand"><ShieldCheck size={24} /><span>EC Medical Control</span></div>
        <div className="admin-context"><span>ADMINISTRACIÓN</span><strong>Panel SA</strong></div>
        <nav className="admin-nav" aria-label="Navegación administrativa">
          <button className={section === 'specialists' ? 'active' : ''} onClick={() => setSection('specialists')}>
            <Stethoscope size={18} /> Especialistas <ChevronRight size={16} />
          </button>
          <button className={section === 'centers' ? 'active' : ''} onClick={() => setSection('centers')}>
            <Building2 size={18} /> Medical centers <ChevronRight size={16} />
          </button>
          <button className={section === 'accounts' ? 'active' : ''} onClick={() => setSection('accounts')}>
            <UserPlus size={18} /> Cuentas de acceso <ChevronRight size={16} />
          </button>
        </nav>
        <button className="admin-logout" onClick={logout}><LogOut size={18} /> Cerrar sesión</button>
      </aside>

      <main className="admin-main">
        <header className="admin-header">
          <div><p className="admin-eyebrow">GESTIÓN DEL SISTEMA</p><h1>{section === 'specialists' ? 'Especialistas' : section === 'centers' ? 'Medical centers' : 'Cuentas de acceso'}</h1></div>
          <div className="admin-user"><span className="admin-avatar">SA</span><span>Administrador</span></div>
        </header>

        {(message || error) && <div className={`admin-alert ${error ? 'error' : 'success'}`}>{error || message}</div>}

        {section === 'specialists' ? (
          <section className="admin-content">
            <div className="admin-intro"><div><h2>Directorio de especialistas</h2><p>Registra médicos y asígnalos a un consultorio disponible.</p></div><span className="admin-count"><Users size={17} /> {doctors.length} registrados</span></div>
            <div className="admin-grid">
              <form className="admin-card admin-form" onSubmit={submitDoctor}>
                <div className="card-heading"><span className="card-icon"><Plus size={19} /></span><div><h3>Nuevo especialista</h3><p>Completa los datos profesionales.</p></div></div>
                <div className="form-grid">
                  <label>Nombres<input required value={doctor.firstName} onChange={e => updateNewDoctor('firstName', e.target.value)} /></label>
                  <label>Apellidos<input required value={doctor.lastName} onChange={e => updateNewDoctor('lastName', e.target.value)} /></label>
                  <label>Cédula<input required value={doctor.nationalId} onChange={e => updateNewDoctor('nationalId', e.target.value)} /></label>
                  <label>Licencia MPPS<input required value={doctor.licenseNumber} onChange={e => updateNewDoctor('licenseNumber', e.target.value)} /></label>
                  <label>Correo electrónico<input required type="email" value={doctor.email} onChange={e => updateNewDoctor('email', e.target.value)} /></label>
                  <label>Teléfono<input value={doctor.phone} onChange={e => updateNewDoctor('phone', e.target.value)} /></label>
                  <label>Especialidad<input required value={doctor.specialty} onChange={e => updateNewDoctor('specialty', e.target.value)} /></label>
                  <label>Consultorio<select value={doctor.officeId} onChange={e => updateNewDoctor('officeId', e.target.value)}><option value="">Sin asignar</option>{offices.map(item => <option key={item.id} value={item.id}>{item.officeNumber} · {item.medicalCenter?.name}</option>)}</select></label>
                </div>
                <button className="primary-button" disabled={saving} type="submit">{saving ? 'Guardando...' : 'Registrar especialista'}</button>
              </form>
              <div className="admin-card admin-list"><div className="card-heading"><span className="card-icon"><Stethoscope size={19} /></span><div><h3>Especialistas registrados</h3><p>Haz clic en un médico para abrir su panel.</p></div></div>{loading ? <p className="empty-state">Cargando especialistas...</p> : doctors.length === 0 ? <p className="empty-state">Aún no hay especialistas registrados.</p> : <div className="record-list">{doctors.map(item => <button className="record" key={item.id} type="button" onClick={() => navigate(`/control-panel?doctorId=${item.id}`)}><span className="record-avatar">{item.firstName[0]}{item.lastName[0]}</span><div><strong>{item.firstName} {item.lastName}</strong><small>{item.specialty || 'Especialidad no indicada'}</small></div><CheckCircle2 size={17} /></button>)}</div>}</div>
            </div>
            {editingDoctor && <form className="admin-card doctor-editor" onSubmit={submitDoctorEdit}><div className="card-heading"><span className="card-icon"><Stethoscope size={19} /></span><div><h3>Panel de {editingDoctor.firstName} {editingDoctor.lastName}</h3><p>Edita la información profesional y su asignación.</p></div></div><div className="form-grid"><label>Nombres<input required value={editingDoctor.firstName} onChange={e => setEditingDoctor({ ...editingDoctor, firstName: e.target.value })} /></label><label>Apellidos<input required value={editingDoctor.lastName} onChange={e => setEditingDoctor({ ...editingDoctor, lastName: e.target.value })} /></label><label>Cédula<input required value={editingDoctor.nationalId || ''} onChange={e => setEditingDoctor({ ...editingDoctor, nationalId: e.target.value })} /></label><label>Licencia MPPS<input required value={editingDoctor.licenseNumber || ''} onChange={e => setEditingDoctor({ ...editingDoctor, licenseNumber: e.target.value })} /></label><label>Correo electrónico<input required type="email" value={editingDoctor.email || ''} onChange={e => setEditingDoctor({ ...editingDoctor, email: e.target.value })} /></label><label>Teléfono<input value={editingDoctor.phone || ''} onChange={e => setEditingDoctor({ ...editingDoctor, phone: e.target.value })} /></label><label>Especialidad<input required value={editingDoctor.specialty || ''} onChange={e => setEditingDoctor({ ...editingDoctor, specialty: e.target.value })} /></label><label>Consultorio<select value={editingDoctor.officeId ?? ''} onChange={e => setEditingDoctor({ ...editingDoctor, officeId: e.target.value ? Number(e.target.value) : null })}><option value="">Sin asignar</option>{offices.map(item => <option key={item.id} value={item.id}>{item.officeNumber} · {item.medicalCenter?.name}</option>)}</select></label></div><div className="editor-actions"><button type="button" className="secondary-button" onClick={() => setEditingDoctor(null)}>Cerrar panel</button><button className="primary-button" disabled={saving} type="submit">{saving ? 'Guardando...' : 'Guardar cambios'}</button></div></form>}
          </section>
        ) : section === 'centers' ? (
          <section className="admin-content">
            <div className="admin-intro"><div><h2>Red de atención</h2><p>Administra centros médicos y sus consultorios.</p></div><span className="admin-count"><Building2 size={17} /> {centers.length} centros</span></div>
            <div className="admin-grid centers-grid">
              <form className="admin-card admin-form" onSubmit={submitCenter}><div className="card-heading"><span className="card-icon"><Plus size={19} /></span><div><h3>Nuevo medical center</h3><p>Crea una sede de atención.</p></div></div><div className="form-grid one-column"><label>Nombre del centro<input required value={center.name} onChange={e => setCenter({ ...center, name: e.target.value })} /></label><label>Dirección<input value={center.address} onChange={e => setCenter({ ...center, address: e.target.value })} /></label><label>Teléfono<input value={center.phone} onChange={e => setCenter({ ...center, phone: e.target.value })} /></label></div><button className="primary-button" disabled={saving} type="submit">Registrar medical center</button></form>
              <form className="admin-card admin-form" onSubmit={submitOffice}><div className="card-heading"><span className="card-icon"><Plus size={19} /></span><div><h3>Nuevo consultorio</h3><p>Asócialo a un medical center.</p></div></div><div className="form-grid one-column"><label>Medical center<select required value={office.medicalCenterId} onChange={e => setOffice({ ...office, medicalCenterId: e.target.value })}><option value="">Selecciona un centro</option>{centers.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><label>Número o nombre<input required value={office.officeNumber} onChange={e => setOffice({ ...office, officeNumber: e.target.value })} /></label><label>Ubicación<input value={office.locationDetails} onChange={e => setOffice({ ...office, locationDetails: e.target.value })} /></label></div><button className="primary-button" disabled={saving || centers.length === 0} type="submit">Registrar consultorio</button></form>
            </div>
            <div className="admin-card center-list"><div className="card-heading"><span className="card-icon"><Building2 size={19} /></span><div><h3>Medical centers registrados</h3><p>Centros activos y sus oficinas.</p></div></div><div className="center-records">{centers.map(item => <div className="center-record" key={item.id}><div><strong>{item.name}</strong><small>{item.address || 'Dirección no indicada'} · {item.phone || 'Sin teléfono'}</small></div><span>{item.offices?.length || 0} consultorios</span></div>)}</div></div>
          </section>
        ) : (
          <section className="admin-content">
            <div className="admin-intro"><div><h2>Usuarios del sistema</h2><p>Crea credenciales para administradores y especialistas.</p></div><span className="admin-count"><UserPlus size={17} /> {accounts.length} cuentas</span></div>
            <div className="admin-grid">
              <form className="admin-card admin-form" onSubmit={submitAccount}>
                <div className="card-heading"><span className="card-icon"><UserPlus size={19} /></span><div><h3>Nueva cuenta</h3><p>La contraseña se almacena cifrada.</p></div></div>
                <div className="form-grid one-column">
                  {account.rol === 'DOCTOR' ? <label>Especialista<select required value={account.doctor_id} onChange={e => { const selected = doctors.find(item => String(item.id) === e.target.value); setAccount({ ...account, doctor_id: e.target.value, user_name: selected?.email || '' }) }}><option value="">Selecciona un especialista</option>{doctors.map(item => <option key={item.id} value={item.id}>{item.firstName} {item.lastName} · {item.email}</option>)}</select></label> : <label>Usuario o correo<input required value={account.user_name} onChange={e => setAccount({ ...account, user_name: e.target.value })} /></label>}
                  {account.rol === 'DOCTOR' && <label>Usuario de acceso<input readOnly value={account.user_name} placeholder="Se completa con el correo del especialista" /></label>}
                  <label>Contraseña<input required minLength={8} type="password" value={account.password} onChange={e => setAccount({ ...account, password: e.target.value })} /></label>
                  <label>Rol<select value={account.rol} onChange={e => setAccount({ ...account, rol: e.target.value as 'SA' | 'DOCTOR', doctor_id: '', user_name: '' })}><option value="DOCTOR">DOCTOR</option><option value="SA">SA</option></select></label>
                  <label>Aplicación<input value={account.application} onChange={e => setAccount({ ...account, application: e.target.value })} /></label>
                </div>
                <p className="account-hint">Una cuenta DOCTOR queda enlazada automáticamente al especialista seleccionado y usa su correo como usuario.</p>
                <button className="primary-button" disabled={saving} type="submit">{saving ? 'Creando...' : 'Crear cuenta de acceso'}</button>
              </form>
              <div className="admin-card admin-list"><div className="card-heading"><span className="card-icon"><Users size={19} /></span><div><h3>Cuentas registradas</h3><p>Usuarios autorizados a iniciar sesión.</p></div></div>{loading ? <p className="empty-state">Cargando cuentas...</p> : accounts.length === 0 ? <p className="empty-state">No hay cuentas registradas.</p> : <div className="record-list">{accounts.map(item => <div className="record account-record" key={item.id}><span className="record-avatar">{item.rol === 'SA' ? 'SA' : 'DR'}</span><div><strong>{item.user_name}</strong><small>{item.rol || 'Sin rol'} · {item.application || 'Sin aplicación'}</small></div><CheckCircle2 size={17} /></div>)}</div>}</div>
            </div>
          </section>
        )}
      </main>
    </div>
  )
}
