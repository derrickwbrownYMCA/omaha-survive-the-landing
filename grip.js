// Cosmetic posing only. The prop is rigidly skinned to the right hand in both meshes.
// Use its actual bind transform, not camera/shot coordinates or a guessed world-space muzzle.
function createSoldierGrip(T) {
  const vec = () => new T.Vector3(), quat = () => new T.Quaternion();
  const rigs = new WeakMap();
  const a=vec(), b=vec(), c=vec(), ray=vec(), side=vec(), elbow=vec(), pole=vec(), target=vec();
  const from=vec(), to=vec(), contact=vec(), offset=vec(), axis=vec();
  const inv=new T.Matrix4(), prop=new T.Matrix4(), rot=quat(), basis=quat(), wrist=quat(), palm=quat();
  const position=(bone,v)=>v.setFromMatrixPosition(bone.matrixWorld);

  function calibrate(model, frame) {
    // Stored as plain numbers so SkeletonUtils.clone carries the binding into every actor.
    model.userData.propGripFrame=frame.toArray();
  }
  function rig(s) {
    if (rigs.has(s)) return rigs.get(s);
    const model=s.model, frame=model?.userData.propGripFrame;
    if (!frame) return null;
    function arm(suffix) {
      const named=n=>model.getObjectByName('DEF-'+n+suffix);
      return {upper:named('upper_arm'),lower:named('forearm'),hand:named('hand'),knuckle:named('f_middle01')};
    }
    const r={left:arm('L'),right:arm('R'),frame:new T.Matrix4().fromArray(frame),applied:false};
    if ([r.left,r.right].some(h=>!h.upper||!h.lower||!h.hand||!h.knuckle)) {rigs.set(s,null);return null;}
    r.bones=[r.right.upper,r.right.lower,r.right.hand,r.left.upper,r.left.lower,r.left.hand];
    r.saved=r.bones.map(quat); rigs.set(s,r); return r;
  }
  function reset(s) {
    const r=rigs.get(s);
    if (!r?.applied) return;
    for(let i=0;i<r.bones.length;i++) r.bones[i].quaternion.copy(r.saved[i]);
    r.applied=false;
  }
  // Rotate in parent space. World quaternions alone give distorted answers under the
  // non-uniform bone scales used to thicken the model's sleeves.
  function turn(bone,start,end,dest) {
    inv.copy(bone.parent.matrixWorld).invert();
    from.copy(end).applyMatrix4(inv); to.copy(dest).applyMatrix4(inv);
    offset.copy(start).applyMatrix4(inv); from.sub(offset); to.sub(offset);
    if(from.lengthSq()>1e-10&&to.lengthSq()>1e-10)
      bone.quaternion.premultiply(rot.setFromUnitVectors(from.normalize(),to.normalize()));
    bone.updateWorldMatrix(false,false);
  }
  function bend(h,goal,hint) {
    const u=h.upper,l=h.lower,w=h.hand;
    position(u,a); position(l,b); position(w,c);
    const la=a.distanceTo(b),lb=b.distanceTo(c);
    if(la<1e-5||lb<1e-5)return;
    ray.subVectors(goal,a);
    const reach=Math.max(Math.abs(la-lb)+.0001,Math.min(la+lb-.0001,ray.length()));ray.normalize();
    const along=(la*la+reach*reach-lb*lb)/(2*reach);
    side.subVectors(hint,a);side.addScaledVector(ray,-side.dot(ray)).normalize();
    elbow.copy(a).addScaledVector(ray,along).addScaledVector(side,Math.sqrt(Math.max(0,la*la-along*along)));
    turn(u,a,b,elbow);l.updateWorldMatrix(false,false);w.updateWorldMatrix(false,false);
    position(l,b);position(w,c);turn(l,b,c,goal);w.updateWorldMatrix(false,false);
  }
  function aimWrist(h,orientation) {
    h.hand.parent.getWorldQuaternion(basis);
    h.hand.quaternion.copy(basis.invert().multiply(orientation)).normalize();
    h.hand.updateWorldMatrix(false,false);
  }
  function elbowPole(model,h,lr) {
    // Work in model axes, not world axes: soldiers lean on the moving boat and crouch.
    pole.set(lr*.33,-.53,-.08).transformDirection(model.matrixWorld);
    return pole.add(position(h.upper,a));
  }
  function pose(s,release=0) {
    // Full-body reactions/tending use their authored arms; the primary palm still owns the prop.
    if(!s.model||(s.arm!=='Hold'&&s.arm!=='Ready')) return;
    const r=rig(s); if(!r)return;
    if(r.applied) reset(s);
    const right=r.right,left=r.left;
    for(let i=0;i<r.bones.length;i++)r.saved[i].copy(r.bones[i].quaternion);
    r.applied=true;
    right.hand.updateWorldMatrix(true,false);left.hand.updateWorldMatrix(true,false);
    prop.multiplyMatrices(right.hand.matrixWorld,r.frame);
    // Bring the pistol clip's extended primary wrist back toward the shoulder without
    // losing the clip's carry/ready angle. This also brings the fore-end within reach.
    target.set(-.26,0,.04).applyMatrix4(prop).sub(contact.set(0,0,0).applyMatrix4(prop));
    target.add(position(right.hand,a));right.hand.getWorldQuaternion(wrist);
    elbowPole(s.model,right,-1);bend(right,target,pole);bend(right,target,pole);aimWrist(right,wrist);
    if(release>=1)return;
    prop.multiplyMatrices(right.hand.matrixWorld,r.frame);
    left.hand.getWorldQuaternion(palm);
    // Turn the supporting palm up around the fore-end rather than cupping the primary hand.
    axis.set(1,0,0).transformDirection(prop);palm.premultiply(rot.setFromAxisAngle(axis,-1.12));
    // Orient first so the wrist offset is measured from the actual middle knuckle.
    aimWrist(left,palm);left.knuckle.updateWorldMatrix(true,false);
    offset.copy(position(left.knuckle,c)).sub(position(left.hand,b)).multiplyScalar(.72);
    target.set(.205,-.018,.012).applyMatrix4(prop).sub(offset);
    elbowPole(s.model,left,1);bend(left,target,pole);aimWrist(left,palm);
    // Refit against the actual posed palm: the thickened sleeves scale the offset
    // differently when the elbow turns, particularly during crouch/hold blends.
    left.knuckle.updateWorldMatrix(true,false);
    offset.copy(position(left.knuckle,c)).sub(position(left.hand,b)).multiplyScalar(.72);
    target.set(.205,-.018,.012).applyMatrix4(prop).sub(offset);
    bend(left,target,pole);aimWrist(left,palm);
    if(release>0)for(let i=3;i<6;i++)r.bones[i].quaternion.slerp(r.saved[i],release);
  }
  // Box figures are visible while the GLB streams (or if it fails). Their arm pose
  // can be fitted once in local space; the entire held assembly moves with the body.
  function fallback(s,object) {
    object.position.set(-.08,1.56,-.23);object.rotation.set(-1.84,0,-.12,'ZXY');
    for(let i=0;i<2;i++) {
      const sign=i?1:-1,upper=s.arms[i],lower=s.elbows[i];
      const hand=new T.Object3D();hand.position.set(0,-.37,0);lower.add(hand);
      hand.updateWorldMatrix(true,false);object.updateWorldMatrix(true,false);
      target.set(0,i?.29:-.07,0).applyMatrix4(object.matrixWorld);
      pole.set(sign*.54,1.25,-.03).applyMatrix4(s.g.matrixWorld);
      bend({upper,lower,hand},target,pole);lower.remove(hand);
    }
  }
  return {calibrate,pose,reset,fallback};
}
