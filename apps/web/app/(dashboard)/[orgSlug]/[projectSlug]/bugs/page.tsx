import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { NavHeader } from '@/components/nav-header'
import type { BugStatus } from '@prisma/client'

const SEVERITY_COLORS: Record<string, string> = {
  P1: 'bg-red-100 text-red-700',
  P2: 'bg-orange-100 text-orange-700',
  P3: 'bg-yellow-100 text-yellow-700',
  P4: 'bg-gray-100 text-gray-600',
}

const STATUS_COLORS: Record<BugStatus, string> = {
  OPEN: 'bg-red-50 text-red-600',
  IN_PROGRESS: 'bg-amber-50 text-amber-700',
  FIXED: 'bg-green-50 text-green-700',
  CLOSED: 'bg-gray-100 text-gray-500',
  DUPLICATE: 'bg-purple-50 text-purple-600',
}

const STATUS_LABELS: Record<BugStatus, string> = {
  OPEN: 'Open',
  IN_PROGRESS: 'In Progress',
  FIXED: 'Fixed',
  CLOSED: 'Closed',
  DUPLICATE: 'Duplicate',
}

function parseUA(ua: string) {
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
  return `${browser} · ${os}`
}

const FILTER_TABS: { label: string; value: string | null }[] = [
  { label: 'All', value: null },
  { label: 'Open', value: 'OPEN' },
  { label: 'In Progress', value: 'IN_PROGRESS' },
  { label: 'Fixed', value: 'FIXED' },
  { label: 'Closed', value: 'CLOSED' },
]

