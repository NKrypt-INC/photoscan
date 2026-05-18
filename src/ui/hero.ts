export interface HeroHandle {
  element: HTMLElement;
  setBusy(busy: boolean): void;
  setError(message: string | null): void;
}

const ACCEPTED =
  "image/jpeg,image/jpg,image/png,image/heic,image/heif,image/tiff,image/webp,.heic,.heif,.tif,.tiff,.jpg,.jpeg,.png,.webp";

export function buildHero(onFile: (file: File) => void): HeroHandle {
  const section = document.createElement("section");
  section.className = "container-page pt-12 pb-10 sm:pt-20 sm:pb-16";

  const eyebrow = document.createElement("div");
  eyebrow.className = "flex items-center gap-2";
  const dot = document.createElement("span");
  dot.className = "accent-dot";
  const eyebrowText = document.createElement("span");
  eyebrowText.className = "label-eyebrow";
  eyebrowText.textContent = "NKrypt PhotoScan, v1, free";
  eyebrow.append(dot, eyebrowText);

  const h1 = document.createElement("h1");
  h1.className = "mt-5 text-4xl sm:text-5xl md:text-6xl font-semibold tracking-tight text-ink-50 leading-[1.05]";
  h1.textContent = "See what your photos give away.";

  const sub = document.createElement("p");
  sub.className = "mt-5 max-w-2xl text-base sm:text-lg text-ink-300 leading-relaxed";
  sub.textContent =
    "Drop a photo. Get a plain-language readout of the GPS, time, device, and edit trail it carries. Download a cleaned copy. Everything runs in your browser. The file never leaves your device.";

  const dropZone = document.createElement("label");
  dropZone.className = "drop-zone mt-10 cursor-pointer block";
  dropZone.setAttribute("role", "button");
  dropZone.setAttribute("tabindex", "0");
  dropZone.setAttribute("aria-label", "Drop a photo or click to choose one");

  const input = document.createElement("input");
  input.type = "file";
  input.accept = ACCEPTED;
  input.className = "sr-only";
  input.setAttribute("aria-hidden", "true");

  const inner = document.createElement("div");
  inner.className = "pointer-events-none";

  const big = document.createElement("div");
  big.className = "text-xl sm:text-2xl font-medium text-ink-100";
  big.textContent = "Drop a photo here, or click to choose";

  const small = document.createElement("div");
  small.className = "mt-3 text-sm text-ink-400";
  small.textContent = "JPG, PNG, HEIC, HEIF, TIFF, WebP. Nothing is uploaded.";

  const trust = document.createElement("div");
  trust.className = "mt-6 flex flex-wrap items-center justify-center gap-2";
  for (const t of ["browser only", "no account", "no tracking", "open source"]) {
    const pill = document.createElement("span");
    pill.className = "pill";
    pill.textContent = t;
    trust.appendChild(pill);
  }

  inner.append(big, small, trust);
  dropZone.append(input, inner);

  const status = document.createElement("div");
  status.className = "mt-4 min-h-[1.5rem] text-sm";
  status.setAttribute("role", "status");
  status.setAttribute("aria-live", "polite");

  const mcafee = document.createElement("p");
  mcafee.className =
    "mt-8 max-w-2xl text-sm text-ink-400 leading-relaxed border-l-2 border-ink-700 pl-4";
  mcafee.textContent =
    "In 2012, John McAfee's hideout in Guatemala was revealed by GPS data embedded in a single Vice photo. He was arrested within hours. Every photo carries something like that. Most are quieter, none are silent.";

  section.append(eyebrow, h1, sub, dropZone, status, mcafee);

  const handleFile = (file: File | null | undefined) => {
    if (!file) return;
    if (!file.type && !/\.(jpe?g|png|heic|heif|tif{1,2}|webp)$/i.test(file.name)) {
      status.textContent = "That file does not look like a photo. Try a JPG, PNG, or HEIC.";
      status.className = "mt-4 min-h-[1.5rem] text-sm text-alarm";
      return;
    }
    status.textContent = "";
    onFile(file);
  };

  input.addEventListener("change", () => {
    handleFile(input.files?.[0]);
    input.value = "";
  });

  dropZone.addEventListener("dragenter", (e) => {
    e.preventDefault();
    dropZone.classList.add("is-drag");
  });
  dropZone.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropZone.classList.add("is-drag");
  });
  dropZone.addEventListener("dragleave", () => dropZone.classList.remove("is-drag"));
  dropZone.addEventListener("drop", (e) => {
    e.preventDefault();
    dropZone.classList.remove("is-drag");
    const f = e.dataTransfer?.files?.[0];
    handleFile(f);
  });

  dropZone.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      input.click();
    }
  });

  return {
    element: section,
    setBusy(busy) {
      if (busy) {
        status.textContent = "Reading the file in your browser. This takes a moment.";
        status.className = "mt-4 min-h-[1.5rem] text-sm text-ink-300";
        dropZone.classList.add("opacity-60", "pointer-events-none");
      } else {
        dropZone.classList.remove("opacity-60", "pointer-events-none");
      }
    },
    setError(message) {
      if (!message) {
        status.textContent = "";
        return;
      }
      status.textContent = message;
      status.className = "mt-4 min-h-[1.5rem] text-sm text-alarm";
    },
  };
}
