import type { ExifResult, InferenceLine, InferenceResult } from "../types";
import { mountMap, type MapHandle } from "../map";

export interface ResultRender {
  element: HTMLElement;
  destroy(): void;
}

interface ResultArgs {
  file: File;
  previewBlob: Blob;
  exif: ExifResult;
  inference: InferenceResult;
}

function formatLatLon(lat: number, lon: number): string {
  return `${lat.toFixed(6)}, ${lon.toFixed(6)}`;
}

function severityClass(s: InferenceLine["severity"]): string {
  switch (s) {
    case "high":
      return "border-alarm/40 bg-alarm/10 text-ink-50";
    case "medium":
      return "border-accent/30 bg-accent/5 text-ink-50";
    case "low":
      return "border-ink-700 bg-ink-900 text-ink-200";
    case "ok":
      return "border-ink-700 bg-ink-900 text-ink-300";
  }
}

function severityLabel(s: InferenceLine["severity"]): string {
  switch (s) {
    case "high":
      return "high risk";
    case "medium":
      return "watch this";
    case "low":
      return "noted";
    case "ok":
      return "clean";
  }
}

function makeDt(label: string): HTMLElement {
  const dt = document.createElement("dt");
  dt.textContent = label;
  return dt;
}

function makeDd(value: string): HTMLElement {
  const dd = document.createElement("dd");
  dd.textContent = value;
  return dd;
}

function staggerReveal(rows: HTMLElement[]) {
  rows.forEach((row, i) => {
    row.style.animationDelay = `${80 + i * 120}ms`;
    row.classList.add("reveal-row");
  });
}

function humanOrientation(o: number | null): string | null {
  if (o === null) return null;
  switch (o) {
    case 1:
      return "Landscape, upright";
    case 2:
      return "Landscape, mirrored";
    case 3:
      return "Upside down";
    case 4:
      return "Landscape, mirrored upside down";
    case 5:
      return "Portrait, rotated counterclockwise, mirrored";
    case 6:
      return "Portrait (camera held vertically)";
    case 7:
      return "Portrait, rotated clockwise, mirrored";
    case 8:
      return "Portrait (camera rotated other way)";
    default:
      return null;
  }
}

function humanMegapixels(w: number, h: number): string {
  const mp = (w * h) / 1_000_000;
  if (mp < 1) return `${(mp).toFixed(2)} MP`;
  return `${mp.toFixed(1)} MP`;
}

