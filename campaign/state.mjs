export const key='omaha.fieldbook.v1';
export const fresh=()=>({chapter:0,node:'start',helped:false});
export function load(){try{const s=JSON.parse(localStorage.getItem(key));return s&&Number.isInteger(s.chapter)&&s.chapter>=0&&s.chapter<=4&&typeof s.node==='string'?s:null}catch{return null}}
export function save(s){try{localStorage.setItem(key,JSON.stringify(s));return true}catch{return false}}
export function advance(s,a){return {...s,...a.set,chapter:s.chapter+Number(a.to==='@next'),node:a.to==='@next'?'start':a.to}}
