import { NextRequest, NextResponse } from 'next/server'
import { getCurrentSession } from '@/lib/session'
import { normalizeImageDataUrl, isImageTooLarge } from '@/lib/images'
import { addHistoryItem, countTodayGenerations } from '@/lib/history'
import { getUserPlan } from '@/lib/plans'

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'

const PLATFORM_PROMPTS: Record<string, string> = {
  wb: `Ты — эксперт по SEO для маркетплейса Wildberries (WB). 
Wildberries ценит: точный заголовок до 100 символов с главными ключами, подробное описание с emoji и буллетами, максимум ключевых слов, детальные характеристики.`,
  ozon: `Ты — эксперт по SEO для маркетплейса Ozon.
Ozon ценит: заголовок с разделителями | до 120 символов, структурированное описание с emoji ✦✔, синонимы и вариации ключей, атрибуты с указанием сезона.`,
  avito: `Ты — эксперт по объявлениям на Авито.
Авито ценит: живой разговорный стиль, конкретные условия (самовывоз/доставка, торг), состояние товара, простые ключевые слова как пишут люди.`,
}

function buildPrompt(
  platform: string, productName: string, specs: string, category: string,
  notes: string, hasImages: boolean,
  extra?: { brand?: string; color?: string; sizes?: string; material?: string; country?: string;
            price?: string; discount?: string; gender?: string; season?: string;
            nds?: string; barcode?: string; weight?: string }
): string {
  const platformGuide = PLATFORM_PROMPTS[platform] || PLATFORM_PROMPTS.wb

  return `${platformGuide}

Задача: создай SEO-оптимизированную карточку товара для ${platform.toUpperCase()}.

Данные товара:
- Название: ${productName}
- Категория: ${category}
- Характеристики: ${specs || 'не указаны'}${extra?.brand ? `\n- Бренд: ${extra.brand}` : ''}${extra?.color ? `\n- Цвет: ${extra.color}` : ''}${extra?.sizes ? `\n- Размеры: ${extra.sizes}` : ''}${extra?.material ? `\n- Материал: ${extra.material}` : ''}${extra?.country ? `\n- Страна: ${extra.country}` : ''}${extra?.price ? `\n- Цена: ${extra.price} руб${extra.discount ? ` (скидка ${extra.discount}%)` : ''}` : ''}${extra?.gender ? `\n- Пол: ${extra.gender}` : ''}${extra?.season ? `\n- Сезон: ${extra.season}` : ''}${platform === 'ozon' && extra?.nds ? `\n- НДС: ${extra.nds}` : ''}
- Дополнительные заметки: ${notes || 'нет'}
${hasImages ? '- Изображения: прикреплены, учти визуальные характеристики товара' : ''}

Верни СТРОГО валидный JSON без markdown, без блоков \`\`\`, без пояснений:
{
  "title": "заголовок карточки (строка)",
  "description": "описание товара (строка, можно с \\n для переносов)",
  "keywords": ["ключ1", "ключ2", "ключ3", "...до 10 ключей"],
  "attributes": "характеристики одной строкой через · ",
  "variants": [
    "вариант заголовка 1 — акцент на характеристики",
    "вариант заголовка 2 — акцент на пользу",
    "вариант заголовка 3 — максимум ключей"
  ],
  "seoScore": {
    "total": 0,
    "title": 0,
    "description": 0,
    "keywords": 0
  },
  "tips": [
    {"type": "ok", "text": "что хорошо"},
    {"type": "warn", "text": "что улучшить"},
    {"type": "error", "text": "критическая проблема"}
  ]
}

Правила оценки seoScore (от 0 до 100):
- title: длина, наличие главного ключа, читаемость
- description: полнота, emoji, структура, ключевые слова
- keywords: количество, частотность, разнообразие
- total: среднее из трёх

Обязательно 2-3 tips разных типов (ok/warn/error).`
}

export async function POST(req: NextRequest) {
  const session = await getCurrentSession()
  if (!session) {
    return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
  }

  const userId = session.email
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'GROQ_API_KEY не настроен' }, { status: 500 })
  }

  // Проверяем лимит по тарифу
  const plan = await getUserPlan(userId)
  const todayCount = await countTodayGenerations(userId)
  if (todayCount >= plan.dailyLimit) {
    return NextResponse.json({
      error: `Достигнут лимит на сегодня: ${plan.dailyLimit} карточек (тариф «${plan.name}»). Обновите тариф для увеличения лимита.`
    }, { status: 429 })
  }

  try {
    const body = await req.json()
    const { platform, productName, specs, category, notes, images,
            brand, color, sizes, material, country, price, discount,
            gender, season, nds, barcode, weightG } = body

    if (!productName || !platform) {
      return NextResponse.json({ error: 'Обязательные поля не заполнены' }, { status: 400 })
    }

    // Обрабатываем изображения
    let validImages: string[] = []
    if (Array.isArray(images) && images.length > 0) {
      for (const img of images.slice(0, 3)) {
        // Пропускаем SVG (демо-картинки) — Groq не поддерживает SVG
        if (typeof img === 'string' && img.includes('image/svg')) continue
        const normalized = normalizeImageDataUrl(img)
        if (normalized && !isImageTooLarge(normalized)) {
          validImages.push(normalized)
        }
      }
    }

    const hasImages = validImages.length > 0
    const prompt = buildPrompt(platform, productName, specs || '', category || '', notes || '', hasImages,
      { brand, color, sizes, material, country, price, discount, gender, season, nds, barcode, weight: weightG })

    // Строим сообщение — с картинками или без
    let userContent: unknown

    if (hasImages) {
      const imageContents = validImages.map((url: string) => ({
        type: 'image_url',
        image_url: { url },
      }))
      userContent = [
        ...imageContents,
        { type: 'text', text: prompt },
      ]
    } else {
      userContent = prompt
    }

    const model = hasImages
      ? 'meta-llama/llama-4-scout-17b-16e-instruct'
      : 'llama-3.3-70b-versatile'

    const groqResponse = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: userContent }],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    })

    if (!groqResponse.ok) {
      const errText = await groqResponse.text()
      console.error('Groq API error:', groqResponse.status, errText)
      let detail = groqResponse.statusText
      try {
        const errJson = JSON.parse(errText)
        detail = errJson.error?.message || errJson.error || detail
      } catch {}
      return NextResponse.json({ error: `Ошибка Groq API: ${detail}` }, { status: 502 })
    }

    const groqData = await groqResponse.json()
    const rawText = groqData.choices?.[0]?.message?.content || ''

    let parsed
    try {
      const cleaned = rawText
        .replace(/```json\s*/gi, '')
        .replace(/```\s*/g, '')
        .trim()
      parsed = JSON.parse(cleaned)
    } catch {
      console.error('Failed to parse Groq response:', rawText)
      return NextResponse.json({ error: 'Не удалось разобрать ответ AI. Попробуй ещё раз.' }, { status: 500 })
    }

    // Сохраняем в историю
    await addHistoryItem(userId, {
      platform,
      productName,
      category: category || '',
      result: parsed,
    })

    return NextResponse.json({
      ok: true,
      data: parsed,
      meta: {
        platform, productName, model, hasImages,
        imagesProcessed: validImages.length,
        todayCount: todayCount + 1,
        dailyLimit: plan.dailyLimit,
        planName: plan.name,
        generatedAt: new Date().toISOString(),
      },
    })
  } catch (e) {
    console.error('Generate error:', e)
    return NextResponse.json({ error: 'Ошибка генерации' }, { status: 500 })
  }
}