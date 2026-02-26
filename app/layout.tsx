import type { Metadata } from 'next'
import { Unbounded, Geologica } from 'next/font/google'
import './globals.css'

const unbounded = Unbounded({
  subsets: ['latin', 'cyrillic'],
  weight: ['400', '700', '900'],
  variable: '--font-unbounded',
  display: 'swap',
})

const geologica = Geologica({
  subsets: ['latin', 'cyrillic'],
  weight: ['300', '400', '500'],
  variable: '--font-geologica',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'CardAI — Генератор карточек для WB и Ozon',
  description: 'Автоматическая генерация SEO-оптимизированных карточек товаров для Wildberries и Ozon',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className={`${unbounded.variable} ${geologica.variable}`}>
      <body>{children}</body>
    </html>
  )
}
