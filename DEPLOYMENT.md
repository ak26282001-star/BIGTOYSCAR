# Big Toys Customs: deployment readiness

The site is static (HTML, CSS and vanilla JS, no build step). Any static host works: Netlify, Vercel, Cloudflare Pages, GitHub Pages or S3.
Everything you are expected to change lives in **`assets/js/config.js`**.

## Status at a glance

| Area | State |
|---|---|
| Layout (375 / 768 / 1280 / 1440 px) | Tested, no horizontal overflow |
| Navigation (desktop, mobile menu, Esc, outside click, active section) | Tested |
| Configurator (options, live preview, estimate, saved state, share link, reset) | Tested |
| Quote form validation | Tested |
| Quote submission (loading, success, server error, timeout, unconfigured) | Tested against a local mock backend |
| Spec details included in quote payload | Tested |
| Reduced-motion support | Tested |
| **Real quote backend** | **Not configured, so the form cannot send yet (see below)** |

## Required before launch

### 1. Quote backend (blocking)
`config.js → quote.endpoint` is empty. Until it is set, the form **does not pretend to send**. It shows "Online requests aren't available right now" plus any contact details you've filled in, and logs a warning to the console.

Set it to any HTTPS endpoint that accepts a JSON `POST`, for example:
- **Formspree / Getform / Basin**: create a form and paste its endpoint URL. These email each request to you; the `_subject` and `_replyto` fields are already included.
- **Your own API or a serverless function** (Netlify Functions, Vercel, Cloudflare Workers) that emails the studio or writes to a CRM.

The endpoint must:
- return a 2xx status on success (anything else shows an error and keeps the visitor's input);
- allow CORS from your site's domain, if it is on a different origin.

**Do not put secret API keys in `config.js`.** It is public. If your provider needs a secret, put a serverless function in between.

Payload sent:
```json
{
  "_subject": "Quote request: 2021 Porsche 911 Carrera S",
  "name": "…", "email": "…", "_replyto": "…", "phone": "…",
  "vehicle": "…", "budget": "…", "timeline": "…", "message": "…", "consent": true,
  "build": {
    "paint": "verde", "wheel": "mesh", "finish": "bronze", "caliper": "red",
    "stance": "factory", "packages": ["interior"],
    "estimate": { "min": 17700, "max": 22900, "currency": "GBP" },
    "shareUrl": "https://…/?paint=verde&wheel=mesh&…#configurator"
  },
  "buildSummary": "Paint: Verde Profondo\nWheels: Cross-spoke mesh\n…",
  "page": "…", "submittedAt": "ISO-8601"
}
```
`build` is `null` and `buildSummary` is `"Not included"` if the visitor unticks "Include this spec with my request".

After configuring, send one real test request and confirm it arrives.

Spam protection: there is a hidden honeypot field (`company`). Add server-side protection too, such as your provider's spam filter, reCAPTCHA or Cloudflare Turnstile, and rate limiting.

### 2. Business details
`config.js → contact` (`email`, `phone`, `address`, `instagram`) is empty, so nothing is shown. Once filled in, they appear beside the form, in the footer and in the form's error fallback. Also add `address`, `telephone`, `url` and opening hours to the JSON-LD block in `index.html` for local SEO.

### 3. Pricing
`config.js → pricing` holds **placeholder figures** used for the "indicative starting estimate". Replace them with real studio numbers, or set every value to `0` to show "On consultation" instead. Also confirm `currency`.

### 4. Content to replace
Copy and project data below are **placeholders written for the design**. Replace them with real information:
- Featured build "Project 07 / Nightfall": its description and specs (finish, 20″ wheels, 35 mm, 11 weeks), plus the hero meta line.
- Service descriptions, the reply time ("within two working days") and the process steps.
- The configurator's option names (paint, wheel and package names) in `assets/js/main.js → OPTIONS`.

### 5. Vehicle assets (photography)
All car imagery is a **vector illustration** (an SVG sprite in `index.html`), so the site works with no photos. For the premium look at launch you'll want real images:
- **Hero**: one cinematic studio shot, landscape, ≥ 2400 px wide, dark background, side or 3/4 view.
- **Featured build**: a matched before/after pair taken from the same camera position (for the comparison slider).
- **Optional**: 3–6 portfolio shots, plus interior and detail close-ups.
- Export as AVIF or WebP with a JPG fallback, and add `width`/`height` attributes to avoid layout shift.
- You need rights to every image (your own shoots, or properly licensed). The footer currently says "Vehicle renderings are illustrative". Update it once photos are used.
- The configurator preview stays a recolourable illustration unless you commission per-option renders.

### 6. Domain and SEO
- Set absolute URLs: `og:image` (currently relative: `assets/img/og-image.jpg`, 1200×630) and add `<link rel="canonical" href="https://YOUR-DOMAIN/">`.
- Uncomment the `Sitemap:` line in `robots.txt` and add a `sitemap.xml`.
- Register the site in Google Search Console and Google Business Profile.

### 7. Legal and analytics
- Add a privacy policy page (the form collects personal data) and link it next to the consent checkbox and in the footer.
- If you add analytics or marketing pixels, you'll need a cookie-consent banner where required (UK/EU GDPR).

## External services the page loads
- **Google Fonts** (Archivo and JetBrains Mono). To avoid the third-party request (privacy and performance), self-host the font files.
- Nothing else. No analytics, trackers or frameworks.

## Performance notes
- No JS framework; total page weight is small (roughly 100 KB before fonts). The car artwork is one shared inline SVG sprite.
- Animations use only `transform`, `opacity` and CSS variables, and respect `prefers-reduced-motion`.
- When real photos are added, lazy-load everything below the hero (`loading="lazy"`) and preload the hero image.

## Accessibility notes
Skip link, landmarks, one `h1`, labelled controls (configurator inputs are real radio buttons and checkboxes in fieldsets), inline error messages linked with `aria-describedby`, `aria-live` status messages, visible focus styles, 44 px touch targets and reduced-motion support.
Before launch, also run an automated axe/Lighthouse audit and a quick screen-reader pass (VoiceOver/NVDA) against the final content.

## Local preview
```sh
npx http-server . -p 8080   # then open http://localhost:8080
```
