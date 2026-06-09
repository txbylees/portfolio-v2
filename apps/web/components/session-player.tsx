'use client'

import { useEffect, useRef, useState } from 'react'

export interface ReplayEvent {
  type: number
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any
  timestamp: number
}

type ReplayerInstance = { play: (t?: number) => void; pause: (t?: number) => void }

export function SessionPlayer({ events, url }: { events: ReplayEvent[]; url?: string }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const replayerRef = useRef<ReplayerInstance | null>(null)
  const [playing, setPlaying] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [hoverPct, setHoverPct] = useState<number | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  // ref so seek/toggle closures always read the live value
  const playingRef = useRef(false)
  const elapsedRef = useRef(0)

  const durationMs =
    events.length > 1
      ? events[events.length - 1]!.timestamp - events[0]!.timestamp
      : 0

  const formatTime = (ms: number) => {
    const s = Math.floor(ms / 1000)
    const m = Math.floor(s / 60)
    return `${m}:${String(s % 60).padStart(2, '0')}`
  }

  // Keep elapsedRef in sync
  useEffect(() => { elapsedRef.current = elapsed }, [elapsed])

  function stopTick() {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }

  function startTickFrom(offsetMs: number) {
    stopTick()
    const base = Date.now() - offsetMs
    intervalRef.current = setInterval(() => {
      const next = Date.now() - base
      if (next >= durationMs) {
        // Reached the end — stop
        setElapsed(durationMs)
        elapsedRef.current = durationMs
        stopTick()
        setPlaying(false)
        playingRef.current = false
      } else {
        setElapsed(next)
        elapsedRef.current = next
      }
    }, 100)
  }

  // Seek to a specific offset (ms). Works whether playing or paused.
  function seekTo(targetMs: number) {
    const r = replayerRef.current
    if (!r || !loaded) return
    const clamped = Math.max(0, Math.min(targetMs, durationMs))
    stopTick()
    setElapsed(clamped)
    elapsedRef.current = clamped
    if (playingRef.current) {
      r.play(clamped)
      startTickFrom(clamped)
    } else {
      r.pause(clamped)
    }
  }

  function toggle() {
    const r = replayerRef.current
    if (!r) return
    if (playingRef.current) {
      r.pause()
      stopTick()
      setPlaying(false)
      playingRef.current = false
    } else {
      r.play(elapsedRef.current)
      startTickFrom(elapsedRef.current)
      setPlaying(true)
      playingRef.current = true
    }
  }

  function handleTimelineClick(e: React.MouseEvent<HTMLDivElement>) {
    if (!loaded) return
    const rect = e.currentTarget.getBoundingClientRect()
    const pct = Math.max(0, Math.min((e.clientX - rect.left) / rect.width, 1))
    seekTo(Math.round(pct * durationMs))
  }

  function handleTimelineMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect()
    setHoverPct(Math.max(0, Math.min((e.clientX - rect.left) / rect.width, 1)))
  }

  useEffect(() => {
    return () => stopTick()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
        const scale = container.clientWidth / recW
        wrapper.style.transformOrigin = 'top left'
        wrapper.style.transform = `scale(${scale})`
        // Resize container height to match scaled content, capped at 560px
        container.style.height = `${Math.min(Math.round(scale * recH), 560)}px`
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

  const progressPct = durationMs > 0 ? Math.min((elapsed / durationMs) * 100, 100) : 0

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      {/* Browser chrome header */}
      <div className="flex items-center gap-3 border-b border-gray-100 bg-gray-50 px-4 py-3">
        <div className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full bg-red-400/70" />
          <span className="h-3 w-3 rounded-full bg-yellow-400/70" />
          <span className="h-3 w-3 rounded-full bg-green-400/70" />
        </div>
        {url && (
          <div className="flex flex-1 items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-1.5">
            <svg className="h-3.5 w-3.5 shrink-0 text-gray-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
            </svg>
            <span className="min-w-0 flex-1 truncate text-xs text-gray-500">{url}</span>
          </div>
        )}
        <span className="shrink-0 rounded-md bg-red-50 px-2 py-1 text-[11px] font-medium text-red-600">
          ● REC
        </span>
      </div>

      {/* Replay viewport */}
      <div
        ref={containerRef}
        className="relative w-full overflow-hidden bg-gray-950"
        style={{ minHeight: 200 }}
      />

      {/* Controls bar */}
      <div className="border-t border-gray-100 bg-gray-50 px-4 py-3">

        {/* ── Scrubber timeline ── */}
        <div
          role="slider"
          aria-valuemin={0}
          aria-valuemax={durationMs}
          aria-valuenow={elapsed}
          aria-label="Seek timeline"
          className={`group relative mb-4 h-4 w-full ${loaded ? 'cursor-pointer' : 'cursor-default'}`}
          onClick={handleTimelineClick}
          onMouseMove={handleTimelineMouseMove}
          onMouseLeave={() => setHoverPct(null)}
        >
          {/* Track background */}
          <div className="absolute inset-x-0 top-1/2 h-2 -translate-y-1/2 rounded-full bg-gray-300">
            {/* Hover ghost fill */}
            {hoverPct !== null && loaded && (
              <div
                className="pointer-events-none absolute inset-y-0 left-0 rounded-full bg-green-300/60"
                style={{ width: `${hoverPct * 100}%` }}
              />
            )}
            {/* Played fill */}
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-green-600"
              style={{ width: `${progressPct}%` }}
            />
          </div>

          {/* Thumb */}
          <div
            className="pointer-events-none absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-green-600 shadow-md opacity-60 transition-opacity group-hover:opacity-100"
            style={{ left: `${progressPct}%` }}
          />

          {/* Hover timestamp tooltip */}
          {hoverPct !== null && loaded && (
            <div
              className="pointer-events-none absolute -top-7 -translate-x-1/2 whitespace-nowrap rounded bg-gray-900 px-1.5 py-0.5 font-mono text-[10px] text-white shadow"
              style={{ left: `${hoverPct * 100}%` }}
            >
              {formatTime(Math.round(hoverPct * durationMs))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Play/Pause */}
          <button
            onClick={toggle}
            disabled={!loaded}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-green-600 text-white shadow-sm transition-colors hover:bg-green-500 disabled:opacity-40"
          >
            {playing ? (
              <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
                <rect x="6" y="4" width="4" height="16" rx="1" />
                <rect x="14" y="4" width="4" height="16" rx="1" />
              </svg>
            ) : (
              <svg className="h-3.5 w-3.5 translate-x-[1px]" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>

          {/* Time readout */}
          <span className="font-mono text-xs tabular-nums text-gray-500">
            {formatTime(elapsed)} / {formatTime(durationMs)}
          </span>

          <div className="flex-1" />

          {/* Right-side status */}
          {!loaded && events.length > 0 && (
            <span className="flex items-center gap-1.5 text-xs text-gray-400">
              <svg className="h-3.5 w-3.5 animate-spin" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" d="M12 3v3m0 12v3M3 12h3m12 0h3" />
              </svg>
              Loading…
            </span>
          )}
          {events.length === 0 && (
            <span className="text-xs text-gray-400">No events recorded</span>
          )}
          {loaded && (
            <span className="flex items-center gap-1.5 text-xs text-gray-400">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
              {events.length.toLocaleString()} events
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
