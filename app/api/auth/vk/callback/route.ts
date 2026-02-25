import { NextRequest, NextResponse } from 'next/server'
import { createSession, SESSION_COOKIE_NAME } from '@/lib/session'

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code')
  if (!code) {
    return NextResponse.redirect(new URL('/login?error=vk_denied', req.url))
  }

  try {
    const origin = req.nextUrl.origin
    const redirectUri = `${origin}/api/auth/vk/callback`

    // Обмен code на access_token
    const tokenUrl = new URL('https://oauth.vk.com/access_token')
    tokenUrl.searchParams.set('client_id', process.env.VK_CLIENT_ID!)
    tokenUrl.searchParams.set('client_secret', process.env.VK_CLIENT_SECRET!)
    tokenUrl.searchParams.set('redirect_uri', redirectUri)
    tokenUrl.searchParams.set('code', code)

    const tokenRes = await fetch(tokenUrl.toString())
    const tokenData = await tokenRes.json()

    if (tokenData.error) {
      console.error('VK token error:', tokenData)
      return NextResponse.redirect(new URL('/login?error=vk_token', req.url))
    }
    const { access_token, user_id, email: vkEmail } = tokenData

    // Получаем имя пользователя
    const userRes = await fetch(
      `https://api.vk.com/method/users.get?user_ids=${user_id}&fields=first_name,last_name&access_token=${access_token}&v=5.131`
    )
    const userData = await userRes.json()
    const user = userData.response?.[0]
    const displayName = user
      ? `${user.first_name} ${user.last_name}`
      : `VK User ${user_id}`

    const identity = vkEmail || `vk:${user_id}`
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
    console.error('VK callback error:', e)
    return NextResponse.redirect(new URL('/login?error=vk_failed', req.url))
  }
}