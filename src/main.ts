import "./styles.css";
import { parseExif } from "./exif";
import { generateInference } from "./inference";
import { looksLikeHeic, heicToJpegBlob } from "./heic";
import { buildHero } from "./ui/hero";
import { renderResult, type ResultRender } from "./ui/result";
import { buildDownloadPanel } from "./ui/download";
import { buildEmailCapture } from "./ui/email-capture";
import { buildFooter } from "./ui/footer";

const SUBSCRIBE_ENDPOINT =
  (import.meta.env.VITE_SUBSCRIBE_ENDPOINT as string | undefined) ?? "/api/subscribe";

const root = document.getElementById("app");
if (!root) throw new Error("Missing #app root");

const hero = buildHero(handleFile);
root.appendChild(hero.element);

let resultsContainer = document.createElement("div");
root.appendChild(resultsContainer);
root.appendChild(buildFooter());

let lastResult: ResultRender | null = null;

async function handleFile(file: File): Promise<void> {
  hero.setBusy(true);
  hero.setError(null);
  try {
    const isHeic = looksLikeHeic(file);
    if (isHeic) {
      hero.setStatus(
        `Converting HEIC in your browser, this can take 5 to 20 seconds on a phone-sized photo...`,
      );
    }

    const exifPromise = parseExif(file, file.name, file.type || (isHeic ? "image/heic" : ""));
    const previewPromise: Promise<Blob> = isHeic
      ? heicToJpegBlob(file, 0.85).catch((err) => {
          console.error("HEIC conversion failed", err);
          throw new Error(
            "Could not convert this HEIC. Your iPhone may have stored it in a variant Safari does not expose to the web. On iPhone, Settings, Camera, Formats, set to Most Compatible, retake the photo, try again.",
          );
        })
      : Promise.resolve<Blob>(file);

    const [exif, previewBlob] = await Promise.all([exifPromise, previewPromise]);

    const inference = generateInference(exif);

    if (lastResult) {
      lastResult.destroy();
      lastResult = null;
    }
    resultsContainer.replaceChildren();

    const result = renderResult({ file, previewBlob, exif, inference });
    lastResult = result;
    resultsContainer.appendChild(result.element);
    resultsContainer.appendChild(buildDownloadPanel(file));
    resultsContainer.appendChild(buildEmailCapture(SUBSCRIBE_ENDPOINT));

    setTimeout(() => {
      result.element.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    hero.setError(`Could not read this file: ${message}`);
  } finally {
    hero.setBusy(false);
  }
}
