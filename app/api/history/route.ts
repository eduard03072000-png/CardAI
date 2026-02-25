import { NextRequest, NextResponse } from 'next/server'
import { getCurrentSession } from '@/lib/session'
import { getUserHistory, deleteHistoryItem, countTodayGenerations } from '@/lib/history'
import { getUserPlan } from '@/lib/plans'
import { processAutoRenewForUser } from '@/lib/billing'

// GET /api/history — получить историю
export async function GET(req: NextRequest) {
  const session = await getCurrentSession()
  if (!session) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })

  const userId = session.email
  await processAutoRenewForUser(userId)
  const plan = await getUserPlan(userId)
  const history = await getUserHistory(userId, 100, plan.historyDays, {
    platform: req.nextUrl.searchParams.get('platform') || undefined,
    q: req.nextUrl.searchParams.get('q') || undefined,
    from: req.nextUrl.searchParams.get('from') || undefined,
    to: req.nextUrl.searchParams.get('to') || undefined,
  })
  const todayCount = await countTodayGenerations(userId)

  return NextResponse.json({
    ok: true,
    history,
    plan: { id: plan.id, name: plan.name, dailyLimit: plan.dailyLimit, historyDays: plan.historyDays },
    todayCount,
  })
}

// DELETE /api/history?id=xxx — удалить запись
export async function DELETE(req: NextRequest) {
  const session = await getCurrentSession()
  if (!session) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })

  const itemId = req.nextUrl.searchParams.get('id')
  if (!itemId) return NextResponse.json({ error: 'id обязателен' }, { status: 400 })

  const deleted = await deleteHistoryItem(session.email, itemId)
  return NextResponse.json({ ok: deleted })
}