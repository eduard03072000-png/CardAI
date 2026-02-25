import fs from 'fs'
import path from 'path'

const DATA_DIR = process.env.DATA_DIR || '/tmp/cardai-dev'
const SUPPORT_FILE = path.join(DATA_DIR, 'support-tickets.json')

export interface SupportTicket {
  id: string
  userId: string
  email: string
  subject: string
  message: string
  createdAt: string
  status: 'new'
}

function readTickets(): SupportTicket[] {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })
    if (!fs.existsSync(SUPPORT_FILE)) return []
    return JSON.parse(fs.readFileSync(SUPPORT_FILE, 'utf8'))
  } catch {
    return []
  }
}

function writeTickets(items: SupportTicket[]) {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })
  fs.writeFileSync(SUPPORT_FILE, JSON.stringify(items, null, 2))
}

export function createSupportTicket(input: {
  userId: string
  email: string
  subject: string
  message: string
}): SupportTicket {
  const subject = input.subject.trim()
  const message = input.message.trim()
  if (!subject) throw new Error('Укажите тему обращения')
  if (message.length < 10) throw new Error('Опишите вопрос подробнее (минимум 10 символов)')

  const items = readTickets()
  const ticket: SupportTicket = {
    id: `sup_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    userId: input.userId,
    email: input.email,
    subject,
    message,
    createdAt: new Date().toISOString(),
    status: 'new',
  }
  items.unshift(ticket)
  writeTickets(items)
  return ticket
}
