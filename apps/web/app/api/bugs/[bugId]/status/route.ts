import { type NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import type { BugStatus } from '@prisma/client'

const VALID_STATUSES: BugStatus[] = ['OPEN', 'IN_PROGRESS', 'FIXED', 'CLOSED', 'DUPLICATE']

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ bugId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { bugId } = await params
  const { status } = (await req.json()) as { status: BugStatus }

  if (!VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }

  const bug = await db.bug.findUnique({
    where: { id: bugId },
    include: {
      project: {
        include: {
          organisation: { include: { members: { where: { userId: session.user.id } } } },
        },
      },
    },
  })

  if (!bug || bug.project.organisation.members.length === 0) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  await db.bug.update({ where: { id: bugId }, data: { status } })
  return NextResponse.json({ ok: true })
}
