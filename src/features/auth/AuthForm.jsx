import { zodResolver } from '@hookform/resolvers/zod'
import { Assignment } from '@mui/icons-material'
import { Alert, Box, Button, Paper, Stack, TextField, Typography } from '@mui/material'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useDispatch } from 'react-redux'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { login, register } from '../../api/auth.api'
import { loginSuccess } from '../../auth/sessionSlice'

const loginSchema = z.object({
  email: z.string().email('Enter a valid email address.'),
  password: z.string().min(1, 'Enter your password.'),
})

const registerSchema = z.object({
  name: z.string().trim().min(2, 'Enter your full name.'),
  email: z.string().email('Enter a valid email address.'),
  password: z.string().min(8, 'Use at least 8 characters.'),
})

export default function AuthForm({ mode }) {
  const isRegister = mode === 'register'
  const schema = isRegister ? registerSchema : loginSchema
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const [requestError, setRequestError] = useState('')
  const {
    register: registerField,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema) })

  const submit = async (values) => {
    setRequestError('')
    try {
      const response = isRegister
        ? await register({ ...values, role: 'customer' })
        : await login(values)
      const user = { ...response.user }
      delete user.password
      dispatch(loginSuccess({ token: response.token, user }))
      navigate(location.state?.from?.pathname || '/tickets', { replace: true })
    } catch (error) {
      setRequestError(error.message)
    }
  }

  return <Box className="auth-page">
    <Paper className="auth-card" elevation={0}>
      <Box className="auth-brand"><Box className="brand-mark"><Assignment /></Box><Typography className="brand-name">OrbitDesk</Typography></Box>
      <Typography className="auth-title">{isRegister ? 'Create your account' : 'Welcome back'}</Typography>
      <Typography className="auth-subtitle">{isRegister ? 'Register as a customer to create and follow support requests.' : 'Sign in to your helpdesk workspace.'}</Typography>
      {requestError && <Alert severity="error" role="alert">{requestError}</Alert>}
      <Box component="form" onSubmit={handleSubmit(submit)} className="auth-form" noValidate>
        {isRegister && <TextField label="Full name" autoComplete="name" error={Boolean(errors.name)} helperText={errors.name?.message} {...registerField('name')} fullWidth />}
        <TextField label="Email" type="email" autoComplete="email" error={Boolean(errors.email)} helperText={errors.email?.message} {...registerField('email')} fullWidth />
        <TextField label="Password" type="password" autoComplete={isRegister ? 'new-password' : 'current-password'} error={Boolean(errors.password)} helperText={errors.password?.message} {...registerField('password')} fullWidth />
        <Button type="submit" variant="contained" className="auth-submit" fullWidth disabled={isSubmitting}>{isSubmitting ? 'Please wait…' : isRegister ? 'Create account' : 'Sign in'}</Button>
      </Box>
      <Stack direction="row" justifyContent="center" spacing={0.5} className="auth-switch">
        <Typography>{isRegister ? 'Already have an account?' : 'New to OrbitDesk?'}</Typography>
        <Link to={isRegister ? '/login' : '/register'}>{isRegister ? 'Sign in' : 'Register'}</Link>
      </Stack>
    </Paper>
  </Box>
}
