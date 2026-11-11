export const STATUS_TRANSITIONS = {
  open: ['in_progress'],
  in_progress: ['waiting_on_customer', 'resolved'],
  waiting_on_customer: ['in_progress', 'resolved'],
  resolved: ['closed', 'reopened'],
  reopened: ['in_progress'],
  closed: [],
}

export function normalizeRole(role) {
  return role === 'support' ? 'agent' : role
}

export function canViewInternalNotes(user) {
  const role = normalizeRole(user?.role)
  return role === 'agent' || role === 'admin'
}

export function canAssign(user) {
  const role = normalizeRole(user?.role)
  return role === 'agent' || role === 'admin'
}

export function canResolve(user) {
  const role = normalizeRole(user?.role)
  return role === 'agent' || role === 'admin'
}

export function canCloseOrReopen(ticket, user) {
  return ticket?.status === 'resolved' &&
    (normalizeRole(user?.role) === 'admin' ||
      String(ticket.creator?._id || ticket.creator) === String(user?.id || user?._id))
}

export function canViewDashboard(user) {
  return normalizeRole(user?.role) === 'admin'
}

export function getAllowedNextStatuses(ticket, user) {
  const nextStatuses = STATUS_TRANSITIONS[ticket?.status] || []
  const role = normalizeRole(user?.role)

  if (role === 'customer') {
    const creatorId = String(ticket?.creator?._id || ticket?.creator || '')
    const userId = String(user?.id || user?._id || '')
    if (!userId || creatorId !== userId) return []
    if (ticket.status === 'waiting_on_customer') {
      return nextStatuses.filter((status) => status === 'in_progress')
    }
    return nextStatuses.filter((status) => status === 'closed' || status === 'reopened')
  }

  return nextStatuses.filter((status) => {
    if (status === 'closed' || status === 'reopened') {
      return canCloseOrReopen(ticket, user)
    }
    return role === 'agent' || role === 'admin'
  })
}
