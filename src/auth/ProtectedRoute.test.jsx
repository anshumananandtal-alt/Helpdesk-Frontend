import { configureStore } from '@reduxjs/toolkit'
import '@testing-library/jest-dom/vitest'
import { render, screen } from '@testing-library/react'
import { Provider } from 'react-redux'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import ProtectedRoute from './ProtectedRoute'
import sessionReducer from './sessionSlice'

function renderProtected(auth, allowedRoles) {
  const store = configureStore({
    reducer: { auth: sessionReducer },
    preloadedState: { auth },
  })

  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={['/private']}>
        <Routes>
          <Route element={<ProtectedRoute allowedRoles={allowedRoles} />}>
            <Route path="/private" element={<div>Private content</div>} />
          </Route>
          <Route path="/login" element={<div>Login page</div>} />
          <Route path="/403" element={<div>Forbidden page</div>} />
        </Routes>
      </MemoryRouter>
    </Provider>,
  )
}

describe('ProtectedRoute', () => {
  it('redirects unauthenticated users to login', () => {
    renderProtected({ isAuthenticated: false, token: null, user: null })
    expect(screen.getByText('Login page')).toBeInTheDocument()
  })

  it('blocks authenticated users without an allowed role', () => {
    renderProtected({ isAuthenticated: true, token: 'token', user: { role: 'customer' } }, ['admin'])
    expect(screen.getByText('Forbidden page')).toBeInTheDocument()
  })
})
