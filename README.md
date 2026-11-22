# Joyce Lin + Ayrton Laucks — wedding website

A plain HTML/CSS/JavaScript site. No build tools are needed: edit a file, commit it, and GitHub Pages republishes in about a minute.

## Where things are

| Page | File |
|---|---|
| Home (slideshow) | `index.html` |
| Details + sub-pages | `details/…/index.html` |
| RSVP steps | `rsvp/index.html` → `rsvp/roles/` → `rsvp/hotel/` → `rsvp/dietary/` → `rsvp/final/` → `rsvp/thank-you/` |
| Bridal Party + sub-pages | `bridal-party/…/index.html` |
| Registry | `registry/index.html` |
| Styles (fonts, sizes, colours, spacing) | `assets/css/style.css` |
| Slideshow timing | `assets/js/home.js` (`HOLD_MS`) |
| Map zoom viewer | `assets/js/lightbox.js` |
| RSVP logic + Google Sheet link | `assets/js/rsvp.js` (`ENDPOINT`) |
| Images | `assets/img/` |

## Common edits

- **Change text:** open the page's `index.html`, find the sentence, edit it. Body text is in `<p class="text">`, headers in `<h2 class="sub">`.
- **Add an FAQ answer:** in `details/faq/index.html`, add before `</main>`:
  ```html
  <h2 class="sub">YOUR QUESTION?</h2>
  <p class="text">Your answer.</p>
  ```
- **Replace a map:** overwrite both `assets/img/map-NAME.webp` (1200px wide, shown on the page) and `assets/img/map-NAME-full.webp` (full size, shown when zoomed).
- **Change the RSVP sheet:** redeploy the Apps Script; if the URL changes, update `ENDPOINT` in `assets/js/rsvp.js`.

## Notes

- Pages include `<meta name="robots" content="noindex">` so search engines won't list the site. Remove it from each page if you want it to be searchable.
- Fonts (Cormorant, Josefin Sans) are hosted in `assets/fonts/` under the SIL Open Font License.
