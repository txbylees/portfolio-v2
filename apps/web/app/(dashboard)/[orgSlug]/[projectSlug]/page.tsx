import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { NavHeader } from '@/components/nav-header'

function parseUA(ua: string): { browser: string; os: string } {
  const browser =
    /Edg\//.test(ua) ? 'Edge' :
    /Chrome\//.test(ua) ? 'Chrome' :
    /Firefox\//.test(ua) ? 'Firefox' :
    /Safari\//.test(ua) ? 'Safari' : 'Unknown'
  const os =
    /iPhone|iPad/.test(ua) ? 'iOS' :
    /Android/.test(ua) ? 'Android' :
    /Windows/.test(ua) ? 'Windows' :
    /Mac OS X/.test(ua) ? 'macOS' :
    /Linux/.test(ua) ? 'Linux' : 'Unknown'
  return { browser, os }
}

function formatDuration(startedAt: Date, lastEventAt: Date): string {
  const ms = new Date(lastEventAt).getTime() - new Date(startedAt).getTime()
  if (ms < 1000) return '<1s'
  const s = Math.floor(ms / 1000)
  if (s < 60) return `${s}s`
  const m = Math.floor(s / 60)
  const rem = s % 60
  return rem > 0 ? `${m}m ${rem}s` : `${m}m`
}

const SEVERITY_COLORS: Record<string, string> = {
  P1: 'bg-red-100 text-red-700',
  P2: 'bg-orange-100 text-orange-700',
  P3: 'bg-yellow-100 text-yellow-700',
  P4: 'bg-gray-100 text-gray-600',
}

const STATUS_COLORS: Record<string, string> = {
  OPEN: 'bg-red-50 text-red-600',
  IN_PROGRESS: 'bg-amber-50 text-amber-700',
  FIXED: 'bg-green-50 text-green-700',
  CLOSED: 'bg-gray-100 text-gray-500',
  DUPLICATE: 'bg-purple-50 text-purple-600',
}

