// One-off generator for public/og-image.png.
// Run with: node scripts/generate-og-image.mjs

import sharp from "sharp";
import { writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outPath = resolve(__dirname, "..", "public", "og-image.png");

const W = 1200;
const H = 630;

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#06080c"/>
      <stop offset="100%" stop-color="#0b0f17"/>
    </linearGradient>
    <radialGradient id="glow" cx="80%" cy="20%" r="55%">
      <stop offset="0%" stop-color="#7df3c6" stop-opacity="0.18"/>
      <stop offset="100%" stop-color="#7df3c6" stop-opacity="0"/>
    </radialGradient>
    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#111726" stroke-width="1"/>
    </pattern>
  </defs>

  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <rect width="${W}" height="${H}" fill="url(#grid)" opacity="0.6"/>
  <rect width="${W}" height="${H}" fill="url(#glow)"/>

  <!-- corner glyph -->
  <g transform="translate(80, 80)">
    <rect x="0" y="0" width="56" height="56" rx="12" fill="#06080c" stroke="#1a2236" stroke-width="1.5"/>
    <path d="M14 16 L14 40 L18 40 L18 24 L38 40 L42 40 L42 16 L38 16 L38 32 L18 16 Z" fill="#7df3c6"/>
    <circle cx="43" cy="43" r="5" fill="#7df3c6"/>
  </g>
  <text x="156" y="118" font-family="Inter, -apple-system, Segoe UI, sans-serif" font-size="22" fill="#b7bdd0" letter-spacing="6" font-weight="600">N K R Y P T &#160;&#183;&#160; PHOTOSCAN</text>

  <!-- headline -->
  <g transform="translate(80, 230)">
    <text x="0" y="0" font-family="Inter, -apple-system, Segoe UI, sans-serif" font-weight="700" font-size="88" fill="#f3f5fa" letter-spacing="-2">See what your</text>
    <text x="0" y="100" font-family="Inter, -apple-system, Segoe UI, sans-serif" font-weight="700" font-size="88" fill="#f3f5fa" letter-spacing="-2">photos give away.</text>
  </g>

  <!-- subhead -->
  <text x="80" y="490" font-family="Inter, -apple-system, Segoe UI, sans-serif" font-size="28" fill="#8590ad" font-weight="400">Drop a photo. Read its metadata. Download a cleaned copy.</text>

  <!-- trust strip -->
  <g transform="translate(80, 540)" font-family="JetBrains Mono, Space Mono, ui-monospace, monospace" font-size="16" font-weight="500" fill="#7df3c6" letter-spacing="2">
    <text x="0" y="0">BROWSER ONLY</text>
    <text x="190" y="0" fill="#5a6685">&#8226;</text>
    <text x="210" y="0">NO ACCOUNT</text>
    <text x="370" y="0" fill="#5a6685">&#8226;</text>
    <text x="390" y="0">NO TRACKING</text>
    <text x="560" y="0" fill="#5a6685">&#8226;</text>
    <text x="580" y="0">OPEN SOURCE</text>
  </g>

  <!-- right-side pin -->
  <g transform="translate(900, 340)">
    <circle r="120" fill="none" stroke="#1a2236" stroke-width="1"/>
    <circle r="80" fill="none" stroke="#1a2236" stroke-width="1"/>
    <circle r="40" fill="none" stroke="#1a2236" stroke-width="1"/>
    <circle r="14" fill="#7df3c6" opacity="0.35"/>
    <circle r="6" fill="#7df3c6"/>
  </g>
</svg>
`;

mkdirSync(dirname(outPath), { recursive: true });

const buf = await sharp(Buffer.from(svg))
  .png({ compressionLevel: 9 })
  .toBuffer();

writeFileSync(outPath, buf);
console.log(`Wrote ${outPath}, ${buf.length} bytes`);
