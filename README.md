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

The CV is served as `Panagiotis_Theodoropoulos_CV.pdf`, with its contents unchanged. The portrait JPEG and social preview image remain at their original URLs. Responsive WebP copies reduce portrait transfer size. Fonts and their OFL licenses are included in `assets/fonts`.

## Content preservation

The source of truth is the root `index.html` and original assets at upstream commit `9041d5a`. The regression fixture records all 65 text blocks, 35 links, metadata, structured data, and SHA-256 hashes of the original CV and images. Tests check the rendered page against that fixture, including link labels, destinations and multiplicity. The requested CV filename change is the only destination exception.

The pre-existing `dist/client` was stale: it lacked the September news item, contained an older version of the CV, and retained a sentence already removed from the root source. The build now synchronizes the distribution with the current source. The root CV is byte-for-byte unchanged; its existing preprint addition now also reaches the built copy. No source biography, publication, author, date, service entry, talk, teaching detail or link was rewritten or removed.

## Search discovery

The page supplies its content and JSON-LD directly in HTML, so crawlers do not need JavaScript. The structured data connects a `ProfilePage` to the existing `Person`, the four selected `ScholarlyArticle` entries and the CV. It preserves the original researcher metadata and uses the publication titles, author order and venues shown on the page. When updating publications, edit both the visible entry and its JSON-LD record in `index.html`; the tests compare them.

`robots.txt` allows crawlers and advertises `sitemap.xml`. The sitemap lists the production homepage and renamed CV, with no preview URLs or invented modification dates. The build copies both files to `dist/client`. Social preview metadata includes the original image's dimensions and alternative text.

These changes follow [Google's guidance for AI search](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide) and [profile pages](https://developers.google.com/search/docs/appearance/structured-data/profile-page). The crawler policy also permits [OpenAI's search crawler](https://developers.openai.com/api/docs/bots). Indexing, rich results and AI citations are not guaranteed.

After merging and deploying, the site owner should [submit the sitemap in Google Search Console](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap#addsitemap) at `https://panostheo98.github.io/sitemap.xml` and inspect the homepage's indexing status. This requires access to the verified production property. No production indexing submission has been made from this branch.

## Design research

Twelve Mobbin MCP searches returned 35 previews across the initial design and the research-profile revision. All previews were inspected. The complete search record, palette and layout decisions are in [design-references.json](review/design-references.json).

- [Read.cv's profile](https://mobbin.com/screens/da9ff362-7420-429e-90e0-6276c1541c78) informed the compact identity and continuous professional record.
- [Waabi's publications](https://mobbin.com/sites/sections/9aaa2fb5-80ec-483f-98b3-e3dcf5217ffb) informed the consistent venue, title and author hierarchy.
- [Stripe's reviewer directory](https://mobbin.com/sites/sections/dfba116a-a607-4850-87fd-9595c287a23e) informed the aligned columns for research interests.

The desktop page places a small portrait, name and links beside the biography. Publications follow the introduction and focus topics, with the first paper visible in the initial 1440 by 1000 viewport. The remaining sections follow the same reading alignment. Current focus uses three equal columns, reducing to two or one according to the available width. Tablet and mobile use one reading column.

Newsreader gives the name and paper titles their character; Public Sans carries the biography, section headings and metadata. White, dark text and restrained blue links keep the publication record prominent. Dark mode uses the same hierarchy. The header has a plain text name and a simple P favicon.

## Verification

```sh
npm ci
npx playwright install chromium webkit
npm test
```

The 36 Playwright checks cover desktop Chromium, mobile Chromium and iPhone WebKit emulation. They verify content preservation, metadata, original asset hashes, resource loading, anchor destinations, current navigation state, keyboard focus, menu dismissal, and the CV download. Discovery checks compare structured data with visible publications, verify social image dimensions, and follow the sitemap to working resources with JavaScript disabled. Axe checks cover light and dark modes, including the expanded mobile menu.

Geometry checks verify focus-topic column alignment across rows and the publication reading order. Reflow checks cover widths from 320 to 1920 pixels and doubled text size. The site also works with JavaScript disabled and web fonts blocked. Motion respects the system preference. Desktop, tablet, mobile, dark mode and mobile navigation were visually inspected; the browser's accessibility tree exposes the menu name and expanded state.

Local Lighthouse 13.5.0 audits on 14 October 2026, after the research-profile revision:

| Audit | Mobile | Desktop |
| --- | ---: | ---: |
| Performance | 99 | 100 |
| Accessibility | 100 | 100 |
| Best practices | 100 | 100 |
| SEO | 100 | 100 |
| Largest contentful paint | 1.8 s | 0.4 s |
| Cumulative layout shift | 0 | 0 |

These are local lab measurements, not production field results. No actionable accessibility findings remain in the inspected coverage. Physical-device testing and a spoken VoiceOver/NVDA session were not performed. External destinations are preserved exactly; third-party site availability is outside this change.

Screenshots: [desktop](review/desktop.png), [mobile](review/mobile.png), [tablet](review/tablet.png), [dark mode](review/dark.png), [mobile menu](review/mobile-menu.png). Machine-readable results are in [verification.json](review/verification.json).
