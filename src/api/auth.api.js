import client from './client'
import { authEndpoints } from './endpoints'

export async function login(credentials) {
  const { data } = await client.post(authEndpoints.login, credentials)
  return data
}

export async function register(userDetails) {
  const { data } = await client.post(authEndpoints.register, userDetails)
  return data
}
