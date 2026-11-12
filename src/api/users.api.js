import client from './client'
import { userEndpoint, usersEndpoint, agentsEndpoint } from './endpoints'

export async function getUsers(page = 1, limit = 10) {
  const { data } = await client.get(`${usersEndpoint}?page=${page}&limit=${limit}`)
  return data
}

export async function getAgents() {
  const { data } = await client.get(agentsEndpoint)
  return data
}

export async function updateUser(id, changes) {
  const { data } = await client.patch(userEndpoint(id), changes)
  return data
}
