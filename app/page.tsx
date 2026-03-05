import { redirect } from 'next/navigation'
import { getCurrentSession } from '@/lib/session'
import { readUsers } from '@/lib/store'
import DashboardClient from './dashboard/DashboardClient'

export default async function Home() {
  const session = await getCurrentSession()
  const identity = session?.email ?? ''
  const user = identity ? readUsers()[identity] : null
  const display = user?.method === 'telegram'
    ? (user?.meta?.username ? `@${user.meta.username}` : [user?.meta?.firstName, user?.meta?.lastName].filter(Boolean).join(' ').trim() || user?.display || identity)
    : (user?.display || identity)
  // Показываем дашборд всем — авторизация нужна только для генерации
  return <DashboardClient phone={display} />
}
