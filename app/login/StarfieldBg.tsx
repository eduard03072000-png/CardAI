'use client'

import { useEffect, useRef, memo } from 'react'

const StarfieldBg = memo(function StarfieldBg() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    let W = canvas.width = window.innerWidth
    let H = canvas.height = window.innerHeight
    let animId: number

    const stars = Array.from({ length: 160 }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      r: Math.random() * 1.4 + 0.2,
      speed: Math.random() * 0.3 + 0.05,
      alpha: Math.random() * 0.6 + 0.1,
      pulse: Math.random() * Math.PI * 2,
      color: ['rgba(255,255,255,', 'rgba(200,180,255,', 'rgba(255,180,200,', 'rgba(180,255,230,'][Math.floor(Math.random() * 4)],
    }))

    let shooters: { x: number; y: number; len: number; speed: number; angle: number; alpha: number; life: number }[] = []
    let shootTimer: ReturnType<typeof setTimeout>
    function addShooter() {
      shooters.push({ x: Math.random() * W, y: Math.random() * H * 0.5, len: Math.random() * 120 + 60, speed: Math.random() * 8 + 6, angle: Math.PI / 4 + (Math.random() - 0.5) * 0.4, alpha: 1, life: 0 })
      shootTimer = setTimeout(addShooter, Math.random() * 3000 + 1500)
    }
    shootTimer = setTimeout(addShooter, 800)

    function draw() {
      ctx.clearRect(0, 0, W, H)
      stars.forEach(s => {
        s.pulse += 0.02
        const a = s.alpha * (0.7 + 0.3 * Math.sin(s.pulse))
        ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2)
        ctx.fillStyle = s.color + a + ')'; ctx.fill()
        s.y -= s.speed * 0.1
        if (s.y < 0) { s.y = H; s.x = Math.random() * W }
      })
      shooters = shooters.filter(s => s.alpha > 0)
      shooters.forEach(s => {
        s.life++; s.alpha = Math.max(0, 1 - s.life / 40)
        const dx = Math.cos(s.angle) * s.len, dy = Math.sin(s.angle) * s.len
        const grad = ctx.createLinearGradient(s.x, s.y, s.x - dx, s.y - dy)
        grad.addColorStop(0, `rgba(255,255,255,${s.alpha})`); grad.addColorStop(1, 'rgba(255,255,255,0)')
        ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(s.x - dx, s.y - dy)
        ctx.strokeStyle = grad; ctx.lineWidth = 1.5; ctx.stroke()
        s.x += Math.cos(s.angle) * s.speed; s.y += Math.sin(s.angle) * s.speed
      })
      animId = requestAnimationFrame(draw)
    }
    draw()

    function onResize() { if (!canvas) return; W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight }
    window.addEventListener('resize', onResize)
    return () => { cancelAnimationFrame(animId); clearTimeout(shootTimer); window.removeEventListener('resize', onResize) }
  }, [])

  const BG_CARDS = [
    { emoji: '👟', grad: 'linear-gradient(135deg,#1a1a2e,#2a1040)', title: 'Кроссовки мужские Air Max', price: '3 490 ₽', pct: '82%', style: { left: '3%', top: '10%' } },
    { emoji: '👜', grad: 'linear-gradient(135deg,#0f1a1a,#0a2020)', title: 'Сумка кожаная шоппер', price: '4 290 ₽', pct: '91%', style: { right: '3%', top: '8%' } },
    { emoji: '🧥', grad: 'linear-gradient(135deg,#1a0a0a,#2e1010)', title: 'Куртка женская оверсайз', price: '6 890 ₽', pct: '76%', style: { left: '2%', bottom: '15%' } },
    { emoji: '📱', grad: 'linear-gradient(135deg,#0a1a0a,#102010)', title: 'Чехол iPhone прозрачный', price: '890 ₽', pct: '68%', style: { right: '2%', bottom: '18%' } },
    { emoji: '🎧', grad: 'linear-gradient(135deg,#1a1008,#2a2010)', title: 'Наушники TWS беспроводные', price: '2 190 ₽', pct: '88%', style: { left: '50%', top: '5%', transform: 'translateX(-50%)' } },
  ]

  return (
    <>
      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0 }} />

      {/* Scanlines */}
      <div style={{ position: 'absolute', inset: 0, background: 'repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.03) 2px,rgba(0,0,0,0.03) 4px)', pointerEvents: 'none', zIndex: 1 }} />

      {/* Rotating rings */}
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', zIndex: 2 }}>
        {[
          { size: 600, color: 'rgba(124,58,237,0.12)', dur: '25s', dot: 'rgba(124,58,237,0.7)', shadow: 'rgba(124,58,237,0.8)', rev: false },
          { size: 850, color: 'rgba(255,77,109,0.08)', dur: '40s', dot: 'rgba(255,77,109,0.6)', shadow: 'rgba(255,77,109,0.8)', rev: true },
          { size: 1100, color: 'rgba(34,211,160,0.05)', dur: '60s', dot: 'rgba(34,211,160,0.5)', shadow: 'rgba(34,211,160,0.8)', rev: false },
        ].map((r, i) => (
          <div key={i} style={{ position: 'absolute', width: r.size, height: r.size, borderRadius: '50%', border: `1px solid ${r.color}`, animation: `ringRotate ${r.dur} linear infinite ${r.rev ? 'reverse' : ''}` }}>
            <div style={{ position: 'absolute', top: -4, left: '50%', width: 8, height: 8, borderRadius: '50%', background: r.dot, boxShadow: `0 0 10px ${r.shadow}`, transform: 'translateX(-50%)' }} />
          </div>
        ))}
      </div>

      {/* Neon beams */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 3 }}>
        {[
          { x: '8%', dur: '5s', delay: '0s', h: 300, clr: 'rgba(124,58,237,0.6)' },
          { x: '18%', dur: '7s', delay: '-2s', h: 200, clr: 'rgba(255,77,109,0.5)' },
          { x: '30%', dur: '4s', delay: '-1s', h: 250, clr: 'rgba(34,211,160,0.4)' },
          { x: '55%', dur: '6s', delay: '-3s', h: 350, clr: 'rgba(124,58,237,0.5)' },
          { x: '72%', dur: '5s', delay: '-4s', h: 280, clr: 'rgba(255,77,109,0.6)' },
          { x: '85%', dur: '8s', delay: '-0.5s', h: 220, clr: 'rgba(34,211,160,0.5)' },
          { x: '93%', dur: '4.5s', delay: '-2.5s', h: 300, clr: 'rgba(124,58,237,0.4)' },
        ].map((b, i) => (
          <div key={i} style={{ position: 'absolute', width: 1, left: b.x, height: b.h, top: -b.h, background: `linear-gradient(180deg,transparent 0%,${b.clr} 50%,transparent 100%)`, animation: `beamFall ${b.dur} linear infinite`, animationDelay: b.delay, opacity: 0 }} />
        ))}
      </div>

      {/* Floating product cards */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 4 }}>
        {BG_CARDS.map((c, i) => (
          <div key={i} style={{ position: 'absolute', width: 130 + i * 5, background: 'rgba(18,18,26,0.7)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: 12, backdropFilter: 'blur(4px)', display: 'flex', flexDirection: 'column', gap: 6, animation: `bgFloat ${12 + i * 2}s ease-in-out infinite`, animationDelay: `${-i * 3}s`, ...c.style } as React.CSSProperties}>
            <div style={{ aspectRatio: '1', borderRadius: 8, background: c.grad, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>{c.emoji}</div>
            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', lineHeight: 1.4 }}>{c.title}</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}>{c.price}</div>
            <div style={{ height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
              <div style={{ height: '100%', borderRadius: 2, background: 'linear-gradient(90deg,#7c3aed,#ff4d6d)', width: c.pct }} />
            </div>
          </div>
        ))}
      </div>

      {/* Orbs */}
      <div style={{ position: 'absolute', top: '10%', left: '15%', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle,rgba(124,58,237,0.15),transparent 70%)', filter: 'blur(40px)', pointerEvents: 'none', zIndex: 1 }} />
      <div style={{ position: 'absolute', bottom: '15%', right: '10%', width: 250, height: 250, borderRadius: '50%', background: 'radial-gradient(circle,rgba(255,77,109,0.12),transparent 70%)', filter: 'blur(40px)', pointerEvents: 'none', zIndex: 1 }} />

      <style>{`
        @keyframes ringRotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes beamFall {
          0%   { opacity: 0; transform: translateY(0); }
          10%  { opacity: 1; }
          90%  { opacity: 0.6; }
          100% { opacity: 0; transform: translateY(110vh); }
        }
        @keyframes bgFloat {
          0%,100% { transform: translateY(0px); opacity: 0.32; }
          50%      { transform: translateY(-18px); opacity: 0.42; }
        }
      `}</style>
    </>
  )
})

export default StarfieldBg
