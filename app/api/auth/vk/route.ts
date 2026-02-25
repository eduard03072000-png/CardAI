import { NextRequest, NextResponse } from 'next/server'

// VK OAuth: перенаправление на страницу авторизации VK
export async function GET(req: NextRequest) {
  const clientId = process.env.VK_CLIENT_ID
  if (!clientId) {
    return NextResponse.json({ error: 'VK OAuth не настроен' }, { status: 500 })
  }

  const origin = process.env.APP_URL || req.nextUrl.origin
  const redirectUri = `${origin}/api/auth/vk/callback`

  const vkAuthUrl = new URL('https://oauth.vk.com/authorize')
  vkAuthUrl.searchParams.set('client_id', clientId)
  vkAuthUrl.searchParams.set('redirect_uri', redirectUri)
  vkAuthUrl.searchParams.set('display', 'page')
  vkAuthUrl.searchParams.set('scope', 'email')
  vkAuthUrl.searchParams.set('response_type', 'code')
  vkAuthUrl.searchParams.set('v', '5.131')

  return NextResponse.redirect(vkAuthUrl.toString())
}