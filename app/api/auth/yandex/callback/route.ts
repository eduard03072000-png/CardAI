import { NextRequest, NextResponse } from 'next/server'
import { createSession, SESSION_COOKIE_NAME } from '@/lib/session'
import { getOrigin } from '@/lib/url'

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code')
  const origin = getOrigin(req)

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=yandex_denied`)
  }

  try {
    const redirectUri = `${origin}/api/auth/yandex/callback`

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
      return NextResponse.redirect(`${origin}/login?error=yandex_token`)
    }
    const userRes = await fetch('https://login.yandex.ru/info?format=json', {
      headers: { Authorization: `OAuth ${tokenData.access_token}` },
    })
    const userData = await userRes.json()

    const yaEmail = userData.default_email || `ya:${userData.id}`
    const identity = yaEmail
    const token = createSession(identity)

    const response = NextResponse.redirect(`${origin}/dashboard`)
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
    return NextResponse.redirect(`${origin}/login?error=yandex_failed`)
  }
}