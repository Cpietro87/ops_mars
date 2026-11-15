const DEFAULT_API_BASE_URL = 'http://127.0.0.1:8000'

export const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL
).replace(/\/+$/, '')

export class MarsApiError extends Error {
  constructor(message, { code = 'api_error', status = 0 } = {}) {
    super(message)
    this.name = 'MarsApiError'
    this.code = code
    this.status = status
  }
}

async function request(path, { signal, method = 'GET', body } = {}) {
  const headers = { Accept: 'application/json' }

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json'
  }

  let response

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
    })
  } catch (error) {
    if (error.name === 'AbortError') {
      throw error
    }
    throw new MarsApiError(
      'Could not reach the MARS OPS API. Check that the backend is running.',
      { code: 'network_error' },
    )
  }

  let payload
  try {
    payload = await response.json()
  } catch {
    payload = null
  }

  if (!response.ok || payload?.success === false) {
    throw new MarsApiError(
      payload?.error?.message ??
        `MARS OPS API request failed with status ${response.status}.`,
      {
        code: payload?.error?.code ?? 'api_error',
        status: response.status,
      },
    )
  }

  return payload?.data
}

export function fetchMarsLayers({ signal } = {}) {
  return request('/api/v1/mars/layers', { signal })
}

export function fetchMarsLayerCapabilities(
  layerId,
  { live = false, signal } = {},
) {
  const query = live ? '?live=true' : ''
  return request(
    `/api/v1/mars/layers/${encodeURIComponent(layerId)}/capabilities${query}`,
    { signal },
  )
}

export function fetchJezeroLocation({ signal } = {}) {
  return request('/api/v1/mars/locations/jezero', { signal })
}

export function fetchAeolianDatasets({ signal } = {}) {
  return request('/api/v1/aeolian/datasets', { signal })
}

export function analyzeAeolian(payload, { signal } = {}) {
  return request('/api/v1/aeolian/analyze', {
    method: 'POST',
    body: payload,
    signal,
  })
}

export function fetchAeolianResult(analysisId, { signal } = {}) {
  return request(
    `/api/v1/aeolian/results/${encodeURIComponent(analysisId)}`,
    { signal },
  )
}
