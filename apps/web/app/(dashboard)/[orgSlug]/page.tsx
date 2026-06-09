import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { SignOutButton } from '@/components/sign-out-button'
import { NavHeader } from '@/components/nav-header'

export default async function OrgPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>
}) {
  const session = await auth()
  if (!session?.user?.id) redirect('/sign-in')

  const { orgSlug } = await params

  const org = await db.organisation.findUnique({
    where: { slug: orgSlug },
    include: {
      members: { where: { userId: session.user.id } },
      projects: {
        orderBy: { createdAt: 'desc' },
        include: { _count: { select: { sessions: true } } },
      },
    },
  })

  if (!org || org.members.length === 0) redirect('/')

  return (
    <main className="min-h-screen bg-gray-50">
      <NavHeader
        crumbs={[{ label: org.name }]}
        right={<SignOutButton />}
      />

      <div className="mx-auto max-w-4xl px-8 py-10">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
          <Link
            href={`/${orgSlug}/projects/new`}
            className="flex items-center gap-1.5 rounded-lg bg-green-800 px-4 py-2 text-sm font-medium text-white hover:bg-green-900 transition-colors"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            New project
          </Link>
        </div>

        {org.projects.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 p-16 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-50">
              <svg className="h-6 w-6 text-green-700" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9.776c.112-.017.227-.026.344-.026h15.812c.117 0 .232.009.344.026m-16.5 0a2.25 2.25 0 0 0-1.883 2.542l.857 6a2.25 2.25 0 0 0 2.227 1.932H19.05a2.25 2.25 0 0 0 2.227-1.932l.857-6a2.25 2.25 0 0 0-1.883-2.542m-16.5 0V6A2.25 2.25 0 0 1 6 3.75h3.879a1.5 1.5 0 0 1 1.06.44l2.122 2.12a1.5 1.5 0 0 0 1.06.44H18A2.25 2.25 0 0 1 20.25 9v.776" />
              </svg>
            </div>
            <p className="mb-1 font-medium text-gray-700">No projects yet</p>
            <p className="mb-6 text-sm text-gray-500">Create a project to start recording sessions.</p>
            <Link
              href={`/${orgSlug}/projects/new`}
              className="rounded-lg bg-green-800 px-4 py-2 text-sm font-medium text-white hover:bg-green-900 transition-colors"
            >
              Create your first project
            </Link>
          </div>
        ) : (
          <div className="grid gap-3">
            {org.projects.map((project) => (
              <Link
                key={project.id}
                href={`/${orgSlug}/${project.slug}`}
                className="group flex items-center justify-between rounded-xl border border-gray-200 bg-white p-5 transition-all hover:border-green-200 hover:shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-green-50 text-green-700 group-hover:bg-green-100 transition-colors">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 0 0 6 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0 1 18 16.5h-2.25m-7.5 0h7.5m-7.5 0-1 3m8.5-3 1 3m0 0 .5 1.5m-.5-1.5h-9.5m0 0-.5 1.5" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="font-semibold text-gray-900">{project.name}</h2>
                    <p className="text-xs text-gray-400">{orgSlug}/{project.slug}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-500">
                  <span className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
                    {project._count.sessions} session{project._count.sessions !== 1 ? 's' : ''}
                  </span>
                  <svg className="h-4 w-4 text-gray-300 group-hover:text-green-600 transition-colors" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
