import { type NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ bugId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { bugId } = await params

  const bug = await db.bug.findUnique({
    where: { id: bugId },
    select: {
      playwrightScript: true,
      report: true,
      project: {
        select: {
          organisation: {
            select: { members: { where: { userId: session.user.id } } },
          },
        },
      },
    },
  })

  if (!bug || bug.project.organisation.members.length === 0) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json({
    report: bug.report,
    playwrightScript: bug.playwrightScript,
  })
}
