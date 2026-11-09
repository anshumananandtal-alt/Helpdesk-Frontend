import { useQuery } from '@tanstack/react-query'
import { Box, Paper, Typography } from '@mui/material'
import { getDashboard } from '../../api/dashboard.api'
import { EmptyState, ErrorState, LoadingState } from '../../components/common/DataState'

export default function DashboardPage() {
  const dashboard = useQuery({ queryKey: ['dashboard'], queryFn: getDashboard })

  if (dashboard.isPending) return <LoadingState label="Loading reports…" />
  if (dashboard.isError) return <ErrorState error={dashboard.error} onRetry={() => dashboard.refetch()} />

  const data = dashboard.data
  const hasMetrics = data.ticketCountPerStatus?.length ||
    data.breachedTicketsPerPriority?.length ||
    data.averageResolutionHours > 0

  return <Box className="content-wrap">
    {!hasMetrics && <EmptyState>No report data is available yet.</EmptyState>}
    <Box className="report-grid">
      <Paper className="report-card" elevation={0}>
        <Typography className="panel-title">Tickets by status</Typography>
        {data.ticketCountPerStatus?.length
          ? data.ticketCountPerStatus.map((row) => <Box className="report-row" key={row.status}><Typography>{row.status}</Typography><strong>{row.count}</strong></Box>)
          : <Typography className="muted-cell">No tickets found.</Typography>}
      </Paper>
      <Paper className="report-card" elevation={0}>
        <Typography className="panel-title">Average resolution time</Typography>
        <Typography className="report-value">{Number(data.averageResolutionHours || 0).toFixed(2)} hours</Typography>
      </Paper>
      <Paper className="report-card" elevation={0}>
        <Typography className="panel-title">Breached tickets by priority</Typography>
        {data.breachedTicketsPerPriority?.length
          ? data.breachedTicketsPerPriority.map((row) => <Box className="report-row" key={row.priority}><Typography>{row.priority}</Typography><strong>{row.count}</strong></Box>)
          : <Typography className="muted-cell">No breached tickets.</Typography>}
      </Paper>
    </Box>
  </Box>
}
