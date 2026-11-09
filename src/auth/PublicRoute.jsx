import { Navigate, Outlet } from 'react-router-dom'
import { useSelector } from 'react-redux'

export default function PublicRoute() {
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated)

  return isAuthenticated ? <Navigate to="/tickets" replace /> : <Outlet />
}
