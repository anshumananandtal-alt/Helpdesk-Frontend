import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Alert, Box, Button, MenuItem, Paper, Stack, TextField, Typography } from '@mui/material'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { createTicket, getClosedTickets } from '../../api/tickets.api'
import { colors } from '../../app/theme'

const pageContentSx = { maxWidth: 920, mx: 'auto', p: '40px clamp(25px, 4vw, 56px)', '@media (max-width: 700px)': { p: '25px 15px' } }
const sectionSubtitleSx = { color: colors.muted, fontSize: 12, mt: '5px' }

const schema = z.object({
  title: z.string().trim().min(5, 'Use at least 5 characters for the title.'),
  description: z.string().trim().min(10, 'Use at least 10 characters for the description.'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  category: z.string().trim().optional(),
  relatedTo: z.string().optional(),
})

export default function CreateTicketPage() {
  const user = useSelector((state) => state.auth.user)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [selectedFiles, setSelectedFiles] = useState([])
  const closedTicketsQuery = useQuery({
    queryKey: ['tickets', 'closed'],
    queryFn: getClosedTickets,
  })
  const closedTickets = Array.isArray(closedTicketsQuery.data)
    ? closedTicketsQuery.data
    : closedTicketsQuery.data?.tickets || []
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema), defaultValues: { priority: 'medium', category: '', relatedTo: '' } })
  const mutation = useMutation({
    mutationFn: createTicket,
    onSuccess: (ticket) => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] })
      navigate(`/tickets/${ticket._id}`, { replace: true })
    },
  })

  const handleSubmitTicket = (values) => {
    const payload = values.relatedTo
      ? values
      : Object.fromEntries(Object.entries(values).filter(([key]) => key !== 'relatedTo'))

    if (!selectedFiles.length) {
      mutation.mutate(payload)
      return
    }

    const formData = new FormData()
    Object.entries(payload).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        formData.append(key, value)
      }
    })
    selectedFiles.forEach((file) => formData.append('image', file))
    mutation.mutate(formData)
  }

  return <Box sx={pageContentSx}>
    <Typography sx={{ font: "700 18px 'Plus Jakarta Sans'", letterSpacing: '-.4px' }}>Create a ticket</Typography>
    <Typography sx={sectionSubtitleSx}>Describe the issue and choose its urgency.</Typography>
    <Paper elevation={0} sx={{ p: '24px', mt: '24px', border: `1px solid ${colors.line}`, borderRadius: '11px', '@media (max-width: 700px)': { p: '18px' } }}>
      <Stack component="form" spacing={2.5} onSubmit={handleSubmit(handleSubmitTicket)} noValidate>
        <TextField label="Title" required fullWidth {...register('title')} error={Boolean(errors.title)} helperText={errors.title?.message} />
        <TextField label="Description" required multiline minRows={5} fullWidth {...register('description')} error={Boolean(errors.description)} helperText={errors.description?.message} />
        <TextField label="Category" fullWidth {...register('category')} error={Boolean(errors.category)} helperText={errors.category?.message} />
        <TextField label="Related To" select fullWidth defaultValue="" {...register('relatedTo')} disabled={closedTicketsQuery.isPending || closedTicketsQuery.isError}>
          <MenuItem value="">None</MenuItem>
          {closedTickets.map((ticket) => {
            const ticketId = ticket._id || ticket.id
            return ticketId && <MenuItem key={ticketId} value={ticketId}>
              {ticket.title || `Ticket #${String(ticketId).slice(-6)}`}
            </MenuItem>
          })}
        </TextField>
        {closedTicketsQuery.isError && <Alert severity="error" role="alert">
          Unable to load closed tickets: {closedTicketsQuery.error.message}
          <Button size="small" onClick={() => closedTicketsQuery.refetch()}>Retry</Button>
        </Alert>}
        <TextField label="Priority" select defaultValue="medium" {...register('priority')} error={Boolean(errors.priority)} helperText={errors.priority?.message}>
          {['low', 'medium', 'high', 'urgent'].map((priority) => <MenuItem key={priority} value={priority}>{priority}</MenuItem>)}
        </TextField>

        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>Attach screenshots or reference files</Typography>
          <Button component="label" variant="outlined">
            Choose files
            <input
              hidden
              type="file"
              accept="image/png,image/jpeg,application/pdf,.pdf,application/msword,.doc,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.docx"
              multiple
              onChange={(event) => setSelectedFiles(Array.from(event.target.files || []))}
            />
          </Button>
          {selectedFiles.length > 0 && (
            <Typography variant="body2" color="text.secondary">
              {selectedFiles.map((file) => file.name).join(', ')}
            </Typography>
          )}
        </Box>

        {mutation.isError && <Alert severity="error" role="alert">{mutation.error.message}</Alert>}
        <Box><Button type="submit" variant="contained" disabled={mutation.isPending || !(user?.id || user?._id)}>{mutation.isPending ? 'Creating…' : 'Create ticket'}</Button></Box>
      </Stack>
    </Paper>
  </Box>
}
