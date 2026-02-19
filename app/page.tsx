import { redirect } from 'next/navigation'
import { getCurrentSession } from '@/lib/session'
import DashboardClient from './dashboard/DashboardClient'

export default async function Home() {
  const session = await getCurrentSession()
  // Показываем дашборд всем — авторизация нужна только для генерации
  return <DashboardClient phone={session?.phone ?? ''} />
}
