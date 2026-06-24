'use client'

import { useState, useRef, useEffect } from 'react'
import type { BugStatus } from '@prisma/client'

interface Message {
  role: 'USER' | 'ASSISTANT'
  content: string
  createdAt: Date
}

interface BugReport {
  title: string
  summary: string
  stepsToReproduce: string[]
  expectedBehaviour: string
  actualBehaviour: string
  suspectedCause: string | null
  severity: string
}

interface BugChatProps {
  aiEnabled: boolean
  bugId: string
  initialMessages: Message[]
  initialReport: BugReport | null
  initialStatus: BugStatus
  playwrightScript: string | null
  screenshotDataUrl: string | null
  pageUrl: string
  userAgent: string
  consoleLogs: Array<{ level: string; message: string; stack?: string }>
  networkFails: Array<{ url: string; method: string; status: number; duration: number }>
  screenWidth: number
  screenHeight: number
  capturedAt: Date
}

const SEVERITY_COLORS: Record<string, string> = {
  P1: 'bg-red-100 text-red-700',
  P2: 'bg-orange-100 text-orange-700',
  P3: 'bg-yellow-100 text-yellow-700',
  P4: 'bg-gray-100 text-gray-600',
}

const STATUS_LABELS: Record<BugStatus, string> = {
  OPEN: 'Open',
  IN_PROGRESS: 'In Progress',
  FIXED: 'Fixed',
  CLOSED: 'Closed',
  DUPLICATE: 'Duplicate',
}

const STATUS_COLORS: Record<BugStatus, string> = {
  OPEN: 'bg-red-100 text-red-700',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  FIXED: 'bg-green-100 text-green-700',
  CLOSED: 'bg-gray-100 text-gray-600',
  DUPLICATE: 'bg-purple-100 text-purple-700',
}