export default async function BugsPage({
  params,
  searchParams,
}: {
  params: Promise<{ orgSlug: string; projectSlug: string }>
  searchParams: Promise<{ status?: string }>
}) {
  const session = await auth()
  if (!session?.user?.id) redirect('/sign-in')

  const { orgSlug, projectSlug } = await params
  const { status: statusFilter } = await searchParams

  const org = await db.organisation.findUnique({
    where: { slug: orgSlug },
    include: {
      members: { where: { userId: session.user.id } },
      projects: {
        where: { slug: projectSlug },
        include: { _count: { select: { bugs: true, apiKeys: true } } },
      },
    },
  })

  if (!org || org.members.length === 0) redirect('/')
  const project = org.projects[0]
  if (!project) redirect(`/${orgSlug}`)

  const validStatuses: BugStatus[] = ['OPEN', 'IN_PROGRESS', 'FIXED', 'CLOSED', 'DUPLICATE']
  const activeStatus = validStatuses.includes(statusFilter as BugStatus)
    ? (statusFilter as BugStatus)
    : null

  const [bugs, countsByStatus, openCount] = await Promise.all([
    db.bug.findMany({
      where: {
        projectId: project.id,
        ...(activeStatus ? { status: activeStatus } : {}),
      },
      orderBy: { capturedAt: 'desc' },
      take: 100,
      include: {
        report: { select: { title: true, severity: true } },
        _count: { select: { messages: true } },
      },
    }),
    db.bug.groupBy({
      by: ['status'],
      where: { projectId: project.id },
      _count: { _all: true },
    }),
    db.bug.count({ where: { projectId: project.id, status: 'OPEN' } }),
  ])

  const countMap = Object.fromEntries(
    countsByStatus.map((r) => [r.status, r._count._all])
  ) as Record<string, number>

  return (
    <main className="min-h-screen bg-gray-50">
      <NavHeader
        crumbs={[
          { label: org.name, href: `/${orgSlug}` },
          { label: project.name, href: `/${orgSlug}/${projectSlug}` },
          { label: 'Bugs' },
        ]}
      />

      {/* ── Tab navigation ── */}
      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-5xl px-6">
          <nav className="-mb-px flex gap-1">
            {[
              { label: 'Overview', href: `/${orgSlug}/${projectSlug}` },
              { label: 'Bugs', href: `/${orgSlug}/${projectSlug}/bugs`, active: true, badge: openCount > 0 ? openCount : null },
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

      <div className="mx-auto max-w-5xl px-6 py-8 space-y-6">

        {/* ── Stats row ── */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: 'Total', value: project._count.bugs, dot: 'bg-gray-300' },
            { label: 'Open', value: countMap['OPEN'] ?? 0, dot: 'bg-red-400' },
            { label: 'In Progress', value: countMap['IN_PROGRESS'] ?? 0, dot: 'bg-amber-400' },
            { label: 'Fixed', value: countMap['FIXED'] ?? 0, dot: 'bg-green-500' },
          ].map(({ label, value, dot }) => (
            <div key={label} className="rounded-xl border border-gray-200 bg-white px-4 py-3.5 shadow-sm">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-medium text-gray-400">{label}</p>
                <span className={`h-2 w-2 rounded-full ${dot}`} />
              </div>
              <p className="text-2xl font-bold tabular-nums leading-none text-gray-900">{value}</p>
            </div>
          ))}
        </div>

        {/* ── Status filter tabs ── */}
        {project._count.bugs > 0 && (
          <div className="flex flex-wrap gap-2">
            {FILTER_TABS.map((tab) => {
              const count = tab.value ? (countMap[tab.value] ?? 0) : project._count.bugs
              const isActive = tab.value === (activeStatus ?? null)
              return (
                <Link
                  key={tab.label}
                  href={tab.value ? `/${orgSlug}/${projectSlug}/bugs?status=${tab.value}` : `/${orgSlug}/${projectSlug}/bugs`}
                  className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                    isActive
                      ? 'border-green-300 bg-green-50 text-green-700'
                      : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  }`}
                >
                  {tab.label}
                  <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                    isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'
                  }`}>
                    {count}
                  </span>
                </Link>
              )
            })}
          </div>
        )}

        {/* ── Bug list ── */}
        {bugs.length === 0 && !activeStatus ? (
          <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
            <div className="mx-auto max-w-md text-center">
              <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-green-50">
                <svg className="h-5 w-5 text-green-700" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900">Capture your first bug</h3>
              <p className="mt-1 text-sm text-gray-500">
                Three steps and you&apos;re reporting bugs in seconds, not screenshots.
              </p>
            </div>

            <ol className="mx-auto mt-6 max-w-md space-y-3">
              {([
                {
                  title: 'Install the Reprod extension',
                  body: 'Load it in Chrome — it quietly keeps the last 60 seconds of your session.',
                },
                {
                  title: 'Add your API key',
                  body: 'Generate a key for this project and paste it into the extension popup.',
                  link: { href: `/${orgSlug}/${projectSlug}/keys`, label: 'Get your API key →' },
                },
                {
                  title: 'Spot a bug? Press Ctrl+Shift+U',
                  body: 'Replay, console errors, failed requests and a screenshot land here instantly.',
                },
              ] as Array<{ title: string; body: string; link?: { href: string; label: string } }>).map((step, i) => (
                <li key={i} className="flex gap-3 rounded-lg border border-gray-100 bg-gray-50/60 px-4 py-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-100 text-xs font-bold text-green-800">
                    {i + 1}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-gray-800">{step.title}</p>
                    <p className="mt-0.5 text-xs text-gray-500">{step.body}</p>
                    {step.link && (
                      <Link
                        href={step.link.href}
                        className="mt-1.5 inline-block text-xs font-semibold text-green-700 hover:text-green-600"
                      >
                        {step.link.label}
                      </Link>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </div>
        ) : bugs.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 bg-white p-12 text-center">
            <p className="font-medium text-gray-600">
              No {STATUS_LABELS[activeStatus!].toLowerCase()} bugs
            </p>
            <p className="mt-1 text-sm text-gray-400">Try a different filter above.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            {/* Table header */}
            <div className="flex items-center gap-3 border-b border-gray-100 bg-gray-50 px-5 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
              <span className="w-8 shrink-0" />
              <span className="flex-1">Bug</span>
              <span className="hidden w-24 shrink-0 sm:block">Status</span>
              <span className="hidden w-20 shrink-0 text-right sm:block">Captured</span>
              <span className="w-4 shrink-0" />
            </div>

            {bugs.map((bug) => {
              const title = bug.report?.title ?? bug.pageTitle ?? bug.pageUrl
              const consoleLogs = bug.consoleLogs as Array<{ level: string }>
              const networkFails = bug.networkFails as Array<unknown>
              const errorCount = consoleLogs.filter(
                (l) => l.level === 'error' || l.level === 'ERROR'
              ).length

              return (
                <Link
                  key={bug.id}
                  href={`/bugs/${bug.id}`}
                  className="group flex items-center gap-3 border-b border-gray-100 px-5 py-3.5 last:border-0 hover:bg-gray-50 transition-colors"
                >
                  {/* Severity */}
                  <span className={`w-8 shrink-0 rounded px-1 py-0.5 text-center text-[11px] font-bold ${
                    bug.report?.severity
                      ? (SEVERITY_COLORS[bug.report.severity] ?? 'bg-gray-100 text-gray-400')
                      : 'bg-gray-100 text-gray-300'
                  }`}>
                    {bug.report?.severity ?? '—'}
                  </span>

                  {/* Title + meta */}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-900 group-hover:text-green-800">
                      {title}
                    </p>
                    <div className="mt-0.5 flex items-center gap-2 text-[11px] text-gray-400">
                      <span className="truncate">{bug.pageUrl.replace(/^https?:\/\//, '')}</span>
                      {errorCount > 0 && (
                        <>
                          <span>·</span>
                          <span className="text-red-500">{errorCount} error{errorCount !== 1 ? 's' : ''}</span>
                        </>
                      )}
                      {networkFails.length > 0 && (
                        <>
                          <span>·</span>
                          <span className="text-amber-500">{networkFails.length} failed</span>
                        </>
                      )}
                      {bug._count.messages > 0 && (
                        <>
                          <span>·</span>
                          <span>{bug._count.messages} msg{bug._count.messages !== 1 ? 's' : ''}</span>
                        </>
                      )}
                      <span className="hidden sm:inline">· {parseUA(bug.userAgent)}</span>
                    </div>
                  </div>

                  {/* Status */}
                  <span className={`hidden w-24 shrink-0 rounded-full px-2 py-0.5 text-center text-[11px] font-medium sm:block ${STATUS_COLORS[bug.status]}`}>
                    {STATUS_LABELS[bug.status]}
                  </span>

                  {/* Date */}
                  <span className="hidden w-20 shrink-0 text-right text-[11px] text-gray-400 sm:block">
                    {new Date(bug.capturedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                  </span>

                  <svg className="h-3.5 w-3.5 shrink-0 text-gray-300 transition-colors group-hover:text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                  </svg>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}
