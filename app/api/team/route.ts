import { NextRequest, NextResponse } from 'next/server'
import { getCurrentSession } from '@/lib/session'
import { getUserPlan } from '@/lib/plans'
import { TEAM_LIMIT, addTeamMember, getTeam, removeTeamMember } from '@/lib/team'

export async function GET() {
  const session = await getCurrentSession()
  if (!session) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })

  const plan = await getUserPlan(session.email)
  if (plan.id !== 'network') {
    return NextResponse.json({ error: 'Команда доступна только на тарифе «Сеть»' }, { status: 403 })
  }

  return NextResponse.json({
    ok: true,
    limit: TEAM_LIMIT,
    members: getTeam(session.email),
  })
}

export async function POST(req: NextRequest) {
  const session = await getCurrentSession()
  if (!session) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })

  const plan = await getUserPlan(session.email)
  if (plan.id !== 'network') {
    return NextResponse.json({ error: 'Команда доступна только на тарифе «Сеть»' }, { status: 403 })
  }

  try {
    const { email, role } = await req.json()
    const member = addTeamMember(
      session.email,
      String(email || ''),
      role === 'admin' ? 'admin' : 'editor',
    )
    return NextResponse.json({ ok: true, member })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Не удалось добавить сотрудника'
    return NextResponse.json({ error: msg }, { status: 400 })
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getCurrentSession()
  if (!session) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })

  const plan = await getUserPlan(session.email)
  if (plan.id !== 'network') {
    return NextResponse.json({ error: 'Команда доступна только на тарифе «Сеть»' }, { status: 403 })
  }

  const memberId = req.nextUrl.searchParams.get('id')
  if (!memberId) return NextResponse.json({ error: 'id обязателен' }, { status: 400 })
  return NextResponse.json({ ok: removeTeamMember(session.email, memberId) })
}
