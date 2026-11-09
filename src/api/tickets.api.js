import client from './client'
import { ticketEndpoints } from './endpoints'

export async function getTickets() {
  const { data } = await client.get(ticketEndpoints.list)
  return data
}

export async function getTicket(id) {
  const { data } = await client.get(ticketEndpoints.detail(id))
  return data
}

export async function createTicket(ticket) {
  const { data } = await client.post(ticketEndpoints.create, ticket)
  return data
}

export async function updateTicket(id, changes) {
  const { data } = await client.put(ticketEndpoints.update(id), changes)
  return data
}

export async function deleteTicket(id) {
  const { data } = await client.delete(ticketEndpoints.remove(id))
  return data
}
