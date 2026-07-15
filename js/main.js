/* I Do By Liv — site scripts */

/* ---- current year ---- */
(() => { const y = document.getElementById("yr"); if (y) y.textContent = new Date().getFullYear(); })();

/* ---- mobile menu ---- */
(() => {
  const btn = document.getElementById("hamburger");
  const menu = document.getElementById("mobileMenu");
  const close = document.getElementById("mobileClose");
  if (!btn || !menu) return;
  const open = () => menu.classList.add("open");
  const shut = () => menu.classList.remove("open");
  btn.addEventListener("click", open);
  close && close.addEventListener("click", shut);
  menu.querySelectorAll("a").forEach(a => a.addEventListener("click", shut));
})();

/* ---- reveal on scroll ---- */
(() => {
  const els = document.querySelectorAll(".reveal");
  if (!els.length) return;
  if (!("IntersectionObserver" in window)) { els.forEach(e => e.classList.add("in")); return; }
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting){ e.target.classList.add("in"); io.unobserve(e.target); } });
  }, { threshold: 0.12 });
  els.forEach(e => io.observe(e));
})();

/* ---- inquiry form (contact page) ----
   Sends to a Google Sheet / GoHighLevel webhook when configured; otherwise
   falls back to opening the visitor's email client so no lead is ever lost. */
(() => {
  // Paste the Google Apps Script Web App URL here to log inquiries to the Sheet.
  // (Step-by-step in GOOGLE-SHEETS-SETUP.md.) Until set, inquiries open a
  // pre-filled email as a safe fallback so nothing is ever lost.
  const LEAD_ENDPOINT = "";
  const FALLBACK_EMAIL = "idobyliv@idobyliv.com";

  const form = document.querySelector(".inquiry-form");
  if (!form) return;
  const thanks = document.getElementById("formThanks");
  let submitting = false;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (submitting) return;

    // validation: email + phone
    const emailEl = form.querySelector('[name="email"]');
    const phoneEl = form.querySelector('[name="phone"]');
    if (emailEl) {
      emailEl.setCustomValidity("");
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailEl.value.trim())) {
        emailEl.setCustomValidity("Please enter a valid email address."); emailEl.reportValidity(); return;
      }
    }
    if (phoneEl && phoneEl.value.trim()) {
      phoneEl.setCustomValidity("");
      const d = phoneEl.value.replace(/\D/g, "");
      if (!(d.length === 10 || (d.length === 11 && d[0] === "1"))) {
        phoneEl.setCustomValidity("Please enter a valid 10-digit phone number."); phoneEl.reportValidity(); return;
      }
    }
    if (!form.checkValidity()) { form.reportValidity(); return; }

    const body = new URLSearchParams(new FormData(form));
    const full = (body.get("fullName") || "").trim();
    if (full) { const p = full.split(/\s+/); body.set("firstName", p.shift()); body.set("lastName", p.join(" ")); }

    submitting = true;
    const btn = form.querySelector('[type="submit"]');
    if (btn) { btn.disabled = true; btn.dataset.label = btn.textContent; btn.textContent = "Sending…"; }

    // No endpoint configured yet → open a pre-filled email so inquiries still reach Liv.
    if (!LEAD_ENDPOINT) {
      const subject = encodeURIComponent("Wedding Hair Inquiry — " + (full || "Website"));
      const lines = [...body.entries()]
        .filter(([k]) => !["firstName","lastName"].includes(k))
        .map(([k, v]) => `${k}: ${v}`).join("\n");
      window.location.href = `mailto:${FALLBACK_EMAIL}?subject=${subject}&body=${encodeURIComponent(lines)}`;
      form.style.display = "none";
      if (thanks) thanks.style.display = "block";
      return;
    }

    try {
      await fetch(LEAD_ENDPOINT, { method: "POST", body, mode: "no-cors" });
      form.style.display = "none";
      if (thanks) thanks.style.display = "block";
      form.reset();
    } catch (err) {
      console.error(err);
      submitting = false;
      if (btn) { btn.disabled = false; btn.textContent = btn.dataset.label || "Send"; }
      alert("Something went wrong. Please email " + FALLBACK_EMAIL + ".");
    }
  });

  ["email","phone"].forEach(n => {
    const el = form.querySelector('[name="'+n+'"]');
    if (el) el.addEventListener("input", () => el.setCustomValidity(""));
  });
})();
