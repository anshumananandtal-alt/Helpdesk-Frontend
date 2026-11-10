import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { zodResolver } from '@hookform/resolvers/zod'
import DeleteIcon from '@mui/icons-material/Delete'
import { Alert, Box, Button, Chip, Divider, FormControl, IconButton, InputLabel, MenuItem, Paper, Select, Stack, TextField, Typography } from '@mui/material'
import { useForm } from 'react-hook-form'
import { useSelector } from 'react-redux'
import { useNavigate, useParams } from 'react-router-dom'
import { z } from 'zod'
import { getTicketAudit } from '../../api/audit.api'
import { createComment, getComments } from '../../api/comments.api'
import { deleteTicketAttachment, getTicket, getTicketAttachment, updateTicket } from '../../api/tickets.api'
import { getUsers } from '../../api/users.api'
import { EmptyState, ErrorState, LoadingState } from '../../components/common/DataState'
import { canAssign, canViewInternalNotes, getAllowedNextStatuses, normalizeRole } from '../../lib/permissions'

const commentSchema = z.object({ text: z.string().trim().min(1, 'Write a comment first.') })

function displayStatus(status) {
  return status.replaceAll('_', ' ')
}

function slaLabel(ticket) {
  if (ticket.breached) return 'SLA breached'
  const deadline = ticket.slaDeadline || ticket.slaDueAt
  if (!deadline) return 'SLA deadline unavailable'
  if (ticket.status === 'waiting_on_customer') return 'SLA paused while waiting on you'
  const remaining = new Date(deadline).getTime() - Date.now()
  if (remaining <= 0) return 'SLA deadline passed'
  const hours = Math.floor(remaining / 3600000)
  const minutes = Math.floor((remaining % 3600000) / 60000)
  return `${hours}h ${minutes}m remaining`
}

function referenceId(value) {
  return String(value?._id || value || '')
}

function auditSummary(entry) {
  if (!entry.field) return entry.action
  const oldValue = entry.oldValue?._id || entry.oldValue || '—'
  const newValue = entry.newValue?._id || entry.newValue || '—'
  return `${entry.field} changed from ${oldValue} to ${newValue}`
}

