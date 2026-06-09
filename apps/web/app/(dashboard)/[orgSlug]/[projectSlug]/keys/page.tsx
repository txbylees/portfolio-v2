import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { KeyManager } from './key-manager'
import { NavHeader } from '@/components/nav-header'

export default async function KeysPage({
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

  const keys = await db.apiKey.findMany({
    where: { projectId: project.id },
    select: { id: true, name: true, prefix: true, isActive: true, lastUsedAt: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  })

  type RawKey = typeof keys[number]
  const serialisedKeys = keys.map((k: RawKey) => ({
    ...k,
    lastUsedAt: k.lastUsedAt?.toISOString() ?? null,
    createdAt: k.createdAt.toISOString(),
  }))

  return (
    <main className="min-h-screen bg-gray-50">
      <NavHeader
        crumbs={[
          { label: org.name, href: `/${orgSlug}` },
          { label: project.name, href: `/${orgSlug}/${projectSlug}` },
          { label: 'API Keys' },
        ]}
      />

      {/* Tab navigation */}
      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-5xl px-6">
          <nav className="-mb-px flex gap-1">
            {[
              { label: 'Overview', href: `/${orgSlug}/${projectSlug}` },
              { label: 'Bugs', href: `/${orgSlug}/${projectSlug}/bugs` },
              { label: 'API Keys', href: `/${orgSlug}/${projectSlug}/keys`, active: true },
              { label: 'Settings', href: `/${orgSlug}/${projectSlug}/settings` },
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

      <div className="mx-auto max-w-3xl px-6 py-8">
        <h1 className="mb-6 text-xl font-bold text-gray-900">API Keys</h1>
        <KeyManager
          orgId={org.id}
          projectId={project.id}
          initialKeys={serialisedKeys}
        />
      </div>
    </main>
  )
}
