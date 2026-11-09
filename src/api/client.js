import axios from 'axios'

const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api',
  timeout: 15000,
})

client.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('helpdesk_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

client.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status
    const responseData = error.response?.data
    const normalized = {
      status,
      message: responseData?.message || error.message || 'The request failed.',
      code: responseData?.code,
      details: responseData?.details,
    }

    if (status === 401) {
      sessionStorage.removeItem('helpdesk_token')
      sessionStorage.removeItem('helpdesk_user')
      window.dispatchEvent(new Event('helpdesk:unauthorized'))
    }

    return Promise.reject(normalized)
  },
)

export default client
