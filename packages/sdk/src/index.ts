import { Transport, type FlushResult } from './transport'
import { startRecording } from './recorder'
import { patchConsole } from './console'
import { patchNetwork } from './network'

export type { FlushResult } from './transport'

export interface ReprodConfig {
  apiKey: string
  endpoint?: string
  flushIntervalMs?: number
  onFlush?: (result: FlushResult) => void
}

export interface ReprodInstance {
  stop: () => void
}

export function init(config: ReprodConfig): ReprodInstance {
  const sessionId = crypto.randomUUID()

  const transport = new Transport({
    endpoint: config.endpoint ?? 'https://app.reprod.dev',
    apiKey: config.apiKey,
    sessionId,
    flushIntervalMs: config.flushIntervalMs ?? 5_000,
    initData: {
      url: window.location.href,
      userAgent: navigator.userAgent,
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
      timestamp: Date.now(),
    },
    ...(config.onFlush ? { onFlush: config.onFlush } : {}),
  })

  const stopRecording = startRecording(transport)
  const restoreConsole = patchConsole((entry) => transport.pushConsoleLog(entry))
  const restoreNetwork = patchNetwork((entry) => transport.pushNetworkRequest(entry))

  transport.start()

  return {
    stop() {
      stopRecording()
      restoreConsole()
      restoreNetwork()
      transport.stop()
    },
  }
}
