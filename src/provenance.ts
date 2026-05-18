import ExifReader from "exifreader";

export type ProvenanceSeverity = "high" | "medium" | "low" | "info";

export interface ProvenanceFinding {
  severity: ProvenanceSeverity;
  label: string;
  text: string;
  source?: string;
}

export interface ProvenanceResult {
  hasContentCredentials: boolean;
  contentCredentialsUrl: string | null;
  findings: ProvenanceFinding[];
}

interface ToolMatch {
  label: string;
  patterns: RegExp[];
  category: "ai-generator" | "ai-edit" | "manual-edit";
  description: string;
}

const TOOL_PATTERNS: ToolMatch[] = [
  {
    label: "Midjourney",
    patterns: [/midjourney/i, /\/imagine/i, /mj_version/i],
    category: "ai-generator",
    description: "Midjourney signature found in metadata. The image was created by a generative model, not a camera.",
  },
  {
    label: "OpenAI / DALL-E",
    patterns: [/dall[\s-]?e/i, /openai/i, /\bgpt-image\b/i, /\bsora\b/i],
    category: "ai-generator",
    description: "OpenAI generator (DALL-E, GPT-Image, or Sora) signature found in metadata.",
  },
  {
    label: "Stable Diffusion",
    patterns: [/stable[\s-]?diffusion/i, /\bsd-?\d+\b/i, /\bautomatic1111\b/i, /\bcomfyui\b/i, /Model hash:/i, /Sampler:/i],
    category: "ai-generator",
    description: "Stable Diffusion or a derivative pipeline (Automatic1111, ComfyUI) created this image.",
  },
  {
    label: "Adobe Firefly",
    patterns: [/firefly/i, /adobe firefly/i],
    category: "ai-generator",
    description: "Adobe Firefly generative model created or contributed to this image.",
  },
  {
    label: "Google Imagen / ImageFX",
    patterns: [/imagen/i, /imagefx/i, /\bgemini\b.*\bimage\b/i],
    category: "ai-generator",
    description: "Google Imagen or ImageFX created this image.",
  },
  {
    label: "Microsoft Designer / Bing",
    patterns: [/microsoft designer/i, /bing image creator/i],
    category: "ai-generator",
    description: "Microsoft Designer or Bing Image Creator (DALL-E behind the scenes) made this.",
  },
  {
    label: "Leonardo.AI",
    patterns: [/leonardo\.ai/i, /leonardo ai/i],
    category: "ai-generator",
    description: "Leonardo.AI generative model created this image.",
  },
  {
    label: "Runway",
    patterns: [/runwayml/i, /\brunway gen-?\d/i],
    category: "ai-generator",
    description: "Runway generative tool (image or video frame) signature found.",
  },
  {
    label: "Ideogram",
    patterns: [/ideogram/i],
    category: "ai-generator",
    description: "Ideogram generative model created this image.",
  },
  {
    label: "Photoshop Generative Fill",
    patterns: [/generative fill/i, /generative expand/i, /firefly-generated/i],
    category: "ai-edit",
    description: "Adobe Photoshop's Generative Fill or Generative Expand was used on this image. Parts of the photo were synthesized by Firefly.",
  },
  {
    label: "Topaz AI",
    patterns: [/topaz/i, /gigapixel/i, /denoise ai/i, /sharpen ai/i, /photo ai/i],
    category: "ai-edit",
    description: "Topaz Labs AI (upscaler, sharpener, or denoiser) was used on this image.",
  },
  {
    label: "Adobe Photoshop",
    patterns: [/adobe photoshop/i, /photoshop \d/i],
    category: "manual-edit",
    description: "Edited in Adobe Photoshop.",
  },
  {
    label: "Adobe Lightroom",
    patterns: [/adobe lightroom/i, /lightroom \d/i],
    category: "manual-edit",
    description: "Processed through Adobe Lightroom.",
  },
  {
    label: "Snapseed",
    patterns: [/snapseed/i],
    category: "manual-edit",
    description: "Edited in Snapseed.",
  },
  {
    label: "VSCO",
    patterns: [/\bvsco\b/i],
    category: "manual-edit",
    description: "Filtered through VSCO.",
  },
  {
    label: "Affinity Photo",
    patterns: [/affinity photo/i],
    category: "manual-edit",
    description: "Edited in Affinity Photo.",
  },
];

