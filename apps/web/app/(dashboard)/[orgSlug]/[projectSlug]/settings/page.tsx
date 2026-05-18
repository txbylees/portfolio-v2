import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { redirect } from 'next/navigation'
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
    <main className="min-h-screen bg-gray-950 text-white">
      <NavHeader
        crumbs={[
          { label: org.name, href: `/${orgSlug}` },
          { label: project.name, href: `/${orgSlug}/${projectSlug}` },
          { label: 'Settings' },
        ]}
      />

      <div className="mx-auto max-w-2xl px-8 py-10">
        <h1 className="mb-8 text-2xl font-bold">Project settings</h1>

        <div className="rounded-xl border border-gray-800 bg-gray-900 p-6">
          <h2 className="mb-1 font-semibold">Error webhook</h2>
          <p className="mb-6 text-sm text-gray-400">
            Receive a notification when a session records its first console error.
          </p>
          <WebhookForm
            orgSlug={orgSlug}
            projectSlug={projectSlug}
            currentUrl={project.webhookUrl}
          />
        </div>

        <div className="mt-6 rounded-xl border border-gray-800 bg-gray-900 p-6">
          <h2 className="mb-2 font-semibold">Webhook payload</h2>
          <p className="mb-3 text-sm text-gray-400">
            Your endpoint will receive a <code className="text-blue-400">POST</code> request with this JSON body:
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
