/* mes.js v1.2 — visible errors + silent-fail catch */
(()=>{
const COLORS={laal:'#ff3355',red:'#ff3355',neela:'#33aaff',blue:'#33aaff',hara:'#33ff88',green:'#33ff88',
 pila:'#ffee33',yellow:'#ffee33',narangi:'#ff8833',baingani:'#aa44ff',safed:'#ffffff',kala:'#222222'};
const TYPES={cube:'cube',box:'cube',dabba:'cube',sphere:'sphere',gola:'sphere',ball:'sphere',
 cyl:'cyl',cylinder:'cyl',pipe:'cyl',belan:'cyl',torus:'torus',ring:'torus',challa:'torus',bottle:'bottle',botal:'bottle'};
const AX={upar:['y',1],top:['y',1],neeche:['y',-1],down:['y',-1],left:['x',-1],baye:['x',-1],
 right:['x',1],daye:['x',1],aage:['z',1],front:['z',1],piche:['z',-1],back:['z',-1]};
const S={labelOn:false,quota:{ai:0,day:new Date().toDateString()}};
const labels={};
const api3=()=>window.SCENE3D;
function entities(){return api3()?api3().entities():[]}
function findTarget(t){const es=entities();let best=null;
 for(const e of es){for(const p of e.parts){if(t.includes(p.name)&&(!best||p.name.length>best.n.length))
  best={n:p.name,kind:'part',root:e.name}}
  if(t.includes(e.name)&&(!best||e.name.length>=best.n.length))best={n:e.name,kind:'obj',root:e.name}}
 if(best)return best;
 const m=t.match(/(cube|sphere|cyl|torus|bottle|model)\s*(\d+)/);
 if(m){const nm=m[1]+' '+m[2];if(es.find(e=>e.name===nm))return{n:nm,kind:'obj',root:nm}}
 if(/aakhri|last/.test(t)&&es.length)return{n:es[es.length-1].name,kind:'obj',root:es[es.length-1].name};
 return null}
function argsOf(t){const a={};
 for(const k in TYPES)if(t.includes(k)){a.type=TYPES[k];break}
 const dg=t.match(/(\d+)\s*(degree|digri)/);a.deg=dg?+dg[1]:45;
 for(const k in AX)if(t.includes(k)){a.axis=AX[k][0];a.dir=AX[k][1];break}
 if(/bada|scale up/.test(t))a.f=1.25;if(/chhota|small/.test(t))a.f=.8;
 if(/dugna|double/.test(t))a.f=2;if(/aadha|half/.test(t))a.f=.5;
 for(const k in COLORS)if(t.includes(k)){a.color=COLORS[k];break}
 return a}
const INTENTS=[
 {id:'labels',syn:['naam dikhao','parts ke naam','label on','label mode']},
 {id:'labeloff',syn:['label band','naam chhupao','label off']},
 {id:'clear',syn:['sab saaf','sab hatao','clear all']},
 {id:'copy',syn:['copy karo']},{id:'paste',syn:['paste karo']},
 {id:'make',syn:['banao','banado','lao','laao','add','naya','morph','badlo']},
 {id:'delete',syn:['hatao','delete','mita']},
 {id:'color',syn:['rang','laal','neela','hara','pila','color']},
 {id:'stretch',syn:['lamba','patla','mota','side badhao','stretch']},
 {id:'scale',syn:['bada','chhota','size','scale']},
 {id:'move',syn:['le jao','move','shift','upar','neeche','left','right','aage','piche','rakho']},
 {id:'rotate',syn:['ghumao','rotate','turn']},
 {id:'select',syn:['select','chuno','pakdo']}];
function exec(id,a,tg){const S3=api3();
 if(!S3){FX.toast('❌ 3D engine load nahi hua — reload karo');return{ok:false,ask:'3D engine load nahi hua — reload karo sir'}}
 const name=tg&&tg.kind==='obj'?tg.n:(tg&&tg.root)||undefined;
 const part=tg&&tg.kind==='part'?tg.n:null;
 const P=(op,ex)=>{try{return S3.exec(Object.assign({op,name},ex||{}))}catch(e){FX.toast('❌ 3D error: '+e.message);console.error('SCENE3D.exec fail:',e);return 0}};
 switch(id){
  case'labels':labelMode(true);return{ok:true,msg:'Labels on sir'};
  case'labeloff':labelMode(false);return{ok:true,msg:'Labels off sir'};
  case'clear':P('clear');return{ok:true,msg:'Sab saaf sir'};
  case'copy':window.PROJ.copy();return{ok:true,msg:'Copy ho gaya sir'};
  case'paste':window.PROJ.paste();return{ok:true,msg:'Paste ho gaya sir'};
  case'delete':if(part){S3.removePart(name,part);return{ok:true,msg:part+' hata diya sir'}}
   if(name||S3.count){P('del');return{ok:true,msg:(name||'object')+' hata diya sir'}}
   return{ok:false,ask:'Kaunsa object hatana hai sir?'};
  case'color':if(!a.color)return{ok:false,ask:'Kaunsa rang sir?'};
   if(part)S3.execPart('color',name,part,a);else P('color',{color:a.color});
   return{ok:true,msg:'Rang badla sir'};
  case'stretch':{const ax=a.axis||'x',f=a.f||1.3;
   if(part)S3.execPart('stretch',name,part,{axis:ax,f});else P('stretch',{axis:ax,f});
   return{ok:true,msg:'Stretch ho gaya sir'}};
  case'scale':{const f=a.f||1.25;if(part)S3.execPart('scale',name,part,{f});else P('scale',{f});
   return{ok:true,msg:'Size set sir'}};
  case'move':{const d={};if(a.axis)d[a.axis]=(a.dir||1)*.6;else d.y=.6;
   if(part)S3.execPart('move',name,part,d);else P('move',d);return{ok:true,msg:'Move kar diya sir'}};
  case'rotate':{if(part)S3.execPart('rot',name,part,{axis:a.axis||'y',deg:a.deg});
   else P('rot',{axis:a.axis||'y',deg:a.deg});return{ok:true,msg:'Ghumaa diya sir'}};
  case'select':if(name){P('sel',{name});return{ok:true,msg:name+' select sir'}}
   return{ok:false,ask:'Kis ko select karna hai sir?'};
  case'make':{if(!a.type)return{ok:false,ask:'Kya banana hai sir — cube, sphere, bottle?'};
   const morph=name||S3.selName;
   if(morph){P('morph',{type:a.type,name});return{ok:true,msg:morph+' → '+a.type+' sir'}}
   const res=P('add',{type:a.type});
   if(!res){FX.toast('❌ cube add fail — console dekho');return{ok:false,ask:'Cube add fail hua sir — reload karo'}}
   return{ok:true,msg:(S3.lastName||a.type)+' taiyaar sir'}};
 }
 return{ok:false,unknown:true}}
function route(text){const t=(text||'').toLowerCase();
 for(const it of INTENTS){if(it.syn.some(s=>t.includes(s))){
  const a=argsOf(t);const tg=findTarget(t);return exec(it.id,a,tg)}}
 return{ok:false,unknown:true}}
function labelMode(on){S.labelOn=on;const L=document.getElementById('labels');
 if(L)L.style.display=on?'block':'none';
 if(!on)for(const k in labels){labels[k].remove();delete labels[k]}}
function tickLabels(project){if(!S.labelOn)return;const L=document.getElementById('labels');if(!L)return;
 const seen={};
 for(const e of entities()){const items=[{n:e.name,p:e.obj.position}];
  for(const pt of e.parts){const w=pt.obj.getWorldPosition(new THREE.Vector3());items.push({n:pt.name,p:w})}
  for(const it of items){seen[it.n]=1;let d=labels[it.n];
   if(!d){d=document.createElement('div');d.className='lbl';d.textContent=it.n;L.appendChild(d);labels[it.n]=d}
   const s=project(it.p);
   if(s.z>1){d.style.display='none'}else{d.style.display='block';d.style.left=s.x+'px';d.style.top=s.y+'px'}}}
 for(const k in labels)if(!seen[k]){labels[k].remove();delete labels[k]}}
window.MES={S,route,exec,labelMode,tickLabels,findTarget,entities,say:()=>{},ui:{}};
})();
