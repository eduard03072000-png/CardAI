/**
 * Persistent file-based store for dev mode.
 * Survives Next.js hot reload & server restarts.
 */
import fs from 'fs'
import path from 'path'
import os from 'os'

const STORE_DIR = path.join(os.tmpdir(), 'cardai-dev')
const OTP_FILE = path.join(STORE_DIR, 'otp.json')
const SESSION_FILE = path.join(STORE_DIR, 'sessions.json')

function ensureDir() {
  if (!fs.existsSync(STORE_DIR)) fs.mkdirSync(STORE_DIR, { recursive: true })
}

// ---- OTP ----
export interface OTPEntry {
  code: string
  expires: number
  attempts: number
}

export function readOTPs(): Record<string, OTPEntry> {
  ensureDir()
  try { return JSON.parse(fs.readFileSync(OTP_FILE, 'utf8')) } catch { return {} }
}

export function writeOTPs(data: Record<string, OTPEntry>) {
  ensureDir()
  fs.writeFileSync(OTP_FILE, JSON.stringify(data, null, 2))
}

// ---- Sessions ----
export interface SessionEntry {
  phone: string
  createdAt: number
}

export function readSessions(): Record<string, SessionEntry> {
  ensureDir()
  try { return JSON.parse(fs.readFileSync(SESSION_FILE, 'utf8')) } catch { return {} }
}

export function writeSessions(data: Record<string, SessionEntry>) {
  ensureDir()
  fs.writeFileSync(SESSION_FILE, JSON.stringify(data, null, 2))
}
