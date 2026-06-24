import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { redirect } from 'next/navigation'
import LandingPage from './landing'

export default async function RootPage() {
  const session = await auth()

  // Logged-in users → send to their org (or onboarding)
  if (session?.user?.id) {
    const membership = await db.organisationMember.findFirst({
      where: { userId: session.user.id },
      include: { organisation: { select: { slug: true } } },
      orderBy: { joinedAt: 'asc' },
    })
    if (!membership) redirect('/onboarding')
    redirect(`/${membership.organisation.slug}`)
  }

  // Logged-out users → marketing landing page
  return <LandingPage />
}
