import { Route, Routes } from 'react-router-dom'
import DateView from './components/views/date'
import HomeView from './components/views/home'

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomeView />} />
      <Route path="/date" element={<DateView />} />
    </Routes>
  )
}

export default App
