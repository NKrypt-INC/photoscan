# NKrypt PhotoScan

![MIT licensed](https://img.shields.io/badge/license-MIT-7df3c6?style=flat-square)
![Browser-only](https://img.shields.io/badge/runs-in_your_browser-7df3c6?style=flat-square)
![No tracking](https://img.shields.io/badge/no-tracking_on_your_photo-0b0f17?style=flat-square)

Live at [photoscan.nkrypt.com](https://photoscan.nkrypt.com).

NKrypt PhotoScan is a free, browser-only privacy tool that shows you what a
photo gives away. Drop a JPG, PNG, or HEIC, and the page reads the EXIF locally
in your browser. You see the GPS pin on a map, the time it was taken, the
device that took it, the editing trail, and a plain-language readout of what
strangers can infer. One click downloads a cleaned copy with every metadata
field stripped, verified by re-scanning the output.

**Nothing is uploaded.** The photo never leaves your device. The source code in
this repo is the entire scanner.

## Why this exists

In 2012, John McAfee's hideout in Guatemala was revealed by GPS data embedded
in a single Vice photo. Every photo carries something like that, and most
people never see it. NKrypt PhotoScan is the entry point of a broader privacy
product line by [NKrypt](https://nkrypt.com), a cybersecurity company that
takes the position that ordinary people should be able to see what their
files say about them without sending the file to anybody.

## Run it locally

```bash
git clone https://github.com/NKrypt-INC/photoscan.git
cd photoscan
npm install
npm run dev
```

Open the URL Vite prints. Drop a photo. That is the entire app.

## Architecture

- Vanilla TypeScript + Vite + Tailwind. No framework.
- [`exifr`](https://github.com/MikeKovarik/exifr) parses EXIF, XMP, IPTC, ICC,
  GPS in the browser.
- [`heic2any`](https://github.com/alexcorvi/heic2any) converts iPhone HEIC
  files to JPEG in the browser, on demand, code-split.
- [Leaflet](https://leafletjs.com/) renders the map. OpenStreetMap tiles by
  default, Esri imagery for the satellite view.
- The cleaner re-encodes the image through a 2D canvas, which is the cleanest
  way to strip every metadata segment without depending on EXIF-aware writers.
  The output is verified by running it back through `exifr` to confirm zero
  sensitive fields remain.
- Email capture, optional and skippable, posts to a single Cloudflare Worker
  ([`workers/email-capture`](workers/email-capture)) that adds the address to
  the NKrypt Privacy Brief Resend Audience. The API key and audience ID live
  in Cloudflare Worker secrets, never in this repo.

## What this tool does not do

- It does not upload your photo. Anywhere.
- It does not run any analytics on your photo.
- It does not load third-party scripts beyond OpenStreetMap tile fetches.
- It does not require an account or an email address.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). PRs are welcome. There is no SLA on
response time.

## License

MIT. See [LICENSE](LICENSE).
