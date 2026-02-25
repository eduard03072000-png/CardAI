'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { Platform, ProductForm, GenerateResult, QueueItem, HistoryItem } from '@/lib/types'
import { exportToCsv, exportToExcel } from '@/lib/excel'

type Tab = 'result' | 'seo' | 'variants'
type Section = 'generator' | 'history' | 'plans'

interface PlanInfo { id: string; name: string; dailyLimit: number; historyDays: number }
interface ServerHistoryItem {
  id: string
  platform: string
  productName: string
  category: string
  input?: {
    specs?: string
    notes?: string
    brand?: string
    color?: string
    sizes?: string
    material?: string
    country?: string
    price?: string
    discount?: string
    gender?: string
    season?: string
    nds?: string
    barcode?: string
    weightG?: string
  }
  result: GenerateResult
  createdAt: string
}
interface TeamMember { id: string; email: string; role: 'admin' | 'editor'; status: 'active'; createdAt: string }
interface CardTemplate {
  id: string
  name: string
  tone: string
  structure: string
  length: 'short' | 'medium' | 'long'
  keyPhrases: string
}
interface SubscriptionCabinet {
  plan: {
    id: string
    name: string
    price: number
    dailyLimit: number
    historyDays: number
    platforms: string[]
    features: string[]
    expiresAt: string | null
  }
  usage: {
    todayCount: number
    remainingToday: number
  }
  subscription: {
    status: 'active' | 'cancelled'
    autoRenew: boolean
    nextBillingAt: string | null
    currentPlanId: string
  }
  payments: Array<{ id: string; planId: string; amount: number; type: string; createdAt: string }>
}

const STEPS = ['Анализ фотографий', 'Распознавание характеристик', 'Подбор ключевых слов', 'Генерация описания', 'SEO-оптимизация']

const CATEGORIES = [
  'Обувь / Кроссовки', 'Обувь / Ботинки', 'Обувь / Сапоги',
  'Одежда / Верхняя одежда', 'Одежда / Платья', 'Одежда / Джинсы', 'Одежда / Футболки',
  'Электроника / Наушники', 'Электроника / Смартфоны',
  'Дом и сад / Мебель', 'Красота / Уход за лицом',
  'Детские товары', 'Спорт / Тренажёры', 'Аксессуары / Сумки',
]

const DEFAULT_FORM: ProductForm = {
  productName: '', brand: '', category: 'Обувь / Кроссовки',
  price: '', color: '', sizes: '', material: '', country: '', specs: '', notes: '', vendorCode: '',
  discount: '', gender: '', season: '', stock: '',
  nds: 'Не облагается', barcode: '', weightG: '', dimLength: '', dimWidth: '', dimHeight: '',
  photoUrl: '', installment: 'Нет', reviewPoints: 'Нет', vendorCodeOzon: '',
}

const DEMO_FORM: ProductForm = {
  productName: 'Кроссовки мужские Air Runner',
  brand: 'CardAI Demo',
  category: 'Обувь / Кроссовки',
  price: '3490',
  color: 'Белый / Чёрный',
  sizes: '40, 41, 42, 43, 44, 45',
  material: 'Сетка, искусственная замша',
  country: 'Китай',
  specs: 'подошва: EVA; застёжка: шнурки; стелька: ортопедическая; высота подошвы: 3 см; тип носка: круглый',
  notes: 'Универсальные кроссовки для города и лёгких тренировок',
  vendorCode: 'DEMO-AIR-001',
  discount: '30',
  gender: 'Мужской',
  season: 'Весна-осень',
  stock: '120',
  nds: 'Не облагается',
  barcode: '',
  weightG: '',
  dimLength: '',
  dimWidth: '',
  dimHeight: '',
  photoUrl: '',
  installment: 'Нет',
  reviewPoints: 'Нет',
  vendorCodeOzon: '',
}

const DEMO_RESULT: GenerateResult = {
  title: 'Кроссовки мужские Air Runner, дышащая сетка и замша, подошва EVA, размеры 40–45',
  description:
    'Лёгкие мужские кроссовки Air Runner для города и тренировок. Верх из комбинации воздухопроницаемой сетки и мягкой искусственной замши обеспечивает комфорт в течение всего дня, а амортизирующая подошва EVA снижает ударную нагрузку на суставы.\n\n' +
    'Подходят для повседневной носки, прогулок, работы и лёгкого фитнеса. Ортопедическая стелька поддерживает свод стопы, снижая усталость к концу дня. Универсальный чёрно‑белый цвет легко сочетается с джоггерами, джинсами и спортивными костюмами.\n\n' +
    'Уход: протирайте обувь влажной губкой, избегайте агрессивных чистящих средств. Сушите при комнатной температуре вдали от батарей.',
  keywords: [
    'кроссовки мужские',
    'кроссовки для города',
    'обувь на каждый день',
    'кроссовки с сеткой',
    'подошва eva',
  ],
  attributes:
    '• Материал верха: сетка, искусственная замша\n' +
    '• Подошва: EVA, амортизирующая\n' +
    '• Цвет: белый / чёрный\n' +
    '• Размеры: 40, 41, 42, 43, 44, 45\n' +
    '• Тип застёжки: шнурки\n' +
    '• Сезон: весна–осень\n' +
    '• Назначение: повседневная носка, прогулки, лёгкие тренировки',
  variants: [
    'Кроссовки мужские Air Runner, сетка и замша, лёгкие кроссы для города и спорта, размеры 40–45',
    'Мужские кроссовки Air Runner на каждый день, дышащие, амортизирующая подошва EVA, универсальный чёрно‑белый цвет',
    'Кроссовки мужские для города и фитнеса Air Runner, ортопедическая стелька, сетчатый верх, размеры 40–45',
  ],
  seoScore: {
    total: 84,
    title: 85,
    description: 82,
    keywords: 86,
  },
  tips: [
    { type: 'ok', text: 'В заголовке есть ключевые слова и конкретика по материалам и назначению.' },
    { type: 'ok', text: 'Описание раскрывает пользу для покупателя и сценарии использования.' },
    { type: 'warn', text: 'Добавьте реальные отзывы и фото на ноге, чтобы повысить конверсию.' },
  ],
}

const DEMO_IMAGE_DATA_URL =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 400'><rect width='400' height='400' fill='%2312121a'/><rect x='40' y='220' width='320' height='90' rx='18' fill='%232a2a3d'/><circle cx='120' cy='285' r='18' fill='%23ffffff'/><circle cx='280' cy='285' r='18' fill='%23ffffff'/><path d='M60 230 Q140 150 260 150 L340 210 L340 240 L60 240 Z' fill='%23ff4d6d'/><text x='50%' y='70' fill='%23f0f0f8' font-size='26' text-anchor='middle' dominant-baseline='middle' font-family='system-ui, -apple-system, BlinkMacSystemFont, sans-serif'>DEMO Air Runner</text></svg>"

interface UploadedImage { id: string; name: string; dataUrl: string }

