import { readUsers } from '@/lib/store'
import { PLANS, getAllUserPlans } from '@/lib/plans'
import { getSupportTickets } from '@/lib/support'

export const dynamic = 'force-dynamic'

interface AdminUsersPageProps {
  searchParams?: Promise<{ key?: string; updated?: string; ticketUpdated?: string }>
}

export default async function AdminUsersPage({ searchParams }: AdminUsersPageProps) {
  const params = (await searchParams) || {}
  const key = process.env.ADMIN_KEY
  const providedKey = typeof params.key === 'string' ? params.key : ''
  const isAuthorized = !key || providedKey === key
  // Простая защита: если ADMIN_KEY задан, требуем его через query (?key=...)
  // В противном случае страница доступна без защиты (dev-режим).

  if (!isAuthorized) {
    return (
      <div style={{ minHeight: '100vh', background: '#0a0a0f', color: '#f0f0f8', fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif' }}>
        <div style={{ maxWidth: 640, margin: '0 auto', padding: '80px 24px' }}>
          <div style={{ borderRadius: 16, border: '1px solid #2a2a3d', background: '#12121a', padding: 24 }}>
            <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: -1, marginBottom: 8 }}>
              Card<span style={{ color: '#ff4d6d' }}>AI</span> · Admin
            </div>
            <div style={{ fontSize: 14, color: '#ff4d6d', marginBottom: 8 }}>Доступ запрещен</div>
            <p style={{ fontSize: 13, color: '#7070a0', lineHeight: 1.6 }}>
              Укажи ключ в URL: <code>?key=...</code>
            </p>
          </div>
        </div>
      </div>
    )
  }

  const users = readUsers()
  const userPlans = await getAllUserPlans()
  const tickets = getSupportTickets(30)
  const nowTs = Date.now()
  const deduped = new Map<string, (typeof users)[string]>()

  for (const u of Object.values(users)) {
    // Для Telegram считаем пользователя уникальным по telegramId/username,
    // чтобы исторические записи с разными id не дублировались в админке.
    const dedupeKey = u.method === 'telegram'
      ? (() => {
          const username = (u.meta?.username || u.display.replace(/^tg:@?/i, ''))
            .trim()
            .replace(/^@/, '')
            .toLowerCase()
          if (username) return `tg:user:${username}`
          if (u.meta?.telegramId) return `tg:id:${u.meta.telegramId}`
          return `tg:id:${u.id.toLowerCase()}`
        })()
      : `${u.method}:${u.id.toLowerCase()}`

    const prev = deduped.get(dedupeKey)
    if (!prev) {
      deduped.set(dedupeKey, u)
      continue
    }

    const canonicalId = (() => {
      const prevTgId = prev.meta?.telegramId
      const curTgId = u.meta?.telegramId
      if (typeof prevTgId === 'number') return `tg:${prevTgId}`
      if (typeof curTgId === 'number') return `tg:${curTgId}`
      return u.lastLoginAt > prev.lastLoginAt ? u.id : prev.id
    })()

    if (u.lastLoginAt > prev.lastLoginAt) {
      deduped.set(dedupeKey, {
        ...u,
        id: canonicalId,
        createdAt: Math.min(prev.createdAt, u.createdAt),
      })
    } else {
      deduped.set(dedupeKey, {
        ...prev,
        id: canonicalId,
        createdAt: Math.min(prev.createdAt, u.createdAt),
      })
    }
  }

  const list = Array.from(deduped.values()).sort((a, b) => b.lastLoginAt - a.lastLoginAt)

  function getSubscriptionInfo(userId: string) {
    const entry = userPlans[userId]
    if (!entry) {
      return { main: 'Нет', extra: '—', color: '#7070a0' }
    }

    const expiresTs = new Date(entry.expiresAt).getTime()
    const planName = PLANS[entry.planId]?.name || entry.planId
    const isActive = expiresTs > nowTs

    return {
      main: isActive ? `Да · ${planName}` : `Истекла · ${planName}`,
      extra: `до ${new Date(entry.expiresAt).toLocaleDateString('ru')}`,
      color: isActive ? '#22d3a0' : '#ffb020',
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', color: '#f0f0f8', fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif' }}>
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '32px 24px 64px' }}>
        <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: -1 }}>Card<span style={{ color: '#ff4d6d' }}>AI</span> · Admin</div>
            <div style={{ fontSize: 12, color: '#7070a0', marginTop: 4 }}>Авторизованные пользователи</div>
          </div>
          <div style={{ fontSize: 12, color: '#4a4a6a' }}>
            Всего: <span style={{ color: '#f0f0f8' }}>{list.length}</span>
          </div>
        </header>

        {list.length === 0 ? (
          <div style={{ marginTop: 80, textAlign: 'center', color: '#7070a0', fontSize: 14 }}>
            Пока нет ни одного пользователя.
          </div>
        ) : (
          <div style={{ borderRadius: 16, border: '1px solid #2a2a3d', background: '#12121a', overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 0.7fr 1fr 0.8fr 1fr', gap: 0, padding: '10px 14px', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, color: '#7070a0', borderBottom: '1px solid #2a2a3d' }}>
              <div>Пользователь</div>
              <div>Метод</div>
              <div>Подписка</div>
              <div>Создан</div>
              <div>Последний логин</div>
            </div>
            <div>
              {list.map((u, idx) => {
                const created = new Date(u.createdAt).toLocaleString('ru')
                const last = new Date(u.lastLoginAt).toLocaleString('ru')
                const isTelegram = u.method === 'telegram'
                const sub = getSubscriptionInfo(u.id)
                return (
                  <div
                    key={u.id}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1.3fr 0.7fr 1fr 0.8fr 1fr',
                      gap: 0,
                      padding: '10px 14px',
                      fontSize: 13,
                      borderTop: idx === 0 ? 'none' : '1px solid #1c1c28',
                      background: idx % 2 === 0 ? '#12121a' : '#15151f',
                    }}
                  >
                    <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {u.display}
                      {u.meta?.email && (
                        <span style={{ marginLeft: 6, fontSize: 11, color: '#7070a0' }}>({u.meta.email})</span>
                      )}
                    </div>
                    <div style={{ color: isTelegram ? '#22d3a0' : u.method === 'vk' ? '#4680C2' : u.method === 'yandex' ? '#FC3F1D' : '#ffb020', fontSize: 12 }}>
                      {u.method === 'telegram' ? 'Telegram' : u.method === 'vk' ? 'VK' : u.method === 'yandex' ? 'Яндекс' : 'Email'}
                    </div>
                    <div style={{ fontSize: 12 }}>
                      <div style={{ color: sub.color }}>{sub.main}</div>
                      <div style={{ color: '#7070a0', marginTop: 2 }}>{sub.extra}</div>
                    </div>
                    <div style={{ fontSize: 12, color: '#a0a0c0' }}>{created}</div>
                    <div style={{ fontSize: 12, color: '#a0a0c0' }}>{last}</div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        <div style={{ marginTop: 16, borderRadius: 16, border: '1px solid #2a2a3d', background: '#12121a', padding: 16 }}>
          <div style={{ fontSize: 13, marginBottom: 10 }}>Выдать подписку вручную</div>
          <form method="POST" action="/api/admin/subscription" style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 0.6fr auto', gap: 8 }}>
            {key && <input type="hidden" name="key" value={providedKey} />}
            <select name="userId" required style={{ background: '#1c1c28', border: '1px solid #2a2a3d', borderRadius: 8, color: '#f0f0f8', padding: '9px 10px', fontFamily: 'inherit' }}>
              <option value="">Выбери пользователя</option>
              {list.map((u) => (
                <option key={u.id} value={u.id}>{u.display}</option>
              ))}
            </select>
            <select name="planId" defaultValue="seller" style={{ background: '#1c1c28', border: '1px solid #2a2a3d', borderRadius: 8, color: '#f0f0f8', padding: '9px 10px', fontFamily: 'inherit' }}>
              {Object.values(PLANS).map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <input name="days" type="number" min={1} defaultValue={30} style={{ background: '#1c1c28', border: '1px solid #2a2a3d', borderRadius: 8, color: '#f0f0f8', padding: '9px 10px', fontFamily: 'inherit' }} />
            <button type="submit" style={{ background: 'linear-gradient(135deg,#ff4d6d,#7c3aed)', border: 'none', borderRadius: 8, color: '#fff', padding: '9px 12px', cursor: 'pointer', fontFamily: 'inherit' }}>
              Выдать
            </button>
          </form>
          <div style={{ marginTop: 8, fontSize: 11, color: '#7070a0' }}>Срок подписки указывается в днях.</div>
          {params.updated === '1' && <div style={{ marginTop: 6, fontSize: 12, color: '#22d3a0' }}>Подписка обновлена</div>}
        </div>

        <div style={{ marginTop: 16, borderRadius: 16, border: '1px solid #2a2a3d', background: '#12121a', overflow: 'hidden' }}>
          <div style={{ padding: '12px 14px', borderBottom: '1px solid #2a2a3d', fontSize: 13 }}>
            Входящие обращения поддержки: <span style={{ color: '#f0f0f8' }}>{tickets.length}</span>
          </div>
          {tickets.length === 0 ? (
            <div style={{ padding: 14, color: '#7070a0', fontSize: 12 }}>Пока обращений нет.</div>
          ) : (
            <div style={{ maxHeight: 340, overflowY: 'auto' }}>
              {tickets.map((t, idx) => (
                <div key={t.id} style={{ padding: '10px 14px', borderTop: idx === 0 ? 'none' : '1px solid #1c1c28' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ fontSize: 12, color: '#f0f0f8' }}>{t.subject}</div>
                      <span style={{ fontSize: 11, padding: '2px 7px', borderRadius: 999, border: `1px solid ${t.status === 'done' ? 'rgba(34,211,160,0.35)' : 'rgba(255,199,0,0.35)'}`, color: t.status === 'done' ? '#22d3a0' : '#ffc700', background: t.status === 'done' ? 'rgba(34,211,160,0.08)' : 'rgba(255,199,0,0.08)' }}>
                        {t.status === 'done' ? 'Выполнено' : 'Новое'}
                      </span>
                    </div>
                    <div style={{ fontSize: 11, color: '#7070a0' }}>{new Date(t.createdAt).toLocaleString('ru')}</div>
                  </div>
                  <div style={{ fontSize: 11, color: '#a0a0c0', marginBottom: 6 }}>{t.email}</div>
                  <div style={{ fontSize: 12, color: '#d0d0e8', whiteSpace: 'pre-wrap' }}>{t.message}</div>
                  <form method="POST" action="/api/admin/support" style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                    {key && <input type="hidden" name="key" value={providedKey} />}
                    <input type="hidden" name="ticketId" value={t.id} />
                    <input type="hidden" name="action" value={t.status === 'done' ? 'new' : 'done'} />
                    <button type="submit" style={{ background: 'none', border: '1px solid #2a2a3d', borderRadius: 8, color: '#22d3a0', padding: '4px 10px', cursor: 'pointer', fontFamily: 'inherit', fontSize: 11 }}>
                      {t.status === 'done' ? '↩ Вернуть в новые' : '✅ Выполнено'}
                    </button>
                  </form>
                  <form method="POST" action="/api/admin/support" style={{ marginTop: 6, display: 'flex', gap: 8 }}>
                    {key && <input type="hidden" name="key" value={providedKey} />}
                    <input type="hidden" name="ticketId" value={t.id} />
                    <input type="hidden" name="action" value="delete" />
                    <button type="submit" style={{ background: 'none', border: '1px solid #2a2a3d', borderRadius: 8, color: '#ff4d6d', padding: '4px 10px', cursor: 'pointer', fontFamily: 'inherit', fontSize: 11 }}>
                      🗑 Очистить
                    </button>
                  </form>
                </div>
              ))}
            </div>
          )}
          {params.ticketUpdated === '1' && <div style={{ padding: '8px 14px', borderTop: '1px solid #2a2a3d', fontSize: 12, color: '#22d3a0' }}>Обращение обновлено</div>}
        </div>

        {key && (
          <p style={{ marginTop: 16, fontSize: 11, color: '#4a4a6a' }}>
            Доступ к панели можно ограничить, добавив параметр <code>?key=...</code> и проверку в коде по переменной окружения ADMIN_KEY.
          </p>
        )}
      </div>
    </div>
  )
}

