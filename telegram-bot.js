// Lightweight Telegram auth bot for CardAI
// Usage:
//   BOT_TOKEN=your_bot_token \\
//   BACKEND_URL=https://your-domain \\
//   TELEGRAM_BOT_SECRET=same_as_in_env_local \\
//   node telegram-bot.js

/* eslint-disable @typescript-eslint/no-var-requires */
const TelegramBot = require('node-telegram-bot-api')
const http = require('http')
const https = require('https')
const { URL } = require('url')

const BOT_TOKEN = process.env.BOT_TOKEN
const BACKEND_URL = process.env.BACKEND_URL
const BOT_SECRET = process.env.TELEGRAM_BOT_SECRET

if (!BOT_TOKEN) {
  console.error('BOT_TOKEN is not set')
  process.exit(1)
}
if (!BACKEND_URL) {
  console.error('BACKEND_URL is not set')
  process.exit(1)
}
if (!BOT_SECRET) {
  console.error('TELEGRAM_BOT_SECRET is not set')
  process.exit(1)
}

const bot = new TelegramBot(BOT_TOKEN, { polling: true })

bot._loginTokens = {}

bot.onText(/\/start(?:\s+(.+))?/, async (msg, match) => {
  const chatId = msg.chat.id
  const loginToken = (match && match[1]) ? match[1].trim() : ''

  if (!loginToken) {
    await bot.sendMessage(
      chatId,
      'Привет! Открой сайт CardAI и нажми «Войти через Telegram», потом вернись сюда по ссылке.',
    )
    return
  }

  bot._loginTokens[chatId] = loginToken

  const keyboard = {
    reply_markup: {
      keyboard: [[{ text: 'Поделиться телефоном', request_contact: true }]],
      resize_keyboard: true,
      one_time_keyboard: true,
    },
  }

  await bot.sendMessage(
    chatId,
    'Нажми «Поделиться телефоном», чтобы завершить вход на сайте.\n' +
      'Если не хочешь делиться номером — можешь пропустить, вход всё равно сработает.',
    keyboard,
  )

  await completeLogin(
    loginToken,
    msg.from.id,
    msg.from.username,
    msg.from.first_name,
    msg.from.last_name,
    undefined,
    chatId,
  )
})

bot.on('contact', async (msg) => {
  const chatId = msg.chat.id
  const contact = msg.contact
  const loginToken = bot._loginTokens[chatId]
  if (!loginToken) return

  await completeLogin(
    loginToken,
    msg.from.id,
    msg.from.username,
    msg.from?.first_name,
    msg.from?.last_name,
    contact.phone_number,
    chatId,
  )
})

async function completeLogin(token, telegramId, username, firstName, lastName, phone, chatId) {
  try {
    const data = await postJson('/api/auth/telegram/complete', {
      token,
      telegramId,
      username,
      firstName,
      lastName,
      phone,
    })
    if (!data || !data.ok) {
      console.error('Backend error', data)
      await bot.sendMessage(chatId, 'Не удалось завершить вход. Попробуй ещё раз с сайта.')
      return
    }
    await bot.sendMessage(chatId, 'Готово! Вернись в браузер — аккаунт уже авторизован.')
    delete bot._loginTokens[chatId]
  } catch (e) {
    console.error(e)
    await bot.sendMessage(chatId, 'Ошибка при связи с сайтом. Попробуй ещё раз позже.')
  }
}

function postJson(pathname, body) {
  return new Promise((resolve, reject) => {
    try {
      const base = new URL(BACKEND_URL)
      const isHttps = base.protocol === 'https:'
      const client = isHttps ? https : http

      const data = JSON.stringify(body)

      const options = {
        hostname: base.hostname,
        port: base.port || (isHttps ? 443 : 80),
        path: pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data),
          'x-telegram-bot-secret': BOT_SECRET,
        },
      }

      const req = client.request(options, (res) => {
        let raw = ''
        res.setEncoding('utf8')
        res.on('data', (chunk) => {
          raw += chunk
        })
        res.on('end', () => {
          try {
            const parsed = raw ? JSON.parse(raw) : {}
            resolve(parsed)
          } catch (e) {
            reject(e)
          }
        })
      })

      req.on('error', (e) => {
        reject(e)
      })

      req.write(data)
      req.end()
    } catch (e) {
      reject(e)
    }
  })
}

console.log('Telegram bot started and polling...')

