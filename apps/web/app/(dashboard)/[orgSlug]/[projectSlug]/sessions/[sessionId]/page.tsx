import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { SessionPlayer } from './session-player'
import type { ReplayEvent } from './session-player'
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

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <NavHeader
        crumbs={[
          { label: org.name, href: `/${orgSlug}` },
          { label: project.name, href: `/${orgSlug}/${projectSlug}` },
          { label: sessionId.slice(0, 8) + '…' },
        ]}
      />

      <div className="mx-auto max-w-5xl px-8 py-10 space-y-8">
        {/* Metadata strip */}
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-gray-800 bg-gray-800 sm:grid-cols-4">
          {[
            { label: 'URL', value: recording.url, truncate: true },
            { label: 'Started', value: new Date(recording.startedAt).toLocaleString() },
            { label: 'Duration', value: `${durationSec}s` },
            { label: 'Viewport', value: `${recording.screenWidth} × ${recording.screenHeight}` },
          ].map((item) => (
            <div key={item.label} className="bg-gray-900 px-5 py-4">
              <p className="text-xs font-medium uppercase tracking-wider text-gray-500">{item.label}</p>
              <p className={`mt-1 text-sm text-gray-100 ${item.truncate ? 'truncate' : ''}`}>{item.value}</p>
            </div>
          ))}
        </div>

        {/* Status badges */}
        {(errorCount > 0 || recording._count.networkRequests > 0) && (
          <div className="flex flex-wrap gap-2">
            {errorCount > 0 && (
              <span className="flex items-center gap-1.5 rounded-full border border-red-900 bg-red-950 px-3 py-1 text-xs font-medium text-red-400">
                <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                {errorCount} console error{errorCount !== 1 ? 's' : ''}
              </span>
            )}
            {recording._count.networkRequests > 0 && (
              <span className="flex items-center gap-1.5 rounded-full border border-yellow-900 bg-yellow-950 px-3 py-1 text-xs font-medium text-yellow-400">
                <span className="h-1.5 w-1.5 rounded-full bg-yellow-500" />
                {recording._count.networkRequests} failed request{recording._count.networkRequests !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        )}

        {/* Replay */}
        <section>
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-300">
            <svg className="h-4 w-4 text-gray-500" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" />
            </svg>
            Replay
          </h2>
          <SessionPlayer events={events} />
        </section>

        {/* Console logs */}
        {consoleLogs.length > 0 && (
          <section>
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-300">
              <svg className="h-4 w-4 text-gray-500" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="m6.75 7.5 3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0 0 21 18V6a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 6v12a2.25 2.25 0 0 0 2.25 2.25Z" />
              </svg>
              Console
              <span className="rounded-md bg-gray-800 px-1.5 py-0.5 text-xs text-gray-400">{consoleLogs.length}</span>
            </h2>
            <div className="overflow-hidden rounded-xl border border-gray-800 font-mono text-xs">
              {consoleLogs.map((log, i) => (
                <div
                  key={i}
                  className={`flex gap-3 border-b border-gray-800 px-4 py-3 last:border-0 ${
                    log.level === 'ERROR' ? 'border-l-2 border-l-red-500/70 bg-red-950/10' : 'border-l-2 border-l-yellow-500/70 bg-yellow-950/10'
                  }`}
                >
                  <span className={`shrink-0 font-semibold ${log.level === 'ERROR' ? 'text-red-400' : 'text-yellow-400'}`}>
                    {log.level}
                  </span>
                  <div className="min-w-0">
                    <p className="text-gray-200">{log.message}</p>
                    {log.stack !== null && (
                      <pre className="mt-1.5 whitespace-pre-wrap text-gray-500 text-[11px]">{log.stack}</pre>
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
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-300">
              <svg className="h-4 w-4 text-gray-500" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418" />
              </svg>
              Network
              <span className="rounded-md bg-gray-800 px-1.5 py-0.5 text-xs text-gray-400">{networkRequests.length}</span>
            </h2>
            <div className="overflow-hidden rounded-xl border border-gray-800 text-xs">
              {networkRequests.map((req, i) => {
                const isError = req.status >= 500
                const isWarn = req.status >= 400 && req.status < 500
                return (
                  <div
                    key={i}
                    className={`flex items-center gap-4 border-b border-gray-800 px-4 py-3 last:border-0 ${
                      isError ? 'border-l-2 border-l-red-500/70' : isWarn ? 'border-l-2 border-l-yellow-500/70' : ''
                    }`}
                  >
                    <span
                      className={`w-10 shrink-0 rounded px-1.5 py-0.5 text-center font-mono font-semibold ${
                        isError
                          ? 'bg-red-950 text-red-400'
                          : isWarn
                            ? 'bg-yellow-950 text-yellow-400'
                            : 'bg-green-950 text-green-400'
                      }`}
                    >
                      {req.status}
                    </span>
                    <span className="w-12 shrink-0 font-mono text-gray-500">{req.method}</span>
                    <span className="min-w-0 flex-1 truncate text-gray-200">{req.url}</span>
                    <span className="shrink-0 text-gray-500">{req.duration}ms</span>
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
