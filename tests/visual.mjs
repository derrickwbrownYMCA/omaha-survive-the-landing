// Run from CI (see visual-check.yml). No image/pose mocks or injected rendering.
import { chromium } from 'playwright';
import { rememberCast, confirmLanding, watchWave, verifyWave } from './continuity.mjs';
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
  assert.equal(await page.evaluate(() => __omaha.realism.VOICES.SPEECH), false, 'speech is off by default');
  if (touch) await tap('#start'); else await page.locator('#start').click();
  await wait(() => __omaha.phase === 'cinematic');
  // Seek in the game's own cinematic, not a recreation. t=5.55 catches the second man's nod.
  for (const [n, t] of [['01-rail-brace', 2.05], ['02-returned-look', 5.55]]) {
    await page.evaluate(t => __omaha.cine.seek(t), t);
    const frame = await shot(n); assert.equal(frame.phase, 'cinematic');
    if (feature) assert.deepEqual(frame.roles.sort(), ['net','roll']);
  }
  if (feature) await page.evaluate(rememberCast);
  if (touch) await tap('#cineSkip'); else await page.keyboard.press('Space');
  await wait(() => __omaha.phase === 'boat'); // The actual skip must work independently of staging.
  if (!touch) {
    // Desktop SwiftShader took two wall minutes for seven game seconds: the loop
    // caps dt at .05. Step only this uncaptured interval via the game's own
    // simulation hook; never set the phase/clock or step through an input or shot.
    const passage = await page.evaluate(() => {
      const o = __omaha, from = o.time, dt = 1 / 30;
      const ticks = Math.max(0, Math.ceil((18.05 - from) / dt));
      o.step(ticks, dt);
      return { from, to: o.time, phase: o.phase, ticks, dt };
    });
    evidence.staging.push({ type: 'desktop unrecorded boat passage: native simulation steps', ...passage });
    assert(passage.phase === 'beach' && passage.to > 18, `boat passage did not complete: ${JSON.stringify(passage)}`);
  }
  await wait(() => __omaha.phase === 'beach' && __omaha.time > 18);
  if (feature) evidence.landing = await page.evaluate(confirmLanding);
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
  // An explicitly staged observational shot: no bones, clip or listener response are set.
  // Remove UI only while taking the three closeups, never for the player-control shots.
  // For base touch the historical UI cannot switch view; use its existing debug view selector here.
  if (touch && feature) await viewOnPhone(false);
  else if (touch) await page.evaluate(() => __omaha.view('first'));
  else await page.keyboard.press('KeyT');
  const cleanHUD = await page.addStyleTag({content:'body > :not(#render):not(script):not(style){visibility:hidden!important}'});
  const setupWave = () => {
    const o = __omaha;
    const candidates = o.soldiers.filter(s => s.alive && !s.boat && !s.down && !s.wounded && !s.script && !s.rz?.st && !s.rz?.gest && s.model);
    if (candidates.length < 2) return false;
    candidates.sort((a,b) => Number(!!b.ensembleRole)-Number(!!a.ensembleRole));
    const dry = s => s.z < 22 && s.z > -75;
    let pair, moves = [];
    for (const a of candidates.filter(dry)) {
      const b = candidates.filter(s => s !== a).sort((p,q) => Math.hypot(p.x-a.x,p.z-a.z)-Math.hypot(q.x-a.x,q.z-a.z))[0];
      const d = Math.hypot(b.x-a.x,b.z-a.z);
      // Close, side-by-side, obstacle-free pair with room for the observer ahead.
      if (dry(b) && d > 1.3 && d < 3 && Math.abs(b.x-a.x) > .8*d && !o.nearestObstacle(a.x,a.z,5)) { pair = [a,b]; break; }
    }
    if (!pair) {
      pair = candidates.slice(0,2);
      let site;
      for (let z=13; z>=-50 && !site; z-=6) for (let x=-60;x<=60;x+=6) {
        if (!o.nearestObstacle(x,z,6) && o.soldiers.every(s=>pair.includes(s)||Math.hypot(s.x-x,s.z-z)>10)) {site={x,z};break;}
      }
      if (!site) return false;
      moves=pair.map((s,i)=>{const from=[s.x,s.z];s.x=site.x+(i?1:-1);s.z=site.z;return {actor:o.soldiers.indexOf(s),role:s.ensembleRole,from,to:[s.x,s.z]};});
    }
    const [a,b]=window.waveCast=pair;
    // Track the moving pair from their shoreward side with the actual first-person camera.
    function follow() {
      if (!window.followWave) return;
      const x=(a.x+b.x)/2,z=(a.z+b.z)/2,d=Math.hypot(b.x-a.x,b.z-a.z);
      o.player.x=x; o.player.z=z-Math.max(2, d*.69);
      o.aimAt(x,(a.g.position.y+b.g.position.y)/2+1.2,z);
      requestAnimationFrame(follow);
    }
    window.followWave=true; follow();
    return {sender:o.soldiers.indexOf(a),neighbor:o.soldiers.indexOf(b),moves};
  };
  const wave = await (await wait(setupWave)).jsonValue();
  evidence.staging.push({ type: 'AI wave staged on sand with game gesture API; observer tracks both actors, HUD hidden', ...wave });
  await advance(.1);
  if (feature) await page.evaluate(watchWave);
  const waveStart = await page.evaluate(() => {
    const [a,b] = window.waveCast;
    __omaha.aimAt((a.x+b.x)/2, (a.g.position.y+b.g.position.y)/2 + 1.25, (a.z+b.z)/2);
    __omaha.realism.gesture(a,'wave'); return __omaha.time;
  });
  await wait(t => window.waveCast[0].rz.gest?.kind === 'wave' && __omaha.time >= t+.32, waveStart);
  await shot('09-wave-signal');
  await wait(t => __omaha.time >= t + 1.05, waveStart); await shot('10-wave-response-window');
  if (feature) evidence.reply = await page.evaluate(verifyWave, waveStart);
  // A sightline onto a real carry pose: view the primary and supporting hands obliquely
  // from the front. The selected actor and their rifle remain untouched.
  await page.evaluate(() => { window.followWave=false; });
  const gripActor=await (await wait(() => {
    const o=__omaha, options=o.soldiers.filter(s=>s.alive&&!s.boat&&!s.down&&!s.wounded&&!s.script&&!s.rz?.st&&!s.rz?.gest&&s.model&&['Ready','Hold'].includes(s.arm));
    options.sort((a,b)=>Number(!!b.ensembleRole)-Number(!!a.ensembleRole)||Number(b.act==='Idle')-Number(a.act==='Idle'));
    const dry=s=>s.z<23&&s.z>-80&&!o.nearestObstacle(s.x,s.z,3);
    const s=options.find(dry)??options[0]; if (!s) return false;
    let moved=null;
    if (!dry(s)) {
      const spot=window.waveCast[0]; moved={from:[s.x,s.z],to:[spot.x+2,spot.z]}; [s.x,s.z]=moved.to;
    }
    const hands=['DEF-handL','DEF-handR'].map(n=>s.model.getObjectByName(n));
    const p=o.cam.clone(),q=p.clone();
    function follow() {
      if (!window.followGrip) return;
      const angle=s.g.rotation.y+.48;
      o.player.x=s.x+1.05*Math.sin(angle);o.player.z=s.z+1.05*Math.cos(angle);
      hands[0].getWorldPosition(p);hands[1].getWorldPosition(q);p.lerp(q,.5);o.aimAt(p.x,p.y+.12,p.z);
      requestAnimationFrame(follow);
    }
    window.followGrip=true;follow();return {index:o.soldiers.indexOf(s),role:s.ensembleRole,z:s.z,moved};
  })).jsonValue();
  evidence.staging.push({type:'HUD hidden; first-person observer tracks both hands on an AI carry pose',actor:gripActor});
  await advance(.15); await shot('11-grip-detail');
  await page.evaluate(() => { window.followGrip=false; });
  await cleanHUD.evaluate(el=>el.remove());
  assert.equal(await page.locator('#mute').getAttribute('aria-pressed'), 'true');
  assert.deepEqual(evidence.pageErrors, [], 'no page exceptions');
  evidence.result = 'passed';
} catch (e) {
  evidence.result = 'failed'; evidence.error = String(e.stack ?? e);
  evidence.failureState = await page.evaluate(state).catch(() => null);
  await page.screenshot({ path: join(OUTPUT, 'failure.png'), timeout: 20000 }).catch(() => {});
  throw e;
} finally {
  await writeFile(join(OUTPUT, 'capture.json'), JSON.stringify(evidence, null, 2));
  await browser.close();
}
