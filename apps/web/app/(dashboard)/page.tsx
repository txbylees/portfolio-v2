import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { redirect } from 'next/navigation'

export default async function DashboardRootPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/sign-in')

  const membership = await db.organisationMember.findFirst({
    where: { userId: session.user.id },
    include: { organisation: { select: { slug: true } } },
    orderBy: { joinedAt: 'asc' },
  })

  if (!membership) redirect('/onboarding')
  redirect(`/${membership.organisation.slug}`)
}
