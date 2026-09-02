import { Route, Routes } from 'react-router-dom'
import HomeView from './components/views/home'
import DateView from './components/views/date'
import ControlPanel from './components/views/control-panel'
import SpecialistRegister from './components/views/specialist-register'
import SpecialistPresentation from './components/views/specialist-presentation'
import AgendaView from './components/views/scheduling'
import PatientsView from './components/views/patients'
import PatientFileView from './components/views/patient-file'

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomeView />} />
      <Route path="/date" element={<DateView />} />
      <Route path="/control-panel" element={<ControlPanel />} />
      <Route path="/specialist-register" element={<SpecialistRegister />} />
      <Route path="/specialist/:slug" element={<SpecialistPresentation />} />
      <Route path="/agenda" element={<AgendaView />} />
      <Route path="/patients" element={<PatientsView />} />
      <Route path="/patients/:id" element={<PatientFileView />} />
    </Routes>
  )
}

export default App