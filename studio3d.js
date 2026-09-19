/* studio3d.js v11 — stable bbox selection + smoothed gestures + undo + dbl-tap spawn */
import*as THREE from'three';
import{GLTFLoader}from'three/addons/loaders/GLTFLoader.js';
const cv3=document.getElementById('cv3');
const renderer=new THREE.WebGLRenderer({canvas:cv3,alpha:true,antialias:false,powerPreference:'low-power'});
renderer.setPixelRatio(1);
const scene=new THREE.Scene(),cam=new THREE.PerspectiveCamera(55,1,.1,100);cam.position.set(0,0,6);
scene.add(new THREE.AmbientLight(0xffffff,.75));
const dl=new THREE.DirectionalLight(0x88eeff,.9);dl.position.set(2,3,4);scene.add(dl);
const grid=new THREE.GridHelper(24,48,0x0f3f3f,0x0a2525);
grid.material.transparent=true;grid.material.opacity=.35;grid.position.y=-1.6;grid.visible=false;scene.add(grid);
let objs=[],sel=null,oid=0,helper=null,lastName='',selName='',counts={},hist=[];
let pin0=null,prevTip=null,rotE={x:0,y:0};
const ray=new THREE.Raycaster(),ndc=new THREE.Vector2(),PL=new THREE.Plane(new THREE.Vector3(0,0,1),0);
const V=new THREE.Vector3();
const resize=()=>{renderer.setSize(innerWidth,innerHeight,false);cam.aspect=innerWidth/innerHeight;cam.updateProjectionMatrix()};
addEventListener('resize',resize);resize();
const mat=h=>new THREE.MeshStandardMaterial({color:new THREE.Color(`hsl(${h},80%,55%)`),metalness:.3,roughness:.4,transparent:true,opacity:.92});
const geo=t=>t==='sphere'?new THREE.SphereGeometry(.6,20,14):t==='cyl'?new THREE.CylinderGeometry(.45,.45,1.1,18):t==='torus'?new THREE.TorusGeometry(.55,.2,12,24):new THREE.BoxGeometry(1,1,1);
const save=()=>{if(window.PROJ)window.PROJ.touch()};
const pushHist=()=>{hist.push(dump());if(hist.length>12)hist.shift()};
function nameFor(t){counts[t]=(counts[t]||0)+1;return t+' '+counts[t]}
function bottleGroup(h){const g=new THREE.Group();
 const body=new THREE.Mesh(new THREE.CylinderGeometry(.35,.35,1.1,16),mat(h));body.name='bottle_body';
 const neck=new THREE.Mesh(new THREE.CylinderGeometry(.15,.2,.3,12),mat(h));neck.position.y=.7;neck.name='bottle_neck';
 const cap=new THREE.Mesh(new THREE.CylinderGeometry(.17,.17,.15,12),mat((h+120)%360));cap.position.y=.92;cap.name='bottle_cap';
 g.add(body,neck,cap);return g}
function addObj(type,pos){try{const h=Math.random()*360;
 const o=type==='bottle'?bottleGroup(h):new THREE.Mesh(geo(type),mat(h));
 if(pos)o.position.copy(pos);else o.position.set((Math.random()-.5)*3,(Math.random()-.5)*1.5,0);
 o.userData={id:++oid,hue:h,t:type,g:type,mesName:nameFor(type)};
 lastName=o.userData.mesName;scene.add(o);objs.push(o);save();return o
}catch(e){console.error('addObj fail:',e);FX.toast('❌ addObj fail: '+e.message);return null}}
function importGLTF(file,cb){const url=URL.createObjectURL(file);
 new GLTFLoader().load(url,g=>{const root=g.scene;let i=0;
  root.traverse(n=>{if(n.isMesh){if(!n.name)n.name='part_'+(++i);
   if(!n.material.transparent){n.material.transparent=true;n.material.opacity=.95}}});
  root.position.set(0,0,0);root.userData={id:++oid,hue:0,t:'model',g:'model',mesName:nameFor('model')};
  lastName=root.userData.mesName;scene.add(root);objs.push(root);save();cb&&cb(root.userData.mesName)},
  undefined,e=>cb&&cb(null))}
