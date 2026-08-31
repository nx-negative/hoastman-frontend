// Client API base policy (§4/§9/§10/§15):
// - Always same-origin (""). Dev traffic goes through the Vite dev proxy
//   (vite.config.ts `server.proxy`); production sits behind the reverse proxy
//   (§15). The backend origin is a DEPLOYMENT concern — it is never referenced
//   by client code, so it can never leak into the bundle (§10).
// - Tests mock this module (vi.doMock "@/config") to point at a local server.
export const API_BASE = ""
