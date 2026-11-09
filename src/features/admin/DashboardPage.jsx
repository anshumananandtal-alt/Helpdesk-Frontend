import { useQuery } from '@tanstack/react-query'
import { Box, Paper, Typography } from '@mui/material'
import { getDashboard } from '../../api/dashboard.api'
import { EmptyState, ErrorState, LoadingState } from '../../components/common/DataState'

function formatLabel(value) {
  return String(value).replaceAll('_', ' ')
}

function BarChart({ title, rows = [], labelKey, emptyMessage, color }) {
  const maxCount = Math.max(1, ...rows.map((row) => Number(row.count) || 0))
  const chartDescription = rows
    .map((row) => `${formatLabel(row[labelKey])}: ${Number(row.count) || 0}`)
    .join('; ')

  return <Paper className="report-card chart-card" elevation={0}>
    <Typography className="panel-title">{title}</Typography>
    {rows.length
      ? <Box className="chart-rows" role="img" aria-label={`${title}: ${chartDescription}`}>
        {rows.map((row) => {
          const count = Number(row.count) || 0
          const width = `${Math.max(count > 0 ? 4 : 0, (count / maxCount) * 100)}%`
          return <Box className="chart-row" key={row[labelKey]}>
            <Box className="chart-row-heading">
              <Typography className="chart-label">{formatLabel(row[labelKey])}</Typography>
              <Typography className="chart-count">{count}</Typography>
            </Box>
            <Box className="chart-track" aria-hidden="true">
              <Box className="chart-bar" sx={{ width, backgroundColor: color }} />
            </Box>
          </Box>
        })}
      </Box>
      : <Typography className="muted-cell chart-empty">{emptyMessage}</Typography>}
  </Paper>
}

export default function DashboardPage() {
  const dashboard = useQuery({ queryKey: ['dashboard'], queryFn: getDashboard })

  if (dashboard.isPending) return <LoadingState label="Loading reports…" />
  if (dashboard.isError) return <ErrorState error={dashboard.error} onRetry={() => dashboard.refetch()} />

  const data = dashboard.data
  const statusRows = data.ticketCountPerStatus || []
  const breachedRows = data.breachedTicketsPerPriority || []
  const totalTickets = statusRows.reduce((total, row) => total + (Number(row.count) || 0), 0)
  const breachedTickets = breachedRows.reduce((total, row) => total + (Number(row.count) || 0), 0)
  const hasMetrics = totalTickets > 0 || breachedTickets > 0 || Number(data.averageResolutionHours) > 0

  return <Box className="content-wrap">
    <Box className="welcome-row">
      <Box>
        <Typography className="section-title">Service overview</Typography>
        <Typography className="section-subtitle">A live view of ticket volume and SLA performance.</Typography>
      </Box>
    </Box>
    {!hasMetrics && <EmptyState>No report data is available yet.</EmptyState>}
    <Box className="report-grid dashboard-metrics">
      <Paper className="report-card summary-card" elevation={0}>
        <Typography className="metric-label">Total tickets</Typography>
        <Typography className="report-value">{totalTickets}</Typography>
      </Paper>
      <Paper className="report-card summary-card" elevation={0}>
        <Typography className="metric-label">Average resolution</Typography>
        <Typography className="report-value">{Number(data.averageResolutionHours || 0).toFixed(2)} hours</Typography>
      </Paper>
      <Paper className="report-card summary-card" elevation={0}>
        <Typography className="metric-label">Breached tickets</Typography>
        <Typography className="report-value">{breachedTickets}</Typography>
      </Paper>
    </Box>
    <Box className="report-grid dashboard-charts">
      <BarChart
        title="Tickets by status"
        rows={statusRows}
        labelKey="status"
        emptyMessage="No tickets found."
        color="#248fbe"
      />
      <BarChart
        title="Breached tickets by priority"
        rows={breachedRows}
        labelKey="priority"
        emptyMessage="No breached tickets."
        color="#e78b42"
      />
    </Box>
  </Box>
}
