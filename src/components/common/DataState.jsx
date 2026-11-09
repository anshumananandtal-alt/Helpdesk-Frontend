import { Alert, Box, Button, CircularProgress, Typography } from '@mui/material'

export function LoadingState({ label = 'Loading…' }) {
  return <Box className="data-state" role="status"><CircularProgress size={26} /><Typography>{label}</Typography></Box>
}

export function ErrorState({ error, onRetry }) {
  return <Box className="data-state"><Alert severity="error">{error?.message || 'Something went wrong.'}</Alert>{onRetry && <Button onClick={onRetry}>Try again</Button>}</Box>
}

export function EmptyState({ children = 'Nothing to show yet.' }) {
  return <Box className="data-state"><Typography>{children}</Typography></Box>
}