const dumpOne=m=>({t:m.userData.t,g:m.userData.g,p:m.position.toArray(),
 r:[m.rotation.x,m.rotation.y,m.rotation.z],s:m.scale.toArray(),h:m.userData.hue,
 parts:m.children?m.children.filter(c=>c.name).map(c=>({name:c.name,p:c.position.toArray(),s:c.scale.toArray()})):[]});
const dump=()=>objs.map(dumpOne);
function addRaw(o){const h=o.h!=null?o.h:Math.random()*360;
 let m;if(o.parts&&o.parts.length){m=bottleGroup(h);
  o.parts.forEach(p=>{const c=m.children.find(c=>c.name===p.name);
   if(c){c.position.fromArray(p.p||[0,0,0]);c.scale.fromArray(p.s||[1,1,1])}});
 }else m=new THREE.Mesh(geo(o.g||'cube'),mat(h));
 m.position.fromArray(o.p||[0,0,0]);m.rotation.set(...(o.r||[0,0,0]));m.scale.fromArray(o.s||[1,1,1]);
 counts[o.t||o.g||'cube']=(counts[o.t||o.g||'cube']||0)+1;
 m.userData={id:++oid,hue:h,t:o.t||o.g||'cube',g:o.g||'cube',mesName:o.nm||nameFor(o.t||o.g||'cube')};
 scene.add(m);objs.push(m);return m}
function loadArr(arr){objs.slice().forEach(m=>scene.remove(m));objs=[];select(null);counts={};
 (arr||[]).forEach(o=>addRaw(o));save()}
function select(m){sel=m;selName=m?m.userData.mesName:'';pin0=null;prevTip=null;rotE={x:0,y:0};
 if(helper){scene.remove(helper);helper=null}
 if(m){helper=new THREE.BoxHelper(m,0xffff00);scene.add(helper)}}
/* stable screen-space bbox pick */
function pick(pt){let best=null,bd=1e9;
 for(const o of objs){const b=new THREE.Box3().setFromObject(o);
  const c=b.getCenter(new THREE.Vector3());
  const r=b.getSize(new THREE.Vector3()).length()*.5;
  const pc=project(c);const pr=project(c.clone().add(new THREE.Vector3(r,0,0)));
  const rad=Math.hypot(pr.x-pc.x,pr.y-pc.y)+20;
  const d=Math.hypot(pt.x-pc.x,pt.y-pc.y);
  if(d<rad&&d<bd){bd=d;best=o}}
 return best}
const planePt=(pt,z)=>{ndc.set(pt.x/innerWidth*2-1,-(pt.y/innerHeight)*2+1,0);ray.setFromCamera(ndc,cam);
 PL.constant=-z;const v=new THREE.Vector3();return ray.ray.intersectPlane(PL,v)?v:null};
const palm=p=>({x:(p[0].x+p[5].x+p[9].x+p[13].x+p[17].x)/5,y:(p[0].y+p[5].y+p[9].y+p[13].y+p[17].y)/5});
const d2=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
function morph(m,t){if(!m||m.userData.t===t)return m;
 if(m.children&&m.children.length){return m}
 pushHist();
 const g=['rect','sheet','tall'].includes(t)?'cube':t;
 if(m.userData.g!==g){const s=m.scale.clone(),r=m.rotation.clone(),p=m.position.clone(),
  h=m.userData.hue,id=m.userData.id,nm=m.userData.mesName,wasSel=sel===m;
  scene.remove(m);objs=objs.filter(o=>o!==m);
  m=new THREE.Mesh(geo(g),mat(h));m.position.copy(p);m.rotation.copy(r);m.scale.copy(s);
  m.userData={id,hue:h,t,g,mesName:nm};scene.add(m);objs.push(m);if(wasSel)select(m)}
 const pre={rect:[2.6,1,1],sheet:[3,.08,2],tall:[1,2.6,1],cube:[1,1,1]}[t];if(pre)m.scale.set(...pre);
 m.userData.t=t;save();return m}
