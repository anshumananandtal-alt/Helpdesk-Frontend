import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { configureStore } from '@reduxjs/toolkit'
import { Provider } from 'react-redux'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import sessionReducer from '../../auth/sessionSlice'
import { getTickets } from '../../api/tickets.api'
import TicketListPage from './TicketListPage'

vi.mock('../../api/tickets.api', () => ({ getTickets: vi.fn() }))

describe('TicketListPage', () => {
  afterEach(() => cleanup())
  beforeEach(() => vi.clearAllMocks())

  it('loads the customer-scoped ticket list so newly created tickets are visible', async () => {
    getTickets.mockResolvedValue({
      tickets: [{
        _id: 'ticket-123456',
        title: 'Created support request',
        creator: { _id: 'customer-1', name: 'Customer One' },
        priority: 'medium',
        status: 'open',
        breached: true,
        updatedAt: '2026-01-01T00:00:00.000Z',
      }],
      page: 1,
      limit: 10,
      total: 1,
      totalPages: 1,
    })
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

    expect(await screen.findByText('Created support request')).toBeInTheDocument()
    expect(screen.getByText('Breached')).toBeInTheDocument()
    expect(screen.getByText('Yes')).toBeInTheDocument()
    expect(getTickets).toHaveBeenCalledWith({ page: 1, limit: 10 })
    queryClient.clear()
  })

  it('applies local filters and pagination to customer results', async () => {
    getTickets.mockResolvedValue({
      tickets: Array.from({ length: 10 }, (_, index) => ({
        _id: `ticket-${index + 1}`,
        title: `Support request ${index + 1}`,
        priority: 'high',
        status: 'resolved',
        breached: true,
        updatedAt: '2026-01-01T00:00:00.000Z',
      })),
      page: 1,
      limit: 10,
      total: 20,
      totalPages: 2,
    })
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

    expect(await screen.findByText('Support request 1')).toBeInTheDocument()

    fireEvent.mouseDown(screen.getByRole('combobox', { name: 'Status' }))
    fireEvent.click(await screen.findByRole('option', { name: 'resolved' }))
    fireEvent.mouseDown(screen.getByRole('combobox', { name: 'Priority' }))
    fireEvent.click(await screen.findByRole('option', { name: 'high' }))
    fireEvent.mouseDown(screen.getByRole('combobox', { name: 'SLA' }))
    fireEvent.click(await screen.findByRole('option', { name: 'Breached' }))
    fireEvent.change(screen.getByRole('textbox', { name: 'Search' }), {
      target: { value: 'login' },
    })

    const firstPageParams = {
      page: 1,
      limit: 10,
      search: 'login',
      status: 'resolved',
      priority: 'high',
      breached: 'true',
    }
    await waitFor(() => expect(getTickets).toHaveBeenCalledWith(firstPageParams))

    fireEvent.click(screen.getByRole('button', { name: 'Go to page 2' }))
    await waitFor(() => expect(getTickets).toHaveBeenCalledWith({
      ...firstPageParams,
      page: 2,
    }))

    fireEvent.mouseDown(screen.getByRole('combobox', { name: 'Status' }))
    fireEvent.click(await screen.findByRole('option', { name: 'open' }))
    await waitFor(() => expect(getTickets).toHaveBeenCalledWith({
      ...firstPageParams,
      page: 1,
      status: 'open',
    }))
    queryClient.clear()
  })

})
