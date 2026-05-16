const BASE = 'https://generativelanguage.googleapis.com/v1beta/models'

// Deprecated 2.0-flash often has free-tier limit 0; prefer 2.5 models.
const DEFAULT_MODELS = [
  'gemini-2.5-flash-lite',
  'gemini-2.5-flash',
  'gemini-2.0-flash-lite',
]

/** Avoid 2.5-flash burning the whole token budget on internal "thinking" with no SQL output. */
export function withGenerationDefaults(body) {
  const cfg = body.generationConfig || {}
  return {
    ...body,
    generationConfig: {
      ...cfg,
      thinkingConfig: {
        thinkingBudget: 0,
        ...cfg.thinkingConfig,
      },
    },
  }
}

export function getModelList() {
  const fromEnv = process.env.GEMINI_MODEL?.split(',').map(s => s.trim()).filter(Boolean)
  return fromEnv?.length ? fromEnv : DEFAULT_MODELS
}

function streamUrl(model) {
  return `${BASE}/${model}:streamGenerateContent?alt=sse&key=${process.env.GOOGLE_API_KEY}`
}

function generateUrl(model) {
  return `${BASE}/${model}:generateContent?key=${process.env.GOOGLE_API_KEY}`
}

export function formatGeminiError(status, bodyText, model) {
  let message = ''
  let retryIn = ''

  try {
    const j = JSON.parse(bodyText)
    message = j?.error?.message || ''
    const retryDetail = j?.error?.details?.find(d =>
      String(d['@type'] || '').includes('RetryInfo')
    )
    if (retryDetail?.retryDelay) retryIn = String(retryDetail.retryDelay).replace(/s$/, ' seconds')
  } catch {
    message = bodyText?.slice(0, 200) || ''
  }

  if (status === 429) {
    const hint = retryIn ? ` Try again in about ${retryIn}.` : ' Wait a minute and try again.'
    if (/quota|limit:\s*0/i.test(message)) {
      return (
        `Google AI free-tier quota is exhausted for "${model}".` +
        hint +
        ' Add GEMINI_MODEL=gemini-2.5-flash to .env or create a new API key at aistudio.google.com.'
      )
    }
    return `Google AI rate limit hit.${hint}`
  }

  if (status === 404) {
    return `Model "${model}" is not available for your API key. Set GEMINI_MODEL in .env (e.g. gemini-2.5-flash).`
  }

  if (status === 403) {
    return 'Google API key is invalid or lacks permission. Check GOOGLE_API_KEY in .env.'
  }

  const short = message.split('\n')[0]?.slice(0, 240)
  return short || `Gemini API error (${status})`
}

function shouldTryNextModel(status) {
  return status === 429 || status === 404 || status === 503
}

/** Stream generate; tries each model in GEMINI_MODEL / default list until one succeeds. */
export async function geminiStreamGenerate(body) {
  const models = getModelList()
  let lastError = 'No Gemini models configured.'

  for (const model of models) {
    const res = await fetch(streamUrl(model), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(withGenerationDefaults(body)),
    })

    if (res.ok) {
      console.log('[gemini] using model:', model)
      return { res, model }
    }

    const errBody = await res.text()
    lastError = formatGeminiError(res.status, errBody, model)
    console.warn(`[gemini] ${model} failed (${res.status}):`, lastError)

    if (!shouldTryNextModel(res.status)) break
  }

  throw new Error(lastError)
}

/** One-shot generate with the same fallback list. */
export async function geminiGenerate(body) {
  const models = getModelList()
  let lastError = 'No Gemini models configured.'

  for (const model of models) {
    const res = await fetch(generateUrl(model), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(withGenerationDefaults(body)),
    })

    const data = await res.json().catch(() => ({}))

    if (res.ok) {
      console.log('[gemini] using model:', model)
      return { data, model }
    }

    lastError = formatGeminiError(res.status, JSON.stringify(data), model)
    console.warn(`[gemini] ${model} failed (${res.status}):`, lastError)

    if (!shouldTryNextModel(res.status)) break
  }

  throw new Error(lastError)
}