const STATUS_LABELS: Record<string, string> = {
  OPEN: 'Open',
  IN_PROGRESS: 'In Progress',
  FIXED: 'Fixed',
  CLOSED: 'Closed',
  DUPLICATE: 'Duplicate',
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ orgSlug: string; projectSlug: string }>
}) {
  const session = await auth()
  if (!session?.user?.id) redirect('/sign-in')

  const { orgSlug, projectSlug } = await params

  const org = await db.organisation.findUnique({
    where: { slug: orgSlug },
    include: {
      members: { where: { userId: session.user.id } },
      projects: {
        where: { slug: projectSlug },
        include: { _count: { select: { sessions: true, apiKeys: true, bugs: true } } },
      },
    },
  })

  if (!org || org.members.length === 0) redirect('/')
  const project = org.projects[0]
  if (!project) redirect(`/${orgSlug}`)

  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

  const [
    recentBugs,
    recentSessions,
    openBugCount,
    inProgressBugCount,
    sessionsThisWeek,
  ] = await Promise.all([
    db.bug.findMany({
      where: { projectId: project.id },
      orderBy: { capturedAt: 'desc' },
      take: 6,
      include: { report: { select: { title: true, severity: true } } },
    }),
    db.session.findMany({
      where: { projectId: project.id },
      orderBy: { startedAt: 'desc' },
      take: 6,
      select: {
        id: true,
        url: true,
        userAgent: true,
        startedAt: true,
        lastEventAt: true,
        _count: { select: { consoleLogs: true, networkRequests: true } },
      },
    }),
    db.bug.count({ where: { projectId: project.id, status: 'OPEN' } }),
    db.bug.count({ where: { projectId: project.id, status: 'IN_PROGRESS' } }),
    db.session.count({ where: { projectId: project.id, startedAt: { gte: oneWeekAgo } } }),
  ])

  const hasData = project._count.bugs > 0 || project._count.sessions > 0

  return (
    <main className="min-h-screen bg-gray-50">
      <NavHeader
        crumbs={[
          { label: org.name, href: `/${orgSlug}` },
          { label: project.name },
        ]}
      />

      {/* ── Tab navigation ── */}
      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-5xl px-6">
          <nav className="-mb-px flex gap-1">
            {[
              { label: 'Overview', href: `/${orgSlug}/${projectSlug}`, active: true },
              { label: 'Bugs', href: `/${orgSlug}/${projectSlug}/bugs`, badge: openBugCount > 0 ? openBugCount : null },
              { label: 'API Keys', href: `/${orgSlug}/${projectSlug}/keys` },
              { label: 'Settings', href: `/${orgSlug}/${projectSlug}/settings` },
            ].map((tab) => (
              <Link
                key={tab.href}
                href={tab.href}
                className={`flex items-center gap-1.5 border-b-2 px-4 py-3.5 text-sm font-medium transition-colors ${
                  tab.active
                    ? 'border-green-600 text-green-700'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                {tab.label}
                {tab.badge != null && (
                  <span className="rounded-full bg-red-100 px-1.5 py-0.5 text-[10px] font-bold leading-none text-red-600">
                    {tab.badge}
                  </span>
                )}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-6 py-8 space-y-8">

        {/* ── Stats row ── */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            {
              label: 'Sessions this week',
              value: sessionsThisWeek,
              sub: `${project._count.sessions} all time`,
              dot: 'bg-green-500',
            },
            {
              label: 'Open bugs',
              value: openBugCount,
              sub: `${project._count.bugs} total`,
              dot: 'bg-red-400',
              href: `/${orgSlug}/${projectSlug}/bugs`,
            },
            {
              label: 'In progress',
              value: inProgressBugCount,
              sub: 'being worked on',
              dot: 'bg-amber-400',
              href: `/${orgSlug}/${projectSlug}/bugs?status=IN_PROGRESS`,
            },
            {
              label: 'API keys',
              value: project._count.apiKeys,
              sub: 'active',
              dot: 'bg-gray-300',
              href: `/${orgSlug}/${projectSlug}/keys`,
            },
          ].map((stat) => {
            const inner = (
              <>
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-xs font-medium text-gray-400">{stat.label}</p>
                  <span className={`h-2 w-2 rounded-full ${stat.dot}`} />
                </div>
                <p className="text-2xl font-bold tabular-nums text-gray-900 leading-none">{stat.value}</p>
                <p className="mt-1 text-xs text-gray-400">{stat.sub}</p>
              </>
            )

            return stat.href ? (
              <Link
                key={stat.label}
                href={stat.href}
                className="rounded-xl border border-gray-200 bg-white px-4 py-3.5 shadow-sm transition-shadow hover:shadow-md"
              >
                {inner}
              </Link>
            ) : (
              <div key={stat.label} className="rounded-xl border border-gray-200 bg-white px-4 py-3.5 shadow-sm">
                {inner}
              </div>
            )
          })}
        </div>

        {/* ── No data: quick start ── */}
        {!hasData && (
          <div className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-50">
              <svg className="h-6 w-6 text-green-700" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
              </svg>
            </div>
            <h3 className="mb-1 font-semibold text-gray-900">Nothing captured yet</h3>
            <p className="mb-6 text-sm text-gray-500 max-w-sm mx-auto">
              Install the Chrome extension, add your API key, and press{' '}
              <kbd className="rounded border border-gray-200 bg-gray-50 px-1.5 py-0.5 text-xs">Ctrl+Shift+U</kbd>{' '}
              on any bug to send your first report.
            </p>
            <Link
              href={`/${orgSlug}/${projectSlug}/keys`}
              className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-green-500 transition-colors"
            >
              Get your API key
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
            </Link>
          </div>
        )}

        {/* ── Main two-column layout ── */}
        {hasData && (
          <div className="grid gap-6 lg:grid-cols-5">

            {/* Recent bugs — wider column */}
            <div className="lg:col-span-3">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-semibold text-gray-900">Recent bugs</h2>
                <Link
                  href={`/${orgSlug}/${projectSlug}/bugs`}
                  className="flex items-center gap-1 text-xs font-medium text-green-700 hover:text-green-600 transition-colors"
                >
                  View all
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                  </svg>
                </Link>
              </div>

              {recentBugs.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-white py-10 text-center">
                  <svg className="mb-2 h-8 w-8 text-gray-300" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 12.75c1.148 0 2.278.08 3.383.237 1.037.146 1.866.966 1.866 2.013 0 3.728-2.35 6.75-5.25 6.75S6.75 18.728 6.75 15c0-1.047.83-1.867 1.866-2.013A24.204 24.204 0 0 1 12 12.75Z" />
                  </svg>
                  <p className="text-sm text-gray-400">No bugs captured yet</p>
                </div>
              ) : (
                <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                  {recentBugs.map((bug) => {
                    const title = bug.report?.title ?? bug.pageTitle ?? bug.pageUrl
                    return (
                      <Link
                        key={bug.id}
                        href={`/bugs/${bug.id}`}
                        className="group flex items-start gap-3 border-b border-gray-100 px-4 py-3.5 last:border-0 hover:bg-gray-50 transition-colors"
                      >
                        {/* Severity pill */}
                        <span className={`mt-0.5 shrink-0 rounded px-1.5 py-0.5 text-[11px] font-bold ${
                          bug.report?.severity ? (SEVERITY_COLORS[bug.report.severity] ?? 'bg-gray-100 text-gray-500') : 'bg-gray-100 text-gray-400'
                        }`}>
                          {bug.report?.severity ?? '—'}
                        </span>

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-gray-900 group-hover:text-green-800">
                            {title}
                          </p>
                          <div className="mt-1 flex items-center gap-2">
                            <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${STATUS_COLORS[bug.status] ?? 'bg-gray-100 text-gray-500'}`}>
                              {STATUS_LABELS[bug.status] ?? bug.status}
                            </span>
                            <span className="text-[11px] text-gray-400">
                              {new Date(bug.capturedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                            </span>
                          </div>
                        </div>

                        <svg className="mt-1 h-3.5 w-3.5 shrink-0 text-gray-300 transition-colors group-hover:text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                        </svg>
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Recent sessions — narrower column */}
            <div className="lg:col-span-2">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-semibold text-gray-900">Recent sessions</h2>
                <span className="text-xs text-gray-400">{project._count.sessions} total</span>
              </div>

              {recentSessions.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-white py-10 text-center">
                  <svg className="mb-2 h-8 w-8 text-gray-300" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
                  </svg>
                  <p className="text-sm text-gray-400">No sessions recorded yet</p>
                </div>
              ) : (
                <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                  {recentSessions.map((s) => {
                    const { browser, os } = parseUA(s.userAgent)
                    const duration = formatDuration(s.startedAt, s.lastEventAt)
                    const hasErrors = s._count.consoleLogs > 0
                    const hasFailedReqs = s._count.networkRequests > 0

                    return (
                      <Link
                        key={s.id}
                        href={`/${orgSlug}/${projectSlug}/sessions/${s.id}`}
                        className="group flex items-start gap-3 border-b border-gray-100 px-4 py-3.5 last:border-0 hover:bg-gray-50 transition-colors"
                      >
                        {/* Status dot */}
                        <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${hasErrors ? 'bg-red-400' : hasFailedReqs ? 'bg-amber-400' : 'bg-green-400'}`} />

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-medium text-gray-700 group-hover:text-green-800">
                            {s.url.replace(/^https?:\/\//, '')}
                          </p>
                          <div className="mt-1 flex items-center gap-1.5 text-[11px] text-gray-400">
                            <span>{browser} · {os}</span>
                            <span>·</span>
                            <span>{duration}</span>
                          </div>
                          {(hasErrors || hasFailedReqs) && (
                            <div className="mt-1 flex gap-1.5">
                              {hasErrors && (
                                <span className="text-[10px] font-medium text-red-500">
                                  {s._count.consoleLogs} error{s._count.consoleLogs !== 1 ? 's' : ''}
                                </span>
                              )}
                              {hasFailedReqs && (
                                <span className="text-[10px] font-medium text-amber-600">
                                  {s._count.networkRequests} failed
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        <svg className="mt-1 h-3.5 w-3.5 shrink-0 text-gray-300 transition-colors group-hover:text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                        </svg>
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>

          </div>
        )}

      </div>
    </main>
  )
}
