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
import ProtectedRoute from './components/protected-route'
import AdminPanel from './components/views/admin-panel'
import AdminRoute from './components/admin-route'

import Footer from './components/footer'

function App() {
  return (
    <>
      <div className="app-shell">
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
          </Route>
        </Routes>
        <Footer />
      </div>
    </>
  )
}

export default App