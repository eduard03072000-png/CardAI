import { NextRequest, NextResponse } from 'next/server'
import { createSession, SESSION_COOKIE_NAME } from '@/lib/session'

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code')
  if (!code) {
    return NextResponse.redirect(new URL('/login?error=yandex_denied', req.url))
  }

  try {
    // Обмен code на access_token
    const tokenRes = await fetch('https://oauth.yandex.ru/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        client_id: process.env.YANDEX_CLIENT_ID!,
        client_secret: process.env.YANDEX_CLIENT_SECRET!,
      }),
    })
    const tokenData = await tokenRes.json()

    if (tokenData.error) {
      console.error('Yandex token error:', tokenData)
      return NextResponse.redirect(new URL('/login?error=yandex_token', req.url))
    }
    // Получаем информацию о пользователе
    const userRes = await fetch('https://login.yandex.ru/info?format=json', {
      headers: { Authorization: `OAuth ${tokenData.access_token}` },
    })
    const userData = await userRes.json()

    const yaEmail = userData.default_email || `ya:${userData.id}`
    const identity = yaEmail
    const token = createSession(identity)

    const response = NextResponse.redirect(new URL('/dashboard', req.url))
    response.cookies.set(SESSION_COOKIE_NAME(), token, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60,
      path: '/',
    })

    return response
  } catch (e) {
    console.error('Yandex callback error:', e)
    return NextResponse.redirect(new URL('/login?error=yandex_failed', req.url))
  }
}