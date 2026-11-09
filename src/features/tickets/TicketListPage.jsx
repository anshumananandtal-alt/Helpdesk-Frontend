import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Box, Button, Chip, FormControl, InputLabel, MenuItem, Pagination, Paper, Select, Stack, TextField, Typography } from '@mui/material'
import { useSelector } from 'react-redux'
import { Link, useSearchParams } from 'react-router-dom'
import { getTickets } from '../../api/tickets.api'
import { EmptyState, ErrorState, LoadingState } from '../../components/common/DataState'
import { normalizeRole } from '../../lib/permissions'

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
  const isStaff = ['agent', 'admin'].includes(normalizeRole(user?.role))
  const isAdmin = normalizeRole(user?.role) === 'admin' 
  const [searchParams, setSearchParams] = useSearchParams()
  const [searchInput, setSearchInput] = useState(searchParams.get('search') || '')
  const [assigneeInput, setAssigneeInput] = useState(searchParams.get('assignee') || '')
  const status = searchParams.get('status') || ''
  const priority = searchParams.get('priority') || ''
  const assignee = searchParams.get('assignee') || ''
  const breached = searchParams.get('breached') || ''
  const requestedPage = Number.parseInt(searchParams.get('page') || '1', 10)
  const page = Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1
  const queryParams = {
    page,
    limit: pageSize,
    ...(searchParams.get('search') ? { search: searchParams.get('search') } : {}),
    ...(status ? { status } : {}),
    ...(priority ? { priority } : {}),
    ...(isStaff && assignee ? { assignee } : {}),
    ...(breached ? { breached } : {}),
  }
  const ticketsQuery = useQuery({
    queryKey: ['tickets', queryParams],
    queryFn: () => getTickets(queryParams),
  })

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (searchInput !== (searchParams.get('search') || '')) {
        const next = new URLSearchParams(searchParams)
        if (searchInput.trim()) next.set('search', searchInput.trim())
        else next.delete('search')
        next.delete('page')
        setSearchParams(next, { replace: true })
      }
    }, 300)
    return () => window.clearTimeout(timer)
  }, [searchInput, searchParams, setSearchParams])

  const setFilter = (key, value) => {
    const next = new URLSearchParams(searchParams)
    if (value) next.set(key, value)
    else next.delete(key)
    if (key !== 'page') next.delete('page')
    setSearchParams(next, { replace: true })
  }

  const tickets = ticketsQuery.data?.tickets || []
  const total = ticketsQuery.data?.total || 0
  const totalPages = Math.max(1, ticketsQuery.data?.totalPages || 1)

  return <Box className="content-wrap">
    <Box className="welcome-row">
      <Box>
        <Typography className="section-title">{isStaff ? 'Ticket queue' : 'Your tickets'}</Typography>
        <Typography className="section-subtitle">{isStaff ? 'Search and manage support requests.' : 'Track the support requests you have created.'}</Typography>
      </Box>
      {ticketsQuery.isSuccess && <Typography className="muted-cell">{total} {total === 1 ? 'ticket' : 'tickets'}</Typography>}
      <Button component={Link} to="/tickets/new" variant="contained">Create ticket</Button>
    </Box>
    <Paper className="tickets-panel" elevation={0}>
      <Box className="filter-row">
        <TextField className="search-field" size="small" label="Search" value={searchInput} onChange={(event) => setSearchInput(event.target.value)} />
        <FormControl size="small" className="filter-select">
          <InputLabel>Status</InputLabel>
          <Select label="Status" value={status} onChange={(event) => setFilter('status', event.target.value)}>
            <MenuItem value="">All statuses</MenuItem>
            {statusOptions.map((item) => <MenuItem key={item} value={item}>{displayStatus(item)}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl size="small" className="filter-select">
          <InputLabel>Priority</InputLabel>
          <Select label="Priority" value={priority} onChange={(event) => setFilter('priority', event.target.value)}>
            <MenuItem value="">All priorities</MenuItem>
            {priorityOptions.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}
          </Select>
        </FormControl>
        {isStaff && <Stack direction="row" spacing={1}>
          <TextField
            className="filter-select"
            size="small"
            label="Assignee ID"
            value={assigneeInput}
            onChange={(event) => setAssigneeInput(event.target.value)}
          />
          <Button onClick={() => setFilter('assignee', assigneeInput.trim())}>Apply</Button>
        </Stack>}
        <FormControl size="small" className="filter-select">
          <InputLabel>SLA</InputLabel>
          <Select label="SLA" value={breached} onChange={(event) => setFilter('breached', event.target.value)}>
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
        <Box className={`ticket-list-header ${isStaff ? 'staff-ticket-grid' : 'customer-ticket-grid'}`}>
          <Typography>Ticket</Typography>
          {isStaff && <Typography>Requester</Typography>}
          {isAdmin && <Typography>Assignee</Typography>}
          <Typography>Priority</Typography><Typography>Status</Typography><Typography>Breached</Typography><Typography>Updated</Typography>
        </Box>
        {tickets.map((ticket) => <Box className={`ticket-list-row ${isStaff ? 'staff-ticket-grid' : 'customer-ticket-grid'}`} key={ticket._id} component={Link} to={`/tickets/${ticket._id}`}>
          <Box><Typography className="ticket-id">#{ticket._id.slice(-6)}</Typography><Typography className="ticket-title">{ticket.title}</Typography></Box>
          {
            isStaff && <Typography className="muted-cell">{ticket.creator?.name || ticket.creator?.email || 'Unknown'}</Typography>
          }
          {isAdmin && <Typography className="muted-cell">{ticket.assignee?.name || ticket.assignee?.email || 'Unassigned'}</Typography>}
          <Chip size="small" label={ticket.priority} />
          <Chip size="small" label={displayStatus(ticket.status)} color={ticket.status === 'resolved' || ticket.status === 'closed' ? 'success' : 'primary'} />
          <Chip
            className="breached-chip"
            size="small"
            label={ticket.breached ? 'Yes' : 'No'}
            color={ticket.breached ? 'error' : 'success'}
          />
          <Typography className="muted-cell">{displayDate(ticket.updatedAt)}</Typography>
        </Box>)}
        <Stack className="list-pagination" direction="row" justifyContent="space-between" alignItems="center">
          <Typography className="muted-cell">Page {page} of {totalPages}</Typography>
          <Pagination count={totalPages} page={page} onChange={(_, nextPage) => setFilter('page', String(nextPage))} />
        </Stack>
      </>}
    </Paper>
  </Box>
}
