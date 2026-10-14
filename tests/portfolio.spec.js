import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const original = JSON.parse(readFileSync(new URL('./fixtures/original-content.json', import.meta.url)));
const cvFilename = 'Panagiotis_Theodoropoulos_CV.pdf';
// The requested CV rename is the only URL change from the original snapshot.
const currentFilename = file => file === 'MyCV.pdf' ? cvFilename : file;
const expectedLinks = original.links.map(link => ({ ...link, href: currentFilename(link.href) }));
const normalize = text => text.replace(/\s+/g, ' ').trim();

async function openMenuIfNeeded(page) {
  const menu = page.getByRole('button', { name: 'Menu' });
  if (await menu.isVisible()) await menu.click();
}

test('preserves every original text block, link, metadata field and source asset', async ({ page, request }) => {
  await page.goto('/');
  await openMenuIfNeeded(page);
  const text = normalize(await page.locator('body').innerText());
  for (const block of original.textBlocks) expect(text, block).toContain(block);

  const actualLinks = await page.locator('a').evaluateAll(links => links.map(a => ({
    href: a.getAttribute('href'),
    text: a.textContent.replace(/\s+/g, ' ').trim(),
    label: a.getAttribute('aria-label'),
  })));
  expect(actualLinks).toHaveLength(original.links.length);
  for (const link of expectedLinks) {
    const matches = items => items.filter(item => item.href === link.href && item.label === link.label &&
      (link.label || item.text === link.text));
    expect(matches(actualLinks), JSON.stringify(link)).toHaveLength(matches(expectedLinks).length);
  }
  for (const meta of original.metadata) {
    const selector = meta.tag + Object.entries(meta.attrs).filter(([key]) => key !== 'content' && key !== 'href')
      .map(([key, value]) => `[${key}="${value}"]`).join('');
    for (const [key, value] of Object.entries(meta.attrs)) {
      await expect(page.locator(selector)).toHaveAttribute(key, value);
    }
  }
  const structuredData = JSON.parse(await page.locator('script[type="application/ld+json"]').textContent());
  const person = structuredData['@graph'].find(node => node['@type'] === 'Person');
  // SEO adds relationships, while every original fact about the researcher stays intact.
  expect({ '@context': structuredData['@context'], ...person })
    .toMatchObject(JSON.parse(original.structuredData));
  for (const [file, digest] of Object.entries(original.assets)) {
    const response = await request.get('/' + currentFilename(file));
    expect(response.ok()).toBeTruthy();
    expect(createHash('sha256').update(await response.body()).digest('hex')).toBe(digest);
  }
});

test('all page resources load locally with no browser errors', async ({ page }) => {
  const errors = [], failures = [], remote = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('requestfailed', request => failures.push(request.url()));
  page.on('response', response => { if (response.status() >= 400) failures.push(response.url()); });
  page.on('request', request => { if (!request.url().startsWith('http://127.0.0.1:4173')) remote.push(request.url()); });
  await page.goto('/');
  await page.evaluate(() => document.fonts.ready);
  await expect(page.locator('.profile-picture')).toBeVisible();
  expect(await page.locator('.profile-picture').evaluate(img => img.complete && img.naturalWidth > 0)).toBeTruthy();
  expect(errors).toEqual([]);
  expect(failures).toEqual([]);
  expect(remote).toEqual([]);
});

test('section links reach visible headings and expose the current location', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  for (const id of ['research', 'publications', 'news', 'service', 'talks', 'teaching', 'about']) {
    await openMenuIfNeeded(page);
    const link = page.locator(`.primary-nav a[href="#${id}"]`);
    await link.click();
    await expect(page).toHaveURL(new RegExp(`#${id}$`));
    const target = page.locator(`#${id}`);
    const heading = target.locator('h1, h2').first();
    await expect(heading).toBeInViewport();
    const headerBox = await page.locator('.site-header').boundingBox();
    const headingBox = await heading.boundingBox();
    expect(headingBox.y).toBeGreaterThanOrEqual(headerBox.height - 1);
    await expect(page.locator('.primary-nav a[aria-current="location"]')).toHaveCount(1);
    await expect(link).toHaveAttribute('aria-current', 'location');
  }
});

test('keyboard skip link and mobile disclosure keep focus reachable', async ({ page, browserName }) => {
  await page.goto('/');
  // Safari's default keyboard preference uses Option+Tab to include links.
  const tab = browserName === 'webkit' ? 'Alt+Tab' : 'Tab';
  await page.keyboard.press(tab);
  await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('main')).toBeFocused();
  const menu = page.getByRole('button', { name: 'Menu' });
  if (await menu.isVisible()) {
    await menu.focus();
    await page.keyboard.press('Enter');
    await expect(menu).toHaveAttribute('aria-expanded', 'true');
    await page.keyboard.press(tab);
    await expect(page.locator('.primary-nav a').first()).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(menu).toBeFocused();
    await expect(menu).toHaveAttribute('aria-expanded', 'false');
    await expect(page.locator('.primary-nav')).toBeHidden();
    await page.keyboard.press('Enter');
    await page.getByRole('navigation', { name: 'Primary navigation' }).getByRole('link', { name: 'Publications' }).click();
    await expect(page.locator('#publications')).toBeFocused();
    await expect(menu).toHaveAttribute('aria-expanded', 'false');
  }
});

