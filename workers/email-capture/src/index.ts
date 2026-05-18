/**
 * NKrypt PhotoScan email-capture Worker.
 *
 * POST /subscribe { email: string }
 *   - Validates the email (RFC-ish regex + length cap).
 *   - Adds the contact to the Resend Audience named in RESEND_AUDIENCE_ID.
 *   - Returns 200 with a generic message on success and on any Resend
 *     "already exists" response, so the API does not leak whether an
 *     address is already subscribed.
 *
 * Configuration (secrets via `wrangler secret put`):
 *   RESEND_API_KEY     Resend API key, audiences:write scope
 *   RESEND_AUDIENCE_ID UUID of the nkrypt-privacy-brief audience
 *
 * Bindings (vars in wrangler.toml):
 *   ALLOWED_ORIGINS       Comma-separated allow-list for CORS
 *   RESEND_AUDIENCE_NAME  Informational, included in logs
 */

interface Env {
  RESEND_API_KEY: string;
  RESEND_AUDIENCE_ID: string;
  ALLOWED_ORIGINS: string;
  RESEND_AUDIENCE_NAME: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const MAX_EMAIL_LEN = 254;

function corsHeaders(origin: string | null, allowed: string[]): Record<string, string> {
  const allowOrigin = origin && allowed.includes(origin) ? origin : allowed[0] ?? "*";
  return {
    "access-control-allow-origin": allowOrigin,
    "access-control-allow-methods": "POST, OPTIONS",
    "access-control-allow-headers": "content-type",
    "vary": "Origin",
  };
}

function json(body: unknown, status: number, extra: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", ...extra },
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const origin = request.headers.get("origin");
    const allowed = (env.ALLOWED_ORIGINS || "")
      .split(",")
      .map((o) => o.trim())
      .filter(Boolean);
    const cors = corsHeaders(origin, allowed);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors });
    }

    if (url.pathname === "/health") {
      return json({ ok: true }, 200, cors);
    }

    if (url.pathname !== "/subscribe" && url.pathname !== "/api/subscribe") {
      return json({ error: "not_found" }, 404, cors);
    }
    if (request.method !== "POST") {
      return json({ error: "method_not_allowed" }, 405, cors);
    }

    let payload: unknown;
    try {
      payload = await request.json();
    } catch {
      return json({ error: "invalid_json" }, 400, cors);
    }

    const email = (payload && typeof payload === "object" && "email" in (payload as Record<string, unknown>))
      ? String((payload as Record<string, unknown>).email ?? "").trim()
      : "";

    if (!email || email.length > MAX_EMAIL_LEN || !EMAIL_RE.test(email)) {
      return json({ error: "invalid_email" }, 400, cors);
    }

    if (!env.RESEND_API_KEY || !env.RESEND_AUDIENCE_ID) {
      return json({ error: "not_configured" }, 503, cors);
    }

    try {
      const res = await fetch(
        `https://api.resend.com/audiences/${encodeURIComponent(env.RESEND_AUDIENCE_ID)}/contacts`,
        {
          method: "POST",
          headers: {
            authorization: `Bearer ${env.RESEND_API_KEY}`,
            "content-type": "application/json",
          },
          body: JSON.stringify({ email, unsubscribed: false }),
        },
      );

      if (res.ok) {
        return json({ ok: true }, 200, cors);
      }

      // Resend's "contact already exists" response: treat as success so we
      // never reveal subscription state to the caller.
      let bodyText = "";
      try {
        bodyText = await res.text();
      } catch {
        // ignore
      }
      if (/already exists|duplicate|conflict/i.test(bodyText) || res.status === 409) {
        return json({ ok: true }, 200, cors);
      }
      console.warn("resend_error", res.status, bodyText.slice(0, 256));
      return json({ error: "upstream_error" }, 502, cors);
    } catch (err) {
      console.error("subscribe_failed", err);
      return json({ error: "upstream_unreachable" }, 502, cors);
    }
  },
};
