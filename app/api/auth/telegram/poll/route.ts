import { NextRequest, NextResponse } from 'next/server'
import { readTelegramLogins, writeTelegramLogins } from '@/lib/store'
import { createSession, SESSION_COOKIE_NAME } from '@/lib/session'

export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get('token') ?? ''
    if (!token) {
      return NextResponse.json({ error: 'token обязателен' }, { status: 400 })
    }

    const logins = readTelegramLogins()
    const entry = logins[token]

    if (!entry) {
      return NextResponse.json({ ok: false, status: 'not_found' })
    }

    // 10 минут жизни токена
    if (Date.now() - entry.createdAt > 10 * 60 * 1000) {
      delete logins[token]
      writeTelegramLogins(logins)
      return NextResponse.json({ ok: false, status: 'expired' })
    }

    if (entry.status !== 'done' || !entry.telegramId) {
      return NextResponse.json({ ok: false, status: 'pending' })
    }

    const identity = `tg:${entry.telegramId}`
    const fullName = [entry.firstName, entry.lastName].filter(Boolean).join(' ').trim()
    const display = entry.username ? `@${entry.username}` : fullName || identity
    const sessionToken = createSession(identity, {
      display,
      method: 'telegram',
      meta: {
        telegramId: entry.telegramId,
        username: entry.username,
        firstName: entry.firstName,
        lastName: entry.lastName,
        email: entry.email,
      },
    })

    // Можно очистить одноразовый токен после удачного логина
    delete logins[token]
    writeTelegramLogins(logins)

    const response = NextResponse.json({ ok: true })
    response.cookies.set(SESSION_COOKIE_NAME(), sessionToken, {
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

