/* studio3d.js v2 : 3D-native gestures (sirf manipulate) + voice-add + morph */
import*as THREE from'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
const cv3=document.getElementById('cv3');
const renderer=new THREE.WebGLRenderer({canvas:cv3,alpha:true,antialias:false,powerPreference:'low-power'});
renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));
const scene=new THREE.Scene(),cam=new THREE.PerspectiveCamera(55,1,.1,100);cam.position.set(0,0,6);
scene.add(new THREE.AmbientLight(0xffffff,.75));
const dl=new THREE.DirectionalLight(0x88eeff,.9);dl.position.set(2,3,4);scene.add(dl);
let objs=[],sel=null,oid=0,helper=null;
const ray=new THREE.Raycaster(),ndc=new THREE.Vector2(),PL=new THREE.Plane(new THREE.Vector3(0,0,1),0);
const resize=()=>{renderer.setSize(innerWidth,innerHeight,false);cam.aspect=innerWidth/innerHeight;cam.updateProjectionMatrix()};
addEventListener('resize',resize);resize();
const mat=h=>new THREE.MeshStandardMaterial({color:new THREE.Color(`hsl(${h},80%,55%)`),metalness:.3,roughness:.4,transparent:true,opacity:.92});
const geo=t=>t==='sphere'?new THREE.SphereGeometry(.6,20,14):t==='cyl'?new THREE.CylinderGeometry(.45,.45,1.1,18):t==='torus'?new THREE.TorusGeometry(.55,.2,12,24):new THREE.BoxGeometry(1,1,1);
const save=()=>localStorage.setItem('mes-scene',JSON.stringify(objs.map(m=>({t:m.userData.t,g:m.userData.g,p:m.position.toArray(),r:[m.rotation.x,m.rotation.y,m.rotation.z],s:m.scale.toArray(),h:m.userData.hue}))));
function addObj(t='cube',pos=null,hue=Math.random()*360){
 const m=new THREE.Mesh(geo(t),mat(hue));m.position.copy(pos||new THREE.Vector3((Math.random()-.5)*3,(Math.random()-.5)*1.5,0));
 m.userData={id:++oid,hue,t,g:t};scene.add(m);objs.push(m);save();return m}
function morph(m,t){if(!m||m.userData.t===t)return m;
 const g=['rect','sheet','tall'].includes(t)?'cube':t;
 if(m.userData.g!==g){const s=m.scale.clone(),r=m.rotation.clone(),p=m.position.clone(),h=m.userData.hue,id=m.userData.id,wasSel=sel===m;
  scene.remove(m);objs=objs.filter(o=>o!==m);
  m=new THREE.Mesh(geo(g),mat(h));m.position.copy(p);m.rotation.copy(r);m.scale.copy(s);
  m.userData={id,hue:h,t,g};scene.add(m);objs.push(m);if(wasSel)select(m)}
 const pre={rect:[2.6,1,1],sheet:[3,.08,2],tall:[1,2.6,1],cube:[1,1,1]}[t];if(pre)m.scale.set(...pre);
 m.userData.t=t;save();return m}
function select(m){sel=m;if(helper){scene.remove(helper);helper=null}
 if(m){helper=new THREE.BoxHelper(m,0xffff00);scene.add(helper)}}
const pick=pt=>{ndc.set(pt.x/innerWidth*2-1,-(pt.y/innerHeight*2-1));ray.setFromCamera(ndc,cam);return(ray.intersectObjects(objs)[0]||{}).object||null};
const planePt=(pt,z)=>{ndc.set(pt.x/innerWidth*2-1,-(pt.y/innerHeight*2-1));ray.setFromCamera(ndc,cam);PL.constant=-z;const v=new THREE.Vector3();return ray.ray.intersectPlane(PL,v)?v:null};
const palm=p=>({x:(p[0].x+p[5].x+p[9].x+p[13].x+p[17].x)/5,y:(p[0].y+p[5].y+p[9].y+p[13].y+p[17].y)/5});
const d2=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
function exec(c){const S=sel;switch(c.op){
 case'add':{const m=addObj(c.type||'cube');select(m);return m.userData.id}
 case'morph':return(morph(S||objs[objs.length-1],c.type)||{userData:{}}).userData.id||0;
 case'cycle':{const o=S||objs[objs.length-1];if(!o)return 0;
  const seq=['cube','rect','sheet','sphere'];morph(o,seq[(seq.indexOf(o.userData.t)+1)%4]);return 1}
 case'rot':if(S){S.rotation[c.axis||'y']+=(c.deg||45)*Math.PI/180;save()}return 1;
 case'scale':if(S){S.scale.multiplyScalar(THREE.MathUtils.clamp(c.f||1.2,.15,6));save()}return 1;
 case'stretch':if(S){S.scale[c.axis||'x']=THREE.MathUtils.clamp(S.scale[c.axis||'x']*(c.f||1.3),.05,8);save()}return 1;
 case'move':if(S){S.position.x+=c.x||0;S.position.y+=c.y||0;S.position.z+=c.z||0;save()}return 1;
 case'color':if(S){S.material.color.set(c.color);save()}return 1;
 case'del':if(S){scene.remove(S);objs=objs.filter(o=>o!==S);select(null);save()}return 1;
 case'clear':objs.forEach(m=>scene.remove(m));objs=[];select(null);save();return 1;
 case'dup':if(S){const c2=S.clone();c2.material=S.material.clone();c2.position.x+=1.2;
  c2.userData={...S.userData,id:++oid};scene.add(c2);objs.push(c2);save()}return 1;
 case'sel':select(objs[objs.length-1]||null);return 1;
 case'zoom':cam.position.z=THREE.MathUtils.clamp(cam.position.z+(c.d||-1),2,12);return 1;
 case'list':return objs.length}return 0}
