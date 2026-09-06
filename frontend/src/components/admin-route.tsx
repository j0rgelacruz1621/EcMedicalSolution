import { Navigate, Outlet } from 'react-router-dom'

export default function AdminRoute() {
  const token = localStorage.getItem('token')
  const role = localStorage.getItem('user_rol')

  if (!token) return <Navigate to="/" replace />
  if (role !== 'SA') return <Navigate to="/control-panel" replace />

  return <Outlet />
}