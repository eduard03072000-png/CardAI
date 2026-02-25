import { getCurrentSession } from '@/lib/session'
import DashboardClient from './DashboardClient'

export default async function DashboardPage() {
  const session = await getCurrentSession()
  // Гости могут смотреть, но не генерировать (проверяется в DashboardClient)
  return <DashboardClient phone={session?.email ?? ''} />
}
