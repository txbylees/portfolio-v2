const apiKeyInput = document.getElementById('api-key') as HTMLInputElement
const captureBtn = document.getElementById('capture-btn') as HTMLButtonElement
const saveBtn = document.getElementById('save-btn') as HTMLButtonElement
const badge = document.getElementById('badge') as HTMLSpanElement
const savedMsg = document.getElementById('saved-msg') as HTMLParagraphElement

// Load saved API key
chrome.storage.sync.get(['apiKey'], ({ apiKey }) => {
  if (apiKey) {
    apiKeyInput.value = apiKey
    setConnected(true)
  }
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
  if (!key) return

  await chrome.storage.sync.set({ apiKey: key })
  setConnected(true)
  savedMsg.textContent = 'Saved!'
  setTimeout(() => { savedMsg.textContent = '' }, 2000)
})
