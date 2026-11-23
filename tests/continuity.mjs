// Executed in the live page. Hold actual identities, not just matching role labels.
export function rememberCast() {
  const o = window.__omaha;
  window.landingCast = ['roll','net'].map((role,i) => {
    const s = o.soldiers.find(s => s.boat && s.ensembleRole === role);
    const name = ['Shoulder blanket','Helmet net'][i], gear = s?.model?.getObjectByName(name);
    if (!gear) throw Error(`Missing ${name} on boat`);
    return {s, role, name, gear};
  });
}
export function confirmLanding() {
  return window.landingCast.map(({s,role,name,gear}) => {
    const actor = window.__omaha.soldiers.indexOf(s);
    if (actor < 0 || s.boat || s.ensembleRole !== role || s.model.getObjectByName(name) !== gear)
      throw Error(`${name} did not disembark with its original actor`);
    return {actor,role,name,x:s.x,z:s.z};
  });
}
export function watchWave() {
  const o = window.__omaha, sender = window.waveCast[0];
  window.waveTrace = [];
  function sample() {
    window.waveTrace.push({time:o.time,replies:o.waveResponses(sender)});
    if (!window.waveTraceDone && window.waveTrace.length < 1200) requestAnimationFrame(sample);
  }
  sample();
}
export function verifyWave(signal) {
  window.waveTraceDone = true;
  const replies = window.waveTrace.flatMap(s=>s.replies.filter(r=>r.signal===signal));
  const actors = new Set(replies.map(r=>r.actor));
  const expected = window.__omaha.soldiers.indexOf(window.waveCast[1]);
  const peak = replies.filter(r=>r.posed!==null && r.posed>=r.start && r.start-r.signal>=.479)
    .reduce((best,r)=>r.angle>(best?.angle??0)?r:best,null);
  if (actors.size !== 1 || !actors.has(expected) || !replies.some(r=>r.posed===null) || !(peak?.angle>.18))
    throw Error(`Expected one delayed, visibly posed listener; saw ${JSON.stringify(replies.slice(-3))}`);
  return peak;
}
