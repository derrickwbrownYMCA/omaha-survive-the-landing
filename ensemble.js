// Two men in the same landing party from the opening shot through the surf.
// The module passes THREE in; this deliberately has no game-state or audio dependencies.
function createLandingEnsemble(T) {
  const rigs = new WeakMap(), replies = new Map();
  const target = new T.Vector3(), pole = new T.Vector3(), palm = new T.Vector3(), wrist = new T.Vector3();
  const ease = x => (x = Math.min(1, Math.max(0, x)), x*x*(3-2*x));
  const beat = (t,a,b,c,d) => ease((t-a)/(b-a)) * (1-ease((t-c)/(d-c)));
  const ready = s => s.alive && !s.boat && !s.down && !s.wounded && !s.script && !s.rz?.st;

  // Decorations are modelled in the GI mesh's bind space, then follow the same bone
  // as the original kit. No per-frame gear repositioning or new crowd variants.
  function mount(hi, name) {
    const i = hi.skeleton.bones.findIndex(b => b.name === name);
    if (i < 0) return null;
    const frame = new T.Group();
    frame.matrix.multiplyMatrices(hi.skeleton.boneInverses[i], hi.bindMatrix);
    frame.matrixAutoUpdate = false;
    hi.skeleton.bones[i].add(frame);
    return frame;
  }
  function paintBounds(geo, hex) {
    const box = new T.Box3(), color = new T.Color(hex), {position:p,color:c} = geo.attributes;
    for (let i=0;i<p.count;i++) {
      if (Math.abs(c.getX(i)-color.r)+Math.abs(c.getY(i)-color.g)+Math.abs(c.getZ(i)-color.b)<.001)
        box.expandByPoint(target.fromBufferAttribute(p,i));
    }
    return box;
  }
  function wool(parent,x,y,z,k=1) {
    const roll = new T.Group(); roll.name = 'Shoulder blanket';
    parent.add(roll); roll.position.set(x,y,z); roll.rotation.z = 1.20; roll.scale.setScalar(k);
    function tube(radius,length,color,y) {
      const m=new T.Mesh(new T.CylinderGeometry(radius,radius,length,16),new T.MeshStandardMaterial({color,roughness:1}));
      m.position.y=y; roll.add(m);
    }
    tube(.102,.64,0xa18a62,0);
    for (const y of [-.19,.18]) tube(.105,.043,0x4d4936,y);
    // Visible folds at the rolled ends.
    for (const side of [-1,1]) { tube(.069,.008,0x736047,side*.32); tube(.033,.01,0x95815d,side*.325); }
  }
  function helmet(parent,box) {
    if(box.isEmpty())return;
    const center = box.getCenter(new T.Vector3()), size=box.getSize(new T.Vector3());
    const rx=size.x*.49, rz=size.z*.495, high=size.y*.81, brim=box.max.y-high;
    const pts=[];
    const point=(a,p)=>[center.x+rx*Math.cos(a)*Math.sin(p),brim+high*Math.cos(p),center.z+rz*Math.sin(a)*Math.sin(p)];
    // Diamond mesh fashioned from two sets of cords, and a few short cloth tabs
    // breaking the rim: the outline still reads when individual cords are subpixel.
    for(let i=0;i<12;i++)for(const dir of [-1,1])for(let j=0;j<9;j++) {
      const sample=k=>point(i*Math.PI/6+dir*k*.096,.12+k*.164);
      pts.push(...sample(j),...sample(j+1));
    }
    const geo=new T.BufferGeometry(); geo.setAttribute('position',new T.Float32BufferAttribute(pts,3));
    parent.add(new T.LineSegments(geo,new T.LineBasicMaterial({color:0xb6a781})));
    const tabs=new T.InstancedMesh(new T.BoxGeometry(.029,.079,.015),new T.MeshStandardMaterial({color:0x857f58,roughness:1}),7);
    const tmp=new T.Object3D();
    for(let i=0;i<7;i++){const a=i*.898+.4;tmp.position.fromArray(point(a,1.38));tmp.rotation.set(.21,a+.96,(i%3-1)*.46);tmp.updateMatrix();tabs.setMatrixAt(i,tmp.matrix)}
    parent.add(tabs);
  }
  function rig(s) {
    let r=rigs.get(s);
    if(r && r.model===s.model)return r;
    if(!s.model)return null;
    const bone=n=>s.model.getObjectByName('DEF-'+n);
    r={model:s.model,neck:bone('neck'),ua:bone('upper_armL'),fa:bone('forearmL'),h:bone('handL'),knuckle:bone('f_middle01L'),head:bone('head'), saved:[], count:0};
    const j=s.hi?.skeleton.bones.indexOf(r.head)??-1;
    if(j>=0)r.forward=new T.Vector3(0,0,1).transformDirection(s.hi.bindMatrix).transformDirection(s.hi.skeleton.boneInverses[j]);
    rigs.set(s,r);return r;
  }
  function dress(s,r) {
    if(!s.ensembleRole || r.dressed || !s.hi)return;
    r.dressed=true;
    if(s.ensembleRole==='roll'){
      const frame=mount(s.hi,'DEF-spine003'),pack=paintBounds(s.hi.geometry,0x555233);
      if(frame&&!pack.isEmpty()) wool(frame,-.045,pack.max.y+.09,pack.min.z+.045);
      if(s.rz?.u) s.rz.u.rzHide.value=(s.rz.u.rzHide.value & ~(1<<2)) | (1<<3);
    }else{
      const frame=mount(s.hi,'DEF-head'),box=paintBounds(s.hi.geometry,0x3a4428);
      if(!frame||box.isEmpty())return;
      // Match the vertex shader's tilt about its bind-space pivot.
      const u=s.rz?.u, net=new T.Group(); net.name='Helmet net'; frame.add(net);
      if(u){u.rzTilt.value.set(-.09,.16);net.rotation.set(-.09,0,.16,'ZYX');
        const p=u.rzPivot.value;net.position.copy(p).sub(target.copy(p).applyQuaternion(net.quaternion));}
      helmet(net,box);
    }
  }
  // Mixer tracks can cache constant samples and LOD can skip an update. Restore the
  // underlying pose explicitly; multiplying a nod into last frame's nod would drift.
  function remember(r,bone){if(!bone)return;const i=r.count++, item=r.saved[i]||(r.saved[i]={q:new T.Quaternion()});item.bone=bone;item.q.copy(bone.quaternion)}
  function reset(s){const r=rigs.get(s);if(!r)return;for(let i=0;i<r.count;i++){const b=r.saved[i];b.bone.quaternion.copy(b.q)}r.count=0}
  function look(r,yaw,pitch){if(!r.neck)return;remember(r,r.neck);r.neck.rotateY(yaw);r.neck.rotateX(pitch)}
  function cast(men){
    if(men.length<2)return;
    const [a,b]=men;a.ensembleRole='roll';b.ensembleRole='net';
    a.x=-3.36;a.z=105.79;b.x=-2.18;b.z=105.6;
    a.g.position.x=a.x;b.g.position.x=b.x;
  }
  function leftHandRelease(s,t){return s.ensembleRole==='roll'?beat(t,.3,1.65,8.15,9.7):0}
  function cinematic(s,t,boat,gestures){
    if(!s.ensembleRole)return;const r=rig(s);if(!r)return;dress(s,r);
    if(t>=10)return;
    const first=s.ensembleRole==='roll', turn=first?beat(t,2.15,3.35,7.55,8.85):beat(t,3.5,4.55,7.4,8.6);
    const nod=first?.15*beat(t,6.4,6.76,6.86,7.3):.34*beat(t,4.95,5.48,5.68,6.13);
    // The carry clip already angles the face toward the aisle. The second man
    // turns a shoulder as well as his neck to look back across that stance.
    s.g.rotateY((first?-.07:.69)*turn);
    look(r,(first?-1:1)*turn*.93,nod);
    const w=leftHandRelease(s,t);if(!w||!r.ua||!r.fa||!r.h)return;
    remember(r,r.ua);remember(r,r.fa);
    s.g.updateMatrixWorld(true);
    // The left gunwale's lip is at x=-3.7, y=3.1 in the moving hull, not world space.
    boat.localToWorld(target.set(-3.56,3.105,s.z-110-.26));
    boat.localToWorld(pole.set(-3.05,2.52,s.z-110+.10));
    gestures.ik(r,target,pole,w);
    // The glove rests on the lip, not the wrist joint. The GI's deliberately thickened
    // (non-uniformly scaled) arms leave a small solver residual; correct in palm space.
    if(r.knuckle && w>.7) for(let i=0;i<2;i++){
      boat.localToWorld(target.set(-3.66,3.105,s.z-110-.36));
      target.sub(r.knuckle.getWorldPosition(palm)).add(r.h.getWorldPosition(wrist));
      gestures.ik(r,target,pole,ease((w-.7)/.3));
    }
  }
  function signal(from,men,t){
    if(!ready(from))return null;
    // Only one listener per wave, within earshot/eyeshot. No group animation or
    // callbacks bound to wall time: pausing the simulation pauses the reply too.
    let nearest=null, best=7.5*7.5;
    for(const s of men){if(s===from||!ready(s)||s.rz?.gest||replies.has(s))continue;
      const d=(from.x-s.x)**2+(from.z-s.z)**2;
      if(d<best&&d>.09){nearest=s;best=d}}
    if(!nearest)return null;
    const delay=.48+.17*(Math.sin(nearest.seed||0)+1);
    replies.set(nearest,{from,signal:t,start:t+delay,posed:null});return nearest;
  }
  function beach(s,t){
    // The player can skip before the GLB arrives; attach the same kit on its first loaded frame.
    if(s.ensembleRole && s.model) dress(s,rig(s));
    const ack=replies.get(s);if(!ack)return;
    const u=t-ack.start,from=ack.from;
    if(u>1.9||!ready(s)||!ready(from)||s.rz?.gest||Math.hypot(s.x-from.x,s.z-from.z)>10){replies.delete(s);return}
    if(u<0)return;const r=rig(s);if(!r)return;
    let facing=s.g.rotation.y;
    if(r.forward){r.head.updateWorldMatrix(true,false);target.copy(r.forward).transformDirection(r.head.matrixWorld);facing=Math.atan2(target.x,target.z)}
    const angle=Math.atan2(from.x-s.x,from.z-s.z)-facing;
    const yaw=Math.max(-1.06,Math.min(1.06,Math.atan2(Math.sin(angle),Math.cos(angle))));
    look(r,yaw*beat(u,0,.45,1.28,1.9),.28*beat(u,.38,.69,.83,1.29));
    if(r.neck && u>0 && ack.posed===null)ack.posed=t;
  }
  function recycle(s){reset(s);replies.delete(s);for(const [other,a] of replies)if(a.from===s)replies.delete(other)}
  // Read-only pose diagnostics for the game's existing visual-inspection API.
  function responses(from,men){return [...replies].filter(([,a])=>a.from===from).map(([actor,a])=>{
    const r=rigs.get(actor);
    // Measure the applied look relative to this frame's underlying animation.
    const saved=r?.count && r.saved[0];
    const angle=saved && saved.bone===r.neck ? saved.q.angleTo(r.neck.quaternion) : 0;
    return {actor:men.indexOf(actor),signal:a.signal,start:a.start,posed:a.posed,angle};
  })}
  return {cast,reset,cinematic,leftHandRelease,signal,beach,recycle,responses};
}
