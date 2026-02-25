import { NextRequest, NextResponse } from 'next/server'
import { getCurrentSession } from '@/lib/session'
import { createSupportTicket } from '@/lib/support'

export async function POST(req: NextRequest) {
  const session = await getCurrentSession()
  if (!session) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })

  try {
    const { subject, message } = await req.json()
    const ticket = createSupportTicket({
      userId: session.email,
      email: session.email,
      subject: String(subject || ''),
      message: String(message || ''),
    })
    return NextResponse.json({ ok: true, ticketId: ticket.id })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Не удалось отправить обращение'
    return NextResponse.json({ error: msg }, { status: 400 })
  }
}
