export const authEndpoints = {
  login: '/auth/login',
  register: '/auth/register',
}

export const ticketEndpoints = {
  list: '/tickets',
  detail: (id) => `/tickets/${id}`,
  attachment: (id, index) => `/tickets/${id}/images/${index}`,
  closed: '/tickets/closed',
  deleteAttachment: (id, index) => `/tickets/${id}/images/${index}`,
  create: '/tickets',
  update: (id) => `/tickets/${id}`,
  remove: (id) => `/tickets/${id}`,
}

export const commentEndpoints = {
  list: (ticketId) => `/comments/tickets/${ticketId}/comments`,
  create: (ticketId) => `/comments/tickets/${ticketId}/comments`,
}

export const auditEndpoint = (ticketId) => `/tickets/${ticketId}/audit`
export const dashboardEndpoint = '/admin/dashboard'
export const usersEndpoint = '/users'
export const agentsEndpoint = '/users/agents'
export const userEndpoint = (id) => `${usersEndpoint}/${id}`
