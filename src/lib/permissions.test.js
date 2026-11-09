import { describe, expect, it } from 'vitest'
import { getAllowedNextStatuses, normalizeRole } from './permissions'

describe('ticket status permissions', () => {
  it('uses the backend support role as the frontend agent role', () => {
    expect(normalizeRole('support')).toBe('agent')
  })

  it('allows staff to move open tickets to in progress', () => {
    expect(getAllowedNextStatuses({ status: 'open' }, { role: 'support' })).toEqual(['in progress'])
    expect(getAllowedNextStatuses({ status: 'open' }, { role: 'admin' })).toEqual(['in progress'])
  })

  it('allows staff to resolve tickets in progress', () => {
    expect(getAllowedNextStatuses({ status: 'in progress' }, { role: 'agent' })).toEqual(['resolved'])
  })

  it('allows only the ticket owner or an admin to close a resolved ticket', () => {
    const ticket = { status: 'resolved', creator: 'customer-1' }
    expect(getAllowedNextStatuses(ticket, { role: 'customer', id: 'customer-1' })).toEqual(['closed'])
    expect(getAllowedNextStatuses(ticket, { role: 'customer', id: 'customer-2' })).toEqual([])
    expect(getAllowedNextStatuses(ticket, { role: 'admin', id: 'admin-1' })).toEqual(['closed'])
  })

  it('offers no status changes for a closed ticket', () => {
    expect(getAllowedNextStatuses({ status: 'closed' }, { role: 'admin' })).toEqual([])
  })
})
