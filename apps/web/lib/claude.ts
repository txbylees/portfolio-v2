import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? '')

function getModel(systemInstruction: string) {
  return genAI.getGenerativeModel({
    model: 'gemini-2.0-flash-lite',
    systemInstruction,
  })
}

export interface BugContext {
  pageUrl: string
  pageTitle?: string | null
  userAgent: string
  consoleLogs: Array<{ level: string; message: string; stack?: string }>
  networkFails: Array<{ url: string; method: string; status: number; duration: number }>
}

function buildContextBlock(ctx: BugContext): string {
  const errors = ctx.consoleLogs.filter((l) => l.level === 'error' || l.level === 'ERROR')
  const warns = ctx.consoleLogs.filter((l) => l.level === 'warn' || l.level === 'WARN')

  const lines: string[] = [
    `Page: ${ctx.pageUrl}${ctx.pageTitle ? ` — "${ctx.pageTitle}"` : ''}`,
    `Browser: ${ctx.userAgent.slice(0, 150)}`,
  ]

  if (errors.length > 0) {
    lines.push(`\nConsole errors (${errors.length}):`)
    errors.forEach((e) => {
      const firstStackLine = e.stack?.split('\n')[1]?.trim()
      lines.push(`  • ${e.message}${firstStackLine ? `\n    at ${firstStackLine}` : ''}`)
    })
  }

  if (warns.length > 0) {
    lines.push(`\nConsole warnings (${warns.length}):`)
    warns.forEach((w) => lines.push(`  • ${w.message}`))
  }

  if (ctx.networkFails.length > 0) {
    lines.push(`\nFailed network requests (${ctx.networkFails.length}):`)
    ctx.networkFails.forEach((n) =>
      lines.push(`  • ${n.method} ${n.url} → ${n.status} (${n.duration}ms)`)
    )
  }

  if (errors.length === 0 && warns.length === 0 && ctx.networkFails.length === 0) {
    lines.push('\nNo console errors or failed requests were captured automatically.')
  }

  return lines.join('\n')
}

export async function generateInitialAnalysis(ctx: BugContext): Promise<string> {
  const model = getModel(
    'You are a QA assistant in Reprod, a bug reproduction tool. Be concise and direct. Write in plain prose, no bullet lists.'
  )
  const result = await model.generateContent(
    `A QA tester just triggered a bug capture. Here is the technical context collected automatically:\n\n${buildContextBlock(ctx)}\n\nIn 2-3 sentences, summarise what you can see went wrong. Then ask one question: what test case were they running and what did they expect to happen?`
  )
  return result.response.text()
}

export async function continueConversation(
  ctx: BugContext,
  history: Array<{ role: 'USER' | 'ASSISTANT'; content: string }>,
  userMessage: string
): Promise<string> {
  const model = getModel(
    `You are a QA assistant in Reprod. You have this bug context:\n\n${buildContextBlock(ctx)}\n\nHelp the tester describe the bug clearly. Keep replies concise. Once you have enough information, let them know you're ready to generate the bug report.`
  )

  // Gemini requires history to start with 'user' and alternate roles.
  // The first saved message is often the initial ASSISTANT analysis (no user turn yet),
  // so we skip any leading 'model' entries.
  const geminiHistory: Array<{ role: string; parts: Array<{ text: string }> }> = []
  for (const m of history) {
    const role = m.role === 'USER' ? 'user' : 'model'
    if (geminiHistory.length === 0 && role === 'model') continue
    geminiHistory.push({ role, parts: [{ text: m.content }] })
  }

  const chat = model.startChat({ history: geminiHistory })

  const result = await chat.sendMessage(userMessage)
  return result.response.text()
}

export interface GeneratedTicket {
  title: string
  summary: string
  stepsToReproduce: string[]
  expectedBehaviour: string
  actualBehaviour: string
  suspectedCause: string | null
  severity: 'P1' | 'P2' | 'P3' | 'P4'
}

export async function generateTicket(
  ctx: BugContext,
  conversation: Array<{ role: 'USER' | 'ASSISTANT'; content: string }>
): Promise<GeneratedTicket> {
  const model = getModel(
    'You generate structured QA bug reports. Return ONLY valid JSON — no markdown fences, no explanation.'
  )

  const history = conversation
    .map((m) => `${m.role === 'USER' ? 'Tester' : 'Assistant'}: ${m.content}`)
    .join('\n\n')

  const result = await model.generateContent(
    `Generate a bug report from this context.\n\nTechnical context:\n${buildContextBlock(ctx)}\n\nConversation:\n${history}\n\nReturn exactly this JSON structure:\n{\n  "title": "concise bug title under 80 chars",\n  "summary": "2-3 sentence description",\n  "stepsToReproduce": ["step 1", "step 2"],\n  "expectedBehaviour": "what should have happened",\n  "actualBehaviour": "what actually happened",\n  "suspectedCause": "technical root cause from logs, or null",\n  "severity": "P1"\n}\n\nSeverity guide: P1=blocks all users, P2=major feature broken, P3=moderate with workaround, P4=minor/cosmetic`
  )

  const text = result.response.text().trim()
  const jsonMatch = text.match(/\{[\s\S]+\}/)
  if (!jsonMatch) throw new Error('No JSON found in Gemini response')

  return JSON.parse(jsonMatch[0]) as GeneratedTicket
}

export async function generatePlaywrightScript(
  pageUrl: string,
  title: string,
  stepsToReproduce: string[],
  expectedBehaviour: string
): Promise<string> {
  const model = getModel(
    'You write TypeScript Playwright tests. Return ONLY the code — no markdown fences, no explanation.'
  )

  const result = await model.generateContent(
    `Write a Playwright test to reproduce this bug.\n\nURL: ${pageUrl}\nBug: ${title}\nSteps: ${stepsToReproduce.join(' → ')}\nExpected: ${expectedBehaviour}\n\nUse @playwright/test. Name the test "reproduces: ${title}". Include assertions that verify the expected behaviour should have occurred.`
  )

  return result.response
    .text()
    .trim()
    .replace(/^```(?:typescript|ts)?\n?/, '')
    .replace(/\n?```$/, '')
}