function TicketAttachment({ ticketId, fileName, index, onDelete, deleting }) {
  const [attachmentUrl, setAttachmentUrl] = useState('')
  const [isImage, setIsImage] = useState(false)
  const [error, setError] = useState('')
  const extension = fileName?.match(/\.(pdf|docx?)$/i)?.[0] || ''
  const attachmentName = `Attachment ${index + 1}${extension}`

  useEffect(() => {
    let active = true
    let objectUrl

    getTicketAttachment(ticketId, index)
      .then((attachment) => {
        objectUrl = URL.createObjectURL(attachment)
        if (active) {
          setAttachmentUrl(objectUrl)
          setIsImage(attachment.type.startsWith('image/'))
        }
        else URL.revokeObjectURL(objectUrl)
      })
      .catch((attachmentError) => {
        if (active) setError(attachmentError.message || 'Unable to load this attachment.')
      })

    return () => {
      active = false
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [ticketId, index])

  if (error) return <Alert severity="error">{error}</Alert>
  if (!attachmentUrl) return <Typography color="text.secondary">Loading attachment…</Typography>

  if (!isImage) {
    return <Stack direction="row" spacing={2} alignItems="center">
      <Typography>{attachmentName}</Typography>
      <a href={attachmentUrl} target="_blank" rel="noreferrer">Open</a>
      <a href={attachmentUrl} download={attachmentName}>Download</a>
      <IconButton color="error" aria-label={`Delete ${attachmentName}`} title={`Delete ${attachmentName}`} disabled={deleting} onClick={() => onDelete(index)}>
        <DeleteIcon />
      </IconButton>
    </Stack>
  }

  return <Stack direction="row" spacing={2} alignItems="flex-start">
    <a href={attachmentUrl} target="_blank" rel="noreferrer">
      <img
        src={attachmentUrl}
        alt={attachmentName}
        style={{ display: 'block', maxWidth: '100%', maxHeight: 320, objectFit: 'contain' }}
      />
    </a>
    <IconButton color="error" aria-label={`Delete ${attachmentName}`} title={`Delete ${attachmentName}`} disabled={deleting} onClick={() => onDelete(index)}>
      <DeleteIcon />
    </IconButton>
  </Stack>
}

export default function TicketDetailPage() {
  const { id } = useParams()
  const user = useSelector((state) => state.auth.user)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [commentType, setCommentType] = useState('public')
  const [ticketFiles, setTicketFiles] = useState([])
  const ticketQuery = useQuery({ queryKey: ['ticket', id], queryFn: () => getTicket(id) })
  const ticket = ticketQuery.data
  const isCustomer = normalizeRole(user?.role) === 'customer'
  const isAdmin = normalizeRole(user?.role) === 'admin'
  const isStaff = canViewInternalNotes(user)
  const isOwner = ticket && referenceId(ticket.creator) === referenceId(user?.id || user?._id)
  const usersQuery = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: getUsers,
    enabled: isAdmin,
  })
  const commentsQuery = useQuery({
    queryKey: ['comments', id],
    queryFn: () => getComments(id),
    enabled: ticketQuery.isSuccess && (!isCustomer || isOwner),
  })
  const auditQuery = useQuery({
    queryKey: ['ticket-audit', id],
    queryFn: () => getTicketAudit(id),
    enabled: ticketQuery.isSuccess && isStaff,
  })
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ resolver: zodResolver(commentSchema) })
  const commentMutation = useMutation({
    mutationFn: (values) => createComment(id, { ...values, isInternal: commentType === 'internal' }),
    onSuccess: () => {
      reset()
      queryClient.invalidateQueries({ queryKey: ['comments', id] })
    },
  })
  const invalidateTicket = () => {
    queryClient.invalidateQueries({ queryKey: ['ticket', id] })
    queryClient.invalidateQueries({ queryKey: ['tickets'] })
  }
  const ticketMutation = useMutation({
    mutationFn: (changes) => updateTicket(id, { ...changes, version: ticketQuery.data.version }),
    onSuccess: (updated) => {
      queryClient.setQueryData(['ticket', id], updated)
      invalidateTicket()
    },
    onError: (error) => {
      if (error.status === 409) invalidateTicket()
    },
  })
  const fileUploadMutation = useMutation({
    mutationFn: (files) => {
      const formData = new FormData()
      files.forEach((file) => formData.append('image', file))
      formData.append('version', String(ticketQuery.data.version))
      return updateTicket(id, formData)
    },
    onSuccess: (updated) => {
      setTicketFiles([])
      queryClient.setQueryData(['ticket', id], updated)
      invalidateTicket()
    },
    onError: (error) => {
      if (error.status === 409) invalidateTicket()
    },
  })
  const attachmentDeleteMutation = useMutation({
    mutationFn: (index) => deleteTicketAttachment(id, index),
    onSuccess: () => {
      invalidateTicket()
    },
    onError: (error) => {
      if (error.status === 409) invalidateTicket()
    },
  })
  const assignMutation = useMutation({
    mutationFn: (assignee) => updateTicket(id, { assignee, version: ticketQuery.data.version }),
    onSuccess: (updated) => {
      queryClient.setQueryData(['ticket', id], updated)
      invalidateTicket()
    },
    onError: (error) => {
      if (error.status === 409) invalidateTicket()
    },
  })

  if (ticketQuery.isPending) return <LoadingState label="Loading ticket…" />
  if (ticketQuery.isError) return <Box className="content-wrap"><ErrorState error={ticketQuery.error} onRetry={() => ticketQuery.refetch()} /></Box>
  if (isCustomer && !isOwner) {
    return <Box className="content-wrap"><ErrorState error={{ message: 'You do not have permission to view this ticket.' }} onRetry={() => navigate('/tickets')} /></Box>
  }

  const allowedStatuses = getAllowedNextStatuses(ticket, user)
  const comments = Array.isArray(commentsQuery.data) ? commentsQuery.data : []
  const publicComments = comments.filter((comment) => !comment.isInternal)
  const internalNotes = isStaff ? comments.filter((comment) => comment.isInternal) : []
  const mutationError = ticketMutation.error || assignMutation.error
  const availableAgents = (usersQuery.data || []).filter((candidate) =>
    candidate.role === 'agent' && candidate.isActive,
  )
  const currentAssigneeId = referenceId(ticket.assignee)
  const currentAssigneeUnavailable = ticket.assignee &&
    !availableAgents.some((candidate) => referenceId(candidate) === currentAssigneeId)

  return <Box className="content-wrap narrow-content">
    <Button onClick={() => navigate('/tickets')}>← Back to tickets</Button>
    <Paper className="form-panel ticket-detail-panel" elevation={0}>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={2}>
        <Box><Typography className="ticket-id">Ticket #{ticket._id.slice(-6)}</Typography><Typography className="section-title">{ticket.title}</Typography></Box>
        <Chip label={displayStatus(ticket.status)} color={ticket.status === 'resolved' || ticket.status === 'closed' ? 'success' : 'primary'} />
      </Stack>
      <Stack direction="row" spacing={1} mt={2} flexWrap="wrap" useFlexGap>
        <Chip label={`Priority: ${ticket.priority}`} />
        <Chip label={slaLabel(ticket)} color={ticket.breached ? 'error' : 'default'} />
      </Stack>
      <Typography className="ticket-description">{ticket.description}</Typography>
      {ticket.fileName?.length > 0 && <Box sx={{ mt: 2 }}>
        <Typography className="panel-title">Attachments</Typography>
        <Stack spacing={2} mt={1}>
          {ticket.fileName.map((fileName, index) => (
            <TicketAttachment
              key={`${fileName}-${index}`}
              ticketId={id}
              fileName={fileName}
              index={index}
              onDelete={(attachmentIndex) => attachmentDeleteMutation.mutate(attachmentIndex)}
              deleting={attachmentDeleteMutation.isPending}
            />
          ))}
        {attachmentDeleteMutation.isError && <Alert severity="error" role="alert">{attachmentDeleteMutation.error.message}</Alert>}
        </Stack>
      </Box>}
      <Box className="detail-meta">
        <Typography><strong>Requester</strong> {ticket.creator?.name || ticket.creator?.email || referenceId(ticket.creator)}</Typography>
        <Typography><strong>Assignee</strong> {ticket.assignee?.name || ticket.assignee?.email || (ticket.assignee ? referenceId(ticket.assignee) : 'Unassigned')}</Typography>
        <Typography><strong>Category</strong> {ticket.category || '—'}</Typography>
        <Typography><strong>Version</strong> {ticket.version}</Typography>
        <Typography><strong>Updated</strong> {ticket.updatedAt ? new Date(ticket.updatedAt).toLocaleString() : '—'}</Typography>
      </Box>

      {allowedStatuses.length > 0 && <Stack direction="row" alignItems="center" spacing={1} mt={2} flexWrap="wrap" useFlexGap>
        <Typography>Change status:</Typography>
        {allowedStatuses.map((status) => <Button key={status} variant="outlined" disabled={ticketMutation.isPending} onClick={() => ticketMutation.mutate({ status })}>{displayStatus(status)}</Button>)}
      </Stack>}
      <Stack direction="column" spacing={1} mt={2}>
        <Typography>Attach files to this ticket</Typography>
        <input
          type="file"
          accept="image/png,image/jpeg,application/pdf,.pdf,application/msword,.doc,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.docx"
          multiple
          onChange={(event) => setTicketFiles(Array.from(event.target.files || []))}
        />
        {ticketFiles.length > 0 && <Typography variant="body2" color="text.secondary">{ticketFiles.map((file) => file.name).join(', ')}</Typography>}
        <Button
          variant="outlined"
          disabled={fileUploadMutation.isPending || ticketFiles.length === 0}
          onClick={() => fileUploadMutation.mutate(ticketFiles)}
        >
          {fileUploadMutation.isPending ? 'Uploading…' : 'Upload files'}
        </Button>
        {fileUploadMutation.isError && <Alert severity="error" role="alert">{fileUploadMutation.error.message}</Alert>}
      </Stack>
      {isAdmin && <Stack direction="row" alignItems="center" spacing={1} mt={2}>
        <FormControl size="small" sx={{ minWidth: 240 }}>
          <InputLabel id="ticket-assignee-label">Assign to agent</InputLabel>
          <Select
            labelId="ticket-assignee-label"
            label="Assign to agent"
            value={currentAssigneeId}
            disabled={assignMutation.isPending || usersQuery.isPending || usersQuery.isError}
            onChange={(event) => assignMutation.mutate(event.target.value || null)}
          >
            <MenuItem value="">Unassigned</MenuItem>
            {currentAssigneeUnavailable && <MenuItem value={currentAssigneeId} disabled>
              {ticket.assignee?.name || ticket.assignee?.email || 'Current assignee'} (unavailable)
            </MenuItem>}
            {availableAgents.map((agent) => <MenuItem key={referenceId(agent)} value={referenceId(agent)}>
              {agent.name} ({agent.email})
            </MenuItem>)}
          </Select>
        </FormControl>
        {usersQuery.isError && <Alert severity="error">{usersQuery.error.message || 'Unable to load agents.'}</Alert>}
      </Stack>}
      {!isAdmin && canAssign(user) && referenceId(ticket.assignee) !== referenceId(user?.id || user?._id) && <Button sx={{ mt: 2 }} variant="outlined" disabled={assignMutation.isPending} onClick={() => assignMutation.mutate(user?.id || user?._id)}>Assign to me</Button>}
      {mutationError && <Alert sx={{ mt: 2 }} severity="error" role="alert">{mutationError.status === 409 ? 'This ticket was updated by someone else. The latest version has been refreshed; please retry.' : mutationError.message}</Alert>}

      <Divider sx={{ my: 3 }} />
      <Typography className="panel-title">Conversation</Typography>
      {commentsQuery.isPending && <LoadingState label="Loading comments…" />}
      {commentsQuery.isError && <ErrorState error={commentsQuery.error} onRetry={() => commentsQuery.refetch()} />}
      {commentsQuery.isSuccess && !publicComments.length && <EmptyState>No public comments yet.</EmptyState>}
      {publicComments.map((comment) => <Box className="comment-item" key={comment._id}>
        <Typography fontWeight={700}>{comment.author?.name || comment.author?.email || 'User'}</Typography>
        <Typography>{comment.text}</Typography>
        <Typography className="muted-cell">{comment.createdAt ? new Date(comment.createdAt).toLocaleString() : ''}</Typography>
      </Box>)}
      {commentMutation.isError && <Alert severity="error" role="alert">{commentMutation.error.message}</Alert>}
      <Stack component="form" spacing={1.5} mt={2} onSubmit={handleSubmit((values) => commentMutation.mutate(values))} noValidate>
        {isStaff && <TextField select label="Message type" value={commentType} onChange={(event) => setCommentType(event.target.value)}>
          <MenuItem value="public">Public reply</MenuItem>
          <MenuItem value="internal">Internal note</MenuItem>
        </TextField>}
        <TextField label={commentType === 'internal' ? 'Add an internal note' : 'Add a public comment'} multiline minRows={3} {...register('text')} error={Boolean(errors.text)} helperText={errors.text?.message} />
        <Box><Button type="submit" variant="contained" disabled={commentMutation.isPending || commentsQuery.isError}>{commentMutation.isPending ? 'Posting…' : commentType === 'internal' ? 'Add internal note' : 'Post comment'}</Button></Box>
      </Stack>

      {isStaff && <>
        <Divider sx={{ my: 3 }} />
        <Typography className="panel-title">Internal notes</Typography>
        {commentsQuery.isSuccess && !internalNotes.length && <EmptyState>No internal notes yet.</EmptyState>}
        {internalNotes.map((note) => <Box className="comment-item internal-note" key={note._id}>
          <Typography fontWeight={700}>{note.author?.name || note.author?.email || 'Staff member'} · Internal</Typography>
          <Typography>{note.text}</Typography>
          <Typography className="muted-cell">{note.createdAt ? new Date(note.createdAt).toLocaleString() : ''}</Typography>
        </Box>)}

        <Divider sx={{ my: 3 }} />
        <Typography className="panel-title">Audit history</Typography>
        {auditQuery.isPending && <LoadingState label="Loading audit history…" />}
        {auditQuery.isError && <ErrorState error={auditQuery.error} onRetry={() => auditQuery.refetch()} />}
        {auditQuery.isSuccess && !auditQuery.data.length && <EmptyState>No audit history yet.</EmptyState>}
        {auditQuery.data?.map((entry) => <Box className="audit-item" key={entry._id}>
          <Typography fontWeight={700}>{auditSummary(entry)}</Typography>
          <Typography className="muted-cell">{entry.changedBy?.name || entry.changedBy?.email || 'System'} · {entry.createdAt ? new Date(entry.createdAt).toLocaleString() : ''}</Typography>
        </Box>)}
      </>}
    </Paper>
  </Box>
}
