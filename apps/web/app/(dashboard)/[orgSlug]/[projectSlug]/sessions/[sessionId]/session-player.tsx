'use client'

import { useEffect, useRef, useState } from 'react'

export interface ReplayEvent {
  type: number
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any
  timestamp: number
}

export function SessionPlayer({ events }: { events: ReplayEvent[] }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const replayerRef = useRef<{ play: (t?: number) => void; pause: (t?: number) => void } | null>(null)
  const [playing, setPlaying] = useState(false)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const el = containerRef.current
    if (!el || events.length === 0) return
    let cancelled = false

    void import('rrweb').then(({ Replayer }) => {
      if (cancelled || !containerRef.current) return
      const container = containerRef.current

      // rrweb meta event (type 4) carries the recorded viewport dimensions
      const metaData = events.find((e) => e.type === 4)?.data as
        | { width?: number; height?: number }
        | undefined
      const recW = metaData?.width ?? 1280
      const recH = metaData?.height ?? 800

      const replayer = new Replayer(events, {
        root: container,
        speed: 1,
        showWarning: false,
        showDebug: false,
        mouseTail: false,
      })

      // Replayer creates .replayer-wrapper synchronously inside the root.
      // Scale it so the recorded viewport fits our fixed-height container.
      const wrapper = container.querySelector<HTMLElement>('.replayer-wrapper')
      if (wrapper) {
        const scale = Math.min(container.clientWidth / recW, container.clientHeight / recH)
        wrapper.style.transformOrigin = 'top left'
        wrapper.style.transform = `scale(${scale})`
      }

      replayerRef.current = replayer
      setLoaded(true)
    })

    return () => {
      cancelled = true
      replayerRef.current?.pause()
      replayerRef.current = null
      if (el) el.innerHTML = ''
    }
  }, [events])

  function toggle() {
    const r = replayerRef.current
    if (!r) return
    if (playing) {
      r.pause()
    } else {
      r.play()
    }
    setPlaying((p) => !p)
  }

  return (
    <div className="space-y-3">
      <div
        ref={containerRef}
        className="relative h-[560px] w-full overflow-hidden rounded-xl border border-gray-800 bg-gray-950"
      />
      <div className="flex items-center gap-3">
        <button
          onClick={toggle}
          disabled={!loaded}
          className="rounded-lg border border-gray-700 px-5 py-2 text-sm text-gray-300 hover:border-gray-500 hover:text-white disabled:opacity-40"
        >
          {playing ? 'Pause' : 'Play'}
        </button>
        {!loaded && events.length > 0 && (
          <span className="text-xs text-gray-500">Loading player…</span>
        )}
        {events.length === 0 && (
          <span className="text-xs text-gray-500">No events to replay</span>
        )}
      </div>
    </div>
  )
}
