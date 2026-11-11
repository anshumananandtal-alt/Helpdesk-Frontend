import { describe, expect, it } from 'vitest'
import { getAllowedNextStatuses, normalizeRole } from './permissions'

describe('ticket status permissions', () => {
  it('uses the backend support role as the frontend agent role', () => {
    expect(normalizeRole('support')).toBe('agent')
  })

  it('allows staff to move open tickets to in progress', () => {
    expect(getAllowedNextStatuses({ status: 'open' }, { role: 'support' })).toEqual(['in_progress'])
    expect(getAllowedNextStatuses({ status: 'open' }, { role: 'admin' })).toEqual(['in_progress'])
  })

  it('offers the backend transitions allowed for support staff', () => {
    expect(getAllowedNextStatuses({ status: 'in_progress' }, { role: 'agent' })).toEqual(['waiting_on_customer', 'resolved'])
    expect(getAllowedNextStatuses({ status: 'waiting_on_customer' }, { role: 'admin' })).toEqual(['in_progress', 'resolved'])
    expect(getAllowedNextStatuses({ status: 'reopened' }, { role: 'agent' })).toEqual(['in_progress'])
  })

  it('allows only the ticket owner or an admin to close or reopen a resolved ticket', () => {
    const ticket = { status: 'resolved', creator: 'customer-1' }
    expect(getAllowedNextStatuses(ticket, { role: 'customer', id: 'customer-1' })).toEqual(['closed', 'reopened'])
    expect(getAllowedNextStatuses(ticket, { role: 'customer', id: 'customer-2' })).toEqual([])
    expect(getAllowedNextStatuses(ticket, { role: 'admin', id: 'admin-1' })).toEqual(['closed', 'reopened'])
    expect(getAllowedNextStatuses(ticket, { role: 'agent', id: 'agent-1' })).toEqual([])
  })

  it('lets only the ticket owner resume a waiting ticket', () => {
    const ticket = { status: 'waiting_on_customer', creator: 'customer-1' }
    expect(getAllowedNextStatuses(ticket, { role: 'customer', id: 'customer-1' })).toEqual(['in_progress'])
    expect(getAllowedNextStatuses(ticket, { role: 'customer', id: 'customer-2' })).toEqual([])
  })

  it('offers no status changes for a closed ticket', () => {
    expect(getAllowedNextStatuses({ status: 'closed' }, { role: 'admin' })).toEqual([])
  })
})
