'use client'

import { useEffect, useRef, useState } from 'react'

type Phase = 'idle' | 'errors' | 'shortcut' | 'capturing' | 'result' | 'fading' | 'logo'

const ERRORS = [
  { level: 'error' as const, msg: "TypeError: Cannot read properties of null (reading 'id')", src: 'checkout.js:142' },
  { level: 'error' as const, msg: 'POST https://api.acmeco.com/payment/process 500', src: 'fetch (async)' },
  { level: 'warn'  as const, msg: 'Failed to prefetch: /api/cart/validate', src: 'router.js:89' },
]

const TICKET_SECTIONS = [
  { delay: 200,  type: 'title',      content: 'Checkout crashes on payment submit' },
  { delay: 900,  type: 'label',      content: 'Steps to reproduce' },
  { delay: 1200, type: 'step',       content: '1.  Add an item to cart' },
  { delay: 1550, type: 'step',       content: '2.  Fill checkout with a saved address' },
  { delay: 1900, type: 'step',       content: '3.  Click "Pay Now" — page throws TypeError' },
  { delay: 2500, type: 'label',      content: 'Expected vs Actual' },
  { delay: 2800, type: 'expected',   content: 'Payment processes and order is confirmed' },
  { delay: 3100, type: 'actual',     content: "TypeError: null (reading 'id') — page freezes" },
  { delay: 3700, type: 'label',      content: 'Root cause' },
  { delay: 4000, type: 'cause',      content: 'cartItem.id is null when a saved address populates the form. No null-guard before the payment handler.' },
  { delay: 4800, type: 'playwright', content: '✓  Playwright test generated' },
]

