// The background wave shares geometry and draw calls, not joints: each man's
// supporting ankle, knee, hip and shoulder are positioned in his local frame.
export function createCrowdRig(THREE, mergeGeometries, scene, capacity) {
  const v = () => new THREE.Vector3(), dummy = new THREE.Object3D(), root = new THREE.Object3D();
  const up = v().set(0,1,0), delta=v(), a=v(), b=v(), c=v(), point=v();
  const ellipsoid = (x,y,z) => new THREE.SphereGeometry(1,10,7).scale(x,y,z);
  const parts = [], meshes = [];
  function part(geo,x,y,z,paint) {
    geo.translate(x,y,z);const color=new THREE.Color(paint), array=new Float32Array(geo.attributes.position.count*3);
    for(let i=0;i<array.length;i+=3)color.toArray(array,i);
    geo.setAttribute('color',new THREE.BufferAttribute(array,3));parts.push(geo);
  }
  // Torso, head, webbing and kit form one rigid instance, with the helmet on the head.
  part(ellipsoid(.17,.17,.13),0,.04,0,0x5d5438);
  part(new THREE.CylinderGeometry(.224,.17,.46,9).scale(1,1,.75),0,.29,0,0x6b6646);
  part(new THREE.CylinderGeometry(.18,.18,.052,9).scale(1,1,.8),0,.12,0,0x7d7a5c);
  part(ellipsoid(.103,.146,.107),0,.615,.01,0xb98a6a);
  part(new THREE.SphereGeometry(.137,10,6,0,Math.PI*2,0,Math.PI*.56).scale(1,.88,1.06),0,.689,.006,0x3a4428);
  part(new THREE.BoxGeometry(.25,.30,.14),0,.31,-.17,0x555233);
  function batch(geo,color,copies=1) {
    const mesh=new THREE.InstancedMesh(geo,new THREE.MeshStandardMaterial(color?{color}:{vertexColors:true}),capacity*copies);
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);mesh.frustumCulled=false;mesh.userData.copies=copies;
    scene.add(mesh);meshes.push(mesh);return mesh;
  }
  const body=batch(mergeGeometries(parts),null),tube=(r,s)=>new THREE.CylinderGeometry(r,s,1,8);
  const thighs=batch(tube(.092,.077),0x5d5438,2),shins=batch(tube(.073,.055),0x8d8562,2);
  const boots=batch(ellipsoid(.070,.077,.134),0x3a2b1d,2),arms=batch(tube(.068,.052),0x6b6646,4);
  function place(mesh,i) {dummy.updateMatrix();dummy.matrix.premultiply(root.matrix);mesh.setMatrixAt(i,dummy.matrix)}
  function joint(mesh,i,start,end){
    delta.subVectors(start,end);const length=delta.length();dummy.position.copy(start).lerp(end,.5);
    dummy.scale.set(1,length+.016,1);dummy.quaternion.setFromUnitVectors(up,delta.multiplyScalar(1/length));place(mesh,i);
  }
  return {meshes,boots,thighs,shins,body, count(n){for(const m of meshes)m.count=n*m.userData.copies},
    pose(i,s,time,floor) {
      const low=s.state==='cover',down=s.down>0,cycle=time*3.5*s.speed+s.seed;
      const hip=down?.83:low?.57:.91-.023*Math.cos(cycle*2),lean=down?0:low?.21:.09;
      const yaw=Math.PI-s.heading,ground=floor(s.x,s.z);
      root.rotation.set(down?Math.PI/2:0,yaw,0,'YXZ');root.position.set(s.x,down?Math.max(ground,-.12)+.22:ground,s.z);root.updateMatrix();
      dummy.position.set(0,hip,0);dummy.scale.setScalar(1);dummy.rotation.set(lean,0,0);place(body,i);
      for(let k=0;k<2;k++){
        const side=k?1:-1,wave=Math.sin(cycle)*side;
        const footZ=down?side*.06:low?side*.11:.24*wave,legX=side*.105;
        point.set(legX,0,footZ).applyMatrix4(root.matrix);
        const sole=down?0:floor(point.x,point.z)-ground+(low?0:.12*Math.max(0,side*Math.cos(cycle)));
        a.set(legX,hip,0);c.set(legX,sole+.085,footZ);
        // Equal-length segments hinge forwards at the knee instead of shortening a standing leg.
        const dy=a.y-c.y,dz=a.z-c.z,span=Math.hypot(dy,dz),bend=Math.sqrt(Math.max(0,.423**2-(span/2)**2));
        b.copy(a).lerp(c,.5);b.y-=dz/span*bend;b.z+=dy/span*bend;
        joint(thighs,i*2+k,a,b);joint(shins,i*2+k,b,c);
        dummy.position.set(legX,sole+.077,footZ+.042);dummy.quaternion.identity();dummy.scale.setScalar(1);place(boots,i*2+k);
        const shoulder=hip+.46,fore=down?.02:low?.15:.06-.11*wave;
        a.set(side*.19,shoulder,.46*Math.sin(lean));b.set(side*.205,shoulder-.25,fore);
        c.set(side*.155,shoulder-.32,fore+.22);joint(arms,i*4+k*2,a,b);joint(arms,i*4+k*2+1,b,c);
      }
    },finish(){for(const m of meshes)m.instanceMatrix.needsUpdate=true}};
}
