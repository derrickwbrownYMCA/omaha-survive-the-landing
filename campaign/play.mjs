import rally from './rally.mjs';
import village from './ch1.mjs';
import road from './ch2.mjs';
import roll from './ch3.mjs';
import {fresh,load,save,advance} from './state.mjs';
const chapters=[rally,village,road,roll];
const names=['Prologue · Above the wall','01 · The Missing Three','02 · The Long Road','03 · Roll Call','Epilogue · The morning roll'];
// Coordinates are percentages of the uncropped field sketch. The labeled action list
// remains a full alternative for anyone who cannot see or select a map marker.
const landmarks={
 '0:start':[[42,77,'Blanket roll'],[66,39,'Pennant']],
 '1:start':[[22,58,'Farm'],[73,50,'Church'],[44,78,'Pump']],
 '1:pump':[[22,58,'Farm'],[73,50,'Church']],
 '2:start':[[21,59,'Long road'],[77,69,'Bank path']],
 '3:start':[[10,71,'Orchard'],[52,68,'Schoolhouse']]
};
const el=id=>document.getElementById(id);
let s=location.hash==='#rally'?fresh():load()||fresh();
if(location.hash==='#rally')history.replaceState(null,'',location.pathname+location.search);
function render(focus=false){
 const finished=s.chapter===4;
 const page=finished?{place:'All present.',body:`Ellis. Bell. Lane. Three names in chalk, three voices in the room. ${s.companion} folds the roll and slips it into your hand. This time, nobody has to guess who made it.`,objective:'The morning roll is complete.',art:roll({...s,node:'complete'}).art,actions:[]}:chapters[s.chapter](s);
 el('chapter').textContent=names[s.chapter];el('place').textContent=page.place;el('body').textContent=page.body;el('objective').textContent=page.objective;
 el('plateNo').textContent=`FIELD SKETCH / ${String(s.chapter+1).padStart(2,'0')}`;
 el('art').innerHTML=page.art;el('actions').replaceChildren();
 function button(label,act){const b=document.createElement('button');b.type='button';b.textContent=label;b.onclick=act;el('actions').append(b)}
 el('pins').replaceChildren();
 for(const [i,a] of page.actions.entries()){
  const act=()=>{s=advance(s,a);render(true)};button(a.label,act);
  const mark=landmarks[`${s.chapter}:${s.node}`]?.[i];if(!mark)continue;
  const pin=document.createElement('button');pin.type='button';pin.className='pin';pin.textContent=mark[2];pin.setAttribute('aria-label',`Map: ${a.label}`);pin.style.left=mark[0]+'%';pin.style.top=mark[1]+'%';pin.onclick=act;el('pins').append(pin);
 }
 if(finished){button('Return to the landing menu',()=>location.assign('../index.html'));button('Walk the inland chapters again',()=>{s=fresh();render(true)})}
 el('status').textContent=save(s)?'Checkpoint saved on this device.':'Checkpoint unavailable. Keep this tab open to continue.';
 document.title=`${page.place} · Omaha`;if(focus){el('place').focus({preventScroll:true});window.scrollTo(0,0)}
}
render();
