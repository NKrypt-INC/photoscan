# Contributing

Thanks for the interest. PRs are welcome, including for typos and copy
improvements.

## Ground rules

- Keep the product **browser-only**. Any change that uploads the photo or
  sends EXIF off-device is a non-starter for this repo.
- No third-party trackers. No analytics on the photo itself. Page-view
  analytics are acceptable only via the Cloudflare zero-JS option.
- The cleaner must verify its output. If you touch `src/cleaner.ts`, also
  exercise the round-trip check in `src/exif.ts#verifyZeroExif`.
- Keep the dependency graph small. Adding a heavyweight library needs a
  short note in the PR explaining why a leaner alternative did not work.

## Working locally

```bash
npm install
npm run dev
npm run typecheck
npm run build
```

## Response time

There is no SLA. Neil reviews when he can. If a PR is sitting and you want a
nudge, ping the issue thread once and move on.

## Code of conduct

Be kind. Don't be a jerk in PRs, issues, or commit messages. Decisions about
scope are final and rest with the maintainers.
