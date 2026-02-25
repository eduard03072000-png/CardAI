/**
 * Утилиты для обработки изображений перед отправкой в AI
 */

/**
 * Валидирует и нормализует base64 data URL изображения.
 * Groq требует чистый base64 без лишних символов.
 */
export function normalizeImageDataUrl(dataUrl: string): string | null {
  try {
    // Если это уже data URL
    if (dataUrl.startsWith('data:image/')) {
      // Проверяем что base64 часть существует
      const parts = dataUrl.split(',')
      if (parts.length !== 2) return null
      const base64 = parts[1]
      if (!base64 || base64.length < 100) return null
      // Убираем переносы строк и пробелы
      const clean = base64.replace(/\s/g, '')
      const mediaType = parts[0].split(':')[1]?.split(';')[0] || 'image/jpeg'
      return `data:${mediaType};base64,${clean}`
    }
    // Если это чистый base64
    if (dataUrl.length > 100) {
      return `data:image/jpeg;base64,${dataUrl.replace(/\s/g, '')}`
    }
    return null
  } catch {
    return null
  }
}

/**
 * Ограничивает размер base64 строки.
 * Groq имеет лимит ~20MB на запрос.
 * Одно изображение не должно превышать ~4MB base64 (~3MB файл).
 */
export function isImageTooLarge(dataUrl: string, maxBytes = 4 * 1024 * 1024): boolean {
  const base64Part = dataUrl.split(',')[1] || dataUrl
  // base64 увеличивает размер на ~33%
  const estimatedBytes = (base64Part.length * 3) / 4
  return estimatedBytes > maxBytes
}