const DEFAULT_TIMEOUT_MS = 15_000

export async function fetchJSON(url, options = {}) {
  const { timeout = DEFAULT_TIMEOUT_MS, ...fetchOpts } = options
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeout)

  try {
    const res = await fetch(url, { ...fetchOpts, signal: ctrl.signal })
    const text = await res.text()
    let data = {}
    if (text) {
      try {
        data = JSON.parse(text)
      } catch {
        throw new Error(
          'API returned an invalid response. Run `npm run dev` and open http://localhost:5173 (not port 3001).'
        )
      }
    }
    return { res, data }
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error('Request timed out — is the API server running on port 3001?')
    }
    if (err instanceof Error && err.message.includes('invalid response')) throw err
    throw new Error('Cannot reach API server. Run `npm run dev` from the sql-gen-v2 folder.')
  } finally {
    clearTimeout(timer)
  }
}