export default function BugChat({
  aiEnabled,
  bugId,
  initialMessages,
  initialReport,
  initialStatus,
  playwrightScript: initialScript,
  screenshotDataUrl,
  pageUrl,
  userAgent,
  consoleLogs,
  networkFails,
  screenWidth,
  screenHeight,
  capturedAt,
}: BugChatProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [report, setReport] = useState<BugReport | null>(initialReport)
  const [playwrightScript, setPlaywrightScript] = useState<string | null>(initialScript)
  const [status, setStatus] = useState<BugStatus>(initialStatus)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [chatError, setChatError] = useState<string | null>(null)
  const [ticketTimedOut, setTicketTimedOut] = useState(false)
  const [showScreenshot, setShowScreenshot] = useState(false)
  const [showScript, setShowScript] = useState(false)
  const [exportModal, setExportModal] = useState<'github' | 'jira' | 'clickup' | null>(null)
  const [exportLoading, setExportLoading] = useState(false)
  const [exportResult, setExportResult] = useState<{ url: string; label: string } | null>(null)
  const [copied, setCopied] = useState(false)
  const [statusSaving, setStatusSaving] = useState(false)
  const [statusSaved, setStatusSaved] = useState(false)
  const [formattedDate, setFormattedDate] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setFormattedDate(new Date(capturedAt).toLocaleString())
  }, [capturedAt])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Poll for ticket if not yet generated and user has sent a message
  useEffect(() => {
    if (report) return
    const hasUserMessage = messages.some((m) => m.role === 'USER')
    if (!hasUserMessage) return

    let attempts = 0
    const poll = setInterval(async () => {
      attempts += 1
      if (attempts > 20) {
        clearInterval(poll)
        setTicketTimedOut(true)
        return
      }
      const res = await fetch(`/api/bugs/${bugId}/ticket`)
      if (res.ok) {
        const data = (await res.json()) as {
          report: BugReport | null
          playwrightScript: string | null
        }
        if (data.report) {
          setReport(data.report)
          setPlaywrightScript(data.playwrightScript)
          setTicketTimedOut(false)
          clearInterval(poll)
        }
      }
    }, 3000)

    return () => clearInterval(poll)
  }, [bugId, report, messages])

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim() || sending) return

    const userMessage = input.trim()
    setInput('')
    setSending(true)
    setChatError(null)

    const optimistic: Message = { role: 'USER', content: userMessage, createdAt: new Date() }
    setMessages((prev) => [...prev, optimistic])

    try {
      const res = await fetch(`/api/bugs/${bugId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage }),
      })

      if (res.ok) {
        const { message } = (await res.json()) as { message: string }
        setMessages((prev) => [
          ...prev,
          { role: 'ASSISTANT', content: message, createdAt: new Date() },
        ])
      } else {
        setChatError(
          'The assistant couldn’t reply — your message was saved, but the AI service is unavailable right now.'
        )
      }
    } catch {
      setChatError('Couldn’t reach the server. Check your connection and try again.')
    } finally {
      setSending(false)
    }
  }

  async function updateStatus(newStatus: BugStatus) {
    setStatus(newStatus)
    setStatusSaving(true)
    setStatusSaved(false)
    await fetch(`/api/bugs/${bugId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
    setStatusSaving(false)
    setStatusSaved(true)
    setTimeout(() => setStatusSaved(false), 2000)
  }

  async function handleExport(platform: 'github' | 'jira' | 'clickup', formData: FormData) {
    setExportLoading(true)
    try {
      let body: Record<string, string> = {}
      if (platform === 'github') {
        body = {
          owner: formData.get('owner') as string,
          repo: formData.get('repo') as string,
          token: formData.get('token') as string,
        }
      } else if (platform === 'jira') {
        body = {
          domain: formData.get('domain') as string,
          email: formData.get('email') as string,
          apiToken: formData.get('apiToken') as string,
          projectKey: formData.get('projectKey') as string,
        }
      } else {
        body = {
          apiToken: formData.get('apiToken') as string,
          listId: formData.get('listId') as string,
        }
      }

      const res = await fetch(`/api/bugs/${bugId}/export/${platform}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const data = (await res.json()) as { issueUrl?: string; error?: string }
      if (data.issueUrl) {
        const labels = { github: 'GitHub', jira: 'Jira', clickup: 'ClickUp' }
        setExportResult({ url: data.issueUrl, label: labels[platform] })
        setExportModal(null)
      } else {
        alert(data.error ?? 'Export failed')
      }
    } finally {
      setExportLoading(false)
    }
  }

  // ── Capture-only view when the AI layer is disabled ──
  if (!aiEnabled) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col gap-4">
        <StatusCard
          status={status}
          saving={statusSaving}
          saved={statusSaved}
          onUpdate={updateStatus}
        />
        {screenshotDataUrl && (
          <ScreenshotCard
            screenshotDataUrl={screenshotDataUrl}
            open={showScreenshot}
            onToggle={() => setShowScreenshot((v) => !v)}
          />
        )}
        <TechnicalDetails
          pageUrl={pageUrl}
          userAgent={userAgent}
          screenWidth={screenWidth}
          screenHeight={screenHeight}
          formattedDate={formattedDate}
          consoleLogs={consoleLogs}
          networkFails={networkFails}
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      {/* ── Left column: screenshot + chat ── */}
      <div className="flex flex-1 flex-col gap-4 min-w-0">
        {/* Screenshot */}
        {screenshotDataUrl && (
          <ScreenshotCard
            screenshotDataUrl={screenshotDataUrl}
            open={showScreenshot}
            onToggle={() => setShowScreenshot((v) => !v)}
          />
        )}

        {/* Chat */}
        <div className="flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white">
          <div className="border-b border-gray-100 px-4 py-3">
            <p className="text-sm font-medium text-gray-700">AI Assistant</p>
            <p className="text-xs text-gray-400">Describe what happened — the ticket generates automatically</p>
          </div>

          <div className="flex max-h-[420px] flex-col gap-3 overflow-y-auto p-4">
            {messages.length === 0 && (
              <div className="rounded-lg bg-gray-50 px-4 py-3 text-center">
                <p className="text-sm text-gray-500">
                  Automatic analysis isn’t available for this bug.
                </p>
                <p className="mt-0.5 text-xs text-gray-400">
                  Describe what you were testing and what you expected to happen below.
                </p>
              </div>
            )}
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === 'USER' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                    msg.role === 'USER'
                      ? 'bg-green-800 text-white rounded-br-sm'
                      : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {sending && (
              <div className="flex justify-start">
                <div className="rounded-2xl rounded-bl-sm bg-gray-100 px-4 py-2.5 text-sm text-gray-400">
                  Thinking…
                </div>
              </div>
            )}
            {chatError && (
              <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5">
                <svg className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                </svg>
                <p className="text-xs leading-relaxed text-amber-700">{chatError}</p>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={sendMessage} className="flex gap-2 border-t border-gray-100 p-3">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Describe what you were testing…"
              disabled={sending}
              className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={sending || !input.trim()}
              className="rounded-lg bg-green-800 px-4 py-2 text-sm font-medium text-white hover:bg-green-900 disabled:opacity-40"
            >
              Send
            </button>
          </form>
        </div>
      </div>

      {/* ── Right column: ticket + details + export ── */}
      <div className="flex w-full flex-col gap-4 lg:w-80 xl:w-96 shrink-0">
        {/* Status */}
        <StatusCard
          status={status}
          saving={statusSaving}
          saved={statusSaved}
          onUpdate={updateStatus}
        />

        {/* Generated Ticket */}
        {report ? (
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
            <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
              <p className="text-sm font-medium text-gray-700">Bug Report</p>
              <span className={`rounded-md px-2 py-0.5 text-xs font-bold ${SEVERITY_COLORS[report.severity] ?? SEVERITY_COLORS.P3}`}>
                {report.severity}
              </span>
            </div>
            <div className="space-y-4 p-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Title</p>
                <p className="mt-1 text-sm font-semibold text-gray-900">{report.title}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Summary</p>
                <p className="mt-1 text-sm text-gray-700">{report.summary}</p>
              </div>
              {report.stepsToReproduce.length > 0 && (
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Steps to Reproduce</p>
                  <ol className="mt-1 space-y-1 text-sm text-gray-700">
                    {report.stepsToReproduce.map((s, i) => (
                      <li key={i} className="flex gap-2">
                        <span className="shrink-0 text-gray-400">{i + 1}.</span>
                        <span>{s}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Expected</p>
                  <p className="mt-1 text-sm text-gray-700">{report.expectedBehaviour}</p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Actual</p>
                  <p className="mt-1 text-sm text-gray-700">{report.actualBehaviour}</p>
                </div>
              </div>
              {report.suspectedCause && (
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Suspected Cause</p>
                  <p className="mt-1 text-sm text-gray-700">{report.suspectedCause}</p>
                </div>
              )}
            </div>

            {/* Export */}
            <div className="border-t border-gray-100 p-3">
              {exportResult ? (
                <a
                  href={exportResult.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-green-50 px-3 py-2 text-sm font-medium text-green-700 hover:bg-green-100"
                >
                  ✓ Opened in {exportResult.label} →
                </a>
              ) : (
                <div className="flex gap-2">
                  <span className="text-xs font-medium text-gray-500 flex items-center">Export:</span>
                  {(['github', 'jira', 'clickup'] as const).map((p) => (
                    <button
                      key={p}
                      onClick={() => setExportModal(p)}
                      className="flex-1 rounded-md border border-gray-200 px-2 py-1.5 text-xs font-medium text-gray-600 hover:border-gray-300 hover:text-gray-900 capitalize"
                    >
                      {p === 'github' ? 'GitHub' : p === 'clickup' ? 'ClickUp' : 'Jira'}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-gray-200 bg-white p-6 text-center">
            {ticketTimedOut ? (
              <>
                <p className="text-sm font-medium text-gray-600">Report not generated</p>
                <p className="mt-1 text-xs text-gray-400">
                  The AI service is unavailable right now — your bug and notes are saved, so you can retry later.
                </p>
              </>
            ) : messages.some((m) => m.role === 'USER') ? (
              <>
                <div className="mx-auto mb-2 h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                <p className="text-sm text-gray-500">Generating bug report…</p>
              </>
            ) : (
              <>
                <p className="text-sm font-medium text-gray-600">Ticket generates automatically</p>
                <p className="mt-1 text-xs text-gray-400">Reply to the assistant to begin</p>
              </>
            )}
          </div>
        )}

        {/* Playwright Script */}
        {playwrightScript && (
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
            <button
              onClick={() => setShowScript((v) => !v)}
              className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <span>Playwright Script</span>
              <span className="text-gray-400">{showScript ? '▲' : '▼'}</span>
            </button>
            {showScript && (
              <div className="border-t border-gray-100">
                <div className="flex justify-end px-3 pt-2">
                  <button
                    onClick={async () => {
                      await navigator.clipboard.writeText(playwrightScript)
                      setCopied(true)
                      setTimeout(() => setCopied(false), 2000)
                    }}
                    className="text-xs text-blue-600 hover:text-blue-800"
                  >
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <pre className="overflow-x-auto p-4 pt-1 text-xs text-gray-700 leading-relaxed">
                  <code>{playwrightScript}</code>
                </pre>
              </div>
            )}
          </div>
        )}

        {/* Technical Details */}
        <TechnicalDetails
          pageUrl={pageUrl}
          userAgent={userAgent}
          screenWidth={screenWidth}
          screenHeight={screenHeight}
          formattedDate={formattedDate}
          consoleLogs={consoleLogs}
          networkFails={networkFails}
        />
      </div>

      {/* ── Export modals ── */}
      {exportModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => setExportModal(null)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="mb-4 text-base font-semibold text-gray-900">
              Export to {exportModal === 'github' ? 'GitHub Issues' : exportModal === 'jira' ? 'Jira' : 'ClickUp'}
            </h3>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleExport(exportModal, new FormData(e.currentTarget))
              }}
              className="space-y-3"
            >
              {exportModal === 'github' && (
                <>
                  <Field name="owner" label="Owner / Org" placeholder="facebook" />
                  <Field name="repo" label="Repository" placeholder="react" />
                  <Field name="token" label="Personal Access Token" type="password" placeholder="ghp_..." />
                </>
              )}
              {exportModal === 'jira' && (
                <>
                  <Field name="domain" label="Domain" placeholder="mycompany.atlassian.net" />
                  <Field name="email" label="Email" type="email" placeholder="you@company.com" />
                  <Field name="apiToken" label="API Token" type="password" placeholder="••••••" />
                  <Field name="projectKey" label="Project Key" placeholder="QA" />
                </>
              )}
              {exportModal === 'clickup' && (
                <>
                  <Field name="apiToken" label="API Token" type="password" placeholder="pk_..." />
                  <Field name="listId" label="List ID" placeholder="123456789" />
                </>
              )}
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setExportModal(null)}
                  className="flex-1 rounded-lg border border-gray-200 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={exportLoading}
                  className="flex-1 rounded-lg bg-green-800 py-2 text-sm font-medium text-white hover:bg-green-900 disabled:opacity-50"
                >
                  {exportLoading ? 'Creating…' : 'Create Issue'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function StatusCard({
  status,
  saving,
  saved,
  onUpdate,
}: {
  status: BugStatus
  saving: boolean
  saved: boolean
  onUpdate: (s: BugStatus) => void
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white px-4 py-4">
      <div className="mb-2.5 flex items-center justify-between">
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Status</span>
        {saving && <span className="text-xs text-gray-400">Saving…</span>}
        {saved && (
          <span className="flex items-center gap-1 text-xs text-green-600">
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
            </svg>
            Saved
          </span>
        )}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {(Object.entries(STATUS_LABELS) as [BugStatus, string][]).map(([val, label]) => (
          <button
            key={val}
            onClick={() => onUpdate(val)}
            className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-all ${
              val === status
                ? `${STATUS_COLORS[val]} ring-2 ring-offset-1 ring-current`
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}

function ScreenshotCard({
  screenshotDataUrl,
  open,
  onToggle,
}: {
  screenshotDataUrl: string
  open: boolean
  onToggle: () => void
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
      >
        <span>Screenshot</span>
        <span className="text-gray-400">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="border-t border-gray-100 p-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={screenshotDataUrl}
            alt="Bug screenshot"
            className="w-full rounded-lg border border-gray-100 shadow-sm"
          />
        </div>
      )}
    </div>
  )
}

function TechnicalDetails({
  pageUrl,
  userAgent,
  screenWidth,
  screenHeight,
  formattedDate,
  consoleLogs,
  networkFails,
}: {
  pageUrl: string
  userAgent: string
  screenWidth: number
  screenHeight: number
  formattedDate: string
  consoleLogs: Array<{ level: string; message: string; stack?: string }>
  networkFails: Array<{ url: string; method: string; status: number; duration: number }>
}) {
  const consolErrors = consoleLogs.filter((l) => l.level === 'error' || l.level === 'ERROR')
  const browserStr =
    userAgent.match(/Chrome\/([\d.]+)/)?.[0] ??
    userAgent.match(/Firefox\/([\d.]+)/)?.[0] ??
    userAgent.slice(0, 60)

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      <div className="border-b border-gray-100 px-4 py-3">
        <p className="text-sm font-medium text-gray-700">Technical Details</p>
      </div>
      <div className="space-y-3 p-4 text-xs text-gray-600">
        <div className="flex gap-2">
          <span className="font-medium text-gray-400 w-16 shrink-0">URL</span>
          <span className="break-all">{pageUrl}</span>
        </div>
        <div className="flex gap-2">
          <span className="font-medium text-gray-400 w-16 shrink-0">Browser</span>
          <span className="break-all">{browserStr}</span>
        </div>
        <div className="flex gap-2">
          <span className="font-medium text-gray-400 w-16 shrink-0">Screen</span>
          <span>{screenWidth}×{screenHeight}</span>
        </div>
        <div className="flex gap-2">
          <span className="font-medium text-gray-400 w-16 shrink-0">Captured</span>
          <span>{formattedDate}</span>
        </div>
        {consolErrors.length > 0 && (
          <div>
            <p className="mb-1 font-medium text-red-500">
              {consolErrors.length} console error{consolErrors.length !== 1 ? 's' : ''}
            </p>
            <div className="space-y-1">
              {consolErrors.slice(0, 3).map((e, i) => (
                <p key={i} className="truncate rounded bg-red-50 px-2 py-1 text-red-700">
                  {e.message}
                </p>
              ))}
              {consolErrors.length > 3 && (
                <p className="text-gray-400">+{consolErrors.length - 3} more</p>
              )}
            </div>
          </div>
        )}
        {networkFails.length > 0 && (
          <div>
            <p className="mb-1 font-medium text-amber-600">
              {networkFails.length} failed request{networkFails.length !== 1 ? 's' : ''}
            </p>
            <div className="space-y-1">
              {networkFails.slice(0, 3).map((n, i) => (
                <p key={i} className="truncate rounded bg-amber-50 px-2 py-1 text-amber-700">
                  {n.method} {n.url.split('/').slice(-2).join('/')} → {n.status}
                </p>
              ))}
              {networkFails.length > 3 && (
                <p className="text-gray-400">+{networkFails.length - 3} more</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function Field({
  name,
  label,
  placeholder,
  type = 'text',
}: {
  name: string
  label: string
  placeholder?: string
  type?: string
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-gray-600">{label}</label>
      <input
        name={name}
        type={type}
        placeholder={placeholder}
        required
        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-400"
      />
    </div>
  )
}
