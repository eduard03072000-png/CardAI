import { NextRequest, NextResponse } from 'next/server'
import { generateOTP, saveOTP, formatEmail } from '@/lib/otp'
import { sendEmailOTP } from '@/lib/email'

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()
    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Введите корректный email' }, { status: 400 })
    }

    const normalized = formatEmail(email)
    const code = generateOTP()
    saveOTP(normalized, code)

    const sent = await sendEmailOTP(normalized, code)
    if (!sent) {
      return NextResponse.json({ error: 'Ошибка отправки письма' }, { status: 500 })
    }

    return NextResponse.json({
      ok: true,
      message: 'Код отправлен на почту',
      ...(process.env.DEV_MODE === 'true' && { devCode: code }),
    })
  } catch {
    return NextResponse.json({ error: 'Внутренняя ошибка' }, { status: 500 })
  }
}