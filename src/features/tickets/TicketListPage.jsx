import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Alert, Box, Button, Chip, FormControl, InputLabel, MenuItem, Pagination, Paper, Select, Stack, TextField, Typography } from '@mui/material'
import { useSelector } from 'react-redux'
import { Link, useSearchParams } from 'react-router-dom'
import { getTickets } from '../../api/tickets.api'
import { EmptyState, ErrorState, LoadingState } from '../../components/common/DataState'
import { normalizeRole } from '../../lib/permissions'

const pageSize = 10
const statusOptions = ['open', 'in progress', 'resolved', 'closed']
const priorityOptions = ['low', 'medium', 'high', 'urgent']

function displayDate(value) {
  if (!value) return '—'
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(value))
}

export default function TicketListPage() {
  const user = useSelector((state) => state.auth.user)
  const isStaff = ['agent', 'admin'].includes(normalizeRole(user?.role))
  const [searchParams, setSearchParams] = useSearchParams()
  const [searchInput, setSearchInput] = useState(searchParams.get('search') || '')
  const status = searchParams.get('status') || ''
  const priority = searchParams.get('priority') || ''
  const assignee = searchParams.get('assignee') || ''
  const breached = searchParams.get('breached') || ''
  const page = Math.max(1, Number(searchParams.get('page') || 1))
  const ticketsQuery = useQuery({
    queryKey: ['tickets'],
    queryFn: getTickets,
    enabled: isStaff,
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

  const tickets = useMemo(() => {
    const rows = Array.isArray(ticketsQuery.data) ? ticketsQuery.data : []
    const term = (searchParams.get('search') || '').toLowerCase()
    return rows.filter((ticket) => {
      const creator = ticket.creator?.name || ticket.creator?.email || ''
      const matchesSearch = `${ticket._id} ${ticket.title} ${creator}`.toLowerCase().includes(term)
      const matchesStatus = !status || ticket.status === status
      const matchesPriority = !priority || ticket.priority === priority
      const matchesAssignee = !assignee || String(ticket.assignee?._id || ticket.assignee || '') === assignee
      const matchesBreach = !breached || String(Boolean(ticket.breached)) === breached
      return matchesSearch && matchesStatus && matchesPriority && matchesAssignee && matchesBreach
    })
  }, [ticketsQuery.data, searchParams, status, priority, assignee, breached])
  const assignees = useMemo(() => {
    const uniqueAssignees = new Map()
    for (const ticket of ticketsQuery.data || []) {
      if (!ticket.assignee) continue
      const id = String(ticket.assignee?._id || ticket.assignee)
      uniqueAssignees.set(id, ticket.assignee?.name || ticket.assignee?.email || id)
    }
    return [...uniqueAssignees.entries()]
  }, [ticketsQuery.data])

  const setFilter = (key, value) => {
    const next = new URLSearchParams(searchParams)
    if (value) next.set(key, value)
    else next.delete(key)
    if (key !== 'page') next.delete('page')
    setSearchParams(next, { replace: true })
  }

  const pagedTickets = tickets.slice((page - 1) * pageSize, page * pageSize)

  if (!isStaff) {
    return <Box className="content-wrap">
      <Box className="welcome-row"><Box><Typography className="section-title">Your tickets</Typography><Typography className="section-subtitle">Create a request or open a ticket shared with you.</Typography></Box><Button component={Link} to="/tickets/new" variant="contained">Create ticket</Button></Box>
      <Alert severity="warning">The current backend ticket-list endpoint returns all tickets and does not provide customer-scoped results. For privacy, this page does not request that endpoint for customer accounts. Ask an administrator to enable a server-side “my tickets” endpoint.</Alert>
    </Box>
  }

  return <Box className="content-wrap">
    <Box className="welcome-row"><Box><Typography className="section-title">Ticket queue</Typography><Typography className="section-subtitle">Search and filter support requests.</Typography></Box><Typography className="muted-cell">{tickets.length} tickets</Typography></Box>
    <Paper className="tickets-panel" elevation={0}>
      <Box className="filter-row">
        <TextField className="search-field" size="small" label="Search" value={searchInput} onChange={(event) => setSearchInput(event.target.value)} />
        <FormControl size="small" className="filter-select"><InputLabel>Status</InputLabel><Select label="Status" value={status} onChange={(event) => setFilter('status', event.target.value)}><MenuItem value="">All statuses</MenuItem>{statusOptions.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}</Select></FormControl>
        <FormControl size="small" className="filter-select"><InputLabel>Priority</InputLabel><Select label="Priority" value={priority} onChange={(event) => setFilter('priority', event.target.value)}><MenuItem value="">All priorities</MenuItem>{priorityOptions.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}</Select></FormControl>
        <FormControl size="small" className="filter-select"><InputLabel>Assignee</InputLabel><Select label="Assignee" value={assignee} onChange={(event) => setFilter('assignee', event.target.value)}><MenuItem value="">Anyone</MenuItem>{assignees.map(([id, name]) => <MenuItem key={id} value={id}>{name}</MenuItem>)}</Select></FormControl>
        <FormControl size="small" className="filter-select"><InputLabel>SLA</InputLabel><Select label="SLA" value={breached} onChange={(event) => setFilter('breached', event.target.value)}><MenuItem value="">Any</MenuItem><MenuItem value="true">Breached</MenuItem><MenuItem value="false">On track</MenuItem></Select></FormControl>
      </Box>
      {ticketsQuery.isPending && <LoadingState label="Loading tickets…" />}
      {ticketsQuery.isError && <ErrorState error={ticketsQuery.error} onRetry={() => ticketsQuery.refetch()} />}
      {ticketsQuery.isSuccess && !tickets.length && <EmptyState>No tickets match these filters.</EmptyState>}
      {ticketsQuery.isSuccess && Boolean(tickets.length) && <>
        <Box className="ticket-list-header"><Typography>Ticket</Typography><Typography>Requester</Typography><Typography>Priority</Typography><Typography>Status</Typography><Typography>Updated</Typography></Box>
        {pagedTickets.map((ticket) => <Box className="ticket-list-row" key={ticket._id} component={Link} to={`/tickets/${ticket._id}`}>
          <Box><Typography className="ticket-id">#{ticket._id.slice(-6)}</Typography><Typography className="ticket-title">{ticket.title}</Typography></Box>
          <Typography className="muted-cell">{ticket.creator?.name || ticket.creator?.email || 'Unknown'}</Typography>
          <Chip size="small" label={ticket.priority} />
          <Chip size="small" label={ticket.status} color={ticket.status === 'resolved' || ticket.status === 'closed' ? 'success' : 'primary'} />
          <Typography className="muted-cell">{displayDate(ticket.updatedAt)}</Typography>
        </Box>)}
        <Stack className="list-pagination" direction="row" justifyContent="space-between" alignItems="center"><Typography className="muted-cell">Page {page} of {Math.max(1, Math.ceil(tickets.length / pageSize))}</Typography><Pagination count={Math.max(1, Math.ceil(tickets.length / pageSize))} page={page} onChange={(_, nextPage) => setFilter('page', String(nextPage))} /></Stack>
      </>}
    </Paper>
  </Box>
}
