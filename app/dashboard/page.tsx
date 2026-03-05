import { getCurrentSession } from '@/lib/session'
import { readUsers } from '@/lib/store'
import DashboardClient from './DashboardClient'

export default async function DashboardPage() {
  const session = await getCurrentSession()
  const identity = session?.email ?? ''
  const user = identity ? readUsers()[identity] : null
  const display = user?.method === 'telegram'
    ? (user?.meta?.username ? `@${user.meta.username}` : [user?.meta?.firstName, user?.meta?.lastName].filter(Boolean).join(' ').trim() || user?.display || identity)
    : (user?.display || identity)
  // Гости могут смотреть, но не генерировать (проверяется в DashboardClient)
  return <DashboardClient phone={display} />
}
