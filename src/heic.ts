export function looksLikeHeic(file: File): boolean {
  const name = file.name.toLowerCase();
  if (name.endsWith(".heic") || name.endsWith(".heif")) return true;
  const t = (file.type || "").toLowerCase();
  return t === "image/heic" || t === "image/heif" || t === "image/heic-sequence";
}

interface HeicToModule {
  heicTo(args: { blob: Blob; type: string; quality?: number }): Promise<Blob>;
}

let heicLib: HeicToModule | null = null;
async function ensureLib(): Promise<HeicToModule> {
  if (!heicLib) {
    heicLib = (await import("heic-to/csp")) as unknown as HeicToModule;
  }
  return heicLib;
}

export async function heicToJpegBlob(file: File, quality = 0.92): Promise<Blob> {
  const lib = await ensureLib();
  return await lib.heicTo({
    blob: file,
    type: "image/jpeg",
    quality,
  });
}
