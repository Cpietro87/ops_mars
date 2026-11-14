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

async function request(path, { signal } = {}) {
  let response

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      headers: { Accept: 'application/json' },
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
