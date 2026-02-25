import fs from 'fs'
import path from 'path'

const DATA_DIR = process.env.DATA_DIR || '/tmp/cardai-dev'
const TEMPLATES_FILE = path.join(DATA_DIR, 'templates.json')

export interface CardTemplate {
  id: string
  userId: string
  name: string
  tone: string
  structure: string
  length: 'short' | 'medium' | 'long'
  keyPhrases: string
  createdAt: string
  updatedAt: string
}

type TemplatesDb = Record<string, CardTemplate[]>

function readDb(): TemplatesDb {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })
    if (!fs.existsSync(TEMPLATES_FILE)) return {}
    const raw = JSON.parse(fs.readFileSync(TEMPLATES_FILE, 'utf-8'))
    return raw && typeof raw === 'object' ? raw : {}
  } catch {
    return {}
  }
}

function writeDb(db: TemplatesDb) {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })
  fs.writeFileSync(TEMPLATES_FILE, JSON.stringify(db, null, 2))
}

export function listTemplates(userId: string): CardTemplate[] {
  const db = readDb()
  return (db[userId] || []).slice().sort((a, b) => (a.updatedAt > b.updatedAt ? -1 : 1))
}

export function createTemplate(userId: string, input: {
  name: string
  tone?: string
  structure?: string
  length?: CardTemplate['length']
  keyPhrases?: string
}): CardTemplate {
  const db = readDb()
  const now = new Date().toISOString()
  const item: CardTemplate = {
    id: `tpl_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    userId,
    name: input.name.trim(),
    tone: (input.tone || '').trim(),
    structure: (input.structure || '').trim(),
    length: input.length || 'medium',
    keyPhrases: (input.keyPhrases || '').trim(),
    createdAt: now,
    updatedAt: now,
  }
  const list = db[userId] || []
  list.unshift(item)
  db[userId] = list.slice(0, 100)
  writeDb(db)
  return item
}

export function updateTemplate(userId: string, templateId: string, patch: Partial<Pick<CardTemplate, 'name' | 'tone' | 'structure' | 'length' | 'keyPhrases'>>): CardTemplate | null {
  const db = readDb()
  const list = db[userId] || []
  const idx = list.findIndex((t) => t.id === templateId)
  if (idx === -1) return null
  const next: CardTemplate = {
    ...list[idx],
    ...patch,
    updatedAt: new Date().toISOString(),
  }
  list[idx] = next
  db[userId] = list
  writeDb(db)
  return next
}

export function deleteTemplate(userId: string, templateId: string): boolean {
  const db = readDb()
  const list = db[userId] || []
  const next = list.filter((t) => t.id !== templateId)
  if (next.length === list.length) return false
  db[userId] = next
  writeDb(db)
  return true
}
