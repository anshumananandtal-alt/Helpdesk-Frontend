import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import '@testing-library/jest-dom/vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { configureStore } from '@reduxjs/toolkit'
import { Provider } from 'react-redux'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import sessionReducer from '../../auth/sessionSlice'
import { getUsers } from '../../api/users.api'
import UsersPage from './UsersPage'

vi.mock('../../api/users.api', () => ({
  getUsers: vi.fn(),
  updateUser: vi.fn(),
}))

describe('UsersPage', () => {
  beforeEach(() => vi.clearAllMocks())

  it('shows users in client-side pages', async () => {
    getUsers.mockResolvedValue(Array.from({ length: 12 }, (_, index) => ({
      _id: `user-${index + 1}`,
      name: `User ${index + 1}`,
      email: `user${index + 1}@example.com`,
      role: 'customer',
      isActive: true,
    })))
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
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })

    render(
      <Provider store={store}>
        <QueryClientProvider client={queryClient}>
          <UsersPage />
        </QueryClientProvider>
      </Provider>,
    )

    expect(await screen.findByText('User 1')).toBeInTheDocument()
    expect(screen.getByText('Page 1 of 2')).toBeInTheDocument()
    expect(screen.queryByText('User 11')).not.toBeInTheDocument()
    expect(getUsers).toHaveBeenCalledWith(1, 10)

    fireEvent.click(screen.getByRole('button', { name: 'Go to page 2' }))

    expect(await screen.findByText('User 11')).toBeInTheDocument()
    expect(screen.queryByText('User 1')).not.toBeInTheDocument()
    expect(screen.getByText('Page 2 of 2')).toBeInTheDocument()
    queryClient.clear()
  })
})
