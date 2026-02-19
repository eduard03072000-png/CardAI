// SMS провайдер. DEV_MODE=true — просто логирует код в консоль
// В продакшне подключи SMSC.ru или SMS.ru

export async function sendSMS(phone: string, code: string): Promise<boolean> {
  const message = `CardAI: ваш код подтверждения ${code}. Не сообщайте никому.`

  // DEV режим
  if (process.env.DEV_MODE === 'true') {
    console.log(`\n📱 SMS DEV MODE`)
    console.log(`   Телефон: ${phone}`)
    console.log(`   Код: ${code}`)
    console.log(`   Сообщение: ${message}\n`)
    return true
  }

  // SMSC.ru
  if (process.env.SMSC_LOGIN && process.env.SMSC_PASSWORD) {
    return sendViaSMSC(phone, message)
  }

  // SMS.ru
  if (process.env.SMSRU_API_KEY) {
    return sendViaSMSRU(phone, message)
  }

  console.warn('SMS провайдер не настроен. Используйте DEV_MODE=true или настройте SMSC/SMSRU')
  return false
}

async function sendViaSMSC(phone: string, message: string): Promise<boolean> {
  const params = new URLSearchParams({
    login: process.env.SMSC_LOGIN!,
    psw: process.env.SMSC_PASSWORD!,
    phones: phone,
    mes: message,
    fmt: '3', // JSON
    charset: 'utf-8',
  })
  try {
    const res = await fetch(`https://smsc.ru/sys/send.php?${params}`)
    const data = await res.json()
    return !data.error
  } catch {
    return false
  }
}

async function sendViaSMSRU(phone: string, message: string): Promise<boolean> {
  const params = new URLSearchParams({
    api_id: process.env.SMSRU_API_KEY!,
    to: phone,
    msg: message,
    json: '1',
  })
  try {
    const res = await fetch(`https://sms.ru/sms/send?${params}`)
    const data = await res.json()
    return data.status === 'OK'
  } catch {
    return false
  }
}
