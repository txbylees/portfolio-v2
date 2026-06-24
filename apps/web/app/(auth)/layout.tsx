export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      {/* ── Left branding panel ─────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[44%] flex-col justify-between bg-gray-950 p-12 relative overflow-hidden">
        {/* Subtle grid overlay */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              'linear-gradient(to right,#fff 1px,transparent 1px),linear-gradient(to bottom,#fff 1px,transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
        {/* Glow blob */}
        <div className="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full bg-green-700 opacity-20 blur-3xl" />

        {/* Logo */}
        <div className="relative flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-600">
            <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="3" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M2 12h2m16 0h2M12 2v2m0 16v2" />
            </svg>
          </span>
          <span className="text-xl font-bold tracking-tight text-white">Reprod</span>
        </div>

        {/* Headline + features */}
        <div className="relative">
          <h2 className="mb-3 text-4xl font-bold leading-tight text-white">
            Capture bugs.<br />
            <span className="text-green-400">Fix them faster.</span>
          </h2>
          <p className="mb-10 text-base text-gray-400">
            AI-powered bug reproduction for QA teams. One shortcut captures everything — console errors, network failures, session recording, and a screenshot.
          </p>

          <ul className="space-y-5">
            <li className="flex gap-3">
              <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-green-900">
                <svg className="h-4 w-4 text-green-400" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007Z" />
                </svg>
              </span>
              <div>
                <p className="text-sm font-semibold text-white">60-second rolling buffer</p>
                <p className="text-sm text-gray-400">Always recording — no &ldquo;start recording&rdquo; step needed.</p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-green-900">
                <svg className="h-4 w-4 text-green-400" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
                </svg>
              </span>
              <div>
                <p className="text-sm font-semibold text-white">AI writes the bug ticket</p>
                <p className="text-sm text-gray-400">Gemini analyses your capture and generates a structured report instantly.</p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-green-900">
                <svg className="h-4 w-4 text-green-400" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 9.75 16.5 12l-2.25 2.25m-4.5 0L7.5 12l2.25-2.25M6 20.25h12A2.25 2.25 0 0 0 20.25 18V6A2.25 2.25 0 0 0 18 3.75H6A2.25 2.25 0 0 0 3.75 6v12A2.25 2.25 0 0 0 6 20.25Z" />
                </svg>
              </span>
              <div>
                <p className="text-sm font-semibold text-white">Playwright test included</p>
                <p className="text-sm text-gray-400">Every bug ships with a ready-to-run script to reproduce it in CI.</p>
              </div>
            </li>
          </ul>
        </div>

        {/* Footer */}
        <p className="relative text-xs text-gray-600">© {new Date().getFullYear()} Reprod. Built for QA teams.</p>
      </div>

      {/* ── Right form panel ────────────────────────────────────── */}
      <div className="flex flex-1 flex-col items-center justify-center bg-white px-6 py-12">
        {/* Mobile logo — only shown when left panel collapses */}
        <div className="mb-8 flex items-center gap-2 lg:hidden">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-600">
            <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="3" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M2 12h2m16 0h2M12 2v2m0 16v2" />
            </svg>
          </span>
          <span className="text-xl font-bold tracking-tight text-gray-900">Reprod</span>
        </div>

        <div className="w-full max-w-sm">
          {children}
        </div>
      </div>
    </div>
  )
}
