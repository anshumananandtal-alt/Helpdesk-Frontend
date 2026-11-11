import { zodResolver } from '@hookform/resolvers/zod'
import { Assignment } from '@mui/icons-material'
import { Alert, Box, Button, Link, Paper, Stack, TextField, Typography } from '@mui/material'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useDispatch } from 'react-redux'
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom'
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
  confirmPassword: z.string().min(1, 'Confirm your password.'),
  }).refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match.',
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

  return <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', p: '24px', background: 'radial-gradient(circle at 15% 15%, #e8f7f8 0, transparent 34%), #f7f9fc' }}>
    <Paper elevation={0} sx={{ width: 'min(100%, 430px)', p: '38px', border: '1px solid #e8ecf3', borderRadius: '16px', '@media (max-width: 480px)': { p: '24px' } }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: '10px', mb: '30px' }}>
        <Box sx={{ width: 34, height: 34, borderRadius: '10px', display: 'grid', placeItems: 'center', color: '#fff', background: 'linear-gradient(140deg, #1a7ec5, #18b5aa)', '& svg': { fontSize: 19 } }}><Assignment /></Box>
        <Typography sx={{ font: "800 17px 'Plus Jakarta Sans'", letterSpacing: '-.5px' }}>OrbitDesk</Typography>
      </Box>
      <Typography sx={{ font: "700 25px 'Plus Jakarta Sans'", letterSpacing: '-.7px' }}>{isRegister ? 'Create your account' : 'Welcome back'}</Typography>
      <Typography sx={{ color: 'text.secondary', fontSize: 13, mt: '7px', mb: 2 }}>{isRegister ? 'Register as a customer to create and follow support requests.' : 'Sign in to your helpdesk workspace.'}</Typography>
      {requestError && <Alert severity="error" role="alert" sx={{ mt: '22px', fontSize: 12 }}>{requestError}</Alert>}
      <Box component="form" onSubmit={handleSubmit(submit)} sx={{ display: 'grid', gap: '16px', mt: '20px', '& .MuiInputLabel-root, & .MuiInputBase-input': { fontSize: 13 } }} noValidate>
        {isRegister && <TextField label="Full name" autoComplete="name" error={Boolean(errors.name)} helperText={errors.name?.message} {...registerField('name')} fullWidth />}
        <TextField label="Email" type="email" autoComplete="email" error={Boolean(errors.email)} helperText={errors.email?.message} {...registerField('email')} fullWidth />
        <TextField label="Password" type="password" autoComplete={isRegister ? 'new-password' : 'current-password'} error={Boolean(errors.password)} helperText={errors.password?.message} {...registerField('password')} fullWidth />
        {
          isRegister && <TextField label="Confirm password" type="password" autoComplete="new-password" error={Boolean(errors.confirmPassword)} helperText={errors.confirmPassword?.message} {...registerField('confirmPassword')} fullWidth />
        }
        <Button type="submit" variant="contained" fullWidth disabled={isSubmitting} sx={{ bgcolor: '#172b4d', textTransform: 'none', py: '11px', fontWeight: 700 }}>{isSubmitting ? 'Please wait…' : isRegister ? 'Create account' : 'Sign in'}</Button>
      </Box>
      <Stack direction="row" justifyContent="center" spacing={0.5} sx={{ mt: '25px', '& .MuiTypography-root': { fontSize: 12, color: 'text.secondary' } }}>
        <Typography>{isRegister ? 'Already have an account?' : 'New to OrbitDesk?'}</Typography>
        <Link component={RouterLink} to={isRegister ? '/login' : '/register'} sx={{ fontSize: 12, color: '#168c98', fontWeight: 700, textDecoration: 'none' }}>{isRegister ? 'Sign in' : 'Register'}</Link>
      </Stack>
    </Paper>
  </Box>
}
