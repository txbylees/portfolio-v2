import Link from 'next/link'
import HeroDemo from './hero-demo'

const FEATURES = [
  {
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
    ),
    title: '60-second rolling buffer',
    desc: 'Reprod silently records everything. No "start recording" — it\'s always ready. Hit the shortcut and the last 60 seconds of activity are captured instantly.',
  },
  {
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
    ),
    title: 'AI writes the ticket',
    desc: 'Gemini analyses your console logs, network failures, and session data to write a structured bug report — title, severity, steps, root cause — in seconds.',
  },
  {
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5" />
    ),
    title: 'Playwright test included',
    desc: 'Every bug ships with a TypeScript Playwright test that reproduces the issue. Drop it straight into your CI pipeline — no manual writing needed.',
  },
  {
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z" />
    ),
    title: 'Full session context',
    desc: 'DOM recording via rrweb, console errors, network failures, screenshot, browser environment — everything a developer needs to reproduce the bug without a back-and-forth.',
  },
  {
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
    ),
    title: 'AI chat assistant',
    desc: 'Not sure what happened? Chat with the AI about your bug. It has full context — logs, network calls, the page — and can suggest root causes and fixes.',
  },
  {
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
    ),
    title: 'Export anywhere',
    desc: 'One click to push the bug ticket to GitHub Issues, Jira, or ClickUp. The AI summary, steps, and severity are all pre-filled. No copy-pasting.',
  },
]

const STEPS = [
  {
    n: '01',
    title: 'Install the extension',
    desc: 'Add Reprod to Chrome and paste your API key. Takes 60 seconds.',
    color: 'bg-green-50 text-green-700',
  },
  {
    n: '02',
    title: 'Browse normally',
    desc: 'Reprod records silently in the background. No friction, no "start recording" step.',
    color: 'bg-blue-50 text-blue-700',
  },
  {
    n: '03',
    title: 'Hit Ctrl+Shift+U',
    desc: 'When something breaks, one shortcut captures everything and hands it to the AI.',
    color: 'bg-purple-50 text-purple-700',
  },
]

const INTEGRATIONS = [
  { name: 'GitHub', color: 'bg-gray-900 text-white', icon: 'GH' },
  { name: 'Jira', color: 'bg-blue-600 text-white', icon: 'J' },
  { name: 'ClickUp', color: 'bg-purple-600 text-white', icon: 'CU' },
  { name: 'Playwright', color: 'bg-green-700 text-white', icon: '▶' },
]

