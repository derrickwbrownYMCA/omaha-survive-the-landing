import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { createCrowdRig } from '../crowd-rig.mjs';

// Exercise the game's actual terrain mesh and instance transforms without a WebGL context.
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const section=(start,end)=>html.slice(html.indexOf(start),html.indexOf(end,html.indexOf(start)));
test('the authored GI keeps a planted boot during crouch and kneeling clips',async()=>{
  const data=readFileSync(new URL('../assets/models/gi.glb',import.meta.url));
  const asset=await new GLTFLoader().parseAsync(data.buffer.slice(data.byteOffset,data.byteOffset+data.byteLength),'');
  const build=new Function('THREE','mergeGeometries','grip',section('const GI=','let soldierProto')+';return buildGI')(THREE,mergeGeometries,{calibrate(){}});
  const {root,clips}=build(asset), m=root.getObjectByName('GI'), si=m.geometry.attributes.skinIndex, boots=[];
  for(let i=0;i<si.count;i++)if(/DEF-(foot|toe)/.test(m.skeleton.bones[si.getX(i)].name))boots.push(i);
  assert.ok(boots.length);const mixer=new THREE.AnimationMixer(root),v=new THREE.Vector3();
  for(const name of ['CrouchIdle','Crouch','Kneel']){
    mixer.stopAllAction();mixer.clipAction(clips[name]).reset().play();
    for(let f=0;f<8;f++){
      mixer.update(clips[name].duration/8);root.updateMatrixWorld(true);
      const sole=Math.min(...boots.map(i=>m.localToWorld(m.getVertexPosition(i,v)).y));
      assert.ok(Math.abs(sole)<.035,`${name} frame ${f}: sole ${sole.toFixed(3)} m from floor`);
    }
  }
});
test('ordinary and featured passengers share the deck on a rolling boat',()=>{
  const loop=section('for(const s of soldiers){if(!s.boat)continue;if(soldierProto', ' cineCoxswain();');
  const scene=new THREE.Scene(),run=new Function('THREE','scene',`
    let boat,ramp;
    ${section('const mat=', 'function box(')}const webbingMat=wood;
    ${section('function box(', 'function sphere(')}
    ${section('// Other LCVPs', '// V3.2:')}
    buildBoat();boat.rotation.set(.06,0,.04);boat.updateMatrixWorld();
    const soldiers=[false,true].map(ensembleRole=>({g:new THREE.Group(),boat:true,x:.5,z:110,ensembleRole})),soldierProto=null,cine={},_cv=new THREE.Vector3();
    ${loop}return {boat,soldiers};`);
  const {boat,soldiers}=run(THREE,scene), deck=boat.children.find(o=>o.geometry?.parameters?.depth===14.2 && o.geometry.parameters.width===7.2);
  assert.ok(deck,'wooden deck surface');
  deck.geometry.computeBoundingBox();const y=deck.position.y+deck.geometry.boundingBox.max.y;
  for(const s of soldiers){const gap=boat.worldToLocal(s.g.position.clone()).y-y;assert.ok(Math.abs(gap)<.001,`passenger ${gap.toFixed(3)} m from deck`)}
});
function fixture(){
  const setup=`const clamp=THREE.MathUtils.clamp, rand=(a,b)=>(a+b)/2, scene=new THREE.Scene(),qualityMode='low',groundTexture=()=>null;
    const olive=new THREE.MeshBasicMaterial(),skinMat=olive,helmetMat=olive,uniformAlt=olive,bootMat=olive,sockMat=olive;
    let terrain,crowd,crowdActive=1,crowdAgents=[],time=0;
    ${section('function beachRelief','function init()')}
    ${section('function smoothstepSand',' // Surf starts')} }
    ${section('function createCrowd()', 'function setQuality(')}
    ${section('function drawCrowd()', "$('quality').addEventListener")}
    const RZ={drive:()=>false,speed:()=>1}, soldiers=[];${section('function updateSoldiers(dt)', 'function projectile(dt)')}
    buildTerrain();createCrowd();return {terrain,crowd,a:crowdAgents[0],draw:drawCrowd,soldiers,step:updateSoldiers};`;
  return new Function('THREE','createCrowdRig','mergeGeometries',setup)(THREE,createCrowdRig,mergeGeometries);
}
test('wall cover bends connected knees without squashing the torso',()=>{
  const rig=createCrowdRig(THREE,mergeGeometries,new THREE.Scene(),1),s={x:0,z:0,heading:0,speed:1,seed:0,state:'cover'};
  rig.pose(0,s,0,()=>0);const m=new THREE.Matrix4(),v=new THREE.Vector3();
  const endpoint=(mesh,i,y)=>{mesh.getMatrixAt(i,m);return new THREE.Vector3(0,y,0).applyMatrix4(m)};
  for(let i=0;i<2;i++){
    const hip=endpoint(rig.thighs,i,.5),knee=endpoint(rig.thighs,i,-.5),ankle=endpoint(rig.shins,i,-.5);
    assert.ok(knee.distanceTo(endpoint(rig.shins,i,.5))<.02,'leg segments meet at the knee');
    assert.ok(knee.clone().lerp(hip,-1).distanceTo(ankle)>.4,'the knee is bent, not a straight peg');
  }
  rig.body.getMatrixAt(0,m);assert.ok(v.setFromMatrixScale(m).distanceTo(new THREE.Vector3(1,1,1))<1e-6);
});
function floor(terrain,x,z){terrain.updateMatrixWorld();return new THREE.Raycaster(new THREE.Vector3(x,20,z),new THREE.Vector3(0,-1,0)).intersectObject(terrain)[0].point.y}
function bottom(mesh,index){const p=mesh.geometry.attributes.position,m=new THREE.Matrix4(),v=new THREE.Vector3();mesh.getMatrixAt(index,m);let low=Infinity;for(let i=0;i<p.count;i++)low=Math.min(low,v.fromBufferAttribute(p,i).applyMatrix4(m).y);return low}
test('detailed soldier stands on the mesh triangle beneath his own position',()=>{
  const {terrain,soldiers,step}=fixture();const pair=()=>[new THREE.Object3D(),new THREE.Object3D()];
  const s={alive:true,g:new THREE.Group(),x:106,z:-183,legs:pair(),knees:pair(),aiState:'hold',aiUntil:10,heading:0,life:1,speed:1};soldiers.push(s);step(0);
  const gap=s.g.position.y-floor(terrain,s.x,s.z);assert.ok(Math.abs(gap)<.001,`wall root ${gap.toFixed(3)} m above the terrain`);
});
for(const [name,state,x,z] of [['open beach','running',159,-123],['seawall','cover',91,-182]])test(`${name}: planted sole meets the rendered sand`,()=>{
  const {terrain,crowd,a,draw}=fixture();Object.assign(a,{x,z,seed:0,heading:0,state});draw();
  const sand=floor(terrain,x,z);
  const sole=Math.min(bottom(crowd.boots,0),bottom(crowd.boots,1)),gap=sole-sand;
  assert.ok(Math.abs(gap)<.04,`${state}: lowest leg/boot ${gap.toFixed(3)} m above the terrain`);
});
