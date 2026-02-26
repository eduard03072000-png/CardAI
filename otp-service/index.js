// CardAI OTP Email Service
// POST /send-otp { email } — генерирует код, отправляет с cardai@evdgroup.ru
// POST /verify-otp { email, code } — проверяет код
// GET /health — статус

const express = require('express')
const nodemailer = require('nodemailer')

const app = express()
app.use(express.json())

const PORT = 4010
const SMTP_HOST = 'mail.hosting.reg.ru'
const SMTP_PORT = 465
const SMTP_USER = 'cardai@evdgroup.ru'
const SMTP_PASS = 'eS53S1sTCA'
const API_SECRET = 'cardai-otp-secret-2025'

// In-memory OTP store: email -> { code, expires, attempts }
const otpStore = new Map()

// Чистим истёкшие коды каждые 2 минуты
setInterval(() => {
  const now = Date.now()
  for (const [k, v] of otpStore.entries()) {
    if (now > v.expires) otpStore.delete(k)
  }
}, 2 * 60 * 1000)

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: true,
  auth: { user: SMTP_USER, pass: SMTP_PASS },
  tls: { rejectUnauthorized: false },
})

function generateCode() {
  return String(Math.floor(1000 + Math.random() * 9000))
}

function emailHtml(code) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#0a0a0f;font-family:Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0">
  <tr><td align="center" style="padding:40px 20px">
    <table width="420" cellpadding="0" cellspacing="0" style="background:#12121a;border-radius:16px;border:1px solid #2a2a3d">
      <tr><td style="padding:36px 40px 28px">
        <div style="text-align:center;font-size:26px;font-weight:900;letter-spacing:-1px;margin-bottom:8px;color:#f0f0f8">
          Card<span style="color:#ff4d6d">AI</span>
        </div>
        <p style="text-align:center;font-size:14px;color:#7070a0;margin:0 0 28px">
          Ваш код для входа в аккаунт
        </p>
        <div style="text-align:center;font-size:40px;font-weight:900;letter-spacing:16px;padding:22px 16px;background:#1c1c28;border-radius:14px;color:#f0f0f8;margin:0 0 24px;border:1px solid #2a2a3d">
          ${code}
        </div>
        <p style="text-align:center;font-size:13px;color:#7070a0;margin:0 0 8px">
          Код действителен <strong style="color:#f0f0f8">5 минут</strong>
        </p>
        <p style="text-align:center;font-size:12px;color:#4a4a6a;margin:0">
          Не передавайте код никому. Если вы не запрашивали вход — просто проигнорируйте это письмо.
        </p>
      </td></tr>
      <tr><td style="padding:16px 40px;border-top:1px solid #2a2a3d;text-align:center">
        <span style="font-size:11px;color:#4a4a6a">© CardAI — генератор карточек для WB, Ozon, Авито</span>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`
}

// Auth middleware
function checkSecret(req, res, next) {
  if (req.headers['x-otp-secret'] !== API_SECRET) {
    return res.status(403).json({ error: 'Forbidden' })
  }
  next()
}

// POST /send-otp
app.post('/send-otp', checkSecret, async (req, res) => {
  const { email } = req.body
  if (!email || !String(email).includes('@')) {
    return res.status(400).json({ error: 'Введите корректный email' })
  }

  const norm = String(email).trim().toLowerCase()

  // Rate limit: не чаще раза в 60 сек
  const existing = otpStore.get(norm)
  if (existing && Date.now() < existing.expires - 4 * 60 * 1000) {
    return res.status(429).json({ error: 'Подождите 60 секунд перед повторной отправкой' })
  }

  const code = generateCode()
  otpStore.set(norm, { code, expires: Date.now() + 5 * 60 * 1000, attempts: 0 })

  try {
    await transporter.sendMail({
      from: '"CardAI" <cardai@evdgroup.ru>',
      to: norm,
      subject: `Код подтверждения: ${code}`,
      html: emailHtml(code),
      headers: {
        'X-Mailer': 'CardAI Mailer',
        'Precedence': 'bulk',
        'List-Unsubscribe': '<mailto:cardai@evdgroup.ru?subject=unsubscribe>',
      },
    })
    console.log(`[OTP] ✓ Sent ${code} -> ${norm}`)
    res.json({ ok: true, message: 'Код отправлен на почту' })
  } catch (err) {
    console.error(`[OTP] ✗ SMTP error: ${err.message}`)
    res.status(500).json({ error: 'Ошибка отправки письма: ' + err.message })
  }
})

// POST /verify-otp
app.post('/verify-otp', checkSecret, (req, res) => {
  const { email, code } = req.body
  if (!email || !code) return res.status(400).json({ error: 'email и code обязательны' })

  const norm = String(email).trim().toLowerCase()
  const entry = otpStore.get(norm)

  if (!entry) {
    return res.status(400).json({ error: 'Код не найден или устарел. Запросите новый.' })
  }
  if (Date.now() > entry.expires) {
    otpStore.delete(norm)
    return res.status(400).json({ error: 'Код устарел. Запросите новый.' })
  }
  if (entry.attempts >= 5) {
    return res.status(429).json({ error: 'Слишком много попыток. Запросите новый код.' })
  }
  if (entry.code !== String(code).trim()) {
    entry.attempts++
    return res.status(400).json({ error: `Неверный код. Осталось попыток: ${5 - entry.attempts}` })
  }

  otpStore.delete(norm)
  console.log(`[OTP] ✓ Verified: ${norm}`)
  res.json({ ok: true, email: norm })
})

// GET /health
app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'cardai-otp', uptime: Math.floor(process.uptime()) })
})

app.listen(PORT, '127.0.0.1', () => {
  console.log(`[OTP] Running on 127.0.0.1:${PORT}`)
  console.log(`[OTP] SMTP: ${SMTP_USER} @ ${SMTP_HOST}:${SMTP_PORT}`)
})
