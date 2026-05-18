import type { ConsoleLogEntry } from '@reprod/shared'

type ConsoleLevel = 'error' | 'warn'

export function patchConsole(
  onCapture: (entry: ConsoleLogEntry) => void,
): () => void {
  const originals: Record<ConsoleLevel, typeof console.error> = {
    error: console.error.bind(console),
    warn: console.warn.bind(console),
  }

  const levels: ConsoleLevel[] = ['error', 'warn']

  for (const level of levels) {
    console[level] = (...args: unknown[]) => {
      originals[level](...args)
      const message = args.map((a) => String(a)).join(' ')
      const error = args.find((a) => a instanceof Error)
      const entry: ConsoleLogEntry = { level, message, timestamp: Date.now() }
      if (error?.stack !== undefined) entry.stack = error.stack
      onCapture(entry)
    }
  }

  return () => {
    for (const level of levels) {
      console[level] = originals[level]
    }
  }
}