function execPart(op,rootName,partName,a){const r=objs.find(o=>o.userData.mesName===rootName);if(!r)return 0;
 const c=r.children.find(c=>c.name===partName);if(!c)return 0;
 if(op==='rot')c.rotation[a.axis||'y']+=(a.deg||45)*Math.PI/180;
 if(op==='scale')c.scale.multiplyScalar(THREE.MathUtils.clamp(a.f||1.2,.05,6));
 if(op==='stretch')c.scale[a.axis||'x']=THREE.MathUtils.clamp(c.scale[a.axis||'x']*(a.f||1.3),.02,8);
 if(op==='move'){c.position.x+=a.x||0;c.position.y+=a.y||0;c.position.z+=a.z||0}
 if(op==='color')c.material.color.set(a.color);
 if(op==='del'){r.remove(c);save();return 1}
 save();return 1}
function removePart(rootName,partName){return execPart('del',rootName,partName,{})}
function setFocus(on){grid.visible=!!on}
function exec(c){try{if(c.name){const m=objs.find(o=>o.userData.mesName===c.name);if(m)select(m)}
 const S=sel;switch(c.op){
 case'undo':{const h=hist.pop();if(!h)return 0;loadArr(h);return 1}
 case'add':{pushHist();const m=addObj(c.type||'cube');if(m)select(m);return m?1:0}
 case'morph':return(morph(S||objs[objs.length-1],c.type)||{userData:{}}).userData?1:0;
 case'rot':if(S){S.rotation[c.axis||'y']+=(c.deg||45)*Math.PI/180;save()}return 1;
 case'scale':if(S){S.scale.multiplyScalar(THREE.MathUtils.clamp(c.f||1.2,.05,6));save()}return 1;
 case'stretch':if(S){S.scale[c.axis||'x']=THREE.MathUtils.clamp(S.scale[c.axis||'x']*(c.f||1.3),.02,8);save()}return 1;
 case'move':if(S){S.position.x+=c.x||0;S.position.y+=c.y||0;S.position.z+=c.z||0;save()}return 1;
 case'color':if(S){S.traverse(n=>{if(n.isMesh)n.material.color.set(c.color)});save()}return 1;
 case'del':if(S){pushHist();scene.remove(S);objs=objs.filter(o=>o!==S);select(null);save()}return 1;
 case'clear':if(objs.length)pushHist();objs.forEach(m=>scene.remove(m));objs=[];select(null);counts={};save();return 1;
 case'dup':if(S){pushHist();const c2=S.clone(true);c2.position.x+=1.2;
  c2.userData={...S.userData,id:++oid,mesName:nameFor(S.userData.t)};scene.add(c2);objs.push(c2);save()}return 1;
 case'sel':select(objs[objs.length-1]||null);return 1;
 case'zoom':cam.position.z=THREE.MathUtils.clamp(cam.position.z+(c.d||-1),2,12);return 1;
 case'list':return objs.length}return 0
}catch(e){console.error('SCENE3D.exec fail:',e);FX.toast('❌ exec fail: '+e.message);return 0}}
function entities(){return objs.map(o=>({name:o.userData.mesName,obj:o,
 parts:o.children.filter(c=>c.name).map(c=>({name:c.name,obj:c}))}))}
function project(p){V.copy(p).project(cam);return{x:(V.x*.5+.5)*innerWidth,y:(-V.y*.5+.5)*innerHeight,z:V.z}}
window.SCENE3D={exec,execPart,removePart,addObj,morph,select,dump,load:loadArr,importGLTF,entities,project,setFocus,
 selected:()=>sel?dumpOne(sel):null,get count(){return objs.length},get lastName(){return lastName},get selName(){return selName}};
