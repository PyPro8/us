# For Quinn — a birthday surprise

Plain HTML, CSS and vanilla JavaScript. **Nothing to install, no build step, no backend.**

## Preview locally
- Easiest: double-click `index.html`.
- Or from this folder: `python3 -m http.server 8000` then open http://localhost:8000
- Best checked on a phone (or your browser's mobile view).

## Deploy (free static hosting)
Upload the whole folder to Netlify Drop (app.netlify.com/drop), Cloudflare Pages, GitHub Pages or Vercel.
No settings needed. Send her the link.

## Files
- `index.html` — the six scenes
- `css/style.css` — all styling and animation
- `js/content.js` — **all wording** (letter, flower messages, sign-off, music path). Edit here.
- `js/app.js` — scenes, transitions, interactions
- `js/particles.js` — stars, petals, fireflies, sparkle bursts (canvas)
- `js/flowers.js` — SVG flowers
- `js/music.js` — music button and playback

## Music (optional)
No soundtrack is bundled, because I can't ship copyrighted music or invent an audio file.
Put a licensed or royalty-free MP3 at `assets/audio/soundtrack.mp3` (or change the path in `js/content.js`).
It starts only after she taps "Step inside", with a play/pause button top-right.
If the file is missing, the music button simply stays hidden and everything works silently.

## Personal touches
- Sign-off: last item of `letter` in `js/content.js` (default: "Someone who's rooting for you").
- Fonts: the name "Quinn" uses **Great Vibes** (connected calligraphy with a flourished capital Q), loaded from
  Google Fonts as a tiny subset containing only the letters Q-u-i-n. Everything else uses clean system serif fonts.
  - If the font can't load (offline, blocked), the name falls back to system calligraphy
    (Snell Roundhand / Apple Chancery / Segoe Script) and the site works normally.
  - This is the one remote request in the project (Google sees the visitor's IP like any font request).
    To remove it, self-host: download Great Vibes (woff2) from fonts.google.com, put it at
    `assets/fonts/GreatVibes-Regular.woff2`, delete the three Google Fonts `<link>` lines in `index.html`,
    and add this to the top of `css/style.css`:
    `@font-face { font-family: "Great Vibes"; src: url("../assets/fonts/GreatVibes-Regular.woff2") format("woff2"); font-display: swap; }`
  - To try another face (Parisienne, Allura), change the family in the `index.html` link and `--name-script` in `css/style.css`.

## Notes
Respects `prefers-reduced-motion`, device safe areas, and works with touch or mouse.
No tracking, no data collected.
