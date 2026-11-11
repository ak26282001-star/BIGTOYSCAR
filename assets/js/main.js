(() => {
  "use strict";

  const CONFIG = window.BTC_CONFIG || {};
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const root = document.documentElement;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const canAnimate = typeof Element.prototype.animate === "function";
  const EASE = "cubic-bezier(0.16, 1, 0.3, 1)";

  const escapeHtml = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  /* ------------------------------------------------------------------ *
   * Header: backdrop fades in once the page has scrolled past 80px
   * ------------------------------------------------------------------ */
  function initHeader() {
    const header = $("[data-header]");
    if (!header) return;
    const onScroll = () => header.classList.toggle("is-stuck", window.scrollY > 80);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* ------------------------------------------------------------------ *
   * Hero load sequence
   * The headline wraps wherever the browser decides, so the rendered lines
   * are measured, wrapped in masks for the reveal, and then the original
   * markup is put back so the heading keeps reflowing normally.
   * ------------------------------------------------------------------ */
  function splitLines(title) {
    const words = [];
    title.childNodes.forEach((node) => {
      const accent = node.nodeType === 1 && node.classList.contains("hero__accent");
      node.textContent.split(/\s+/).filter(Boolean).forEach((text) => words.push({ text, accent }));
    });

    title.innerHTML = words.map((w) => `<span>${escapeHtml(w.text)}</span>`).join(" ");
    const lines = [];
    let top = null;
    Array.from(title.children).forEach((span, i) => {
      if (top === null || Math.abs(span.offsetTop - top) > 2) { lines.push([]); top = span.offsetTop; }
      lines[lines.length - 1].push(words[i]);
    });

    title.innerHTML = lines.map((line, i) => {
      // Group neighbouring accent words so each line gets one red bar.
      const runs = [];
      line.forEach((w) => {
        const last = runs[runs.length - 1];
        if (last && last.accent === w.accent) last.text += ` ${w.text}`;
        else runs.push({ ...w });
      });
      const html = runs.map((r) => (r.accent
        ? `<span class="hero__accent"><span class="hero__accent-text">${escapeHtml(r.text)}</span></span>`
        : escapeHtml(r.text))).join(" ");
      return `<span class="line"><span class="line__inner" style="--i:${i}">${html}</span></span>`;
    }).join(" ");
    return lines.length;
  }

  function initHero() {
    const title = $("[data-split]");
    const start = () => root.classList.add("is-loaded");
    if (!title || reduceMotion) { start(); return; }

    // Wait briefly for the display font so the measured line breaks are the final ones.
    const fontReady = document.fonts && document.fonts.load
      ? Promise.race([document.fonts.load("800 1em Archivo", title.textContent), new Promise((r) => setTimeout(r, 400))])
      : Promise.resolve();

    fontReady.catch(() => {}).then(() => {
      const original = title.innerHTML;
      let count = 0;
      try { count = splitLines(title); } catch { title.innerHTML = original; }
      start();
      // Last line: 90ms stagger, then the bar finishes 1100ms after its line starts.
      if (count) setTimeout(() => { title.innerHTML = original; }, (count - 1) * 90 + 1250);
    });
  }

  /* ------------------------------------------------------------------ *
   * Scroll reveals: once only, when 20% of the element is visible.
   * Elements entering together are staggered by their group's data-stagger (ms).
   * ------------------------------------------------------------------ */
  const settle = (el) => { el.removeAttribute("data-reveal"); el.classList.remove("is-in"); el.style.removeProperty("--d"); };

  function initReveals() {
    const items = $$("[data-reveal]");
    if (!("IntersectionObserver" in window)) { items.forEach(settle); return; }

    const io = new IntersectionObserver((entries) => {
      const counts = new Map();
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        io.unobserve(el);
        if (!el.hasAttribute("data-reveal")) return;
        const group = el.closest("[data-stagger]");
        const n = counts.get(group) || 0;
        counts.set(group, n + 1);
        el.style.setProperty("--d", `${n * (group ? Number(group.dataset.stagger) || 0 : 0)}ms`);
        el.classList.add("is-in");
      });
    }, { threshold: 0.2 });
    items.forEach((el) => io.observe(el));

    // Once a fade has played, drop its hooks so hover and filter transforms start from a clean element.
    document.addEventListener("animationend", (e) => {
      const el = e.target;
      if (el.nodeType === 1 && el.classList.contains("is-in") && el.dataset.reveal !== "step") settle(el);
    });
  }

  /* ------------------------------------------------------------------ *
   * Cars in stock: filter with FLIP
   * Leaving cards fade and shrink (200ms), then the rest slide to their
   * new positions and any returning cards fade in (350ms).
   * ------------------------------------------------------------------ */
  function initStock() {
    const grid = $("[data-stock]");
    const buttons = $$("[data-filter]");
    if (!grid || !buttons.length) return;
    const cards = $$(".car-card", grid);
    let run = 0;

    const apply = (type) => {
      buttons.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.filter === type)));
      const match = (c) => type === "All" || c.dataset.type === type;
      const token = ++run;

      cards.forEach((c) => {
        settle(c);
        if (c.getAnimations) c.getAnimations().forEach((a) => a.cancel());
      });

      const leaving = cards.filter((c) => !c.hidden && !match(c));

      const finish = () => {
        if (token !== run) return;
        const first = new Map(cards.filter((c) => !c.hidden && match(c)).map((c) => [c, c.getBoundingClientRect()]));
        cards.forEach((c) => { c.hidden = !match(c); });
        leaving.forEach((c) => { if (c.getAnimations) c.getAnimations().forEach((a) => a.cancel()); });
        if (!canAnimate) return;

        cards.filter(match).forEach((c) => {
          const from = first.get(c);
          if (!from) {
            c.animate(reduceMotion
              ? [{ opacity: 0 }, { opacity: 1 }]
              : [{ opacity: 0, transform: "scale(0.96)" }, { opacity: 1, transform: "none" }],
            { duration: reduceMotion ? 150 : 350, easing: reduceMotion ? "linear" : EASE });
            return;
          }
          if (reduceMotion) return;
          const to = c.getBoundingClientRect();
          const dx = from.left - to.left, dy = from.top - to.top;
          if (dx || dy) c.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: "none" }], { duration: 350, easing: EASE });
        });
      };

      if (!leaving.length || !canAnimate) { finish(); return; }
      Promise.all(leaving.map((c) => c.animate(
        reduceMotion
          ? [{ opacity: 1 }, { opacity: 0 }]
          : [{ opacity: 1, transform: "none" }, { opacity: 0, transform: "scale(0.96)" }],
        { duration: reduceMotion ? 150 : 200, easing: reduceMotion ? "linear" : EASE, fill: "forwards" }
      ).finished)).then(finish, () => {});
    };

    buttons.forEach((b) => b.addEventListener("click", () => {
      if (b.getAttribute("aria-pressed") !== "true") apply(b.dataset.filter);
    }));
  }

  /* ------------------------------------------------------------------ *
   * Test drive form
   * ------------------------------------------------------------------ */
  function initBooking() {
    const wrap = $("[data-booking]");
    const form = $("[data-booking-form]");
    const done = $("[data-booking-done]");
    if (!wrap || !form || !done) return;
    const note = $("[data-booking-note]");
    const status = $("[data-booking-status]");
    const submit = $("[data-booking-submit]");
    const reset = $("[data-booking-reset]");
    const previewNote = note ? note.textContent : "";
    const swapMs = reduceMotion ? 150 : 300;

    // Fade one panel out, then fade the other up in its place.
    const swap = (from, to, after) => {
      // Hold the taller height while the confirmation is showing so the page below doesn't jump.
      if (to === done) wrap.style.minHeight = `${wrap.offsetHeight}px`;
      from.classList.add("is-leaving");
      setTimeout(() => {
        from.hidden = true;
        from.classList.remove("is-leaving");
        to.classList.add("is-entering");
        to.hidden = false;
        void to.offsetWidth; // commit the start state before transitioning
        to.classList.remove("is-entering");
        if (to === form) wrap.style.minHeight = "";
        if (after) after();
      }, swapMs);
    };

    const setStatus = (msg) => { if (status) { status.textContent = msg; status.hidden = !msg; } };

    let sending = false;
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (sending) return;
      setStatus("");

      const conf = CONFIG.testDrive || {};
      if (!conf.endpoint) {
        // Not connected yet: show the preview confirmation, which says nothing was sent.
        if (note) note.textContent = previewNote;
        swap(form, done, () => done.focus({ preventScroll: true }));
        return;
      }

      const data = new FormData(form);
      const field = (name) => String(data.get(name) || "").trim();
      const payload = {
        _subject: `Test drive request: ${field("car")}`,
        name: field("name"), phone: field("phone"), car: field("car"),
        date: field("date"), notes: field("notes"),
        page: location.href, submittedAt: new Date().toISOString()
      };

      sending = true;
      submit.disabled = true;
      submit.setAttribute("aria-busy", "true");
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), conf.timeoutMs || 15000);
      try {
        const res = await fetch(conf.endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json", ...(conf.headers || {}) },
          body: JSON.stringify(payload),
          signal: ctrl.signal
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        form.reset();
        if (note) note.textContent = "We will phone you to confirm the time and have the car ready when you arrive.";
        swap(form, done, () => done.focus({ preventScroll: true }));
      } catch (err) {
        console.error("Test drive request failed:", err);
        setStatus("Your request could not be sent. Your details are still here, so please try again or phone us.");
      } finally {
        clearTimeout(timer);
        sending = false;
        submit.disabled = false;
        submit.removeAttribute("aria-busy");
      }
    });

    if (reset) reset.addEventListener("click", () => {
      swap(done, form, () => { const first = $("input", form); if (first) first.focus({ preventScroll: true }); });
    });
  }

  initHeader();
  initHero();
  initReveals();
  initStock();
  initBooking();
})();
