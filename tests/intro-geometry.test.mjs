// Measure the actual craft used in the cinematic (the wide cut clones the player's hull).
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import * as THREE from 'three';
const src=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const section=(a,b)=>src.slice(src.indexOf(a),src.indexOf(b,src.indexOf(a)+1));
const ctx=vm.createContext({THREE,scene:new THREE.Scene(),boat:null,ramp:null});
vm.runInContext(section('const mat=','function box(')+section('function box(','function sphere(')+section('// Other LCVPs','// V3.2:')+';const webbingMat=wood;buildBoat();',ctx);
const hull=ctx.boat;hull.position.set(0,0,0);hull.updateMatrixWorld(true);
const surfaces=[];hull.traverseVisible(o=>{if(o.isMesh)surfaces.push(o)});
const beam=(y,z)=>new THREE.Raycaster(new THREE.Vector3(10,y,z),new THREE.Vector3(-1,0,0)).intersectObjects(surfaces,false)[0]?.point.x;
test('LCVP shell flares above the water and tapers around the stern in the wide cut',()=>{
 const mid=beam(1.9,0),chine=beam(.1,0),aft=beam(1.9,7.2);
 assert.ok([mid,chine,aft].every(Number.isFinite),'continuous visible hull');
 assert.ok(mid-chine>.45,`upper beam ${mid}, waterline ${chine}`);
 assert.ok(mid-aft>.45,`upper beam ${mid}, aft ${aft}`);
});
test('bluff has a varying skyline, not a single level upper edge',()=>{
 const bluff=vm.runInContext(section('function coastalBluff()','function updateWater(')+';coastalBluff()',ctx);
 const top=new Map(),pos=bluff.geometry.getAttribute('position');
 for(let i=0;i<pos.count;i++){const x=pos.getX(i);if(Math.abs(x)<200)top.set(x,Math.max(top.get(x)??-Infinity,pos.getY(i)))}
 assert.ok(top.size>=12&&Math.max(...top.values())-Math.min(...top.values())>8);
});
test('deck strips stay inside the hold',()=>{
 const strips=surfaces.filter(o=>o.geometry.type==='BoxGeometry'&&o.position.y===1.59);
 assert.equal(strips.length,7);
 for(const strip of strips){const b=new THREE.Box3().setFromObject(strip);assert.ok(b.min.x>=-3.6&&b.max.x<=3.6&&b.min.z>=-7.1&&b.max.z<=7.1)}
});
