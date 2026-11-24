// Browser regression for the inland field-book campaign. Local fixture mode serves checkout bytes;
// GAME_URL, when set, is tested directly with no local-file substitutions.
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const live = Boolean(process.env.GAME_URL);
const campaignURL = new URL(process.env.GAME_URL || 'http://checkout.test/campaign/');
const output = resolve(process.env.OUTPUT || '/tmp/omaha-campaign');
const subject = resolve(process.env.SUBJECT || root);
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM || undefined, headless: true, args: ['--no-sandbox'] });
const mime = { '.html': 'text/html', '.css': 'text/css', '.mjs': 'application/javascript', '.js': 'application/javascript', '.svg': 'image/svg+xml' };

try {
  async function fixture(page) {
    if (live) {
      if (process.env.PUBLIC_TRANSPORT) {
        assert.equal(campaignURL.origin, 'https://derrickwbrownymca.github.io', 'public transport is restricted to GitHub Pages');
        await page.route('**/*', async route => {
          const requestURL = new URL(route.request().url());
          if (requestURL.protocol === 'data:' || requestURL.protocol === 'blob:') return route.continue();
          if (![campaignURL.origin, 'https://cdn.jsdelivr.net'].includes(requestURL.origin) || route.request().method() !== 'GET') return route.abort();
          try {
            const response = await fetch(requestURL, { redirect: 'error', signal: AbortSignal.timeout(30000) });
            const cors = response.headers.get('access-control-allow-origin');
            await route.fulfill({ status: response.status, headers: cors ? { 'access-control-allow-origin': cors } : {}, contentType: response.headers.get('content-type') || 'application/octet-stream', body: Buffer.from(await response.arrayBuffer()) });
          } catch { await route.abort(); }
        });
      }
      return;
    }
    await page.route('https://cdn.jsdelivr.net/npm/three@0.165.0/**', route => {
      const asset=new URL(route.request().url()).pathname.split('three@0.165.0/')[1];
      return route.fulfill({path:join(root,'tests/node_modules/three',asset),contentType:'application/javascript'});
    });
    await page.route('http://checkout.test/**', route => {
      let pathname = new URL(route.request().url()).pathname;
      if (pathname.endsWith('/')) pathname += 'index.html';
      const file = resolve(subject, `.${pathname}`);
      if (!file.startsWith(subject + '/') && file !== subject) throw new Error('Fixture path escaped checkout');
      return route.fulfill({ path: file, contentType: mime[file.slice(file.lastIndexOf('.'))] || 'application/octet-stream' });
    });
  }
  async function context(name, mobile = false) {
    const ctx = await browser.newContext({ viewport: mobile ? { width: 390, height: 844 } : { width: 1280, height: 800 }, isMobile: mobile, hasTouch: mobile, deviceScaleFactor: mobile ? 2 : 1 });
    const page = await ctx.newPage();
    await fixture(page);
    page.setDefaultTimeout(15000);
    page.on('pageerror', error => { throw error; });
    await page.goto(campaignURL.href, { waitUntil: 'networkidle' });
    return { ctx, page, mobile, name };
  }
  async function action(t, label) {
    const button = t.page.getByRole('button', { name: label, ...(typeof label === 'string' ? { exact: true } : {}) }).last();
    await button.waitFor({ state: 'visible' });
    if (t.mobile) await button.tap(); else await button.focus().then(() => t.page.keyboard.press('Enter'));
  }
  async function place(t, expected) { await assert.doesNotReject(t.page.getByRole('heading', { name: expected }).waitFor()); }
  async function snap(t, filename) { await t.page.screenshot({ path: join(output, filename), fullPage: true }); }
  // Desktop: both prologue choices, village visit order, checkpoint reload, and together route.
  let t = await context('desktop');
  await place(t, 'The white pennant');
  await snap(t, 'desktop-prologue.png');
  assert.equal(await t.page.locator('#actions button').count(), 2, 'prologue offers help and skip choices');
  await action(t, 'Carry his blanket to the pennant'); await place(t, 'Under the water tower');
  await action(t, 'Follow the sign into the village'); await place(t, 'Alder Hollow');
  const villageActions = await t.page.locator('#actions button').allTextContents();
  assert.deepEqual(villageActions.slice(0, 3), ['Visit the farmhouse', 'Visit the church', 'Investigate the old pump'], 'village choices are in expected order');
  await action(t, 'Investigate the old pump');
  await action(t, 'Visit the church'); await place(t, 'Alder Hollow · Hill lane');
  await t.page.reload({ waitUntil: 'networkidle' }); await place(t, 'Alder Hollow · Hill lane');
  assert.match(await t.page.locator('#body').innerText(), /Bell waits beside the church gate/);
  await snap(t, 'desktop-village-checkpoint.png');
  await action(t, 'Head for the village green'); await place(t, 'Alder Hollow · The old crossing road');
  await action(t, 'Continue the journey'); await place(t, 'The flooded lane');
  await action(t, /Take the longer road together/); await place(t, 'The inland switchback');
  await action(t, 'Climb to the pine-covered rise'); await place(t, 'The pine-covered rise');
  await action(t, 'Follow the cart track down the far side'); await place(t, 'The far-bank orchard');
  await snap(t, 'desktop-together-route.png');
  await action(t, /Walk with .* through the gate/); await place(t, 'Beyond the crossing');
  await action(t, 'Set out together'); await place(t, 'The schoolhouse');
  await action(t, 'Follow the orchard path and call Lane’s name'); await place(t, 'The orchard path');
  await action(t, 'Walk Lane back to the schoolhouse'); await place(t, 'The schoolhouse');
  for (const [name, phrase] of [['Ellis', 'Call Ellis and check the name'], ['Bell', 'Call Bell and check the name'], ['Lane', 'Hear Lane answer and check the name']]) {
    assert.match(await t.page.locator('#body').innerText(), new RegExp(`${name} (?:has not answered yet|has returned)`));
    await action(t, phrase);
    assert.match(await t.page.locator('#body').innerText(), new RegExp(`${name} is checked present`));
    await snap(t, `desktop-rollcall-${name.toLowerCase()}.png`);
  }
  await action(t, 'Close the completed roll call'); await place(t, 'The schoolhouse');
  await action(t, 'Continue'); await place(t, 'All present.');
  await snap(t, 'desktop-all-present.png');
  await t.ctx.close();

  // Mobile: skip help, split route with explicit signal, then reload/resume from landing menu.
  t = await context('mobile', true);
  await action(t, 'Walk straight to the rally'); await place(t, 'Under the water tower');
  await action(t, 'Follow the sign into the village'); await place(t, 'Alder Hollow');
  const farmPin = t.page.getByRole('button', { name: 'Map: Visit the farmhouse', exact: true });
  await farmPin.waitFor({ state: 'visible' }); await farmPin.tap(); await place(t, 'Alder Hollow · North fields');
  await action(t, 'Check the church on the way'); await place(t, 'Alder Hollow · Hill lane');
  await action(t, 'Leave the village'); await place(t, 'Alder Hollow · The old crossing road');
  await action(t, 'Continue the journey'); await place(t, 'The flooded lane');
  await action(t, 'Split up and rendezvous beyond the crossing'); await place(t, 'The narrow bank path');
  await action(t, 'Continue along the bank to the old gate'); await place(t, 'The old gate');
  await snap(t, 'mobile-split-rendezvous.png');
  await action(t, 'Raise a clear signal toward the far bank'); await place(t, 'Beside the old gate');
  assert.match(await t.page.locator('#body').innerText(), /lifts a hand in reply/);
  await action(t, /Wait by the gate for .* to reach you/); await place(t, 'Beyond the crossing');
  await action(t, 'Set out together'); await place(t, 'The schoolhouse');
  await t.page.reload({ waitUntil: 'networkidle' }); await place(t, 'The schoolhouse');
  await snap(t, 'mobile-reloaded-rollcall.png');
  await t.page.goto(new URL('../index.html', campaignURL).href, { waitUntil: 'commit', timeout: 30000 });
  const resume = t.page.getByRole('link', { name: 'OPEN INLAND CHECKPOINT' });
  await resume.waitFor({ state: 'visible' });
  assert.equal(await resume.getAttribute('href'), 'campaign/');
  await resume.scrollIntoViewIfNeeded();
  const point=await resume.boundingBox();assert.ok(point);
  assert.equal(await resume.evaluate(a=>{const r=a.getBoundingClientRect();const h=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return h===a?'link':`${h?.id} ${h?.tagName} at ${r.x},${r.y}`}), 'link','resume link is reachable by touch');
  await t.page.touchscreen.tap(point.x+point.width/2,point.y+point.height/2);
  await t.page.waitForURL(url => url.pathname.endsWith('/campaign/'), { waitUntil: 'commit' });
  await place(t, 'The schoolhouse');
  await snap(t, 'mobile-landing-resume.png');
  console.log(JSON.stringify({ source: campaignURL.href, mode: live ? 'live (no fixture substitutions)' : `checkout fixture: ${subject}`, screenshots: ['desktop-prologue.png', 'desktop-village-checkpoint.png', 'desktop-together-route.png', 'desktop-rollcall-ellis.png', 'desktop-rollcall-bell.png', 'desktop-rollcall-lane.png', 'mobile-split-rendezvous.png', 'mobile-reloaded-rollcall.png', 'mobile-landing-resume.png', 'desktop-all-present.png'].map(name => join(output, name)) }, null, 2));
  await t.ctx.close();
} finally { await browser.close(); }
