import { NextRequest } from 'next/server'

/**
 * Получает реальный origin из запроса (учитывает proxy/reverse-proxy)
 */
export function getOrigin(req: NextRequest): string {
  // Сначала проверяем X-Forwarded-Host (за nginx/proxy)
  const forwardedHost = req.headers.get('x-forwarded-host')
  const forwardedProto = req.headers.get('x-forwarded-proto') || 'http'
  if (forwardedHost) {
    return `${forwardedProto}://${forwardedHost}`
  }

  // Потом Host header
  const host = req.headers.get('host')
  if (host && !host.startsWith('localhost') && !host.startsWith('127.0.0.1')) {
    return `http://${host}`
  }

  // Fallback на переменную окружения
  if (process.env.APP_URL) {
    return process.env.APP_URL
  }

  // Последний fallback
  return req.nextUrl.origin
}