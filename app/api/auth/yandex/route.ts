import { NextRequest, NextResponse } from 'next/server'

// Яндекс OAuth: перенаправление на страницу авторизации
export async function GET(req: NextRequest) {
  const clientId = process.env.YANDEX_CLIENT_ID
  if (!clientId) {
    return NextResponse.json({ error: 'Яндекс OAuth не настроен' }, { status: 500 })
  }

  const origin = req.nextUrl.origin
  const redirectUri = `${origin}/api/auth/yandex/callback`

  const yaAuthUrl = new URL('https://oauth.yandex.ru/authorize')
  yaAuthUrl.searchParams.set('client_id', clientId)
  yaAuthUrl.searchParams.set('redirect_uri', redirectUri)
  yaAuthUrl.searchParams.set('response_type', 'code')
  yaAuthUrl.searchParams.set('force_confirm', 'yes')

  return NextResponse.redirect(yaAuthUrl.toString())
}