/**
 * Shared helpers for turning a Bug's captured diagnostics (console errors and
 * failed network requests) into issue-tracker content. Used by the GitHub,
 * Jira and ClickUp export routes so an export is substantive even when no AI
 * report has been generated.
 */

export interface BugDiagnostics {
  consoleErrors: { message: string }[]
  networkFails: { method: string; url: string; status: number }[]
}

export function getDiagnostics(consoleLogs: unknown, networkFails: unknown): BugDiagnostics {
  const ce = Array.isArray(consoleLogs) ? (consoleLogs as Record<string, unknown>[]) : []
  const nf = Array.isArray(networkFails) ? (networkFails as Record<string, unknown>[]) : []
  return {
    consoleErrors: ce
      .filter((l) => l?.level === 'error' || l?.level === 'ERROR')
      .map((l) => ({ message: String(l.message ?? '') })),
    networkFails: nf.map((n) => ({
      method: String(n.method ?? ''),
      url: String(n.url ?? ''),
      status: Number(n.status ?? 0),
    })),
  }
}

/** Markdown block for GitHub / ClickUp. Returns '' when there's nothing to show. */
export function diagnosticsMarkdown(d: BugDiagnostics): string {
  const parts: string[] = []
  if (d.consoleErrors.length > 0) {
    parts.push('## Console Errors')
    parts.push(...d.consoleErrors.map((e) => `- \`${e.message}\``))
    parts.push('')
  }
  if (d.networkFails.length > 0) {
    parts.push('## Failed Requests')
    parts.push(...d.networkFails.map((n) => `- ${n.method} ${n.url} → ${n.status}`))
    parts.push('')
  }
  return parts.join('\n')
}
