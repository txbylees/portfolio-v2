import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { slugify } from '@/lib/utils'

const schema = z.object({
  name: z.string().min(1).max(100),
})

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ orgId: string }> },
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { orgId } = await params

  const membership = await db.organisationMember.findUnique({
    where: { userId_organisationId: { userId: session.user.id, organisationId: orgId } },
  })
  if (!membership) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const result = schema.safeParse(body)
  if (!result.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
  }

  const { name } = result.data
  const slug = slugify(name)

  const existing = await db.project.findUnique({
    where: { organisationId_slug: { organisationId: orgId, slug } },
  })
  if (existing) {
    return NextResponse.json({ error: 'Project name already taken in this organisation' }, { status: 409 })
  }

  const project = await db.project.create({
    data: { name, slug, organisationId: orgId },
  })

  return NextResponse.json(project, { status: 201 })
}
