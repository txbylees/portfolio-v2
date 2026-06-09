import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { NavHeader } from '@/components/nav-header'
import { SessionPlayer, type ReplayEvent } from '@/components/session-player'
import BugChat from './bug-chat'

export default async function BugPage({
  params,
}: {
  params: Promise<{ bugId: string }>
}) {
  const session = await auth()
  if (!session?.user?.id) redirect('/sign-in')

  const { bugId } = await params

  const bug = await db.bug.findUnique({
    where: { id: bugId },
    include: {
      messages: { orderBy: { createdAt: 'asc' } },
      report: true,
      project: {
        include: {
          organisation: {
            include: { members: { where: { userId: session.user.id } } },
          },
        },
      },
    },
  })

  if (!bug || bug.project.organisation.members.length === 0) {
    redirect('/')
  }

  const org = bug.project.organisation
  const project = bug.project

  const rrwebEvents = (bug.rrwebEvents ?? []) as unknown as ReplayEvent[]
  // Replayer needs a full snapshot (type 2) to render anything
  const hasReplay = rrwebEvents.some((e) => e.type === 2)

  const consoleLogs = bug.consoleLogs as Array<{ level: string; message: string; stack?: string }>
  const networkFails = bug.networkFails as Array<{
    url: string; method: string; status: number; duration: number
  }>

  const reportTitle = bug.report?.title ?? bug.pageTitle ?? bug.pageUrl
  const shortTitle = reportTitle.length > 60 ? reportTitle.slice(0, 57) + '…' : reportTitle

  return (
    <main className="min-h-screen bg-gray-50">
      <NavHeader
        crumbs={[
          { label: org.name, href: `/${org.slug}` },
          { label: project.name, href: `/${org.slug}/${project.slug}/bugs` },
          { label: shortTitle },
        ]}
      />

      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-6">
          <div className="flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <h1 className="text-xl font-semibold text-gray-900 leading-snug">
                {bug.report?.title ?? bug.pageTitle ?? bug.pageUrl}
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                <Link
                  href={bug.pageUrl}
                  target="_blank"
                  className="hover:text-blue-600 hover:underline"
                >
                  {bug.pageUrl}
                </Link>
                {' · '}
                {new Date(bug.capturedAt).toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {hasReplay && (
          <div className="mb-6">
            <div className="mb-2 flex items-center gap-2">
              <h2 className="text-sm font-medium text-gray-700">Replay</h2>
              <span className="text-xs text-gray-400">the last moments before capture</span>
            </div>
            <SessionPlayer events={rrwebEvents} url={bug.pageUrl} />
          </div>
        )}

        <BugChat
          bugId={bug.id}
          initialMessages={bug.messages.map((m) => ({
            role: m.role,
            content: m.content,
            createdAt: m.createdAt,
          }))}
          initialReport={
            bug.report
              ? {
                  title: bug.report.title,
                  summary: bug.report.summary,
                  stepsToReproduce: bug.report.stepsToReproduce as string[],
                  expectedBehaviour: bug.report.expectedBehaviour,
                  actualBehaviour: bug.report.actualBehaviour,
                  suspectedCause: bug.report.suspectedCause ?? null,
                  severity: bug.report.severity,
                }
              : null
          }
          initialStatus={bug.status}
          playwrightScript={bug.playwrightScript ?? null}
          screenshotDataUrl={bug.screenshotDataUrl ?? null}
          pageUrl={bug.pageUrl}
          userAgent={bug.userAgent}
          consoleLogs={consoleLogs}
          networkFails={networkFails}
          screenWidth={bug.screenWidth}
          screenHeight={bug.screenHeight}
          capturedAt={bug.capturedAt}
        />
      </div>
    </main>
  )
}
