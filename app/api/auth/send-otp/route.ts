import { NextRequest, NextResponse } from 'next/server'
import { generateOTP, saveOTP, formatPhone } from '@/lib/otp'
import { sendSMS } from '@/lib/sms'

export async function POST(req: NextRequest) {
  try {
    const { phone } = await req.json()
    if (!phone) {
      return NextResponse.json({ error: 'Номер телефона обязателен' }, { status: 400 })
    }

    const normalized = formatPhone(phone)
    if (normalized.length < 12) {
      return NextResponse.json({ error: 'Неверный формат номера' }, { status: 400 })
    }

    const code = generateOTP()
    saveOTP(normalized, code)

    const sent = await sendSMS(normalized, code)
    if (!sent) {
      return NextResponse.json({ error: 'Ошибка отправки SMS' }, { status: 500 })
    }

    return NextResponse.json({
      ok: true,
      message: 'Код отправлен',
      // В dev режиме возвращаем код прямо в ответе
      ...(process.env.DEV_MODE === 'true' && { devCode: code }),
    })
  } catch {
    return NextResponse.json({ error: 'Внутренняя ошибка' }, { status: 500 })
  }
}
