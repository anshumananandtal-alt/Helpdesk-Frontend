import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import '@testing-library/jest-dom/vitest'
import { render, screen } from '@testing-library/react'
import { configureStore } from '@reduxjs/toolkit'
import { Provider } from 'react-redux'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import sessionReducer from '../../auth/sessionSlice'
import { getTickets } from '../../api/tickets.api'
import TicketListPage from './TicketListPage'

vi.mock('../../api/tickets.api', () => ({ getTickets: vi.fn() }))

describe('TicketListPage', () => {
  beforeEach(() => vi.clearAllMocks())

  it('does not request the unscoped all-ticket endpoint for a customer', () => {
    const store = configureStore({
      reducer: { auth: sessionReducer },
      preloadedState: {
        auth: {
          isAuthenticated: true,
          token: 'customer-token',
          user: { id: 'customer-1', role: 'customer' },
        },
      },
    })
    const queryClient = new QueryClient()

    render(
      <Provider store={store}>
        <QueryClientProvider client={queryClient}>
          <MemoryRouter>
            <TicketListPage />
          </MemoryRouter>
        </QueryClientProvider>
      </Provider>,
    )

    expect(screen.getByText(/does not provide customer-scoped results/i)).toBeInTheDocument()
    expect(getTickets).not.toHaveBeenCalled()
    queryClient.clear()
  })
})
