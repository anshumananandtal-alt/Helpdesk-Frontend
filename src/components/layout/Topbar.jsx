import { Add } from '@mui/icons-material'
import { Box, Button, Typography } from '@mui/material'
import { useSelector } from 'react-redux'
import { useLocation } from 'react-router-dom'

export default function Topbar({ title, onCreate }) {
  const user = useSelector((state) => state.auth.user)
  const location = useLocation()
  const canCreate = location.pathname !== '/tickets/new'

  return <Box className="topbar"><Box><Typography className="eyebrow">HELPDESK WORKSPACE</Typography><Typography className="page-title">{title}</Typography></Box><Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}><Typography className="topbar-user">{user?.name || user?.email}</Typography>{canCreate && <Button className="create-button" variant="contained" startIcon={<Add />} onClick={onCreate}>New ticket</Button>}</Box></Box>
}
