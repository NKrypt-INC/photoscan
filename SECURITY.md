# Security

## Reporting a vulnerability

Email **security@nkrypt.com**. Please include:

- A short description of the issue
- Steps to reproduce
- The impact you believe it has

If the issue affects the production site at
[photoscan.nkrypt.com](https://photoscan.nkrypt.com), we will respond within
five business days. For issues that only affect a local checkout of this
repo, response time may be longer.

## Scope

NKrypt PhotoScan is a **client-side** privacy tool. The full scanner runs in
the visitor's browser. The project has no server-side ingest of user photos
and never will.

The only backend component in this repo is the optional email-capture
Cloudflare Worker under [`workers/email-capture`](workers/email-capture). It
accepts an email address, validates it, and forwards it to Resend. It does
not receive, store, or process photo data.

## Privacy posture

- No photo bytes are ever transmitted off-device by this software.
- Page-view analytics, if enabled, use Cloudflare Web Analytics with no
  client-side JS and no cookies.
- The email-capture Worker never logs the submitted email value. It returns
  a generic success message even when a contact already exists, so the API
  does not leak subscription state.

## Out of scope

- Vulnerabilities in OpenStreetMap or Esri tile servers (third-party
  infrastructure).
- Findings that require the attacker to already control the visitor's
  browser or operating system.
- Self-XSS via the developer console.
