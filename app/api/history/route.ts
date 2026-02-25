import { NextRequest, NextResponse } from 'next/server'
import { getCurrentSession } from '@/lib/session'
import { getUserHistory, deleteHistoryItem, countTodayGenerations } from '@/lib/history'
import { getUserPlan } from '@/lib/plans'

// GET /api/history — получить историю
export async function GET() {
  const session = await getCurrentSession()
  if (!session) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })

  const userId = session.email
  const plan = await getUserPlan(userId)
  const history = await getUserHistory(userId, 100, plan.historyDays || undefined)
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