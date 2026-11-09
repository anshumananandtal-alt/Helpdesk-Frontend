import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { zodResolver } from '@hookform/resolvers/zod'
import { Alert, Box, Button, Chip, Divider, Paper, Stack, TextField, Typography } from '@mui/material'
import { useForm } from 'react-hook-form'
import { useSelector } from 'react-redux'
import { useNavigate, useParams } from 'react-router-dom'
import { z } from 'zod'
import { createComment, getComments } from '../../api/comments.api'
import { getTicket, updateTicket } from '../../api/tickets.api'
import { EmptyState, ErrorState, LoadingState } from '../../components/common/DataState'
import { canAssign, getAllowedNextStatuses } from '../../lib/permissions'

const commentSchema = z.object({ text: z.string().trim().min(1, 'Write a comment first.') })

function slaLabel(ticket) {
  if (ticket.breached) return 'SLA breached'
  if (!ticket.slaDueAt) return 'SLA deadline unavailable'
  const remaining = new Date(ticket.slaDueAt).getTime() - Date.now()
  if (remaining <= 0) return 'SLA deadline passed'
  const hours = Math.floor(remaining / 3600000)
  const minutes = Math.floor((remaining % 3600000) / 60000)
  return `${hours}h ${minutes}m remaining`
}

function referenceId(value) {
  return String(value?._id || value || '')
}

export default function TicketDetailPage() {
  const { id } = useParams()
  const user = useSelector((state) => state.auth.user)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const ticketQuery = useQuery({ queryKey: ['ticket', id], queryFn: () => getTicket(id) })
  const ticketData = ticketQuery.data
  const isCustomer = user?.role === 'customer'
  const isOwner = ticketData && referenceId(ticketData.creator) === referenceId(user?.id || user?._id)
  const commentsQuery = useQuery({
    queryKey: ['comments', id],
    queryFn: () => getComments(id),
    enabled: ticketQuery.isSuccess && (!isCustomer || isOwner),
  })
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ resolver: zodResolver(commentSchema) })
  const commentMutation = useMutation({
    mutationFn: (values) => createComment(id, { ...values, author: user?.id || user?._id }),
    onSuccess: () => {
      reset()
      queryClient.invalidateQueries({ queryKey: ['comments', id] })
    },
  })
  const ticketMutation = useMutation({
    mutationFn: (changes) => updateTicket(id, { ...changes, version: ticketQuery.data.version }),
    onSuccess: (updated) => queryClient.setQueryData(['ticket', id], updated),
    onError: (error) => {
      if (error.status === 409) queryClient.invalidateQueries({ queryKey: ['ticket', id] })
    },
  })
  const assignMutation = useMutation({
    mutationFn: () => updateTicket(id, { assignee: user?.id || user?._id, version: ticketQuery.data.version }),
    onSuccess: (updated) => queryClient.setQueryData(['ticket', id], updated),
    onError: (error) => {
      if (error.status === 409) queryClient.invalidateQueries({ queryKey: ['ticket', id] })
    },
  })

  if (ticketQuery.isPending) return <LoadingState label="Loading ticket…" />
  if (ticketQuery.isError) return <Box className="content-wrap"><ErrorState error={ticketQuery.error} onRetry={() => ticketQuery.refetch()} /></Box>

  const ticket = ticketQuery.data
  if (isCustomer && !isOwner) {
    return <Box className="content-wrap"><ErrorState error={{ message: 'You do not have permission to view this ticket.' }} onRetry={() => navigate('/tickets')} /></Box>
  }
  const allowedStatuses = getAllowedNextStatuses(ticket, user)
  const comments = Array.isArray(commentsQuery.data) ? commentsQuery.data : []

  return <Box className="content-wrap narrow-content">
    <Button onClick={() => navigate('/tickets')}>← Back to tickets</Button>
    <Paper className="form-panel ticket-detail-panel" elevation={0}>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={2}>
        <Box><Typography className="ticket-id">Ticket #{ticket._id.slice(-6)}</Typography><Typography className="section-title">{ticket.title}</Typography></Box>
        <Chip label={ticket.status} color={ticket.status === 'resolved' || ticket.status === 'closed' ? 'success' : 'primary'} />
      </Stack>
      <Stack direction="row" spacing={1} mt={2}><Chip label={`Priority: ${ticket.priority}`} /><Chip label={slaLabel(ticket)} color={ticket.breached ? 'error' : 'default'} /></Stack>
      <Typography className="ticket-description">{ticket.description}</Typography>
      <Box className="detail-meta"><Typography><strong>Requester</strong> {ticket.creator?.name || ticket.creator?.email || referenceId(ticket.creator)}</Typography><Typography><strong>Assignee</strong> {ticket.assignee?.name || ticket.assignee?.email || (ticket.assignee ? referenceId(ticket.assignee) : 'Unassigned')}</Typography><Typography><strong>Version</strong> {ticket.version}</Typography><Typography><strong>Updated</strong> {ticket.updatedAt ? new Date(ticket.updatedAt).toLocaleString() : '—'}</Typography></Box>

      {allowedStatuses.length > 0 && <Stack direction="row" alignItems="center" spacing={1} mt={2}><Typography>Change status:</Typography>{allowedStatuses.map((status) => <Button key={status} variant="outlined" disabled={ticketMutation.isPending} onClick={() => ticketMutation.mutate({ status })}>{status}</Button>)}</Stack>}
      {canAssign(user) && referenceId(ticket.assignee) !== referenceId(user?.id || user?._id) && <Button sx={{ mt: 2 }} variant="outlined" disabled={assignMutation.isPending} onClick={() => assignMutation.mutate()}>Assign to me</Button>}
      {(ticketMutation.isError || assignMutation.isError) && <Alert sx={{ mt: 2 }} severity="error" role="alert">{[ticketMutation.error, assignMutation.error].find(Boolean)?.status === 409 ? 'This ticket was updated by someone else. The latest version has been refreshed; please retry.' : [ticketMutation.error, assignMutation.error].find(Boolean)?.message}</Alert>}

      <Divider sx={{ my: 3 }} />
      <Typography className="panel-title">Conversation</Typography>
      {commentsQuery.isPending && <LoadingState label="Loading comments…" />}
      {commentsQuery.isError && <ErrorState error={commentsQuery.error} onRetry={() => commentsQuery.refetch()} />}
      {commentsQuery.isSuccess && !comments.length && <EmptyState>No comments yet.</EmptyState>}
      {comments.map((comment) => <Box className="comment-item" key={comment._id}><Typography fontWeight={700}>{comment.author?.name || comment.author?.email || 'User'}</Typography><Typography>{comment.text}</Typography><Typography className="muted-cell">{comment.createdAt ? new Date(comment.createdAt).toLocaleString() : ''}</Typography></Box>)}
      {commentMutation.isError && <Alert severity="error" role="alert">{commentMutation.error.message}</Alert>}
      <Stack component="form" spacing={1.5} mt={2} onSubmit={handleSubmit((values) => commentMutation.mutate(values))} noValidate>
        <TextField label="Add a comment" multiline minRows={3} {...register('text')} error={Boolean(errors.text)} helperText={errors.text?.message} />
        <Box><Button type="submit" variant="contained" disabled={commentMutation.isPending}>{commentMutation.isPending ? 'Posting…' : 'Post comment'}</Button></Box>
      </Stack>
      <Alert sx={{ mt: 3 }} severity="info">The current backend does not expose internal-note or audit-history endpoints. This page only displays comments returned by the public comments API.</Alert>
    </Paper>
  </Box>
}