export default function DashboardClient({ phone }: { phone: string }) {
  const router = useRouter()
  const [section, setSection] = useState<Section>('generator')
  const [platform, setPlatform] = useState<Platform>('wb')
  const [form, setForm] = useState<ProductForm>(DEFAULT_FORM)
  const [images, setImages] = useState<UploadedImage[]>([])
  const [dragging, setDragging] = useState(false)
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(-1)
  const [result, setResult] = useState<GenerateResult | null>(null)
  const [tab, setTab] = useState<Tab>('result')
  const [copied, setCopied] = useState('')
  const [error, setError] = useState('')
  const [queue, setQueue] = useState<QueueItem[]>([])
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [serverHistory, setServerHistory] = useState<ServerHistoryItem[]>([])
  const [planInfo, setPlanInfo] = useState<PlanInfo>({ id: 'seller', name: 'Продавец', dailyLimit: 5, historyDays: 0 })
  const [todayCount, setTodayCount] = useState(0)
  const [addedFeedback, setAddedFeedback] = useState(false)
  const [templates, setTemplates] = useState<CardTemplate[]>([])
  const [templateName, setTemplateName] = useState('')
  const [templateStyle, setTemplateStyle] = useState<{ tone: string; structure: string; length: 'short' | 'medium' | 'long'; keyPhrases: string }>({
    tone: '',
    structure: '',
    length: 'medium',
    keyPhrases: '',
  })
  const [batchCsvFile, setBatchCsvFile] = useState<File | null>(null)
  const [batchRunning, setBatchRunning] = useState(false)
  const [batchProgress, setBatchProgress] = useState({ total: 0, processed: 0, success: 0, failed: 0 })
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionCabinet | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const setF = (updates: Partial<ProductForm>) => setForm(prev => ({ ...prev, ...updates }))

  async function loadAccountData() {
    if (!phone) return
    const [historyRes, templatesRes, subscriptionRes] = await Promise.all([
      fetch('/api/history'),
      fetch('/api/templates'),
      fetch('/api/subscription'),
    ])
    const historyData = await historyRes.json().catch(() => ({}))
    if (historyData.ok) {
      setServerHistory(historyData.history || [])
      setPlanInfo(historyData.plan || planInfo)
      setTodayCount(historyData.todayCount || 0)
      setHistory((historyData.history || []).map((h: ServerHistoryItem) => ({
        id: h.id,
        platform: h.platform as Platform,
        title: h.result?.title || h.productName,
        date: new Date(h.createdAt).toLocaleDateString('ru'),
      })))
    }
    const templatesData = await templatesRes.json().catch(() => ({}))
    if (templatesData.ok) setTemplates(templatesData.templates || [])
    const subscriptionDataRes = await subscriptionRes.json().catch(() => ({}))
    if (subscriptionDataRes.ok) setSubscriptionData(subscriptionDataRes)
  }

  // ── Load data on mount ────────────────────────────────────────
  useEffect(() => {
    loadAccountData().catch(() => {})
  }, [phone])

  // ── Images ────────────────────────────────────────────────────
  function fileToDataUrl(file: File): Promise<string> {
    return new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result as string); r.onerror = rej; r.readAsDataURL(file) })
  }
  async function addFiles(files: FileList | File[]) {
    const arr = Array.from(files).filter(f => f.type.startsWith('image/')).slice(0, 15 - images.length)
    const newImgs: UploadedImage[] = []
    for (const f of arr) {
      try { newImgs.push({ id: Math.random().toString(36).slice(2), name: f.name, dataUrl: await fileToDataUrl(f) }) } catch {}
    }
    setImages(prev => [...prev, ...newImgs])
  }
  const onDrop = useCallback(async (e: React.DragEvent) => { e.preventDefault(); setDragging(false); await addFiles(e.dataTransfer.files) }, [images])

  // ── Generate ──────────────────────────────────────────────────
  async function generate() {
    if (!phone) { router.push('/login'); return }
    setLoading(true); setStep(0); setResult(null); setError('')
    for (let i = 0; i < STEPS.length; i++) { setStep(i); await new Promise(r => setTimeout(r, i < 2 ? 400 : 600)) }
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform,
          productName: form.productName, specs: form.specs, category: form.category, notes: form.notes,
          brand: form.brand, color: form.color, sizes: form.sizes, material: form.material,
          country: form.country, price: form.price, discount: form.discount,
          gender: form.gender, season: form.season, nds: form.nds,
          barcode: form.barcode, weightG: form.weightG,
          images: images.map(i => i.dataUrl),
          templateStyle,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setResult(data.data)
      setTab('result')
      // Обновляем счётчик и историю из meta
      if (data.meta) {
        setTodayCount(data.meta.todayCount || todayCount + 1)
      }
      setHistory(prev => [{ id: Date.now(), platform, title: data.data.title, date: new Date().toLocaleDateString('ru') }, ...prev])
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Ошибка')
    } finally { setLoading(false); setStep(-1) }
  }

  async function saveTemplate() {
    const name = templateName.trim()
    if (!name) {
      setError('Введите название шаблона')
      return
    }
    const res = await fetch('/api/templates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, ...templateStyle }),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error || 'Не удалось сохранить шаблон')
      return
    }
    setTemplateName('')
    setTemplates((prev) => [data.template, ...prev])
  }

  function applyTemplate(tplId: string) {
    const tpl = templates.find((t) => t.id === tplId)
    if (!tpl) return
    setTemplateStyle({
      tone: tpl.tone || '',
      structure: tpl.structure || '',
      length: tpl.length || 'medium',
      keyPhrases: tpl.keyPhrases || '',
    })
  }

  function parseCsv(content: string): Array<Record<string, string>> {
    const lines = content.replace(/\r/g, '').split('\n').filter(Boolean)
    if (lines.length < 2) return []
    const split = (line: string) => line.split(',').map((v) => v.trim().replace(/^"(.*)"$/, '$1'))
    const headers = split(lines[0]).map((h) => h.toLowerCase())
    return lines.slice(1).map((line) => {
      const cells = split(line)
      const row: Record<string, string> = {}
      headers.forEach((h, i) => { row[h] = cells[i] || '' })
      return row
    })
  }

  async function runBatchFromCsv() {
    if (!batchCsvFile) return
    const text = await batchCsvFile.text()
    const rows = parseCsv(text)
    if (rows.length === 0) {
      setError('CSV пуст или неверный формат')
      return
    }

    setBatchRunning(true)
    setBatchProgress({ total: rows.length, processed: 0, success: 0, failed: 0 })
    setError('')

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      const payload = {
        platform: (row.platform || platform || 'wb').toLowerCase(),
        productName: row.productname || row.product_name || '',
        category: row.category || '',
        specs: row.specs || '',
        notes: row.notes || '',
        brand: row.brand || '',
        color: row.color || '',
        sizes: row.sizes || '',
        material: row.material || '',
        country: row.country || '',
        price: row.price || '',
        discount: row.discount || '',
        gender: row.gender || '',
        season: row.season || '',
        nds: row.nds || '',
        barcode: row.barcode || '',
        weightG: row.weightg || '',
        images: [],
        templateStyle,
      }
      try {
        const res = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Ошибка генерации')
        setQueue((prev) => [...prev, {
          id: Date.now() + i,
          platform: payload.platform as Platform,
          form: { ...DEFAULT_FORM, ...payload, productName: payload.productName } as ProductForm,
          result: data.data,
        }])
        setBatchProgress((prev) => ({ ...prev, processed: prev.processed + 1, success: prev.success + 1 }))
      } catch {
        setBatchProgress((prev) => ({ ...prev, processed: prev.processed + 1, failed: prev.failed + 1 }))
      }
    }
    setBatchRunning(false)
    loadAccountData().catch(() => {})
  }

  function loadDemo() {
    setPlatform('wb')
    setForm(DEMO_FORM)
    setImages([
      {
        id: 'demo',
        name: 'demo-air-runner.svg',
        dataUrl: DEMO_IMAGE_DATA_URL,
      },
    ])
    setResult(DEMO_RESULT)
    setTab('result')
    setError('')
  }

  // ── Queue ─────────────────────────────────────────────────────
  function addToQueue() {
    if (!result) return
    setQueue(prev => [...prev, { id: Date.now(), platform, form: { ...form }, result }])
    setAddedFeedback(true)
    setTimeout(() => setAddedFeedback(false), 1800)
  }

  async function logout() { await fetch('/api/auth/logout', { method: 'POST' }); router.push('/login') }
  function copy(text: string, key: string) { navigator.clipboard.writeText(text); setCopied(key); setTimeout(() => setCopied(''), 2000) }

  const scoreColor = (s: number) => s >= 75 ? '#22d3a0' : s >= 55 ? '#ffc700' : '#ff4d6d'

  // ── Styles helpers ────────────────────────────────────────────
  const inp: React.CSSProperties = {
    background: '#1c1c28', border: '1px solid #2a2a3d', color: '#f0f0f8',
    fontFamily: 'inherit', borderRadius: '10px', padding: '11px 14px',
    width: '100%', fontSize: '13px', outline: 'none', transition: 'border-color 0.2s',
  }
  const lbl = { display: 'block', fontSize: '11px', fontWeight: 500, color: '#7070a0', textTransform: 'uppercase' as const, letterSpacing: '1px', marginBottom: '6px' }
  const field = { marginBottom: '14px' }

  // ── Platform button ───────────────────────────────────────────
  const pBtn = (p: Platform, label: string, emoji: string) => {
    const colors: Record<Platform, string> = { wb: '#cb11ab', ozon: '#005bff', avito: '#ffc700' }
    const isActive = platform === p
    return (
      <button key={p} onClick={() => setPlatform(p)}
        style={{ flex: 1, padding: '9px', borderRadius: '10px', border: `1px solid ${isActive ? colors[p] : '#2a2a3d'}`,
          background: isActive ? `${colors[p]}20` : 'transparent', color: isActive ? colors[p] : '#7070a0',
          fontFamily: 'inherit', fontSize: '13px', fontWeight: 500, cursor: 'pointer', transition: 'all 0.2s',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
        {emoji} {label}
      </button>
    )
  }

  // ── Focused input handler ─────────────────────────────────────
  const focusBorder = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => (e.target.style.borderColor = '#7c3aed')
  const blurBorder = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => (e.target.style.borderColor = '#2a2a3d')

  // ── PLANS section ─────────────────────────────────────────────
  if (section === 'plans') return <PlansView phone={phone} planInfo={planInfo} onBack={() => setSection('generator')} onLogout={logout} subscriptionData={subscriptionData} onPlanChanged={loadAccountData} />

  // ── HISTORY section ───────────────────────────────────────────
  if (section === 'history') return (
    <HistoryView phone={phone} history={history} records={serverHistory} onBack={() => setSection('generator')}
      onDelete={id => {
        setHistory(prev => prev.filter(i => i.id !== id))
        // Удаляем на сервере если это серверная запись (строковый id)
        if (typeof id === 'string') {
          fetch(`/api/history?id=${id}`, { method: 'DELETE' }).catch(() => {})
        }
      }}
      onReuse={(item) => {
        setPlatform(item.platform as Platform)
        setForm((prev) => ({
          ...prev,
          productName: item.productName || prev.productName,
          category: item.category || prev.category,
          specs: item.input?.specs || prev.specs,
          notes: item.input?.notes || prev.notes,
          brand: item.input?.brand || prev.brand,
          color: item.input?.color || prev.color,
          sizes: item.input?.sizes || prev.sizes,
          material: item.input?.material || prev.material,
          country: item.input?.country || prev.country,
          price: item.input?.price || prev.price,
          discount: item.input?.discount || prev.discount,
          gender: item.input?.gender || prev.gender,
          season: item.input?.season || prev.season,
          nds: item.input?.nds || prev.nds,
          barcode: item.input?.barcode || prev.barcode,
          weightG: item.input?.weightG || prev.weightG,
        }))
        setResult(item.result)
        setTab('result')
        setSection('generator')
      }}
      onLogout={logout} />
  )

  // ── GENERATOR section ─────────────────────────────────────────
  return (
    <div className="min-h-screen" style={{ background: '#0a0a0f' }}>
      <div className="fixed top-0 right-0 pointer-events-none" style={{ width: 400, height: 400, background: 'radial-gradient(circle,rgba(255,77,109,0.07) 0%,transparent 70%)', filter: 'blur(80px)', borderRadius: '50%' }} />
      <div className="fixed bottom-0 left-0 pointer-events-none" style={{ width: 320, height: 320, background: 'radial-gradient(circle,rgba(124,58,237,0.07) 0%,transparent 70%)', filter: 'blur(80px)', borderRadius: '50%' }} />

      {/* Header */}
      <header style={{ display: 'flex', alignItems: 'center', padding: '0 32px', height: 60, borderBottom: '1px solid #2a2a3d', position: 'sticky', top: 0, background: '#0a0a0f', zIndex: 100, gap: 0 }}>
        <div className="font-unbounded font-black text-xl tracking-tighter" style={{ marginRight: 24 }}>
          Card<span style={{ color: '#ff4d6d' }}>AI</span>
        </div>
        <div style={{ display: 'flex', gap: 12, flex: 1 }}>
          {[['#cb11ab', 'WB'], ['#005bff', 'Ozon'], ['#ffc700', 'Авито']].map(([c, n]) => (
            <span key={n} style={{ padding: '5px 13px', borderRadius: 20, fontSize: 12, fontWeight: 500, background: `${c}18`, color: c, border: `1px solid ${c}30` }}>{n}</span>
          ))}
        </div>
        {/* Nav */}
        <nav style={{ display: 'flex', gap: 4, marginRight: 16 }}>
          {([['generator', 'Генератор'], ['history', 'История'], ['plans', 'Тарифы']] as const).map(([s, l]) => (
            <button key={s} onClick={() => setSection(s)}
              style={{ background: section === s ? 'rgba(255,255,255,0.06)' : 'none', border: 'none', borderRadius: 8, padding: '6px 14px', color: section === s ? '#f0f0f8' : '#7070a0', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
              {l}
            </button>
          ))}
        </nav>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {phone ? (
            <>
              <span style={{ fontSize: 13, color: '#7070a0' }}>{phone}</span>
              <button onClick={logout} style={{ fontSize: 12, padding: '6px 12px', background: '#1c1c28', border: '1px solid #2a2a3d', borderRadius: 8, color: '#7070a0', cursor: 'pointer', fontFamily: 'inherit' }}>Выйти</button>
            </>
          ) : (
            <button onClick={() => router.push('/login')} style={{ fontSize: 12, padding: '6px 16px', background: 'linear-gradient(135deg,#ff4d6d,#7c3aed)', border: 'none', borderRadius: 8, color: 'white', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>Войти</button>
          )}
        </div>
      </header>

      {/* Hero */}
      <div style={{ textAlign: 'center', padding: '48px 40px 32px', position: 'relative', zIndex: 2 }}>
        <div style={{ display: 'inline-block', background: 'rgba(255,77,109,0.12)', border: '1px solid rgba(255,77,109,0.3)', color: '#ff4d6d', fontSize: 11, fontWeight: 500, letterSpacing: 2, textTransform: 'uppercase', padding: '6px 16px', borderRadius: 20, marginBottom: 20 }}>
          ✦ AI-генератор карточек товаров
        </div>
        <h1 className="font-unbounded font-black" style={{ fontSize: 'clamp(28px,4vw,52px)', lineHeight: 1.05, letterSpacing: -2, marginBottom: 16 }}>
          Карточки для <em style={{ fontStyle: 'normal', background: 'linear-gradient(135deg,#ff4d6d,#7c3aed)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>WB и Ozon</em><br />за 30 секунд
        </h1>
        <p style={{ color: '#7070a0', fontSize: 16, maxWidth: 520, margin: '0 auto' }}>Заголовок, описание, SEO-ключи и Excel для загрузки — без копирайтера</p>
      </div>

      {/* Main grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, maxWidth: 1200, margin: '0 auto', padding: '0 40px 80px', position: 'relative', zIndex: 2, alignItems: 'start' }}>

        {/* INPUT PANEL */}
        <div style={{ background: '#12121a', border: '1px solid #2a2a3d', borderRadius: 16, overflow: 'hidden' }}>
          <div style={{ padding: '18px 24px', borderBottom: '1px solid #2a2a3d', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,77,109,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>📥</div>
            <span className="font-unbounded font-bold" style={{ fontSize: 13 }}>Данные товара</span>
          </div>
          <div style={{ padding: 24 }}>

            {/* Platform */}
            <div style={field}>
              <label style={lbl}>Платформа</label>
              <div style={{ display: 'flex', gap: 8 }}>{pBtn('wb', 'WB', '🛍')}{pBtn('ozon', 'Ozon', '🔵')}{pBtn('avito', 'Авито', '🟡')}</div>
            </div>

            {/* Photo upload */}
            <div style={field}>
              <label style={lbl}>Фотографии {images.length > 0 && <span style={{ color: '#ff4d6d' }}>({images.length}/15)</span>}</label>
              <div onDrop={onDrop} onDragOver={e => { e.preventDefault(); setDragging(true) }} onDragLeave={() => setDragging(false)}
                onClick={() => fileInputRef.current?.click()}
                style={{ border: `2px dashed ${dragging ? '#ff4d6d' : images.length > 0 ? '#7c3aed' : '#2a2a3d'}`, borderRadius: 12, padding: '24px', textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s' }}>
                <div style={{ fontSize: 24, marginBottom: 6 }}>{dragging ? '📂' : '📸'}</div>
                <div style={{ fontSize: 13, color: '#7070a0' }}><strong style={{ color: '#f0f0f8' }}>Загрузить фото</strong> или перетащи · до 15 шт</div>
              </div>
              <input ref={fileInputRef} type="file" multiple accept="image/*" style={{ display: 'none' }}
                onChange={e => e.target.files && addFiles(e.target.files)} />
              {images.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginTop: 10 }}>
                  {images.map(img => (
                    <div key={img.id} style={{ position: 'relative', aspectRatio: '1', borderRadius: 8, overflow: 'hidden', border: '1px solid #2a2a3d' }}>
                      <img src={img.dataUrl} alt={img.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <button onClick={() => setImages(prev => prev.filter(i => i.id !== img.id))}
                        style={{ position: 'absolute', top: 3, right: 3, width: 18, height: 18, borderRadius: '50%', background: 'rgba(255,77,109,0.9)', border: 'none', color: 'white', cursor: 'pointer', fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Название */}
            <div style={field}>
              <label style={lbl}>Название товара</label>
              <input style={inp} value={form.productName} onChange={e => setF({ productName: e.target.value })}
                placeholder="Кроссовки мужские Nike Air Max 270" onFocus={focusBorder} onBlur={blurBorder} />
            </div>

            {/* Бренд */}
            <div style={field}>
              <label style={lbl}>Бренд</label>
              <input style={inp} value={form.brand} onChange={e => setF({ brand: e.target.value })}
                placeholder="Nike, Zara, NoName..." onFocus={focusBorder} onBlur={blurBorder} />
            </div>

            {/* Категория */}
            <div style={field}>
              <label style={lbl}>Категория</label>
              <select style={{ ...inp, appearance: 'none' }} value={form.category} onChange={e => setF({ category: e.target.value })} onFocus={focusBorder} onBlur={blurBorder}>
                {CATEGORIES.map(c => <option key={c} style={{ background: '#1c1c28' }}>{c}</option>)}
              </select>
            </div>

            {/* Цена */}
            <div style={field}>
              <label style={lbl}>{platform === 'ozon' ? 'Цена (₽)' : 'Цена до скидки (₽)'}</label>
              <input style={inp} type="number" value={form.price} onChange={e => setF({ price: e.target.value })}
                placeholder="3490" onFocus={focusBorder} onBlur={blurBorder} />
            </div>

            {/* WB/Авито: скидка, пол, сезон */}
            {platform !== 'ozon' && (<>
              <div style={field}>
                <label style={lbl}>Скидка (%)</label>
                <input style={inp} type="number" value={form.discount} onChange={e => setF({ discount: e.target.value })}
                  placeholder="30" min={0} max={90} onFocus={focusBorder} onBlur={blurBorder} />
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <div style={{ ...field, flex: 1 }}>
                  <label style={lbl}>Пол</label>
                  <select style={{ ...inp, appearance: 'none' }} value={form.gender} onChange={e => setF({ gender: e.target.value })} onFocus={focusBorder} onBlur={blurBorder}>
                    <option value="">Не указан</option><option>Мужской</option><option>Женский</option><option>Унисекс</option><option>Детский</option>
                  </select>
                </div>
                <div style={{ ...field, flex: 1 }}>
                  <label style={lbl}>Сезон</label>
                  <select style={{ ...inp, appearance: 'none' }} value={form.season} onChange={e => setF({ season: e.target.value })} onFocus={focusBorder} onBlur={blurBorder}>
                    <option value="">Не указан</option><option>Весна-осень</option><option>Лето</option><option>Зима</option><option>Круглогодичный</option>
                  </select>
                </div>
              </div>
            </>)}

            {/* Ozon: НДС */}
            {platform === 'ozon' && (<>
              <div style={field}>
                <label style={lbl}>НДС <span style={{ color: '#ff6b6b', fontSize: 10, textTransform: 'none', letterSpacing: 0 }}>обязательно</span></label>
                <select style={{ ...inp, appearance: 'none' }} value={form.nds} onChange={e => setF({ nds: e.target.value })} onFocus={focusBorder} onBlur={blurBorder}>
                  <option>Не облагается</option><option value="10%">10%</option><option value="22%">22%</option>
                </select>
              </div>
              <div style={field}>
                <label style={lbl}>Штрихкод / EAN <span style={{ color: '#7070a0', fontSize: 10, textTransform: 'none', letterSpacing: 0, fontWeight: 400 }}>обязателен для FBO</span></label>
                <input style={inp} value={form.barcode} onChange={e => setF({ barcode: e.target.value })}
                  placeholder="4600000000000" onFocus={focusBorder} onBlur={blurBorder} />
              </div>
            </>)}

            {/* Общие: цвет, размеры */}
            <div style={field}>
              <label style={lbl}>Цвет</label>
              <input style={inp} value={form.color} onChange={e => setF({ color: e.target.value })}
                placeholder="Белый/Чёрный" onFocus={focusBorder} onBlur={blurBorder} />
            </div>
            <div style={field}>
              <label style={lbl}>Размеры</label>
              <input style={inp} value={form.sizes} onChange={e => setF({ sizes: e.target.value })}
                placeholder="40, 41, 42, 43, 44, 45" onFocus={focusBorder} onBlur={blurBorder} />
            </div>

            {/* Материал + страна */}
            <div style={{ display: 'flex', gap: 10 }}>
              <div style={{ ...field, flex: 1.5 }}>
                <label style={lbl}>Материал</label>
                <input style={inp} value={form.material} onChange={e => setF({ material: e.target.value })}
                  placeholder="Сетка, замша" onFocus={focusBorder} onBlur={blurBorder} />
              </div>
              <div style={{ ...field, flex: 1 }}>
                <label style={lbl}>Страна</label>
                <input style={inp} value={form.country} onChange={e => setF({ country: e.target.value })}
                  placeholder="Китай" onFocus={focusBorder} onBlur={blurBorder} />
              </div>
            </div>

            {/* Ozon: габариты */}
            {platform === 'ozon' && (<>
              <div style={{ display: 'flex', gap: 10 }}>
                <div style={{ ...field, flex: 1 }}>
                  <label style={lbl}>Вес упак., г <span style={{ color: '#ff6b6b' }}>*</span></label>
                  <input style={inp} type="number" value={form.weightG} onChange={e => setF({ weightG: e.target.value })} placeholder="500" onFocus={focusBorder} onBlur={blurBorder} />
                </div>
                <div style={{ ...field, flex: 1 }}>
                  <label style={lbl}>Длина, мм <span style={{ color: '#ff6b6b' }}>*</span></label>
                  <input style={inp} type="number" value={form.dimLength} onChange={e => setF({ dimLength: e.target.value })} placeholder="320" onFocus={focusBorder} onBlur={blurBorder} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <div style={{ ...field, flex: 1 }}>
                  <label style={lbl}>Ширина, мм <span style={{ color: '#ff6b6b' }}>*</span></label>
                  <input style={inp} type="number" value={form.dimWidth} onChange={e => setF({ dimWidth: e.target.value })} placeholder="200" onFocus={focusBorder} onBlur={blurBorder} />
                </div>
                <div style={{ ...field, flex: 1 }}>
                  <label style={lbl}>Высота, мм <span style={{ color: '#ff6b6b' }}>*</span></label>
                  <input style={inp} type="number" value={form.dimHeight} onChange={e => setF({ dimHeight: e.target.value })} placeholder="120" onFocus={focusBorder} onBlur={blurBorder} />
                </div>
              </div>
              <div style={field}>
                <label style={lbl}>Ссылка на фото <span style={{ color: '#7070a0', fontSize: 10, textTransform: 'none', letterSpacing: 0, fontWeight: 400 }}>JPEG/PNG или Яндекс.Диск</span></label>
                <input style={inp} value={form.photoUrl} onChange={e => setF({ photoUrl: e.target.value })} placeholder="https://..." onFocus={focusBorder} onBlur={blurBorder} />
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <div style={{ ...field, flex: 1 }}>
                  <label style={lbl}>Рассрочка</label>
                  <select style={{ ...inp, appearance: 'none' }} value={form.installment} onChange={e => setF({ installment: e.target.value })} onFocus={focusBorder} onBlur={blurBorder}>
                    <option>Нет</option><option>Да</option>
                  </select>
                </div>
                <div style={{ ...field, flex: 1 }}>
                  <label style={lbl}>Баллы за отзывы</label>
                  <select style={{ ...inp, appearance: 'none' }} value={form.reviewPoints} onChange={e => setF({ reviewPoints: e.target.value })} onFocus={focusBorder} onBlur={blurBorder}>
                    <option>Нет</option><option>Да</option>
                  </select>
                </div>
              </div>
              <div style={field}>
                <label style={lbl}>Артикул продавца <span style={{ color: '#ff6b6b' }}>*</span></label>
                <input style={inp} value={form.vendorCodeOzon} onChange={e => setF({ vendorCodeOzon: e.target.value })} placeholder="SHOES-AIR-001" onFocus={focusBorder} onBlur={blurBorder} />
              </div>
            </>)}

            {/* WB/Авито: остаток + артикул */}
            {platform !== 'ozon' && (
              <div style={{ display: 'flex', gap: 10 }}>
                <div style={{ ...field, flex: 1 }}>
                  <label style={lbl}>Остаток (шт)</label>
                  <input style={inp} type="number" value={form.stock} onChange={e => setF({ stock: e.target.value })} placeholder="100" onFocus={focusBorder} onBlur={blurBorder} />
                </div>
                <div style={{ ...field, flex: 1.5 }}>
                  <label style={lbl}>Артикул продавца</label>
                  <input style={inp} value={form.vendorCode} onChange={e => setF({ vendorCode: e.target.value })} placeholder="SHOES-AIR-001" onFocus={focusBorder} onBlur={blurBorder} />
                </div>
              </div>
            )}

            {/* Характеристики + заметки */}
            <div style={field}>
              <label style={lbl}>Доп. характеристики</label>
              <textarea style={{ ...inp, resize: 'none', minHeight: 72 }} value={form.specs} onChange={e => setF({ specs: e.target.value })}
                placeholder="подошва: EVA, застёжка: шнурки..." onFocus={focusBorder} onBlur={blurBorder} />
            </div>
            <div style={field}>
              <label style={lbl}>Заметки для AI</label>
              <input style={inp} value={form.notes} onChange={e => setF({ notes: e.target.value })}
                placeholder="Целевая аудитория, УТП..." onFocus={focusBorder} onBlur={blurBorder} />
            </div>

            {/* Шаблон стиля */}
            <div style={{ ...field, background: '#161622', border: '1px solid #2a2a3d', borderRadius: 12, padding: 12 }}>
              <label style={{ ...lbl, marginBottom: 10 }}>Шаблон карточки (мой стиль)</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
                <input style={inp} value={templateStyle.tone} onChange={(e) => setTemplateStyle((p) => ({ ...p, tone: e.target.value }))} placeholder="Тон: экспертный / дружелюбный..." />
                <select style={{ ...inp, appearance: 'none' }} value={templateStyle.length} onChange={(e) => setTemplateStyle((p) => ({ ...p, length: e.target.value as 'short' | 'medium' | 'long' }))}>
                  <option value="short">Коротко</option>
                  <option value="medium">Средне</option>
                  <option value="long">Подробно</option>
                </select>
              </div>
              <input style={{ ...inp, marginBottom: 8 }} value={templateStyle.structure} onChange={(e) => setTemplateStyle((p) => ({ ...p, structure: e.target.value }))} placeholder="Структура: выгоды -> характеристики -> призыв" />
              <input style={{ ...inp, marginBottom: 8 }} value={templateStyle.keyPhrases} onChange={(e) => setTemplateStyle((p) => ({ ...p, keyPhrases: e.target.value }))} placeholder="Ключевые фразы через запятую" />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 8 }}>
                <input style={inp} value={templateName} onChange={(e) => setTemplateName(e.target.value)} placeholder="Название шаблона" />
                <button onClick={saveTemplate} type="button" style={{ background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.35)', borderRadius: 8, color: '#a78bfa', padding: '0 10px', fontFamily: 'inherit', cursor: 'pointer' }}>Сохранить</button>
                <select style={{ ...inp, minWidth: 160 }} onChange={(e) => applyTemplate(e.target.value)} defaultValue="">
                  <option value="" disabled>Выбрать шаблон</option>
                  {templates.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
            </div>

            {/* Счётчик лимита */}
            {phone && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, padding: '10px 14px', background: '#1c1c28', border: '1px solid #2a2a3d', borderRadius: 10 }}>
                <div style={{ fontSize: 12, color: '#7070a0' }}>
                  Тариф: <span style={{ color: '#f0f0f8', fontWeight: 600 }}>{planInfo.name}</span>
                </div>
                <div style={{ fontSize: 12 }}>
                  <span style={{ color: todayCount >= planInfo.dailyLimit ? '#ff4d6d' : '#22d3a0', fontWeight: 700 }}>{todayCount}</span>
                  <span style={{ color: '#7070a0' }}> / {planInfo.dailyLimit >= 999999 ? '∞' : planInfo.dailyLimit} сегодня</span>
                </div>
              </div>
            )}

            {error && <p style={{ color: '#ff4d6d', background: 'rgba(255,77,109,0.08)', border: '1px solid rgba(255,77,109,0.2)', borderRadius: 8, padding: '10px 14px', fontSize: 13, marginBottom: 14 }}>{error}</p>}

            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={generate} disabled={loading || !form.productName}
                className="font-unbounded font-bold"
                style={{ flex: 1, padding: 16, background: 'linear-gradient(135deg,#ff4d6d,#7c3aed)', border: 'none', borderRadius: 12, color: 'white', fontSize: 13, cursor: form.productName ? 'pointer' : 'not-allowed', transition: 'all 0.2s', letterSpacing: -0.3, opacity: loading || !form.productName ? 0.5 : 1 }}>
                {loading ? '⟳ Генерирую...' : !phone ? '🔐 Войдите, чтобы сгенерировать' : images.length > 0 ? '✦ Анализировать фото и создать карточку' : '✦ Сгенерировать карточку'}
              </button>
              <button onClick={() => { setForm(DEFAULT_FORM); setImages([]); setResult(null); setError('') }}
                title="Очистить все поля"
                style={{ padding: '16px 18px', background: '#1c1c28', border: '1px solid #2a2a3d', borderRadius: 12, color: '#7070a0', fontSize: 16, cursor: 'pointer', transition: 'all 0.2s', flexShrink: 0 }}
                onMouseOver={e => { e.currentTarget.style.borderColor = '#ff4d6d'; e.currentTarget.style.color = '#ff4d6d' }}
                onMouseOut={e => { e.currentTarget.style.borderColor = '#2a2a3d'; e.currentTarget.style.color = '#7070a0' }}>
                🗑
              </button>
            </div>
            {!result && (
              <button
                type="button"
                onClick={loadDemo}
                style={{
                  marginTop: 10,
                  width: '100%',
                  padding: 10,
                  background: 'none',
                  border: '1px dashed #2a2a3d',
                  borderRadius: 10,
                  color: '#7070a0',
                  fontSize: 12,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                Создать демо по шаблону (без входа)
              </button>
            )}
          </div>
        </div>

        {/* OUTPUT PANEL */}
        <div style={{ background: '#12121a', border: '1px solid #2a2a3d', borderRadius: 16, overflow: 'hidden', position: 'sticky', top: 68, maxHeight: 'calc(100vh - 88px)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '18px 24px', borderBottom: '1px solid #2a2a3d', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(124,58,237,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✨</div>
            <span className="font-unbounded font-bold" style={{ fontSize: 13 }}>Готовая карточка</span>
            {result && <span style={{ marginLeft: 'auto', fontSize: 11, padding: '4px 10px', borderRadius: 20, background: 'rgba(34,211,160,0.1)', color: '#22d3a0', border: '1px solid rgba(34,211,160,0.2)' }}>✓ Готово</span>}
          </div>

          {result && (
            <div style={{ display: 'flex', borderBottom: '1px solid #2a2a3d', padding: '0 24px' }}>
              {(['result', 'seo', 'variants'] as Tab[]).map(t => (
                <button key={t} onClick={() => setTab(t)}
                  style={{ padding: '14px 14px', fontSize: 13, fontWeight: 500, background: 'none', border: 'none', borderBottom: `2px solid ${tab === t ? '#ff4d6d' : 'transparent'}`, color: tab === t ? '#f0f0f8' : '#7070a0', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s' }}>
                  {t === 'result' ? 'Карточка' : t === 'seo' ? 'SEO-анализ' : '3 заголовка'}
                </button>
              ))}
            </div>
          )}

          <div style={{ padding: 24, flex: 1, overflowY: 'auto' }}>
            {/* Empty */}
            {!loading && !result && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 400, textAlign: 'center' }}>
                <div style={{ fontSize: 48, opacity: 0.3, marginBottom: 16 }}>✦</div>
                <h3 className="font-unbounded font-bold" style={{ fontSize: 15, marginBottom: 8 }}>Ждём команды</h3>
                <p style={{ fontSize: 13, color: '#7070a0' }}>Заполни форму слева и нажми «Сгенерировать»</p>
              </div>
            )}

            {/* Loader */}
            {loading && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 400, gap: 20 }}>
                <div style={{ width: 44, height: 44, border: '3px solid #2a2a3d', borderTopColor: '#ff4d6d', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {STEPS.map((s, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: i < step ? '#22d3a0' : i === step ? '#f0f0f8' : '#3a3a5a' }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0, background: i < step ? '#22d3a0' : i === step ? '#ff4d6d' : '#2a2a3d' }} />
                      {s}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {result && tab === 'result' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {/* Price */}
                {form.price && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#1c1c28', border: '1px solid #2a2a3d', borderRadius: 10, padding: '10px 14px' }}>
                    <span className="font-unbounded font-black" style={{ fontSize: 22 }}>
                      {platform !== 'ozon' && form.discount ? Math.round(parseFloat(form.price) * (1 - parseFloat(form.discount) / 100)).toLocaleString('ru') : parseFloat(form.price).toLocaleString('ru')} ₽
                    </span>
                    {platform !== 'ozon' && form.discount && <>
                      <span style={{ fontSize: 13, color: '#7070a0', textDecoration: 'line-through' }}>{parseFloat(form.price).toLocaleString('ru')} ₽</span>
                      <span style={{ background: 'rgba(255,77,109,0.15)', color: '#ff4d6d', fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 6 }}>−{form.discount}%</span>
                    </>}
                  </div>
                )}
                <RBlock label="Заголовок карточки" extra={`${result.title.length} симв`} onCopy={() => copy(result.title, 'title')} copied={copied === 'title'}>
                  <p className="font-unbounded font-bold" style={{ fontSize: 13, lineHeight: 1.4 }}>{result.title}</p>
                </RBlock>
                <RBlock label="Описание" onCopy={() => copy(result.description, 'desc')} copied={copied === 'desc'}>
                  <p style={{ fontSize: 13, lineHeight: 1.6, color: '#d0d0e8', whiteSpace: 'pre-line' }}>{result.description}</p>
                </RBlock>
                <RBlock label="Ключевые слова">
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                    {result.keywords.map((k, i) => <span key={i} style={{ background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.25)', color: '#a78bfa', padding: '4px 10px', borderRadius: 6, fontSize: 12 }}>{k}</span>)}
                  </div>
                </RBlock>
                <RBlock label="Характеристики" onCopy={() => copy(result.attributes, 'attr')} copied={copied === 'attr'}>
                  <p style={{ fontSize: 13, color: '#d0d0e8' }}>{result.attributes}</p>
                </RBlock>
              </div>
            )}

            {result && tab === 'seo' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, background: `rgba(${result.seoScore.total >= 75 ? '34,211,160' : result.seoScore.total >= 55 ? '255,199,0' : '255,77,109'},0.06)`, border: `1px solid rgba(${result.seoScore.total >= 75 ? '34,211,160' : result.seoScore.total >= 55 ? '255,199,0' : '255,77,109'},0.2)`, borderRadius: 12, padding: '16px 20px' }}>
                  <div style={{ position: 'relative', width: 56, height: 56, flexShrink: 0 }}>
                    <svg style={{ width: 56, height: 56, transform: 'rotate(-90deg)' }} viewBox="0 0 56 56">
                      <circle cx="28" cy="28" r="24" fill="none" stroke="#2a2a3d" strokeWidth="4" />
                      <circle cx="28" cy="28" r="24" fill="none" stroke={scoreColor(result.seoScore.total)} strokeWidth="4"
                        strokeDasharray={`${(result.seoScore.total / 100) * 150.8} 150.8`} strokeLinecap="round" />
                    </svg>
                    <div className="font-unbounded font-black" style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: scoreColor(result.seoScore.total) }}>{result.seoScore.total}</div>
                  </div>
                  <div>
                    <div className="font-unbounded font-bold" style={{ fontSize: 13, color: scoreColor(result.seoScore.total), marginBottom: 4 }}>
                      {result.seoScore.total >= 75 ? 'Хороший результат' : result.seoScore.total >= 55 ? 'Можно улучшить' : 'Требует доработки'}
                    </div>
                    <p style={{ fontSize: 12, color: '#7070a0' }}>SEO-оценка для {platform.toUpperCase()}</p>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
                  {[['Заголовок', result.seoScore.title], ['Описание', result.seoScore.description], ['Ключи', result.seoScore.keywords]].map(([l, v]) => (
                    <div key={l} style={{ background: '#1c1c28', border: '1px solid #2a2a3d', borderRadius: 10, padding: 12, textAlign: 'center' }}>
                      <div className="font-unbounded font-black" style={{ fontSize: 20, color: scoreColor(v as number), marginBottom: 2 }}>{v}</div>
                      <div style={{ fontSize: 11, color: '#7070a0' }}>{l}</div>
                    </div>
                  ))}
                </div>
                <RBlock label="Рекомендации">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
                    {result.tips.map((t, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13 }}>
                        <span>{t.type === 'ok' ? '✅' : t.type === 'warn' ? '⚠️' : '❌'}</span>
                        <span style={{ color: '#d0d0e8' }}>{t.text}</span>
                      </div>
                    ))}
                  </div>
                </RBlock>
              </div>
            )}

            {result && tab === 'variants' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <p style={{ fontSize: 13, color: '#7070a0', marginBottom: 4 }}>3 варианта заголовка под разные стратегии</p>
                {result.variants.map((v, i) => (
                  <RBlock key={i} label={['🎯 Акцент на характеристики', '💎 Акцент на пользу', '🔥 Максимум ключей'][i] || `Вариант ${i + 1}`}
                    onCopy={() => copy(v, `v${i}`)} copied={copied === `v${i}`}>
                    <p className="font-unbounded font-bold" style={{ fontSize: 12, lineHeight: 1.4 }}>{v}</p>
                  </RBlock>
                ))}
              </div>
            )}

            {/* Add to Excel */}
            {result && (
              <button onClick={addToQueue}
                style={{ width: '100%', padding: 13, marginTop: 16, background: addedFeedback ? 'rgba(34,211,160,0.2)' : 'rgba(34,211,160,0.08)', border: `1px solid ${addedFeedback ? '#22d3a0' : 'rgba(34,211,160,0.3)'}`, borderRadius: 12, color: '#22d3a0', fontFamily: 'inherit', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                className="font-unbounded font-bold text-xs">
                {addedFeedback ? `✓ Добавлено (${queue.length} в таблице)` : queue.length > 0 ? '➕ Добавить ещё одну в Excel' : '➕ Добавить в Excel-таблицу'}
              </button>
            )}

            {/* Excel Queue */}
            {queue.length > 0 && (
              <div style={{ marginTop: 12, background: '#1c1c28', border: '1px solid rgba(34,211,160,0.2)', borderRadius: 14, overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid #2a2a3d' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#7070a0' }}>
                    <span>📊</span><span>В экспорте:</span>
                    <span className="font-unbounded font-black" style={{ fontSize: 16, color: '#22d3a0', lineHeight: 1 }}>{queue.length}</span>
                    <span>товаров</span>
                  </div>
                  <button onClick={() => setQueue([])} style={{ background: 'none', border: '1px solid #2a2a3d', borderRadius: 6, padding: '4px 10px', color: '#7070a0', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}>очистить</button>
                </div>
                <div style={{ maxHeight: 130, overflowY: 'auto', padding: '6px 0' }}>
                  {queue.map((item, i) => {
                    const platColor = item.platform === 'wb' ? '#cb11ab' : item.platform === 'ozon' ? '#4d8fff' : '#ffc700'
                    const platBg = item.platform === 'wb' ? 'rgba(203,17,171,0.12)' : item.platform === 'ozon' ? 'rgba(0,91,255,0.1)' : 'rgba(255,199,0,0.1)'
                    return (
                      <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '5px 16px', fontSize: 12 }}>
                        <span className="font-unbounded font-bold" style={{ fontSize: 10, color: 'rgba(34,211,160,0.5)', width: 18, flexShrink: 0 }}>{i + 1}</span>
                        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#f0f0f8' }}>{item.result.title}</span>
                        <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 4, background: platBg, color: platColor, flexShrink: 0 }}>{item.platform.toUpperCase()}</span>
                        <button onClick={() => setQueue(prev => prev.filter(q => q.id !== item.id))} style={{ background: 'none', border: 'none', color: '#2a2a3d', cursor: 'pointer', fontSize: 14, padding: '0 2px', flexShrink: 0 }}>✕</button>
                      </div>
                    )
                  })}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, padding: 8, borderTop: '1px solid rgba(34,211,160,0.2)' }}>
                  <button onClick={() => exportToExcel(queue)}
                    style={{ width: '100%', padding: 12, background: 'linear-gradient(135deg,rgba(34,211,160,0.2),rgba(34,211,160,0.08))', border: 'none', borderRadius: 10, color: '#22d3a0', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: 'inherit', letterSpacing: -0.2 }}
                    className="font-unbounded font-bold text-xs">
                    📥 Excel
                  </button>
                  <button onClick={() => exportToCsv(queue)}
                    style={{ width: '100%', padding: 12, background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.35)', borderRadius: 10, color: '#a78bfa', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: 'inherit', letterSpacing: -0.2 }}
                    className="font-unbounded font-bold text-xs">
                    📄 CSV
                  </button>
                </div>
              </div>
            )}

            {/* Пакетная генерация CSV */}
            <div style={{ marginTop: 12, background: '#1c1c28', border: '1px solid #2a2a3d', borderRadius: 14, padding: 12 }}>
              <div style={{ fontSize: 12, color: '#a0a0c0', marginBottom: 8 }}>Пакетная генерация из CSV</div>
              <div style={{ fontSize: 12, color: '#7070a0', marginBottom: 8, lineHeight: 1.5 }}>
                Загрузите CSV, где <strong style={{ color: '#d0d0e8' }}>1 строка = 1 товар</strong>. Для каждой строки мы запустим генерацию карточки и добавим успешные результаты в очередь экспорта.
              </div>
              <div style={{ fontSize: 11, color: '#8a8ab0', marginBottom: 8 }}>
                Минимум колонок: <code>platform</code>, <code>productName</code>. Дополнительно можно передать: <code>category</code>, <code>specs</code>, <code>notes</code>, <code>price</code>, <code>brand</code> и другие поля формы.
              </div>
              <input type="file" accept=".csv,text/csv" onChange={(e) => setBatchCsvFile(e.target.files?.[0] || null)} style={{ ...inp, marginBottom: 8, padding: '8px 10px' }} />
              <button
                type="button"
                disabled={!batchCsvFile || batchRunning}
                onClick={runBatchFromCsv}
                style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid rgba(34,211,160,0.35)', background: 'rgba(34,211,160,0.12)', color: '#22d3a0', cursor: batchCsvFile && !batchRunning ? 'pointer' : 'not-allowed', fontFamily: 'inherit', opacity: batchCsvFile && !batchRunning ? 1 : 0.6 }}
              >
                {batchRunning ? 'Идет пакетная генерация...' : 'Запустить CSV'}
              </button>
              {(batchProgress.total > 0 || batchRunning) && (
                <div style={{ marginTop: 8, fontSize: 12, color: '#7070a0' }}>
                  Обработано: {batchProgress.processed}/{batchProgress.total} · Успех: {batchProgress.success} · Ошибок: {batchProgress.failed}
                </div>
              )}
              {!batchRunning && batchProgress.total > 0 && (
                <div style={{ marginTop: 6, fontSize: 11, color: '#8a8ab0' }}>
                  Успешные строки автоматически добавлены в блок «В экспорте», где можно скачать Excel/CSV.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Bulk banner ── */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 40px 48px', position: 'relative', zIndex: 2 }}>
        <div style={{ background: '#12121a', border: '1px solid #2a2a3d', borderRadius: 20, padding: '36px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 32, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -60, right: -60, width: 250, height: 250, background: 'radial-gradient(circle,rgba(34,211,160,0.07) 0%,transparent 70%)', pointerEvents: 'none' }} />
          <div style={{ flex: 1 }}>
            <div style={{ display: 'inline-block', background: 'rgba(34,211,160,0.1)', border: '1px solid rgba(34,211,160,0.25)', color: '#22d3a0', fontSize: 11, fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase' as const, padding: '5px 12px', borderRadius: 20, marginBottom: 14 }}>✦ Bulk-режим</div>
            <h3 className="font-unbounded font-black" style={{ fontSize: 22, letterSpacing: -0.5, marginBottom: 10 }}>Сотни товаров<br /><span style={{ color: '#22d3a0' }}>за один раз</span></h3>
            <p style={{ color: '#7070a0', fontSize: 14, lineHeight: 1.6, maxWidth: 480, marginBottom: 20 }}>Скачай готовый Excel-шаблон, заполни свои товары и загрузи напрямую в Wildberries. Никакого copy-paste — один файл для всего каталога.</p>
            <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: '8px 24px' }}>
              {['25 полей карточки WB', '3 примера уже заполнены', 'SEO-подсказки по категориям', 'Валидация через дропдауны'].map(f => (
                <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#7070a0' }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22d3a0', flexShrink: 0 }} />{f}
                </div>
              ))}
            </div>
          </div>
          <div style={{ flexShrink: 0 }}>
            <button onClick={() => alert('Шаблон будет доступен в релизе 🚀')}
              style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 28px', background: 'linear-gradient(135deg,rgba(34,211,160,0.15),rgba(34,211,160,0.05))', border: '1px solid rgba(34,211,160,0.35)', borderRadius: 14, color: '#22d3a0', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s' }}
              className="font-unbounded font-bold text-sm">
              <span style={{ fontSize: 24 }}>📊</span>
              <div style={{ textAlign: 'left' as const }}>
                <div style={{ fontSize: 14, letterSpacing: -0.3 }}>Скачать шаблон .xlsx</div>
                <div style={{ fontSize: 11, fontWeight: 400, color: 'rgba(34,211,160,0.6)', marginTop: 2 }}>Готов к загрузке на WB</div>
              </div>
            </button>
          </div>
        </div>

        {/* Steps */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginTop: 16 }}>
          {[
            ['01', 'Скачай шаблон', 'Нажми кнопку выше — получишь готовый .xlsx с инструкцией и примерами'],
            ['02', 'Заполни товары', 'Каждая строка = один товар. Обязательные поля выделены. Удали примеры'],
            ['03', 'Открой WB Partners', 'Товары → Карточка товара → Добавить → Много товаров → Загрузить файл'],
            ['04', 'Загрузи и жди', 'WB обработает карточки и отправит на модерацию. Обычно 1–24 часа'],
          ].map(([n, t, d]) => (
            <div key={n} style={{ background: '#12121a', border: '1px solid #2a2a3d', borderRadius: 14, padding: '20px 18px' }}>
              <div className="font-unbounded font-black" style={{ fontSize: 28, color: '#2a2a3d', marginBottom: 8, letterSpacing: -1 }}>{n}</div>
              <div className="font-unbounded font-bold" style={{ fontSize: 13, marginBottom: 6 }}>{t}</div>
              <div style={{ fontSize: 12, color: '#7070a0', lineHeight: 1.6 }}>{d}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Examples section ── */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 40px 100px', position: 'relative', zIndex: 2 }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{ display: 'inline-block', background: 'rgba(255,77,109,0.12)', border: '1px solid rgba(255,77,109,0.3)', color: '#ff4d6d', fontSize: 11, fontWeight: 500, letterSpacing: 2, textTransform: 'uppercase' as const, padding: '6px 16px', borderRadius: 20, marginBottom: 16 }}>✦ Примеры готовых карточек</div>
          <h2 className="font-unbounded font-black" style={{ fontSize: 'clamp(24px,3.5vw,44px)', letterSpacing: -1.5, lineHeight: 1.1, marginBottom: 14 }}>
            Вот что получают<br /><em style={{ fontStyle: 'normal', background: 'linear-gradient(135deg,#ff4d6d,#7c3aed)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>наши продавцы</em>
          </h2>
          <p style={{ color: '#7070a0', fontSize: 16 }}>Реальные карточки из категории «Одежда и обувь», сгенерированные за 30 секунд</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 20 }}>
          {EXAMPLE_CARDS.map((card, i) => <ExampleCard key={i} card={card} />)}
        </div>
      </div>

      <SupportFloatingButton />

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .example-card { transition: transform 0.2s, border-color 0.2s; }
        .example-card:hover { transform: translateY(-4px) !important; border-color: rgba(255,77,109,0.35) !important; }
      `}</style>
    </div>
  )
}

function SupportFloatingButton() {
  const [open, setOpen] = useState(false)
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState('')
  const [sending, setSending] = useState(false)

  async function submit() {
    setStatus('')
    setSending(true)
    try {
      const res = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, message }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Не удалось отправить обращение')
      setStatus(`Отправлено (#${data.ticketId})`)
      setSubject('')
      setMessage('')
      setOpen(false)
    } catch (e: unknown) {
      setStatus(e instanceof Error ? e.message : 'Ошибка отправки')
    } finally {
      setSending(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={{ position: 'fixed', right: 24, bottom: 24, zIndex: 140, border: 'none', borderRadius: 999, background: 'linear-gradient(135deg,#ff4d6d,#7c3aed)', color: '#fff', padding: '12px 16px', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, boxShadow: '0 12px 30px rgba(0,0,0,0.4)' }}
      >
        💬 Поддержка
      </button>
      {open && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 220 }}>
          <div style={{ width: '100%', maxWidth: 560, background: '#12121a', border: '1px solid #2a2a3d', borderRadius: 14, padding: 20 }}>
            <div className="font-unbounded font-bold" style={{ marginBottom: 12 }}>Окно поддержки</div>
            <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Тема обращения" style={{ width: '100%', marginBottom: 8, background: '#1c1c28', border: '1px solid #2a2a3d', borderRadius: 8, padding: '10px 12px', color: '#f0f0f8', fontFamily: 'inherit' }} />
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Опишите ваш вопрос" style={{ width: '100%', minHeight: 120, background: '#1c1c28', border: '1px solid #2a2a3d', borderRadius: 8, padding: '10px 12px', color: '#f0f0f8', fontFamily: 'inherit', resize: 'vertical' }} />
            {status && <div style={{ marginTop: 8, fontSize: 12, color: status.startsWith('Отправлено') ? '#22d3a0' : '#ff4d6d' }}>{status}</div>}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12 }}>
              <button onClick={() => setOpen(false)} style={{ background: '#1c1c28', border: '1px solid #2a2a3d', borderRadius: 8, padding: '8px 12px', color: '#f0f0f8', cursor: 'pointer', fontFamily: 'inherit' }}>Отмена</button>
              <button disabled={sending} onClick={submit} style={{ background: 'linear-gradient(135deg,#22d3a0,#16a34a)', border: 'none', borderRadius: 8, padding: '8px 12px', color: '#fff', cursor: 'pointer', fontFamily: 'inherit', opacity: sending ? 0.7 : 1 }}>{sending ? 'Отправка...' : 'Отправить'}</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// ── Example cards data ─────────────────────────────────────────────────────────
const EXAMPLE_CARDS = [
  {
    emoji: '👟', bg: 'linear-gradient(145deg,#1a1a2e,#16213e)', platform: 'wb' as const,
    category: 'Обувь / Кроссовки мужские',
    title: 'Кроссовки мужские сетка замша белые, подошва EVA, р.40-45, для бега и города',
    price: '3 490', oldPrice: '5 200', discount: '33',
    desc: 'Лёгкие дышащие кроссовки для активного образа жизни. Верх из комбинации сетки и замши обеспечивает вентиляцию и поддержку стопы.\n\n🔹 Подошва EVA амортизирует удары при ходьбе и беге\n🔹 Размерный ряд 40–45, стандартная сетка\n🔹 Подходит для города, прогулок, лёгких тренировок\n🔹 Уход: протирать влажной губкой',
    attrs: [['Материал верха', 'Сетка, замша'], ['Подошва', 'EVA'], ['Цвет', 'Белый / Чёрный'], ['Размеры', '40, 41, 42, 43, 44, 45'], ['Страна', 'Китай']],
    keywords: ['кроссовки мужские', 'обувь для бега', 'кеды белые', 'кроссовки сетка', 'eva подошва'],
    seo: 82,
  },
  {
    emoji: '🧥', bg: 'linear-gradient(145deg,#1e1224,#2d1b3d)', platform: 'ozon' as const,
    category: 'Одежда / Куртки женские',
    title: 'Куртка женская зимняя пуховик оверсайз, тёплая с капюшоном, р.42-52, чёрная',
    price: '6 890', oldPrice: '9 900', discount: '30',
    desc: 'Тёплый зимний пуховик в актуальном силуэте оверсайз. Наполнитель из синтетического пуха сохраняет тепло даже при −25°C, не теряет форму после стирки.\n\n🔹 Капюшон с меховой отделкой съёмный\n🔹 Два кармана на молнии + внутренний карман\n🔹 Манжеты на резинке — защита от ветра\n🔹 Размерный ряд 42–52, оверсайз посадка',
    attrs: [['Наполнитель', 'Синтетический пух'], ['Темп. режим', 'до −25°C'], ['Силуэт', 'Оверсайз'], ['Размеры', '42–52'], ['Сезон', 'Зима']],
    keywords: ['куртка женская зимняя', 'пуховик оверсайз', 'тёплая куртка', 'куртка с капюшоном', 'зимняя одежда'],
    seo: 78,
  },
  {
    emoji: '👜', bg: 'linear-gradient(145deg,#0f1f1a,#142e24)', platform: 'wb' as const,
    category: 'Аксессуары / Сумки женские',
    title: 'Сумка женская кожаная шоппер бежевая, вместительная на плечо, натуральная кожа',
    price: '4 290', oldPrice: '6 500', discount: '34',
    desc: 'Вместительная сумка-шоппер из натуральной кожи — для работы, шопинга и ежедневных поездок. Мягкая фактура, устойчива к царапинам.\n\n🔹 Натуральная кожа, приятная на ощупь\n🔹 Длинные ручки — удобно носить на плече\n🔹 Внутри: 2 кармана на молнии + открытый\n🔹 Размер: 35×30×12 см, вес 480 г',
    attrs: [['Материал', 'Натуральная кожа'], ['Тип', 'Шоппер'], ['Цвет', 'Бежевый'], ['Размер', '35×30×12 см'], ['Страна', 'Россия']],
    keywords: ['сумка женская кожаная', 'шоппер бежевый', 'сумка на плечо', 'натуральная кожа', 'сумка шопер'],
    seo: 88,
  },
]

type ExCard = typeof EXAMPLE_CARDS[0]
function ExampleCard({ card }: { card: ExCard }) {
  const [expanded, setExpanded] = useState(false)
  const isWb = card.platform === 'wb'
  const platColor = isWb ? '#cb11ab' : '#4d8fff'
  const platBg = isWb ? 'rgba(203,17,171,0.12)' : 'rgba(0,91,255,0.1)'
  const platBorder = isWb ? 'rgba(203,17,171,0.25)' : 'rgba(0,91,255,0.25)'
  const seoColor = card.seo >= 80 ? '#22d3a0' : card.seo >= 65 ? '#ffc700' : '#ff4d6d'
  const canToggleDesc = card.desc.length > 120

  return (
    <div className="example-card" style={{ background: '#12121a', border: '1px solid #2a2a3d', borderRadius: 16, overflow: 'hidden' }}>
      {/* Photo area */}
      <div style={{ height: 200, background: card.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
        <span style={{ fontSize: 64 }}>{card.emoji}</span>
        <div style={{ position: 'absolute', top: 10, left: 10, background: 'rgba(0,0,0,0.5)', color: '#7070a0', fontSize: 10, fontWeight: 500, letterSpacing: 1.5, padding: '3px 8px', borderRadius: 4, border: '1px solid #2a2a3d' }}>ФОТО</div>
      </div>
      {/* Thumbs */}
      <div style={{ display: 'flex', gap: 6, padding: '10px 12px', borderBottom: '1px solid #2a2a3d' }}>
        {[true, false, false, false, false].map((active, i) => (
          <div key={i} style={{ width: 28, height: 28, borderRadius: 6, background: '#1c1c28', border: `1px solid ${active ? '#ff4d6d' : '#2a2a3d'}`, flexShrink: 0 }} />
        ))}
      </div>
      {/* Info */}
      <div style={{ padding: '16px 18px 18px' }}>
        <span style={{ display: 'inline-block', fontSize: 10, fontWeight: 600, letterSpacing: 0.5, padding: '3px 10px', borderRadius: 4, marginBottom: 8, background: platBg, color: platColor, border: `1px solid ${platBorder}` }}>
          {isWb ? 'Wildberries' : 'Ozon'}
        </span>
        <div style={{ fontSize: 11, color: '#7070a0', marginBottom: 8, textTransform: 'uppercase' as const, letterSpacing: 0.5 }}>{card.category}</div>
        <h3 style={{ fontFamily: 'inherit', fontSize: 14, fontWeight: 500, lineHeight: 1.45, color: '#f0f0f8', marginBottom: 10 }}>{card.title}</h3>
        {/* Price */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 12 }}>
          <span className="font-unbounded font-black" style={{ fontSize: 20 }}>{card.price} ₽</span>
          <span style={{ fontSize: 13, color: '#7070a0', textDecoration: 'line-through' }}>{card.oldPrice} ₽</span>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#ff4d6d', background: 'rgba(255,77,109,0.1)', padding: '2px 7px', borderRadius: 4 }}>−{card.discount}%</span>
        </div>
        {/* Desc */}
        <div
          style={{
            fontSize: 12.5,
            lineHeight: 1.6,
            color: '#7070a0',
            marginBottom: 8,
            whiteSpace: 'pre-line' as const,
            ...(expanded ? {} : {
              display: '-webkit-box',
              WebkitBoxOrient: 'vertical' as const,
              WebkitLineClamp: 4,
              overflow: 'hidden',
            }),
          }}
        >
          {card.desc}
        </div>
        {canToggleDesc && (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            style={{ marginBottom: 14, background: 'none', border: 'none', color: '#a78bfa', cursor: 'pointer', padding: 0, fontSize: 12, fontFamily: 'inherit' }}
          >
            {expanded ? 'Свернуть' : 'Показать полностью'}
          </button>
        )}
        {/* Attrs */}
        <div style={{ borderTop: '1px solid #2a2a3d', paddingTop: 12, marginBottom: 12, display: 'flex', flexDirection: 'column' as const, gap: 5 }}>
          {card.attrs.map(([k, v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, gap: 8 }}>
              <span style={{ color: '#7070a0' }}>{k}</span>
              <span style={{ color: '#f0f0f8', fontWeight: 500, textAlign: 'right' as const }}>{v}</span>
            </div>
          ))}
        </div>
        {/* Keywords */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 10, textTransform: 'uppercase' as const, letterSpacing: 1, color: '#7070a0', marginBottom: 6 }}>SEO-ключи</div>
          <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 5 }}>
            {card.keywords.map(k => (
              <span key={k} style={{ background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.2)', color: '#a78bfa', fontSize: 11, padding: '3px 8px', borderRadius: 5 }}>{k}</span>
            ))}
          </div>
        </div>
        {/* SEO bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, borderTop: '1px solid #2a2a3d', paddingTop: 12 }}>
          <span style={{ fontSize: 11, color: '#7070a0', whiteSpace: 'nowrap' as const }}>SEO-score</span>
          <div style={{ flex: 1, height: 4, borderRadius: 2, background: '#2a2a3d', overflow: 'hidden' }}>
            <div style={{ height: '100%', borderRadius: 2, background: `linear-gradient(90deg,${seoColor},${seoColor}99)`, width: `${card.seo}%`, transition: 'width 0.5s' }} />
          </div>
          <span className="font-unbounded font-black" style={{ fontSize: 12, color: seoColor, whiteSpace: 'nowrap' as const }}>{card.seo}</span>
        </div>
      </div>
    </div>
  )
}

function RBlock({ label, extra, children, onCopy, copied }: { label: string; extra?: string; children: React.ReactNode; onCopy?: () => void; copied?: boolean }) {
  return (
    <div style={{ background: '#1c1c28', border: '1px solid #2a2a3d', borderRadius: 12, padding: '14px 16px', position: 'relative' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{ fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: 1, color: '#7070a0' }}>
          {label} {extra && <span style={{ color: '#ff4d6d' }}>({extra})</span>}
        </div>
        {onCopy && (
          <button onClick={onCopy} style={{ fontSize: 11, padding: '3px 8px', borderRadius: 6, background: copied ? '#22d3a020' : '#2a2a3d', color: copied ? '#22d3a0' : '#7070a0', border: `1px solid ${copied ? '#22d3a040' : '#2a2a3d'}`, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s' }}>
            {copied ? '✓ скоп.' : 'копировать'}
          </button>
        )}
      </div>
      {children}
    </div>
  )
}

// ── Plans section ──────────────────────────────────────────────────────────────
function PlansView({
  phone,
  planInfo,
  onBack,
  onLogout,
  subscriptionData,
  onPlanChanged,
}: {
  phone: string
  planInfo: PlanInfo
  onBack: () => void
  onLogout: () => void
  subscriptionData: SubscriptionCabinet | null
  onPlanChanged: () => Promise<void>
}) {
  const [teamOpen, setTeamOpen] = useState(false)
  const [supportOpen, setSupportOpen] = useState(false)
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [memberEmail, setMemberEmail] = useState('')
  const [memberRole, setMemberRole] = useState<'admin' | 'editor'>('editor')
  const [supportSubject, setSupportSubject] = useState('')
  const [supportMessage, setSupportMessage] = useState('')
  const [uiError, setUiError] = useState('')
  const [uiSuccess, setUiSuccess] = useState('')
  const [billingBusy, setBillingBusy] = useState(false)

  async function loadTeam() {
    const res = await fetch('/api/team')
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Не удалось загрузить команду')
    setTeamMembers(data.members || [])
  }

  async function addMember() {
    setUiError('')
    setUiSuccess('')
    try {
      const res = await fetch('/api/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: memberEmail, role: memberRole }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Не удалось добавить сотрудника')
      setMemberEmail('')
      await loadTeam()
      setUiSuccess('Сотрудник добавлен')
    } catch (e: unknown) {
      setUiError(e instanceof Error ? e.message : 'Ошибка')
    }
  }

  async function removeMember(id: string) {
    setUiError('')
    setUiSuccess('')
    try {
      const res = await fetch(`/api/team?id=${encodeURIComponent(id)}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok || !data.ok) throw new Error(data.error || 'Не удалось удалить сотрудника')
      await loadTeam()
      setUiSuccess('Сотрудник удален')
    } catch (e: unknown) {
      setUiError(e instanceof Error ? e.message : 'Ошибка')
    }
  }

  async function submitSupport() {
    setUiError('')
    setUiSuccess('')
    try {
      const res = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject: supportSubject, message: supportMessage }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Не удалось отправить обращение')
      setSupportSubject('')
      setSupportMessage('')
      setUiSuccess(`Обращение отправлено (#${data.ticketId})`)
      setSupportOpen(false)
    } catch (e: unknown) {
      setUiError(e instanceof Error ? e.message : 'Ошибка')
    }
  }

  async function changePlan(planId: string) {
    setUiError('')
    setUiSuccess('')
    setBillingBusy(true)
    try {
      const res = await fetch('/api/subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'switch_plan', planId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Не удалось сменить тариф')
      setUiSuccess('Тариф успешно обновлён')
      await onPlanChanged()
    } catch (e: unknown) {
      setUiError(e instanceof Error ? e.message : 'Ошибка оплаты')
    } finally {
      setBillingBusy(false)
    }
  }

  async function toggleAutoRenew(enabled: boolean) {
    setUiError('')
    setUiSuccess('')
    try {
      const res = await fetch('/api/subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'set_autorenew', enabled }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Не удалось обновить автопродление')
      setUiSuccess(enabled ? 'Автопродление включено' : 'Автопродление отключено')
      await onPlanChanged()
    } catch (e: unknown) {
      setUiError(e instanceof Error ? e.message : 'Ошибка')
    }
  }

  const PLANS = [
    { id: 'seller', emoji: '🛒', name: 'Продавец', price: '690', tag: 'Начни продавать с AI', btn: 'Подключить →', btnType: 'starter' as const, popular: false,
      features: [{ t: '5 карточек в день', ok: true }, { t: 'WB + Ozon', ok: true }, { t: 'Excel + CSV экспорт', ok: true }, { t: 'Базовый SEO-анализ', ok: true }, { t: 'Email-поддержка', ok: true }, { t: 'История 7 дней', ok: true }, { t: '3 варианта заголовков', ok: false }, { t: 'Анализ фотографий AI', ok: false }] },
    { id: 'shop', emoji: '🏬', name: 'Магазин', price: '1 490', tag: 'Когда товаров уже много', btn: 'Открыть магазин →', btnType: 'pro' as const, popular: true,
      features: [{ t: '20 карточек в день', ok: true }, { t: 'WB + Ozon + Авито', ok: true }, { t: 'Excel + CSV экспорт', ok: true }, { t: 'Продвинутый SEO-анализ', ok: true }, { t: '3 варианта заголовков', ok: true }, { t: 'Анализ фотографий AI', ok: true }, { t: 'История 30 дней', ok: true }, { t: 'Пакетная загрузка CSV', ok: false }] },
    { id: 'warehouse', emoji: '🏭', name: 'Склад', price: '3 490', tag: 'Масштабируй продажи', btn: 'Арендовать склад →', btnType: 'team' as const, popular: false,
      features: [{ t: '100 карточек в день', ok: true }, { t: 'Все платформы', ok: true }, { t: 'Excel/CSV/JSON экспорт', ok: true }, { t: 'SEO-анализ + рекомендации', ok: true }, { t: '3 варианта заголовков', ok: true }, { t: 'Анализ фотографий AI', ok: true }, { t: 'История 90 дней', ok: true }, { t: 'Пакетная загрузка CSV', ok: true }] },
    { id: 'network', emoji: '🌐', name: 'Сеть', price: '6 990', tag: 'Для команд и агентств', btn: 'Запустить сеть →', btnType: 'enterprise' as const, popular: false,
      features: [{ t: 'Безлимит карточек', ok: true }, { t: 'Все платформы', ok: true }, { t: 'Все форматы экспорта', ok: true }, { t: 'SEO-анализ и рекомендации', ok: true }, { t: 'До 10 сотрудников', ok: true }, { t: 'Окно поддержки в кабинете', ok: true }, { t: 'История 12 месяцев', ok: true }, { t: 'Приоритетная поддержка', ok: true }] },
  ]

  return (
    <div style={{ background: '#0a0a0f', minHeight: '100vh' }}>
      <header style={{ display: 'flex', alignItems: 'center', padding: '0 32px', height: 60, borderBottom: '1px solid #2a2a3d', position: 'sticky', top: 0, background: '#0a0a0f', zIndex: 100 }}>
        <div className="font-unbounded font-black text-xl tracking-tighter" style={{ marginRight: 24 }}>Card<span style={{ color: '#ff4d6d' }}>AI</span></div>
        <div style={{ flex: 1 }} />
        <button onClick={onBack} style={{ background: 'none', border: '1px solid #2a2a3d', borderRadius: 8, padding: '6px 14px', color: '#7070a0', fontSize: 13, cursor: 'pointer', marginRight: 12, fontFamily: 'inherit' }}>← Генератор</button>
        <span style={{ fontSize: 13, color: '#7070a0', marginRight: 10 }}>{phone}</span>
        <button onClick={onLogout} style={{ fontSize: 12, padding: '6px 12px', background: '#1c1c28', border: '1px solid #2a2a3d', borderRadius: 8, color: '#7070a0', cursor: 'pointer', fontFamily: 'inherit' }}>Выйти</button>
      </header>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '60px 40px 100px', position: 'relative', zIndex: 2 }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ display: 'inline-block', background: 'rgba(255,77,109,0.12)', border: '1px solid rgba(255,77,109,0.3)', color: '#ff4d6d', fontSize: 11, fontWeight: 500, letterSpacing: 2, textTransform: 'uppercase', padding: '6px 16px', borderRadius: 20, marginBottom: 20 }}>💎 Тарифы</div>
          <h2 className="font-unbounded font-black" style={{ fontSize: 'clamp(28px,4vw,48px)', letterSpacing: -2, marginBottom: 12 }}>Выбери свой план</h2>
          <p style={{ color: '#7070a0', fontSize: 16, marginBottom: 16 }}>Без скрытых комиссий. Отменить можно в любой момент.</p>
          <div style={{ color: '#a0a0c0', fontSize: 13, marginBottom: 16 }}>
            Текущий тариф: <strong style={{ color: '#f0f0f8' }}>{planInfo.name}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginBottom: 16 }}>
            <button
              onClick={async () => {
                setUiError('')
                setUiSuccess('')
                if (planInfo.id !== 'network') {
                  setUiError('Управление командой доступно только на тарифе «Сеть».')
                  return
                }
                try {
                  await loadTeam()
                  setTeamOpen(true)
                } catch (e: unknown) {
                  setUiError(e instanceof Error ? e.message : 'Ошибка загрузки команды')
                }
              }}
              style={{ background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.35)', borderRadius: 10, padding: '8px 14px', color: '#a78bfa', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}
            >
              👥 Команда
            </button>
          </div>
          {uiError && <div style={{ color: '#ff4d6d', fontSize: 12, marginBottom: 6 }}>{uiError}</div>}
          {uiSuccess && <div style={{ color: '#22d3a0', fontSize: 12, marginBottom: 6 }}>{uiSuccess}</div>}
        </div>
        {subscriptionData && (
          <div style={{ marginBottom: 16, background: '#12121a', border: '1px solid #2a2a3d', borderRadius: 16, padding: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <div style={{ fontSize: 13, color: '#f0f0f8' }}>
                Подписка: {subscriptionData.plan.name} · осталось сегодня: <strong style={{ color: '#22d3a0' }}>{subscriptionData.usage.remainingToday}</strong>
              </div>
              <button
                onClick={() => toggleAutoRenew(!subscriptionData.subscription.autoRenew)}
                style={{ background: 'none', border: '1px solid #2a2a3d', borderRadius: 8, color: '#a0a0c0', padding: '6px 10px', fontFamily: 'inherit', cursor: 'pointer' }}
              >
                {subscriptionData.subscription.autoRenew ? 'Отключить автопродление' : 'Включить автопродление'}
              </button>
            </div>
            <div style={{ fontSize: 12, color: '#7070a0', marginBottom: 8 }}>
              Следующее списание: {subscriptionData.subscription.nextBillingAt ? new Date(subscriptionData.subscription.nextBillingAt).toLocaleString('ru') : 'не запланировано'}
            </div>
            <div style={{ fontSize: 12, color: '#a0a0c0', marginBottom: 8 }}>
              Что входит: {subscriptionData.plan.features.join(', ')}
            </div>
            <div style={{ maxHeight: 130, overflowY: 'auto', borderTop: '1px solid #1c1c28', paddingTop: 8 }}>
              {subscriptionData.payments.length === 0 ? (
                <div style={{ fontSize: 12, color: '#7070a0' }}>История оплат пока пустая</div>
              ) : subscriptionData.payments.map((p) => (
                <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#a0a0c0', marginBottom: 4 }}>
                  <span>{new Date(p.createdAt).toLocaleString('ru')} · {p.type === 'renewal' ? 'Продление' : 'Оплата'}</span>
                  <span>{p.amount} ₽</span>
                </div>
              ))}
            </div>
          </div>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 40 }}>
          {PLANS.map(plan => (
            <div key={plan.name} style={{ background: plan.btnType === 'pro' ? 'linear-gradient(145deg,#1a0f2e,#12121a)' : plan.btnType === 'enterprise' ? 'linear-gradient(145deg,#0f1f1a,#12121a)' : '#12121a', border: `1px solid ${plan.btnType === 'pro' ? 'rgba(124,58,237,0.4)' : plan.btnType === 'team' ? 'rgba(34,211,160,0.2)' : plan.btnType === 'enterprise' ? 'rgba(255,199,0,0.25)' : '#2a2a3d'}`, borderRadius: 20, padding: '28px 22px', position: 'relative', overflow: 'hidden', boxShadow: plan.btnType === 'pro' ? '0 0 40px rgba(124,58,237,0.1)' : 'none' }}>
              {plan.popular && <div style={{ display: 'inline-block', background: 'rgba(255,77,109,0.15)', border: '1px solid rgba(255,77,109,0.3)', color: '#ff4d6d', fontSize: 11, fontWeight: 600, padding: '5px 12px', borderRadius: 20, marginBottom: 20 }}>🔥 Берут чаще всего</div>}
              <div style={{ fontSize: 36, marginBottom: 10 }}>{plan.emoji}</div>
              <div className="font-unbounded font-black" style={{ fontSize: 22, letterSpacing: -0.5, marginBottom: 4 }}>{plan.name}</div>
              <div style={{ marginBottom: 6 }}>
                <span className="font-unbounded font-black" style={{ fontSize: 30, letterSpacing: -1 }}>{plan.price} ₽</span>
                <span style={{ color: '#7070a0', fontSize: 14 }}>/мес</span>
              </div>
              <div style={{ color: '#7070a0', fontSize: 13, marginBottom: 24 }}>{plan.tag}</div>
              <ul style={{ listStyle: 'none', marginBottom: 28, display: 'flex', flexDirection: 'column', gap: 9 }}>
                {plan.features.map(f => (
                  <li key={f.t} style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 13, color: f.ok ? '#f0f0f8' : '#7070a0' }}>
                    <span style={{ width: 18, height: 18, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, background: f.ok ? 'rgba(34,211,160,0.12)' : '#1c1c28', border: `1px solid ${f.ok ? 'rgba(34,211,160,0.3)' : '#2a2a3d'}`, color: f.ok ? '#22d3a0' : '#2a2a3d' }}>
                      {f.ok ? '✓' : '×'}
                    </span>
                    {f.t}
                  </li>
                ))}
              </ul>
              <button onClick={() => changePlan(plan.id)}
                disabled={billingBusy}
                style={{ width: '100%', padding: '13px 20px', borderRadius: 12, cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, fontWeight: 700, letterSpacing: -0.3, transition: 'all 0.2s', ...(plan.btnType === 'starter' ? { background: '#1c1c28', border: '1px solid #2a2a3d', color: '#f0f0f8' } : plan.btnType === 'pro' ? { background: 'linear-gradient(135deg,#ff4d6d,#7c3aed)', border: 'none', color: 'white' } : plan.btnType === 'enterprise' ? { background: 'linear-gradient(135deg,#ffc700,#ff8c00)', border: 'none', color: '#0a0a0f' } : { background: 'rgba(34,211,160,0.12)', border: '1px solid rgba(34,211,160,0.4)', color: '#22d3a0' }) }}
                className="font-unbounded font-bold">
                {planInfo.id === plan.id ? 'Текущий тариф' : billingBusy ? 'Обработка...' : plan.btn}
              </button>
            </div>
          ))}
        </div>
        <div style={{ background: '#12121a', border: '1px solid #2a2a3d', borderRadius: 16, padding: '28px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-around', flexWrap: 'wrap', gap: 24 }}>
          {[['12 847', 'карточек создано'], ['2 340', 'продавцов'], ['38 мин', 'экономия/карточку'], ['4.9 ★', 'средняя оценка']].map(([n, l], i, arr) => (
            <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
              <div style={{ textAlign: 'center' }}>
                <div className="font-unbounded font-black" style={{ fontSize: 28, letterSpacing: -1, marginBottom: 4 }}>{n}</div>
                <div style={{ fontSize: 13, color: '#7070a0' }}>{l}</div>
              </div>
              {i < arr.length - 1 && <div style={{ width: 1, height: 40, background: '#2a2a3d' }} />}
            </div>
          ))}
        </div>
      </div>

      <SupportFloatingButton />

      {teamOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
          <div style={{ width: '100%', maxWidth: 560, background: '#12121a', border: '1px solid #2a2a3d', borderRadius: 14, padding: 20 }}>
            <div className="font-unbounded font-bold" style={{ marginBottom: 12 }}>Команда (до 10 сотрудников)</div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
              <input value={memberEmail} onChange={(e) => setMemberEmail(e.target.value)} placeholder="email сотрудника" style={{ flex: 1, background: '#1c1c28', border: '1px solid #2a2a3d', borderRadius: 8, padding: '10px 12px', color: '#f0f0f8', fontFamily: 'inherit' }} />
              <select value={memberRole} onChange={(e) => setMemberRole(e.target.value === 'admin' ? 'admin' : 'editor')} style={{ background: '#1c1c28', border: '1px solid #2a2a3d', borderRadius: 8, padding: '10px 8px', color: '#f0f0f8', fontFamily: 'inherit' }}>
                <option value="editor">editor</option>
                <option value="admin">admin</option>
              </select>
              <button onClick={addMember} style={{ background: 'linear-gradient(135deg,#ff4d6d,#7c3aed)', border: 'none', borderRadius: 8, padding: '10px 12px', color: '#fff', cursor: 'pointer', fontFamily: 'inherit' }}>Добавить</button>
            </div>
            <div style={{ maxHeight: 220, overflowY: 'auto', border: '1px solid #2a2a3d', borderRadius: 10 }}>
              {teamMembers.length === 0 ? (
                <div style={{ padding: 12, color: '#7070a0', fontSize: 13 }}>Пока нет сотрудников</div>
              ) : teamMembers.map((m) => (
                <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', borderTop: '1px solid #1c1c28' }}>
                  <div>
                    <div style={{ fontSize: 13 }}>{m.email}</div>
                    <div style={{ fontSize: 11, color: '#7070a0' }}>{m.role}</div>
                  </div>
                  <button onClick={() => removeMember(m.id)} style={{ background: 'none', border: '1px solid #2a2a3d', borderRadius: 8, padding: '4px 10px', color: '#7070a0', cursor: 'pointer', fontFamily: 'inherit' }}>Удалить</button>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
              <button onClick={() => setTeamOpen(false)} style={{ background: '#1c1c28', border: '1px solid #2a2a3d', borderRadius: 8, padding: '8px 12px', color: '#f0f0f8', cursor: 'pointer', fontFamily: 'inherit' }}>Закрыть</button>
            </div>
          </div>
        </div>
      )}

      {supportOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
          <div style={{ width: '100%', maxWidth: 560, background: '#12121a', border: '1px solid #2a2a3d', borderRadius: 14, padding: 20 }}>
            <div className="font-unbounded font-bold" style={{ marginBottom: 12 }}>Окно поддержки</div>
            <input value={supportSubject} onChange={(e) => setSupportSubject(e.target.value)} placeholder="Тема обращения" style={{ width: '100%', marginBottom: 8, background: '#1c1c28', border: '1px solid #2a2a3d', borderRadius: 8, padding: '10px 12px', color: '#f0f0f8', fontFamily: 'inherit' }} />
            <textarea value={supportMessage} onChange={(e) => setSupportMessage(e.target.value)} placeholder="Опишите ваш вопрос" style={{ width: '100%', minHeight: 120, background: '#1c1c28', border: '1px solid #2a2a3d', borderRadius: 8, padding: '10px 12px', color: '#f0f0f8', fontFamily: 'inherit', resize: 'vertical' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12 }}>
              <button onClick={() => setSupportOpen(false)} style={{ background: '#1c1c28', border: '1px solid #2a2a3d', borderRadius: 8, padding: '8px 12px', color: '#f0f0f8', cursor: 'pointer', fontFamily: 'inherit' }}>Отмена</button>
              <button onClick={submitSupport} style={{ background: 'linear-gradient(135deg,#22d3a0,#16a34a)', border: 'none', borderRadius: 8, padding: '8px 12px', color: '#fff', cursor: 'pointer', fontFamily: 'inherit' }}>Отправить</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── History section ────────────────────────────────────────────────────────────
function HistoryView({
  phone,
  history,
  records,
  onBack,
  onDelete,
  onReuse,
  onLogout,
}: {
  phone: string
  history: HistoryItem[]
  records: ServerHistoryItem[]
  onBack: () => void
  onDelete: (id: number | string) => void
  onReuse: (item: ServerHistoryItem) => void
  onLogout: () => void
}) {
  const [platformFilter, setPlatformFilter] = useState<'all' | 'wb' | 'ozon' | 'avito'>('all')
  const [query, setQuery] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')

  const filteredIds = new Set(
    records
      .filter((r) => platformFilter === 'all' || r.platform === platformFilter)
      .filter((r) => {
        if (!query.trim()) return true
        const q = query.trim().toLowerCase()
        return `${r.productName} ${r.result?.title || ''} ${r.category}`.toLowerCase().includes(q)
      })
      .filter((r) => !fromDate || new Date(r.createdAt) >= new Date(fromDate))
      .filter((r) => !toDate || new Date(r.createdAt) <= new Date(`${toDate}T23:59:59`))
      .map((r) => r.id),
  )
  const visible = history.filter((h) => typeof h.id !== 'string' || filteredIds.has(h.id))

  return (
    <div style={{ background: '#0a0a0f', minHeight: '100vh' }}>
      <header style={{ display: 'flex', alignItems: 'center', padding: '0 32px', height: 60, borderBottom: '1px solid #2a2a3d', position: 'sticky', top: 0, background: '#0a0a0f', zIndex: 100 }}>
        <div className="font-unbounded font-black text-xl tracking-tighter" style={{ marginRight: 24 }}>Card<span style={{ color: '#ff4d6d' }}>AI</span></div>
        <div style={{ flex: 1 }} />
        <button onClick={onBack} style={{ background: 'none', border: '1px solid #2a2a3d', borderRadius: 8, padding: '6px 14px', color: '#7070a0', fontSize: 13, cursor: 'pointer', marginRight: 12, fontFamily: 'inherit' }}>← Генератор</button>
        <span style={{ fontSize: 13, color: '#7070a0', marginRight: 10 }}>{phone}</span>
        <button onClick={onLogout} style={{ fontSize: 12, padding: '6px 12px', background: '#1c1c28', border: '1px solid #2a2a3d', borderRadius: 8, color: '#7070a0', cursor: 'pointer', fontFamily: 'inherit' }}>Выйти</button>
      </header>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '60px 40px 80px', position: 'relative', zIndex: 2 }}>
        <div style={{ marginBottom: 40 }}>
          <div style={{ display: 'inline-block', background: 'rgba(255,77,109,0.12)', border: '1px solid rgba(255,77,109,0.3)', color: '#ff4d6d', fontSize: 11, fontWeight: 500, letterSpacing: 2, textTransform: 'uppercase', padding: '6px 16px', borderRadius: 20, marginBottom: 20 }}>📋 История</div>
          <h1 className="font-unbounded font-black" style={{ fontSize: 'clamp(28px,4vw,44px)', letterSpacing: -2 }}>Твои карточки</h1>
          <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: '120px 1fr 140px 140px', gap: 8 }}>
            <select value={platformFilter} onChange={(e) => setPlatformFilter(e.target.value as 'all' | 'wb' | 'ozon' | 'avito')} style={{ background: '#1c1c28', border: '1px solid #2a2a3d', borderRadius: 8, color: '#f0f0f8', padding: '8px 10px', fontFamily: 'inherit' }}>
              <option value="all">Все</option>
              <option value="wb">WB</option>
              <option value="ozon">Ozon</option>
              <option value="avito">Avito</option>
            </select>
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Поиск по товару/названию" style={{ background: '#1c1c28', border: '1px solid #2a2a3d', borderRadius: 8, color: '#f0f0f8', padding: '8px 10px', fontFamily: 'inherit' }} />
            <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} style={{ background: '#1c1c28', border: '1px solid #2a2a3d', borderRadius: 8, color: '#f0f0f8', padding: '8px 10px', fontFamily: 'inherit' }} />
            <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} style={{ background: '#1c1c28', border: '1px solid #2a2a3d', borderRadius: 8, color: '#f0f0f8', padding: '8px 10px', fontFamily: 'inherit' }} />
          </div>
        </div>
        {visible.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 300, textAlign: 'center', color: '#7070a0' }}>
            <div style={{ fontSize: 56, opacity: 0.25, marginBottom: 16 }}>📋</div>
            <p className="font-unbounded font-bold" style={{ fontSize: 16, color: '#f0f0f8' }}>Пока ничего нет</p>
            <p style={{ fontSize: 13, marginTop: 8 }}>Сгенерируй первую карточку в генераторе</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {visible.map(item => {
              const platColor = item.platform === 'wb' ? '#cb11ab' : item.platform === 'ozon' ? '#4d8fff' : '#ffc700'
              const platBg = item.platform === 'wb' ? 'rgba(203,17,171,0.12)' : item.platform === 'ozon' ? 'rgba(0,91,255,0.1)' : 'rgba(255,199,0,0.1)'
              const record = typeof item.id === 'string' ? records.find((r) => r.id === item.id) : null
              return (
                <div key={item.id} style={{ background: '#12121a', border: '1px solid #2a2a3d', borderRadius: 14, padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</div>
                    <div style={{ fontSize: 12, color: '#7070a0', marginTop: 3 }}>{item.date}</div>
                  </div>
                  <span style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, background: platBg, color: platColor, border: `1px solid ${platColor}30`, flexShrink: 0 }}>{item.platform.toUpperCase()}</span>
                  {record && (
                    <button onClick={() => onReuse(record)} style={{ background: 'none', border: '1px solid #2a2a3d', borderRadius: 8, padding: '5px 10px', color: '#22d3a0', fontSize: 12, cursor: 'pointer', flexShrink: 0, fontFamily: 'inherit' }}>Доработать</button>
                  )}
                  <button onClick={() => onDelete(item.id)} style={{ background: 'none', border: '1px solid #2a2a3d', borderRadius: 8, padding: '5px 12px', color: '#7070a0', fontSize: 12, cursor: 'pointer', flexShrink: 0, fontFamily: 'inherit' }}>Удалить</button>
                </div>
              )
            })}
          </div>
        )}
      </div>
      <SupportFloatingButton />
    </div>
  )
}
