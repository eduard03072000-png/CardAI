'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import StarfieldBg from './StarfieldBg'

type Step = 'input' | 'otp'

export default function LoginPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('input')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState(['', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [devCode, setDevCode] = useState('')
  const [countdown, setCountdown] = useState(0)
  const [sentTo, setSentTo] = useState('')

  const codeRefs = [
    useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null),
  ]

  useEffect(() => {
    if (countdown <= 0) return
    const t = setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [countdown])
  // Проверяем URL-параметры ошибок OAuth
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const err = params.get('error')
    if (err) {
      const messages: Record<string, string> = {
        vk_denied: 'Вход через VK отменён',
        vk_token: 'Ошибка авторизации VK',
        vk_failed: 'Не удалось войти через VK',
        yandex_denied: 'Вход через Яндекс отменён',
        yandex_token: 'Ошибка авторизации Яндекс',
        yandex_failed: 'Не удалось войти через Яндекс',
      }
      setError(messages[err] || 'Ошибка авторизации')
    }
  }, [])

  async function send() {
    if (!email.includes('@')) {
      setError('Введите корректный email'); return
    }
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      if (data.devCode) setDevCode(data.devCode)
      setSentTo(email)
      setStep('otp')
      setCountdown(60)
      setTimeout(() => codeRefs[0].current?.focus(), 100)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Ошибка')
    } finally {
      setLoading(false)
    }
  }
  function handleCodeInput(i: number, val: string) {
    if (!/^\d*$/.test(val)) return
    const next = [...code]; next[i] = val.slice(-1); setCode(next)
    if (val && i < 3) codeRefs[i + 1].current?.focus()
    if (next.every(c => c) && val) verify(next.join(''))
  }

  async function verify(codeStr?: string) {
    const c = codeStr || code.join('')
    if (c.length !== 4) { setError('Введите 4-значный код'); return }
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: sentTo, code: c }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      router.push('/dashboard')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Неверный код')
      setCode(['', '', '', ''])
      setTimeout(() => codeRefs[0].current?.focus(), 50)
    } finally {
      setLoading(false)
    }
  }

  const inp: React.CSSProperties = {
    background: '#1c1c28', border: '1px solid #2a2a3d', borderRadius: 10,
    padding: '14px 16px', fontSize: 16, color: '#f0f0f8',
    fontFamily: 'inherit', outline: 'none', transition: 'border-color 0.2s',
    boxSizing: 'border-box', width: '100%',
  }
  return (
    <div style={{ position: 'fixed', inset: 0, background: '#0a0a0f', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
      <StarfieldBg />

      {/* Auth card */}
      <div style={{ position: 'relative', zIndex: 20, width: '100%', maxWidth: 400, margin: '0 20px', background: '#12121a', border: '1px solid #2a2a3d', borderRadius: 24, padding: '40px 36px 32px', boxShadow: '0 40px 80px rgba(0,0,0,0.6)' }}>

        <div className="font-unbounded font-black" style={{ fontSize: 24, letterSpacing: -1, textAlign: 'center', marginBottom: 6 }}>
          Card<span style={{ color: '#ff4d6d' }}>AI</span>
        </div>
        <p style={{ textAlign: 'center', fontSize: 13, color: '#7070a0', marginBottom: 28, lineHeight: 1.5 }}>
          Войдите, чтобы генерировать карточки товаров
        </p>

        {step === 'input' ? (
          <>
            {/* Email input */}
            <div style={{ marginBottom: 12 }}>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                style={inp}
                onFocus={e => (e.target.style.borderColor = '#7c3aed')}
                onBlur={e => (e.target.style.borderColor = '#2a2a3d')}
                onKeyDown={e => e.key === 'Enter' && send()}
                autoFocus
              />
            </div>
            <p style={{ fontSize: 12, color: '#7070a0', textAlign: 'center', marginBottom: 16 }}>Пришлём код подтверждения на почту</p>
            {error && <p style={{ color: '#ff4d6d', fontSize: 13, marginBottom: 12, textAlign: 'center' }}>{error}</p>}

            <button onClick={send} disabled={loading} className="font-unbounded font-bold"
              style={{ width: '100%', padding: 15, background: 'linear-gradient(135deg,#ff4d6d,#7c3aed)', border: 'none', borderRadius: 12, color: 'white', fontSize: 14, cursor: 'pointer', marginBottom: 20, opacity: loading ? 0.6 : 1, fontFamily: 'inherit', letterSpacing: -0.3 }}>
              {loading ? 'Отправляю...' : 'Получить код →'}
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14, color: '#7070a0', fontSize: 12 }}>
              <div style={{ flex: 1, height: 1, background: '#2a2a3d' }} />или войти через<div style={{ flex: 1, height: 1, background: '#2a2a3d' }} />
            </div>

            <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
              <a href="/api/auth/vk"
                style={{ flex: 1, padding: '11px 6px', background: '#1c1c28', border: '1px solid #2a2a3d', borderRadius: 10, color: '#4680C2', fontFamily: 'inherit', fontSize: 12, cursor: 'pointer', textDecoration: 'none', textAlign: 'center', fontWeight: 600, transition: 'border-color 0.2s' }}
                onMouseOver={e => (e.currentTarget.style.borderColor = '#4680C2')}
                onMouseOut={e => (e.currentTarget.style.borderColor = '#2a2a3d')}>
                VK ID
              </a>
              <a href="/api/auth/yandex"
                style={{ flex: 1, padding: '11px 6px', background: '#1c1c28', border: '1px solid #2a2a3d', borderRadius: 10, color: '#FC3F1D', fontFamily: 'inherit', fontSize: 12, cursor: 'pointer', textDecoration: 'none', textAlign: 'center', fontWeight: 600, transition: 'border-color 0.2s' }}
                onMouseOver={e => (e.currentTarget.style.borderColor = '#FC3F1D')}
                onMouseOut={e => (e.currentTarget.style.borderColor = '#2a2a3d')}>
                Яндекс
              </a>
              <button
                onClick={() => { window.location.href = '/api/auth/telegram/start' }}
                style={{ flex: 1, padding: '11px 6px', background: '#1c1c28', border: '1px solid #2a2a3d', borderRadius: 10, color: '#26A5E4', fontFamily: 'inherit', fontSize: 12, cursor: 'pointer', fontWeight: 600, transition: 'border-color 0.2s' }}
                onMouseOver={e => (e.currentTarget.style.borderColor = '#26A5E4')}
                onMouseOut={e => (e.currentTarget.style.borderColor = '#2a2a3d')}>
                Telegram
              </button>
            </div>
          </>
        ) : (
          <>
            <div style={{ fontSize: 13, color: '#7070a0', textAlign: 'center', marginBottom: 16 }}>
              Код отправлен на <strong style={{ color: '#f0f0f8' }}>{sentTo}</strong>
            </div>
            {devCode && (
              <div style={{ marginBottom: 16, background: 'rgba(34,211,160,0.08)', border: '1px solid rgba(34,211,160,0.2)', color: '#22d3a0', borderRadius: 10, padding: 10, textAlign: 'center', fontSize: 13 }}>
                DEV: код <strong>{devCode}</strong>
              </div>
            )}
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 16 }}>
              {code.map((c, i) => (
                <input key={i} ref={codeRefs[i]} type="text" inputMode="numeric" maxLength={1} value={c}
                  onChange={e => handleCodeInput(i, e.target.value)}
                  onKeyDown={e => { if (e.key === 'Backspace' && !code[i] && i > 0) codeRefs[i - 1].current?.focus() }}
                  className="font-unbounded font-bold"
                  style={{ width: 60, height: 68, textAlign: 'center', fontSize: 24, background: '#1c1c28', border: `1px solid ${c ? '#7c3aed' : '#2a2a3d'}`, borderRadius: 12, color: '#f0f0f8', outline: 'none', fontFamily: 'inherit', transition: 'border-color 0.2s' }}
                  onFocus={e => (e.target.style.borderColor = '#7c3aed')}
                  onBlur={e => (e.target.style.borderColor = c ? '#7c3aed' : '#2a2a3d')} />
              ))}
            </div>
            {error && <p style={{ color: '#ff4d6d', fontSize: 13, textAlign: 'center', marginBottom: 12 }}>{error}</p>}
            <button onClick={() => verify()} disabled={loading || code.some(c => !c)} className="font-unbounded font-bold"
              style={{ width: '100%', padding: 15, background: 'linear-gradient(135deg,#ff4d6d,#7c3aed)', border: 'none', borderRadius: 12, color: 'white', fontSize: 14, cursor: 'pointer', marginBottom: 16, opacity: loading || code.some(c => !c) ? 0.5 : 1, fontFamily: 'inherit' }}>
              {loading ? 'Проверяю...' : 'Войти'}
            </button>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button onClick={() => { setStep('input'); setCode(['', '', '', '']); setError('') }}
                style={{ background: 'none', border: 'none', color: '#7070a0', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>← Изменить</button>
              {countdown > 0
                ? <span style={{ fontSize: 12, color: '#4a4a6a' }}>Повтор через {countdown}с</span>
                : <button onClick={send} style={{ background: 'none', border: 'none', color: '#7070a0', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>Отправить снова</button>}
            </div>
          </>
        )}

        <p style={{ fontSize: 11, color: '#4a4a6a', textAlign: 'center', marginTop: 20, lineHeight: 1.6 }}>
          Нажимая «Получить код», вы соглашаетесь с{' '}
          <span style={{ color: '#7070a0', textDecoration: 'underline', cursor: 'pointer' }}>Условиями</span> и{' '}
          <span style={{ color: '#7070a0', textDecoration: 'underline', cursor: 'pointer' }}>Политикой</span>
        </p>
      </div>

      {/* Platform badges */}
      <div style={{ position: 'absolute', bottom: 32, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 10, zIndex: 20 }}>
        {[['#cb11ab', 'WB'], ['#005bff', 'Ozon'], ['#ffc700', 'Авито']].map(([c, n]) => (
          <span key={n} style={{ fontSize: 12, padding: '5px 14px', borderRadius: 20, background: `${c}18`, color: c, border: `1px solid ${c}30` }}>{n}</span>
        ))}
      </div>
    </div>
  )
}