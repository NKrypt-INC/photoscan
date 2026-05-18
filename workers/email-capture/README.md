# photoscan-email-capture

Cloudflare Worker that backs the optional email-capture form on
[photoscan.nkrypt.com](https://photoscan.nkrypt.com). Accepts a JSON POST,
validates it, and adds the address to the `nkrypt-privacy-brief` Resend
Audience.

## Deploy

```bash
cd workers/email-capture
npm install
npx wrangler login                       # one time, in browser
npx wrangler secret put RESEND_API_KEY   # paste the API key (audiences:write)
npx wrangler secret put RESEND_AUDIENCE_ID  # paste the UUID of the audience
npm run deploy
```

The Worker has no inbound state. It is safe to redeploy as often as you like.

## Local dev

```bash
npm run dev
curl -X POST http://127.0.0.1:8787/subscribe \
  -H 'content-type: application/json' \
  -d '{"email":"test@example.com"}'
```

## Privacy posture

- The Worker never logs the submitted email address. Resend's response is
  examined for known "already exists" wording so the API returns 200 in that
  case too, instead of leaking subscription state.
- CORS only permits the origins listed in `ALLOWED_ORIGINS`.
- The API key and audience ID live in Cloudflare Worker secrets, never in
  source.
