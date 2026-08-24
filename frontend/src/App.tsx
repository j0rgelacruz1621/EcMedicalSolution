import { Route, Routes } from 'react-router-dom'
import DateView from './components/views/date'
import HomeView from './components/views/home'
import ControlPanel from './components/views/control-panel'
import SpecialistRegister from './components/views/specialist-register'

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomeView />} />
      <Route path="/date" element={<DateView />} />
      <Route path="/control-panel" element={<ControlPanel />} />
      <Route path="/specialist-register" element={<SpecialistRegister />} />
    </Routes>
  )
}

export default App
