import client from './client'
import { auditEndpoint } from './endpoints'

export async function getTicketAudit(ticketId) {
  const { data } = await client.get(auditEndpoint(ticketId))
  return data
}
