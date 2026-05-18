import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { redirect } from 'next/navigation'
import { NewProjectForm } from './form'

export default async function NewProjectPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>
}) {
  const session = await auth()
  if (!session?.user?.id) redirect('/sign-in')

  const { orgSlug } = await params

  const org = await db.organisation.findUnique({
    where: { slug: orgSlug },
    include: { members: { where: { userId: session.user.id } } },
  })

  if (!org || org.members.length === 0) redirect('/')

  return <NewProjectForm orgId={org.id} orgSlug={orgSlug} />
}
