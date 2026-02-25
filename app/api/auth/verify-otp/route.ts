import { NextRequest, NextResponse } from 'next/server'
import { verifyOTP, formatEmail } from '@/lib/otp'
import { createSession, SESSION_COOKIE_NAME } from '@/lib/session'

export async function POST(req: NextRequest) {
  try {
    const { email, code } = await req.json()
    if (!email || !code) {
      return NextResponse.json({ error: 'Email и код обязательны' }, { status: 400 })
    }

    const normalized = formatEmail(email)
    const result = verifyOTP(normalized, code.trim())

    if (result === 'expired') {
      return NextResponse.json({ error: 'Код устарел. Запросите новый.' }, { status: 400 })
    }
    if (result === 'invalid') {
      return NextResponse.json({ error: 'Неверный код' }, { status: 400 })
    }
    if (result === 'too_many') {
      return NextResponse.json({ error: 'Слишком много попыток. Запросите новый код.' }, { status: 429 })
    }

    const token = createSession(normalized)

    const response = NextResponse.json({ ok: true, email: normalized })
    response.cookies.set(SESSION_COOKIE_NAME(), token, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60,
      path: '/',
    })

    return response
  } catch {
    return NextResponse.json({ error: 'Внутренняя ошибка' }, { status: 500 })
  }
}