import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { SessionPlayer } from '@/components/session-player'
import type { ReplayEvent } from '@/components/session-player'
import { NavHeader } from '@/components/nav-header'

export default async function SessionDetailPage({
  params,
}: {
  params: Promise<{ orgSlug: string; projectSlug: string; sessionId: string }>
}) {
  const session = await auth()
  if (!session?.user?.id) redirect('/sign-in')

  const { orgSlug, projectSlug, sessionId } = await params

  const org = await db.organisation.findUnique({
    where: { slug: orgSlug },
    include: { members: { where: { userId: session.user.id } } },
  })
  if (!org || org.members.length === 0) redirect('/')

  const project = await db.project.findUnique({
    where: { organisationId_slug: { organisationId: org.id, slug: projectSlug } },
  })
  if (!project) redirect(`/${orgSlug}`)

  const recording = await db.session.findUnique({
    where: { id: sessionId },
    include: {
      _count: { select: { events: true, consoleLogs: true, networkRequests: true } },
    },
  })
  if (!recording || recording.projectId !== project.id) redirect(`/${orgSlug}/${projectSlug}`)

  const [rawEvents, consoleLogs, networkRequests] = await Promise.all([
    db.sessionEvent.findMany({
      where: { sessionId },
      orderBy: { timestamp: 'asc' },
      select: { type: true, data: true, timestamp: true },
    }),
    db.consoleLog.findMany({
      where: { sessionId },
      orderBy: { timestamp: 'asc' },
      select: { level: true, message: true, stack: true, timestamp: true },
    }),
    db.networkRequest.findMany({
      where: { sessionId },
      orderBy: { timestamp: 'asc' },
      select: { method: true, url: true, status: true, duration: true, timestamp: true },
    }),
  ])

  const events: ReplayEvent[] = rawEvents.map((e) => ({
    type: e.type,
    data: e.data,
    timestamp: Number(e.timestamp),
  }))

  const durationMs =
    rawEvents.length > 1
      ? Number(rawEvents[rawEvents.length - 1]!.timestamp) - Number(rawEvents[0]!.timestamp)
      : 0
  const durationSec = Math.round(durationMs / 1000)

  const errorCount = consoleLogs.filter((l) => l.level === 'ERROR').length
  const networkErrorCount = networkRequests.filter((r) => r.status >= 400).length

  return (
    <main className="min-h-screen bg-gray-50">
      <NavHeader
        crumbs={[
          { label: org.name, href: `/${orgSlug}` },
          { label: project.name, href: `/${orgSlug}/${projectSlug}` },
          { label: 'Sessions', href: `/${orgSlug}/${projectSlug}` },
          { label: sessionId.slice(0, 8) + '…' },
        ]}
      />

      <div className="mx-auto max-w-5xl px-6 py-8 space-y-6">

        {/* Page header */}
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Link
                href={`/${orgSlug}/${projectSlug}`}
                className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
                </svg>
                Back to sessions
              </Link>
            </div>
            <h1 className="text-xl font-bold text-gray-900 truncate">{recording.url}</h1>
            <p className="mt-1 text-sm text-gray-500">
              {new Date(recording.startedAt).toLocaleString('en-GB', {
                day: 'numeric', month: 'short', year: 'numeric',
                hour: '2-digit', minute: '2-digit',
              })}
              {' · '}
              {recording.screenWidth} × {recording.screenHeight}
              {' · '}
              {durationSec}s
            </p>
          </div>

          {/* Badges */}
          <div className="flex shrink-0 flex-wrap justify-end gap-2">
            {errorCount > 0 && (
              <span className="flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700">
                <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                {errorCount} error{errorCount !== 1 ? 's' : ''}
              </span>
            )}
            {networkErrorCount > 0 && (
              <span className="flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                {networkErrorCount} failed request{networkErrorCount !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            {
              label: 'Duration',
              value: `${durationSec}s`,
              icon: (
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              ),
            },
            {
              label: 'DOM Events',
              value: recording._count.events.toLocaleString(),
              icon: (
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
              ),
            },
            {
              label: 'Console logs',
              value: recording._count.consoleLogs.toLocaleString(),
              icon: (
                <path strokeLinecap="round" strokeLinejoin="round" d="m6.75 7.5 3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0 0 21 18V6a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 6v12a2.25 2.25 0 0 0 2.25 2.25Z" />
              ),
            },
            {
              label: 'Network calls',
              value: recording._count.networkRequests.toLocaleString(),
              icon: (
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418" />
              ),
            },
          ].map((stat) => (
            <div key={stat.label} className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-green-50">
                <svg className="h-4 w-4 text-green-700" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  {stat.icon}
                </svg>
              </div>
              <div>
                <p className="text-lg font-bold leading-none text-gray-900">{stat.value}</p>
                <p className="mt-0.5 text-xs text-gray-400">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Replay player */}
        <SessionPlayer events={events} url={recording.url} />

        {/* Console logs */}
        {consoleLogs.length > 0 && (
          <section>
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-700">
              <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="m6.75 7.5 3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0 0 21 18V6a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 6v12a2.25 2.25 0 0 0 2.25 2.25Z" />
              </svg>
              Console
              <span className="rounded-md bg-gray-100 px-1.5 py-0.5 text-xs text-gray-500">{consoleLogs.length}</span>
            </h2>
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white font-mono text-xs shadow-sm">
              {consoleLogs.map((log, i) => (
                <div
                  key={i}
                  className={`flex gap-3 border-b border-gray-100 px-4 py-3 last:border-0 ${
                    log.level === 'ERROR'
                      ? 'border-l-2 border-l-red-400 bg-red-50/40'
                      : 'border-l-2 border-l-amber-400 bg-amber-50/40'
                  }`}
                >
                  <span className={`shrink-0 font-bold text-[10px] mt-0.5 ${log.level === 'ERROR' ? 'text-red-600' : 'text-amber-600'}`}>
                    {log.level}
                  </span>
                  <div className="min-w-0">
                    <p className="text-gray-800">{log.message}</p>
                    {log.stack !== null && (
                      <pre className="mt-1.5 whitespace-pre-wrap text-gray-400 text-[11px]">{log.stack}</pre>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Network requests */}
        {networkRequests.length > 0 && (
          <section>
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-700">
              <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418" />
              </svg>
              Network
              <span className="rounded-md bg-gray-100 px-1.5 py-0.5 text-xs text-gray-500">{networkRequests.length}</span>
            </h2>
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white text-xs shadow-sm">
              {/* Table header */}
              <div className="flex items-center gap-4 border-b border-gray-100 bg-gray-50 px-4 py-2 font-medium text-gray-400">
                <span className="w-12 shrink-0">Status</span>
                <span className="w-14 shrink-0">Method</span>
                <span className="flex-1">URL</span>
                <span className="w-16 shrink-0 text-right">Duration</span>
              </div>
              {networkRequests.map((req, i) => {
                const isError = req.status >= 500
                const isWarn = req.status >= 400 && req.status < 500
                return (
                  <div
                    key={i}
                    className={`flex items-center gap-4 border-b border-gray-100 px-4 py-2.5 last:border-0 ${
                      isError ? 'border-l-2 border-l-red-400 bg-red-50/30' : isWarn ? 'border-l-2 border-l-amber-400 bg-amber-50/30' : ''
                    }`}
                  >
                    <span
                      className={`w-12 shrink-0 rounded px-1.5 py-0.5 text-center font-mono font-semibold ${
                        isError
                          ? 'bg-red-100 text-red-700'
                          : isWarn
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-green-100 text-green-700'
                      }`}
                    >
                      {req.status}
                    </span>
                    <span className="w-14 shrink-0 font-mono text-gray-400">{req.method}</span>
                    <span className="min-w-0 flex-1 truncate text-gray-700">{req.url}</span>
                    <span className="w-16 shrink-0 text-right text-gray-400">{req.duration}ms</span>
                  </div>
                )
              })}
            </div>
          </section>
        )}

      </div>
    </main>
  )
}
