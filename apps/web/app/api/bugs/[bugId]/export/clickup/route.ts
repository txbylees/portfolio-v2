import { type NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { getDiagnostics, diagnosticsMarkdown } from '@/lib/bug-export'

interface ClickUpExportBody {
  apiToken: string
  listId: string
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ bugId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { bugId } = await params
  const { apiToken, listId } = (await req.json()) as ClickUpExportBody

  const bug = await db.bug.findUnique({
    where: { id: bugId },
    include: {
      report: true,
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

  const report = bug.report
  const steps = report ? (report.stepsToReproduce as string[]) : []
  const severity = report?.severity ?? 'P3'
  const priorityMap: Record<string, number> = { P1: 1, P2: 2, P3: 3, P4: 4 }

  const diagnostics = diagnosticsMarkdown(getDiagnostics(bug.consoleLogs, bug.networkFails))

  const descLines = [
    report?.summary ?? `Bug captured at ${bug.pageUrl}`,
    '',
    `**URL:** ${bug.pageUrl}`,
    `**Browser:** ${bug.userAgent.slice(0, 100)}`,
    '',
    diagnostics,
    steps.length > 0
      ? `**Steps to Reproduce:**\n${steps.map((s, i) => `${i + 1}. ${s}`).join('\n')}`
      : '',
    report ? `\n**Expected:** ${report.expectedBehaviour}` : '',
    report ? `**Actual:** ${report.actualBehaviour}` : '',
    report?.suspectedCause ? `\n**Suspected Cause:** ${report.suspectedCause}` : '',
  ]
    .filter(Boolean)
    .join('\n')

  const res = await fetch(`https://api.clickup.com/api/v2/list/${listId}/task`, {
    method: 'POST',
    headers: {
      Authorization: apiToken,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: report?.title ?? `Bug: ${bug.pageUrl}`,
      description: descLines,
      priority: priorityMap[severity] ?? 3,
      tags: ['bug', severity.toLowerCase()],
    }),
  })

  if (!res.ok) {
    const err = (await res.json()) as { err?: string }
    return NextResponse.json({ error: err.err ?? 'ClickUp API error' }, { status: res.status })
  }

  const task = (await res.json()) as { id: string; url: string }
  return NextResponse.json({ issueUrl: task.url, taskId: task.id })
}
