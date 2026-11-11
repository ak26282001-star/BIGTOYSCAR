# Deployment readiness

The site is static (HTML, CSS and vanilla JS, no build step). Any static host works: Netlify, Vercel, Cloudflare Pages, GitHub Pages or S3.

## Required before launch

### 1. Test-drive form backend (blocking)
`assets/js/config.js → testDrive.endpoint` is empty. Until it is set, submitting the form only shows the preview confirmation, which states that nothing was sent.

Set it to any HTTPS endpoint that accepts a JSON `POST` (Formspree, Getform, Basin, a serverless function or your own API). It must return a 2xx status on success and allow CORS from your domain. **Do not put secret API keys in `config.js`**; it is public.

Payload sent:
```json
{ "_subject": "Test drive request: …", "name": "…", "phone": "…", "car": "…", "date": "YYYY-MM-DD", "notes": "…", "page": "…", "submittedAt": "ISO-8601" }
```
On success the visitor sees "Request received"; on failure their input is kept and an error is shown under the button. Add server-side spam protection, and send one real test request after configuring.

### 2. Content to replace
Everything in `[SQUARE BRACKETS]` in `index.html` is a placeholder: dealership name, city, address, hours, phone, email, lenders and rates, and the page `<title>` and description.

### 3. Stock and photos
- The six cards in `index.html` are examples. Each card's `data-type` (`Sedan`, `SUV`, `Truck`, `Coupe`) is what the filter buttons match.
- Photos: put an `<img>` inside `.hero__photo-media` and each `.car-card__media` in place of the placeholder text. Add `width`/`height` attributes, and `loading="lazy"` on the card photos.

### 4. Branding, domain and SEO
- `assets/img/favicon.svg` and `assets/img/og-image.jpg` are left over from the previous site. Replace the favicon; the Open Graph image is no longer referenced.
- Add `<link rel="canonical">`, Open Graph tags and `AutoDealer` JSON-LD once the name, address and domain are known.
- Uncomment the `Sitemap:` line in `robots.txt` and add a `sitemap.xml`.

### 5. Legal
The form collects personal data: add a privacy policy and link it near the form.

## Motion
- CSS plus a small script (no animation library). Transform and opacity only, apart from the one clip-path wipe on the hero photo and border-colour changes on hover and focus.
- Scroll animations run once, when 20% of the element is visible.
- Nothing is hidden unless scripting is on (`<html class="js">`, removed again if `main.js` fails to load).
- `prefers-reduced-motion` removes all movement and keeps 150 ms fades.
- The header is sticky from 900 px wide. Below that the navigation wraps onto several rows, so the header scrolls away with the page.

## External services the page loads
Google Fonts (Archivo). Nothing else.

## Local preview
```sh
npx http-server . -p 8080   # then open http://localhost:8080
```
