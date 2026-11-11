import { Provider } from 'react-redux'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { CssBaseline, ThemeProvider } from '@mui/material'
import { store } from './store'
import theme from './theme'
import { logout } from '../auth/sessionSlice'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

function SessionEvents({ children }) {
  const dispatch = useDispatch()

  useEffect(() => {
    const handleUnauthorized = () => dispatch(logout())
    window.addEventListener('helpdesk:unauthorized', handleUnauthorized)
    return () => window.removeEventListener('helpdesk:unauthorized', handleUnauthorized)
  }, [dispatch])

  return children
}

export default function AppProviders({ children }) {
  return <ThemeProvider theme={theme}>
    <CssBaseline />
    <Provider store={store}><SessionEvents><QueryClientProvider client={queryClient}>{children}</QueryClientProvider></SessionEvents></Provider>
  </ThemeProvider>
}