export default function LandingPage() {
  return (
    <div className="bg-gray-950 text-white">

      {/* ── Navbar ───────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 border-b border-white/5 bg-gray-950/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-green-600">
              <svg className="h-3.5 w-3.5 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="3" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M2 12h2m16 0h2M12 2v2m0 16v2" />
              </svg>
            </span>
            <span className="text-base font-bold tracking-tight">Reprod</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/sign-in" className="text-sm text-gray-400 hover:text-white transition-colors">
              Sign in
            </Link>
            <Link
              href="/sign-up"
              className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-500 transition-colors"
            >
              Get started free
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        {/* Background glow blobs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 left-1/4 h-[500px] w-[500px] rounded-full bg-green-700/20 blur-[100px]" />
          <div className="absolute top-20 right-1/4 h-[400px] w-[400px] rounded-full bg-blue-700/10 blur-[100px]" />
        </div>

        <div className="relative mx-auto max-w-6xl px-6 pb-24 pt-20">
          <div className="grid items-center gap-16 lg:grid-cols-2">

            {/* Left copy */}
            <div>
              <h1 className="mb-5 text-5xl font-extrabold leading-[1.1] tracking-tight lg:text-6xl">
                Stop{' '}
                <span className="bg-gradient-to-r from-green-400 to-emerald-300 bg-clip-text text-transparent">
                  describing
                </span>
                <br />
                bugs. Start{' '}
                <span className="bg-gradient-to-r from-green-400 to-emerald-300 bg-clip-text text-transparent">
                  proving
                </span>
                <br />
                them.
              </h1>

              <p className="mb-8 text-lg leading-relaxed text-gray-400">
                One keystroke captures console errors, network failures, a session recording,
                and a screenshot. AI writes the ticket. You ship the fix.
              </p>

              <div className="flex flex-wrap gap-3">
                <Link
                  href="/sign-up"
                  className="group flex items-center gap-2 rounded-xl bg-green-600 px-6 py-3 font-semibold text-white shadow-[0_0_24px_rgba(22,163,74,0.35)] transition-all hover:bg-green-500 hover:shadow-[0_0_32px_rgba(22,163,74,0.5)]"
                >
                  Get started free
                  <svg className="h-4 w-4 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                  </svg>
                </Link>
                <Link
                  href="/sign-in"
                  className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-6 py-3 font-semibold text-white transition-all hover:bg-white/10"
                >
                  Sign in
                </Link>
              </div>

              {/* Social proof mini row */}
              <div className="mt-8 flex items-center gap-4 text-sm text-gray-500">
                <span className="flex items-center gap-1.5">
                  <svg className="h-4 w-4 text-green-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                  </svg>
                  No credit card
                </span>
                <span className="flex items-center gap-1.5">
                  <svg className="h-4 w-4 text-green-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                  </svg>
                  60s setup
                </span>
                <span className="flex items-center gap-1.5">
                  <svg className="h-4 w-4 text-green-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                  </svg>
                  Works on any site
                </span>
              </div>
            </div>

            {/* Right — animated demo */}
            <div className="flex justify-center lg:justify-end">
              <div className="w-full max-w-xl pb-14">
                <HeroDemo />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Divider ──────────────────────────────────────────── */}
      <div className="border-t border-white/5" />

      {/* ── How it works ─────────────────────────────────────── */}
      <section className="bg-white py-24">
        <div className="mx-auto max-w-5xl px-6">
          <div className="mb-14 text-center">
            <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-green-700">How it works</p>
            <h2 className="text-4xl font-extrabold text-gray-900">From bug to ticket in under 10 seconds</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {STEPS.map((s) => (
              <div key={s.n} className="group relative rounded-2xl border border-gray-100 bg-white p-8 shadow-sm transition-shadow hover:shadow-md">
                <div className={`mb-5 inline-flex h-10 w-10 items-center justify-center rounded-xl text-sm font-extrabold ${s.color}`}>
                  {s.n}
                </div>
                <h3 className="mb-2 text-lg font-bold text-gray-900">{s.title}</h3>
                <p className="text-sm leading-relaxed text-gray-500">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Deep-dive: Under the hood ───────────────────────── */}
      <section className="bg-gray-950 py-28">
        <div className="mx-auto max-w-6xl px-6">

          {/* Header */}
          <div className="mb-20 max-w-2xl">
            <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-green-500">Under the hood</p>
            <h2 className="text-4xl font-extrabold leading-tight text-white lg:text-5xl">
              What actually happens<br />
              <span className="text-green-400">when you press the shortcut</span>
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-gray-400">
              Reprod isn&apos;t just a screenshot tool. Here&apos;s the full pipeline — from the moment
              something breaks in the browser to a developer-ready bug ticket with a Playwright
              test attached.
            </p>
          </div>

          {/* Steps */}
          <div className="space-y-24">

            {/* ── Step 1 ── */}
            <div className="grid items-center gap-12 lg:grid-cols-2">
              <div>
                <div className="mb-5 inline-flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-green-900 text-sm font-extrabold text-green-400">01</span>
                  <span className="h-px flex-1 bg-green-900/50 w-12" />
                </div>
                <h3 className="mb-4 text-2xl font-extrabold text-white">Always recording, invisibly</h3>
                <p className="mb-6 text-base leading-relaxed text-gray-400">
                  The moment you install Reprod, it starts a silent recording loop. There&apos;s no
                  button to press, no session to &quot;start&quot;. The extension monkey-patches{' '}
                  <code className="rounded bg-gray-800 px-1.5 py-0.5 text-xs text-green-400">console.error</code>{' '}
                  and{' '}
                  <code className="rounded bg-gray-800 px-1.5 py-0.5 text-xs text-green-400">console.warn</code>,
                  intercepts every <code className="rounded bg-gray-800 px-1.5 py-0.5 text-xs text-green-400">fetch</code> and{' '}
                  <code className="rounded bg-gray-800 px-1.5 py-0.5 text-xs text-green-400">XHR</code> call, and
                  runs rrweb — the same DOM recording tech used by LogRocket — capturing every
                  click, scroll, and mutation. Everything lands in a rolling 60-second in-memory
                  buffer. You&apos;re always carrying the last minute.
                </p>
                <ul className="space-y-2.5">
                  {[
                    'rrweb records full DOM mutations, clicks, and scroll positions',
                    'Console errors and warnings captured with full stack traces',
                    'Network requests monitored: URL, method, status, duration',
                    'In-memory circular buffer — zero disk storage, zero privacy risk',
                  ].map((b) => (
                    <li key={b} className="flex items-start gap-2.5 text-sm text-gray-400">
                      <span className="mt-0.5 h-4 w-4 shrink-0 rounded-full bg-green-900 text-center text-[9px] leading-4 text-green-400 font-bold">✓</span>
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
              {/* Terminal card */}
              <div className="overflow-hidden rounded-2xl border border-white/8 bg-gray-900 shadow-2xl">
                <div className="flex items-center gap-2 border-b border-white/8 bg-gray-800/60 px-4 py-3">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-500/70" />
                  <span className="h-2.5 w-2.5 rounded-full bg-yellow-500/70" />
                  <span className="h-2.5 w-2.5 rounded-full bg-green-500/70" />
                  <span className="ml-2 text-[11px] font-medium text-gray-500">reprod-extension · background.js</span>
                </div>
                <div className="p-5 font-mono text-xs leading-relaxed">
                  <p className="text-gray-500">// Rolling buffer — always on</p>
                  <p className="mt-3 text-gray-300">Buffer size<span className="text-gray-600">............</span><span className="text-green-400">60,000ms</span></p>
                  <div className="my-3 border-t border-white/5" />
                  <p className="text-gray-500">// Live event stream</p>
                  <p className="mt-2 text-gray-300">rrweb DOM events<span className="text-gray-600">.........</span><span className="text-blue-400">247</span></p>
                  <p className="text-gray-300">click / scroll<span className="text-gray-600">.............</span><span className="text-blue-400">38</span></p>
                  <p className="text-gray-300">console.error<span className="text-gray-600">...............</span><span className="text-red-400">3</span></p>
                  <p className="text-gray-300">console.warn<span className="text-gray-600">................</span><span className="text-yellow-400">1</span></p>
                  <p className="text-gray-300">fetch / XHR<span className="text-gray-600">...................</span><span className="text-blue-400">19</span></p>
                  <div className="my-3 border-t border-white/5" />
                  <p className="flex items-center gap-2 text-gray-300">
                    status
                    <span className="text-gray-600">.....................</span>
                    <span className="flex items-center gap-1.5">
                      <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-green-400" />
                      <span className="text-green-400">recording</span>
                    </span>
                  </p>
                </div>
              </div>
            </div>

            {/* ── Step 2 ── */}
            <div className="grid items-center gap-12 lg:grid-cols-2">
              <div className="lg:order-2">
                <div className="mb-5 inline-flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-green-900 text-sm font-extrabold text-green-400">02</span>
                  <span className="h-px w-12 bg-green-900/50" />
                </div>
                <h3 className="mb-4 text-2xl font-extrabold text-white">One keystroke packages everything</h3>
                <p className="mb-6 text-base leading-relaxed text-gray-400">
                  When a bug appears you press <kbd className="rounded border border-gray-700 bg-gray-800 px-1.5 py-0.5 text-xs text-gray-300">Ctrl+Shift+U</kbd>{' '}
                  or click Capture Bug in the popup. The Chrome extension flushes the 60-second
                  buffer, takes a full-resolution screenshot via Chrome&apos;s{' '}
                  <code className="rounded bg-gray-800 px-1.5 py-0.5 text-xs text-green-400">captureVisibleTab</code>{' '}
                  API, and packages the entire payload — events, environment metadata, screenshot
                  — into a single POST to your Reprod project.
                </p>
                <ul className="space-y-2.5">
                  {[
                    'Buffer flushed instantly: all rrweb events, console logs, network failures',
                    'Screenshot taken at full viewport resolution as a PNG data URL',
                    'Environment snapshot: URL, title, user agent, screen size, timestamp',
                    'Payload authenticated with your project API key via Bearer token',
                  ].map((b) => (
                    <li key={b} className="flex items-start gap-2.5 text-sm text-gray-400">
                      <span className="mt-0.5 h-4 w-4 shrink-0 rounded-full bg-green-900 text-center text-[9px] leading-4 text-green-400 font-bold">✓</span>
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="lg:order-1 overflow-hidden rounded-2xl border border-white/8 bg-gray-900 shadow-2xl">
                <div className="flex items-center gap-2 border-b border-white/8 bg-gray-800/60 px-4 py-3">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-500/70" />
                  <span className="h-2.5 w-2.5 rounded-full bg-yellow-500/70" />
                  <span className="h-2.5 w-2.5 rounded-full bg-green-500/70" />
                  <span className="ml-2 text-[11px] font-medium text-gray-500">POST /api/bugs/ingest</span>
                </div>
                <div className="p-5 font-mono text-xs leading-relaxed">
                  <p className="text-gray-500">{'// Payload sent on Ctrl+Shift+U'}</p>
                  <p className="mt-3 text-gray-600">{'{'}</p>
                  <p className="pl-4"><span className="text-blue-400">&quot;events&quot;</span><span className="text-gray-600">: [</span><span className="text-gray-400"> 247 rrweb + 4 console + 1 network </span><span className="text-gray-600">],</span></p>
                  <p className="pl-4"><span className="text-blue-400">&quot;env&quot;</span><span className="text-gray-600">: {'{'}</span></p>
                  <p className="pl-8"><span className="text-blue-300">&quot;url&quot;</span><span className="text-gray-600">: </span><span className="text-green-400">&quot;acmeco.com/checkout&quot;</span><span className="text-gray-600">,</span></p>
                  <p className="pl-8"><span className="text-blue-300">&quot;userAgent&quot;</span><span className="text-gray-600">: </span><span className="text-green-400">&quot;Chrome/124&quot;</span><span className="text-gray-600">,</span></p>
                  <p className="pl-8"><span className="text-blue-300">&quot;screenWidth&quot;</span><span className="text-gray-600">: </span><span className="text-purple-400">1512</span><span className="text-gray-600">,</span></p>
                  <p className="pl-8"><span className="text-blue-300">&quot;timestamp&quot;</span><span className="text-gray-600">: </span><span className="text-purple-400">1748123456789</span></p>
                  <p className="pl-4"><span className="text-gray-600">{'}'}</span><span className="text-gray-600">,</span></p>
                  <p className="pl-4"><span className="text-blue-400">&quot;screenshot&quot;</span><span className="text-gray-600">: </span><span className="text-green-400">&quot;data:image/png;base64,…&quot;</span></p>
                  <p className="text-gray-600">{'}'}</p>
                  <div className="mt-3 flex items-center gap-2 rounded-lg bg-green-900/30 px-3 py-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
                    <span className="text-green-400">201 Created · bugId: cmpj…</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Step 3 ── */}
            <div className="grid items-center gap-12 lg:grid-cols-2">
              <div>
                <div className="mb-5 inline-flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-green-900 text-sm font-extrabold text-green-400">03</span>
                  <span className="h-px w-12 bg-green-900/50" />
                </div>
                <h3 className="mb-4 text-2xl font-extrabold text-white">AI reads the crash scene</h3>
                <p className="mb-6 text-base leading-relaxed text-gray-400">
                  Reprod&apos;s backend separates the payload into its components — rrweb events,
                  console errors with stack traces, failed network requests — and immediately
                  fires the diagnostic context at Gemini 2.0 Flash. Within seconds the AI
                  returns its first analysis: what it believes went wrong, and one targeted
                  question to confirm your test case.
                </p>
                <ul className="space-y-2.5">
                  {[
                    'Console errors grouped by severity, stack traces preserved in full',
                    'Network failures extracted: method, URL, HTTP status, response time',
                    'AI reasons over real captured data — no hallucination, no guessing',
                    'First response ready before you\'ve finished refreshing the page',
                  ].map((b) => (
                    <li key={b} className="flex items-start gap-2.5 text-sm text-gray-400">
                      <span className="mt-0.5 h-4 w-4 shrink-0 rounded-full bg-green-900 text-center text-[9px] leading-4 text-green-400 font-bold">✓</span>
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="overflow-hidden rounded-2xl border border-white/8 bg-gray-900 shadow-2xl">
                <div className="flex items-center gap-2 border-b border-white/8 bg-gray-800/60 px-4 py-3">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-500/70" />
                  <span className="h-2.5 w-2.5 rounded-full bg-yellow-500/70" />
                  <span className="h-2.5 w-2.5 rounded-full bg-green-500/70" />
                  <span className="ml-2 text-[11px] font-medium text-gray-500">Gemini 2.0 Flash · initial analysis</span>
                </div>
                <div className="p-5 space-y-3 text-xs leading-relaxed">
                  <div className="rounded-lg bg-gray-800 p-3">
                    <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-gray-500">Context sent to AI</p>
                    <p className="text-red-400">⛔ TypeError: null (reading &apos;id&apos;) · checkout.js:142</p>
                    <p className="text-red-400">⛔ POST /api/payment/process → 500</p>
                    <p className="text-yellow-400">⚠ prefetch /api/cart/validate failed</p>
                    <p className="mt-1.5 text-gray-500">Page: acmeco.com/checkout · Chrome 124</p>
                  </div>
                  <div className="rounded-lg border border-green-900/60 bg-green-950/40 p-3">
                    <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-green-600">AI response</p>
                    <p className="text-gray-300">I can see a null reference error on line 142 of checkout.js and a 500 from your payment API firing simultaneously — likely the same root cause.</p>
                    <p className="mt-2 text-green-400">What test case were you running and what did you expect to happen?</p>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Step 4 ── */}
            <div className="grid items-center gap-12 lg:grid-cols-2">
              <div className="lg:order-2">
                <div className="mb-5 inline-flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-green-900 text-sm font-extrabold text-green-400">04</span>
                  <span className="h-px w-12 bg-green-900/50" />
                </div>
                <h3 className="mb-4 text-2xl font-extrabold text-white">One reply. Full ticket generated.</h3>
                <p className="mb-6 text-base leading-relaxed text-gray-400">
                  You answer the AI&apos;s question in one message. That&apos;s it. Reprod fires a second
                  Gemini call with the full conversation and produces a complete structured bug
                  report: severity rating, title, numbered steps to reproduce, an expected vs
                  actual comparison, suspected root cause from the logs, and a TypeScript
                  Playwright test generated to reproduce the bug automatically in CI.
                </p>
                <ul className="space-y-2.5">
                  {[
                    'Severity P1–P4 set by AI based on blast radius (P1 = all users blocked)',
                    'Steps to reproduce written from your session — not guessed',
                    'Root cause pulled directly from stack traces and failed request data',
                    'Playwright test uses @playwright/test, includes assertions',
                  ].map((b) => (
                    <li key={b} className="flex items-start gap-2.5 text-sm text-gray-400">
                      <span className="mt-0.5 h-4 w-4 shrink-0 rounded-full bg-green-900 text-center text-[9px] leading-4 text-green-400 font-bold">✓</span>
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="lg:order-1 overflow-hidden rounded-2xl border border-white/8 bg-gray-900 shadow-2xl">
                <div className="flex items-center justify-between border-b border-white/8 bg-gray-800/60 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-red-500/70" />
                    <span className="h-2.5 w-2.5 rounded-full bg-yellow-500/70" />
                    <span className="h-2.5 w-2.5 rounded-full bg-green-500/70" />
                    <span className="ml-2 text-[11px] font-medium text-gray-500">Bug #42 · generated report</span>
                  </div>
                  <span className="rounded-full bg-orange-900/60 px-2 py-0.5 text-[10px] font-bold text-orange-400">P2</span>
                </div>
                <div className="p-5 text-xs leading-relaxed space-y-3">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500 mb-1">Title</p>
                    <p className="font-semibold text-white">Checkout crashes on payment submit with saved address</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500 mb-1">Steps to reproduce</p>
                    <p className="text-gray-400">1. Add item to cart</p>
                    <p className="text-gray-400">2. Select a saved delivery address</p>
                    <p className="text-gray-400">3. Click &quot;Pay Now&quot;</p>
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1 rounded bg-green-900/30 p-2 text-green-400">✓ Order confirmed</div>
                    <div className="flex-1 rounded bg-red-900/30 p-2 text-red-400">✕ TypeError, page frozen</div>
                  </div>
                  <div className="flex items-center gap-2 rounded-lg border border-green-800/40 bg-green-900/20 px-3 py-2">
                    <svg className="h-3.5 w-3.5 text-green-500" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                    </svg>
                    <span className="text-green-400">Playwright test generated · ready for CI</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Step 5 ── */}
            <div className="grid items-center gap-12 lg:grid-cols-2">
              <div>
                <div className="mb-5 inline-flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-green-900 text-sm font-extrabold text-green-400">05</span>
                  <span className="h-px w-12 bg-green-900/50" />
                </div>
                <h3 className="mb-4 text-2xl font-extrabold text-white">Ship it to your workflow</h3>
                <p className="mb-6 text-base leading-relaxed text-gray-400">
                  The finished ticket lives in your Reprod dashboard where you track status,
                  chat further with the AI, and share with your team. When you&apos;re ready, one
                  click exports it to GitHub Issues, Jira, or ClickUp — title, description,
                  steps, and severity all pre-filled. The Playwright test is ready to drop
                  into your test suite.
                </p>
                <ul className="space-y-2.5">
                  {[
                    'Status tracking across the bug lifecycle: Open → In Progress → Fixed → Closed',
                    'GitHub Issues: title, markdown body, and labels created automatically',
                    'Jira: summary, description, and priority mapped from P1–P4 severity',
                    'ClickUp: full task created with description and custom priority field',
                  ].map((b) => (
                    <li key={b} className="flex items-start gap-2.5 text-sm text-gray-400">
                      <span className="mt-0.5 h-4 w-4 shrink-0 rounded-full bg-green-900 text-center text-[9px] leading-4 text-green-400 font-bold">✓</span>
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="overflow-hidden rounded-2xl border border-white/8 bg-gray-900 shadow-2xl">
                <div className="flex items-center gap-2 border-b border-white/8 bg-gray-800/60 px-4 py-3">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-500/70" />
                  <span className="h-2.5 w-2.5 rounded-full bg-yellow-500/70" />
                  <span className="h-2.5 w-2.5 rounded-full bg-green-500/70" />
                  <span className="ml-2 text-[11px] font-medium text-gray-500">Bug #42 · export</span>
                </div>
                <div className="p-5 space-y-2.5 text-xs">
                  {[
                    { label: 'GitHub Issues', color: 'bg-gray-700 text-white', icon: 'GH', sub: 'Opens issue with full markdown body' },
                    { label: 'Jira', color: 'bg-blue-700 text-white', icon: 'J', sub: 'Creates task · priority mapped from P2' },
                    { label: 'ClickUp', color: 'bg-purple-700 text-white', icon: 'CU', sub: 'New task in your space · all fields set' },
                    { label: 'Playwright test', color: 'bg-green-700 text-white', icon: '▶', sub: 'TypeScript · ready to run in CI' },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center gap-3 rounded-xl border border-white/6 bg-gray-800/50 px-3 py-2.5 transition-colors hover:bg-gray-800">
                      <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold ${item.color}`}>
                        {item.icon}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-white">{item.label}</p>
                        <p className="text-gray-500">{item.sub}</p>
                      </div>
                      <svg className="h-3.5 w-3.5 shrink-0 text-gray-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                      </svg>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>{/* end steps */}
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────── */}
      <section className="bg-gray-50 py-24">
        <div className="mx-auto max-w-5xl px-6">
          <div className="mb-14 text-center">
            <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-green-700">Everything you need</p>
            <h2 className="text-4xl font-extrabold text-gray-900">Built for how QA teams actually work</h2>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div key={f.title} className="rounded-2xl border border-gray-200 bg-white p-6 transition-shadow hover:shadow-md">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-green-50">
                  <svg className="h-5 w-5 text-green-700" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
                    {f.icon}
                  </svg>
                </div>
                <h3 className="mb-2 font-bold text-gray-900">{f.title}</h3>
                <p className="text-sm leading-relaxed text-gray-500">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Integrations ─────────────────────────────────────── */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-green-700">Integrations</p>
          <h2 className="mb-4 text-3xl font-extrabold text-gray-900">Push tickets where your team lives</h2>
          <p className="mb-12 text-gray-500">One click exports to your existing workflow — no copy-pasting, no reformatting.</p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            {INTEGRATIONS.map((int) => (
              <div
                key={int.name}
                className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 px-5 py-3 shadow-sm"
              >
                <span className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold ${int.color}`}>
                  {int.icon}
                </span>
                <span className="font-semibold text-gray-800">{int.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gray-950 py-24">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-green-700/20 blur-[120px]" />
        </div>
        <div className="relative mx-auto max-w-2xl px-6 text-center">
          <h2 className="mb-4 text-4xl font-extrabold leading-tight lg:text-5xl">
            Ready to kill bugs{' '}
            <span className="bg-gradient-to-r from-green-400 to-emerald-300 bg-clip-text text-transparent">
              properly?
            </span>
          </h2>
          <p className="mb-8 text-lg text-gray-400">
            Free to get started. Install the extension in 60 seconds and capture your first bug today.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/sign-up"
              className="group flex items-center gap-2 rounded-xl bg-green-600 px-7 py-3.5 text-base font-bold text-white shadow-[0_0_32px_rgba(22,163,74,0.4)] transition-all hover:bg-green-500 hover:shadow-[0_0_48px_rgba(22,163,74,0.6)]"
            >
              Create free account
              <svg className="h-4 w-4 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────── */}
      <footer className="border-t border-white/5 bg-gray-950 px-6 py-10">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-green-600">
              <span className="h-1.5 w-1.5 rounded-full bg-white" />
            </span>
            <span className="text-sm font-bold text-gray-400">Reprod</span>
          </div>
          <p className="text-xs text-gray-600">© {new Date().getFullYear()} Reprod. Built for QA teams.</p>
          <div className="flex gap-4 text-xs text-gray-600">
            <Link href="/sign-in" className="hover:text-gray-400 transition-colors">Sign in</Link>
            <Link href="/sign-up" className="hover:text-gray-400 transition-colors">Sign up</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
