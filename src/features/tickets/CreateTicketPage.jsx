import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Alert, Box, Button, MenuItem, Paper, Stack, TextField, Typography } from '@mui/material'
import { useForm } from 'react-hook-form'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { createTicket } from '../../api/tickets.api'

const schema = z.object({
  title: z.string().trim().min(5, 'Use at least 5 characters for the title.'),
  description: z.string().trim().min(10, 'Use at least 10 characters for the description.'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  category: z.string().trim().optional(),
})

export default function CreateTicketPage() {
  const user = useSelector((state) => state.auth.user)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema), defaultValues: { priority: 'medium', category: '' } })
  const mutation = useMutation({
    mutationFn: createTicket,
    onSuccess: (ticket) => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] })
      navigate(`/tickets/${ticket._id}`, { replace: true })
    },
  })

  return <Box className="content-wrap narrow-content">
    <Typography className="section-title">Create a ticket</Typography>
    <Typography className="section-subtitle">Describe the issue and choose its urgency.</Typography>
    <Paper className="form-panel" elevation={0}>
      <Stack component="form" spacing={2.5} onSubmit={handleSubmit((values) => mutation.mutate(values))} noValidate>
        <TextField label="Title" required fullWidth {...register('title')} error={Boolean(errors.title)} helperText={errors.title?.message} />
        <TextField label="Description" required multiline minRows={5} fullWidth {...register('description')} error={Boolean(errors.description)} helperText={errors.description?.message} />
        <TextField label="Category" fullWidth {...register('category')} error={Boolean(errors.category)} helperText={errors.category?.message} />
        <TextField label="Priority" select defaultValue="medium" {...register('priority')} error={Boolean(errors.priority)} helperText={errors.priority?.message}>
          {['low', 'medium', 'high', 'urgent'].map((priority) => <MenuItem key={priority} value={priority}>{priority}</MenuItem>)}
        </TextField>
          {mutation.isError && <Alert severity="error" role="alert">{mutation.error.message}</Alert>}
        <Box><Button type="submit" variant="contained" disabled={mutation.isPending || !(user?.id || user?._id)}>{mutation.isPending ? 'Creating…' : 'Create ticket'}</Button></Box>
      </Stack>
    </Paper>
  </Box>
}
