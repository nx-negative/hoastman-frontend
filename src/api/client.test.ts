/// <reference types="node" />
import { createServer, type IncomingMessage, type Server } from "node:http"
import { afterEach, describe, expect, it, vi } from "vitest"

interface TestServer {
  server: Server
  url: string
  lastHeaders: Record<string, string | string[] | undefined>
}

type Handler = (
  req: IncomingMessage,
  res: {
    writeHead: (status: number, headers?: Record<string, string>) => void
    end: (body?: string) => void
  }
) => void

function startServer(handler: Handler): Promise<TestServer> {
  return new Promise((resolve) => {
    const state: TestServer = {
      server: createServer((req, res) => {
        state.lastHeaders = req.headers
        let body = ""
        req.on("data", (chunk) => {
          body += chunk
        })
        req.on("end", () =>
          handler(req, {
            writeHead: (status, headers) => res.writeHead(status, headers),
            end: (out) => res.end(out),
          })
        )
        void body
      }),
      url: "",
      lastHeaders: {},
    }
    state.server.listen(0, "127.0.0.1", () => {
      const address = state.server.address()
      const port = typeof address === "object" && address ? address.port : 0
      state.url = `http://127.0.0.1:${port}`
      resolve(state)
    })
  })
}

async function loadModules(base: string) {
  // API_BASE lives in @/config as a constant (no env reads — §10: the backend
  // origin must never be inlinable into the client bundle). Tests mock it.
  vi.doMock("@/config", () => ({ API_BASE: base }))
  vi.resetModules()
  return {
    client: await import("./client"),
    health: await import("./health"),
    auth: await import("@/store/auth"),
  }
}

afterEach(() => {
  vi.doUnmock("@/config")
  vi.resetModules()
})

describe("api client (live round-trips against a local server)", () => {
  it("parses /healthz and /readyz responses", async () => {
    const ts = await startServer((req, res) => {
      res.writeHead(200, { "content-type": "application/json" })
      res.end(
        req.url === "/readyz"
          ? '{"status":"ok","ready":true}'
          : '{"status":"ok"}'
      )
    })
    const { health } = await loadModules(ts.url)

    await expect(health.getLiveness()).resolves.toEqual({ status: "ok" })
    await expect(health.getReadiness()).resolves.toEqual({
      status: "ok",
      ready: true,
    })
    ts.server.close()
  })

  it("normalizes backend error bodies into ApiError {status, code, message}", async () => {
    const ts = await startServer((_req, res) => {
      res.writeHead(401, { "content-type": "application/json" })
      res.end('{"error":{"code":"unauthorized","message":"bad token"}}')
    })
    const { health } = await loadModules(ts.url)

    await expect(health.getSystemHealth()).rejects.toMatchObject({
      name: "ApiError",
      status: 401,
      code: "unauthorized",
      message: "bad token",
    })
    ts.server.close()
  })

  it("maps connection failures to a retryable network error", async () => {
    const { client, health } = await loadModules("http://127.0.0.1:9") // closed port
    const error = await health.getLiveness().catch((e: unknown) => e)

    expect(error).toMatchObject({ status: 0, code: "network_error" })
    expect(client.isRetryable(error)).toBe(true)
  })

  it("flags malformed JSON and schema-invalid bodies as invalid_response", async () => {
    const ts = await startServer((_req, res) => {
      res.writeHead(200)
      res.end("not json at all")
    })
    const { health } = await loadModules(ts.url)

    await expect(health.getLiveness()).rejects.toMatchObject({
      code: "invalid_response",
    })
    ts.server.close()

    const ts2 = await startServer((_req, res) => {
      res.writeHead(200, { "content-type": "application/json" })
      res.end('{"unexpected":true}')
    })
    const { health: health2 } = await loadModules(ts2.url)
    await expect(health2.getLiveness()).rejects.toMatchObject({
      code: "invalid_response",
    })
    ts2.server.close()
  })

  it("sends the session admin token as X-Admin-Token", async () => {
    const ts = await startServer((_req, res) => {
      res.writeHead(200, { "content-type": "application/json" })
      res.end('{"status":"ok"}')
    })
    const { health, auth } = await loadModules(ts.url)

    auth.setAdminToken("secret-token")
    await health.getLiveness()
    expect(ts.lastHeaders["x-admin-token"]).toBe("secret-token")

    auth.clearAdminToken()
    await health.getLiveness()
    expect(ts.lastHeaders["x-admin-token"]).toBeUndefined()
    ts.server.close()
  })
})

describe("retry policy (§9)", () => {
  it("retries only transient failures, capped at 2s", async () => {
    const { client } = await loadModules("http://127.0.0.1:9")
    const { ApiError } = client

    for (const status of [0, 408, 429, 503]) {
      expect(client.isRetryable(new ApiError(status, "x", "x"))).toBe(true)
    }
    for (const status of [400, 401, 404, 500]) {
      expect(client.isRetryable(new ApiError(status, "x", "x"))).toBe(false)
    }
    expect(client.retryDelay(0)).toBe(500)
    expect(client.retryDelay(1)).toBe(1000)
    expect(client.retryDelay(2)).toBe(2000)
    expect(client.retryDelay(9)).toBe(2000)
  })
})

describe("login-time token verification (§4 pre-verification bypass fix)", () => {
  it("sends an explicit token via X-Admin-Token without the store having one", async () => {
    const ts = await startServer((_req, res) => {
      res.writeHead(200, { "content-type": "application/json" })
      res.end('{"ok":true}')
    })
    const { client, auth } = await loadModules(ts.url)

    // store is empty — verify the token is sent ONLY via the explicit argument
    expect(auth.hasAdminToken()).toBe(false)
    await client.apiFetch("/__probe__", undefined, "explicit-token")
    expect(ts.lastHeaders["x-admin-token"]).toBe("explicit-token")
    ts.server.close()
  })

  it("uses the store token only when no explicit override is provided", async () => {
    const ts = await startServer((_req, res) => {
      res.writeHead(200, { "content-type": "application/json" })
      res.end('{"ok":true}')
    })
    const { client, auth } = await loadModules(ts.url)

    // no token anywhere → no header
    await client.apiFetch("/__probe__")
    expect(ts.lastHeaders["x-admin-token"]).toBeUndefined()

    // store token → header present, proving apiFetch falls back to the store
    auth.setAdminToken("from-store")
    await client.apiFetch("/__probe__")
    expect(ts.lastHeaders["x-admin-token"]).toBe("from-store")

    ts.server.close()
  })
})
