import client from './client'
import { dashboardEndpoint } from './endpoints'

export async function getDashboard() {
  const { data } = await client.get(dashboardEndpoint)
  return data
}
