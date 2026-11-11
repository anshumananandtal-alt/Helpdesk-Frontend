import { Assignment, Dashboard, Group, Logout } from '@mui/icons-material'
import { Avatar, Box, Button, Divider, Drawer, Stack, Typography } from '@mui/material'
import { NavLink } from 'react-router-dom'
import { canViewDashboard, normalizeRole } from '../../lib/permissions'
import { colors } from '../../app/theme'

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
    ...(canViewDashboard(user) ? [{ label: 'Users', path: '/admin/users', icon: <Group /> }] : []),
  ]

  return <Drawer
    variant="permanent"
    sx={{
      width: 252,
      flexShrink: 0,
      '& .MuiDrawer-paper': {
        width: 252,
        border: 0,
        borderRight: `1px solid ${colors.line}`,
        px: '15px',
        pt: '27px',
        pb: '20px',
        bgcolor: '#fff',
        boxSizing: 'border-box',
        '@media (max-width: 900px)': { width: 210 },
        '@media (max-width: 650px)': { display: 'none' },
      },
      '@media (max-width: 900px)': { width: 210 },
      '@media (max-width: 650px)': { display: 'none' },
    }}
  >
    <Box sx={{ display: 'flex', alignItems: 'center', gap: '11px', px: '12px', pb: '30px' }}>
      <Box sx={{ width: 34, height: 34, borderRadius: '10px', display: 'grid', placeItems: 'center', color: '#fff', background: 'linear-gradient(140deg, #1a7ec5, #18b5aa)', '& svg': { fontSize: 19 } }}><Assignment /></Box>
      <Box>
        <Typography sx={{ font: "800 17px 'Plus Jakarta Sans'", letterSpacing: '-.5px' }}>OrbitDesk</Typography>
        <Typography sx={{ color: '#a0a9ba', fontSize: 10, mt: '1px' }}>Support workspace</Typography>
      </Box>
    </Box>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: '9px', p: '10px', border: `1px solid ${colors.line}`, borderRadius: '10px', mx: '4px', mb: '30px', color: '#8892a6' }}>
      <Avatar sx={{ bgcolor: '#dceef4', color: '#267790', width: 30, height: 30, fontSize: 11, fontWeight: 700 }}>{initials(user)}</Avatar>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography sx={{ fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.name || user?.email}</Typography>
        <Typography sx={{ fontSize: 10, color: '#a0a9ba' }}>{role || 'member'}</Typography>
      </Box>
    </Box>
    <Typography sx={{ color: '#a3acbb', fontSize: 10, fontWeight: 700, letterSpacing: '.9px', px: '12px', pb: '8px' }}>WORKSPACE</Typography>
    <Stack spacing={0.5}>
      {navigation.map((item) => <Button
        key={item.path}
        component={NavLink}
        to={item.path}
        startIcon={item.icon}
        sx={{
          width: '100%',
          justifyContent: 'flex-start',
          color: activePath === item.path ? '#168a9a' : '#7c879c',
          bgcolor: activePath === item.path ? '#eaf5f8' : 'transparent',
          fontSize: 13,
          fontWeight: activePath === item.path ? 700 : 500,
          py: '10px',
          px: '12px',
          borderRadius: '8px',
          textTransform: 'none',
          '& svg': { fontSize: 18 },
          '& .MuiButton-endIcon': { ml: 'auto' },
        }}
      >{item.label}</Button>)}
    </Stack>
    <Box sx={{ mt: 'auto' }}>
      <Divider />
      <Button
        onClick={onLogout}
        startIcon={<Avatar sx={{ width: 31, height: 31, bgcolor: '#e5e9f8', color: '#6870a3', fontSize: 11, fontWeight: 700 }}>{initials(user)}</Avatar>}
        endIcon={<Logout fontSize="small" />}
        sx={{ width: '100%', justifyContent: 'flex-start', pt: '17px', px: '9px', color: '#6d7890', textTransform: 'none', '& .MuiButton-endIcon': { ml: 'auto' } }}
      >
        <Box sx={{ textAlign: 'left', overflow: 'hidden' }}>
          <Typography sx={{ fontSize: 12, color: '#36435b', fontWeight: 700 }}>{user?.name || user?.email}</Typography>
          <Typography sx={{ fontSize: 10, color: '#a0a9ba' }}>Sign out</Typography>
        </Box>
      </Button>
    </Box>
  </Drawer>
}
