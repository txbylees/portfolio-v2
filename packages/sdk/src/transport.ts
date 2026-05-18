import type { RrwebEvent, ConsoleLogEntry, NetworkRequestEntry, SessionChunk, SessionInitPayload } from '@reprod/shared'

export interface FlushResult {
  status: number
  ok: boolean
  error?: string
}

export interface TransportOptions {
  endpoint: string
  apiKey: string
  sessionId: string
  flushIntervalMs: number
  initData: SessionInitPayload
  onFlush?: (result: FlushResult) => void
}

export class Transport {
  private events: RrwebEvent[] = []
  private consoleLogs: ConsoleLogEntry[] = []
  private networkRequests: NetworkRequestEntry[] = []
  private sequence = 0
  private timer: ReturnType<typeof setInterval> | null = null

  constructor(private readonly options: TransportOptions) {}

  push(event: RrwebEvent): void {
    this.events.push(event)
  }

  pushConsoleLog(entry: ConsoleLogEntry): void {
    this.consoleLogs.push(entry)
  }

  pushNetworkRequest(entry: NetworkRequestEntry): void {
    this.networkRequests.push(entry)
  }

  start(): void {
    this.timer = setInterval(() => {
      void this.flush()
    }, this.options.flushIntervalMs)

    window.addEventListener('visibilitychange', this.handleVisibilityChange)
    window.addEventListener('beforeunload', this.handleBeforeUnload)
  }

  stop(): void {
    if (this.timer !== null) {
      clearInterval(this.timer)
      this.timer = null
    }
    window.removeEventListener('visibilitychange', this.handleVisibilityChange)
    window.removeEventListener('beforeunload', this.handleBeforeUnload)
  }

  private readonly handleVisibilityChange = () => {
    if (document.visibilityState === 'hidden') {
      void this.flush()
    }
  }

  private readonly handleBeforeUnload = () => {
    void this.flush()
  }

  async flush(): Promise<void> {
    const isFirst = this.sequence === 0

    if (
      !isFirst &&
      this.events.length === 0 &&
      this.consoleLogs.length === 0 &&
      this.networkRequests.length === 0
    ) {
      return
    }

    const chunk: SessionChunk = {
      sessionId: this.options.sessionId,
      sequence: this.sequence++,
      events: this.events.splice(0),
      consoleLogs: this.consoleLogs.splice(0),
      networkRequests: this.networkRequests.splice(0),
      timestamp: Date.now(),
      ...(isFirst ? { init: this.options.initData } : {}),
    }

    try {
      const body = JSON.stringify(chunk)
      const res = await fetch(`${this.options.endpoint}/api/ingest/session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.options.apiKey,
        },
        body,
        // keepalive is capped at 64 KB by browsers; the first rrweb full-snapshot
        // easily exceeds that, so only set it for small payloads (delta events).
        keepalive: body.length < 60_000,
      })

      let errorMsg: string | undefined
      if (!res.ok) {
        try {
          const body = await res.json() as { error?: string }
          errorMsg = body.error ?? `HTTP ${res.status}`
        } catch {
          errorMsg = `HTTP ${res.status}`
        }
      }
      this.options.onFlush?.({
        status: res.status,
        ok: res.ok,
        ...(errorMsg !== undefined ? { error: errorMsg } : {}),
      })
    } catch (err) {
      this.options.onFlush?.({ status: 0, ok: false, error: String(err) })
    }
  }
}
