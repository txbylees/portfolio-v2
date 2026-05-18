import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { redirect } from 'next/navigation'
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
    <main className="min-h-screen bg-gray-950 text-white">
      <NavHeader
        crumbs={[
          { label: org.name, href: `/${orgSlug}` },
          { label: project.name, href: `/${orgSlug}/${projectSlug}` },
          { label: 'API keys' },
        ]}
      />

      <div className="mx-auto max-w-3xl px-8 py-10">
        <h1 className="mb-8 text-2xl font-bold">API keys</h1>
        <KeyManager
          orgId={org.id}
          projectId={project.id}
          initialKeys={serialisedKeys}
        />
      </div>
    </main>
  )
}
