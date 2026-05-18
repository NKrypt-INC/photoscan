const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const DEFAULT_ENDPOINT = "/api/subscribe";

export function buildEmailCapture(endpoint = DEFAULT_ENDPOINT): HTMLElement {
  const section = document.createElement("section");
  section.className = "container-page";

  const panel = document.createElement("div");
  panel.className = "panel p-5 sm:p-7";

  const eyebrow = document.createElement("div");
  eyebrow.className = "label-eyebrow";
  eyebrow.textContent = "Optional";

  const title = document.createElement("h3");
  title.className = "mt-2 text-lg sm:text-xl font-semibold text-ink-50";
  title.textContent = "The NKrypt Privacy Brief.";

  const body = document.createElement("p");
  body.className = "mt-1.5 text-sm text-ink-300";
  body.textContent = "One short email a month. One practical tip. No spam, no upsell.";

  const form = document.createElement("form");
  form.className = "mt-4 flex flex-col sm:flex-row gap-2";
  form.noValidate = true;

  const input = document.createElement("input");
  input.type = "email";
  input.required = true;
  input.placeholder = "you@example.com";
  input.autocomplete = "email";
  input.className =
    "flex-1 rounded-lg border border-ink-700 bg-ink-950 px-4 py-3 text-sm text-ink-50 placeholder:text-ink-400 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40";

  const submit = document.createElement("button");
  submit.type = "submit";
  submit.className = "btn-primary";
  submit.textContent = "Subscribe";

  const status = document.createElement("div");
  status.className = "mt-2 min-h-[1.25rem] text-xs font-mono text-ink-400";
  status.setAttribute("aria-live", "polite");

  form.append(input, submit);

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = input.value.trim();
    if (!EMAIL_RE.test(email) || email.length > 254) {
      status.textContent = "That email does not look right.";
      status.className = "mt-2 min-h-[1.25rem] text-xs font-mono text-alarm";
      return;
    }
    submit.disabled = true;
    submit.textContent = "Sending...";
    status.textContent = "";
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        form.replaceChildren();
        const ok = document.createElement("div");
        ok.className = "text-sm text-ink-100";
        ok.textContent = "Thanks. You will hear from NKrypt once a month, and never more.";
        form.appendChild(ok);
        status.textContent = "";
      } else if (res.status === 400) {
        status.textContent = "That email did not pass validation.";
        status.className = "mt-2 min-h-[1.25rem] text-xs font-mono text-alarm";
      } else {
        status.textContent = "Could not subscribe right now. Try again later.";
        status.className = "mt-2 min-h-[1.25rem] text-xs font-mono text-alarm";
      }
    } catch {
      status.textContent = "Network error. Try again in a moment.";
      status.className = "mt-2 min-h-[1.25rem] text-xs font-mono text-alarm";
    } finally {
      submit.disabled = false;
      submit.textContent = "Subscribe";
    }
  });

  panel.append(eyebrow, title, body, form, status);
  section.appendChild(panel);
  return section;
}
