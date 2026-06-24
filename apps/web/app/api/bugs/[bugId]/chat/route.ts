import { type NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { continueConversation, generateTicket, generatePlaywrightScript } from '@/lib/claude'
import { AI_ENABLED } from '@/lib/flags'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ bugId: string }> }
) {
  if (!AI_ENABLED) {
    return NextResponse.json({ error: 'AI is disabled' }, { status: 503 })
  }

  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { bugId } = await params

  const bug = await db.bug.findUnique({
    where: { id: bugId },
    include: {
      messages: { orderBy: { createdAt: 'asc' } },
      report: true,
      project: {
        include: {
          organisation: {
            include: { members: { where: { userId: session.user.id } } },
          },
        },
      },
    },
  })

  if (!bug || bug.project.organisation.members.length === 0) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const { message } = (await req.json()) as { message: string }
  if (!message?.trim()) {
    return NextResponse.json({ error: 'Empty message' }, { status: 400 })
  }

  const consoleLogs = bug.consoleLogs as Array<{ level: string; message: string; stack?: string }>
  const networkFails = bug.networkFails as Array<{
    url: string
    method: string
    status: number
    duration: number
  }>

  const ctx = {
    pageUrl: bug.pageUrl,
    pageTitle: bug.pageTitle,
    userAgent: bug.userAgent,
    consoleLogs,
    networkFails,
  }

  // Save user message
  await db.bugMessage.create({ data: { bugId, role: 'USER', content: message } })

  const history = bug.messages.map((m) => ({ role: m.role, content: m.content }))

  // Get AI reply
  let aiReply: string
  try {
    aiReply = await continueConversation(ctx, history, message)
  } catch (err) {
    console.error('[bugs/chat] continueConversation failed:', err)
    return NextResponse.json(
      { error: 'AI call failed', detail: String(err) },
      { status: 500 }
    )
  }

  await db.bugMessage.create({ data: { bugId, role: 'ASSISTANT', content: aiReply } })

  // After first user message, generate ticket + Playwright script if not already done
  const isFirstUserMessage = !history.some((m) => m.role === 'USER')
  if (isFirstUserMessage && !bug.report) {
    generateTicketAndScript(bugId, ctx, [...history, { role: 'USER' as const, content: message }, { role: 'ASSISTANT' as const, content: aiReply }]).catch(
      (err) => console.error('[bugs/chat] ticket generation failed:', err)
    )
  }

  return NextResponse.json({ message: aiReply })
}

async function generateTicketAndScript(
  bugId: string,
  ctx: Parameters<typeof generateTicket>[0],
  conversation: Parameters<typeof generateTicket>[1]
) {
  const ticket = await generateTicket(ctx, conversation)

  await db.bugReport.create({
    data: {
      bugId,
      title: ticket.title,
      summary: ticket.summary,
      stepsToReproduce: ticket.stepsToReproduce,
      expectedBehaviour: ticket.expectedBehaviour,
      actualBehaviour: ticket.actualBehaviour,
      suspectedCause: ticket.suspectedCause ?? null,
      severity: ticket.severity,
    },
  })

  const script = await generatePlaywrightScript(
    ctx.pageUrl,
    ticket.title,
    ticket.stepsToReproduce,
    ticket.expectedBehaviour
  )

  if (script) {
    await db.bug.update({ where: { id: bugId }, data: { playwrightScript: script } })
  }
}
