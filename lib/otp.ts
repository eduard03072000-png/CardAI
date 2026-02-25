import { readOTPs, writeOTPs } from './store'

export function generateOTP(): string {
  if (process.env.DEV_MODE === 'true') return '1234'
  return Math.floor(1000 + Math.random() * 9000).toString()
}

export function saveOTP(email: string, code: string): void {
  const otps = readOTPs()
  otps[email] = {
    code,
    expires: Date.now() + 5 * 60 * 1000,
    attempts: 0,
  }
  writeOTPs(otps)
}

export function verifyOTP(email: string, code: string): 'ok' | 'expired' | 'invalid' | 'too_many' {
  const otps = readOTPs()
  const entry = otps[email]
  if (!entry) return 'expired'
  if (Date.now() > entry.expires) {
    delete otps[email]
    writeOTPs(otps)
    return 'expired'
  }
  if (entry.attempts >= 5) return 'too_many'
  if (entry.code !== code) {
    entry.attempts++
    writeOTPs(otps)
    return 'invalid'
  }
  delete otps[email]
  writeOTPs(otps)
  return 'ok'
}

export function formatEmail(raw: string): string {
  return raw.trim().toLowerCase()
}