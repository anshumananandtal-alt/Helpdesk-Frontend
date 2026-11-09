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
} from '@mui/material'
import { useState } from 'react'
import { useSelector } from 'react-redux'
import { getUsers, updateUser } from '../../api/users.api'
import { EmptyState, ErrorState, LoadingState } from '../../components/common/DataState'

const roles = ['customer', 'agent', 'admin']

export default function UsersPage() {
  const queryClient = useQueryClient()
  const currentUser = useSelector((state) => state.auth.user)
  const [actionError, setActionError] = useState(null)
  const usersQuery = useQuery({ queryKey: ['admin', 'users'], queryFn: getUsers })
  const updateMutation = useMutation({
    mutationFn: ({ id, changes }) => updateUser(id, changes),
    onSuccess: async () => {
      setActionError(null)
      await queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
    },
    onError: (error) => setActionError(error),
  })

  if (usersQuery.isPending) return <LoadingState label="Loading users…" />
  if (usersQuery.isError) return <ErrorState error={usersQuery.error} onRetry={() => usersQuery.refetch()} />

  const users = usersQuery.data
  const currentUserId = String(currentUser?.id ?? currentUser?._id ?? '')

  return <Box className="content-wrap">
    <Box className="welcome-row">
      <Box>
        <Typography className="section-title">User access</Typography>
        <Typography className="section-subtitle">Change account roles and deactivate or reactivate access.</Typography>
      </Box>
      <Typography className="section-subtitle">{users.length} total users</Typography>
    </Box>
    {actionError && <Alert severity="error" className="user-action-error">{actionError.message || 'Unable to update this user.'}</Alert>}
    {users.length
      ? <TableContainer component={Paper} className="user-table-panel" elevation={0}>
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
            {users.map((user) => {
              const isCurrentUser = String(user._id ?? user.id) === currentUserId
              const isUpdating = updateMutation.isPending &&
                String(updateMutation.variables?.id) === String(user._id ?? user.id)
              return <TableRow key={user._id ?? user.id} hover>
                <TableCell>
                  <Typography className="user-name">{user.name}</Typography>
                  <Typography className="user-email">{user.email}</Typography>
                  {isCurrentUser && <Typography className="user-you-label">Your account</Typography>}
                </TableCell>
                <TableCell>
                  <FormControl size="small" className="user-role-select">
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
                    className="user-status-chip"
                    color={user.isActive ? 'success' : 'default'}
                    label={user.isActive ? 'Active' : 'Inactive'}
                    size="small"
                  />
                </TableCell>
                <TableCell align="right">
                  <Button
                    className="user-access-button"
                    color={user.isActive ? 'error' : 'primary'}
                    disabled={isCurrentUser || isUpdating}
                    onClick={() => updateMutation.mutate({
                      id: user._id ?? user.id,
                      changes: { isActive: !user.isActive },
                    })}
                    size="small"
                    variant={user.isActive ? 'outlined' : 'contained'}
                  >
                    {isUpdating ? 'Saving…' : user.isActive ? 'Deactivate' : 'Reactivate'}
                  </Button>
                </TableCell>
              </TableRow>
            })}
          </TableBody>
        </Table>
      </TableContainer>
      : <EmptyState>No user accounts are available.</EmptyState>}
  </Box>
}
