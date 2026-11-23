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

## English / 中文

- The toggle in the top right of the nav bar switches between English and Simplified Chinese; the choice is remembered on each device.
- Every translated element carries its Chinese text in a `data-zh` attribute, right next to the English:
  ```html
  <h2 class="sub" data-zh="其他选择">OTHER OPTIONS</h2>
  ```
  **When you change English text, update its `data-zh` too.** An element without `data-zh` stays in English in both modes (used for location names).
- The names in the nav (`林琦悦 + 柳艾奇`) are in the `data-zh` of `.nav-title`. They use the same size as the English names, and the space around the "+" stretches so they start and end exactly where the English names do.
- Image descriptions use `data-zh-alt` / `data-zh-aria-label` the same way.
- Messages created by the scripts (form errors, "Sending…", etc.) are translated at the top of `assets/js/i18n.js`.
- Chinese text uses `assets/fonts/noto-sans-sc-subset-*.woff2`, a copy of Noto Sans SC (SIL Open Font License) trimmed to the characters on the site. New characters you add still display, using the device's own Chinese font.
- The Bridal Party pages are encrypted with both languages inside, so their text can only be changed by re-encrypting.