export function renderResult(args: ResultArgs): ResultRender {
  const { file, previewBlob, exif, inference } = args;
  let mapHandle: MapHandle | null = null;

  const section = document.createElement("section");
  section.className = "container-page pb-12";

  const grid = document.createElement("div");
  grid.className = "grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] gap-6 lg:gap-10";

  // LEFT: photo + meta
  const photoCol = document.createElement("div");
  photoCol.className = "flex flex-col gap-4";

  const photoWrap = document.createElement("div");
  photoWrap.className = "panel overflow-hidden aspect-square sm:aspect-[4/5] lg:aspect-[3/4] relative";

  const img = document.createElement("img");
  img.alt = "Your photo, displayed locally in your browser";
  img.className = "absolute inset-0 h-full w-full object-cover";
  img.decoding = "async";
  img.loading = "eager";
  const previewUrl = URL.createObjectURL(previewBlob);
  img.src = previewUrl;
  photoWrap.appendChild(img);

  const ribbon = document.createElement("div");
  ribbon.className =
    "absolute top-3 left-3 flex items-center gap-2 rounded-full border border-ink-700 bg-ink-950/80 px-3 py-1.5 text-[11px] font-mono uppercase tracking-widest text-accent";
  const ribbonDot = document.createElement("span");
  ribbonDot.className = "h-1.5 w-1.5 rounded-full bg-accent";
  const ribbonText = document.createElement("span");
  ribbonText.textContent = "browser only, never uploaded";
  ribbon.append(ribbonDot, ribbonText);
  photoWrap.appendChild(ribbon);

  photoCol.appendChild(photoWrap);

  const fileMeta = document.createElement("div");
  fileMeta.className = "panel p-4 text-sm text-ink-300 flex items-center justify-between gap-3";
  const fileLeft = document.createElement("div");
  fileLeft.className = "min-w-0 flex-1";
  const nameRow = document.createElement("div");
  nameRow.className = "truncate text-ink-100 font-medium";
  nameRow.textContent = file.name;
  const detailRow = document.createElement("div");
  detailRow.className = "mt-0.5 text-xs font-mono text-ink-400";
  detailRow.textContent = `${(file.size / 1024).toFixed(1)} KB, ${file.type || exif.mimeType || "unknown"}`;
  fileLeft.append(nameRow, detailRow);
  fileMeta.appendChild(fileLeft);

  photoCol.appendChild(fileMeta);

  // RIGHT: revealed insights
  const insightsCol = document.createElement("div");
  insightsCol.className = "flex flex-col gap-4";

  const headline = document.createElement("h2");
  headline.className = "text-2xl sm:text-3xl font-semibold tracking-tight text-ink-50";
  headline.textContent = inference.headline;

  const summary = document.createElement("p");
  summary.className = "text-ink-300 text-base leading-relaxed";
  summary.textContent = inference.narrative;

  insightsCol.append(headline, summary);

  const rowsToReveal: HTMLElement[] = [];

  // GPS / map
  if (exif.gps) {
    const wherePanel = document.createElement("div");
    wherePanel.className = "panel p-4 sm:p-5";
    const head = document.createElement("div");
    head.className = "flex items-center justify-between gap-3";
    const eyebrow = document.createElement("div");
    eyebrow.className = "label-eyebrow";
    eyebrow.textContent = "Where it was taken";
    const coords = document.createElement("div");
    coords.className = "font-mono text-xs text-ink-300";
    coords.textContent = formatLatLon(exif.gps.lat, exif.gps.lon);
    head.append(eyebrow, coords);

    const mapEl = document.createElement("div");
    mapEl.className = "mt-3 h-72 sm:h-80 rounded-xl overflow-hidden";

    const controls = document.createElement("div");
    controls.className = "mt-3 flex flex-wrap items-center gap-2";
    const styleStreet = document.createElement("button");
    styleStreet.type = "button";
    styleStreet.className = "btn-ghost";
    styleStreet.textContent = "Street";
    const styleSat = document.createElement("button");
    styleSat.type = "button";
    styleSat.className = "btn-ghost";
    styleSat.textContent = "Satellite";

    const zoomWrap = document.createElement("div");
    zoomWrap.className = "ml-auto flex items-center gap-2 text-xs font-mono text-ink-400";
    const zoomLabel = document.createElement("span");
    zoomLabel.textContent = "zoom";
    const zoom = document.createElement("input");
    zoom.type = "range";
    zoom.min = "4";
    zoom.max = "19";
    zoom.value = "16";
    zoom.className = "accent-accent";
    zoomWrap.append(zoomLabel, zoom);

    controls.append(styleStreet, styleSat, zoomWrap);

    wherePanel.append(head, mapEl, controls);
    insightsCol.appendChild(wherePanel);
    rowsToReveal.push(wherePanel);

    // mount map after element is in DOM and the next paint
    setTimeout(() => {
      mapHandle = mountMap(mapEl, exif.gps!);
      styleStreet.addEventListener("click", () => mapHandle?.setStyle("street"));
      styleSat.addEventListener("click", () => mapHandle?.setStyle("satellite"));
      zoom.addEventListener("input", () => mapHandle?.setZoomLevel(parseInt(zoom.value, 10)));
    }, 60);
  }

  // When
  if (exif.takenAt) {
    const whenPanel = document.createElement("div");
    whenPanel.className = "panel p-4 sm:p-5";
    const eyebrow = document.createElement("div");
    eyebrow.className = "label-eyebrow";
    eyebrow.textContent = "When it was taken";
    const big = document.createElement("div");
    big.className = "mt-2 text-xl font-medium text-ink-50";
    big.textContent = exif.takenAt.toLocaleString(undefined, {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
    const tz = document.createElement("div");
    tz.className = "mt-1 font-mono text-xs text-ink-400";
    const tzMin = exif.timezoneOffsetMinutes;
    if (tzMin !== null) {
      const sign = tzMin >= 0 ? "+" : "-";
      const abs = Math.abs(tzMin);
      const hh = String(Math.floor(abs / 60)).padStart(2, "0");
      const mm = String(abs % 60).padStart(2, "0");
      tz.textContent = `local timezone offset UTC${sign}${hh}:${mm}`;
    } else {
      tz.textContent = "timezone not recorded";
    }
    whenPanel.append(eyebrow, big, tz);
    insightsCol.appendChild(whenPanel);
    rowsToReveal.push(whenPanel);
  }

  // Device
  if (exif.cameraMake || exif.cameraModel || exif.lensModel || exif.iosOrAndroidHint) {
    const devicePanel = document.createElement("div");
    devicePanel.className = "panel p-4 sm:p-5";
    const eyebrow = document.createElement("div");
    eyebrow.className = "label-eyebrow";
    eyebrow.textContent = "What took it";
    const dl = document.createElement("dl");
    dl.className = "mt-3 grid grid-cols-2 gap-4 data-line";
    const fields: Array<[string, string | null]> = [
      ["Make", exif.cameraMake],
      ["Model", exif.cameraModel],
      ["Lens", exif.lensModel],
      ["OS hint", exif.iosOrAndroidHint],
      ["ISO", exif.exposure.iso !== null ? String(exif.exposure.iso) : null],
      ["Shutter", exif.exposure.shutter],
      ["Aperture", exif.exposure.aperture !== null ? `f/${exif.exposure.aperture}` : null],
      ["Focal", exif.exposure.focalLength !== null ? `${exif.exposure.focalLength} mm` : null],
    ];
    for (const [label, value] of fields) {
      if (!value) continue;
      const wrap = document.createElement("div");
      wrap.append(makeDt(label), makeDd(value));
      dl.appendChild(wrap);
    }
    devicePanel.append(eyebrow, dl);
    insightsCol.appendChild(devicePanel);
    rowsToReveal.push(devicePanel);
  }

  // File details
  const looksLikeOsVersion = exif.software ? /^\d{1,2}\.\d{1,2}(\.\d+)?$/.test(exif.software.trim()) : false;
  const editorSoftware = exif.software && !looksLikeOsVersion ? exif.software : null;
  const orientationLabel = humanOrientation(exif.orientation);
  const dimensions =
    exif.imageWidth && exif.imageHeight
      ? `${exif.imageWidth.toLocaleString()} x ${exif.imageHeight.toLocaleString()} (${humanMegapixels(exif.imageWidth, exif.imageHeight)})`
      : null;
  if (editorSoftware || exif.artist || exif.copyright || orientationLabel || dimensions) {
    const editPanel = document.createElement("div");
    editPanel.className = "panel p-4 sm:p-5";
    const eyebrow = document.createElement("div");
    eyebrow.className = "label-eyebrow";
    eyebrow.textContent = "File details";
    const dl = document.createElement("dl");
    dl.className = "mt-3 grid grid-cols-2 gap-4 data-line";
    const fields: Array<[string, string | null]> = [
      ["Editing software", editorSoftware],
      ["Artist", exif.artist],
      ["Copyright", exif.copyright],
      ["Orientation", orientationLabel],
      ["Dimensions", dimensions],
    ];
    for (const [label, value] of fields) {
      if (!value) continue;
      const wrap = document.createElement("div");
      wrap.append(makeDt(label), makeDd(value));
      dl.appendChild(wrap);
    }
    editPanel.append(eyebrow, dl);
    insightsCol.appendChild(editPanel);
    rowsToReveal.push(editPanel);
  }

  // Inferences
  const inferPanel = document.createElement("div");
  inferPanel.className = "panel p-4 sm:p-5";
  const inferEyebrow = document.createElement("div");
  inferEyebrow.className = "label-eyebrow";
  inferEyebrow.textContent = "What strangers can infer";
  const list = document.createElement("ul");
  list.className = "mt-3 flex flex-col gap-2";
  for (const ln of inference.lines) {
    const li = document.createElement("li");
    li.className = `rounded-lg border px-3.5 py-2.5 text-sm leading-relaxed ${severityClass(ln.severity)}`;
    const tag = document.createElement("span");
    tag.className = "mr-2 font-mono text-[10px] uppercase tracking-widest text-ink-400";
    tag.textContent = severityLabel(ln.severity);
    li.appendChild(tag);
    li.appendChild(document.createTextNode(ln.text));
    list.appendChild(li);
  }
  inferPanel.append(inferEyebrow, list);
  insightsCol.appendChild(inferPanel);
  rowsToReveal.push(inferPanel);

  staggerReveal(rowsToReveal);

  grid.append(photoCol, insightsCol);
  section.appendChild(grid);

  return {
    element: section,
    destroy() {
      mapHandle?.destroy();
      URL.revokeObjectURL(previewUrl);
    },
  };
}
