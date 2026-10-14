# Panagiotis Theodoropoulos

An academic portfolio built with HTML, CSS and a small amount of JavaScript. There are no production dependencies or third-party requests. It can be served directly by GitHub Pages.

## Preview and build

```sh
npm run dev
# Open http://127.0.0.1:4173

npm run build
# Static output: dist/client
# Existing asset worker: dist/server/index.js
```

Node.js and Python 3 are needed for these commands. The build itself only uses a POSIX shell. All content lives in `index.html`; styles live in `assets/site.css`. The menu initializes inline before the main content renders to prevent layout shift. `assets/site.js` updates the current navigation section.

The original CV, portrait JPEG and social preview image remain at their original URLs. Responsive WebP copies reduce portrait transfer size. Fonts and their OFL licenses are included in `assets/fonts`.

## Content preservation

The source of truth is the root `index.html` and original assets at upstream commit `9041d5a`. The regression fixture records all 65 text blocks, 35 links, metadata, structured data, and SHA-256 hashes of the original CV and images. Tests check the rendered page against that fixture, including link labels, destinations and multiplicity.

The pre-existing `dist/client` was stale: it lacked the September news item, contained an older version of the CV, and retained a sentence already removed from the root source. The build now synchronizes the distribution with the current source. The root CV is byte-for-byte unchanged; its existing preprint addition now also reaches the built copy. No source biography, publication, author, date, service entry, talk, teaching detail or link was rewritten or removed.

## Design research

Eight Mobbin MCP searches returned 27 references, all inspected before implementation. The complete search record and design decisions are in [design-references.json](review/design-references.json).

- [Cartesia's research archive](https://mobbin.com/sites/sections/b8608ed1-0d62-4162-92ba-539871655c72) informed the separate venue, title and author hierarchy.
- [Kalstore's portrait composition](https://mobbin.com/sites/sections/5e1e6047-eef1-417c-b42b-c7ab44205e35) informed the balance between portrait and biography.
- [Read.cv's profile](https://mobbin.com/screens/072d6e31-1bf0-4c5f-b32c-0b9b33845567) informed the compact professional record.
- [IntegratedBio's publications](https://mobbin.com/sites/sections/593eb726-d6e4-4872-a1d5-51fb4d4a9893) informed the unboxed article links.

Newsreader headings and Public Sans text sit on cool white and deep blue. The original photograph supplies the color context. A static transport-path motif refers to the research subject; it is decorative rather than a representation of research results. Publications precede news, and all four papers remain immediately visible without filters or collapsed content.

## Verification

```sh
npm ci
npx playwright install chromium webkit
npm test
```

The 27 Playwright checks cover desktop Chromium, mobile Chromium and iPhone WebKit emulation. They verify content preservation, metadata, original asset hashes, resource loading, anchor destinations, current navigation state, keyboard focus, menu dismissal, and the CV download. Axe checks cover light and dark modes, including the expanded mobile menu.

Reflow checks cover widths from 320 to 1920 pixels and doubled text size. The site also works with JavaScript disabled and web fonts blocked. Motion respects the system preference. Desktop, tablet, mobile, dark mode and mobile navigation were visually inspected; the browser's accessibility tree exposes the menu name and expanded state.

Local Lighthouse 13.5.0 audits on 14 October 2026:

| Audit | Mobile | Desktop |
| --- | ---: | ---: |
| Performance | 100 | 100 |
| Accessibility | 100 | 100 |
| Best practices | 100 | 100 |
| SEO | 100 | 100 |
| Largest contentful paint | 1.8 s | 0.4 s |
| Cumulative layout shift | 0 | 0 |

These are local lab measurements, not production field results. No actionable accessibility findings remain in the inspected coverage. Physical-device testing and a spoken VoiceOver/NVDA session were not performed. External destinations are preserved exactly; third-party site availability is outside this change.

Screenshots: [desktop](review/desktop.png), [mobile](review/mobile.png), [tablet](review/tablet.png), [dark mode](review/dark.png), [mobile menu](review/mobile-menu.png). Machine-readable results are in [verification.json](review/verification.json).
