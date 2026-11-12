# Deployment readiness

The site is static (HTML, CSS and vanilla JS, no build step). Any static host works: Netlify, Vercel, Cloudflare Pages, GitHub Pages or S3.

## Required before launch

### 1. Content to replace
Everything in `[SQUARE BRACKETS]` in `index.html` is a placeholder: the wholesale minimum order, the weekly opening hours and the Instagram handle.

Check the facts that are written in as real: phone `(516) 444-1992`, address `89 Broadway, Hicksville, NY 11801`, "Open until 8 PM", and the Google rating line ("5.0 on Google, from 4 reviews"), which is fixed text and will go out of date.

### 2. Map
The map in the Visit section is a placeholder drawing captioned "demo map". Replace `.map` with a real map embed or a static map image. The "Get directions" buttons already open Google Maps for the address.

### 3. Photos
- `assets/img/storefront.jpg` (hero) is 740×650 and soft at large sizes. Replace it with a sharper photo of at least 920×1080; keep the `width`/`height` attributes in step.
- The four collection cards show line illustrations. For product photos, put an `<img>` inside each `.piece__photo` in place of the `<svg>`, with `width`/`height` attributes and `loading="lazy"`.

### 4. Branding, domain and SEO
- `assets/img/og-image.jpg` is left over from a previous site and is not referenced. Replace it before adding Open Graph tags.
- Add `<link rel="canonical">`, Open Graph tags and `JewelryStore` JSON-LD once the domain is known.
- Uncomment the `Sitemap:` line in `robots.txt` and add a `sitemap.xml`.

## Motion
- CSS plus a small script (no animation library). Transform and opacity only, apart from the clip-path wipe on the hero arch, the glow on the main button, and border-colour changes on hover.
- The hero load sequence is CSS only. Scroll animations run once, when 20% of the element is visible.
- Nothing is hidden unless scripting is on (`<html class="js">`, removed again if `main.js` fails to load).
- `prefers-reduced-motion` removes all movement and keeps 150 ms fades.

## External services the page loads
Google Fonts (Marcellus, Jost). Nothing else.

## Local preview
```sh
npx http-server . -p 8080   # then open http://localhost:8080
```
