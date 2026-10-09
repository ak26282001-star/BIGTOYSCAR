(() => {
  "use strict";

  const CONFIG = window.BTC_CONFIG || {};
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const storage = {
    get(key) { try { return JSON.parse(localStorage.getItem(key)); } catch { return null; } },
    set(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* private mode etc. */ } }
  };

  const currency = CONFIG.currency || { code: "GBP", locale: "en-GB" };
  const money = (n) => {
    try {
      return new Intl.NumberFormat(currency.locale, { style: "currency", currency: currency.code, maximumFractionDigits: 0 }).format(n);
    } catch { return String(Math.round(n)); }
  };

  /* ------------------------------------------------------------------ *
   * Header + navigation
   * ------------------------------------------------------------------ */
  function initNav() {
    const header = $("[data-header]");
    const toggle = $("[data-nav-toggle]");
    const menu = $("[data-nav-menu]");
    if (!header || !toggle || !menu) return;

    const setOpen = (open) => {
      toggle.setAttribute("aria-expanded", String(open));
      toggle.querySelector(".nav__toggle-label").textContent = open ? "Close" : "Menu";
      header.classList.toggle("is-open", open);
      document.body.classList.toggle("nav-open", open);
    };

    toggle.addEventListener("click", () => setOpen(toggle.getAttribute("aria-expanded") !== "true"));
    menu.addEventListener("click", (e) => { if (e.target.closest("a")) setOpen(false); });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && header.classList.contains("is-open")) { setOpen(false); toggle.focus(); }
    });
    document.addEventListener("click", (e) => {
      if (header.classList.contains("is-open") && !header.contains(e.target)) setOpen(false);
    });
    window.matchMedia("(min-width: 900px)").addEventListener("change", (mq) => { if (mq.matches) setOpen(false); });

    const onScroll = () => header.classList.toggle("is-scrolled", window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    // Highlight the section currently in view
    if ("IntersectionObserver" in window) {
      const links = $$('a[href^="#"]', menu).filter((a) => a.getAttribute("href").length > 1);
      const byId = new Map(links.map((a) => [a.getAttribute("href").slice(1), a]));
      const io = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          const link = byId.get(entry.target.id);
          if (!link) return;
          if (entry.isIntersecting) {
            links.forEach((l) => l.removeAttribute("aria-current"));
            link.setAttribute("aria-current", "true");
          }
        });
      }, { rootMargin: "-45% 0px -50% 0px" });
      byId.forEach((_, id) => { const el = document.getElementById(id); if (el) io.observe(el); });
    }
  }

  /* ------------------------------------------------------------------ *
   * Motion: reveals, word-by-word statement, parallax, counters
   * ------------------------------------------------------------------ */
  function initMotion() {
    requestAnimationFrame(() => document.body.classList.add("is-loaded"));

    const reveals = $$(".reveal");
    if (reduceMotion || !("IntersectionObserver" in window)) {
      reveals.forEach((el) => el.classList.add("is-in"));
    } else {
      const io = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) { entry.target.classList.add("is-in"); io.unobserve(entry.target); }
        });
      }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
      reveals.forEach((el) => io.observe(el));
    }

    // Statement: words light up as the paragraph scrolls through the viewport
    const statement = $("[data-words]");
    let words = [];
    if (statement) {
      const text = statement.textContent.trim().replace(/\s+/g, " ");
      statement.setAttribute("aria-label", text);
      statement.innerHTML = text.split(" ").map((w) => `<span class="w" aria-hidden="true">${w} </span>`).join("");
      words = $$(".w", statement);
      if (reduceMotion) words.forEach((w) => w.classList.add("on"));
    }

    const heroCar = $("[data-parallax]");
    let ticking = false;
    const onScroll = () => {
      ticking = false;
      const vh = window.innerHeight;
      if (statement && words.length && !reduceMotion) {
        const r = statement.getBoundingClientRect();
        const progress = Math.min(1, Math.max(0, (vh * 0.85 - r.top) / (r.height + vh * 0.35)));
        const lit = Math.round(progress * words.length);
        words.forEach((w, i) => w.classList.toggle("on", i < lit));
      }
      if (heroCar && !reduceMotion && window.scrollY < vh * 1.2) {
        heroCar.style.setProperty("--py", `${window.scrollY * 0.18}px`);
      }
    };
    window.addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
    onScroll();

    // Count-up numbers
    const counters = $$("[data-count]");
    if (!reduceMotion && "IntersectionObserver" in window) {
      const io = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          io.unobserve(entry.target);
          const el = entry.target, end = Number(el.dataset.count), start = performance.now(), dur = 1400;
          const step = (t) => {
            const p = Math.min(1, (t - start) / dur);
            el.textContent = String(Math.round(end * (1 - Math.pow(1 - p, 3))));
            if (p < 1) requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
        });
      }, { threshold: 0.6 });
      counters.forEach((el) => { el.textContent = "0"; io.observe(el); });
    }
  }

  /* ------------------------------------------------------------------ *
   * Before / after comparison
   * ------------------------------------------------------------------ */
  function initCompare() {
    const wrap = $("[data-compare]");
    const range = $("[data-compare-range]");
    if (!wrap || !range) return;
    const update = () => {
      wrap.style.setProperty("--pos", `${range.value}%`);
      range.setAttribute("aria-valuetext", `${range.value}% Nightfall`);
    };
    range.addEventListener("input", update);
    update();
  }

  /* ------------------------------------------------------------------ *
   * Configurator
   * ------------------------------------------------------------------ */
  const OPTIONS = {
    paint: [
      { id: "obsidian", label: "Satin Obsidian", color: "#16171a" },
      { id: "platinum", label: "Liquid Platinum", color: "#8e939a" },
      { id: "verde", label: "Verde Profondo", color: "#1c3a2c" },
      { id: "ember", label: "Ember Red", color: "#7a1f12" },
      { id: "chalk", label: "Chalk", color: "#cfcac0" }
    ],
    wheel: [
      { id: "monoblock", label: "Monoblock 5-spoke" },
      { id: "mesh", label: "Cross-spoke mesh" },
      { id: "turbofan", label: "Turbofan" }
    ],
    finish: [
      { id: "bronze", label: "Satin Bronze", color: "#a17a4a" },
      { id: "gunmetal", label: "Gunmetal", color: "#4a4d52" },
      { id: "silver", label: "Hyper Silver", color: "#c3c7cc" }
    ],
    caliper: [
      { id: "stock", label: "Factory black", color: "#2a2a2c" },
      { id: "bronze", label: "Champagne", color: "#c8a46a" },
      { id: "red", label: "Signal red", color: "#c4271b" },
      { id: "yellow", label: "Racing yellow", color: "#e1b622" }
    ],
    stance: [
      { id: "factory", label: "Factory height" },
      { id: "lowered", label: "Lowered 35 mm" }
    ],
    packages: [
      { id: "aero", label: "Aero kit", note: "Splitter, side blades, ducktail" },
      { id: "tune", label: "Performance tune", note: "Intake, exhaust, calibration" },
      { id: "interior", label: "Interior retrim", note: "Leather & Alcantara" },
      { id: "lighting", label: "Lighting signature", note: "Custom DRL & smoked tails" },
      { id: "ceramic", label: "Ceramic protection", note: "Correction + 5-year coating" }
    ]
  };
  const DEFAULTS = { paint: "obsidian", wheel: "monoblock", finish: "bronze", caliper: "bronze", stance: "lowered", packages: ["aero"] };
  const STORAGE_KEY = "btc.build.v1";
  const SINGLE = ["paint", "wheel", "finish", "caliper", "stance"];

  const find = (group, id) => OPTIONS[group].find((o) => o.id === id);

  function sanitize(raw) {
    const out = { ...DEFAULTS, packages: [...DEFAULTS.packages] };
    if (!raw || typeof raw !== "object") return out;
    SINGLE.forEach((g) => { if (typeof raw[g] === "string" && find(g, raw[g])) out[g] = raw[g]; });
    if (Array.isArray(raw.packages)) out.packages = raw.packages.filter((p) => find("packages", p));
    return out;
  }

  function fromUrl() {
    const params = new URLSearchParams(window.location.search);
    if (!SINGLE.some((g) => params.has(g)) && !params.has("pkg")) return null;
    const raw = {};
    SINGLE.forEach((g) => { if (params.has(g)) raw[g] = params.get(g); });
    raw.packages = params.has("pkg") ? params.get("pkg").split(",").filter(Boolean) : [];
    return raw;
  }

  function toUrl(state) {
    const params = new URLSearchParams();
    SINGLE.forEach((g) => params.set(g, state[g]));
    params.set("pkg", state.packages.join(","));
    return `${location.origin}${location.pathname}?${params.toString()}#configurator`;
  }

  function estimate(state) {
    const p = CONFIG.pricing;
    if (!p) return null;
    let total = Number(p.base) || 0;
    SINGLE.forEach((g) => { total += Number(p[g] && p[g][state[g]]) || 0; });
    state.packages.forEach((id) => { total += Number(p.packages && p.packages[id]) || 0; });
    const factor = Number(p.rangeFactor) || 1.3;
    const round = (n) => Math.round(n / 100) * 100;
    return { min: round(total), max: round(total * factor), currency: currency.code };
  }

  function describe(state) {
    const lines = SINGLE.map((g) => ({ group: g, label: find(g, state[g]).label }));
    const pk = state.packages.map((id) => find("packages", id).label);
    return { lines, packages: pk };
  }

  const GROUP_NAMES = { paint: "Paint", wheel: "Wheels", finish: "Wheel finish", caliper: "Calipers", stance: "Stance" };

  let buildState = sanitize(fromUrl() || storage.get(STORAGE_KEY));
  const buildListeners = [];

  function initConfigurator() {
    const form = $("[data-config-form]");
    const car = $("[data-config-car]");
    if (!form || !car) return;

    // Build the controls from OPTIONS so labels, state and pricing stay in one place.
    SINGLE.forEach((group) => {
      const host = $(`[data-options="${group}"]`, form);
      const isSwatch = OPTIONS[group][0].color !== undefined;
      host.innerHTML = OPTIONS[group].map((o) => `
        <label class="${isSwatch ? "swatch" : "chip"}" ${isSwatch ? `style="--c:${o.color}" title="${o.label}"` : ""}>
          <input type="radio" name="${group}" value="${o.id}">
          ${isSwatch ? `<span class="swatch__dot" aria-hidden="true"></span><span class="visually-hidden">${o.label}</span>` : `<span>${o.label}</span>`}
        </label>`).join("");
    });
    $('[data-options="packages"]', form).innerHTML = OPTIONS.packages.map((o) => `
      <label class="check check--card">
        <input type="checkbox" name="packages" value="${o.id}">
        <span class="check__box" aria-hidden="true"></span>
        <span class="check__text"><strong>${o.label}</strong><small>${o.note}</small></span>
      </label>`).join("");

    const caption = $("[data-config-caption]");
    const estimateEl = $("[data-estimate]");
    const toast = $("[data-config-toast]");

    const syncInputs = () => {
      SINGLE.forEach((g) => { const input = form.querySelector(`input[name="${g}"][value="${buildState[g]}"]`); if (input) input.checked = true; });
      $$('input[name="packages"]', form).forEach((i) => { i.checked = buildState.packages.includes(i.value); });
    };

    const render = () => {
      const s = buildState;
      const paint = find("paint", s.paint), finish = find("finish", s.finish), caliper = find("caliper", s.caliper);
      const st = car.style;
      st.setProperty("--paint", paint.color);
      st.setProperty("--rim", finish.color);
      st.setProperty("--caliper", caliper.color);
      st.setProperty("--w-spoke", s.wheel === "monoblock" ? 1 : 0);
      st.setProperty("--w-mesh", s.wheel === "mesh" ? 1 : 0);
      st.setProperty("--w-fan", s.wheel === "turbofan" ? 1 : 0);
      st.setProperty("--drop", s.stance === "lowered" ? "9px" : "0px");
      st.setProperty("--aero", s.packages.includes("aero") ? 1 : 0);
      st.setProperty("--lamp", s.packages.includes("lighting") ? "#d8ecff" : "#f4efe6");
      $(".config__stage").style.setProperty("--glow", paint.color);

      SINGLE.forEach((g) => { const el = $(`[data-value-for="${g}"]`); if (el) el.textContent = find(g, s[g]).label; });
      caption.textContent = `${paint.label} · ${find("wheel", s.wheel).label} in ${finish.label.toLowerCase()}`;
      const est = estimate(s);
      estimateEl.textContent = est && est.min > 0 ? `${money(est.min)} – ${money(est.max)}` : "On consultation";

      storage.set(STORAGE_KEY, s);
      buildListeners.forEach((fn) => fn(s));
    };

    form.addEventListener("change", (e) => {
      const t = e.target;
      if (t.name === "packages") {
        buildState = { ...buildState, packages: $$('input[name="packages"]:checked', form).map((i) => i.value) };
      } else if (SINGLE.includes(t.name)) {
        buildState = { ...buildState, [t.name]: t.value };
      }
      render();
    });
    form.addEventListener("submit", (e) => e.preventDefault());

    let toastTimer;
    const showToast = (msg) => {
      toast.textContent = msg;
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => { toast.textContent = ""; }, 3200);
    };

    $("[data-config-reset]").addEventListener("click", () => {
      buildState = sanitize(null);
      syncInputs();
      render();
      showToast("Reset to the Nightfall spec");
    });

    $("[data-config-share]").addEventListener("click", async () => {
      const url = toUrl(buildState);
      try {
        await navigator.clipboard.writeText(url);
        showToast("Link copied");
      } catch {
        window.prompt("Copy this link to share your spec:", url);
      }
    });

    $("[data-config-to-quote]").addEventListener("click", () => {
      const include = $("[data-include-spec]");
      if (include) include.checked = true;
    });

    syncInputs();
    render();
  }

  /* ------------------------------------------------------------------ *
   * Quote form
   * ------------------------------------------------------------------ */
  function initQuote() {
    const form = $("[data-quote-form]");
    if (!form) return;
    const list = $("[data-build-list]");
    const includeSpec = $("[data-include-spec]");
    const status = $("[data-form-status]");
    const submit = $("[data-submit]");

    // Currency prefix on budget ranges
    try {
      const symbol = new Intl.NumberFormat(currency.locale, { style: "currency", currency: currency.code }).formatToParts(0).find((p) => p.type === "currency").value;
      $$('#q-budget option', form).forEach((o) => { if (/^\d|Under/.test(o.textContent)) o.textContent = o.textContent.replace(/(\d[\d,]*)/g, `${symbol}$1`); });
    } catch { /* leave unprefixed */ }

    const renderCard = (s) => {
      if (!list) return;
      const d = describe(s);
      const est = estimate(s);
      list.innerHTML = d.lines.map((l) => `<li><span class="mono">${GROUP_NAMES[l.group]}</span><span>${l.label}</span></li>`).join("")
        + `<li><span class="mono">Packages</span><span>${d.packages.length ? d.packages.join(", ") : "None"}</span></li>`
        + (est && est.min > 0 ? `<li class="build-card__est"><span class="mono">Estimate</span><span>${money(est.min)} – ${money(est.max)}</span></li>` : "");
    };
    buildListeners.push(renderCard);
    renderCard(buildState);

    const validators = {
      name: (v) => v.trim().length >= 2 || "Please enter your name.",
      email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) || "Please enter a valid email address.",
      phone: (v) => !v.trim() || /^[+()\d\s.-]{7,32}$/.test(v.trim()) || "Please enter a valid phone number, or leave it blank.",
      vehicle: (v) => v.trim().length >= 3 || "Tell us which car this is for.",
      budget: (v) => !!v || "Please choose a budget range.",
      message: (v) => v.trim().length >= 10 || "A sentence or two helps us prepare (at least 10 characters).",
      consent: (_, el) => el.checked || "Please confirm we may contact you."
    };

    const showError = (el, msg) => {
      const err = document.getElementById(`${el.getAttribute("aria-describedby")}`);
      el.setAttribute("aria-invalid", msg ? "true" : "false");
      el.closest(".field").classList.toggle("has-error", !!msg);
      if (err) err.textContent = msg || "";
    };

    const validateField = (el) => {
      const fn = validators[el.name];
      if (!fn) return true;
      const res = fn(el.value, el);
      showError(el, res === true ? "" : res);
      return res === true;
    };

    let attempted = false;
    form.addEventListener("blur", (e) => { if (validators[e.target.name] && (attempted || e.target.value)) validateField(e.target); }, true);
    form.addEventListener("input", (e) => { if (e.target.getAttribute("aria-invalid") === "true") validateField(e.target); });
    form.addEventListener("change", (e) => { if (e.target.type === "checkbox" || e.target.tagName === "SELECT") { if (attempted) validateField(e.target); } });

    const setStatus = (msg, kind) => {
      status.innerHTML = msg;
      status.dataset.kind = kind || "";
    };

    const contactFallback = () => {
      const c = CONFIG.contact || {};
      const bits = [];
      if (c.email) bits.push(`<a href="mailto:${encodeURIComponent(c.email).replace("%40", "@")}">${escapeHtml(c.email)}</a>`);
      if (c.phone) bits.push(`<a href="tel:${c.phone.replace(/[^\d+]/g, "")}">${escapeHtml(c.phone)}</a>`);
      return bits.length ? ` Please reach us directly at ${bits.join(" or ")}.` : " Please try again later.";
    };

    let sending = false;
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (sending) return;
      attempted = true;

      const fields = $$("input, select, textarea", form).filter((el) => validators[el.name]);
      const invalid = fields.filter((el) => !validateField(el));
      if (invalid.length) {
        setStatus(`Please check the ${invalid.length === 1 ? "highlighted field" : `${invalid.length} highlighted fields`}.`, "error");
        invalid[0].focus();
        return;
      }

      const data = new FormData(form);
      // Honeypot: bots fill the hidden field. Quietly accept and drop.
      if ((data.get("company") || "").trim()) {
        setStatus("Thank you. Your request has been sent.", "success");
        form.reset();
        return;
      }

      const withSpec = includeSpec ? includeSpec.checked : true;
      const d = describe(buildState);
      const est = estimate(buildState);
      const payload = {
        _subject: `Quote request: ${String(data.get("vehicle")).trim()}`,
        name: String(data.get("name")).trim(),
        email: String(data.get("email")).trim(),
        _replyto: String(data.get("email")).trim(),
        phone: String(data.get("phone") || "").trim(),
        vehicle: String(data.get("vehicle")).trim(),
        budget: String(data.get("budget")),
        timeline: String(data.get("timeline") || "Flexible"),
        message: String(data.get("message")).trim(),
        consent: true,
        build: withSpec ? {
          paint: buildState.paint, wheel: buildState.wheel, finish: buildState.finish,
          caliper: buildState.caliper, stance: buildState.stance, packages: buildState.packages,
          estimate: est, shareUrl: toUrl(buildState)
        } : null,
        // Flat, human-readable copy for email-based form backends
        buildSummary: withSpec
          ? d.lines.map((l) => `${GROUP_NAMES[l.group]}: ${l.label}`).concat(`Packages: ${d.packages.join(", ") || "None"}`, est && est.min > 0 ? `Estimate: ${money(est.min)} – ${money(est.max)}` : "").filter(Boolean).join("\n")
          : "Not included",
        page: location.href,
        submittedAt: new Date().toISOString()
      };

      const endpoint = CONFIG.quote && CONFIG.quote.endpoint;
      if (!endpoint) {
        console.warn("[Big Toys Customs] Quote endpoint is not configured (assets/js/config.js → quote.endpoint). Request was not sent.");
        setStatus(`Online requests aren’t available right now.${contactFallback()}`, "error");
        return;
      }

      sending = true;
      submit.disabled = true;
      submit.setAttribute("aria-busy", "true");
      form.classList.add("is-sending");
      setStatus("Sending your request…", "pending");

      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), (CONFIG.quote && CONFIG.quote.timeoutMs) || 15000);
      try {
        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json", ...((CONFIG.quote && CONFIG.quote.headers) || {}) },
          body: JSON.stringify(payload),
          signal: ctrl.signal
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        form.reset();
        $$("[aria-invalid]", form).forEach((el) => showError(el, ""));
        attempted = false;
        if (includeSpec) includeSpec.checked = true;
        setStatus("Thank you. Your request has been sent. We’ll be in touch within two working days.", "success");
      } catch (err) {
        console.error("[Big Toys Customs] Quote submission failed:", err);
        const reason = err.name === "AbortError" ? "The request timed out." : "Something went wrong sending your request.";
        setStatus(`${reason} Your details are still here, so you can try again.${contactFallback()}`, "error");
      } finally {
        clearTimeout(timer);
        sending = false;
        submit.disabled = false;
        submit.removeAttribute("aria-busy");
        form.classList.remove("is-sending");
      }
    });
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  /* ------------------------------------------------------------------ *
   * Contact details + footer
   * ------------------------------------------------------------------ */
  function initContact() {
    const c = CONFIG.contact || {};
    const items = [];
    if (c.email) items.push(`<li><span class="mono">Email</span><a href="mailto:${escapeHtml(c.email)}">${escapeHtml(c.email)}</a></li>`);
    if (c.phone) items.push(`<li><span class="mono">Phone</span><a href="tel:${escapeHtml(c.phone.replace(/[^\d+]/g, ""))}">${escapeHtml(c.phone)}</a></li>`);
    if (c.address) items.push(`<li><span class="mono">Studio</span><span>${escapeHtml(c.address)}</span></li>`);
    if (c.instagram) items.push(`<li><span class="mono">Instagram</span><a href="https://instagram.com/${escapeHtml(c.instagram.replace(/^@/, ""))}" rel="noopener" target="_blank">@${escapeHtml(c.instagram.replace(/^@/, ""))}</a></li>`);

    const lines = $("[data-contact-lines]");
    const footer = $("[data-footer-contact]");
    if (items.length) {
      if (lines) { lines.innerHTML = items.join(""); lines.hidden = false; }
      if (footer) footer.innerHTML = items.join("");
    }
    const year = $("[data-year]");
    if (year) year.textContent = String(new Date().getFullYear());
  }

  initNav();
  initMotion();
  initCompare();
  initConfigurator();
  initQuote();
  initContact();
})();
