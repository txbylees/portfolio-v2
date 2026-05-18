import { type NextRequest, NextResponse } from 'next/server'
import { hashApiKey } from '@/lib/apikey'
import { db } from '@/lib/db'
import type { SessionChunk } from '@reprod/shared'

async function fireWebhook(url: string, payload: unknown): Promise<void> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 5000)
  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    })
  } finally {
    clearTimeout(timeout)
  }
}

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-API-Key',
}

function step(name: string) {
  return (err: unknown): never => {
    const msg = err instanceof Error ? err.message : String(err)
    throw new Error(`[${name}] ${msg}`)
  }
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS })
}

export async function POST(req: NextRequest) {
  const rawKey = req.headers.get('X-API-Key')
  if (!rawKey) {
    return NextResponse.json({ error: 'Missing API key' }, { status: 401, headers: CORS })
  }

  const apiKey = await db.apiKey.findUnique({
    where: { keyHash: hashApiKey(rawKey) },
    select: {
      id: true,
      projectId: true,
      isActive: true,
      project: { select: { name: true, webhookUrl: true } },
    },
  })

  if (!apiKey?.isActive) {
    return NextResponse.json({ error: 'Invalid API key' }, { status: 401, headers: CORS })
  }

  let chunk: SessionChunk
  try {
    chunk = (await req.json()) as SessionChunk
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400, headers: CORS })
  }

  if (!chunk.sessionId) {
    return NextResponse.json({ error: 'Missing sessionId' }, { status: 400, headers: CORS })
  }

  const { id: keyId, projectId } = apiKey

  try {
    // Upsert session first (outside transaction) so it always exists
    // before we try to insert child records
    if (chunk.init) {
      await db.session
        .upsert({
          where: { id: chunk.sessionId },
          create: {
            id: chunk.sessionId,
            projectId,
            url: chunk.init.url,
            userAgent: chunk.init.userAgent,
            screenWidth: chunk.init.screenWidth,
            screenHeight: chunk.init.screenHeight,
            lastEventAt: new Date(),
          },
          update: { lastEventAt: new Date() },
        })
        .catch(step('session.upsert'))
    } else {
      // updateMany won't throw if the record is missing — safe for out-of-order delivery
      await db.session
        .updateMany({
          where: { id: chunk.sessionId },
          data: { lastEventAt: new Date() },
        })
        .catch(step('session.updateMany'))
    }

    // Mark key as used
    await db.apiKey
      .update({ where: { id: keyId }, data: { lastUsedAt: new Date() } })
      .catch(step('apiKey.update'))

    // Insert events in a batch — store raw JSON blob per event
    if (chunk.events.length > 0) {
      await db.sessionEvent
        .createMany({
          data: chunk.events.map((e) => ({
            sessionId: chunk.sessionId,
            type: e.type,
            // Cast to any to avoid Prisma InputJsonValue type complexity;
            // data is already a parsed JSON value from req.json()
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            data: e.data as any,
            timestamp: BigInt(Math.round(e.timestamp)),
            sequence: chunk.sequence,
          })),
        })
        .catch(step('sessionEvent.createMany'))
    }

    const newErrors = chunk.consoleLogs.filter((l) => l.level === 'error')

    // Check before insert so we can detect if these are the first errors
    let existingErrorCount = 0
    if (newErrors.length > 0 && apiKey.project.webhookUrl) {
      existingErrorCount = await db.consoleLog.count({
        where: { sessionId: chunk.sessionId, level: 'ERROR' },
      })
    }

    if (chunk.consoleLogs.length > 0) {
      await db.consoleLog
        .createMany({
          data: chunk.consoleLogs.map((log) => ({
            sessionId: chunk.sessionId,
            level: log.level === 'error' ? ('ERROR' as const) : ('WARN' as const),
            message: log.message,
            timestamp: BigInt(Math.round(log.timestamp)),
            ...(log.stack !== undefined ? { stack: log.stack } : {}),
          })),
        })
        .catch(step('consoleLog.createMany'))
    }

    // Fire webhook on the first error chunk for this session — don't block the response
    if (newErrors.length > 0 && existingErrorCount === 0 && apiKey.project.webhookUrl) {
      const session = await db.session.findUnique({
        where: { id: chunk.sessionId },
        select: { url: true },
      })
      fireWebhook(apiKey.project.webhookUrl, {
        event: 'session.error',
        sessionId: chunk.sessionId,
        sessionUrl: session?.url ?? '',
        projectName: apiKey.project.name,
        errors: newErrors.map((e) => ({
          level: e.level,
          message: e.message,
          ...(e.stack !== undefined ? { stack: e.stack } : {}),
          timestamp: e.timestamp,
        })),
        triggeredAt: new Date().toISOString(),
      }).catch((err) => console.error('[webhook]', err))
    }

    if (chunk.networkRequests.length > 0) {
      await db.networkRequest
        .createMany({
          data: chunk.networkRequests.map((r) => ({
            sessionId: chunk.sessionId,
            url: r.url,
            method: r.method,
            status: r.status,
            duration: r.duration,
            timestamp: BigInt(Math.round(r.timestamp)),
            ...(r.requestBody !== undefined ? { requestBody: r.requestBody } : {}),
            ...(r.responseBody !== undefined ? { responseBody: r.responseBody } : {}),
          })),
        })
        .catch(step('networkRequest.createMany'))
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[ingest]', message)
    return NextResponse.json({ error: message }, { status: 500, headers: CORS })
  }

  return NextResponse.json({ ok: true }, { headers: CORS })
}
