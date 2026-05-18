'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { redirect } from 'next/navigation'
import { z } from 'zod'

const schema = z.object({
  webhookUrl: z.string().url('Must be a valid URL').or(z.literal('')),
})

export async function saveWebhookUrl(
  orgSlug: string,
  projectSlug: string,
  _prev: { error?: string; ok?: boolean },
  formData: FormData,
): Promise<{ error?: string; ok?: boolean }> {
  const session = await auth()
  if (!session?.user?.id) redirect('/sign-in')

  const raw = formData.get('webhookUrl')?.toString().trim() ?? ''
  const parsed = schema.safeParse({ webhookUrl: raw })
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? 'Invalid input' }
  }

  const org = await db.organisation.findUnique({
    where: { slug: orgSlug },
    include: {
      members: { where: { userId: session.user.id } },
      projects: { where: { slug: projectSlug } },
    },
  })

  if (!org || org.members.length === 0) return { error: 'Not authorized' }
  const project = org.projects[0]
  if (!project) return { error: 'Project not found' }

  await db.project.update({
    where: { id: project.id },
    data: { webhookUrl: parsed.data.webhookUrl || null },
  })

  return { ok: true }
}
