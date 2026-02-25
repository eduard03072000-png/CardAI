import { NextRequest, NextResponse } from 'next/server'
import { deleteSupportTicket, setSupportTicketStatus } from '@/lib/support'

export async function POST(req: NextRequest) {
  const form = await req.formData()
  const action = String(form.get('action') || '').trim()
  const ticketId = String(form.get('ticketId') || '').trim()
  const adminKeyProvided = String(form.get('key') || '').trim()
  const adminKey = process.env.ADMIN_KEY

  if (adminKey && adminKeyProvided !== adminKey) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (!ticketId) {
    return NextResponse.json({ error: 'ticketId обязателен' }, { status: 400 })
  }

  let ok = false
  if (action === 'done') ok = setSupportTicketStatus(ticketId, 'done')
  if (action === 'new') ok = setSupportTicketStatus(ticketId, 'new')
  if (action === 'delete') ok = deleteSupportTicket(ticketId)
  if (!ok) return NextResponse.json({ error: 'Обращение не найдено' }, { status: 404 })

  const redirectTo = new URL('/admin/users', req.url)
  if (adminKey) redirectTo.searchParams.set('key', adminKeyProvided)
  redirectTo.searchParams.set('ticketUpdated', '1')
  return NextResponse.redirect(redirectTo, 303)
}
