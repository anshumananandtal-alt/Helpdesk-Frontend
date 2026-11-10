import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { configureStore } from '@reduxjs/toolkit'
import { Provider } from 'react-redux'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import sessionReducer from '../../auth/sessionSlice'
import { getTicketAudit } from '../../api/audit.api'
import { getComments } from '../../api/comments.api'
import { deleteTicketAttachment, getTicket, getTicketAttachment, updateTicket } from '../../api/tickets.api'
import { getUsers } from '../../api/users.api'
import TicketDetailPage from './TicketDetailPage'

vi.mock('../../api/audit.api', () => ({ getTicketAudit: vi.fn() }))
vi.mock('../../api/comments.api', () => ({
  createComment: vi.fn(),
  getComments: vi.fn(),
}))
vi.mock('../../api/tickets.api', () => ({
  getTicket: vi.fn(),
  getTicketAttachment: vi.fn(),
  deleteTicketAttachment: vi.fn(),
  updateTicket: vi.fn(),
}))
vi.mock('../../api/users.api', () => ({ getUsers: vi.fn() }))

describe('TicketDetailPage', () => {
  beforeEach(() => vi.clearAllMocks())
  afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
  })

  it('lets admins assign a ticket to an active agent', async () => {
    getTicket.mockResolvedValue({
      _id: 'ticket-1',
      title: 'Unassigned ticket',
      description: 'Details',
      status: 'open',
      priority: 'low',
      creator: 'customer-1',
      assignee: null,
      version: 4,
    })
    getComments.mockResolvedValue([])
    getTicketAudit.mockResolvedValue([])
    getUsers.mockResolvedValue([
      { _id: 'agent-1', name: 'Agent One', email: 'agent@example.com', role: 'agent', isActive: true },
      { _id: 'agent-2', name: 'Inactive Agent', email: 'inactive@example.com', role: 'agent', isActive: false },
      { _id: 'customer-2', name: 'Customer Two', email: 'customer@example.com', role: 'customer', isActive: true },
    ])
    updateTicket.mockResolvedValue({ _id: 'ticket-1', assignee: { _id: 'agent-1' }, version: 5 })
    const store = configureStore({
      reducer: { auth: sessionReducer },
      preloadedState: {
        auth: {
          isAuthenticated: true,
          token: 'admin-token',
          user: { id: 'admin-1', role: 'admin' },
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

    const assigneeSelect = await screen.findByRole('combobox', { name: 'Assign to agent' })
    fireEvent.mouseDown(assigneeSelect)
    expect(screen.queryByRole('option', { name: /Inactive Agent|Customer Two/ })).not.toBeInTheDocument()
    fireEvent.click(await screen.findByRole('option', { name: /Agent One/ }))

    await waitFor(() => expect(updateTicket).toHaveBeenCalledWith('ticket-1', {
      assignee: 'agent-1',
      version: 4,
    }))
    queryClient.clear()
  })

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

  it('never renders internal comments in a customer view', async () => {
    getTicket.mockResolvedValue({
      _id: 'ticket-1',
      title: 'My request',
      description: 'Details',
      status: 'open',
      priority: 'low',
      creator: 'customer-1',
      version: 1,
    })
    getComments.mockResolvedValue([
      { _id: 'public-1', text: 'Customer-visible reply', isInternal: false },
      { _id: 'internal-1', text: 'Private staff note', isInternal: true },
    ])
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

    expect(await screen.findByText('Customer-visible reply')).toBeInTheDocument()
    expect(screen.queryByText('Private staff note')).not.toBeInTheDocument()
    queryClient.clear()
  })

  it('provides open and download links for PDF attachments', async () => {
    getTicket.mockResolvedValue({
      _id: 'ticket-1',
      title: 'My request',
      description: 'Details',
      status: 'open',
      priority: 'low',
      creator: 'customer-1',
      fileName: ['images/document.pdf'],
      version: 1,
    })
    getComments.mockResolvedValue([])
    getTicketAttachment.mockResolvedValue(new Blob(['document'], { type: 'application/pdf' }))
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn(() => 'blob:ticket-attachment'),
      revokeObjectURL: vi.fn(),
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

    expect(await screen.findByText('Attachment 1.pdf')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Open' })).toHaveAttribute('href', 'blob:ticket-attachment')
    expect(screen.getByRole('link', { name: 'Download' })).toHaveAttribute('download', 'Attachment 1.pdf')
    queryClient.clear()
  })

  it('deletes an attachment and refreshes the ticket', async () => {
    const ticketWithAttachment = {
      _id: 'ticket-1',
      title: 'My request',
      description: 'Details',
      status: 'open',
      priority: 'low',
      creator: 'customer-1',
      fileName: ['images/document.pdf'],
      version: 1,
    }
    getTicket.mockResolvedValueOnce(ticketWithAttachment).mockResolvedValue({
      ...ticketWithAttachment,
      fileName: [],
      version: 2,
    })
    getComments.mockResolvedValue([])
    getTicketAttachment.mockResolvedValue(new Blob(['document'], { type: 'application/pdf' }))
    deleteTicketAttachment.mockResolvedValue({ message: 'Ticket image deleted successfully', version: 2 })
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn(() => 'blob:ticket-attachment'),
      revokeObjectURL: vi.fn(),
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

    fireEvent.click(await screen.findByRole('button', { name: 'Delete Attachment 1.pdf' }))

    await waitFor(() => {
      expect(deleteTicketAttachment).toHaveBeenCalledWith('ticket-1', 0)
      expect(screen.queryByText('Attachment 1.pdf')).not.toBeInTheDocument()
    })
    queryClient.clear()
  })
})
