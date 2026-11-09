import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import '@testing-library/jest-dom/vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { configureStore } from '@reduxjs/toolkit'
import { Provider } from 'react-redux'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import sessionReducer from '../../auth/sessionSlice'
import { getComments } from '../../api/comments.api'
import { getTicket } from '../../api/tickets.api'
import TicketDetailPage from './TicketDetailPage'

vi.mock('../../api/comments.api', () => ({
  createComment: vi.fn(),
  getComments: vi.fn(),
}))
vi.mock('../../api/tickets.api', () => ({
  getTicket: vi.fn(),
  updateTicket: vi.fn(),
}))

describe('TicketDetailPage', () => {
  beforeEach(() => vi.clearAllMocks())

  it('does not request comments when a customer opens another user’s ticket', async () => {
    getTicket.mockResolvedValue({
      _id: 'ticket-1',
      title: 'Private ticket',
      description: 'Details',
      status: 'open',
      priority: 'low',
      creator: 'customer-2',
      version: 1,
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
          <MemoryRouter initialEntries={['/tickets/ticket-1']}>
            <Routes><Route path="/tickets/:id" element={<TicketDetailPage />} /></Routes>
          </MemoryRouter>
        </QueryClientProvider>
      </Provider>,
    )

    expect(await screen.findByText(/do not have permission to view this ticket/i)).toBeInTheDocument()
    await waitFor(() => expect(getTicket).toHaveBeenCalledOnce())
    expect(getComments).not.toHaveBeenCalled()
    queryClient.clear()
  })
})
