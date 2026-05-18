import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { generateApiKey } from '@/lib/apikey'

const createSchema = z.object({
  name: z.string().min(1).max(100),
})

type Params = { params: Promise<{ orgId: string; projectId: string }> }

async function verifyAccess(userId: string, orgId: string, projectId: string) {
  const [membership, project] = await Promise.all([
    db.organisationMember.findUnique({
      where: { userId_organisationId: { userId, organisationId: orgId } },
    }),
    db.project.findFirst({ where: { id: projectId, organisationId: orgId } }),
  ])
  return membership && project ? project : null
}

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { orgId, projectId } = await params
  const project = await verifyAccess(session.user.id, orgId, projectId)
  if (!project) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const keys = await db.apiKey.findMany({
    where: { projectId },
    select: { id: true, name: true, prefix: true, isActive: true, lastUsedAt: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ keys })
}

export async function POST(req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { orgId, projectId } = await params
  const project = await verifyAccess(session.user.id, orgId, projectId)
  if (!project) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const result = createSchema.safeParse(body)
  if (!result.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

  const { key, keyHash, prefix } = generateApiKey()

  const apiKey = await db.apiKey.create({
    data: { name: result.data.name, keyHash, prefix, projectId },
    select: { id: true, name: true, prefix: true, createdAt: true },
  })

  // key returned here ONCE — never stored raw, never returned again
  return NextResponse.json({ ...apiKey, key }, { status: 201 })
}
