import { NextRequest, NextResponse } from 'next/server'
import { readTelegramLogins, writeTelegramLogins } from '@/lib/store'

export async function POST(req: NextRequest) {
  try {
    const secret = process.env.TELEGRAM_BOT_SECRET
    if (!secret) {
      return NextResponse.json(
        { error: 'TELEGRAM_BOT_SECRET не настроен на сервере' },
        { status: 500 },
      )
    }

    const authHeader = req.headers.get('x-telegram-bot-secret') ?? ''
    if (authHeader !== secret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { token, telegramId, username, phone } = await req.json()

    if (!token || !telegramId) {
      return NextResponse.json({ error: 'token и telegramId обязательны' }, { status: 400 })
    }

    const logins = readTelegramLogins()
    const entry = logins[token]

    if (!entry) {
      return NextResponse.json({ error: 'Токен не найден' }, { status: 400 })
    }

    // 10 минут жизни токена
    if (Date.now() - entry.createdAt > 10 * 60 * 1000) {
      delete logins[token]
      writeTelegramLogins(logins)
      return NextResponse.json({ error: 'Токен устарел' }, { status: 400 })
    }

    logins[token] = {
      ...entry,
      status: 'done',
      telegramId: Number(telegramId),
      username: typeof username === 'string' ? username : undefined,
      email: typeof phone === 'string' ? phone : undefined,
    }

    writeTelegramLogins(logins)

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Внутренняя ошибка' }, { status: 500 })
  }
}

