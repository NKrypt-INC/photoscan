import type { ProvenanceResult, ProvenanceSeverity } from "../provenance";

function severityClass(s: ProvenanceSeverity): string {
  switch (s) {
    case "high":
      return "border-alarm/40 bg-alarm/10 text-ink-50";
    case "medium":
      return "border-accent/30 bg-accent/5 text-ink-50";
    case "low":
      return "border-ink-700 bg-ink-900 text-ink-200";
    case "info":
      return "border-ink-700 bg-ink-900 text-ink-300";
  }
}

function severityLabel(s: ProvenanceSeverity): string {
  switch (s) {
    case "high":
      return "ai-generated";
    case "medium":
      return "ai-edited";
    case "low":
      return "edited";
    case "info":
      return "no fingerprint";
  }
}

export function buildProvenancePanel(result: ProvenanceResult): HTMLElement {
  const panel = document.createElement("div");
  panel.className = "panel p-4 sm:p-5 reveal-row";
  panel.style.animationDelay = "640ms";

  const head = document.createElement("div");
  head.className = "flex items-center justify-between gap-3";
  const eyebrow = document.createElement("div");
  eyebrow.className = "label-eyebrow";
  eyebrow.textContent = "Provenance and AI fingerprint";

  const subHead = document.createElement("div");
  subHead.className = "text-[11px] font-mono uppercase tracking-widest text-ink-400";
  subHead.textContent = result.hasContentCredentials ? "C2PA present" : "no C2PA";
  head.append(eyebrow, subHead);

  const blurb = document.createElement("p");
  blurb.className = "mt-2 text-sm text-ink-300 leading-relaxed";
  blurb.textContent =
    "Deterministic signals only. Every line below is something the file literally says about itself in its metadata or a signed manifest. No guessing, no probability scores.";

  const list = document.createElement("ul");
  list.className = "mt-3 flex flex-col gap-2";

  for (const finding of result.findings) {
    const li = document.createElement("li");
    li.className = `rounded-lg border px-3.5 py-2.5 text-sm leading-relaxed ${severityClass(finding.severity)}`;
    const tag = document.createElement("span");
    tag.className = "mr-2 font-mono text-[10px] uppercase tracking-widest text-ink-400";
    tag.textContent = severityLabel(finding.severity);
    li.appendChild(tag);
    const strong = document.createElement("strong");
    strong.className = "text-ink-50";
    strong.textContent = `${finding.label}. `;
    li.appendChild(strong);
    li.appendChild(document.createTextNode(finding.text));
    if (finding.source) {
      const src = document.createElement("div");
      src.className = "mt-1 font-mono text-[10px] uppercase tracking-widest text-ink-400";
      src.textContent = `source: ${finding.source}`;
      li.appendChild(src);
    }
    list.appendChild(li);
  }

  panel.append(head, blurb, list);

  if (result.hasContentCredentials && result.contentCredentialsUrl) {
    const verifyWrap = document.createElement("div");
    verifyWrap.className = "mt-4 flex flex-wrap items-center gap-3";
    const link = document.createElement("a");
    link.href = result.contentCredentialsUrl;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.className = "btn-ghost";
    link.textContent = "Verify the C2PA manifest →";
    verifyWrap.appendChild(link);
    const note = document.createElement("div");
    note.className = "text-xs text-ink-400";
    note.textContent = "Drag this file onto contentcredentials.org to see the full signed history.";
    verifyWrap.appendChild(note);
    panel.appendChild(verifyWrap);
  }

  return panel;
}
