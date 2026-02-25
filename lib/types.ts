export type Platform = 'wb' | 'ozon' | 'avito'

export interface ProductForm {
  // Общие
  productName: string
  brand: string
  category: string
  price: string
  color: string
  sizes: string
  material: string
  country: string
  specs: string
  notes: string
  vendorCode: string
  // WB + Авито
  discount: string
  gender: string
  season: string
  stock: string
  // Ozon only
  nds: string
  barcode: string
  weightG: string
  dimLength: string
  dimWidth: string
  dimHeight: string
  photoUrl: string
  installment: string
  reviewPoints: string
  vendorCodeOzon: string
}

export interface GenerateResult {
  title: string
  description: string
  keywords: string[]
  attributes: string
  variants: string[]
  seoScore: { total: number; title: number; description: number; keywords: number }
  tips: { type: 'ok' | 'warn' | 'error'; text: string }[]
}

export interface QueueItem {
  id: number
  platform: Platform
  form: ProductForm
  result: GenerateResult
}

export interface HistoryItem {
  id: number | string
  platform: Platform
  title: string
  date: string
}
