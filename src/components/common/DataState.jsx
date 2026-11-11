import { Alert, Box, Button, CircularProgress, Typography } from '@mui/material'

export function LoadingState({ label = 'Loading…' }) {
  return <Box sx={{ minHeight: 150, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '14px', p: '24px', color: 'text.secondary' }} role="status"><CircularProgress size={26} /><Typography>{label}</Typography></Box>
}

export function ErrorState({ error, onRetry }) {
  return <Box sx={{ minHeight: 150, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '14px', p: '24px', color: 'text.secondary' }}><Alert severity="error" sx={{ maxWidth: 720, width: '100%' }}>{error?.message || 'Something went wrong.'}</Alert>{onRetry && <Button onClick={onRetry}>Try again</Button>}</Box>
}

export function EmptyState({ children = 'Nothing to show yet.' }) {
  return <Box sx={{ minHeight: 150, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '14px', p: '24px', color: 'text.secondary' }}><Typography>{children}</Typography></Box>
}
