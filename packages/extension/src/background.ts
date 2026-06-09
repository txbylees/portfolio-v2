const DEFAULT_ENDPOINT = 'http://localhost:3000'

chrome.commands.onCommand.addListener((command) => {
  console.log('[reprod] command received:', command)
  if (command === 'capture-bug') triggerCapture()
})

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  console.log('[reprod] message received:', msg)
  if (msg.type === 'TRIGGER_CAPTURE') {
    triggerCapture()
    sendResponse({ ok: true })
  }
})

async function triggerCapture() {
  console.log('[reprod] triggerCapture started')

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  console.log('[reprod] active tab:', tab?.id, tab?.url)

  if (!tab?.id) {
    console.warn('[reprod] no active tab found')
    return
  }

  const { apiKey, endpoint } = await chrome.storage.sync.get(['apiKey', 'endpoint'])
  const base: string = endpoint ?? DEFAULT_ENDPOINT
  console.log('[reprod] apiKey present:', !!apiKey, 'endpoint:', base)

  if (!apiKey) {
    console.warn('[reprod] no API key configured')
    chrome.notifications.create('no-key', {
      type: 'basic',
      iconUrl: '',
      title: 'Reprod',
      message: 'Add your API key in the Reprod extension popup first.',
    })
    return
  }

  let captured: { events: unknown[]; env: Record<string, unknown> } | null = null
  try {
    captured = await chrome.tabs.sendMessage(tab.id, { type: 'CAPTURE' })
    console.log('[reprod] captured via existing script, events:', (captured?.events ?? []).length)
  } catch {
    console.warn('[reprod] content script not found — injecting dynamically')
    try {
      await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['content.js'] })
      await new Promise((r) => setTimeout(r, 300))
      captured = await chrome.tabs.sendMessage(tab.id, { type: 'CAPTURE' })
      console.log('[reprod] captured via dynamic inject, events:', (captured?.events ?? []).length)
    } catch (injectErr) {
      console.error('[reprod] dynamic injection failed:', injectErr)
      chrome.notifications.create('capture-fail', {
        type: 'basic',
        iconUrl: '',
        title: 'Reprod',
        message: 'Could not capture this page. Try refreshing and capturing again.',
      })
      return
    }
  }

  let screenshot: string | null = null
  try {
    screenshot = await chrome.tabs.captureVisibleTab({ format: 'png' })
    console.log('[reprod] screenshot captured, length:', screenshot?.length)
  } catch (err) {
    console.warn('[reprod] screenshot failed (non-fatal):', err)
  }

  try {
    console.log('[reprod] sending to:', `${base}/api/bugs/ingest`)
    const res = await fetch(`${base}/api/bugs/ingest`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        events: captured!.events,
        env: captured!.env,
        screenshot,
      }),
    })

    console.log('[reprod] ingest response status:', res.status)

    if (!res.ok) {
      const text = await res.text()
      console.error('[reprod] ingest failed:', text)
      throw new Error(`HTTP ${res.status}`)
    }

    const { bugId } = (await res.json()) as { bugId: string }
    console.log('[reprod] bug created:', bugId)
    chrome.tabs.create({ url: `${base}/bugs/${bugId}` })
  } catch (err) {
    console.error('[reprod] send failed:', err)
    chrome.notifications.create('send-fail', {
      type: 'basic',
      iconUrl: '',
      title: 'Reprod — Capture failed',
      message: 'Could not send bug to Reprod. Check your API key and connection.',
    })
  }
}
