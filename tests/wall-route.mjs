// Player-input regression: no teleport, invulnerability, actor placement or assault-state edits.
// GAME_URL points at a running game; OUTPUT receives gameplay frames and a timing trace.
import { chromium } from "playwright";
import { mkdir, writeFile, readFile } from "node:fs/promises";
import { join, extname } from "node:path";
import { createHash } from "node:crypto";
import assert from "node:assert/strict";
const { GAME_URL, OUTPUT, SCREEN, SUBJECT, OFFLINE_THREE, CHROMIUM, BASELINE } =
  process.env;
const touch = SCREEN === "touch",
  width = touch ? 844 : 1000,
  height = touch ? 390 : 600;
const url = new URL(GAME_URL);
await mkdir(OUTPUT, { recursive: true });
const browser = await chromium.launch({
  executablePath: CHROMIUM || undefined,
  args: [
    "--use-angle=swiftshader",
    "--enable-unsafe-swiftshader",
    "--mute-audio",
  ],
});
try {
  const ctx = await browser.newContext({
    viewport: { width, height },
    isMobile: touch,
    hasTouch: touch,
    deviceScaleFactor: 1,
  });
  const page = await ctx.newPage(),
    cdp = await ctx.newCDPSession(page);
  page.setDefaultTimeout(90000);
  const errors = [],
    received = {},
    pending = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const required = [
    "index.html",
    "grip.js",
    "weight.js",
    "ensemble.js",
    "assets/models/gi.glb",
    ...(BASELINE ? [] : ["crowd-rig.mjs"]),
  ];
  const mime = {
    ".mjs": "application/javascript",
    ".js": "application/javascript",
    ".html": "text/html",
    ".glb": "model/gltf-binary",
    ".mp3": "audio/mpeg",
    ".ogg": "audio/ogg",
  };
  if (OFFLINE_THREE) {
    await page.route("https://cdn.jsdelivr.net/npm/three@0.165.0/**", (r) =>
      r.fulfill({
        path: join(
          OFFLINE_THREE,
          new URL(r.request().url()).pathname.split("three@0.165.0/")[1],
        ),
        contentType: mime[".js"],
      }),
    );
  }
  // Offline fixture mode serves unmodified checkout bytes to the browser's requests.
  if (url.hostname === "checkout.test") {
    await page.route("http://checkout.test/**", (r) => {
      let p = new URL(r.request().url()).pathname.slice(1) || "index.html";
      return r.fulfill({
        path: join(SUBJECT, p),
        contentType: mime[extname(p)] || "application/octet-stream",
      });
    });
  }
  // Optional public-only transport on machines where only Node can use the network proxy.
  // Never use local substitutes for live Pages assets, or follow redirects to other hosts.
  if (process.env.PUBLIC_TRANSPORT) {
    assert.equal(url.origin, 'https://derrickwbrownymca.github.io');
    assert(!OFFLINE_THREE);
    await page.route('**/*', async route => {
      const u = new URL(route.request().url());
      if (u.protocol === 'data:' || u.protocol === 'blob:') return route.continue();
      if (![url.origin, 'https://cdn.jsdelivr.net'].includes(u.origin) || route.request().method() !== 'GET') return route.abort();
      try {
        const res = await fetch(u, {redirect: 'error', signal: AbortSignal.timeout(30000)});
        const cors = res.headers.get('access-control-allow-origin');
        await route.fulfill({status: res.status, headers: cors ? {'access-control-allow-origin': cors} : {},
          contentType: res.headers.get('content-type') || 'application/octet-stream', body: Buffer.from(await res.arrayBuffer())});
      } catch (e) {errors.push(e.message); await route.abort();}
    });
  }
  page.on("response", (r) => {
    let u = new URL(r.url());
    if (u.origin !== url.origin) return;
    let p = u.pathname.slice(url.pathname.length) || "index.html";
    if (!required.includes(p)) return;
    pending.push(
      Promise.all([r.body(), readFile(join(SUBJECT, p))])
        .then(([b, ref]) => {
          assert(b.equals(ref), p + " differs from checkout");
          received[p] = createHash("sha256").update(b).digest("hex");
        })
        .catch((e) => errors.push(e.message)),
    );
  });
  await ctx.addInitScript(() => {
    localStorage.setItem("omahaMute", "true");
    localStorage.setItem("omahaQuality", "low");
  });
  await page.goto(String(url), { waitUntil: "commit" });
  await page.waitForFunction(() => window.__omaha?.modelInfo.loaded);
  await Promise.all(pending);
  assert.equal(
    Object.keys(received).length,
    required.length,
    "assets verified",
  );
  const trace = {
    screen: SCREEN,
    source: url.href,
    width,
    height,
    received,
    errors,
    frames: [],
    events: [],
    method:
      "normal player controls; native step() batches at 30Hz between captures; no position, AI, collision or health overrides",
  };
  const save = () =>
    writeFile(join(OUTPUT, "trace.json"), JSON.stringify(trace, null, 2));
  const state = () => {
    const o = __omaha,
      a = o.assault;
    return {
      t: o.time,
      z: o.player.z,
      x: o.player.x,
      hp: o.player.health,
      phase: o.phase,
      stage: a.stage,
      wallAt: a.wallAt,
      gapX: a.gapX,
      open: !!a.walls[0].userData.twin?.visible,
      progress: a.bang,
      model: o.modelInfo.loaded,
      message: document.querySelector("#message").innerText,
    };
  };
  async function shot(name) {
    const s = await page.evaluate(state);
    await page.screenshot({
      path: join(OUTPUT, name + ".jpg"),
      type: "jpeg",
      quality: 85,
    });
    trace.frames.push({ name, ...s });
    await save();
    console.log(name, s.t, s.z, s.phase);
  }
  async function press(sel) {
    if (touch) await page.locator(sel).tap();
    else await page.locator(sel).click();
  }
  await press("#start");
  await page.waitForFunction(() => __omaha.phase === "cinematic");
  await page.evaluate(() => __omaha.cine.seek(2.05));
  await shot("01-intro");
  await page.evaluate(() => __omaha.cine.seek(10.2));
  await shot("02-troops");
  await page.evaluate(() => __omaha.cine.seek(22));
  await shot("02-wide");
  if (touch) await press("#cineSkip");
  else await page.keyboard.press("Space");
  await page.evaluate(() => __omaha.step(460, 1 / 30));
  const stick = async (x, y) => {
    const b = await page.locator("#joystick").boundingBox();
    assert(b);
    const p = { x: b.x + b.width / 2, y: b.y + b.height / 2, id: 1 };
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [p],
    });
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [{ ...p, x: p.x + x * 40, y: p.y + y * 40 }],
    });
  };
  let held = false;
  const endStick = async () => {
    if (held) {
      await cdp.send("Input.dispatchTouchEvent", {
        type: "touchEnd",
        touchPoints: [],
      });
      held = false;
    }
  };
  async function drive(x, y) {
    if (touch) {
      await endStick();
      await stick(x, y);
      held = true;
    } else {
      for (const [k, v] of Object.entries({
        w: y < 0,
        a: x < 0,
        d: x > 0,
        Shift: y < 0,
      })) {
        await page.keyboard[v ? "down" : "up"](k);
      }
    }
  }
  if (touch) await press("#mobSprint");
  await drive(0, -1);
  let wall = false,
    opened = false,
    passed = false,
    land = false,
    deaths = 0;
  for (let i = 0; i < 700 && !passed; i++) {
    let s = await page.evaluate(state);
    if (s.phase === "dead") {
      trace.events.push({ death: s.t, x: s.x, z: s.z });
      assert(++deaths < 14, "too many casualties");
      if (touch) await endStick();
      await press("#start");
      await drive(0, -1);
      continue;
    }
    if (!s.phase.startsWith("beach"))
      throw Error("unexpected phase " + s.phase);
    if (s.z < 35 && !(await page.evaluate(() => __omaha.player.crouched))) {
      if (touch) {
        await endStick();
        await press("#mobCrouch");
        await drive(0, -1);
      } else await page.keyboard.down("c");
    }
    if (!touch && i % 8 === 0) await page.keyboard.press("r");
    if (!land && s.z < 0) {
      land = true;
      await shot("03-beach");
    }
    if (s.stage === 1 && !wall) {
      wall = true;
      trace.events.push({ arrival: s.wallAt, ...s });
      await shot("04-wall");
      // An additional player-eye inspection, not a posed scene: turn towards an actual nearby
      // squad member, then face the breach again. Keep the unaltered HUD frame above.
      await drive(0, 0);
      const target = await page.evaluate(() => {
        const o = __omaha,
          p = o.player;
        const pool = [
          ...o.soldiers.filter(
            (a) => a.alive && !a.boat && !a.down && !a.wounded && a.g.visible,
          ),
          ...o.crowdAgents.filter((a) => !a.down && a.z < -170),
        ]
          .map((a) => ({
            x: a.x,
            z: a.z,
            dist: Math.hypot(a.x - p.x, a.z - p.z),
            detailed: !!a.g,
          }))
          .filter((a) => a.dist > 1.8 && a.z > -185.9)
          .sort((a, b) => a.dist - b.dist);
        const a = pool[0];
        if (a) {
          o.aimAt(a.x, o.cam.y - 0.38, a.z);
          o.step(1, 1 / 30);
        }
        return a;
      });
      if (target) {
        trace.events.push({ inspectedActor: target });
        const style = await page.addStyleTag({
          content:
            "#hud,#mobile,#looktip,#coach,#ctrlBtn{visibility:hidden!important}",
        });
        await shot("04-wall-squad");
        await style.evaluate((n) => n.remove());
      }
      await page.evaluate(() => {
        const o = __omaha;
        o.aimAt(o.assault.gapX, o.cam.y + 0.12, o.player.z - 30);
      });
      await drive(0, -1);
    }
    const lateral = s.stage >= 1 && s.z < -175 && Math.abs(s.x - s.gapX) > 1.5;
    if (lateral) {
      await drive(Math.sign(s.gapX - s.x), 0);
    }
    if (s.open && !opened) {
      opened = true;
      trace.events.push({ opening: s.t, ...s });
      await shot("05-opening");
    }
    if (opened && s.z < -190) {
      passed = true;
      trace.events.push({ crossed: s.t, ...s });
      await shot("06-through");
      break;
    }
    // Small steps near wall, for timing resolution. Log the first move off the collision stop.
    if (
      s.open &&
      s.z < (BASELINE ? -185.21 : -185.76) &&
      !trace.events.some((e) => "movingThrough" in e)
    )
      trace.events.push({ movingThrough: s.t, ...s });
    const n = lateral
      ? Math.max(4, Math.min(75, Math.floor(Math.abs(s.x - s.gapX) * 10)))
      : s.z < -182 &&
          ((s.stage === 1 && s.progress > 0.98) || (s.open && s.z > -186))
        ? 1
        : s.stage === 1 || s.z < -180
          ? 24
          : 90;
    await page.evaluate((n) => __omaha.step(n, 1 / 30), n);
    if (lateral) await drive(0, -1);
  }
  assert(passed, "did not cross the wall");
  assert(!errors.length, errors.join("; "));
  const arrival = trace.events.filter((e) => "arrival" in e).at(-1),
    opening = trace.events.filter((e) => "opening" in e).at(-1),
    crossed = trace.events.filter((e) => "crossed" in e).at(-1);
  trace.wait = opening.t - arrival.wallAt;
  trace.crossing = crossed.t - opening.t;
  await save();
  console.log({ wait: trace.wait, crossing: trace.crossing, deaths });
  if (!BASELINE) assert(trace.wait < 19, "opening took too long");
} finally {
  await browser.close();
}
