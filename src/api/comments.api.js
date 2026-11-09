import client from './client'
import { commentEndpoints } from './endpoints'

export async function getComments(ticketId) {
  const { data } = await client.get(commentEndpoints.list(ticketId))
  return data
}

export async function createComment(ticketId, comment) {
  const { data } = await client.post(commentEndpoints.create(ticketId), comment)
  return data
}
