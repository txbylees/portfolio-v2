import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'
import SessionSearch from './session-search'
import { NavHeader } from '@/components/nav-header'

function parseUA(ua: string): { browser: string; os: string } {
  const browser =
    /Edg\//.test(ua) ? 'Edge' :
    /Chrome\//.test(ua) ? 'Chrome' :
    /Firefox\//.test(ua) ? 'Firefox' :
    /Safari\//.test(ua) ? 'Safari' :
    'Unknown'

  const os =
    /iPhone|iPad/.test(ua) ? 'iOS' :
    /Android/.test(ua) ? 'Android' :
    /Windows/.test(ua) ? 'Windows' :
    /Mac OS X/.test(ua) ? 'macOS' :
    /Linux/.test(ua) ? 'Linux' :
    'Unknown'

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

function Badge({ children, color = 'gray' }: { children: React.ReactNode; color?: 'gray' | 'red' | 'yellow' | 'blue' }) {
  const colors = {
    gray: 'bg-gray-800 text-gray-300',
    red: 'bg-red-950 text-red-400',
    yellow: 'bg-yellow-950 text-yellow-400',
    blue: 'bg-blue-950 text-blue-400',
  }
  return (
    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${colors[color]}`}>
      {children}
    </span>
  )
}

export default async function ProjectPage({
  params,
  searchParams,
}: {
  params: Promise<{ orgSlug: string; projectSlug: string }>
  searchParams: Promise<{ q?: string }>
}) {
  const session = await auth()
  if (!session?.user?.id) redirect('/sign-in')

  const { orgSlug, projectSlug } = await params
  const { q } = await searchParams

  const org = await db.organisation.findUnique({
    where: { slug: orgSlug },
    include: {
      members: { where: { userId: session.user.id } },
      projects: {
        where: { slug: projectSlug },
        include: { _count: { select: { sessions: true, apiKeys: true } } },
      },
    },
  })

  if (!org || org.members.length === 0) redirect('/')

  const project = org.projects[0]
  if (!project) redirect(`/${orgSlug}`)

  const recentSessions = await db.session.findMany({
    where: {
      projectId: project.id,
      ...(q ? { url: { contains: q, mode: 'insensitive' } } : {}),
    },
    orderBy: { startedAt: 'desc' },
    take: 50,
    select: {
      id: true,
      url: true,
      userAgent: true,
      startedAt: true,
      lastEventAt: true,
      _count: { select: { events: true, consoleLogs: true, networkRequests: true } },
    },
  })

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <NavHeader
        crumbs={[
          { label: org.name, href: `/${orgSlug}` },
          { label: project.name },
        ]}
        right={
          <div className="flex items-center gap-2">
            <Link
              href={`/${orgSlug}/${projectSlug}/keys`}
              className="rounded-lg border border-gray-700 px-3 py-1.5 text-sm text-gray-300 hover:border-gray-500 hover:text-white transition-colors"
            >
              API keys ({project._count.apiKeys})
            </Link>
            <Link
              href={`/${orgSlug}/${projectSlug}/settings`}
              className="rounded-lg border border-gray-700 px-3 py-1.5 text-sm text-gray-300 hover:border-gray-500 hover:text-white transition-colors"
            >
              Settings
            </Link>
          </div>
        }
      />

      <div className="mx-auto max-w-4xl px-8 py-10">
        {/* Stats */}
        <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-blue-900/50 bg-gradient-to-br from-blue-950/60 to-gray-900 p-5">
            <p className="text-xs font-medium uppercase tracking-wider text-blue-400/80">Total sessions</p>
            <p className="mt-2 text-3xl font-bold tabular-nums">{project._count.sessions}</p>
          </div>
        </div>

        {project._count.sessions === 0 && (
          <div className="mb-8 rounded-xl border border-gray-800 bg-gray-900 p-6">
            <h2 className="mb-3 font-semibold">Quick start</h2>
            <p className="mb-3 text-sm text-gray-400">
              Install the SDK and call{' '}
              <code className="rounded bg-gray-800 px-1.5 py-0.5 text-blue-400">reprod.init()</code> with your API key.
            </p>
            <pre className="overflow-x-auto rounded-lg bg-gray-950 p-4 text-sm text-gray-300">
              {`import { init } from '@reprod/sdk'\n\ninit({ apiKey: 'rpk_...' })`}
            </pre>
            <p className="mt-3 text-sm text-gray-400">
              Or test the full flow instantly at{' '}
              <Link href="/test" className="text-blue-400 hover:underline">/test</Link>
              {' '}with your API key.
            </p>
          </div>
        )}

        <div>
          <div className="mb-4 flex items-center justify-between gap-4">
            <h2 className="shrink-0 font-semibold text-gray-200">
              {recentSessions.length > 0 ? 'Recent sessions' : 'Sessions'}
            </h2>
            {project._count.sessions > 0 && (
              <Suspense>
                <SessionSearch defaultValue={q ?? ''} />
              </Suspense>
            )}
          </div>

          {recentSessions.length === 0 && project._count.sessions === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-700 p-12 text-center">
              <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-gray-800">
                <svg className="h-5 w-5 text-gray-500" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
                </svg>
              </div>
              <p className="font-medium text-gray-400">No sessions recorded yet</p>
              <p className="mt-1 text-sm text-gray-500">
                Sessions will appear here once the SDK is installed and a user visits your app.
              </p>
            </div>
          ) : recentSessions.length === 0 ? (
            <div className="rounded-xl border border-gray-800 bg-gray-900 p-12 text-center">
              <p className="text-gray-400">No sessions match &ldquo;{q}&rdquo;</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-gray-800">
              {recentSessions.map((s) => {
                const { browser, os } = parseUA(s.userAgent)
                const duration = formatDuration(s.startedAt, s.lastEventAt)
                const hasErrors = s._count.consoleLogs > 0
                const hasFailedReqs = s._count.networkRequests > 0

                return (
                  <Link
                    key={s.id}
                    href={`/${orgSlug}/${projectSlug}/sessions/${s.id}`}
                    className={`group flex items-center justify-between border-b border-gray-800 px-5 py-4 last:border-0 transition-colors hover:bg-gray-900 ${hasErrors ? 'border-l-2 border-l-red-500/60' : hasFailedReqs ? 'border-l-2 border-l-yellow-500/60' : ''}`}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gray-100">{s.url}</p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                        <Badge>{browser}</Badge>
                        <Badge>{os}</Badge>
                        <Badge color="blue">{duration}</Badge>
                      </div>
                    </div>
                    <div className="ml-6 flex shrink-0 flex-col items-end gap-1.5">
                      <div className="flex items-center gap-1.5">
                        {hasErrors && (
                          <Badge color="red">
                            {s._count.consoleLogs} error{s._count.consoleLogs !== 1 ? 's' : ''}
                          </Badge>
                        )}
                        {hasFailedReqs && (
                          <Badge color="yellow">
                            {s._count.networkRequests} failed
                          </Badge>
                        )}
                        {!hasErrors && !hasFailedReqs && (
                          <span className="flex items-center gap-1 text-xs text-gray-500">
                            <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                            clean
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">
                        {new Date(s.startedAt).toLocaleString()}
                      </p>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
