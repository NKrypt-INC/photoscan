import type { CleaningResult } from "./types";
import { looksLikeHeic, heicToJpegBlob } from "./heic";

async function loadImageBitmap(source: Blob): Promise<ImageBitmap> {
  if (typeof createImageBitmap === "function") {
    try {
      return await createImageBitmap(source);
    } catch {
      // fall through to HTMLImageElement
    }
  }
  return await new Promise<ImageBitmap>((resolve, reject) => {
    const url = URL.createObjectURL(source);
    const img = new Image();
    img.onload = async () => {
      try {
        const bmp = await createImageBitmap(img);
        URL.revokeObjectURL(url);
        resolve(bmp);
      } catch (err) {
        URL.revokeObjectURL(url);
        reject(err);
      }
    };
    img.onerror = (e) => {
      URL.revokeObjectURL(url);
      reject(e);
    };
    img.src = url;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("toBlob failed"))),
      type,
      quality,
    );
  });
}

function deriveCleanedFilename(original: string, ext: string): string {
  const dot = original.lastIndexOf(".");
  const stem = dot > 0 ? original.slice(0, dot) : original;
  return `${stem}-cleaned.${ext}`;
}

export async function cleanPhoto(file: File): Promise<CleaningResult> {
  const originalByteSize = file.size;
  const isHeic = looksLikeHeic(file);
  const source: Blob = isHeic ? await heicToJpegBlob(file, 0.92) : file;

  const bmp = await loadImageBitmap(source);
  const canvas = document.createElement("canvas");
  canvas.width = bmp.width;
  canvas.height = bmp.height;
  const ctx = canvas.getContext("2d", { alpha: false });
  if (!ctx) throw new Error("Could not get 2d canvas context");
  ctx.drawImage(bmp, 0, 0);

  const isPng = (file.type || "").toLowerCase() === "image/png" && !isHeic;
  const outType = isPng ? "image/png" : "image/jpeg";
  const outExt = isPng ? "png" : "jpg";
  const blob = await canvasToBlob(canvas, outType, 0.92);
  bmp.close?.();

  return {
    blob,
    filename: deriveCleanedFilename(file.name, outExt),
    mimeType: outType,
    originalByteSize,
    cleanedByteSize: blob.size,
  };
}