for (const colorScheme of ['light', 'dark']) {
  test(`passes WCAG accessibility checks in ${colorScheme} mode`, async ({ page }) => {
    await page.emulateMedia({ colorScheme });
    await page.goto('/');
    await page.evaluate(() => document.fonts.ready);
    const scan = () => new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
    expect((await scan()).violations).toEqual([]);
    if (await page.getByRole('button', { name: 'Menu' }).isVisible()) {
      await openMenuIfNeeded(page);
      expect((await scan()).violations).toEqual([]);
    }
  });
}

test('reflows at narrow, tablet and wide sizes and enlarged text', async ({ page }) => {
  for (const width of [320, 375, 390, 430, 688, 768, 1024, 1232, 1280, 1440, 1920]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    await page.evaluate(() => document.fonts.ready);
    const sizes = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, width: innerWidth }));
    expect(sizes.scroll, `${width}px viewport`).toBeLessThanOrEqual(sizes.width);
    const clipping = await page.locator('h1, h2, h3, p, .nav-list a, .button').evaluateAll(nodes =>
      nodes.filter(node => node.clientWidth && node.scrollWidth > node.clientWidth + 1).map(node => node.textContent));
    expect(clipping, `${width}px text clipping`).toEqual([]);
  }
  await page.setViewportSize({ width: 640, height: 900 });
  await page.addStyleTag({ content: 'html { font-size: 200%; }' });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(640);
});

test('focus topics keep aligned columns and publications follow the introduction', async ({ page }) => {
  for (const width of [320, 390, 600, 768, 1024, 1280, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto('/');
    await page.evaluate(() => document.fonts.ready);
    const items = await page.locator('.focus-list li').evaluateAll(nodes => nodes.map(node => {
      const { x, y, width, height } = node.getBoundingClientRect();
      return { x, y, width, height };
    }));
    const firstRow = items.filter(item => Math.abs(item.y - items[0].y) < 1);
    for (const [index, item] of items.entries()) {
      const column = index % firstRow.length;
      expect(Math.abs(item.x - firstRow[column].x), `${width}px column alignment`).toBeLessThan(1);
      expect(Math.abs(item.width - firstRow[column].width), `${width}px column width`).toBeLessThan(1);
      const rowStart = items[index - column];
      expect(Math.abs(item.y - rowStart.y), `${width}px row alignment`).toBeLessThan(1);
      if (index >= firstRow.length) {
        const previous = items[index - firstRow.length];
        expect(item.y).toBeGreaterThanOrEqual(previous.y + previous.height);
      }
    }
    const order = await page.locator('main > section').evaluateAll(sections => sections.map(section => section.id));
    expect(order.slice(0, 3)).toEqual(['about', 'publications', 'research']);
    if (width >= 1280) {
      const biography = await page.locator('.biography').boundingBox();
      const heading = await page.locator('#publications h2').boundingBox();
      expect(Math.abs(biography.x - heading.x)).toBeLessThan(1);
      await expect(page.locator('.publication h3').first()).toBeInViewport();
    }
  }
});

test('content and navigation work without JavaScript, motion or web fonts', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 375, height: 812 }, reducedMotion: 'reduce' });
  const page = await context.newPage();
  await page.route('**/*.woff2', route => route.abort());
  await page.goto('http://127.0.0.1:4173/');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.locator('.primary-nav')).toBeVisible();
  await page.locator('.primary-nav a[href="#publications"]').click();
  await expect(page.locator('#publications h2')).toBeInViewport();
  expect((await page.locator('#publications h2').boundingBox()).y).toBeGreaterThanOrEqual(0);
  await expect(page.locator('.publication')).toHaveCount(4);
  await expect(page.locator('#service')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior)).toBe('auto');
  await context.close();
});

test('all original section destinations exist and the CV remains downloadable', async ({ page }) => {
  await page.goto('/');
  const broken = await page.locator('a[href^="#"]').evaluateAll(links => links
    .filter(a => !document.getElementById(a.hash.slice(1))).map(a => a.hash));
  expect(broken).toEqual([]);
  await expect(page.locator('h1')).toHaveCount(1);
  const response = await page.request.get('/' + cvFilename);
  expect(response.headers()['content-type']).toContain('application/pdf');
  expect((await response.body()).subarray(0, 4).toString()).toBe('%PDF');
});