function collectStrings(tags: unknown): string[] {
  const acc: string[] = [];
  const seen = new WeakSet<object>();
  const walk = (v: unknown) => {
    if (v === null || v === undefined) return;
    if (typeof v === "string") {
      if (v.length > 0 && v.length < 4096) acc.push(v);
      return;
    }
    if (typeof v === "number" || typeof v === "boolean") return;
    if (typeof v !== "object") return;
    if (seen.has(v as object)) return;
    seen.add(v as object);
    if (Array.isArray(v)) {
      for (const x of v) walk(x);
      return;
    }
    for (const key of Object.keys(v as Record<string, unknown>)) {
      walk((v as Record<string, unknown>)[key]);
    }
  };
  walk(tags);
  return acc;
}

const C2PA_MAGIC_STRINGS = [
  "urn:uuid:c2pa",
  "urn:c2pa:",
  "c2pa.assertions",
  "c2pa.actions",
  "jumbf",
  "JUMBF",
];

function scanForC2pa(bytes: Uint8Array): boolean {
  // Look in the first 4 MB. C2PA boxes are stored close to the file header in
  // JPEG (APP11) and inside the meta box in HEIF/MP4, near the top of the file.
  const slice = bytes.subarray(0, Math.min(bytes.length, 4 * 1024 * 1024));
  // Build ascii view once (skip non-ascii bytes to save work).
  const decoder = new TextDecoder("latin1");
  const text = decoder.decode(slice);
  return C2PA_MAGIC_STRINGS.some((m) => text.includes(m));
}

export async function analyzeProvenance(blob: Blob): Promise<ProvenanceResult> {
  const buf = await blob.arrayBuffer();
  const bytes = new Uint8Array(buf);

  let tags: unknown = {};
  try {
    tags = ExifReader.load(buf, { expanded: true, includeUnknown: false });
  } catch {
    tags = {};
  }

  const haystack = collectStrings(tags).join("   ");
  const findings: ProvenanceFinding[] = [];
  const matchedLabels = new Set<string>();

  for (const tool of TOOL_PATTERNS) {
    if (matchedLabels.has(tool.label)) continue;
    if (tool.patterns.some((rx) => rx.test(haystack))) {
      matchedLabels.add(tool.label);
      const severity: ProvenanceSeverity =
        tool.category === "ai-generator" ? "high" : tool.category === "ai-edit" ? "medium" : "low";
      findings.push({
        severity,
        label: tool.label,
        text: tool.description,
        source: "EXIF / XMP / IPTC text fields",
      });
    }
  }

  const hasContentCredentials = scanForC2pa(bytes);
  if (hasContentCredentials) {
    findings.unshift({
      severity: "medium",
      label: "Content Credentials (C2PA)",
      text: "A signed Content Credentials manifest is embedded in this file. It records the tools and edit steps the author chose to disclose, and can be verified cryptographically.",
      source: "C2PA JUMBF manifest in the file bytes",
    });
  }

  if (findings.length === 0) {
    findings.push({
      severity: "info",
      label: "No tool fingerprints",
      text: "No AI generator, AI edit, or common photo-editor signatures were found in the metadata, and no Content Credentials manifest is attached. That does not prove the photo is unedited; it just means the file does not advertise any tool.",
    });
  }

  return {
    hasContentCredentials,
    contentCredentialsUrl: hasContentCredentials ? "https://contentcredentials.org/verify" : null,
    findings,
  };
}
