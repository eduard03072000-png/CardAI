import fs from 'fs'
import path from 'path'

const DATA_DIR = process.env.DATA_DIR || '/tmp/cardai-dev'
const TEAM_FILE = path.join(DATA_DIR, 'teams.json')
const TEAM_LIMIT = 10

export interface TeamMember {
  id: string
  email: string
  role: 'admin' | 'editor'
  status: 'active'
  createdAt: string
}

type TeamDb = Record<string, TeamMember[]>

function readDb(): TeamDb {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })
    if (!fs.existsSync(TEAM_FILE)) return {}
    return JSON.parse(fs.readFileSync(TEAM_FILE, 'utf8'))
  } catch {
    return {}
  }
}

function writeDb(db: TeamDb) {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })
  fs.writeFileSync(TEAM_FILE, JSON.stringify(db, null, 2))
}

export function getTeam(ownerId: string): TeamMember[] {
  const db = readDb()
  return db[ownerId] || []
}

export function addTeamMember(ownerId: string, email: string, role: 'admin' | 'editor'): TeamMember {
  const normalizedEmail = email.trim().toLowerCase()
  if (!normalizedEmail.includes('@')) throw new Error('Введите корректный email')

  const db = readDb()
  const team = db[ownerId] || []
  if (team.length >= TEAM_LIMIT) throw new Error(`Достигнут лимит команды: ${TEAM_LIMIT} сотрудников`)
  if (team.some((m) => m.email === normalizedEmail)) throw new Error('Этот сотрудник уже добавлен')

  const member: TeamMember = {
    id: `tm_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    email: normalizedEmail,
    role,
    status: 'active',
    createdAt: new Date().toISOString(),
  }
  team.push(member)
  db[ownerId] = team
  writeDb(db)
  return member
}

export function removeTeamMember(ownerId: string, memberId: string): boolean {
  const db = readDb()
  const team = db[ownerId] || []
  const next = team.filter((m) => m.id !== memberId)
  if (next.length === team.length) return false
  db[ownerId] = next
  writeDb(db)
  return true
}

export { TEAM_LIMIT }
