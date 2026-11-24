// Integration: seed the live simulation at the bunker, then complete it through the
// ordinary grenade input and frame updates. The landing win/navigation and field-book
// rendering remain production paths; only reaching the bunker is accelerated.
import { chromium } from 'playwright';
import { extname, join, resolve } from 'node:path';
import assert from 'node:assert/strict';

const { GAME_URL, PUBLIC_TRANSPORT } = process.env;
const root = resolve(new URL('..', import.meta.url).pathname);
const three = resolve(root, 'tests/node_modules/three');
const url = new URL(GAME_URL || 'http://checkout.test/');
const live = url.hostname !== 'checkout.test';
const allowedOrigins = [url.origin, 'https://cdn.jsdelivr.net'];
const mime = { '.html': 'text/html', '.js': 'application/javascript', '.mjs': 'application/javascript', '.css': 'text/css', '.glb': 'model/gltf-binary' };
assert(!live || (url.protocol === 'https:' && url.origin === 'https://derrickwbrownymca.github.io'), 'GAME_URL must be the public GitHub Pages site');
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM || undefined, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--mute-audio'] });
try {
  const page = await browser.newPage({ viewport: { width: 1000, height: 700 } });
  page.setDefaultTimeout(90000);
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  if (live) {
    if (PUBLIC_TRANSPORT) {
      await page.route('**/*', async route => {
        const request = route.request(), requestUrl = new URL(request.url());
        if (['data:', 'blob:'].includes(requestUrl.protocol)) return route.continue();
        if (!allowedOrigins.includes(requestUrl.origin) || request.method() !== 'GET') return route.abort();
        try {
          const response = await fetch(requestUrl, { redirect: 'error', signal: AbortSignal.timeout(30000) });
          await route.fulfill({ status: response.status, contentType: response.headers.get('content-type') || 'application/octet-stream', body: Buffer.from(await response.arrayBuffer()) });
        } catch (error) { errors.push(error.message); await route.abort(); }
      });
    } else {
      await page.route('**/*', route => {
        const requestUrl = new URL(route.request().url());
        return ['data:', 'blob:'].includes(requestUrl.protocol) || allowedOrigins.includes(requestUrl.origin) ? route.continue() : route.abort();
      });
    }
  } else {
    await page.route('http://checkout.test/**', async route => {
      const pathname = decodeURIComponent(new URL(route.request().url()).pathname);
      const file = resolve(root, `.${pathname.endsWith('/') ? `${pathname}index.html` : pathname}`);
      assert(file === root || file.startsWith(root + '/'), 'path outside checkout fixture');
      try { await route.fulfill({ path: file, contentType: mime[extname(file)] || 'application/octet-stream' }); }
      catch { await route.fulfill({ status: 404, body: 'not found' }); }
    });
    await page.route('https://cdn.jsdelivr.net/npm/three@0.165.0/**', route => {
      const asset = new URL(route.request().url()).pathname.split('three@0.165.0/')[1];
      return route.fulfill({ path: join(three, asset), contentType: mime[extname(asset)] || 'application/javascript' });
    });
  }
  await page.addInitScript(() => {
    localStorage.setItem('omahaMute', 'true');
    localStorage.setItem('omahaQuality', 'low');
  });
  await page.goto(String(url), { waitUntil: 'commit' });
  await page.waitForFunction(() => window.__omaha);
  await page.locator('#start').click();
  await page.waitForFunction(() => window.__omaha.phase === 'cinematic');
  await page.keyboard.press('Space');
  // Let the native boat simulation finish, then seed at the seawall and let the
  // real movement/frame path identify the bunker before accelerating its encounter.
  await page.evaluate(() => __omaha.step(470, 1 / 30));
  await page.evaluate(() => { __omaha.player.x = 0; __omaha.player.z = -185; __omaha.step(1, 1 / 30); });
  await page.waitForFunction(() => window.__omaha?.assault?.target);
  await page.evaluate(() => {
    const o = window.__omaha, t = o.assault.target;
    o.player.x = t.x;
    o.player.z = t.z - 3;
    o.assault.stage = 3;
    o.rifle.grenades = 1;
  });
  await page.keyboard.press('g');
  assert.equal(await page.evaluate(() => __omaha.rifle.grenades), 0, 'normal grenade input consumed grenade');
  await page.evaluate(() => __omaha.step(180, 1 / 30));
  await page.waitForFunction(() => location.pathname.endsWith('/campaign/') && document.querySelector('#place')?.textContent === 'The white pennant', { timeout: 90000 });
  assert.equal(await page.locator('#chapter').innerText(), 'Prologue · Above the wall');
  await page.getByRole('button', { name: 'Carry his blanket to the pennant', exact: true }).click();
  await page.waitForFunction(() => /Three names go unanswered: Ellis, Bell, Lane/.test(document.querySelector('#body')?.textContent || ''));
  assert.match(await page.locator('#body').innerText(), /Three names go unanswered: Ellis, Bell, Lane/);
  assert.deepEqual(errors, [], `browser errors: ${errors.join('; ')}`);
  console.log('PASS: player grenade + simulation frames completed the seeded bunker encounter; landing navigated to the rendered field-book rally.');
  console.log('Setup note: bunker position/stage and one grenade were seeded through __omaha after the real landing started; win/navigation were not called directly.');
} finally {
  await browser.close();
}
