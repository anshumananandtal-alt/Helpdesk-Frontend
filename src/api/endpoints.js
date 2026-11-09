export const authEndpoints = {
  login: '/users/login',
  register: '/users/signup',
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

export const dashboardEndpoint = '/admin/dashboard'
