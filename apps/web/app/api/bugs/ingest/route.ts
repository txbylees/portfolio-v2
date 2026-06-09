import { type NextRequest, NextResponse } from 'next/server'
import { hashApiKey } from '@/lib/apikey'
import { db } from '@/lib/db'
import { generateInitialAnalysis } from '@/lib/claude'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS })
}

interface CapturedEvent {
  type: 'rrweb' | 'console' | 'network'
  timestamp: number
  data: unknown
}

interface BugIngestBody {
  events: CapturedEvent[]
  env: {
    url: string
    title?: string
    userAgent: string
    screenWidth: number
    screenHeight: number
    viewportWidth?: number
    viewportHeight?: number
    timestamp: number
  }
  screenshot: string | null
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('Authorization') ?? ''
  const rawKey = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : null

  if (!rawKey) {
    return NextResponse.json({ error: 'Missing API key' }, { status: 401, headers: CORS })
  }

  const apiKey = await db.apiKey.findUnique({
    where: { keyHash: hashApiKey(rawKey) },
    select: { id: true, projectId: true, isActive: true },
  })

  if (!apiKey?.isActive) {
    return NextResponse.json({ error: 'Invalid API key' }, { status: 401, headers: CORS })
  }

  let body: BugIngestBody
  try {
    body = (await req.json()) as BugIngestBody
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400, headers: CORS })
  }

  const { events, env, screenshot } = body

  const rrwebEvents = events.filter((e) => e.type === 'rrweb').map((e) => e.data)
  const consoleLogs = events
    .filter((e) => e.type === 'console')
    .map((e) => e.data as { level: string; message: string; stack?: string })
  const networkFails = events
    .filter((e) => e.type === 'network')
    .map((e) => e.data as { url: string; method: string; status: number; duration: number })

  const bug = await db.bug.create({
    data: {
      projectId: apiKey.projectId,
      pageUrl: env.url,
      pageTitle: env.title ?? null,
      userAgent: env.userAgent,
      screenWidth: env.screenWidth,
      screenHeight: env.screenHeight,
      viewportWidth: env.viewportWidth ?? null,
      viewportHeight: env.viewportHeight ?? null,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      rrwebEvents: rrwebEvents as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      consoleLogs: consoleLogs as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      networkFails: networkFails as any,
      screenshotDataUrl: screenshot ?? null,
    },
  })

  // Generate initial AI analysis — await so message is ready when page opens
  try {
    const initialMessage = await generateInitialAnalysis({
      pageUrl: env.url,
      pageTitle: env.title ?? null,
      userAgent: env.userAgent,
      consoleLogs,
      networkFails,
    })

    if (initialMessage) {
      await db.bugMessage.create({
        data: { bugId: bug.id, role: 'ASSISTANT', content: initialMessage },
      })
    }
  } catch (err) {
    console.error('[bugs/ingest] AI analysis failed:', err)
  }

  await db.apiKey
    .update({ where: { id: apiKey.id }, data: { lastUsedAt: new Date() } })
    .catch(() => null)

  return NextResponse.json({ bugId: bug.id }, { headers: CORS })
}
