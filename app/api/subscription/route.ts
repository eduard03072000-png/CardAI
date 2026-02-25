import { NextRequest, NextResponse } from 'next/server'
import { getCurrentSession } from '@/lib/session'
import { countTodayGenerations } from '@/lib/history'
import { PLANS } from '@/lib/plans'
import { checkoutPlan, getSubscriptionCabinet, setAutoRenew } from '@/lib/billing'

export async function GET() {
  const session = await getCurrentSession()
  if (!session) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })

  const todayCount = await countTodayGenerations(session.email)
  const data = await getSubscriptionCabinet(session.email, todayCount)
  return NextResponse.json({ ok: true, ...data })
}

export async function POST(req: NextRequest) {
  const session = await getCurrentSession()
  if (!session) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const action = String(body?.action || '').trim()

  if (action === 'checkout' || action === 'switch_plan') {
    const planId = String(body?.planId || '').trim()
    if (!Object.prototype.hasOwnProperty.call(PLANS, planId)) {
      return NextResponse.json({ error: 'Некорректный тариф' }, { status: 400 })
    }
    const subscription = await checkoutPlan(session.email, planId)
    return NextResponse.json({ ok: true, subscription })
  }

  if (action === 'set_autorenew') {
    const enabled = Boolean(body?.enabled)
    const subscription = await setAutoRenew(session.email, enabled)
    if (!subscription) {
      return NextResponse.json({ error: 'Подписка не найдена. Сначала оплатите тариф.' }, { status: 400 })
    }
    return NextResponse.json({ ok: true, subscription })
  }

  return NextResponse.json({ error: 'Неизвестное действие' }, { status: 400 })
}
