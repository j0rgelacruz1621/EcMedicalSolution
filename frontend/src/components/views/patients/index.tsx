import LeftSideBar from '../../left-sideBar'
import './style.scss'
import { 
  Search, Plus, Bell, CircleHelp, ChevronLeft, 
  ChevronRight, MoreVertical, Edit, Eye, User,
  Calendar as CalIcon, MapPin, Activity
} from 'lucide-react'

const PATIENTS_MOCK = [
  { id: 1, name: 'Ricardo Mendoza', email: 'r.mendoza@email.com', ci: '3996369', age: 54, lastVisit: '12 Oct 2023', origin: 'Mérida', color: 'JV' },
  { id: 2, name: 'Elena Gómez', email: 'elena.g@email.com', ci: '32.889.001', age: 62, lastVisit: '05 Sep 2023', origin: 'Tovar', color: 'EG' },
  { id: 3, name: 'Javier Valdés', email: 'jvaldes@email.com', ci: '18.445.677', age: 41, lastVisit: '29 Oct 2023', origin: 'Mérida', color: 'JV' },
  { id: 4, name: 'Ana Alvarado', email: 'ana.alv@email.com', ci: '51.332.990', age: 29, lastVisit: '15 Oct 2023', origin: 'Mérida', color: 'AA' },
  { id: 5, name: 'Manuel Soto', email: 'm.soto@email.com', ci: '27.112.334', age: 75, lastVisit: '01 Oct 2023', origin: 'Tovar', color: 'MS' },
];

export default function PatientsView() {
  return (
    <div className="patients-root">
      <LeftSideBar />
      
      <main className="patients-main">
        {/* Header Superior idéntico al diseño */}
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
              <p>Gestione y supervise la salud cardiovascular de sus pacientes.</p>
            </div>
            <button className="btn-new-patient"><Plus size={18} /> Nuevo Paciente</button>
          </div>

          {/* Filtros */}
          <div className="filters-bar">
            <div className="filter-group">
              <label>Filtrar por:</label>
              <select className="form-select-custom">
                <option>Procedencia</option>
              </select>
              <input type="text" placeholder="Nombre del paciente" className="input-custom" />
              <input type="text" placeholder="Cédula" className="input-custom" />
            </div>
          </div>

          {/* Tabla de Pacientes */}
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
                {PATIENTS_MOCK.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <div className="patient-info">
                        <div className={`avatar-circle bg-light-${p.id}`}>{p.color}</div>
                        <div>
                          <div className="p-name">{p.name}</div>
                          <div className="p-email">{p.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>{p.ci}</td>
                    <td>{p.age}</td>
                    <td>{p.lastVisit}</td>
                    <td><span className={p.origin === 'Mérida' ? 'origin-highlight' : ''}>{p.origin}</span></td>
                    <td>
                      <div className="action-btns">
                        <button title="Ver historia"><Eye size={16} /></button>
                        <button title="Editar"><Edit size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            <div className="table-footer">
              <span>Mostrando 5 de 1,240 pacientes</span>
              <div className="pagination">
                <button className="page-nav"><ChevronLeft size={18}/></button>
                <button className="page-num active">1</button>
                <button className="page-num">2</button>
                <button className="page-num">3</button>
                <span>...</span>
                <button className="page-num">248</button>
                <button className="page-nav"><ChevronRight size={18}/></button>
              </div>
            </div>
          </div>

          {/* KPIs Inferiores */}
          <div className="kpi-grid">
            <div className="kpi-card dark">
              <div className="kpi-icon-box"><Plus size={20} /></div>
              <div className="kpi-data">
                <span className="kpi-value">12</span>
                <span className="kpi-label">Nuevos este mes</span>
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
    </div>
  )
}