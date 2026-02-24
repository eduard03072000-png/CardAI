import { cookies } from 'next/headers'
import { readSessions, writeSessions, upsertUser } from './store'

const SESSION_COOKIE = 'cardai_session'

export function createSession(identity: string): string {
  const token = generateToken()
  const sessions = readSessions()
  sessions[token] = { phone: identity, createdAt: Date.now() }
  writeSessions(sessions)

  const isTelegram = identity.startsWith('tg:')
  upsertUser({
    id: identity,
    display: identity,
    method: isTelegram ? 'telegram' : 'sms',
    createdAt: Date.now(),
    lastLoginAt: Date.now(),
  })

  return token
}

export function getSession(token: string): { phone: string; createdAt: number } | null {
  const sessions = readSessions()
  const s = sessions[token]
  if (!s) return null
  if (Date.now() - s.createdAt > 30 * 24 * 60 * 60 * 1000) {
    delete sessions[token]
    writeSessions(sessions)
    return null
  }
  return s
}

export async function getCurrentSession(): Promise<{ phone: string; createdAt: number } | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value
  if (!token) return null
  return getSession(token)
}

export function SESSION_COOKIE_NAME() {
  return SESSION_COOKIE
}

function generateToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < 64; i++) result += chars.charAt(Math.floor(Math.random() * chars.length))
  return result
}
