export const authEndpoints = {
  login: '/auth/login',
  register: '/auth/register',
}

export const ticketEndpoints = {
  list: '/tickets',
  detail: (id) => `/tickets/${id}`,
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
