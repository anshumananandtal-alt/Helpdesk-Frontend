import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Alert, Box, Button, Chip, FormControl, InputLabel, MenuItem, Pagination, Paper, Select, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from '@mui/material'
import { useSelector } from 'react-redux'
import { Link, useNavigate } from 'react-router-dom'
import { getTickets } from '../../api/tickets.api'
import { getAgents } from '../../api/users.api'
import { EmptyState, ErrorState, LoadingState } from '../../components/common/DataState'
import { normalizeRole } from '../../lib/permissions'
import { colors } from '../../app/theme'

const pageContentSx = { maxWidth: 1440, mx: 'auto', p: '40px clamp(25px, 4vw, 56px)', '@media (max-width: 650px)': { p: '25px 15px' } }
const mutedCellSx = { fontSize: 11, color: '#6f7a8f' }

const pageSize = 10
const statusOptions = ['open', 'in_progress', 'waiting_on_customer', 'resolved', 'reopened', 'closed']
const priorityOptions = ['low', 'medium', 'high', 'urgent']

function displayDate(value) {
  if (!value) return '—'
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(value))
}

function displayStatus(status) {
  return status.replaceAll('_', ' ')
}

export default function TicketListPage() {
  const user = useSelector((state) => state.auth.user)
  const navigate = useNavigate()
  const isStaff = normalizeRole(user?.role) === 'agent' || normalizeRole(user?.role) === 'admin'
  const isAdmin = normalizeRole(user?.role) === 'admin'
  const [page, setPage] = useState(1)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [priority, setPriority] = useState('')
  const [assignee, setAssignee] = useState('')
  const [breached, setBreached] = useState('')
  const queryParams = {
    page,
    limit: pageSize,
    ...(search ? { search } : {}),
    ...(status ? { status } : {}),
    ...(priority ? { priority } : {}),
    ...(isStaff ? { assignee: user?.role === 'agent' ?  user?._id : assignee } : {}),
    ...(breached ? { breached } : {}),
  }
  const ticketsQuery = useQuery({
    queryKey: ['tickets', queryParams],
    queryFn: () => getTickets(queryParams),
  })
  const usersQuery = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: getAgents,
    enabled: isAdmin,
  })

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput.trim())
      setPage(1)
    }, 300)
    return () => window.clearTimeout(timer)
  }, [searchInput])

  const updateFilter = (setFilterValue, value) => {
    setFilterValue(value)
    setPage(1)
  }

  const tickets = ticketsQuery.data?.tickets || []
  const total = ticketsQuery.data?.total || 0
  const totalPages = Math.max(1, ticketsQuery.data?.totalPages || 1)

  return <Box sx={pageContentSx}>
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mb: '24px', gap: 2, '@media (max-width: 650px)': { alignItems: 'flex-start', flexDirection: 'column' } }}>
      <Box>
        <Typography sx={{ font: "700 18px 'Plus Jakarta Sans'", letterSpacing: '-.4px' }}>{isStaff ? 'Ticket queue' : 'Your tickets'}</Typography>
        <Typography sx={{ color: colors.muted, fontSize: 12, mt: '5px' }}>{isStaff ? 'Search and manage support requests.' : 'Track the support requests you have created.'}</Typography>
      </Box>
      {ticketsQuery.isSuccess && <Typography sx={mutedCellSx}>{total} {total === 1 ? 'ticket' : 'tickets'}</Typography>}
      <Button component={Link} to="/tickets/new" variant="contained">Create ticket</Button>
    </Box>
    <Paper elevation={0} sx={{ bgcolor: '#fff', border: `1px solid ${colors.line}`, borderRadius: '11px', overflow: 'hidden' }}>
      <Box sx={{ display: 'flex', gap: '9px', p: '16px 24px', borderBottom: `1px solid ${colors.line}`, '@media (max-width: 650px)': { flexWrap: 'wrap', p: '12px 15px' } }}>
        <TextField size="medium" label="Search" value={searchInput} onChange={(event) => setSearchInput(event.target.value)} sx={{ width: 260, '@media (max-width: 650px)': { width: '100%' } }} />
        <FormControl size="medium" sx={{ minWidth: 135, '@media (max-width: 650px)': { flex: 1, minWidth: 0 } }}>
          <InputLabel>Status</InputLabel>
          <Select aria-label="Status" label="Status" value={status} onChange={(event) => updateFilter(setStatus, event.target.value)}>
            <MenuItem value="">All statuses</MenuItem>
            {statusOptions.map((item) => <MenuItem key={item} value={item}>{displayStatus(item)}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl size="medium" sx={{ minWidth: 135, '@media (max-width: 650px)': { flex: 1, minWidth: 0 } }}>
          <InputLabel>Priority</InputLabel>
          <Select aria-label="Priority" label="Priority" value={priority} onChange={(event) => updateFilter(setPriority, event.target.value)}>
            <MenuItem value="">All priorities</MenuItem>
            {priorityOptions.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}
          </Select>
        </FormControl>
        {isAdmin && <FormControl size="medium" sx={{ minWidth: 135, '@media (max-width: 650px)': { flex: 1, minWidth: 0 } }}>
          <InputLabel>Assignee</InputLabel>
          <Select
            aria-label="Assignee"
            label="Assignee"
            value={assignee}
            disabled={usersQuery.isPending || usersQuery.isError}
            onChange={(event) => updateFilter(setAssignee, event.target.value)}
          >
            <MenuItem value="">All assignees</MenuItem>
            {(usersQuery.data || [])
              .map((candidate) => <MenuItem key={candidate._id ?? candidate.id} value={String(candidate._id ?? candidate.id)}>
                {candidate.name || candidate.email}
              </MenuItem>)}
          </Select>
        </FormControl>}
        {isAdmin && usersQuery.isError && <Alert severity="error">
          {usersQuery.error.message || 'Unable to load assignees.'}
        </Alert>}
        <FormControl size="medium" sx={{ minWidth: 135, '@media (max-width: 650px)': { flex: 1, minWidth: 0 } }}>
          <InputLabel>SLA</InputLabel>
          <Select aria-label="SLA" label="SLA" value={breached} onChange={(event) => updateFilter(setBreached, event.target.value)}>
            <MenuItem value="">Any</MenuItem>
            <MenuItem value="true">Breached</MenuItem>
            <MenuItem value="false">On track</MenuItem>
          </Select>
        </FormControl>
      </Box>
      {ticketsQuery.isPending && <LoadingState label="Loading tickets…" />}
      {ticketsQuery.isError && <ErrorState error={ticketsQuery.error} onRetry={() => ticketsQuery.refetch()} />}
      {ticketsQuery.isSuccess && !tickets.length && <EmptyState>{total ? 'No tickets match these filters.' : 'No tickets yet. Create a ticket to get support.'}</EmptyState>}
      {ticketsQuery.isSuccess && Boolean(tickets.length) && <>
        <TableContainer sx={{ width: '100%', overflowX: 'auto' }}>
          <Table
            aria-label="Tickets"
            size="medium"
            sx={{
              minWidth: isAdmin ? 900 : isStaff ? 800 : 700,
              '& .MuiTableHead-root .MuiTableCell-root': { p: '14px 22px', bgcolor: '#fbfcfe', color: '#000d00', fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap' },
              '& .MuiTableBody-root .MuiTableRow-root': { cursor: 'pointer' },
              '& .MuiTableBody-root .MuiTableCell-root': { p: '16px 22px', borderBottomColor: colors.line },
              '& .MuiChip-root': { width: 'fit-content', textTransform: 'capitalize' },
              '@media (max-width: 900px)': { minWidth: isAdmin ? 900 : isStaff ? 800 : 700 },
            }}
          >
            <TableHead>
              <TableRow>
                <TableCell>Ticket</TableCell>
                {isStaff && <TableCell>Requester</TableCell>}
                {isAdmin && <TableCell>Assignee</TableCell>}
                <TableCell>Priority</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Breached</TableCell>
                <TableCell>Updated</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {tickets.map((ticket) => <TableRow
                hover
                key={ticket._id}
                tabIndex={0}
                onClick={() => navigate(`/tickets/${ticket._id}`)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    navigate(`/tickets/${ticket._id}`)
                  }
                }}
              >
                <TableCell>
                  <Typography sx={{ color: '#18a0a0', fontSize: 10, fontWeight: 700, mb: '3px' }}>#{ticket._id.slice(-6)}</Typography>
                  <Typography sx={{ fontSize: 12, color: '#34425b', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ticket.title}</Typography>
                </TableCell>
                {isStaff && <TableCell sx={mutedCellSx}>{ticket.creator?.name || ticket.creator?.email || 'Unknown'}</TableCell>}
                {isAdmin && <TableCell sx={mutedCellSx}>{ticket.assignee?.name || ticket.assignee?.email || 'Unassigned'}</TableCell>}
                <TableCell><Chip size="small" label={ticket.priority} /></TableCell>
                <TableCell>
                  <Chip size="small" label={displayStatus(ticket.status)} color={ticket.status === 'resolved' || ticket.status === 'closed' ? 'success' : 'primary'} />
                </TableCell>
                <TableCell>
                  <Chip
                    size="small"
                    label={ticket.breached ? 'Yes' : 'No'}
                    color={ticket.breached ? 'error' : 'success'}
                    sx={{ textTransform: 'capitalize' }}
                  />
                </TableCell>
                <TableCell sx={mutedCellSx}>{displayDate(ticket.updatedAt)}</TableCell>
              </TableRow>)}
            </TableBody>
          </Table>
        </TableContainer>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ p: '14px 22px', borderTop: `1px solid ${colors.line}`, '@media (max-width: 700px)': { flexWrap: 'wrap' }, '@media (max-width: 650px)': { p: '12px 15px' } }}>
          <Typography sx={mutedCellSx}>Page {page} of {totalPages}</Typography>
          <Pagination count={totalPages} page={page} onChange={(_, nextPage) => setPage(nextPage)} />
        </Stack>
      </>}
    </Paper>
  </Box>
}
