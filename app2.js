/* app2.js v4.1 — chat + agent + bottle local fix */
(()=>{
const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
const box=document.getElementById('cmd'),vbtn=document.getElementById('vbtn');
const chat=document.getElementById('chat'),logEl=document.getElementById('chatLog');
let rec=null,on=false,retry=0,errs=0,li=0;const LANGS=['hi-IN','en-IN','en-US'];
let actx=null,analyser=null,micStream=null,mRaf=0;
const say=t=>{try{const u=new SpeechSynthesisUtterance(t);u.lang='hi-IN';u.rate=1.05;speechSynthesis.speak(u)}catch(e){}};
const IDEAS=()=>JSON.parse(localStorage.getItem('mes-ideas')||'[]');
function log(t,cls){const d=document.createElement('div');d.className='msg '+(cls||'a');
 d.textContent=t;logEl.appendChild(d);logEl.scrollTop=logEl.scrollHeight;
 while(logEl.children.length>60)logEl.removeChild(logEl.firstChild);return d}
chat.addEventListener('click',e=>{e.stopPropagation();chat.classList.add('open');box.focus()});
document.addEventListener('click',e=>{if(!chat.contains(e.target))chat.classList.remove('open')});
async function meterOn(){try{micStream=await navigator.mediaDevices.getUserMedia({audio:true});
 actx=new(window.AudioContext||window.webkitAudioContext)();
 const src=actx.createMediaStreamSource(micStream);analyser=actx.createAnalyser();analyser.fftSize=256;src.connect(analyser);
 const buf=new Uint8Array(analyser.frequencyBinCount);
 const tickM=()=>{mRaf=requestAnimationFrame(tickM);analyser.getByteFrequencyData(buf);
  let s=0;for(let i=0;i<buf.length;i++)s+=buf[i];
  const m=document.getElementById('meter');if(m)m.style.width=Math.min(100,s/buf.length*4)+'%'};tickM()}catch(e){}}
function meterOff(){cancelAnimationFrame(mRaf);if(micStream)micStream.getTracks().forEach(t=>t.stop());
 micStream=null;const m=document.getElementById('meter');if(m)m.style.width='0%'}
function parse(s){s=s.toLowerCase();
 const dg=(s.match(/(\d+)\s*(degree|digri)/)||[])[1],D=dg?+dg:45;
 const ADD=/(lao|add|naya|banao|banado)/;
 if(/(copy karo)/.test(s))return{op:'copy'};
 if(/(paste karo)/.test(s))return{op:'paste'};
 if(/(export karo|download karo)/.test(s))return{op:'export'};
 if(/(bottle|botal)/.test(s)&&ADD.test(s))return{op:'bottle'};
 if(/(sphere|gola|ball)/.test(s)&&/(banao|banado)/.test(s))return{op:'morph',type:'sphere'};
 if(/(rectangle|rect)/.test(s)&&/(banao|banado)/.test(s))return{op:'morph',type:'rect'};
 if(/(sheet|chaadar)/.test(s)&&/(banao|banado)/.test(s))return{op:'morph',type:'sheet'};
 if(/(tall|khada)/.test(s)&&/(banao|banado)/.test(s))return{op:'morph',type:'tall'};
 if(/(cube|box|dabba)/.test(s)&&/(banao|banado|wapas)/.test(s))return{op:'morph',type:'cube'};
 if(/(cube|box|dabba)/.test(s)&&ADD.test(s))return{op:'add',type:'cube'};
 if(/(sphere|gola|ball)/.test(s)&&ADD.test(s))return{op:'add',type:'sphere'};
 if(/(cylinder|belan|pipe)/.test(s)&&ADD.test(s))return{op:'add',type:'cyl'};
 if(/(torus|ring|challa)/.test(s)&&ADD.test(s))return{op:'add',type:'torus'};
 if(/(flip|palat)/.test(s))return{op:'rot',axis:'x',deg:180};
 if(/(ghumao|rotate|turn)/.test(s))return{op:'rot',deg:/left|baye|neeche/.test(s)?-D:D,
  axis:/upar|neeche/.test(s)?'x':/tilt/.test(s)?'z':'y'};
 if(/(lamba karo|side badhao)/.test(s))return{op:'stretch',axis:'x',f:1.3};
 if(/(patla karo)/.test(s))return{op:'stretch',axis:'y',f:.6};
 if(/(mota karo)/.test(s))return{op:'stretch',axis:'y',f:1.4};
 if(/(bada|scale up)/.test(s))return{op:'scale',f:1.25};
 if(/(chhota|small)/.test(s))return{op:'scale',f:.8};
 if(/(sab saaf|sab hatao)/.test(s))return{op:'clear'};
 if(/(hatao|delete|mita)/.test(s))return{op:'del'};
 if(/(duplicate karo)/.test(s))return{op:'dup'};
 if(/(laal|red)/.test(s))return{op:'color',color:'#ff3355'};
 if(/(neela|blue)/.test(s))return{op:'color',color:'#33aaff'};
 if(/(hara|green)/.test(s))return{op:'color',color:'#33ff88'};
 if(/(pila|yellow)/.test(s))return{op:'color',color:'#ffee33'};
 if(/(select|chuno)/.test(s))return{op:'sel'};
 if(/idea (note|likho|store)/.test(s)){const a=IDEAS();a.push(s.replace(/.*idea (note|likho|store)[: ]*/,''));
  localStorage.setItem('mes-ideas',JSON.stringify(a));return{op:'idea'}}
 if(/(kitne idea)/.test(s))return{op:'ideas'};
 if(/(madad|help)/.test(s))return{op:'help'};return null}
function execCmds(cs){(cs||[]).slice(0,8).forEach(c=>window.SCENE3D.exec(c))}
function runLocal(txt){const c=parse(txt);
 if(!c){log('🤖 samjha nahi — "help" likho','a');FX.toast('🤖 samjha nahi');return}
 if(c.op==='bottle'){window.SCENE3D.exec({op:'add',type:'cyl'});
  window.SCENE3D.exec({op:'stretch',axis:'y',f:1.8});window.SCENE3D.exec({op:'scale',f:.7});
  say('Bottle taiyaar');log('🤖 Bottle taiyaar (local)','a');FX.toast('🤖 Bottle taiyaar');return}
 if(c.op==='copy'){window.PROJ.copy();log('🤖 model copy hua','a');return}
 if(c.op==='paste'){window.PROJ.paste();log('🤖 paste ho gaya','a');return}
 if(c.op==='export'){window.PROJ.export();log('🤖 export ho gaya','a');return}
 if(c.op==='help'){log('🤖 "cube lao" "water bottle banao" "sphere banao" "ghumao 45" "side badhao" "laal karo" "copy/paste karo" "idea note karo ..."','a');return}
 if(c.op==='idea'){log('📜 idea saved ('+IDEAS().length+')','a');say('Idea note kar liya');return}
 if(c.op==='ideas'){log('📜 '+IDEAS().length+' ideas stored','a');return}
 window.SCENE3D.exec(c);
 const msg={add:'Naya model ready',morph:'Morph: '+(c.type||''),rot:'Ghumaa diya',scale:'Size set',
  stretch:'Stretch ho gaya',del:'Hata diya',clear:'Sab 3D saaf',dup:'Copy bana di',color:'Rang badla',
  sel:'Select kiya'}[c.op]||'Ho gaya';
 say(msg);log('🤖 '+msg,'a');FX.toast('🤖 '+msg)}
async function agentCall(text){chat.classList.add('open');log(text,'u');
 const pend=log('🤖 soch raha hai...','a');
 const ctl=new AbortController();const to=setTimeout(()=>ctl.abort(),20000);
 try{const r=await fetch('/api/agent',{method:'POST',signal:ctl.signal,
  headers:{'Content-Type':'application/json'},body:JSON.stringify({text})});
  clearTimeout(to);const out=await r.json();
  if(out.error)throw new Error(out.error);
  const reply=out.reply||'Ho gaya';
  pend.textContent='🤖 '+reply;say(reply);
  const n=(out.cmds||[]).length;
  if(n){execCmds(out.cmds);log('🛠 '+n+' command chale','s')}
 }catch(e){clearTimeout(to);
  pend.textContent='🤖 '+(e.message||'agent offline')+' — local chala';
  runLocal(text)}}
if(SR){rec=new SR();rec.lang=LANGS[0];rec.continuous=true;rec.interimResults=false;
 rec.onresult=e=>{retry=0;errs=0;const t=e.results[e.results.length-1][0].transcript;
  FX.toast('🎙 '+t);agentCall(t)};
 rec.onerror=e=>{if(e.error==='no-speech')return;
  if(e.error==='network'&&retry<2){retry++;setTimeout(()=>{if(on)try{rec.start()}catch(x){}},1200);return}
  errs++;if(errs>4&&li<LANGS.length-1){li++;rec.lang=LANGS[li];errs=0;FX.toast('🌐 '+rec.lang);return}
  FX.toast('🎙 '+e.error+' — voice service mara: Chrome kholo ya chat box me likho')};
 rec.onend=()=>{if(on)try{rec.start()}catch(e){}}}
vbtn.onclick=()=>{if(!rec){FX.toast('❌ browser voice nahi — chat box use karo');return}
 on=!on;vbtn.style.background=on?'#0f6a':'#0009';
 if(on){try{rec.start()}catch(e){}meterOn();FX.toast('🎙 ON — bolo, Llama samjhega');say('Haan bhai, bolo')}
 else{rec.stop();meterOff();FX.toast('🔇 OFF')}};
document.querySelectorAll('#chips button').forEach(b=>b.onclick=()=>{log('⚡ '+b.dataset.c,'u');runLocal(b.dataset.c)});
box.addEventListener('keydown',e=>{if(e.key==='Enter'&&box.value.trim()){const t=box.value;box.value='';agentCall(t)}});
window.VAI={run:runLocal,agent:agentCall,say,log};
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
topbar();
window.APP2_OK=true;
})();
