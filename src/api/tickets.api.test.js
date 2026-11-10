import { afterEach, describe, expect, it, vi } from 'vitest'
import client from './client'
import { createTicket, deleteTicketAttachment, getTicketAttachment, updateTicket } from './tickets.api'

vi.mock('./client', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}))

describe('ticket API attachment handling', () => {
  afterEach(() => vi.clearAllMocks())

  it('fetches ticket attachments as blobs through the ticket API', async () => {
    const attachment = new Blob(['document'], { type: 'application/pdf' })
    client.get.mockResolvedValue({ data: attachment })

    await expect(getTicketAttachment('ticket-1', 0)).resolves.toBe(attachment)
    expect(client.get).toHaveBeenCalledWith('/tickets/ticket-1/images/0', { responseType: 'blob' })
  })

  it('deletes ticket attachments through the attachment endpoint', async () => {
    client.delete.mockResolvedValue({ data: { message: 'Ticket image deleted successfully', version: 2 } })

    await expect(deleteTicketAttachment('ticket-1', 1)).resolves.toEqual({
      message: 'Ticket image deleted successfully',
      version: 2,
    })
    expect(client.delete).toHaveBeenCalledWith('/tickets/ticket-1/images/1')
  })

  it('posts multipart form data without overriding the browser boundary', async () => {
    const formData = new FormData()
    formData.append('title', 'Login problem')
    formData.append('image', new Blob(['image'], { type: 'image/png' }), 'login.png')
    client.post.mockResolvedValue({ data: { _id: 'ticket-1' } })

    await createTicket(formData)

    expect(client.post).toHaveBeenCalledWith('/tickets', formData)
  })

  it('updates tickets with multipart form data', async () => {
    const formData = new FormData()
    formData.append('version', '2')
    formData.append('image', new Blob(['image'], { type: 'image/png' }), 'updated.png')
    client.put.mockResolvedValue({ data: { _id: 'ticket-1' } })

    await updateTicket('ticket-1', formData)

    expect(client.put).toHaveBeenCalledWith('/tickets/ticket-1', formData)
  })
})
