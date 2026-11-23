// A render-only layer above the GI's authored gait and carry clips. The display
// group pivots at the soles; neither the player position nor the camera moves.
(() => {
  const states = new WeakMap();
  const limit = (n, lo, hi) => Math.min(hi, Math.max(lo, n));
  const blend = (rate, dt) => -Math.expm1(-rate * dt);

  function reset(body) {
    states.delete(body);
    body.g.rotation.x = body.g.rotation.z = 0;
    body.g.scale.y = 1;
  }

  function update(body, dt, dx, dz, yaw, low) {
    if (!(dt > 0)) return; // Paused: hold the exact rendered pose.
    const vx = dx / dt, vz = dz / dt;
    if (dt > .2 || !(Math.hypot(vx, vz) < 30)) { reset(body); return; }
    let s = states.get(body);
    const stance = low ? 1 : 0;
    if (!s) {
      s = { feetX: 0, feetZ: 0, loadX: 0, loadZ: 0, knees: stance, pack: stance };
      states.set(body, s);
    }

    // Feet respond quickly to the stick or keys. The pack carries on for a
    // fraction of a second: releasing a sprint loads the lead foot, then settles.
    const feet = blend(23, dt), load = blend(5.5, dt);
    s.feetX += (vx - s.feetX) * feet;
    s.feetZ += (vz - s.feetZ) * feet;
    s.loadX += (vx - s.loadX) * load;
    s.loadZ += (vz - s.loadZ) * load;
    const rx = s.loadX - s.feetX, rz = s.loadZ - s.feetZ;
    const sin = Math.sin(yaw), cos = Math.cos(yaw);
    const forward = -sin * s.loadX - cos * s.loadZ;
    const right = cos * s.loadX - sin * s.loadZ;
    const residualF = -sin * rx - cos * rz, residualR = cos * rx - sin * rz;
    // Only a deceleration compresses the stance; accelerating out of rest
    // shouldn't make the soldier sink before the first step.
    const brake = Math.max(0, (rx * s.loadX + rz * s.loadZ) / Math.max(1, Math.hypot(s.loadX, s.loadZ)));

    // Two response times shape a brief shoulder fold going down and a delayed
    // unload on the way up. The authored crouch provides the sustained height.
    s.knees += (stance - s.knees) * blend(low ? 19 : 12, dt);
    s.pack += (stance - s.pack) * blend(low ? 5 : 4, dt);
    const fold = s.knees - s.pack;
    // GI faces local +Z / -X to screen right. Yaw first, then local lean.
    body.g.rotation.set(limit(.007 * forward + .032 * residualF + .16 * fold, -.19, .23),
      body.g.rotation.y, limit(.005 * right + .022 * residualR, -.14, .14), 'YXZ');
    body.g.scale.y = 1 - Math.min(.065, .009 * brake + .048 * Math.abs(fold));
  }

  globalThis.OmahaWeight = Object.freeze({ update, reset });
})();
