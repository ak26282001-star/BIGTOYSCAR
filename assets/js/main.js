(() => {
  "use strict";

  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  /* ------------------------------------------------------------------ *
   * Scroll reveals: once only, when 20% of the element is visible.
   * Elements entering together are staggered by their group's data-stagger (ms).
   * (The hero load sequence is CSS only; see the Motion section of styles.css.)
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

    // Once a fade has played, drop its hooks so hover transforms start from a clean element.
    document.addEventListener("animationend", (e) => {
      const el = e.target;
      if (el.nodeType === 1 && el.classList.contains("is-in")) settle(el);
    });
  }

  initReveals();
})();
