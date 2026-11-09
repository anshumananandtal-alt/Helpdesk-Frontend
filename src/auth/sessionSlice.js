import { createSlice } from '@reduxjs/toolkit'

function readStoredUser() {
  try {
    const user = sessionStorage.getItem('helpdesk_user')
    return user ? JSON.parse(user) : null
  } catch {
    sessionStorage.removeItem('helpdesk_user')
    return null
  }
}

const initialState = {
  token: sessionStorage.getItem('helpdesk_token'),
  user: readStoredUser(),
}

initialState.isAuthenticated = Boolean(initialState.token && initialState.user)

const sessionSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginSuccess: (state, action) => {
      const { token, user } = action.payload
      state.token = token
      state.user = user
      state.isAuthenticated = true
      sessionStorage.setItem('helpdesk_token', token)
      sessionStorage.setItem('helpdesk_user', JSON.stringify(user))
    },
    logout: (state) => {
      state.token = null
      state.user = null
      state.isAuthenticated = false
      sessionStorage.removeItem('helpdesk_token')
      sessionStorage.removeItem('helpdesk_user')
    },
  },
})

export const { loginSuccess, logout } = sessionSlice.actions
export default sessionSlice.reducer
