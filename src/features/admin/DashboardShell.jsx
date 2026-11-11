import { Box } from '@mui/material'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import Sidebar from '../../components/layout/Sidebar'
import Topbar from '../../components/layout/Topbar'
import { logout } from '../../auth/sessionSlice'

export default function DashboardShell() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const user = useSelector((state) => state.auth.user)
  const isAdminDashboard = location.pathname.startsWith('/admin/')
  const title = location.pathname.startsWith('/admin/users')
    ? 'Manage users'
    : isAdminDashboard ? 'Reports dashboard' : 'Support tickets'

  const handleLogout = () => {
    dispatch(logout())
    navigate('/login', { replace: true })
  }

  return <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f7f9fc', color: '#17233c' }}>
    <Sidebar activePath={location.pathname} user={user} onLogout={handleLogout} />
    <Box component="main" sx={{ width: 'calc(100% - 252px)', '@media (max-width: 900px)': { width: 'calc(100% - 210px)' }, '@media (max-width: 650px)': { width: '100%' } }}>
      <Topbar title={title} onCreate={() => navigate('/tickets/new')} />
      <Outlet />
    </Box>
  </Box>
}
