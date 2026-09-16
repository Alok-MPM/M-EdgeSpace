/* projects.js — fresh start + projects + copy/paste + export/import */
(()=>{
const LS='mes-projects',CUR='mes-current-id';
const $=s=>document.querySelector(s);
const store=()=>JSON.parse(localStorage.getItem(LS)||'{}');
const put=d=>localStorage.setItem(LS,JSON.stringify(d));
let cur=null;
try{const old=JSON.parse(localStorage.getItem('mes-scene')||'null');
 if(old&&old.length&&!Object.keys(store()).length){const d=store();
  d['pold']={name:'Purana Kaam',created:Date.now(),scene:old};put(d);localStorage.removeItem('mes-scene')}}catch(e){}
function cards(){const d=store(),home=$('#homeGrid');home.innerHTML='';
 const ids=Object.keys(d).sort((a,b)=>d[b].created-d[a].created);
 if(!ids.length)home.innerHTML='<div style="opacity:.6;font:13px Consolas;margin:6px">Koi project nahi — ➕ Naya Project banao 🌸</div>';
 ids.forEach(id=>{const p=d[id],el=document.createElement('div');el.className='card';
  el.innerHTML='<b>'+p.name+'</b><span>'+(p.scene||[]).length+' objects • '+new Date(p.created).toLocaleDateString()+'</span>'+
   '<div class="row"><button data-a="open">📂 Open</button><button data-a="dup">⧉</button><button data-a="del">🗑</button></div>';
  el.querySelector('[data-a=open]').onclick=()=>open(id);
  el.querySelector('[data-a=dup]').onclick=()=>{const c=JSON.parse(JSON.stringify(p));
   c.name=p.name+' copy';c.created=Date.now();d['p'+Date.now()]=c;put(d);cards();FX.toast('⧉ duplicate ban gaya')};
  el.querySelector('[data-a=del]').onclick=()=>{if(confirm('"'+p.name+'" delete karein?')){delete d[id];put(d);cards()}};
  home.appendChild(el)})}
function newProject(name){const d=store(),id='p'+Date.now();
 d[id]={name:name||('Project '+(Object.keys(d).length+1)),created:Date.now(),scene:[]};put(d);return id}
function open(id){const d=store();cur={id,name:d[id].name};localStorage.setItem(CUR,id);
 window.SCENE3D.load(d[id].scene||[]);$('#home').style.display='none';
 FX.toast('📂 '+cur.name+' khula');topbar()}
function touch(){if(!cur)return;const d=store();if(!d[cur.id])return;
 d[cur.id].scene=window.SCENE3D.dump();put(d);
 const s=$('#saveDot');if(s){s.style.opacity=1;setTimeout(()=>s.style.opacity=.25,400)}}
function topbar(){$('#pname').textContent=cur?('📁 '+cur.name):'📁 (koi project nahi)'}
window.PROJ={touch,get cur(){return cur},
 copy:()=>{const o=window.SCENE3D.selected();if(!o){FX.toast('pele object select karo (👉 hold)');return}
  localStorage.setItem('mes-clip',JSON.stringify(o));FX.toast('📋 model copy hua')},
 paste:()=>{const c=JSON.parse(localStorage.getItem('mes-clip')||'null');
  if(!c){FX.toast('clip khali hai — pehle copy karo');return}
  c.p=(c.p||[0,0,0]).map(v=>v+(Math.random()-.5)*.8);
  window.SCENE3D.load([...window.SCENE3D.dump(),c]);FX.toast('📥 paste ho gaya')},
 export:()=>{const b=new Blob([JSON.stringify(window.SCENE3D.dump())],{type:'application/json'});
  const a=document.createElement('a');a.href=URL.createObjectURL(b);
  a.download=(cur?cur.name:'scene')+'.json';a.click();FX.toast('📤 export ho gaya')},
 import:f=>{const r=new FileReader();r.onload=()=>{try{const arr=JSON.parse(r.result);
  window.SCENE3D.load([...window.SCENE3D.dump(),...arr]);FX.toast('📥 import ('+arr.length+') ho gaya')}
  catch(e){FX.toast('❌ galat json file')}};r.readAsText(f)}};
$('#pbtn').onclick=()=>{cards();$('#home').style.display='flex'};
$('#newBtn').onclick=()=>{open(newProject(prompt('Project naam?')||undefined))};
$('#impBtn').onclick=()=>{const i=document.createElement('input');i.type='file';i.accept='.json';
 i.onchange=()=>PROJ.import(i.files[0]);i.click()};
$('#camBtn').onclick=()=>{if(!cur){const id=newProject('Scratch');cur={id,name:'Scratch'};localStorage.setItem(CUR,id)}
 topbar();$('#home').style.display='none';$('#btn').click()};
cards();topbar();
})();
