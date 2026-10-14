import { test, expect } from '@playwright/test';

const canonical = 'https://panostheo98.github.io/';
test.use({ javaScriptEnabled: false });

test('profile and publication metadata match the content available without JavaScript', async ({ page, request }) => {
  await page.goto('/');
  const data = JSON.parse(await page.locator('script[type="application/ld+json"]').textContent());
  expect(data['@context']).toBe('https://schema.org');
  const nodes = new Map(data['@graph'].map(node => [node['@id'], node]));
  expect(nodes.size).toBe(data['@graph'].length);
  const profile = data['@graph'].find(node => node['@type'] === 'ProfilePage');
  const person = nodes.get(profile.mainEntity['@id']);
  expect(person['@type']).toBe('Person');
  expect(person.name).toBe((await page.locator('h1').innerText()).replace(/\s+/g, ' ').trim());
  expect(person.mainEntityOfPage['@id']).toBe(profile['@id']);
  expect(profile.url).toBe(canonical);
  expect(profile.name).toBe(await page.title());
  expect(profile.description).toBe(await page.locator('meta[name="description"]').getAttribute('content'));
  expect(profile.inLanguage).toBe(await page.locator('html').getAttribute('lang'));
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', canonical);

  const publications = await page.locator('.publication').evaluateAll(elements => elements.map(element => ({
    title: element.querySelector('h3').textContent.trim(),
    url: element.querySelector('h3 a').href,
    venue: element.querySelector('.publication-venue').textContent.trim(),
    authors: element.querySelector('p:last-child').textContent.trim(),
  })));
  const articles = data['@graph'].filter(node => node['@type'] === 'ScholarlyArticle');
  expect(articles).toHaveLength(publications.length);
  expect(profile.hasPart.map(ref => ref['@id'])).toEqual(articles.map(article => article['@id']));
  for (const publication of publications) {
    const article = articles.find(item => item.url === publication.url);
    expect(article.headline).toBe(publication.title);
    const authors = article.author.map(author => author.name ?? nodes.get(author['@id']).name);
    expect(`${authors.slice(0, -1).join(', ')}, and ${authors.at(-1)}.`).toBe(publication.authors);
    expect([article.publication.name, article.publication.description].filter(Boolean).join(' '))
      .toBe(publication.venue);
  }

  const cv = nodes.get(person.subjectOf['@id']);
  const cvLink = await page.locator('.hero-cv a').getAttribute('href');
  expect(cv['@type']).toBe('DigitalDocument');
  expect(cv.url).toBe(new URL(cvLink, canonical).href);
  expect(cv.about['@id']).toBe(person['@id']);
  const cvResponse = await request.get(cvLink);
  expect(cvResponse.ok()).toBeTruthy();
  expect(cvResponse.headers()['content-type']).toContain(cv.encodingFormat);

  // Check preview dimensions against the PNG itself so replacing the image cannot leave stale metadata.
  const imageUrl = await page.locator('meta[property="og:image"]').getAttribute('content');
  const preview = await request.get(new URL(imageUrl).pathname);
  const image = await preview.body();
  await expect(page.locator('meta[property="og:image:type"]')).toHaveAttribute('content', preview.headers()['content-type']);
  await expect(page.locator('meta[property="og:image:width"]')).toHaveAttribute('content', String(image.readUInt32BE(16)));
  await expect(page.locator('meta[property="og:image:height"]')).toHaveAttribute('content', String(image.readUInt32BE(20)));
  await expect(page.locator('meta[name="twitter:image:alt"]')).toHaveAttribute('content',
    await page.locator('meta[property="og:image:alt"]').getAttribute('content'));
});

test('crawler discovery files lead to the canonical page and a working CV', async ({ page, request }) => {
  const robotsResponse = await request.get('/robots.txt');
  expect(robotsResponse.status()).toBe(200);
  expect(robotsResponse.headers()['content-type']).toContain('text/plain');
  const robots = await robotsResponse.text();
  expect(robots).toMatch(/^User-agent:\s*\*\s*$/m);
  expect(robots).not.toMatch(/^Disallow:[ \t]*\S+/m);
  const sitemapUrl = robots.match(/^Sitemap:[ \t]*(\S+)/m)?.[1];
  expect(sitemapUrl).toBe(new URL('sitemap.xml', canonical).href);

  const sitemapResponse = await request.get(new URL(sitemapUrl).pathname);
  expect(sitemapResponse.status()).toBe(200);
  expect(sitemapResponse.headers()['content-type']).toContain('xml');
  await page.goto('/');
  const sitemap = await page.evaluate(xml => {
    const document = new DOMParser().parseFromString(xml, 'application/xml');
    return {
      error: document.querySelector('parsererror')?.textContent ?? null,
      namespace: document.documentElement.namespaceURI,
      locations: Array.from(document.querySelectorAll('url > loc'), element => element.textContent.trim()),
    };
  }, await sitemapResponse.text());
  expect(sitemap.error).toBeNull();
  expect(sitemap.namespace).toBe('http://www.sitemaps.org/schemas/sitemap/0.9');
  const cvLink = await page.locator('.hero-cv a').getAttribute('href');
  expect(sitemap.locations).toEqual([canonical, new URL(cvLink, canonical).href]);
  for (const location of sitemap.locations) {
    const url = new URL(location);
    expect(url.origin).toBe(new URL(canonical).origin);
    expect(url.hash).toBe('');
    const response = await request.get(url.pathname);
    expect(response.status()).toBe(200);
    expect(response.headers()['x-robots-tag'] ?? '').not.toMatch(/noindex|none/i);
  }
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'index,follow');
});
