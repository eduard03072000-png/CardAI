import { readOTPs, writeOTPs } from './store'

export function generateOTP(): string {
  if (process.env.DEV_MODE === 'true') return '1234'
  return Math.floor(1000 + Math.random() * 9000).toString()
}

export function saveOTP(phone: string, code: string): void {
  const otps = readOTPs()
  otps[phone] = {
    code,
    expires: Date.now() + 5 * 60 * 1000, // 5 минут
    attempts: 0,
  }
  writeOTPs(otps)
}

export function verifyOTP(phone: string, code: string): 'ok' | 'expired' | 'invalid' | 'too_many' {
  const otps = readOTPs()
  const entry = otps[phone]
  if (!entry) return 'expired'
  if (Date.now() > entry.expires) {
    delete otps[phone]
    writeOTPs(otps)
    return 'expired'
  }
  if (entry.attempts >= 5) return 'too_many'
  if (entry.code !== code) {
    entry.attempts++
    writeOTPs(otps)
    return 'invalid'
  }
  delete otps[phone]
  writeOTPs(otps)
  return 'ok'
}

export function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  if (digits.startsWith('8') && digits.length === 11) return '+7' + digits.slice(1)
  if (digits.startsWith('7') && digits.length === 11) return '+' + digits
  if (digits.length === 10) return '+7' + digits
  return '+' + digits
}
