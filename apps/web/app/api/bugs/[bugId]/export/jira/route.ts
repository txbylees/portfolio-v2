import { type NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { getDiagnostics } from '@/lib/bug-export'

interface JiraExportBody {
  domain: string   // e.g. "mycompany.atlassian.net"
  email: string
  apiToken: string
  projectKey: string // e.g. "QA"
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ bugId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { bugId } = await params
  const { domain, email, apiToken, projectKey } = (await req.json()) as JiraExportBody

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
  const { consoleErrors, networkFails } = getDiagnostics(bug.consoleLogs, bug.networkFails)

  // ADF nodes for captured diagnostics (only when there's something to show)
  const adfHeading = (text: string) => ({
    type: 'heading',
    attrs: { level: 3 },
    content: [{ type: 'text', text }],
  })
  const adfBulletList = (items: string[]) => ({
    type: 'bulletList',
    content: items.map((text) => ({
      type: 'listItem',
      content: [{ type: 'paragraph', content: [{ type: 'text', text }] }],
    })),
  })
  const diagnosticsNodes = [
    ...(consoleErrors.length > 0
      ? [adfHeading('Console Errors'), adfBulletList(consoleErrors.map((e) => e.message))]
      : []),
    ...(networkFails.length > 0
      ? [adfHeading('Failed Requests'), adfBulletList(networkFails.map((n) => `${n.method} ${n.url} → ${n.status}`))]
      : []),
  ]

  const priorityMap: Record<string, string> = {
    P1: 'Highest',
    P2: 'High',
    P3: 'Medium',
    P4: 'Low',
  }

  const description = {
    type: 'doc',
    version: 1,
    content: [
      {
        type: 'paragraph',
        content: [{ type: 'text', text: report?.summary ?? `Bug captured at ${bug.pageUrl}` }],
      },
      {
        type: 'heading',
        attrs: { level: 3 },
        content: [{ type: 'text', text: 'Environment' }],
      },
      {
        type: 'bulletList',
        content: [
          { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: `URL: ${bug.pageUrl}` }] }] },
          { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: `Browser: ${bug.userAgent.slice(0, 100)}` }] }] },
        ],
      },
      ...diagnosticsNodes,
      ...(steps.length > 0
        ? [
            { type: 'heading', attrs: { level: 3 }, content: [{ type: 'text', text: 'Steps to Reproduce' }] },
            {
              type: 'orderedList',
              content: steps.map((s) => ({
                type: 'listItem',
                content: [{ type: 'paragraph', content: [{ type: 'text', text: s }] }],
              })),
            },
          ]
        : []),
      ...(report
        ? [
            { type: 'heading', attrs: { level: 3 }, content: [{ type: 'text', text: 'Expected Behaviour' }] },
            { type: 'paragraph', content: [{ type: 'text', text: report.expectedBehaviour }] },
            { type: 'heading', attrs: { level: 3 }, content: [{ type: 'text', text: 'Actual Behaviour' }] },
            { type: 'paragraph', content: [{ type: 'text', text: report.actualBehaviour }] },
          ]
        : []),
    ],
  }

  const credentials = Buffer.from(`${email}:${apiToken}`).toString('base64')
  const res = await fetch(`https://${domain}/rest/api/3/issue`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      fields: {
        summary: report?.title ?? `Bug: ${bug.pageUrl}`,
        description,
        issuetype: { name: 'Bug' },
        project: { key: projectKey },
        priority: { name: priorityMap[severity] ?? 'Medium' },
      },
    }),
  })

  if (!res.ok) {
    const err = (await res.json()) as { errorMessages?: string[]; errors?: Record<string, string> }
    const message =
      err.errorMessages?.[0] ?? Object.values(err.errors ?? {})[0] ?? 'Jira API error'
    return NextResponse.json({ error: message }, { status: res.status })
  }

  const issue = (await res.json()) as { key: string }
  return NextResponse.json({
    issueUrl: `https://${domain}/browse/${issue.key}`,
    issueKey: issue.key,
  })
}