if(window.MES&&MES.S.focus)grid.visible=true;
let holdT=0,fistT=0,prevG='',tapN=0,tapT=0,tapStart=0;
const GST={};const stable=(i,g)=>{const s=GST[i]||(GST[i]={g:'',n:0});s.g===g?s.n++:(s.g=g,s.n=1);return s.n>=3};
let last=performance.now();
function loop(){requestAnimationFrame(loop);renderer.render(scene,cam);
 if(window.MES&&MES.S.labelOn)MES.tickLabels(project);
 const now=performance.now(),dt=now-last;last=now;
 const{H,G}=FX.getHands();const g0=G[0]||'';
 if(prevG!==g0&&sel)save();
 if(!H||!H.length){holdT=0;fistT=0;pin0=null;prevTip=null;prevG='';return}
 if(g0==='POINT'&&stable(0,'POINT')){holdT+=dt;
  if(holdT>600&&!sel){const hit=pick(H[0][8]);if(hit){select(hit);FX.toast('🎯 '+hit.userData.mesName+' select — hold+drag=rotate')}}
 }else if(g0!=='POINT')holdT=0;
 if(g0==='POINT'&&prevG!=='POINT')tapStart=now;
 if(g0!=='POINT'&&prevG==='POINT'){const dur=now-tapStart;
  if(dur<350){const tp=H[0][8];const hit=pick(tp);
   if(now-tapT<900)tapN++;else tapN=1;tapT=now;
   if(tapN===2){tapN=0;
    if(hit&&sel===hit)morph(sel,['cube','rect','sheet','sphere'][(['cube','rect','sheet','sphere'].indexOf(sel.userData.t)+1)%4]);
    else if(hit)select(hit);
    else{const pl=planePt(tp,0);if(pl){const m=addObj('cube',pl);FX.toast('🧊 cube spawn (double-tap)')}}}}
  else tapN=0}
 if(sel){
  if(g0==='PINCH'){const pd=d2(H[0][4],H[0][8]);
   if(!pin0)pin0={pd,sc:sel.scale.x};
   const target=THREE.MathUtils.clamp(pin0.sc*(pd/pin0.pd),.05,8);
   sel.scale.setScalar(sel.scale.x+(target-sel.scale.x)*.5);
  }else pin0=null;
  if(g0==='PALM'){const pl=planePt(palm(H[0]),sel.position.z);if(pl)sel.position.lerp(pl,.25)}
  if(g0==='POINT'&&holdT>600){const tip=H[0][8];
   if(prevTip){let dx=tip.x-prevTip.x,dy=tip.y-prevTip.y;
    if(Math.abs(dx)>3){rotE.y=rotE.y*.6+dx*.005*.4;sel.rotation.y+=rotE.y}
    if(Math.abs(dy)>3){rotE.x=rotE.x*.6+dy*.005*.4;sel.rotation.x+=rotE.x}}
   prevTip={x:tip.x,y:tip.y};
  }else if(g0!=='POINT')prevTip=null;
 }else{pin0=null;prevTip=null}
 if(g0==='FIST'&&sel){fistT+=dt;
  if(fistT>800){pushHist();scene.remove(sel);objs=objs.filter(o=>o!==sel);select(null);save();FX.toast('🗑 delete (↩ undo available)');fistT=0}
 }else if(g0==='FIST')fistT+=dt;
 if(g0!=='FIST'){if(prevG==='FIST'&&fistT<400&&sel){select(null);FX.toast('👌 deselect')}fistT=0}
 const hd=FX.getHead();
 if(hd==='NOD'&&sel){save();FX.toast('💾 save/pin')}
 if(hd==='SHAKE'&&sel){pushHist();scene.remove(sel);objs=objs.filter(o=>o!==sel);select(null);save();FX.toast('🗑 shake-delete (↩ undo)')}
 if(helper)helper.update();prevG=g0}
loop();
window.S3D_OK=true;
