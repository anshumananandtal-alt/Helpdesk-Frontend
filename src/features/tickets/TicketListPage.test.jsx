import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import '@testing-library/jest-dom/vitest'
import { render, screen, within } from '@testing-library/react'
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

  it('sends URL filters to the server for paginated customer results', async () => {
    getTickets.mockResolvedValue({ tickets: [], page: 2, limit: 10, total: 0, totalPages: 0 })
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
          <MemoryRouter initialEntries={['/tickets?status=resolved&priority=high&page=2&search=login']}>
            <TicketListPage />
          </MemoryRouter>
        </QueryClientProvider>
      </Provider>,
    )

    expect(await screen.findByText(/no tickets yet/i)).toBeInTheDocument()
    expect(getTickets).toHaveBeenCalledWith({
      page: 2,
      limit: 10,
      search: 'login',
      status: 'resolved',
      priority: 'high',
    })
    queryClient.clear()
  })

  it('shows requester and assignee to admins with updated as the final column', async () => {
    getTickets.mockResolvedValue({
      tickets: [{
        _id: 'ticket-654321',
        title: 'Assigned support request',
        creator: { name: 'Requester One' },
        assignee: { name: 'Agent One' },
        priority: 'high',
        status: 'in_progress',
        breached: false,
        updatedAt: '2026-01-01T00:00:00.000Z',
      }],
      page: 1,
      limit: 10,
      total: 1,
      totalPages: 1,
    })
    const store = configureStore({
      reducer: {
        auth: () => ({
          isAuthenticated: true,
          token: 'admin-token',
          user: { id: 'admin-1', role: 'admin' },
        }),
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

    expect(await screen.findByText('Assigned support request')).toBeInTheDocument()
    expect(screen.getByText('Requester One')).toBeInTheDocument()
    expect(screen.getByText('Agent One')).toBeInTheDocument()
    const headers = document.querySelectorAll('.ticket-list-header')
    const header = headers[headers.length - 1]
    const labels = within(header).getAllByText(/Ticket|Requester|Assignee|Priority|Status|Breached|Updated/)
    expect(labels.map((label) => label.textContent)).toEqual([
      'Ticket',
      'Requester',
      'Assignee',
      'Priority',
      'Status',
      'Breached',
      'Updated',
    ])
    queryClient.clear()
  })
})
