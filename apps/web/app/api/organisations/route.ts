import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { slugify } from '@/lib/utils'

const schema = z.object({
  name: z.string().min(1).max(100),
})

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const result = schema.safeParse(body)
  if (!result.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
  }

  const { name } = result.data
  const slug = slugify(name)

  const existing = await db.organisation.findUnique({ where: { slug } })
  if (existing) {
    return NextResponse.json({ error: 'Organisation name already taken' }, { status: 409 })
  }

  const org = await db.organisation.create({
    data: {
      name,
      slug,
      members: {
        create: { userId: session.user.id, role: 'OWNER' },
      },
    },
  })

  return NextResponse.json(org, { status: 201 })
}
