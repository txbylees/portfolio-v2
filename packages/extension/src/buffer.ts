export type EventType = 'rrweb' | 'console' | 'network'

export interface BufferedEvent {
  type: EventType
  timestamp: number
  data: unknown
}

export class RollingBuffer {
  private events: BufferedEvent[] = []
  private readonly maxDurationMs: number

  constructor(maxDurationMs = 60_000) {
    this.maxDurationMs = maxDurationMs
  }

  push(event: BufferedEvent) {
    this.events.push(event)
    this.prune()
  }

  flush(): BufferedEvent[] {
    return [...this.events]
  }

  private prune() {
    const cutoff = Date.now() - this.maxDurationMs
    let i = 0
    while (i < this.events.length && this.events[i].timestamp < cutoff) i++
    if (i > 0) this.events.splice(0, i)
  }
}
