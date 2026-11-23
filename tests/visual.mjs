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
    drawCalls: o.renderInfo.calls, study: window.studyFrame };
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
  const setupWave = feature => {
    const o = __omaha;
    const listening = new Set(feature ? o.soldiers.flatMap(s=>o.waveResponses(s)).map(r=>r.actor) : []);
    const candidates = o.soldiers.filter((s,i) => !listening.has(i) && s.alive && !s.boat && !s.down && !s.wounded && !s.script && !s.rz?.st && !s.rz?.gest && s.model);
    if (candidates.length < 2) return false;
    candidates.sort((a,b) => Number(!!b.ensembleRole)-Number(!!a.ensembleRole));
    // Upper beach, seaward of the -183 m barricade clamp but outside the gun AI's
    // z > -170 target region and random shell spawn range (|x| <= 370). Check
    // existing aim lines too. The player stays 61 m seaward, outside the reach of
    // player-focused shells (±45 m Z + 14 m blast), still within near-rig LOD.
    const pair = candidates.slice(0,2), z=-178;
    const x=[409,-409,400,-400].find(x=>!o.nearestObstacle(x,z,7) &&
      o.soldiers.every(s=>pair.includes(s)||Math.hypot(s.x-x,s.z-z)>25) && o.guns.every(g=>{
        const dx=g.aimX-g.x,dz=g.aimZ-g.z,k=Math.max(0,Math.min(1,((x-g.x)*dx+(z-g.z)*dz)/(dx*dx+dz*dz||1)));
        return Math.hypot(x-g.x-k*dx,z-g.z-k*dz)>12;
      }));
    if (x===undefined) return false;
    const moves=pair.map((s,i)=>{
      const from=[s.x,s.z]; s.x=x+(i?.72:-.72); s.z=z;
      // Position and blocking only; enter the game's normal hold state. Do not
      // set gestures, reactions, health, bones, speed, LOD or response data.
      s.aiState='hold';s.aiUntil=o.time+9;s.face=i?-.28:.28;
      return {actor:o.soldiers.indexOf(s),role:s.ensembleRole,from,to:[s.x,s.z]};
    });
    window.waveCast=pair;o.player.x=x;o.player.z=z+61;
    const scene=pair[0].g.parent; if(!scene.isScene)throw Error('Expected actors in the live scene');
    const before=scene.onBeforeRender,after=scene.onAfterRender, pos=o.cam.clone(), points=[];
    const bones=pair.map(s=>['DEF-head','DEF-handL','DEF-handR','DEF-hips'].map(n=>s.model.getObjectByName(n)));
    scene.onBeforeRender=function(renderer,world,camera,...rest){
      before.call(this,renderer,world,camera,...rest);
      const grip=window.studyGrip!==undefined, ids=grip?[window.studyGrip]:[0,1];
      const marks=ids.flatMap(i=>bones[i].slice(0,grip?3:4).map((bone,j)=>{
        const p=bone.getWorldPosition(pos.clone());return {key:`${i}:${bone.name}`,p,j};
      }));
      // Only the render camera moves. Fit both helmets and all participating hands
      // from their current world positions; restore the gameplay camera before update.
      points.length=0;
      for(const {p,j} of marks){points.push(p.clone().addScalar(.10),p.clone().addScalar(-.10));if(j===0)points.push(p.clone().setY(p.y+.24));}
      const bounds=['x','y','z'].map(axis=>{const a=points.map(p=>p[axis]);return [Math.min(...a),Math.max(...a)];});
      const center=pos.clone().set(...bounds.map(([a,b])=>(a+b)/2));
      const [w,h,d]=bounds.map(([a,b])=>b-a), tan=Math.tan(camera.fov*Math.PI/360);
      const az=grip?-.40:0, distance=Math.max(.90,(w*Math.cos(az)+d*Math.abs(Math.sin(az)))/(2*camera.aspect*tan),h/(2*tan))*1.20 + (d+w*Math.abs(Math.sin(az)))/2;
      window.studyCamera={eye:camera.position.clone(),q:camera.quaternion.clone()};
      camera.position.copy(center);camera.position.x+=Math.sin(az)*distance;camera.position.z-=Math.cos(az)*distance;
      camera.lookAt(center);camera.updateMatrixWorld(true);
      window.studyFrame={t:o.time,actors:ids.map(i=>({i,act:pair[i].act,high:!!pair[i].hi?.visible,down:!!pair[i].down,wounded:!!pair[i].wounded,reaction:pair[i].rz?.st})),
        ndc:marks.map(({key,p})=>({key,xyz:p.project(camera).toArray()}))};
    };
    scene.onAfterRender=function(renderer,world,camera,...rest){
      if(window.studyCamera){camera.position.copy(window.studyCamera.eye);camera.quaternion.copy(window.studyCamera.q);camera.updateMatrixWorld(true);}
      after.call(this,renderer,world,camera,...rest);
      // Browser screenshots can arrive almost a game second late. Save the real
      // WebGL framebuffer before Chromium discards it, on the exact posed frame.
      if(window.studyCue!==undefined && window.studyGrip===undefined){
        const elapsed=o.time-window.studyCue, reply=feature?o.waveResponses(pair[0]).find(r=>r.signal===window.studyCue):null;
        const label=elapsed>=.35&&elapsed<.48?'contact':feature?
          reply?.angle>.18&&o.time>=reply.start+.62?'response':null:elapsed>=1.34?'response':null;
        if(label&&!window.exactFrames[label]) window.exactFrames[label]={
          t:o.time,reply,study:window.studyFrame,png:renderer.domElement.toDataURL('image/png')};
      }
    };
    window.endStudy=()=>{scene.onBeforeRender=before;scene.onAfterRender=after;};
    return {sender:moves[0].actor,neighbor:moves[1].actor,moves,player:[o.player.x,o.player.z],blocking:'native hold',camera:'render-only, fit posed heads and palms'};
  };
  const wave = await (await wait(setupWave,feature)).jsonValue();
  evidence.staging.push({ type: 'AI wave staged on sand with game gesture API; observer tracks both actors, HUD hidden', ...wave });
  await advance(.1);
  if (feature) await page.evaluate(watchWave);
  const cue = await page.evaluate(feature => {
    const o=__omaha,[a,b]=window.waveCast;
    if (![a,b].every(s=>s.alive&&!s.boat&&!s.wounded&&!s.down&&!s.script&&!s.rz.st&&!s.rz.gest&&s.hi.visible))
      throw Error(`Wave cue not eligible: ${JSON.stringify(window.studyFrame?.actors)}`);
    const t=window.studyCue=o.time; window.exactFrames={}; o.realism.gesture(a,'wave'); // eligibility + actual emit + selection: one tick
    return {t,replies:feature?o.waveResponses(a):[],frame:window.studyFrame};
  },feature);
  const waveStart = cue.t; evidence.cue=cue;
  if(feature) assert.deepEqual(cue.replies.map(r=>[r.actor,r.signal,r.posed]),[[wave.neighbor,waveStart,null]],'exactly the staged listener selected before posing');
  await wait(t => window.waveCast[0].rz.gest?.kind === 'wave' && __omaha.time >= t+.32, waveStart);
  await shot('09-wave-signal');
  await wait(t => __omaha.time >= t,feature?cue.replies[0].start+.57:waveStart+1.20);
  await shot('10-wave-response-window');
  if (feature) evidence.reply = await page.evaluate(verifyWave, waveStart);
  await wait(()=>Object.keys(window.exactFrames).length===2||__omaha.time>window.studyCue+2.4);
  const exact=await page.evaluate(async()=>{
    const frames=window.exactFrames;
    if(!frames.contact||!frames.response)throw Error(`Missing exact render: ${Object.keys(frames)}`);
    const pictures=await Promise.all([frames.contact,frames.response].map(async({png})=>{
      const img=new Image(); img.src=png; await img.decode();return img;
    }));
    const strip=document.createElement('canvas');strip.width=pictures[0].width*2;strip.height=pictures[0].height;
    const ctx=strip.getContext('2d'); pictures.forEach((img,i)=>ctx.drawImage(img,i*img.width,0));
    return {...frames,sequence:{png:strip.toDataURL('image/png')}};
  });
  evidence.exactFrames={};
  for(const [name,{png,...meta}] of Object.entries(exact)){
    const file=`wave-${name}.png`; assert(png.startsWith('data:image/png;base64,'));
    await writeFile(join(OUTPUT,file),Buffer.from(png.slice(png.indexOf(',')+1),'base64'));
    evidence.exactFrames[name]={file,...meta};
    if(meta.study) assert(meta.study.ndc.every(({xyz:[x,y,z]})=>Math.abs(x)<.96&&Math.abs(y)<.96&&Math.abs(z)<1),`${name}: exact rendered heads and palms in frame`);
  }
  // Once the sender has naturally resumed carry, frame their unmodified grip.
  await wait(()=>{const s=window.waveCast[0];return !s.rz.gest&&!s.rz.st&&!s.wounded&&!s.down&&['Ready','Hold'].includes(s.arm);});
  await page.evaluate(()=>{window.studyGrip=0;});
  evidence.staging.push({type:'HUD hidden; oblique render-camera view of sender after normal return to carry',actor:wave.sender});
  await advance(.15); await shot('11-grip-detail');
  for(const frame of evidence.frames.slice(-3)) for(const state of [frame.before,frame.after]) {
    assert(state.study?.actors.every(a=>a.high&&!a.down&&!a.wounded&&!a.reaction),`${frame.name}: live uninjured high-detail subjects`);
    assert(state.study.ndc.every(({xyz:[x,y,z]})=>Math.abs(x)<.96&&Math.abs(y)<.96&&Math.abs(z)<1),`${frame.name}: heads and hands inside the rendered frame`);
  }
  await page.evaluate(() => window.endStudy());
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
