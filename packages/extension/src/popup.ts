const apiKeyInput = document.getElementById('api-key') as HTMLInputElement
const endpointInput = document.getElementById('endpoint') as HTMLInputElement
const captureBtn = document.getElementById('capture-btn') as HTMLButtonElement
const saveBtn = document.getElementById('save-btn') as HTMLButtonElement
const badge = document.getElementById('badge') as HTMLSpanElement
const savedMsg = document.getElementById('saved-msg') as HTMLParagraphElement

chrome.storage.sync.get(['apiKey', 'endpoint'], ({ apiKey, endpoint }) => {
  if (apiKey) {
    apiKeyInput.value = apiKey
    setConnected(true)
  }
  if (endpoint) endpointInput.value = endpoint
})

function setConnected(connected: boolean) {
  if (connected) {
    badge.textContent = 'Connected'
    badge.className = 'badge'
    captureBtn.disabled = false
  } else {
    badge.textContent = 'Not configured'
    badge.className = 'badge disconnected'
    captureBtn.disabled = true
  }
}

captureBtn.addEventListener('click', () => {
  chrome.runtime.sendMessage({ type: 'TRIGGER_CAPTURE' })
  window.close()
})

saveBtn.addEventListener('click', async () => {
  const key = apiKeyInput.value.trim()
  if (!key) {
    savedMsg.textContent = 'Enter your API key first'
    savedMsg.style.color = '#dc2626'
    setTimeout(() => { savedMsg.textContent = ''; savedMsg.style.color = '' }, 2000)
    return
  }

  const endpoint = endpointInput.value.trim().replace(/\/+$/, '')
  await chrome.storage.sync.set({ apiKey: key, endpoint: endpoint || null })
  setConnected(true)
  savedMsg.textContent = 'Saved!'
  setTimeout(() => { savedMsg.textContent = '' }, 2000)
})
