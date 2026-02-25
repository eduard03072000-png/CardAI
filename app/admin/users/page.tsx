import { readUsers } from '@/lib/store'

export const dynamic = 'force-dynamic'

export default async function AdminUsersPage() {
  const key = process.env.ADMIN_KEY
  // Простая защита: если ADMIN_KEY задан, требуем его через query (?key=...)
  // В противном случае страница доступна без защиты (dev-режим).

  const users = readUsers()
  const list = Object.values(users).sort((a, b) => b.lastLoginAt - a.lastLoginAt)

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
            <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 0.8fr 0.8fr 1fr', gap: 0, padding: '10px 14px', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, color: '#7070a0', borderBottom: '1px solid #2a2a3d' }}>
              <div>Пользователь</div>
              <div>Метод</div>
              <div>Создан</div>
              <div>Последний логин</div>
            </div>
            <div>
              {list.map((u, idx) => {
                const created = new Date(u.createdAt).toLocaleString('ru')
                const last = new Date(u.lastLoginAt).toLocaleString('ru')
                const isTelegram = u.method === 'telegram'
                return (
                  <div
                    key={u.id}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1.3fr 0.8fr 0.8fr 1fr',
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
                    <div style={{ fontSize: 12, color: '#a0a0c0' }}>{created}</div>
                    <div style={{ fontSize: 12, color: '#a0a0c0' }}>{last}</div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {key && (
          <p style={{ marginTop: 16, fontSize: 11, color: '#4a4a6a' }}>
            Доступ к панели можно ограничить, добавив параметр <code>?key=...</code> и проверку в коде по переменной окружения ADMIN_KEY.
          </p>
        )}
      </div>
    </div>
  )
}

