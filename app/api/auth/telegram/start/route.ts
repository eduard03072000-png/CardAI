import { NextRequest, NextResponse } from 'next/server'
import { readTelegramLogins, writeTelegramLogins } from '@/lib/store'

function generateToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < 64; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export async function POST(_req: NextRequest) {
  try {
    const botUsername = process.env.TELEGRAM_BOT_USERNAME
    if (!botUsername) {
      return NextResponse.json(
        { error: 'TELEGRAM_BOT_USERNAME не настроен на сервере' },
        { status: 500 },
      )
    }

    const token = generateToken()
    const logins = readTelegramLogins()

    logins[token] = {
      status: 'pending',
      createdAt: Date.now(),
    }
    writeTelegramLogins(logins)

    const botUrl = `https://t.me/${botUsername}?start=${token}`

    return NextResponse.json({
      ok: true,
      token,
      botUrl,
      expiresIn: 10 * 60, // сек
    })
  } catch {
    return NextResponse.json({ error: 'Внутренняя ошибка' }, { status: 500 })
  }
}

