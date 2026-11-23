// Run from CI (see visual-check.yml). No image/pose mocks or injected rendering.
import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';

const { SOURCE, SCREEN, SUBJECT, SUBJECT_SHA, OUTPUT, GAME_URL } = process.env;
assert(['base', 'head', 'pages'].includes(SOURCE) && ['touch', 'desktop'].includes(SCREEN));
const touch = SCREEN === 'touch', feature = SOURCE !== 'base';
const url = new URL(GAME_URL);
// The earlier touch UI has no view button; it already supports this documented URL.
if (touch && !feature) url.searchParams.set('view', 'third');
const viewport = touch ? { width: 844, height: 390 } : { width: 1280, height: 720 };
await mkdir(OUTPUT, { recursive: true });
const evidence = { source: SOURCE, sha: SUBJECT_SHA, url: String(url), viewport, inputs: SCREEN,
  profiles: 'low quality, muted, DPR 1; Chromium SwiftShader, not a physical GPU',
  assets: {}, frames: [], staging: [], pageErrors: [], failedRequests: [] };
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--mute-audio'] });
const context = await browser.newContext({ viewport, deviceScaleFactor: 1, hasTouch: touch, isMobile: touch });
const page = await context.newPage(), cdp = await context.newCDPSession(page);
page.setDefaultTimeout(120_000);
page.on('pageerror', e => evidence.pageErrors.push(e.message));
page.on('requestfailed', r => evidence.failedRequests.push(`${r.url()} ${r.failure()?.errorText}`));
const hash = b => createHash('sha256').update(b).digest('hex');
const paths = ['index.html', 'assets/models/gi.glb', ...(feature ? ['grip.js', 'ensemble.js', 'weight.js'] : [])];
const expected = new Map(paths.map(p => [new URL(p === 'index.html' ? '.' : p, url).pathname, p]));
const assets = [];
page.on('response', r => {
  const u = new URL(r.url()), name = expected.get(u.pathname);
  if (u.origin !== url.origin || !name) return;
  // Capture what the game actually loaded, rather than making a second HTTP request.
  assets.push(Promise.all([r.body(), readFile(join(SUBJECT, name))]).then(([body, reference]) => {
    evidence.assets[name] = { http: r.status(), received: hash(body), checkout: hash(reference) };
  }).catch(e => { evidence.assets[name] = { error: e.message }; }));
});
await context.addInitScript(() => {
  localStorage.setItem('omahaMute', 'true'); localStorage.setItem('omahaQuality', 'low');
});
const wait = (f, arg) => page.waitForFunction(f, arg, { polling: 'raf' });
const waitAct = name => wait(n => __omaha.thirdPerson.body?.act === n && __omaha.thirdPerson.body.g.visible && __omaha.phase === 'beach', name);
const advance = async seconds => {
  const start = await page.evaluate(() => __omaha.time);
  await wait(t => __omaha.time >= t || __omaha.phase !== 'beach', start + seconds);
  assert.equal(await page.evaluate(() => __omaha.phase), 'beach');
};
function state() {
  const o = window.__omaha, tp = o.thirdPerson, b = tp.body;
  return { phase: o.phase, cine: o.cine.t, t: o.time, crouched: o.player.crouched, x: o.player.x, z: o.player.z,
    stamina: o.player.stamina, third: tp.third, body: !!b?.g.visible, act: b?.act,
    lean: b?.g.rotation.x, scaleY: b?.g.scale.y, model: o.modelInfo.loaded,
    roles: o.soldiers.filter(s => s.boat && s.ensembleRole).map(s => s.ensembleRole),
    drawCalls: o.renderInfo.calls };
}
async function shot(name) {
  const before = await page.evaluate(state);
  await page.screenshot({ path: join(OUTPUT, `${name}.png`), timeout: 90000 });
  const after = await page.evaluate(state);
  evidence.frames.push({ name, before, after });
  assert(before.drawCalls > 0 && before.model, `${name}: game must have drawn the loaded scene`);
  console.log(`${name}: ${before.phase} ${before.t.toFixed(2)} ${before.act ?? ''}`);
  return before;
}
const tap = s => page.locator(s).tap();
async function joystick(down) {
  if (!down) return cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  const box = await page.locator('#joystick').boundingBox(); assert(box, 'touch joystick visible');
  const point = { x: box.x + box.width / 2, y: box.y + box.height / 2, id: 1 };
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [point] });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ ...point, y: point.y - 40 }] });
}
async function viewOnPhone(on) {
  await tap('#ctrlBtn'); await tap('#touchView');
  assert.equal(await page.locator('#touchView').getAttribute('aria-pressed'), String(on));
  await tap('#ctrlHelp button.close:not(#touchView)');
  await wait(v => __omaha.thirdPerson.third === v && !document.querySelector('#ctrlHelp').classList.contains('on'), on);
}
try {
  await page.goto(String(url), { waitUntil: 'domcontentloaded' });
  await wait(() => window.__omaha?.modelInfo?.loaded || window.__omaha?.modelInfo?.error);
  assert.equal(await page.evaluate(() => __omaha.modelInfo.error), null, 'loaded real GI');
  await Promise.all(assets);
  for (const name of paths) {
    const a = evidence.assets[name]; assert(a?.http === 200 && a.checkout === a.received, `checkout mismatch / missing ${name}: ${JSON.stringify(a)}`);
  }
  assert.equal(await page.locator('#mute').getAttribute('aria-pressed'), 'true');
  if (touch) await tap('#start'); else await page.locator('#start').click();
  await wait(() => __omaha.phase === 'cinematic');
  // Seek in the game's own cinematic, not a recreation. t=5.55 catches the second man's nod.
  for (const [n, t] of [['01-rail-brace', 2.05], ['02-returned-look', 5.55]]) {
    await page.evaluate(t => __omaha.cine.seek(t), t);
    const frame = await shot(n); assert.equal(frame.phase, 'cinematic');
    if (feature) assert.deepEqual(frame.roles.sort(), ['net','roll']);
  }
  if (touch) await tap('#cineSkip'); else await page.keyboard.press('Space');
  await wait(() => __omaha.phase === 'beach' && __omaha.time > 18);
  const start = await page.evaluate(() => {
    const o = __omaha; let x = 0;
    for (let i = 0; i < 60; i += 4) if (!o.nearestObstacle(i, 13, 9)) { x = i; break; }
    o.player.x = x; o.player.z = 13; return { x, z: 13 };
  });
  evidence.staging.push({ type: 'dry-sand start after landing (not a traversal test)', ...start });
  if (touch && feature) await viewOnPhone(true);
  if (!touch) await page.keyboard.press('KeyT');
  await waitAct('Idle');
  // Trace every real animation frame across short transitions: a screenshot may arrive
  // several frames after an input even on the same runner. No clock or pose overrides.
  await page.evaluate(() => {
    window.poseSamples = [];
    function sample() {
      const o = __omaha, b = o.thirdPerson.body;
      if (!b || window.poseSamples.length >= 1200 || !o.thirdPerson.third) return;
      window.poseSamples.push({ t: o.time, z: o.player.z, act: b.act, lean: b.g.rotation.x, scale: b.g.scale.y });
      requestAnimationFrame(sample);
    } sample();
  });
  if (touch) { await tap('#mobSprint'); await joystick(true); }
  else { await page.keyboard.down('Shift'); await page.keyboard.down('KeyW'); }
  await waitAct('Sprint'); await advance(.35);
  const sprint = await shot('03-sprinting');
  assert(sprint.act === 'Sprint' && sprint.z < start.z - 1 && sprint.stamina < 100);
  if (touch) await joystick(false);
  else { await page.keyboard.up('KeyW'); await page.keyboard.up('Shift'); }
  await waitAct('Idle'); const stop = await shot('04-braking');
  await advance(.25); const still = await page.evaluate(state);
  assert(Math.abs(still.z - stop.z) < .001, 'releasing move stops world displacement');
  if (touch) await tap('#mobCrouch'); else await page.keyboard.down('KeyC');
  await waitAct('CrouchIdle'); await shot('05-taking-knee'); await advance(.4);
  const crouched = await shot('06-crouched'); assert(crouched.crouched);
  if (touch) await tap('#mobCrouch'); else await page.keyboard.up('KeyC');
  await waitAct('Idle'); await shot('07-rising'); await advance(.65);
  const risen = await shot('08-upright'); assert(!risen.crouched);
  evidence.poseSamples = await page.evaluate(() => window.poseSamples);
  if (feature) {
    const samples = evidence.poseSamples;
    assert(samples.some(s => s.act === 'Sprint' && s.lean > .012), 'weighted sprint lean');
    assert(samples.some(s => s.act === 'Idle' && s.t >= sprint.t && s.t < crouched.t && s.scale < .998), 'stop compressed stance');
    assert(samples.some(s => s.act === 'CrouchIdle' && s.scale < .998), 'weight transferred on crouch');
    assert(samples.some(s => s.act === 'Idle' && s.t >= crouched.t && s.lean < -.01), 'shoulders lag on rise');
  }
  // A directed shot of an AI beat: choose two eligible real soldiers and place the observer
  // beside them. No actors are moved, no bones are set and the listener is never instructed.
  // For base touch the historical UI cannot switch view; use its existing debug view selector here.
  if (touch && feature) await viewOnPhone(false);
  else if (touch) await page.evaluate(() => __omaha.view('first'));
  else await page.keyboard.press('KeyT');
  const setupWave = () => {
    const o = __omaha;
    const candidates = o.soldiers.filter(s => s.alive && !s.boat && !s.down && !s.wounded && !s.script && !s.rz?.st && !s.rz?.gest && s.model);
    for (const a of candidates) {
      const neighbors = candidates.filter(b => b !== a).map(b => ({ b, d: Math.hypot(a.x-b.x,a.z-b.z) })).filter(p => p.d > .3 && p.d < 7.5).sort((p,q) => p.d-q.d);
      if (!neighbors.length) continue;
      const { b, d } = neighbors[0];
      const x = (a.x+b.x)/2, z = (a.z+b.z)/2, distance = Math.max(3, d*.9);
      const nx = (b.z-a.z)/d, nz = -(b.x-a.x)/d;
      o.player.x = x + distance*nx; o.player.z = z + distance*nz;
      window.waveCast = [a,b]; return { sender: o.soldiers.indexOf(a), neighbor: o.soldiers.indexOf(b), separation: d };
    }
    return false;
  };
  const wave = await (await wait(setupWave)).jsonValue();
  evidence.staging.push({ type: 'AI wave staged with game gesture API; observer placed beside a real pair', ...wave });
  await advance(.1);
  const waveStart = await page.evaluate(() => {
    const [a,b] = window.waveCast;
    __omaha.aimAt((a.x+b.x)/2, (a.g.position.y+b.g.position.y)/2 + 1.25, (a.z+b.z)/2);
    __omaha.realism.gesture(a,'wave'); return __omaha.time;
  });
  await wait(() => window.waveCast[0].rz.gest?.kind === 'wave');
  await shot('09-wave-signal');
  await wait(t => __omaha.time >= t + 1.05, waveStart); await shot('10-wave-response-window');
  // A sightline onto a real carry pose: view the primary and supporting hands obliquely
  // from the front. The selected actor and their rifle remain untouched.
  await wait(() => __omaha.phase === 'beach' && __omaha.soldiers.some(s => s.alive && !s.boat && !s.down && !s.wounded && !s.rz?.st && !s.rz?.gest && s.model && ['Ready','Hold'].includes(s.arm)));
  const gripActor = await page.evaluate(() => {
    const o=__omaha, options=o.soldiers.filter(s=>s.alive&&!s.boat&&!s.down&&!s.wounded&&!s.rz?.st&&!s.rz?.gest&&s.model&&['Ready','Hold'].includes(s.arm));
    options.sort((a,b)=>Number(b.act==='Idle')-Number(a.act==='Idle'));
    const s=window.gripActor=options[0], angle=s.g.rotation.y+.75;
    o.player.x=s.x+1.75*Math.sin(angle); o.player.z=s.z+1.75*Math.cos(angle);
    return o.soldiers.indexOf(s);
  });
  evidence.staging.push({ type:'observer moved, unmodified game actor in carry pose', actor:gripActor });
  await advance(.1);
  await page.evaluate(() => {
    const s=window.gripActor, h=s.model.getObjectByName('DEF-handR');
    const p=h.getWorldPosition(__omaha.cam.clone()); __omaha.aimAt(p.x,p.y,p.z);
  });
  await advance(.05); await shot('11-grip-detail');
  assert.equal(await page.locator('#mute').getAttribute('aria-pressed'), 'true');
  assert.deepEqual(evidence.pageErrors, [], 'no page exceptions');
  evidence.result = 'passed';
} catch (e) {
  evidence.result = 'failed'; evidence.error = String(e.stack ?? e);
  await page.screenshot({ path: join(OUTPUT, 'failure.png'), timeout: 20000 }).catch(() => {});
  throw e;
} finally {
  await writeFile(join(OUTPUT, 'capture.json'), JSON.stringify(evidence, null, 2));
  await browser.close();
}
