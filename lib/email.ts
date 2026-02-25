// Email отправка OTP кода
// DEV_MODE=true — логирует в консоль
// Продакшн — через SMTP (nodemailer) или Resend API

import nodemailer from 'nodemailer'

export async function sendEmailOTP(email: string, code: string): Promise<boolean> {
  const subject = `CardAI — код подтверждения: ${code}`
  const html = `
    <div style="font-family:sans-serif;max-width:400px;margin:0 auto;padding:32px;background:#12121a;color:#f0f0f8;border-radius:16px">
      <h2 style="text-align:center;margin:0 0 8px">Card<span style="color:#ff4d6d">AI</span></h2>
      <p style="text-align:center;color:#7070a0;font-size:14px;margin:0 0 24px">Ваш код подтверждения</p>
      <div style="text-align:center;font-size:32px;font-weight:bold;letter-spacing:8px;padding:16px;background:#1c1c28;border-radius:12px;margin:0 0 24px">${code}</div>
      <p style="text-align:center;color:#7070a0;font-size:12px;margin:0">Код действителен 5 минут. Не сообщайте его никому.</p>
    </div>
  `

  // DEV режим
  if (process.env.DEV_MODE === 'true') {
    console.log(`\n📧 EMAIL DEV MODE`)
    console.log(`   Email: ${email}`)
    console.log(`   Код: ${code}\n`)
    return true
  }

  // Resend API
  if (process.env.RESEND_API_KEY) {
    return sendViaResend(email, subject, html)
  }

  // SMTP (nodemailer)
  if (process.env.SMTP_HOST) {
    return sendViaSMTP(email, subject, html)
  }

  console.warn('Email провайдер не настроен. Используйте DEV_MODE=true или настройте SMTP/Resend')
  return false
}
async function sendViaResend(email: string, subject: string, html: string): Promise<boolean> {
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM || 'CardAI <noreply@cardai.ru>',
        to: email,
        subject,
        html,
      }),
    })
    const data = await res.json()
    return !!data.id
  } catch (e) {
    console.error('Resend error:', e)
    return false
  }
}

async function sendViaSMTP(email: string, subject: string, html: string): Promise<boolean> {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })
    await transporter.sendMail({
      from: process.env.SMTP_FROM || 'CardAI <noreply@cardai.ru>',
      to: email,
      subject,
      html,
    })
    return true
  } catch (e) {
    console.error('SMTP error:', e)
    return false
  }
}