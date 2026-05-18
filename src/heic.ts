export function looksLikeHeic(file: File): boolean {
  const name = file.name.toLowerCase();
  if (name.endsWith(".heic") || name.endsWith(".heif")) return true;
  const t = (file.type || "").toLowerCase();
  return t === "image/heic" || t === "image/heif" || t === "image/heic-sequence";
}

let heicLib: typeof import("heic2any") | null = null;
async function ensureLib() {
  if (!heicLib) {
    heicLib = (await import("heic2any")).default as unknown as typeof import("heic2any");
  }
  return heicLib;
}

export async function heicToJpegBlob(file: File, quality = 0.92): Promise<Blob> {
  const lib = await ensureLib();
  const out = await (lib as unknown as (opts: { blob: Blob; toType?: string; quality?: number }) => Promise<Blob | Blob[]>)({
    blob: file,
    toType: "image/jpeg",
    quality,
  });
  return Array.isArray(out) ? out[0] : out;
}
