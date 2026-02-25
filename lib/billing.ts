import fs from 'fs'
import path from 'path'
import { PLANS, getUserPlan, getUserPlanEntry, setUserPlan } from './plans'

const DATA_DIR = process.env.DATA_DIR || '/tmp/cardai-dev'
const BILLING_FILE = path.join(DATA_DIR, 'billing.json')
const CYCLE_DAYS = 30

type SubscriptionStatus = 'active' | 'cancelled'
type PaymentType = 'charge' | 'renewal'

export interface BillingSubscription {
  userId: string
  planId: string
  autoRenew: boolean
  status: SubscriptionStatus
  nextBillingAt: string
  startedAt: string
  updatedAt: string
}

export interface PaymentRecord {
  id: string
  userId: string
  planId: string
  amount: number
  status: 'paid'
  type: PaymentType
  provider: 'mock_card'
  createdAt: string
}

interface BillingDb {
  subscriptions: Record<string, BillingSubscription>
  payments: PaymentRecord[]
}

function readDb(): BillingDb {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })
    if (!fs.existsSync(BILLING_FILE)) return { subscriptions: {}, payments: [] }
    const parsed = JSON.parse(fs.readFileSync(BILLING_FILE, 'utf-8'))
    return {
      subscriptions: parsed.subscriptions || {},
      payments: Array.isArray(parsed.payments) ? parsed.payments : [],
    }
  } catch {
    return { subscriptions: {}, payments: [] }
  }
}

function writeDb(db: BillingDb) {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })
  fs.writeFileSync(BILLING_FILE, JSON.stringify(db, null, 2))
}

function daysFromNow(days: number): string {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString()
}

function pushPayment(db: BillingDb, userId: string, planId: string, type: PaymentType) {
  const plan = PLANS[planId] || PLANS.seller
  db.payments.unshift({
    id: `pay_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    userId,
    planId,
    amount: plan.price,
    status: 'paid',
    type,
    provider: 'mock_card',
    createdAt: new Date().toISOString(),
  })
  if (db.payments.length > 5000) db.payments.length = 5000
}

export async function processAutoRenewForUser(userId: string): Promise<void> {
  const db = readDb()
  const sub = db.subscriptions[userId]
  if (!sub || !sub.autoRenew || sub.status !== 'active') return

  const now = new Date()
  const dueAt = new Date(sub.nextBillingAt)
  if (Number.isNaN(dueAt.getTime()) || dueAt > now) return

  await setUserPlan(userId, sub.planId, CYCLE_DAYS)
  pushPayment(db, userId, sub.planId, 'renewal')

  sub.nextBillingAt = daysFromNow(CYCLE_DAYS)
  sub.updatedAt = new Date().toISOString()
  db.subscriptions[userId] = sub
  writeDb(db)
}

export async function checkoutPlan(userId: string, planId: string): Promise<BillingSubscription> {
  const safePlanId = Object.prototype.hasOwnProperty.call(PLANS, planId) ? planId : 'seller'
  const db = readDb()
  const nowIso = new Date().toISOString()

  await setUserPlan(userId, safePlanId, CYCLE_DAYS)
  pushPayment(db, userId, safePlanId, 'charge')

  const next: BillingSubscription = {
    userId,
    planId: safePlanId,
    autoRenew: true,
    status: 'active',
    nextBillingAt: daysFromNow(CYCLE_DAYS),
    startedAt: db.subscriptions[userId]?.startedAt || nowIso,
    updatedAt: nowIso,
  }
  db.subscriptions[userId] = next
  writeDb(db)
  return next
}

export async function setAutoRenew(userId: string, enabled: boolean): Promise<BillingSubscription | null> {
  const db = readDb()
  const sub = db.subscriptions[userId]
  if (!sub) return null
  sub.autoRenew = enabled
  sub.status = enabled ? 'active' : 'cancelled'
  sub.updatedAt = new Date().toISOString()
  db.subscriptions[userId] = sub
  writeDb(db)
  return sub
}

export async function getSubscription(userId: string): Promise<BillingSubscription | null> {
  const db = readDb()
  return db.subscriptions[userId] || null
}

export async function getPaymentHistory(userId: string, limit = 30): Promise<PaymentRecord[]> {
  const db = readDb()
  return db.payments.filter((p) => p.userId === userId).slice(0, limit)
}

export async function getSubscriptionCabinet(userId: string, todayCount: number) {
  await processAutoRenewForUser(userId)
  const plan = await getUserPlan(userId)
  const planEntry = await getUserPlanEntry(userId)
  const sub = await getSubscription(userId)
  const payments = await getPaymentHistory(userId, 30)

  return {
    plan: {
      id: plan.id,
      name: plan.name,
      price: plan.price,
      dailyLimit: plan.dailyLimit,
      historyDays: plan.historyDays,
      platforms: plan.platforms,
      features: plan.features,
      expiresAt: planEntry?.expiresAt || null,
    },
    usage: {
      todayCount,
      remainingToday: Math.max(0, plan.dailyLimit - todayCount),
    },
    subscription: sub
      ? {
          status: sub.status,
          autoRenew: sub.autoRenew,
          nextBillingAt: sub.nextBillingAt,
          currentPlanId: sub.planId,
        }
      : {
          status: 'cancelled',
          autoRenew: false,
          nextBillingAt: null,
          currentPlanId: plan.id,
        },
    payments,
  }
}
