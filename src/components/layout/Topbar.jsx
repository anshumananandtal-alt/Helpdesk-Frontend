import { Add } from '@mui/icons-material'
import { Box, Button, Typography } from '@mui/material'
import { useSelector } from 'react-redux'
import { useLocation } from 'react-router-dom'
import { colors } from '../../app/theme'

export default function Topbar({ title, onCreate }) {
  const user = useSelector((state) => state.auth.user)
  const location = useLocation()
  const canCreate = location.pathname !== '/tickets/new' && !location.pathname.startsWith('/admin/')

  return <Box sx={{ height: 112, display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 'clamp(25px, 4vw, 56px)', bgcolor: '#fff', borderBottom: `1px solid ${colors.line}`, '@media (max-width: 650px)': { height: 90, px: '18px' } }}>
    <Box>
      <Typography sx={{ fontSize: 10, letterSpacing: '1px', fontWeight: 700, color: '#a1abbb', mb: '5px' }}>HELPDESK WORKSPACE</Typography>
      <Typography sx={{ font: "700 22px 'Plus Jakarta Sans'", color: colors.ink, letterSpacing: '-.6px', '@media (max-width: 650px)': { fontSize: 18 } }}>{title}</Typography>
    </Box>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
      <Typography sx={{ color: colors.muted, fontSize: 12, '@media (max-width: 700px)': { display: 'none' } }}>{user?.name || user?.email}</Typography>
      {canCreate && <Button variant="contained" startIcon={<Add />} onClick={onCreate} sx={{ bgcolor: colors.navy, textTransform: 'none', borderRadius: '7px', boxShadow: 'none', fontWeight: 700, py: '10px', px: '17px', fontSize: 12 }}>New ticket</Button>}
    </Box>
  </Box>
}
