import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import WebhookForm from './webhook-form'
import { NavHeader } from '@/components/nav-header'

export default async function SettingsPage({
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
      projects: { where: { slug: projectSlug } },
    },
  })

  if (!org || org.members.length === 0) redirect('/')
  const project = org.projects[0]
  if (!project) redirect(`/${orgSlug}`)

  return (
    <main className="min-h-screen bg-gray-50">
      <NavHeader
        crumbs={[
          { label: org.name, href: `/${orgSlug}` },
          { label: project.name, href: `/${orgSlug}/${projectSlug}` },
          { label: 'Settings' },
        ]}
      />

      {/* Tab navigation */}
      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-5xl px-6">
          <nav className="-mb-px flex gap-1">
            {[
              { label: 'Overview', href: `/${orgSlug}/${projectSlug}` },
              { label: 'Bugs', href: `/${orgSlug}/${projectSlug}/bugs` },
              { label: 'API Keys', href: `/${orgSlug}/${projectSlug}/keys` },
              { label: 'Settings', href: `/${orgSlug}/${projectSlug}/settings`, active: true },
            ].map((tab) => (
              <Link
                key={tab.href}
                href={tab.href}
                className={`border-b-2 px-4 py-3.5 text-sm font-medium transition-colors ${'active' in tab && tab.active
                  ? 'border-green-600 text-green-700'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-6 py-8">
        <h1 className="mb-6 text-xl font-bold text-gray-900">Project settings</h1>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-1 font-semibold text-gray-900">Error webhook</h2>
          <p className="mb-6 text-sm text-gray-500">
            Receive a notification when a session records its first console error.
          </p>
          <WebhookForm
            orgSlug={orgSlug}
            projectSlug={projectSlug}
            currentUrl={project.webhookUrl}
          />
        </div>

        <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-2 font-semibold text-gray-900">Webhook payload</h2>
          <p className="mb-3 text-sm text-gray-500">
            Your endpoint will receive a <code className="rounded bg-gray-100 px-1 py-0.5 text-xs text-green-700">POST</code> request with this JSON body:
          </p>
          <pre className="overflow-x-auto rounded-lg bg-gray-950 p-4 text-xs text-gray-300">{`{
  "event": "session.error",
  "sessionId": "cuid...",
  "sessionUrl": "https://your-app.com/page",
  "projectName": "${project.name}",
  "errors": [
    {
      "level": "error",
      "message": "TypeError: Cannot read properties of undefined",
      "stack": "TypeError: ...",
      "timestamp": 1747000000000
    }
  ],
  "triggeredAt": "2026-05-18T22:00:00.000Z"
}`}</pre>
        </div>
      </div>
    </main>
  )
}
