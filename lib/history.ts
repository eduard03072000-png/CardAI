/**
 * Серверная история генераций CardAI
 */

import * as fs from 'fs'
import * as path from 'path'

const DATA_DIR = process.env.DATA_DIR || '/tmp/cardai-dev'
const HISTORY_DIR = path.join(DATA_DIR, 'history')

export interface HistoryRecord {
  id: string
  userId: string
  platform: string
  productName: string
  category: string
  input?: {
    specs?: string
    notes?: string
    brand?: string
    color?: string
    sizes?: string
    material?: string
    country?: string
    price?: string
    discount?: string
    gender?: string
    season?: string
    nds?: string
    barcode?: string
    weightG?: string
  }
  result: {
    title: string
    description: string
    keywords: string[]
    attributes: string
    variants: string[]
    seoScore: { total: number; title: number; description: number; keywords: number }
    tips: { type: string; text: string }[]
  }
  createdAt: string
}

function getUserHistoryFile(userId: string): string {
  // Безопасное имя файла из userId
  const safe = userId.replace(/[^a-zA-Z0-9@._-]/g, '_')
  return path.join(HISTORY_DIR, `${safe}.json`)
}

function readUserHistory(userId: string): HistoryRecord[] {
  try {
    if (!fs.existsSync(HISTORY_DIR)) fs.mkdirSync(HISTORY_DIR, { recursive: true })
    const file = getUserHistoryFile(userId)
    if (!fs.existsSync(file)) return []
    return JSON.parse(fs.readFileSync(file, 'utf-8'))
  } catch { return [] }
}

function writeUserHistory(userId: string, records: HistoryRecord[]) {
  if (!fs.existsSync(HISTORY_DIR)) fs.mkdirSync(HISTORY_DIR, { recursive: true })
  fs.writeFileSync(getUserHistoryFile(userId), JSON.stringify(records, null, 2))
}

export async function addHistoryItem(userId: string, data: {
  platform: string
  productName: string
  category: string
  input?: HistoryRecord['input']
  result: HistoryRecord['result']
}): Promise<HistoryRecord> {
  const records = readUserHistory(userId)
  const record: HistoryRecord = {
    id: `gen_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    userId,
    platform: data.platform,
    productName: data.productName,
    category: data.category,
    input: data.input,
    result: data.result,
    createdAt: new Date().toISOString(),
  }
  // Добавляем в начало, ограничиваем 500 записей
  records.unshift(record)
  if (records.length > 500) records.length = 500
  writeUserHistory(userId, records)
  return record
}

export async function getUserHistory(
  userId: string,
  limit = 50,
  maxDays?: number,
  filters?: { platform?: string; q?: string; from?: string; to?: string },
): Promise<HistoryRecord[]> {
  let records = readUserHistory(userId)
  if (maxDays) {
    const cutoff = new Date(Date.now() - maxDays * 24 * 60 * 60 * 1000)
    records = records.filter(r => new Date(r.createdAt) >= cutoff)
  }
  if (filters?.platform) {
    records = records.filter((r) => r.platform === filters.platform)
  }
  if (filters?.q) {
    const q = filters.q.toLowerCase()
    records = records.filter((r) =>
      `${r.productName} ${r.result?.title || ''} ${r.category}`.toLowerCase().includes(q),
    )
  }
  if (filters?.from) {
    const fromTs = new Date(filters.from).getTime()
    if (!Number.isNaN(fromTs)) records = records.filter((r) => new Date(r.createdAt).getTime() >= fromTs)
  }
  if (filters?.to) {
    const toTs = new Date(filters.to).getTime()
    if (!Number.isNaN(toTs)) records = records.filter((r) => new Date(r.createdAt).getTime() <= toTs + (24 * 60 * 60 * 1000 - 1))
  }
  return records.slice(0, limit)
}

export async function deleteHistoryItem(userId: string, itemId: string): Promise<boolean> {
  const records = readUserHistory(userId)
  const filtered = records.filter(r => r.id !== itemId)
  if (filtered.length === records.length) return false
  writeUserHistory(userId, filtered)
  return true
}

export async function countTodayGenerations(userId: string): Promise<number> {
  const records = readUserHistory(userId)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return records.filter(r => new Date(r.createdAt) >= today).length
}