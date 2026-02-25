/**
 * Система тарифов CardAI
 */

import * as fs from 'fs'
import * as path from 'path'

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
    id: 'warehouse', name: 'Склад', price: 3490, dailyLimit: 100,
    platforms: ['wb', 'ozon', 'avito'],
    historyDays: 90,
    features: ['excel', 'csv', 'json', 'advanced_seo', 'variants', 'photo_ai', 'history', 'bulk_csv'],
  },
  network: {
    id: 'network', name: 'Сеть', price: 6990, dailyLimit: 999999,
    platforms: ['wb', 'ozon', 'avito'],
    historyDays: 365,
    features: ['excel', 'csv', 'json', 'advanced_seo', 'variants', 'photo_ai', 'history', 'bulk_csv', 'team', 'priority_support'],
  },
}

// Какой тариф у пользователя (по умолчанию — Продавец)
interface UserPlanEntry {
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

export async function getUserPlan(userId: string): Promise<Plan> {
  const db = readPlansDb()
  const entry = db[userId]
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