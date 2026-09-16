/* projects.js v2 — projects ANDAR (panel), landing clean, koi native dialog nahi */
(()=>{
const LS='mes-projects';
const $=s=>document.querySelector(s);
const store=()=>JSON.parse(localStorage.getItem(LS)||'{}');
const put=d=>localStorage.setItem(LS,JSON.stringify(d));
let cur=null;
try{const old=JSON.parse(localStorage.getItem('mes-scene')||'null');
 if(old&&old.length&&!Object.keys(store()).length){const d=store();
  d['pold']={name:'Purana Kaam',created:Date.now(),scene:old};put(d);localStorage.removeItem('mes-scene')}}catch(e){}
const dump=()=>window.SCENE3D.dump();
function topbar(){$('#pname').textContent=cur?('📁 '+cur.name):'📁 —'}
function touch(){if(!cur)return;const d=store();if(!d[cur.id])return;
 d[cur.id].scene=dump();put(d);
 const s=$('#saveDot');if(s){s.style.opacity=1;setTimeout(()=>s.style.opacity=.25,400)}}
function startSession(){const d=store();const id='p'+Date.now();
 const name='Session '+new Date().toLocaleString('en-GB',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'});
 d[id]={name,created:Date.now(),scene:[]};put(d);cur={id,name};topbar();return id}
function cards(){const d=store(),g=$('#pGrid');g.innerHTML='';
 const ids=Object.keys(d).sort((a,b)=>d[b].created-d[a].created);
 if(!ids.length)g.innerHTML='<div style="opacity:.6;font:12px Consolas">Koi project nahi</div>';
 ids.forEach(id=>{const p=d[id],el=document.createElement('div');el.className='card';
  el.innerHTML='<b>'+p.name+'</b><span>'+(p.scene||[]).length+' obj • '+new Date(p.created).toLocaleDateString()+'</span>'+
   '<div class="row"><button data-a="open">📂</button><button data-a="dup">⧉</button><button data-a="exp">📤</button><button data-a="del">🗑</button></div>';
  el.querySelector('[data-a=open]').onclick=()=>{cur={id,name:p.name};window.SCENE3D.load(p.scene||[]);
   closePanel();FX.toast('📂 '+p.name+' khula');topbar()};
  el.querySelector('[data-a=dup]').onclick=()=>{const c=JSON.parse(JSON.stringify(p));
   c.name=p.name+' copy';c.created=Date.now();d['p'+Date.now()]=c;put(d);cards();FX.toast('⧉ duplicate ban gaya')};
  el.querySelector('[data-a=exp]').onclick=()=>{const b=new Blob([JSON.stringify(p.scene||[])],{type:'application/json'});
   const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=p.name+'.json';a.click();FX.toast('📤 export ho gaya')};
  const del=el.querySelector('[data-a=del]');
  del.onclick=()=>{if(del.dataset.arm){delete d[id];put(d);cards();FX.toast('🗑 delete ho gaya')}
   else{del.dataset.arm='1';del.textContent='pakka?';del.style.background='#f33';
    setTimeout(()=>{del.dataset.arm='';del.textContent='🗑';del.style.background=''},2500)}};
  g.appendChild(el)})}
function openPanel(){cards();$('#ppanel').style.display='flex'}
function closePanel(){$('#ppanel').style.display='none'}
window.PROJ={touch,startSession,openPanel,get cur(){return cur},
 copy:()=>{const o=window.SCENE3D.selected();if(!o){FX.toast('pehle object select karo (👉 hold)');return}
  localStorage.setItem('mes-clip',JSON.stringify(o));FX.toast('📋 model copy hua')},
 paste:()=>{const c=JSON.parse(localStorage.getItem('mes-clip')||'null');
  if(!c){FX.toast('clip khali — pehle copy karo');return}
  c.p=(c.p||[0,0,0]).map(v=>v+(Math.random()-.5)*.8);
  window.SCENE3D.load([...dump(),c]);FX.toast('📥 paste ho gaya')},
 export:()=>{const b=new Blob([JSON.stringify(dump())],{type:'application/json'});
  const a=document.createElement('a');a.href=URL.createObjectURL(b);
  a.download=(cur?cur.name:'scene')+'.json';a.click();FX.toast('📤 export ho gaya')},
 import:f=>{const r=new FileReader();r.onload=()=>{try{const arr=JSON.parse(r.result);
   const d=store();const id='p'+Date.now();const nm=(f.name||'import').replace(/\.json$/i,'');
   d[id]={name:nm,created:Date.now(),scene:arr};put(d);
   FX.toast('📥 "'+nm+'" project ban gaya — 📁 se kholo')}
  catch(e){FX.toast('❌ galat json file')}};r.readAsText(f)}};
$('#pbtn').onclick=openPanel;
$('#pClose').onclick=closePanel;
$('#pNew').onclick=()=>{const d=store();const id='p'+Date.now();
 const nm=$('#npName').value.trim()||('Project '+(Object.keys(d).length+1));
 d[id]={name:nm,created:Date.now(),scene:[]};put(d);$('#npName').value='';
 cur={id,name:nm};window.SCENE3D.load([]);closePanel();topbar();FX.toast('➕ '+nm+' ready (fresh)')};
$('#pExp').onclick=()=>PROJ.export();
$('#pImp').onclick=()=>{const i=document.createElement('input');i.type='file';i.accept='.json';
 i.onchange=()=>PROJ.import(i.files[0]);i.click()};
topbar();
})();
