export interface ConsoleLogEntry {
  level: 'error' | 'warn'
  message: string
  stack?: string
  timestamp: number
}

export interface NetworkRequestEntry {
  url: string
  method: string
  status: number
  duration: number
  timestamp: number
  requestBody?: string
  responseBody?: string
}

// Minimal rrweb event envelope — avoids importing rrweb in shared
export interface RrwebEvent {
  type: number
  data: unknown
  timestamp: number
}

export interface SessionInitPayload {
  url: string
  userAgent: string
  screenWidth: number
  screenHeight: number
  timestamp: number
}

export interface SessionChunk {
  sessionId: string
  sequence: number
  events: RrwebEvent[]
  consoleLogs: ConsoleLogEntry[]
  networkRequests: NetworkRequestEntry[]
  timestamp: number
  // Included only on sequence === 0 so the backend can create the session record
  init?: SessionInitPayload
}
