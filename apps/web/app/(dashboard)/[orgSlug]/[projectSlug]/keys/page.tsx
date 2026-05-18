import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { KeyManager } from './key-manager'

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

  const serialisedKeys = keys.map((k) => ({
    ...k,
    lastUsedAt: k.lastUsedAt?.toISOString() ?? null,
    createdAt: k.createdAt.toISOString(),
  }))

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <header className="border-b border-gray-800 px-8 py-4">
        <nav className="text-sm text-gray-400">
          <Link href={`/${orgSlug}`} className="hover:text-white">{org.name}</Link>
          <span className="mx-2">/</span>
          <Link href={`/${orgSlug}/${projectSlug}`} className="hover:text-white">{project.name}</Link>
          <span className="mx-2">/</span>
          <span className="text-white">API keys</span>
        </nav>
      </header>

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