export default function HeroDemo() {
  const [phase, setPhase]             = useState<Phase>('idle')
  const [errorCount, setErrorCount]   = useState(0)
  const [shortcutKey, setShortcutKey] = useState(0)
  const [sections, setSections]       = useState<number[]>([])
  const [eventCount, setEventCount]   = useState(0)
  // logo screen state
  const [logoIn, setLogoIn]           = useState(false)
  const [logoFade, setLogoFade]       = useState(false)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])

  function t(fn: () => void, ms: number) {
    timers.current.push(setTimeout(fn, ms))
  }

  function runLoop() {
    timers.current.forEach(clearTimeout)
    timers.current = []

    // — reset everything —
    setPhase('idle')
    setErrorCount(0)
    setShortcutKey(0)
    setSections([])
    setEventCount(0)
    setLogoIn(false)
    setLogoFade(false)

    // idle: event counter ticks up
    t(() => setEventCount(14),  600)
    t(() => setEventCount(27), 1000)
    t(() => setEventCount(41), 1500)
    t(() => setEventCount(58), 2000)

    // errors appear
    t(() => setPhase('errors'), 2600)
    t(() => setErrorCount(1), 3100)
    t(() => setErrorCount(2), 3900)
    t(() => setErrorCount(3), 4700)

    // shortcut keys light up
    t(() => { setPhase('shortcut'); setShortcutKey(1) }, 5800)
    t(() => setShortcutKey(2), 6150)
    t(() => setShortcutKey(3), 6500)

    // capturing flash
    t(() => setPhase('capturing'), 6900)

    // result — ticket builds section by section
    t(() => setPhase('result'), 7600)
    TICKET_SECTIONS.forEach((sec, i) => {
      t(() => setSections(prev => [...prev, i]), 7600 + sec.delay)
    })

    // transition to fading → logo → loop
    t(() => setPhase('fading'),  18200)
    t(() => { setPhase('logo'); setLogoIn(false) }, 18900)
    t(() => setLogoIn(true),    19100)   // logo animates IN
    t(() => setLogoFade(true),  22200)   // logo fades OUT
    t(runLoop,                  23500)   // restart
  }

  useEffect(() => {
    runLoop()
    return () => timers.current.forEach(clearTimeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const isCheckout = phase !== 'result' && phase !== 'fading' && phase !== 'logo'
  const isResult   = phase === 'result'
  const isLogo     = phase === 'logo'

  return (
    <div className="relative w-full select-none">

      {/* ring-ping keyframes injected once */}
      <style>{`
        @keyframes reprod-ring {
          0%   { transform: scale(0.2); opacity: 0.8; }
          100% { transform: scale(3);   opacity: 0; }
        }
        .reprod-ring { animation: reprod-ring 2s ease-out infinite; }
        .reprod-ring-d1 { animation-delay: 0s; }
        .reprod-ring-d2 { animation-delay: 0.55s; }
        .reprod-ring-d3 { animation-delay: 1.1s; }

        @keyframes reprod-icon-in {
          0%   { transform: scale(0.3) rotate(-15deg); opacity: 0; }
          60%  { transform: scale(1.15) rotate(4deg);  opacity: 1; }
          100% { transform: scale(1) rotate(0deg);     opacity: 1; }
        }
        .reprod-icon-in { animation: reprod-icon-in 0.6s cubic-bezier(0.34,1.56,0.64,1) forwards; }

        @keyframes reprod-word-in {
          0%   { transform: translateY(10px); opacity: 0; }
          100% { transform: translateY(0);    opacity: 1; }
        }
        .reprod-word-in  { animation: reprod-word-in 0.45s ease-out 0.3s forwards; opacity: 0; }
        .reprod-tag-in   { animation: reprod-word-in 0.45s ease-out 0.55s forwards; opacity: 0; }
      `}</style>

      {/* ── Browser shell ───────────────────────────────── */}
      <div className="overflow-hidden rounded-2xl border border-white/10 shadow-[0_32px_80px_rgba(0,0,0,0.6)]">

        {/* Title bar */}
        <div className="flex items-center gap-3 bg-gray-800 px-4 py-3">
          <div className="flex gap-1.5">
            <span className="h-3 w-3 rounded-full bg-red-500/80" />
            <span className="h-3 w-3 rounded-full bg-yellow-500/80" />
            <span className="h-3 w-3 rounded-full bg-green-500/80" />
          </div>
          <div className="flex flex-1 items-center gap-2 rounded-md bg-gray-700/60 px-3 py-1.5">
            <svg className="h-3 w-3 shrink-0 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
            </svg>
            <span className="text-xs text-gray-300 transition-all duration-500">
              {isResult || isLogo ? 'reprod.app/bugs/42' : 'acmeco.com/checkout'}
            </span>
          </div>
          <div className="flex items-center gap-1.5 rounded-full bg-green-900/60 px-2 py-1">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
            </span>
            <span className="text-[10px] font-medium text-green-400">
              {phase === 'idle' ? `${eventCount} events` : 'Reprod'}
            </span>
          </div>
        </div>

        {/* ── Content area ─────────────────────────────── */}
        <div className="relative" style={{ height: 340 }}>

          {/* ══ CHECKOUT PAGE ══ */}
          <div
            className="absolute inset-0 flex flex-col bg-white transition-opacity duration-500"
            style={{ opacity: isCheckout ? 1 : 0, pointerEvents: isCheckout ? 'auto' : 'none' }}
          >
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3">
              <div className="flex items-center gap-2">
                <div className="h-5 w-5 rounded bg-indigo-600" />
                <span className="text-sm font-bold text-gray-800">AcmeCo</span>
              </div>
              <div className="flex gap-4 text-xs text-gray-500">
                <span>Dashboard</span><span>Orders</span>
                <span className="font-medium text-indigo-600">Checkout</span>
              </div>
              <div className="h-7 w-7 rounded-full bg-gray-200" />
            </div>

            <div className="flex flex-1 gap-4 overflow-hidden p-4">
              <div className="flex flex-1 flex-col gap-2.5">
                <p className="text-sm font-semibold text-gray-700">Payment details</p>
                <div className="flex h-8 items-center rounded-lg border border-gray-200 bg-gray-50 px-3">
                  <span className="text-xs text-gray-400">4242  4242  4242  4242</span>
                </div>
                <div className="flex gap-2">
                  <div className="h-8 flex-1 rounded-lg border border-gray-200 bg-gray-50" />
                  <div className="h-8 w-14 rounded-lg border border-gray-200 bg-gray-50" />
                </div>
                <div className="h-8 rounded-lg border border-gray-200 bg-gray-50" />
                <button className="mt-1 w-full rounded-lg bg-indigo-600 py-2 text-xs font-semibold text-white">
                  Pay Now — $129.00
                </button>
              </div>
              <div className="w-32 shrink-0 space-y-2">
                <p className="text-xs font-semibold text-gray-600">Summary</p>
                <div className="rounded-lg border border-gray-100 bg-gray-50 p-2 space-y-1.5">
                  <div className="flex justify-between text-xs text-gray-500"><span>Pro plan</span><span>$99</span></div>
                  <div className="flex justify-between text-xs text-gray-500"><span>Add-ons</span><span>$30</span></div>
                  <div className="border-t border-gray-200 pt-1.5 flex justify-between text-xs font-bold text-gray-800"><span>Total</span><span>$129</span></div>
                </div>
              </div>
            </div>

            {/* Sliding console panel */}
            <div
              className="border-t border-gray-800 bg-gray-950 overflow-hidden transition-all duration-300"
              style={{ maxHeight: phase === 'errors' || phase === 'shortcut' || phase === 'capturing' ? 120 : 0 }}
            >
              <div className="flex items-center gap-3 border-b border-gray-800 px-3 py-1.5">
                <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">Console</span>
                {errorCount > 0 && (
                  <span className="rounded bg-red-900/60 px-1.5 py-0.5 text-[10px] font-bold text-red-400">
                    {errorCount} error{errorCount > 1 ? 's' : ''}
                  </span>
                )}
              </div>
              <div className="space-y-px p-2">
                {ERRORS.slice(0, errorCount).map((err, i) => (
                  <div key={i} className="flex items-start gap-2 px-1 py-0.5 animate-in slide-in-from-bottom-1 duration-200">
                    <span className={`mt-px text-[9px] ${err.level === 'error' ? 'text-red-400' : 'text-yellow-400'}`}>
                      {err.level === 'error' ? '●' : '▲'}
                    </span>
                    <span className="flex-1 font-mono text-[10px] leading-relaxed text-gray-300">{err.msg}</span>
                    <span className="shrink-0 font-mono text-[10px] text-gray-600">{err.src}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Capturing overlay */}
            {phase === 'capturing' && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/90 animate-in fade-in duration-200">
                <div className="flex items-center gap-3 rounded-2xl bg-gray-900 px-5 py-3.5 shadow-2xl">
                  <svg className="h-4 w-4 animate-spin text-green-400" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <div>
                    <p className="text-sm font-semibold text-white">Capturing bug…</p>
                    <p className="text-[10px] text-gray-400">Recording session · screenshot · logs</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ══ REPROD BUG REPORT ══ */}
          <div
            className="absolute inset-0 flex flex-col bg-gray-50 transition-opacity duration-500"
            style={{ opacity: isResult ? 1 : 0, pointerEvents: isResult ? 'auto' : 'none' }}
          >
            <div className="flex items-center gap-2 border-b border-gray-200 bg-white px-4 py-2">
              <span className="flex h-5 w-5 items-center justify-center rounded bg-green-600">
                <span className="h-1.5 w-1.5 rounded-full bg-white" />
              </span>
              <span className="text-xs font-bold text-gray-800">Reprod</span>
              <span className="mx-1 text-gray-300">/</span>
              <span className="text-xs text-gray-500">acmeco</span>
              <span className="text-gray-300">/</span>
              <span className="text-xs font-medium text-gray-700">Bug #42</span>
              <div className="ml-auto flex items-center gap-1.5">
                <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-bold text-orange-700">P2</span>
                <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700">Open</span>
              </div>
            </div>
            <div className="flex flex-1 overflow-hidden">
              <div className="flex flex-1 flex-col overflow-y-auto p-3 gap-1.5">
                {sections.map((idx) => {
                  const sec = TICKET_SECTIONS[idx]
                  if (!sec) return null
                  return (
                    <div key={idx} className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                      {sec.type === 'title' && <p className="text-sm font-bold text-gray-900 leading-snug">{sec.content}</p>}
                      {sec.type === 'label' && <p className="mt-1.5 text-[9px] font-bold uppercase tracking-widest text-green-700">{sec.content}</p>}
                      {sec.type === 'step' && <p className="text-[11px] text-gray-600 leading-relaxed pl-1">{sec.content}</p>}
                      {sec.type === 'expected' && (
                        <div className="flex items-start gap-1.5 rounded bg-green-50 px-2 py-1 text-[10px] text-green-700">
                          <span className="font-bold shrink-0">✓</span><span>{sec.content}</span>
                        </div>
                      )}
                      {sec.type === 'actual' && (
                        <div className="flex items-start gap-1.5 rounded bg-red-50 px-2 py-1 text-[10px] text-red-700">
                          <span className="font-bold shrink-0">✕</span><span>{sec.content}</span>
                        </div>
                      )}
                      {sec.type === 'cause' && <p className="text-[10px] text-gray-500 leading-relaxed pl-1">{sec.content}</p>}
                      {sec.type === 'playwright' && (
                        <div className="mt-2 flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2 animate-in zoom-in-95 duration-300">
                          <svg className="h-3.5 w-3.5 text-green-600" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                          </svg>
                          <span className="text-[11px] font-semibold text-green-700">{sec.content}</span>
                          <span className="ml-auto text-[9px] text-green-500">ready to run in CI</span>
                        </div>
                      )}
                    </div>
                  )
                })}
                {sections.length < TICKET_SECTIONS.length && (
                  <span className="mt-1 inline-block h-3 w-0.5 animate-pulse bg-green-500 rounded" />
                )}
              </div>
              <div className="w-24 shrink-0 space-y-2 border-l border-gray-100 bg-white p-2">
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-wide text-gray-400 mb-1">Screenshot</p>
                  <div className="aspect-video overflow-hidden rounded border border-gray-100 bg-gradient-to-br from-indigo-50 to-slate-50">
                    <div className="p-1 space-y-0.5">
                      <div className="h-1 w-full rounded-sm bg-indigo-100" />
                      <div className="h-1 w-2/3 rounded-sm bg-gray-100" />
                      <div className="mt-1 h-2.5 w-full rounded-sm bg-indigo-400" />
                    </div>
                  </div>
                </div>
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-wide text-gray-400 mb-1">Captured</p>
                  <div className="space-y-0.5 text-[9px] text-gray-500">
                    <p className="flex items-center gap-1"><span className="text-red-400">●</span> 2 errors</p>
                    <p className="flex items-center gap-1"><span className="text-yellow-400">●</span> 1 warning</p>
                    <p className="flex items-center gap-1"><span className="text-orange-400">●</span> 1 net fail</p>
                    <p className="flex items-center gap-1"><span className="text-blue-400">●</span> Session rec</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ══ LOGO SCREEN ══ */}
          <div
            className="absolute inset-0 flex flex-col items-center justify-center transition-opacity duration-700"
            style={{
              background: 'linear-gradient(135deg, #15803d 0%, #16a34a 50%, #14532d 100%)',
              opacity: isLogo ? (logoFade ? 0 : 1) : 0,
              pointerEvents: isLogo ? 'auto' : 'none',
            }}
          >
            {/* subtle grid overlay */}
            <div
              className="pointer-events-none absolute inset-0 opacity-10"
              style={{
                backgroundImage: 'linear-gradient(to right,#fff 1px,transparent 1px),linear-gradient(to bottom,#fff 1px,transparent 1px)',
                backgroundSize: '32px 32px',
              }}
            />

            {/* Rings + icon */}
            {logoIn && (
              <div className="relative flex items-center justify-center">
                {/* pinging rings */}
                <span className="reprod-ring reprod-ring-d1 absolute h-16 w-16 rounded-full border border-white/40" />
                <span className="reprod-ring reprod-ring-d2 absolute h-16 w-16 rounded-full border border-white/30" />
                <span className="reprod-ring reprod-ring-d3 absolute h-16 w-16 rounded-full border border-white/20" />

                {/* central icon — bounces in */}
                <div className="reprod-icon-in relative z-10 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 shadow-[0_0_32px_rgba(255,255,255,0.2)] backdrop-blur-sm">
                  <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
                    {/* outer target ring */}
                    <circle cx="12" cy="12" r="9" strokeOpacity="0.5" />
                    {/* inner dot */}
                    <circle cx="12" cy="12" r="3" fill="currentColor" strokeWidth={0} />
                    {/* crosshair lines */}
                    <path strokeLinecap="round" d="M12 3v3M12 18v3M3 12h3M18 12h3" />
                  </svg>
                </div>
              </div>
            )}

            {/* Wordmark + tagline */}
            {logoIn && (
              <div className="mt-5 text-center">
                <p className="reprod-word-in text-2xl font-extrabold tracking-tight text-white">
                  Reprod
                </p>
                <p className="reprod-tag-in text-sm font-medium text-white/60">
                  Bug captured.
                </p>
              </div>
            )}
          </div>

        </div>{/* end content area */}
      </div>{/* end browser shell */}

      {/* ── Keyboard shortcut badge ───────────────────────── */}
      <div
        className="absolute -bottom-11 left-1/2 flex -translate-x-1/2 items-center gap-1.5 transition-opacity duration-300"
        style={{ opacity: phase === 'shortcut' || phase === 'capturing' ? 1 : 0 }}
      >
        {(['Ctrl', 'Shift', 'U'] as const).map((key, i) => (
          <div
            key={key}
            className={`flex h-7 min-w-[2rem] items-center justify-center rounded-md border px-2 text-[11px] font-bold transition-all duration-150 ${
              shortcutKey > i
                ? 'scale-95 border-green-500 bg-green-900/80 text-green-300 shadow-[0_0_10px_rgba(74,222,128,0.4)]'
                : 'border-gray-700 bg-gray-800/80 text-gray-500'
            }`}
          >
            {key}
          </div>
        ))}
        <span className="ml-1.5 text-[11px] text-gray-500">Capture bug</span>
      </div>

    </div>
  )
}
