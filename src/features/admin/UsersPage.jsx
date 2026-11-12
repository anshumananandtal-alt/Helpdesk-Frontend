import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Alert,
  Box,
  Button,
  Chip,
  FormControl,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Stack,
  Pagination
} from '@mui/material'
import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { getUsers, updateUser } from '../../api/users.api'
import { EmptyState, ErrorState, LoadingState } from '../../components/common/DataState'
import { colors } from '../../app/theme'

const pageContentSx = { maxWidth: 1440, mx: 'auto', p: '40px clamp(25px, 4vw, 56px)', '@media (max-width: 650px)': { p: '25px 15px' } }
const mutedCellSx = { fontSize: 11, color: '#6f7a8f' }

const pageSize = 10
const sectionSubtitleSx = { color: colors.muted, fontSize: 12, mt: '5px' }

const roles = ['customer', 'agent', 'admin']

export default function UsersPage() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const currentUser = useSelector((state) => state.auth.user)
  const [actionError, setActionError] = useState(null)
  const usersQuery = useQuery({ queryKey: ['admin', 'users', { page, pageSize }], queryFn: () => getUsers(page, pageSize) })
  const users = usersQuery.data?.users ?? []
  const totalPages = usersQuery.data?.totalPages ?? 1
  const updateMutation = useMutation({
    mutationFn: ({ id, changes }) => updateUser(id, changes),
    onSuccess: async () => {
      setActionError(null)
      await queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
    },
    onError: (error) => setActionError(error),
  })

  useEffect(() => {
    if (!usersQuery.isSuccess) return
  }, [usersQuery.isSuccess])

  if (usersQuery.isPending) return <LoadingState label="Loading users…" />
  if (usersQuery.isError) return <ErrorState error={usersQuery.error} onRetry={() => usersQuery.refetch()} />

  const currentUserId = String(currentUser?.id ?? currentUser?._id ?? '')
  const changePage = (_, nextPage) => {
    setPage(nextPage)
  }

  return <Box sx={pageContentSx}>
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mb: '24px', gap: 2, '@media (max-width: 650px)': { alignItems: 'flex-start', flexDirection: 'column' } }}>
      <Box>
        <Typography sx={{ font: "700 18px 'Plus Jakarta Sans'", letterSpacing: '-.4px' }}>User access</Typography>
        <Typography sx={sectionSubtitleSx}>Change account roles and deactivate or reactivate access.</Typography>
      </Box>
      <Typography sx={sectionSubtitleSx}>{usersQuery.data?.total ?? 0} total users</Typography>
    </Box>
    {actionError && <Alert severity="error" sx={{ mb: '16px' }}>{actionError.message || 'Unable to update this user.'}</Alert>}
    {users.length
      ?
      <>
        <TableContainer component={Paper} elevation={0} sx={{ border: `1px solid ${colors.line}`, borderRadius: '11px', overflowX: 'auto', '@media (max-width: 700px)': { overflowX: 'auto' }, '& .MuiTable-root': { '@media (max-width: 700px)': { minWidth: 620 } }, '& .MuiTableCell-head': { bgcolor: '#fbfcfe', color: '#8994a6', fontSize: 11, fontWeight: 700 }, '& .MuiTableCell-body': { borderColor: '#f0f2f6' } }}>
          <Table aria-label="User management" size="medium">
            <TableHead>
              <TableRow>
                <TableCell>User</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Access</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {usersQuery.data?.users.map((user) => {
                const isCurrentUser = String(user._id ?? user.id) === currentUserId
                const isUpdating = updateMutation.isPending &&
                  String(updateMutation.variables?.id) === String(user._id ?? user.id)
                return <TableRow key={user._id ?? user.id} hover>
                  <TableCell>
                    <Typography sx={{ color: '#34425b', fontSize: 13, fontWeight: 700 }}>{user.name}</Typography>
                    <Typography sx={{ color: colors.muted, fontSize: 11 }}>{user.email}</Typography>
                    {isCurrentUser && <Typography sx={{ color: '#168c98', fontSize: 11, mt: '3px' }}>Your account</Typography>}
                  </TableCell>
                  <TableCell>
                    <FormControl size="small" sx={{ minWidth: 125, '& .MuiSelect-select': { fontSize: 12, textTransform: 'capitalize' } }}>
                      <Select
                        value={user.role}
                        aria-label={`Role for ${user.name}`}
                        disabled={isCurrentUser || isUpdating}
                        onChange={(event) => updateMutation.mutate({
                          id: user._id ?? user.id,
                          changes: { role: event.target.value },
                        })}
                      >
                        {roles.map((role) => <MenuItem key={role} value={role}>
                          {role.charAt(0).toUpperCase() + role.slice(1)}
                        </MenuItem>)}
                      </Select>
                    </FormControl>
                  </TableCell>
                  <TableCell>
                    <Chip
                      color={user.isActive ? 'success' : 'default'}
                      label={user.isActive ? 'Active' : 'Inactive'}
                      size="small"
                      sx={{ fontSize: 10, fontWeight: 600 }}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Button
                      color={user.isActive ? 'error' : 'primary'}
                      disabled={isCurrentUser || isUpdating}
                      onClick={() => updateMutation.mutate({
                        id: user._id ?? user.id,
                        changes: { isActive: !user.isActive },
                      })}
                      size="small"
                      variant={user.isActive ? 'outlined' : 'contained'}
                      sx={{ minWidth: 100, textTransform: 'none', fontSize: 11 }}
                    >
                      {isUpdating ? 'Saving…' : user.isActive ? 'Deactivate' : 'Reactivate'}
                    </Button>
                  </TableCell>
                </TableRow>
              })}
            </TableBody>
          </Table>
        </TableContainer>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ p: '14px 22px', borderTop: `1px solid ${colors.line}`, '@media (max-width: 700px)': { flexWrap: 'wrap' }, '@media (max-width: 650px)': { p: '12px 15px' } }}>
          <Typography sx={mutedCellSx}>Page {page} of {totalPages}</Typography>
          <Pagination count={totalPages} page={page} onChange={changePage} />
        </Stack>
      </>
      : <EmptyState>No user accounts are available.</EmptyState>}
  </Box>
}
