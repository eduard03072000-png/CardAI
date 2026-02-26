import type { QueueItem } from './types'

export function exportToJson(queue: QueueItem[]) {
  if (queue.length === 0) return

  const data = queue.map(({ platform, form, result }) => ({
    platform,
    vendor_code: form.vendorCode || form.vendorCodeOzon || '',
    title: result.title,
    description: result.description,
    keywords: result.keywords,
    attributes: result.attributes,
    variants: result.variants,
    seo_score: result.seoScore,
    brand: form.brand,
    category: form.category,
    price: form.price,
    discount: form.discount,
    color: form.color,
    sizes: form.sizes,
    material: form.material,
    country: form.country,
    gender: form.gender,
    season: form.season,
    barcode: form.barcode,
    weight_g: form.weightG,
  }))

  const json = JSON.stringify(data, null, 2)
  const blob = new Blob([json], { type: 'application/json;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const ts = new Date().toLocaleDateString('ru').replace(/\./g, '-')

  const a = document.createElement('a')
  a.href = url
  a.download = `CardAI_export_${queue.length}товаров_${ts}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export async function exportToExcel(queue: QueueItem[]) {
  if (queue.length === 0) return

  // Динамический импорт — только на клиенте
  const XLSX = await import('xlsx')

  const wb = XLSX.utils.book_new()

  // ── Инструкция ──
  const infoRows = [
    ['CardAI — Шаблон загрузки товаров'],
    [''],
    ['Листы в этом файле:'],
    ...(queue.some(i => i.platform === 'wb') ? [['  WB Товары — Товары → Добавить → Много товаров → Загрузить из файла']] : []),
    ...(queue.some(i => i.platform === 'ozon') ? [['  Ozon Товары — Товары → Добавить товары → Через шаблон']] : []),
    ...(queue.some(i => i.platform === 'avito') ? [['  Авито Товары — загрузить через Avito Pro']] : []),
    [''], ['* — обязательные поля'],
  ]
  const wsInfo = XLSX.utils.aoa_to_sheet(infoRows)
  wsInfo['!cols'] = [{ wch: 90 }]
  XLSX.utils.book_append_sheet(wb, wsInfo, '📋 Инструкция')

  const wbItems = queue.filter(i => i.platform === 'wb')
  const ozonItems = queue.filter(i => i.platform === 'ozon')
  const avitoItems = queue.filter(i => i.platform === 'avito')

  // ── WB лист ──
  if (wbItems.length) {
    const headers = [
      'Артикул продавца *', 'Наименование товара *', 'Описание *', 'Бренд *',
      'Категория WB *', 'Предмет (подкатегория) *', 'Цвет *', 'Размеры',
      'Материал', 'Страна', 'Цена (руб) *', 'Скидка (%)', 'Пол', 'Сезон',
      'Остаток (шт)', 'Ключевые слова',
    ]
    const rows = wbItems.map(({ form: f, result: r }) => [
      f.vendorCode, r.title, r.description.replace(/\n/g, ' '),
      f.brand, f.category.split('/')[0].trim(), f.category.split('/')[1]?.trim() || f.category,
      f.color, f.sizes, f.material, f.country,
      f.price, f.discount, f.gender, f.season, f.stock,
      r.keywords.join(', '),
    ])
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows])
    ws['!cols'] = [{ wch: 16 }, { wch: 50 }, { wch: 60 }, { wch: 14 }, { wch: 18 },
      { wch: 20 }, { wch: 14 }, { wch: 22 }, { wch: 18 }, { wch: 16 },
      { wch: 12 }, { wch: 10 }, { wch: 12 }, { wch: 16 }, { wch: 12 }, { wch: 40 }]
    XLSX.utils.book_append_sheet(wb, ws, '🛍 WB Товары')
  }

  // ── Ozon лист ──
  if (ozonItems.length) {
    const headers = [
      'Артикул *', 'Название товара', 'Цена *', 'Цена до скидки',
      'НДС *', 'Бренд *', 'Категория *', 'Цвет', 'Материал', 'Описание',
      'Ключевые слова', 'Штрихкод (EAN)', 'Вес в упаковке, г',
      'Ширина упаковки, мм', 'Высота упаковки, мм', 'Длина упаковки, мм',
      'Ссылка на фото', 'Страна', 'Рассрочка', 'Баллы за отзывы',
    ]
    const rows = ozonItems.map(({ form: f, result: r }) => {
      const price = parseFloat(f.price) || 0
      const priceOriginal = price > 0 ? Math.round(price * 1.2) : ''
      return [
        f.vendorCodeOzon, r.title, f.price, priceOriginal,
        f.nds || 'Не облагается', f.brand, f.category,
        f.color, f.material, r.description.replace(/\n/g, ' '), r.keywords.join(', '),
        f.barcode, f.weightG, f.dimWidth, f.dimHeight, f.dimLength,
        f.photoUrl, f.country, f.installment || 'Нет', f.reviewPoints || 'Нет',
      ]
    })
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows])
    ws['!cols'] = [{ wch: 16 }, { wch: 50 }, { wch: 12 }, { wch: 14 }, { wch: 18 },
      { wch: 14 }, { wch: 20 }, { wch: 14 }, { wch: 18 }, { wch: 60 }, { wch: 40 },
      { wch: 16 }, { wch: 16 }, { wch: 18 }, { wch: 18 }, { wch: 18 },
      { wch: 40 }, { wch: 20 }, { wch: 12 }, { wch: 16 }]
    XLSX.utils.book_append_sheet(wb, ws, '🔵 Ozon Товары')
  }

  // ── Авито лист ──
  if (avitoItems.length) {
    const headers = [
      'Артикул', 'Название *', 'Категория *', 'Цена *', 'Описание',
      'Бренд', 'Цвет', 'Размер', 'Материал', 'Состояние', 'Ключевые слова',
    ]
    const rows = avitoItems.map(({ form: f, result: r }) => [
      f.vendorCode, r.title, f.category, f.price, r.description.replace(/\n/g, ' '),
      f.brand, f.color, f.sizes, f.material, 'Новое', r.keywords.join(', '),
    ])
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows])
    ws['!cols'] = [{ wch: 14 }, { wch: 50 }, { wch: 20 }, { wch: 12 }, { wch: 60 },
      { wch: 14 }, { wch: 14 }, { wch: 16 }, { wch: 18 }, { wch: 12 }, { wch: 40 }]
    XLSX.utils.book_append_sheet(wb, ws, '🟡 Авито Товары')
  }

  const ts = new Date().toLocaleDateString('ru').replace(/\./g, '-')
  const platforms = [
    wbItems.length && 'WB',
    ozonItems.length && 'Ozon',
    avitoItems.length && 'Avito',
  ].filter(Boolean).join('-')

  XLSX.writeFile(wb, `CardAI_${platforms}_${queue.length}товаров_${ts}.xlsx`)
}

export function exportToCsv(queue: QueueItem[]) {
  if (queue.length === 0) return

  const headers = [
    'platform',
    'title',
    'description',
    'keywords',
    'attributes',
    'price',
    'brand',
    'category',
    'color',
    'sizes',
    'material',
    'country',
    'vendor_code',
  ]

  const escapeCell = (value: string) => `"${String(value).replace(/"/g, '""')}"`
  const rows = queue.map(({ platform, form, result }) => [
    platform,
    result.title,
    result.description.replace(/\n/g, ' '),
    result.keywords.join(', '),
    result.attributes.replace(/\n/g, ' '),
    form.price,
    form.brand,
    form.category,
    form.color,
    form.sizes,
    form.material,
    form.country,
    form.vendorCode || form.vendorCodeOzon,
  ])

  const csv = [
    headers.map(escapeCell).join(','),
    ...rows.map((row) => row.map((v) => escapeCell(String(v || ''))).join(',')),
  ].join('\n')

  const bom = '\uFEFF'
  const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const ts = new Date().toLocaleDateString('ru').replace(/\./g, '-')

  const a = document.createElement('a')
  a.href = url
  a.download = `CardAI_export_${queue.length}товаров_${ts}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
