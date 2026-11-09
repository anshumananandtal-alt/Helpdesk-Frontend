import client from './client'
import { userEndpoint, usersEndpoint } from './endpoints'

export async function getUsers() {
  const { data } = await client.get(usersEndpoint)
  return data
}

export async function updateUser(id, changes) {
  const { data } = await client.patch(userEndpoint(id), changes)
  return data
}
