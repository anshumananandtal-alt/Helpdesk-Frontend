import { Assignment, Dashboard, Logout } from '@mui/icons-material'
import { Avatar, Box, Button, Divider, Drawer, Stack, Typography } from '@mui/material'
import { NavLink } from 'react-router-dom'
import { canViewDashboard, normalizeRole } from '../../lib/permissions'

function initials(user) {
  return (user?.name || user?.email || 'U')
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('')
}

export default function Sidebar({ activePath, user, onLogout }) {
  const role = normalizeRole(user?.role)
  const navigation = [
    { label: 'Tickets', path: '/tickets', icon: <Assignment /> },
    ...(canViewDashboard(user) ? [{ label: 'Reports', path: '/admin/dashboard', icon: <Dashboard /> }] : []),
  ]

  return <Drawer variant="permanent" className="sidebar">
    <Box className="brand"><Box className="brand-mark"><Assignment /></Box><Box><Typography className="brand-name">OrbitDesk</Typography><Typography className="brand-subtitle">Support workspace</Typography></Box></Box>
    <Box className="workspace-switcher"><Avatar className="workspace-avatar">{initials(user)}</Avatar><Box sx={{ flex: 1, minWidth: 0 }}><Typography className="workspace-name">{user?.name || user?.email}</Typography><Typography className="workspace-role">{role || 'member'}</Typography></Box></Box>
    <Typography className="nav-heading">WORKSPACE</Typography>
    <Stack className="nav-list" spacing={0.5}>{navigation.map((item) => <Button key={item.path} component={NavLink} to={item.path} className={`nav-item ${activePath === item.path ? 'active' : ''}`} startIcon={item.icon}>{item.label}</Button>)}</Stack>
    <Box className="sidebar-bottom"><Divider /><Button className="profile-button" onClick={onLogout} startIcon={<Avatar className="profile-avatar">{initials(user)}</Avatar>} endIcon={<Logout fontSize="small" />}><Box sx={{ textAlign: 'left', overflow: 'hidden' }}><Typography className="profile-name">{user?.name || user?.email}</Typography><Typography className="profile-role">Sign out</Typography></Box></Button></Box>
  </Drawer>
}
