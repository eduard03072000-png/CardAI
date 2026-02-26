/**
 * Система тарифов CardAI
 */

import * as fs from 'fs'
import * as path from 'path'
import { readUsers } from './store'

const DATA_DIR = process.env.DATA_DIR || '/tmp/cardai-dev'
const PLANS_FILE = path.join(DATA_DIR, 'user-plans.json')

export interface Plan {
  id: 'seller' | 'shop' | 'warehouse' | 'network'
  name: string
  price: number
  dailyLimit: number
  platforms: string[]
  historyDays: number
  features: string[]
}

export const PLANS: Record<string, Plan> = {
  seller: {
    id: 'seller', name: 'Продавец', price: 690, dailyLimit: 5,
    platforms: ['wb', 'ozon'],
    historyDays: 7,
    features: ['excel', 'basic_seo', 'history'],
  },
  shop: {
    id: 'shop', name: 'Магазин', price: 1490, dailyLimit: 20,
    platforms: ['wb', 'ozon', 'avito'],
    historyDays: 30,
    features: ['excel', 'advanced_seo', 'variants', 'photo_ai', 'history'],
  },
  warehouse: {
    id: 'warehouse', name: 'Склад', price: 3490, dailyLimit: 50,
    platforms: ['wb', 'ozon', 'avito'],
    historyDays: 90,
    features: ['excel', 'csv', 'advanced_seo', 'variants', 'photo_ai', 'history', 'bulk_csv'],
  },
  network: {
    id: 'network', name: 'Сеть', price: 6990, dailyLimit: 999999,
    platforms: ['wb', 'ozon', 'avito'],
    historyDays: 365,
    features: ['excel', 'csv', 'json', 'advanced_seo', 'variants', 'photo_ai', 'history', 'bulk_csv', 'team', 'priority_support'],
  },
}

// Какой тариф у пользователя (по умолчанию — Продавец)
export interface UserPlanEntry {
  planId: string
  activatedAt: string
  expiresAt: string
}

function readPlansDb(): Record<string, UserPlanEntry> {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })
    if (!fs.existsSync(PLANS_FILE)) return {}
    return JSON.parse(fs.readFileSync(PLANS_FILE, 'utf-8'))
  } catch { return {} }
}

function writePlansDb(data: Record<string, UserPlanEntry>) {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })
  fs.writeFileSync(PLANS_FILE, JSON.stringify(data, null, 2))
}

function resolvePlanEntry(db: Record<string, UserPlanEntry>, userId: string): UserPlanEntry | undefined {
  let entry = db[userId]

  // Совместимость: старые Telegram-сессии могли храниться как tg:@username,
  // а подписка выдана на канонический tg:<telegramId>.
  if (!entry && userId.startsWith('tg:@')) {
    const username = userId.replace(/^tg:@/i, '').trim().toLowerCase()
    if (username) {
      const users = Object.values(readUsers())
      const tgUser = users.find((u) => {
        if (u.method !== 'telegram') return false
        const uName = (u.meta?.username || u.display.replace(/^tg:@?/i, ''))
          .trim()
          .replace(/^@/, '')
          .toLowerCase()
        return uName === username
      })
      if (typeof tgUser?.meta?.telegramId === 'number') {
        entry = db[`tg:${tgUser.meta.telegramId}`]
      }
    }
  }

  return entry
}

export async function getUserPlan(userId: string): Promise<Plan> {
  const db = readPlansDb()
  const entry = resolvePlanEntry(db, userId)

  if (!entry) return PLANS.seller // дефолт — Продавец
  // Проверяем не истёк ли тариф
  if (new Date(entry.expiresAt) < new Date()) return PLANS.seller
  return PLANS[entry.planId] || PLANS.seller
}

export async function setUserPlan(userId: string, planId: string, daysActive = 30) {
  const db = readPlansDb()
  const now = new Date()
  const expires = new Date(now.getTime() + daysActive * 24 * 60 * 60 * 1000)
  db[userId] = {
    planId,
    activatedAt: now.toISOString(),
    expiresAt: expires.toISOString(),
  }
  writePlansDb(db)
}

export async function getAllUserPlans(): Promise<Record<string, UserPlanEntry>> {
  return readPlansDb()
}

export async function getUserPlanEntry(userId: string): Promise<UserPlanEntry | null> {
  const db = readPlansDb()
  return resolvePlanEntry(db, userId) || null
}