import { useQuery } from '@tanstack/react-query'
import { Box, Paper, Typography } from '@mui/material'
import { getDashboard } from '../../api/dashboard.api'
import { EmptyState, ErrorState, LoadingState } from '../../components/common/DataState'
import { colors } from '../../app/theme'

const pageContentSx = { maxWidth: 1440, mx: 'auto', p: '40px clamp(25px, 4vw, 56px)', '@media (max-width: 650px)': { p: '25px 15px' } }
const sectionTitleSx = { font: "700 18px 'Plus Jakarta Sans'", letterSpacing: '-.4px' }
const sectionSubtitleSx = { color: colors.muted, fontSize: 12, mt: '5px' }
const panelTitleSx = { font: "800 15px 'Plus Jakarta Sans'" }
const reportCardSx = { p: '24px', border: `1px solid ${colors.line}`, borderRadius: '11px' }

function formatLabel(value) {
  return String(value).replaceAll('_', ' ')
}

function BarChart({ title, rows = [], labelKey, emptyMessage, color }) {
  const maxCount = Math.max(1, ...rows.map((row) => Number(row.count) || 0))
  const chartDescription = rows
    .map((row) => `${formatLabel(row[labelKey])}: ${Number(row.count) || 0}`)
    .join('; ')

  return <Paper elevation={0} sx={{ ...reportCardSx, minHeight: 260 }}>
    <Typography sx={panelTitleSx}>{title}</Typography>
    {rows.length
      ? <Box sx={{ display: 'grid', gap: '18px', mt: '25px' }} role="img" aria-label={`${title}: ${chartDescription}`}>
        {rows.map((row) => {
          const count = Number(row.count) || 0
          const width = `${Math.max(count > 0 ? 4 : 0, (count / maxCount) * 100)}%`
          return <Box key={row[labelKey]}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: '12px', mb: '7px' }}>
              <Typography sx={{ color: '#647087', fontSize: 12, textTransform: 'capitalize' }}>{formatLabel(row[labelKey])}</Typography>
              <Typography sx={{ color: colors.ink, fontSize: 12, fontWeight: 700 }}>{count}</Typography>
            </Box>
            <Box sx={{ height: 9, overflow: 'hidden', borderRadius: '6px', bgcolor: '#edf1f6' }} aria-hidden="true">
              <Box sx={{ width, height: '100%', minWidth: 0, borderRadius: 'inherit', transition: 'width .25s ease', bgcolor: color }} />
            </Box>
          </Box>
        })}
      </Box>
      : <Typography sx={{ color: '#6f7a8f', fontSize: 11, mt: '25px' }}>{emptyMessage}</Typography>}
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

  return <Box sx={pageContentSx}>
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mb: '24px' }}>
      <Box>
        <Typography sx={sectionTitleSx}>Service overview</Typography>
        <Typography sx={sectionSubtitleSx}>A live view of ticket volume and SLA performance.</Typography>
      </Box>
    </Box>
    {!hasMetrics && <EmptyState>No report data is available yet.</EmptyState>}
    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '16px', mb: '16px' }}>
      <Paper elevation={0} sx={{ ...reportCardSx, minHeight: 120 }}>
        <Typography sx={{ color: '#8590a3', fontSize: 11, fontWeight: 600 }}>Total tickets</Typography>
        <Typography sx={{ font: "700 26px 'Plus Jakarta Sans'", mt: '12px' }}>{totalTickets}</Typography>
      </Paper>
      <Paper elevation={0} sx={{ ...reportCardSx, minHeight: 120 }}>
        <Typography sx={{ color: '#8590a3', fontSize: 11, fontWeight: 600 }}>Average resolution</Typography>
        <Typography sx={{ font: "700 26px 'Plus Jakarta Sans'", mt: '12px' }}>{Number(data.averageResolutionHours || 0).toFixed(2)} hours</Typography>
      </Paper>
      <Paper elevation={0} sx={{ ...reportCardSx, minHeight: 120 }}>
        <Typography sx={{ color: '#8590a3', fontSize: 11, fontWeight: 600 }}>Breached tickets</Typography>
        <Typography sx={{ font: "700 26px 'Plus Jakarta Sans'", mt: '12px' }}>{breachedTickets}</Typography>
      </Paper>
    </Box>
    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
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
