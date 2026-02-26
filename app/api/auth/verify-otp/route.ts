import { NextRequest, NextResponse } from 'next/server'
import { formatEmail } from '@/lib/otp'
import { createSession, SESSION_COOKIE_NAME } from '@/lib/session'

const OTP_SERVICE = process.env.OTP_SERVICE_URL || 'http://127.0.0.1:4010'
const OTP_SECRET = process.env.OTP_API_SECRET || 'cardai-otp-secret-2025'

export async function POST(req: NextRequest) {
  try {
    const { email, code } = await req.json()
    if (!email || !code) {
      return NextResponse.json({ error: 'Email и код обязательны' }, { status: 400 })
    }

    const normalized = formatEmail(email)

    const res = await fetch(`${OTP_SERVICE}/verify-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-otp-secret': OTP_SECRET,
      },
      body: JSON.stringify({ email: normalized, code: String(code).trim() }),
    })

    const data = await res.json()
    if (!res.ok) {
      return NextResponse.json({ error: data.error || 'Неверный код' }, { status: res.status })
    }

    // Создаём сессию
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
  } catch (e) {
    console.error('verify-otp proxy error:', e)
    return NextResponse.json({ error: 'Сервис недоступен' }, { status: 500 })
  }
}
