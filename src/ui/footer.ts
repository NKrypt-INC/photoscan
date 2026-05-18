const REPO_URL = "https://github.com/NKrypt-INC/photoscan";

export function buildFooter(): HTMLElement {
  const footer = document.createElement("footer");
  footer.className = "mt-16 border-t border-ink-800";

  const wrap = document.createElement("div");
  wrap.className = "container-page py-10 grid grid-cols-1 sm:grid-cols-3 gap-8 text-sm text-ink-300";

  // About
  const about = document.createElement("div");
  const aboutTitle = document.createElement("div");
  aboutTitle.className = "label-eyebrow";
  aboutTitle.textContent = "About";
  const aboutBody = document.createElement("p");
  aboutBody.className = "mt-3 leading-relaxed";
  aboutBody.textContent =
    "NKrypt is a cybersecurity company. PhotoScan is our free privacy tool, built so anyone can see what a photo gives away in a few seconds.";
  const aboutLink = document.createElement("a");
  aboutLink.href = "https://nkrypt.com";
  aboutLink.className = "mt-3 inline-block text-accent hover:text-accent-bright";
  aboutLink.textContent = "nkrypt.com";
  aboutLink.target = "_blank";
  aboutLink.rel = "noopener";
  about.append(aboutTitle, aboutBody, aboutLink);

  // Trust
  const trust = document.createElement("div");
  const trustTitle = document.createElement("div");
  trustTitle.className = "label-eyebrow";
  trustTitle.textContent = "Trust";
  const trustBody = document.createElement("p");
  trustBody.className = "mt-3 leading-relaxed";
  trustBody.textContent = "Your photos never leave your browser. Here is the source code.";
  const trustLink = document.createElement("a");
  trustLink.href = REPO_URL;
  trustLink.className = "mt-3 inline-block text-accent hover:text-accent-bright";
  trustLink.textContent = "github.com/NKrypt-INC/photoscan";
  trustLink.target = "_blank";
  trustLink.rel = "noopener";
  trust.append(trustTitle, trustBody, trustLink);

  // Other tools
  const other = document.createElement("div");
  const otherTitle = document.createElement("div");
  otherTitle.className = "label-eyebrow";
  otherTitle.textContent = "Other tools";
  const otherBody = document.createElement("p");
  otherBody.className = "mt-3 leading-relaxed";
  otherBody.textContent =
    "PhotoScan Pro is on the way: a written analyst report for a single photo, with location-only public-record context. Subscribe above for the launch note.";
  other.append(otherTitle, otherBody);

  wrap.append(about, trust, other);

  const sub = document.createElement("div");
  sub.className =
    "container-page border-t border-ink-800 py-6 text-xs font-mono text-ink-400 flex flex-wrap items-center justify-between gap-2";
  const left = document.createElement("div");
  left.textContent = "(c) NKrypt, Inc. MIT licensed.";
  const right = document.createElement("div");
  right.textContent = "no analytics on your photo, no third-party trackers";
  sub.append(left, right);

  footer.append(wrap, sub);
  return footer;
}
