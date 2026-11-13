import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { configureStore } from '@reduxjs/toolkit'
import { Provider } from 'react-redux'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import sessionReducer from '../../auth/sessionSlice'
import { createTicket, getClosedTickets } from '../../api/tickets.api'
import CreateTicketPage from './CreateTicketPage'

vi.mock('../../api/tickets.api', () => ({
  createTicket: vi.fn(),
  getClosedTickets: vi.fn(),
}))

describe('CreateTicketPage', () => {
  afterEach(() => cleanup())
  beforeEach(() => vi.clearAllMocks())

  it('loads closed tickets and submits the selected ticket as relatedTo', async () => {
    getClosedTickets.mockResolvedValue([
      { _id: 'closed-ticket-1', title: 'Previously resolved issue' },
    ])
    createTicket.mockResolvedValue({ _id: 'new-ticket-1' })
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
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })

    render(
      <Provider store={store}>
        <QueryClientProvider client={queryClient}>
          <MemoryRouter>
            <CreateTicketPage />
          </MemoryRouter>
        </QueryClientProvider>
      </Provider>,
    )

    const relatedToSelect = await screen.findByRole('combobox', { name: 'Related To' })
    await waitFor(() => expect(relatedToSelect).toBeEnabled())
    fireEvent.mouseDown(relatedToSelect)
    fireEvent.click(await screen.findByRole('option', { name: 'Previously resolved issue' }))
    fireEvent.change(screen.getByRole('textbox', { name: /Title/ }), { target: { value: 'A new support request' } })
    fireEvent.change(screen.getByRole('textbox', { name: /Description/ }), { target: { value: 'Details for this support request' } })
    fireEvent.click(screen.getByRole('button', { name: 'Create ticket' }))

    await waitFor(() => expect(createTicket.mock.calls[0][0]).toEqual({
      title: 'A new support request',
      description: 'Details for this support request',
      priority: 'medium',
      category: '',
      relatedTo: 'closed-ticket-1',
    }))
    expect(getClosedTickets).toHaveBeenCalled()
    queryClient.clear()
  })

  it('does not send an empty relatedTo value when no ticket is selected', async () => {
    getClosedTickets.mockResolvedValue([])
    createTicket.mockResolvedValue({ _id: 'new-ticket-1' })
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
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })

    render(
      <Provider store={store}>
        <QueryClientProvider client={queryClient}>
          <MemoryRouter>
            <CreateTicketPage />
          </MemoryRouter>
        </QueryClientProvider>
      </Provider>,
    )

    const relatedToSelect = await screen.findByRole('combobox', { name: 'Related To' })
    await waitFor(() => expect(relatedToSelect).toBeEnabled())
    fireEvent.change(screen.getByRole('textbox', { name: /Title/ }), { target: { value: 'A new support request' } })
    fireEvent.change(screen.getByRole('textbox', { name: /Description/ }), { target: { value: 'Details for this support request' } })
    fireEvent.click(screen.getByRole('button', { name: 'Create ticket' }))

    await waitFor(() => expect(createTicket.mock.calls[0][0]).toEqual({
      title: 'A new support request',
      description: 'Details for this support request',
      priority: 'medium',
      category: '',
    }))
    queryClient.clear()
  })
})
