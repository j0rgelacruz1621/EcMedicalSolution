import { Route, Routes } from 'react-router-dom'
import HomeView from './components/views/home'
import DateView from './components/views/date'
import ControlPanel from './components/views/control-panel'
import SpecialistRegister from './components/views/specialist-register'
import SpecialistPresentation from './components/views/specialist-presentation'
import AgendaView from './components/views/scheduling'
import PatientsView from './components/views/patients'
import PatientFileView from './components/views/patient-file'
import PendingTasksView from './components/views/pending-tasks'
import ReportsView from './components/views/reports'
import MedicalCertificateView from './components/views/medical-certificate'
import LabOrderView from './components/views/lab-order'
import ProtectedRoute from './components/protected-route'
import AdminPanel from './components/views/admin-panel'
import AdminRoute from './components/admin-route'

import Footer from './components/footer'

function App() {
  return (
    <>
      <div className="app-shell">
        <div className="app-content">
          <Routes>
          <Route path="/" element={<HomeView />} />
          <Route path="/date" element={<DateView />} />
          <Route path="/specialist-register" element={<SpecialistRegister />} />
          <Route path="/specialist/:slug" element={<SpecialistPresentation />} />
          <Route element={<AdminRoute />}>
            <Route path="/admin" element={<AdminPanel />} />
          </Route>
          <Route element={<ProtectedRoute />}>
            <Route path="/control-panel" element={<ControlPanel />} />
            <Route path="/agenda" element={<AgendaView />} />
            <Route path="/patients" element={<PatientsView />} />
            <Route path="/patients/:id" element={<PatientFileView />} />
            <Route path="/pending-tasks" element={<PendingTasksView />} />
            <Route path="/reports" element={<ReportsView />} />
            <Route path="/reports/medical-certificate" element={<MedicalCertificateView />} />
            <Route path="/reports/lab-order" element={<LabOrderView />} />
          </Route>
          </Routes>
        </div>
        <Footer />
      </div>
    </>
  )
}

export default App