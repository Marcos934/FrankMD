// Mock for @rails/request.js used in vitest
// Wraps global.fetch to match the FetchResponse API that request.js provides

class FetchResponse {
  constructor(response) {
    this.response = response
    this.statusCode = response.status || 200
    this.ok = response.ok !== undefined ? response.ok : true
    this.isTurboStream = false
  }

  get json() {
    if (typeof this.response.json === "function") {
      return this.response.json()
    }
    return Promise.resolve(this.response.json)
  }

  get text() {
    if (typeof this.response.text === "function") {
      return this.response.text()
    }
    return Promise.resolve(this.response.text || "")
  }

  get html() {
    return this.text
  }
}

function buildOptions(method, options = {}) {
  const fetchOptions = { method }
  const headers = {}

  if (options.responseKind === "json") {
    headers["Accept"] = "application/json"
  } else if (options.responseKind === "turbo-stream") {
    headers["Accept"] = "text/vnd.turbo-stream.html, text/html, application/xhtml+xml"
  }

  if (options.body !== undefined && options.body !== null) {
    if (options.body instanceof FormData) {
      fetchOptions.body = options.body
    } else if (typeof options.body === "string") {
      headers["Content-Type"] = "application/json"
      fetchOptions.body = options.body
    } else {
      headers["Content-Type"] = "application/json"
      fetchOptions.body = JSON.stringify(options.body)
    }
  }

  if (options.signal) {
    fetchOptions.signal = options.signal
  }

  fetchOptions.headers = headers
  return fetchOptions
}

export async function get(url, options = {}) {
  const response = await global.fetch(url, buildOptions("GET", options))
  return new FetchResponse(response)
}

export async function post(url, options = {}) {
  const response = await global.fetch(url, buildOptions("POST", options))
  return new FetchResponse(response)
}

export async function patch(url, options = {}) {
  const response = await global.fetch(url, buildOptions("PATCH", options))
  return new FetchResponse(response)
}

export async function destroy(url, options = {}) {
  const response = await global.fetch(url, buildOptions("DELETE", options))
  return new FetchResponse(response)
}

export { FetchResponse }
