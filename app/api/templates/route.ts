import { NextRequest, NextResponse } from 'next/server'
import { getCurrentSession } from '@/lib/session'
import { createTemplate, deleteTemplate, listTemplates, updateTemplate } from '@/lib/templates'

export async function GET() {
  const session = await getCurrentSession()
  if (!session) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
  return NextResponse.json({ ok: true, templates: listTemplates(session.email) })
}

export async function POST(req: NextRequest) {
  const session = await getCurrentSession()
  if (!session) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
  const body = await req.json().catch(() => ({}))
  const name = String(body?.name || '').trim()
  if (!name) return NextResponse.json({ error: 'Название шаблона обязательно' }, { status: 400 })
  const template = createTemplate(session.email, {
    name,
    tone: String(body?.tone || ''),
    structure: String(body?.structure || ''),
    length: body?.length === 'short' || body?.length === 'long' || body?.length === 'medium' ? body.length : 'medium',
    keyPhrases: String(body?.keyPhrases || ''),
  })
  return NextResponse.json({ ok: true, template })
}

export async function PUT(req: NextRequest) {
  const session = await getCurrentSession()
  if (!session) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
  const body = await req.json().catch(() => ({}))
  const id = String(body?.id || '').trim()
  if (!id) return NextResponse.json({ error: 'id обязателен' }, { status: 400 })
  const template = updateTemplate(session.email, id, {
    name: typeof body?.name === 'string' ? body.name : undefined,
    tone: typeof body?.tone === 'string' ? body.tone : undefined,
    structure: typeof body?.structure === 'string' ? body.structure : undefined,
    length: body?.length === 'short' || body?.length === 'long' || body?.length === 'medium' ? body.length : undefined,
    keyPhrases: typeof body?.keyPhrases === 'string' ? body.keyPhrases : undefined,
  })
  if (!template) return NextResponse.json({ error: 'Шаблон не найден' }, { status: 404 })
  return NextResponse.json({ ok: true, template })
}

export async function DELETE(req: NextRequest) {
  const session = await getCurrentSession()
  if (!session) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
  const id = req.nextUrl.searchParams.get('id') || ''
  if (!id) return NextResponse.json({ error: 'id обязателен' }, { status: 400 })
  const ok = deleteTemplate(session.email, id)
  return NextResponse.json({ ok })
}
