import { NextRequest, NextResponse } from 'next/server'
import { PLANS, setUserPlan } from '@/lib/plans'

export async function POST(req: NextRequest) {
  const form = await req.formData()
  const userId = String(form.get('userId') || '').trim()
  const planId = String(form.get('planId') || '').trim()
  const daysRaw = String(form.get('days') || '').trim()
  const adminKeyProvided = String(form.get('key') || '').trim()
  const adminKey = process.env.ADMIN_KEY

  if (adminKey && adminKeyProvided !== adminKey) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (!userId) {
    return NextResponse.json({ error: 'userId обязателен' }, { status: 400 })
  }
  if (!Object.prototype.hasOwnProperty.call(PLANS, planId)) {
    return NextResponse.json({ error: 'Некорректный тариф' }, { status: 400 })
  }

  const daysNum = Number(daysRaw)
  const days = Number.isFinite(daysNum) ? Math.min(Math.max(Math.round(daysNum), 1), 3650) : 30

  await setUserPlan(userId, planId, days)

  const redirectTo = new URL('/admin/users', req.url)
  if (adminKey) redirectTo.searchParams.set('key', adminKeyProvided)
  redirectTo.searchParams.set('updated', '1')
  return NextResponse.redirect(redirectTo, 303)
}
