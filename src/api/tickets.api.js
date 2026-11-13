import client from './client'
import { ticketEndpoints } from './endpoints'

function isFileLike(value) {
  return value instanceof File || value instanceof Blob || value instanceof FileList
}

function hasFiles(value) {
  if (value instanceof FormData) return true
  if (isFileLike(value)) return true
  if (Array.isArray(value)) return value.some((entry) => hasFiles(entry))
  if (value && typeof value === 'object') {
    return Object.values(value).some((entry) => hasFiles(entry))
  }
  return false
}

function toMultipartFormData(payload) {
  if (payload instanceof FormData) return payload

  const formData = new FormData()
  Object.entries(payload || {}).forEach(([key, value]) => {
    if (value === undefined || value === null) return

    if (Array.isArray(value)) {
      if (value.some((entry) => isFileLike(entry) || (entry && typeof entry === 'object' && 'name' in entry && 'size' in entry && 'type' in entry))) {
        value.forEach((entry) => {
          if (entry && typeof entry === 'object' && 'name' in entry && 'size' in entry && 'type' in entry) {
            formData.append('image', entry)
          } else if (entry !== undefined && entry !== null) {
            formData.append(key, String(entry))
          }
        })
        return
      }

      value.forEach((entry) => {
        if (entry !== undefined && entry !== null) {
          formData.append(key, String(entry))
        }
      })
      return
    }

    if (isFileLike(value)) {
      if (value instanceof FileList) {
        Array.from(value).forEach((file) => formData.append('image', file))
        return
      }
      formData.append('image', value)
      return
    }

    if (typeof value === 'object') {
      formData.append(key, JSON.stringify(value))
      return
    }

    formData.append(key, String(value))
  })

  return formData
}

export async function getTickets(params) {
  const { data } = await client.get(ticketEndpoints.list, { params })
  return data
}

export async function getTicket(id) {
  const { data } = await client.get(ticketEndpoints.detail(id))
  return data
}

export async function getTicketAttachment(id, index) {
  const { data } = await client.get(ticketEndpoints.attachment(id, index), { responseType: 'blob' })
  return data
}

export async function deleteTicketAttachment(id, index) {
  const { data } = await client.delete(ticketEndpoints.deleteAttachment(id, index))
  return data
}

export async function createTicket(ticket) {
  const payload = hasFiles(ticket) ? toMultipartFormData(ticket) : ticket
  const { data } = await client.post(ticketEndpoints.create, payload)
  return data
}

export async function updateTicket(id, changes) {
  const payload = hasFiles(changes) ? toMultipartFormData(changes) : changes
  const { data } = await client.put(ticketEndpoints.update(id), payload)
  return data
}

export async function deleteTicket(id) {
  const { data } = await client.delete(ticketEndpoints.remove(id))
  return data
}

export async function getClosedTickets(){
  const { data } = await client.get(ticketEndpoints.closed)
  return data
}