window.SCENE3D={exec,addObj,morph,select,get count(){return objs.length}};
let holdT=0,fistT=0,prevG='',tapN=0,tapT=0,tapStart=0,grab=null,stretch=null,lastPalm=null;
const GST={};const stable=(i,g)=>{const s=GST[i]||(GST[i]={g:'',n:0});s.g===g?s.n++:(s.g=g,s.n=1);return s.n>=3};
let last=performance.now();
function loop(){requestAnimationFrame(loop);renderer.render(scene,cam);
 const now=performance.now(),dt=now-last;last=now;
 const{H,G}=FX.getHands();const g0=G[0]||'';
 if(!H||!H.length){holdT=0;fistT=0;grab=null;stretch=null;prevG='';return}
 if(g0==='POINT'&&stable(0,'POINT')){holdT+=dt;
  if(holdT>600){const hit=pick(H[0][8]);if(hit&&hit!==sel){select(hit);
   FX.toast('🎯 select — 🖐move • 🤏grab=ghuma+size • 🤲🤲stretch • 👉👉morph • ✊hold=delete')}}
 }else holdT=0;
 if(g0==='POINT'&&prevG!=='POINT')tapStart=now;
 if(g0!=='POINT'&&prevG==='POINT'){const dur=now-tapStart;
  if(dur<350){const hit=pick(H[0][8]||lastPalm||{x:0,y:0});
   if(now-tapT<900)tapN++;else tapN=1;tapT=now;
   if(tapN===2&&sel&&hit===sel){exec({op:'cycle'});FX.toast('🔁 morph: '+sel.userData.t);tapN=0}}
  else tapN=0}
 if(sel&&G.includes('PALM')&&!stretch){const hi=G.indexOf('PALM');
  const pl=planePt(palm(H[hi]),sel.position.z);if(pl)sel.position.lerp(pl,.35)}
 if(sel&&G.includes('PINCH')){const hi=G.indexOf('PINCH'),mid=H[hi][8],pd=d2(H[hi][4],H[hi][8]);
  if(pick(mid)===sel||grab){grab=grab||{pd,p:palm(H[hi])};const p=palm(H[hi]);
   sel.rotation.y+=(p.x-grab.p.x)*.006;sel.rotation.x+=(p.y-grab.p.y)*.006;
   if(grab.pd)sel.scale.multiplyScalar(THREE.MathUtils.clamp(pd/grab.pd,.92,1.08));
   grab={pd,p}}
 }else if(grab){save();grab=null}
 if(sel&&H.length===2&&G[0]==='PALM'&&G[1]==='PALM'){const a=palm(H[0]),b=palm(H[1]);
  const h=Math.max(40,Math.abs(a.x-b.x)),v=Math.max(30,Math.abs(a.y-b.y));
  stretch=stretch||{h,v,sx:sel.scale.x,sy:sel.scale.y};
  sel.scale.x=THREE.MathUtils.clamp(stretch.sx*(h/stretch.h),.05,8);
  sel.scale.y=THREE.MathUtils.clamp(stretch.sy*(v/stretch.v),.05,8);
 }else if(stretch){save();stretch=null}
 if(g0==='FIST'&&sel){fistT+=dt;
  if(fistT>800){scene.remove(sel);objs=objs.filter(o=>o!==sel);select(null);save();FX.toast('🗑 delete');fistT=0}
 }else if(g0==='FIST')fistT+=dt;
 if(g0!=='FIST'){if(prevG==='FIST'&&fistT<400&&sel){select(null);FX.toast('👌 deselect')}fistT=0}
 const hd=FX.getHead();
 if(hd==='NOD'&&sel){save();FX.toast('💾 save/pin')}
 if(hd==='SHAKE'&&sel){scene.remove(sel);objs=objs.filter(o=>o!==sel);select(null);save();FX.toast('🗑 shake-delete')}
 if(helper)helper.update();prevG=g0;lastPalm=H[0]?palm(H[0]):null}
try{const d=JSON.parse(localStorage.getItem('mes-scene')||'[]');
 d.forEach(o=>{const m=addObj(o.g||'cube',new THREE.Vector3(...o.p),o.h);
  m.rotation.set(...o.r);m.scale.set(...o.s);m.userData.t=o.t||o.g})}catch(e){}
loop();
