import type { CleaningResult } from "../types";
import { cleanPhoto } from "../cleaner";
import { verifyZeroExif } from "../exif";

export function buildDownloadPanel(originalFile: File): HTMLElement {
  const section = document.createElement("section");
  section.className = "container-page";

  const panel = document.createElement("div");
  panel.className =
    "panel p-5 sm:p-7 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between";

  const left = document.createElement("div");
  left.className = "max-w-xl";
  const title = document.createElement("h3");
  title.className = "text-lg sm:text-xl font-semibold text-ink-50";
  title.textContent = "Download a cleaned copy.";
  const body = document.createElement("p");
  body.className = "mt-2 text-sm text-ink-300 leading-relaxed";
  body.textContent =
    "Same image, same dimensions, every EXIF field stripped. Re-encoded right here in your browser. Verified by re-scanning the output for any remaining metadata.";
  left.append(title, body);

  const right = document.createElement("div");
  right.className = "flex flex-col items-stretch sm:items-end gap-2";

  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "btn-primary text-base";
  btn.textContent = "Download cleaned photo";

  const status = document.createElement("div");
  status.className = "min-h-[1.25rem] text-xs font-mono text-ink-400";
  status.setAttribute("aria-live", "polite");

  right.append(btn, status);
  panel.append(left, right);
  section.appendChild(panel);

  let cleaned: CleaningResult | null = null;
  let busy = false;

  btn.addEventListener("click", async () => {
    if (busy) return;
    busy = true;
    btn.disabled = true;
    const originalLabel = btn.textContent;
    btn.textContent = "Cleaning...";
    status.textContent = "Re-encoding in your browser.";
    try {
      if (!cleaned) {
        cleaned = await cleanPhoto(originalFile);
        const check = await verifyZeroExif(cleaned.blob);
        if (!check.clean) {
          status.textContent = `Verification failed, sensitive fields still present: ${check.keys.slice(0, 4).join(", ")}`;
          btn.disabled = false;
          btn.textContent = originalLabel ?? "Download cleaned photo";
          busy = false;
          return;
        }
      }
      const url = URL.createObjectURL(cleaned.blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = cleaned.filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2_000);
      status.textContent = `cleaned, ${(cleaned.cleanedByteSize / 1024).toFixed(1)} KB, zero EXIF verified`;
      btn.textContent = "Download again";
    } catch (err) {
      status.textContent = `Could not clean the file: ${(err as Error).message}`;
    } finally {
      btn.disabled = false;
      busy = false;
    }
  });

  return section;
}
