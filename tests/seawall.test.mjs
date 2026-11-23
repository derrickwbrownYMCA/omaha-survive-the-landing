import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

// Run the game's movement, engineer update, mesh placement and gate, without a GPU.
// Keep W pressed from the landing in deterministic conditions; enemy fire and FX are stubbed.
const src=readFileSync(new URL('../index.html',import.meta.url),'utf8');
function func(name){const i=src.indexOf('function '+name+'(');assert.ok(i>=0,name);let j=src.indexOf('{',i),depth=1;while(depth&&++j<src.length){if(src[j]==='{')depth++;if(src[j]==='}')depth--}return src.slice(i,j+1)}
const noop=()=>{},clamp=(v,l,h)=>Math.max(l,Math.min(h,v));
function mesh(){return {position:{x:0},scale:{x:1},userData:{},visible:true,clone:mesh}}
function instances(count){return {count,instanceMatrix:{},items:[],setMatrixAt(i,m){this.items[i]=m}}}
function game({supp=0,roster=true,x=0}={}){
 const soldier={x,z:-183,alive:true},player={x,z:99,alive:true,health:100,stamina:100,legInjury:0,suppression:0,step:0};
 const A={stage:0,gapX:0,bang:0,smokeAt:0,posts:instances(251),strands:instances(502),walls:[mesh(),mesh()]};
 const ui={},messages=[],ctx=vm.createContext({A,player,soldiers:roster?[soldier]:[],guns:[{x:-65,z:-229,supp},{x:65,z:-229,supp}],time:0,phase:'beach',keys:{KeyW:true},
   $:id=>ui[id]??=( {style:{},classList:{toggle:noop}}), objective:t=>messages.push(t),showMsg:noop,makeExplosion:noop,spawnPuff:noop,
   clamp,rand:(l,h)=>(l+h)/2,waterDepth:()=>0,nearestWounded:()=>null,coverProtection:()=>0,crowdAgents:[],crowdActive:0,
   wadeFactor:()=>1,moveFactor:1,checkpoint:0,mobileMove:{x:0,y:0},mobileCrouch:false,mobileSprint:false,yaw:0,pitch:0,shake:0,camDrop:0,camRoll:0,goingUnder:0,dunkDepth:0,impactTimer:0,runCoverTime:0,
   camera:{fov:77,position:{set(x,y,z){Object.assign(this,{x,y,z})}},rotation:{set:noop}},heightAt:()=>0,
   W:{clip:8,reserve:72,name:'test'},rifle:{rounds:8,reserve:72,grenades:2},aiming:false,aerial:false,aimK:0,aimSens:1,ammoShown:'',firing:false,
   scene:{add:noop},THREE:{Object3D:class{position={set:(x,y,z)=>this.p={x,y,z}};scale={setScalar:k=>this.k=k};updateMatrix(){this.matrix={...this.p,k:this.k}}}}
 });
 const constants=src.match(/^const SEAWALL=.*;$/m)[0];
 const functions=['breachLane','layWire','setGap','resetAssault','blowWire','assaultGate','updateAssault','move'];
 vm.runInContext(constants+'\n'+functions.map(func).join('\n'),ctx);
 const dt=1/30;return {ctx,A,player,soldier,messages,dt,tick(){ctx.time+=dt;ctx.move(dt);ctx.updateAssault(dt)}}}
function run(options){const g=game(options);let arrived,opened,passed;for(let i=0;i<30*150;i++){g.tick();if(!arrived&&g.A.stage===1)arrived=g.ctx.time;if(!opened&&g.A.stage===2)opened=g.ctx.time;if(g.player.z<-191.5){passed=g.ctx.time;break}}return {...g,arrived,opened,passed}}
for(const [label,options,max] of [['unassisted',{x:6},15],['covered',{supp:1},9],['relief',{roster:false},15]]){
 test(`${label}: holding forward crosses the opening without staging or teleporting`,()=>{
  const g=run(options),wait=g.opened-g.arrived;
  console.log(`${label}: contact ${g.arrived?.toFixed(2)}s, opened ${g.opened?.toFixed(2)}s, cleared ${g.passed?.toFixed(2)}s`);
  assert.ok(wait>2&&wait<=max,`contact to opening: ${wait}s`);
  assert.ok(g.passed-g.opened<2);assert.ok(g.messages.some(t=>t.includes('%')),'visible charge progress');
 });
}
test('the opening, wire, camera and the two-sided player gate agree',()=>{
 const g=game({x:128});for(let i=0;i<30*70;i++)g.tick();assert.equal(g.A.stage,1);assert.equal(g.A.walls[0].scale.x,1);assert.equal(g.ctx.camera.position.z,g.player.z,'camera must stop at the gate with the player');
 g.ctx.blowWire();const center=g.A.gapX,w=g.A.walls[0],left=w.position.x+w.scale.x*500,right=w.userData.twin.position.x-w.userData.twin.scale.x*500;
 const atGate=g.player.z;g.tick();assert.ok(g.player.z<atGate,'first movement tick after the opening must advance');
 assert.ok(left<center&&center<right);for(const s of g.A.strands.items)if(s.k)assert.ok(s.x+2<=left||s.x-2>=right,'wire must not cross the rendered gap');
 for(const x of [center,left+.5,right-.5,left-.1,right+.1]){const outside=x<left||x>right;
   for(const [z,key] of [[-184,'KeyW'],[-193,'KeyS']]){Object.assign(g.player,{x,z});g.ctx.keys={ [key]:true };for(let i=0;i<120;i++)g.tick();
     assert.equal(z===-184?g.player.z<-191.5:g.player.z>-185,!outside,`cross at x=${x} from z=${z}`)}}
 Object.assign(g.player,{x:center,z:-187});g.ctx.keys={KeyD:true};for(let i=0;i<120;i++)g.tick();assert.ok(g.player.x<right&&g.player.x>right-.5);assert.equal(g.player.z,-187,'sliding against a jamb must not eject the player');
 g.ctx.resetAssault();assert.ok(!w.userData.twin.visible&&w.scale.x===1);assert.ok(g.A.strands.items.every(s=>s.k===1));
});
test('the breach cue cannot knock the waiting player down; normal explosions still can',()=>{
 const {ctx,A,player}=game({roster:false});A.target=ctx.guns[1];A.gapX=player.x;player.z=-185.75;
 let damage=0;Object.assign(ctx,{damage:n=>damage+=n,soundExplosion:noop,startRing:noop,scareAround:noop,RZ:{onBlast:noop},WATER_Y:0,concuss:0,deaf:0,explosions:[],sphere:()=>({}),runFallen:0});
 ctx.THREE.MeshBasicMaterial=class{};vm.runInContext([func('onExplosion'),func('makeExplosion')].join('\n'),ctx);
 ctx.blowWire();assert.ok(A.walls[0].userData.twin.visible);assert.ok(ctx.explosions.length>0);assert.equal(damage,0);assert.ok(!player.down);
 ctx.makeExplosion(player.x,player.z);assert.ok(damage>0);assert.ok(player.down>0);
});
