import { record } from 'rrweb'
import type { RrwebEvent } from '@reprod/shared'
import type { Transport } from './transport'

export function startRecording(transport: Transport): () => void {
  const stopFn = record({
    emit(event) {
      transport.push(event as RrwebEvent)
    },
    sampling: {
      mousemove: 50,
      mouseInteraction: true,
      scroll: 150,
      input: 'last',
    },
  })

  return stopFn ?? (() => undefined)
}
