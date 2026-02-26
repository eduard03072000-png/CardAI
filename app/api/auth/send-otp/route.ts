import { NextRequest, NextResponse } from 'next/server'
import { formatEmail } from '@/lib/otp'

const OTP_SERVICE = process.env.OTP_SERVICE_URL || 'http://127.0.0.1:4010'
const OTP_SECRET = process.env.OTP_API_SECRET || 'cardai-otp-secret-2025'

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()
    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Введите корректный email' }, { status: 400 })
    }

    const normalized = formatEmail(email)

    const res = await fetch(`${OTP_SERVICE}/send-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-otp-secret': OTP_SECRET,
      },
      body: JSON.stringify({ email: normalized }),
    })

    const data = await res.json()
    if (!res.ok) {
      return NextResponse.json({ error: data.error || 'Ошибка отправки' }, { status: res.status })
    }

    return NextResponse.json({
      ok: true,
      message: data.message || 'Код отправлен на почту',
      ...(data.devCode && { devCode: data.devCode }),
    })
  } catch (e) {
    console.error('send-otp proxy error:', e)
    return NextResponse.json({ error: 'Сервис отправки недоступен' }, { status: 500 })
  }
}
