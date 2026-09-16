/* app2.js v5 — chat UI + cloud bridge (unknown pe) + projects */
(()=>{
const box=document.getElementById('cmd'),chat=document.getElementById('chat'),logEl=document.getElementById('chatLog');
function log(t,cls){const d=document.createElement('div');d.className='msg '+(cls||'a');
 d.textContent=t;logEl.appendChild(d);logEl.scrollTop=logEl.scrollHeight;
 while(logEl.children.length>60)logEl.removeChild(logEl.firstChild);return d}
function toast(t){FX.toast(t)}
window.MES.ui={log,toast};
chat.addEventListener('click',e=>{e.stopPropagation();chat.classList.add('open');box.focus()});
document.addEventListener('click',e=>{if(!chat.contains(e.target))chat.classList.remove('open')});
function execCmds(cs){(cs||[]).slice(0,8).forEach(c=>window.SCENE3D.exec(c))}
async function agentCall(text){log(text,'u');const pend=log('🧠 soch raha hai...','a');
 const ctl=new AbortController();const to=setTimeout(()=>ctl.abort(),20000);
 try{const r=await fetch('/api/agent',{method:'POST',signal:ctl.signal,
  headers:{'Content-Type':'application/json'},body:JSON.stringify({text})});
  clearTimeout(to);const out=await r.json();
  if(out.error)throw new Error(out.error);
  const reply=out.reply||'Ho gaya';pend.textContent='🧠 '+reply;MES.say(reply);
  const n=(out.cmds||[]).length;if(n){execCmds(out.cmds);log('🛠 '+n+' command chale','s')}
 }catch(e){clearTimeout(to);pend.textContent='🧠 agent offline: '+(e.message||'')+' — local chala';
  const r=MES.route(text);if(r.ok)log('⚡ '+r.msg,'a')}
}
box.addEventListener('keydown',e=>{if(e.key!=='Enter'||!box.value.trim())return;
 const t=box.value;box.value='';
 const r=MES.handle(t,'chat');
 if(r)agentCall(t)});
document.querySelectorAll('#chips button').forEach(b=>b.onclick=()=>{MES.handle(b.dataset.c,'chip')});
})();
(()=>{
const LS='mes-projects';const $=s=>document.querySelector(s);
const store=()=>JSON.parse(localStorage.getItem(LS)||'{}');
const put=d=>localStorage.setItem(LS,JSON.stringify(d));
let cur=null;
try{const old=JSON.parse(localStorage.getItem('mes-scene')||'null');
 if(old&&old.length&&!Object.keys(store()).length){const d=store();
  d['pold']={name:'Purana Kaam',created:Date.now(),scene:old};put(d);localStorage.removeItem('mes-scene')}}catch(e){}
const dump=()=>window.SCENE3D.dump();
function topbar(){$('#pname').textContent=cur?('📁 '+cur.name):'📁 —'}
function touch(){if(!cur)return;const d=store();if(!d[cur.id])return;
 d[cur.id].scene=dump().map((o,i)=>Object.assign(o,{nm:window.SCENE3D.entities()[i]?window.SCENE3D.entities()[i].name:o.nm}));put(d);
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
const openPanel=()=>{cards();$('#ppanel').style.display='flex'};
const closePanel=()=>{$('#ppanel').style.display='none'};
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
   d[id]={name:nm,created:Date.now(),scene:arr};put(d);FX.toast('📥 "'+nm+'" ban gaya — 📁 se kholo')}
  catch(e){FX.toast('❌ galat json')}};r.readAsText(f)}};
$('#pbtn').onclick=openPanel;$('#pClose').onclick=closePanel;
$('#pNew').onclick=()=>{const d=store();const id='p'+Date.now();
 const nm=$('#npName').value.trim()||('Project '+(Object.keys(d).length+1));
 d[id]={name:nm,created:Date.now(),scene:[]};put(d);$('#npName').value='';
 cur={id,name:nm};window.SCENE3D.load([]);closePanel();topbar();FX.toast('➕ '+nm+' ready (fresh)')};
$('#pExp').onclick=()=>PROJ.export();
$('#pImp').onclick=()=>{const i=document.createElement('input');i.type='file';i.accept='.json';
 i.onchange=()=>PROJ.import(i.files[0]);i.click()};
$('#bLabel').onclick=()=>{MES.labelMode(!MES.S.labelOn);FX.toast(MES.S.labelOn?'🏷️ labels ON':'🏷️ labels OFF')};
$('#bGltf').onclick=()=>{const i=document.createElement('input');i.type='file';i.accept='.glb,.gltf';
 i.onchange=()=>{FX.toast('📦 load ho raha hai...');
  window.SCENE3D.importGLTF(i.files[0],nm=>{if(nm)FX.toast('📦 '+nm+' import hua — parts labels me dekho');
   else FX.toast('❌ gltf load fail')})};i.click()};
topbar();
window.APP2_OK=true;
})();
